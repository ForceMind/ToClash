import { parseDocument } from 'yaml'
import {
  ConversionError,
  type ConversionIssue,
  type ConversionResult,
  type ProxyNode,
} from '../model/proxy'
import { convertLinks } from '../parser'
import {
  DIRECT_MODE_PRESET_ADDITIONS,
  RULE_PRESETS,
} from '../rules/presets'
import {
  CGNAT_RULE,
  LOCAL_DOMAINS,
  LOCAL_IP_RULES,
} from '../rules/defaults'
import { buildRulePlan } from '../rules/plan'
import type {
  CustomRouting,
  PresetId,
  RuleSection,
} from '../rules/types'
import {
  buildPolicyGroups,
  RESERVED_PROXY_NAMES,
} from '../transformer/mihomo'
import { parseRoutingTarget } from '../utils/domain'
import { normalizeDnsServer } from '../utils/intranet'

const MAX_YAML_CHARS = 1_000_000
const LOCAL_SUFFIXES = new Set(['localhost', 'local', 'lan', 'home.arpa'])
const CATALOG_POLICIES = new Set(['FORCE_PROXY', 'PROXY', 'REJECT'])

export interface ImportedMihomoConfig {
  /** Parsed YAML stays in memory only; it is never sent to LocalStorage. */
  config: Record<string, unknown>
  proxies: Record<string, unknown>[]
  proxyNames: string[]
  managedRuleKeys: string[]
}

export interface RecoveredRouting {
  mode: 'standard' | 'direct'
  presets: Record<PresetId, boolean>
  directDomains: string[]
  proxyDomains: string[]
  intranetEnabled: boolean
  intranetSuffixInput: string
  intranetDnsInput: string
  bypassCgnat: boolean
}

export interface SourceConversionResult {
  source: 'links' | 'yaml'
  nodes: ProxyNode[]
  errors: ConversionIssue[]
  warnings: ConversionIssue[]
  total: number
  success: number
  failed: number
  imported?: ImportedMihomoConfig
  recoveredRouting?: RecoveredRouting
}

export interface MergedMihomoConfig {
  config: Record<string, unknown>
  sections: RuleSection[]
}

interface ParsedRule {
  type: string
  value: string
  policy: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringArray(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
    ? value as string[]
    : null
}

function parseRule(value: string): ParsedRule | null {
  const parts = value.split(',').map((entry) => entry.trim())
  if (parts[0] === 'MATCH' && parts.length >= 2 && parts[1]) {
    return { type: 'MATCH', value: '', policy: parts[1] }
  }
  if (parts.length < 3 || !parts[0] || !parts[1] || !parts[2]) return null
  return { type: parts[0], value: parts[1], policy: parts[2] }
}

function ruleKey(rule: ParsedRule): string {
  return `${rule.type},${rule.value},${rule.policy}`
}

function ruleKeyFromText(value: string): string | null {
  const parsed = parseRule(value)
  return parsed?.type === 'MATCH' ? null : parsed ? ruleKey(parsed) : null
}

function isDomainRule(rule: ParsedRule): boolean {
  return rule.type === 'DOMAIN' || rule.type === 'DOMAIN-SUFFIX'
}

function targetFromRule(rule: ParsedRule): string | null {
  if (isDomainRule(rule)) {
    const target = parseRoutingTarget(rule.value)
    return target?.kind === 'domain' ? target.value : null
  }
  if (rule.type === 'IP-CIDR' && rule.value.endsWith('/32')) {
    const target = parseRoutingTarget(rule.value.slice(0, -3))
    return target?.kind === 'ipv4' ? target.value : null
  }
  if (rule.type === 'IP-CIDR6' && rule.value.endsWith('/128')) {
    const target = parseRoutingTarget(rule.value.slice(0, -4))
    return target?.kind === 'ipv6' ? target.value : null
  }
  return null
}

function targetRuleKey(target: string, policy: string): string | null {
  const parsed = parseRoutingTarget(target)
  if (!parsed) return null
  if (parsed.kind === 'domain') return `DOMAIN-SUFFIX,${parsed.value},${policy}`
  if (parsed.kind === 'ipv4') return `IP-CIDR,${parsed.value}/32,${policy}`
  return `IP-CIDR6,${parsed.value}/128,${policy}`
}

function orderedUnique(values: string[]): string[] {
  return [...new Set(values)]
}

function allCatalogMatchKeys(): Set<string> {
  const keys = new Set<string>()
  for (const preset of RULE_PRESETS) {
    const additions = DIRECT_MODE_PRESET_ADDITIONS[preset.id] ?? []
    for (const match of [...preset.rules, ...additions]) {
      keys.add(`${match.type},${match.value}`)
    }
  }
  return keys
}

function isLocalRule(rule: ParsedRule): boolean {
  if (rule.policy !== 'DIRECT') return false
  if (LOCAL_IP_RULES.some((entry) => ruleKeyFromText(entry) === ruleKey(rule))) {
    return true
  }
  return LOCAL_DOMAINS.some(
    (entry) => entry.type === rule.type && entry.value === rule.value,
  )
}

function directSuffixesWithResolvers(
  rules: ParsedRule[],
  config: Record<string, unknown>,
): { suffixes: string[]; resolvers: string[] | null } {
  const dns = isRecord(config.dns) ? config.dns : {}
  const policy = isRecord(dns['nameserver-policy'])
    ? dns['nameserver-policy']
    : {}
  const zones: Array<{ suffix: string; resolvers: string[] }> = []

  for (const rule of rules) {
    if (
      rule.type !== 'DOMAIN-SUFFIX' ||
      rule.policy !== 'DIRECT' ||
      LOCAL_SUFFIXES.has(rule.value)
    )
      continue
    const values = stringArray(policy[`+.${rule.value}`])
    if (!values?.length) continue
    const resolvers: string[] = []
    for (const value of values) {
      if (value === 'system') {
        resolvers.push(value)
        continue
      }
      const normalized = normalizeDnsServer(value)
      if (!normalized) {
        resolvers.length = 0
        break
      }
      resolvers.push(normalized)
    }
    if (resolvers.length) zones.push({ suffix: rule.value, resolvers })
  }

  const suffixes = orderedUnique(zones.map(({ suffix }) => suffix))
  if (!zones.length) return { suffixes, resolvers: null }
  const first = JSON.stringify(zones[0]?.resolvers)
  if (zones.some(({ resolvers }) => JSON.stringify(resolvers) !== first)) {
    return { suffixes, resolvers: null }
  }
  return { suffixes, resolvers: zones[0]?.resolvers ?? null }
}

function recoverRouting(
  config: Record<string, unknown>,
): { routing: RecoveredRouting; warnings: ConversionIssue[]; intranetSuffixes: string[] } {
  const rules = (stringArray(config.rules) ?? [])
    .map(parseRule)
    .filter((rule): rule is ParsedRule => rule !== null)
  const mode = rules.some(
    (rule) => rule.type === 'MATCH' && rule.policy === 'DIRECT',
  )
    ? 'direct'
    : 'standard'
  const catalog = allCatalogMatchKeys()
  const presets = Object.fromEntries(
    RULE_PRESETS.map((preset) => {
      const matches = [
        ...preset.rules,
        ...(DIRECT_MODE_PRESET_ADDITIONS[preset.id] ?? []),
      ]
      const enabled = matches.some((match) =>
        rules.some(
          (rule) =>
            rule.type === match.type &&
            rule.value === match.value &&
            (rule.policy === 'FORCE_PROXY' || rule.policy === 'PROXY'),
        ),
      )
      return [preset.id, enabled]
    }),
  ) as Record<PresetId, boolean>
  const intranet = directSuffixesWithResolvers(rules, config)
  const intranetSuffixes = new Set(intranet.suffixes)
  const directDomains: string[] = []
  const proxyDomains: string[] = []

  for (const rule of rules) {
    const target = targetFromRule(rule)
    if (!target || isLocalRule(rule) || intranetSuffixes.has(target)) continue
    const catalogKey = `${rule.type},${rule.value}`
    if (catalog.has(catalogKey)) continue
    if (rule.policy === 'DIRECT') directDomains.push(target)
    if (rule.policy === 'FORCE_PROXY') proxyDomains.push(target)
  }

  const warnings: ConversionIssue[] = []
  const resolvers = intranet.resolvers ?? []
  const intranetCanUseForm =
    intranet.suffixes.length > 0 &&
    resolvers.length > 0 &&
    (mode === 'direct' || !resolvers.includes('system'))
  if (intranet.suffixes.length && !intranetCanUseForm) {
    warnings.push({
      line: 1,
      code: 'UNSUPPORTED_CONFIG',
      message:
        'Imported intranet resolver settings cannot be represented by this form.',
    })
  }
  return {
    routing: {
      mode,
      presets,
      directDomains: orderedUnique(directDomains),
      proxyDomains: orderedUnique(proxyDomains),
      intranetEnabled: intranetCanUseForm,
      intranetSuffixInput: intranet.suffixes.join('\n'),
      intranetDnsInput:
        intranetCanUseForm && resolvers.length === 1 && resolvers[0] === 'system'
          ? ''
          : intranetCanUseForm
            ? resolvers.join('\n')
            : '',
      bypassCgnat: rules.some(
        (rule) => ruleKey(rule) === ruleKeyFromText(CGNAT_RULE),
      ),
    },
    warnings,
    intranetSuffixes: intranet.suffixes,
  }
}

function managedRuleKeys(
  routing: RecoveredRouting,
  intranetSuffixes: string[],
): string[] {
  const keys = new Set<string>()
  for (const value of LOCAL_IP_RULES) {
    const key = ruleKeyFromText(value)
    if (key) keys.add(key)
  }
  for (const local of LOCAL_DOMAINS) {
    keys.add(`${local.type},${local.value},DIRECT`)
  }
  const cgnat = ruleKeyFromText(CGNAT_RULE)
  if (cgnat) keys.add(cgnat)
  for (const catalog of allCatalogMatchKeys()) {
    for (const policy of CATALOG_POLICIES) keys.add(`${catalog},${policy}`)
  }
  for (const target of routing.directDomains) {
    const key = targetRuleKey(target, 'DIRECT')
    if (key) keys.add(key)
  }
  for (const target of routing.proxyDomains) {
    const force = targetRuleKey(target, 'FORCE_PROXY')
    const reject = targetRuleKey(target, 'REJECT')
    if (force) keys.add(force)
    if (reject) keys.add(reject)
  }
  if (routing.intranetEnabled) {
    for (const suffix of intranetSuffixes) {
      keys.add(`DOMAIN-SUFFIX,${suffix},DIRECT`)
    }
  }
  return [...keys]
}

function yamlFailure(code: ConversionIssue['code']): SourceConversionResult {
  return {
    source: 'yaml',
    nodes: [],
    errors: [
      {
        line: 1,
        code,
        message:
          code === 'INVALID_YAML'
            ? 'Unable to parse the YAML configuration.'
            : 'The YAML configuration is missing a usable proxy list.',
      },
    ],
    warnings: [],
    total: 0,
    success: 0,
    failed: 1,
  }
}

function importMihomoYaml(input: string): SourceConversionResult {
  if (input.length > MAX_YAML_CHARS) return yamlFailure('INVALID_CONFIG')
  let config: unknown
  try {
    const document = parseDocument(input, {
      strict: true,
      uniqueKeys: true,
    })
    if (document.errors.length) return yamlFailure('INVALID_YAML')
    config = document.toJS({ maxAliasCount: 100 })
  } catch {
    return yamlFailure('INVALID_YAML')
  }
  if (!isRecord(config)) return yamlFailure('INVALID_CONFIG')
  const rawProxies = config.proxies
  if (!Array.isArray(rawProxies) || !rawProxies.length) return yamlFailure('INVALID_CONFIG')
  const proxies: Record<string, unknown>[] = []
  const names = new Set<string>()
  for (const proxy of rawProxies) {
    if (!isRecord(proxy) || typeof proxy.name !== 'string' || !proxy.name.trim()) {
      return yamlFailure('INVALID_CONFIG')
    }
    if (typeof proxy.type !== 'string' || !proxy.type.trim()) {
      return yamlFailure('INVALID_CONFIG')
    }
    if (names.has(proxy.name) || RESERVED_PROXY_NAMES.includes(proxy.name as never)) {
      return yamlFailure('INVALID_CONFIG')
    }
    names.add(proxy.name)
    proxies.push(proxy)
  }

  const recovered = recoverRouting(config)
  return {
    source: 'yaml',
    nodes: [],
    errors: [],
    warnings: recovered.warnings,
    total: proxies.length,
    success: proxies.length,
    failed: 0,
    imported: {
      config,
      proxies,
      proxyNames: [...names],
      managedRuleKeys: managedRuleKeys(
        recovered.routing,
        recovered.intranetSuffixes,
      ),
    },
    recoveredRouting: recovered.routing,
  }
}

function looksLikeYaml(input: string): boolean {
  const first = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(
      (line) =>
        line &&
        !line.startsWith('#') &&
        !line.startsWith('%') &&
        line !== '---' &&
        line !== '...',
    )
  return Boolean(first && /^[A-Za-z][A-Za-z0-9_-]*\s*:(?!\/\/)/u.test(first))
}

/** Convert either the established proxy-link input or a full Mihomo YAML profile. */
export function convertInput(input: string): SourceConversionResult {
  if (looksLikeYaml(input)) return importMihomoYaml(input)
  const converted: ConversionResult = convertLinks(input)
  return { source: 'links', ...converted }
}

function mergeDns(
  original: unknown,
  generated: Record<string, unknown>,
): Record<string, unknown> {
  const base = isRecord(original) ? original : {}
  const result: Record<string, unknown> = { ...base, ...generated }
  const originalFilter = stringArray(base['fake-ip-filter']) ?? []
  const generatedFilter = stringArray(generated['fake-ip-filter']) ?? []
  result['fake-ip-filter'] = orderedUnique([
    ...originalFilter,
    ...generatedFilter,
  ])
  for (const key of [
    'nameserver-policy',
    'proxy-server-nameserver-policy',
  ]) {
    const before = isRecord(base[key]) ? base[key] : {}
    const updates = isRecord(generated[key]) ? generated[key] : {}
    result[key] = { ...before, ...updates }
  }
  return result
}

function preservedGroups(
  original: unknown,
  ownedNames: Set<string>,
): Record<string, unknown>[] {
  if (!Array.isArray(original)) return []
  return original.filter(
    (group): group is Record<string, unknown> =>
      isRecord(group) &&
      !(typeof group.name === 'string' && ownedNames.has(group.name)),
  )
}

function preserveRules(
  original: unknown,
  managedKeys: Set<string>,
  generated: Set<string>,
): string[] {
  const rules = stringArray(original) ?? []
  return rules.filter((value) => {
    const parsed = parseRule(value)
    if (parsed?.type === 'MATCH') return false
    const key = parsed ? ruleKey(parsed) : null
    return !((key && managedKeys.has(key)) || generated.has(value))
  })
}

/**
 * Merge an imported profile with the portions owned by ToClash. Unknown
 * top-level and DNS fields survive. ToClash service, local, custom and final
 * fallback rules are replaced so the form remains the source of truth.
 */
export function mergeImportedMihomoConfig(
  imported: ImportedMihomoConfig,
  full: boolean,
  routing: CustomRouting = {},
): MergedMihomoConfig {
  if (!full) return { config: { proxies: imported.proxies }, sections: [] }
  if (!imported.proxyNames.length) {
    throw new ConversionError(
      'MISSING_FIELD',
      'An imported configuration requires at least one proxy node.',
    )
  }
  const groups = buildPolicyGroups(imported.proxyNames, routing)
  const ownedNames = new Set(groups.map(({ name }) => name))
  const plan = buildRulePlan(routing)
  const fallback = plan.sections.find(({ id }) => id === 'fallback')
  const generatedSections = plan.sections.filter(({ id }) => id !== 'fallback')
  const generatedRules = new Set(
    generatedSections.flatMap(({ rules }) => rules),
  )
  const preserved = preserveRules(
    imported.config.rules,
    new Set(imported.managedRuleKeys),
    generatedRules,
  )
  const sections: RuleSection[] = [
    ...generatedSections,
    ...(preserved.length
      ? [
          {
            id: 'preserved-imported',
            comment: '保留的原配置规则：位于 ToClash 规则之后、最终 MATCH 之前',
            rules: preserved,
          },
        ]
      : []),
    ...(fallback ? [fallback] : []),
  ]
  const dns = mergeDns(imported.config.dns, plan.dns)
  return {
    config: {
      ...imported.config,
      // Generated DNS and routing rules need Mihomo's rule mode to take effect.
      mode: 'rule',
      proxies: imported.proxies,
      'proxy-groups': [
        ...preservedGroups(imported.config['proxy-groups'], ownedNames),
        ...groups,
      ],
      dns,
      rules: sections.flatMap(({ rules }) => rules),
    },
    sections,
  }
}
