import { ConversionError } from '../model/proxy'
import { parseRoutingTarget } from '../utils/domain'
import { normalizeDnsServer } from '../utils/intranet'
import { CGNAT_RULE, DIRECT_DNS, LOCAL_DNS, LOCAL_DOMAINS, LOCAL_IP_RULES, proxyDns, SYSTEM_DNS } from './defaults'
import { DEFAULT_PRESETS, DIRECT_MODE_PRESET_ADDITIONS, RULE_PRESETS } from './presets'
import type { CustomRouting, DomainRule, IntranetZone, RulePlan, RuleSection, RoutingWarning } from './types'

type Target = NonNullable<ReturnType<typeof parseRoutingTarget>>
type Match = DomainRule | { type: 'IP-CIDR' | 'IP-CIDR6'; value: string }
type Policy = 'DIRECT' | 'PROXY' | 'FORCE_PROXY'
interface PlannedMatch { match: Match; policy: Policy; dns: readonly string[] }

function parseTargets(values: string[]): Target[] {
  const targets = new Map<string, Target>()
  for (const value of values) {
    const target = parseRoutingTarget(value)
    if (!target) throw new ConversionError('INVALID_URI', 'A custom routing target is invalid.')
    targets.set(`${target.kind}:${target.value}`, target)
  }
  return [...targets.values()]
}

function targetMatch(target: Target): Match {
  if (target.kind === 'domain') return { type: 'DOMAIN-SUFFIX', value: target.value }
  return { type: target.kind === 'ipv4' ? 'IP-CIDR' : 'IP-CIDR6', value: `${target.value}/${target.kind === 'ipv4' ? 32 : 128}` }
}

function isDomain(match: Match): match is DomainRule {
  return match.type === 'DOMAIN' || match.type === 'DOMAIN-SUFFIX'
}

function covers(parent: Match, child: Match): boolean {
  if (!isDomain(parent) || !isDomain(child)) return parent.type === child.type && parent.value === child.value
  if (parent.type === 'DOMAIN') return child.type === 'DOMAIN' && parent.value === child.value
  return child.value === parent.value || child.value.endsWith(`.${parent.value}`)
}

function overlaps(left: Match, right: Match): boolean {
  return covers(left, right) || covers(right, left)
}

function rule(match: Match, policy: string): string {
  return `${match.type},${match.value},${policy}${isDomain(match) ? '' : ',no-resolve'}`
}

function dnsKey(match: DomainRule): string {
  return match.type === 'DOMAIN' ? match.value : `+.${match.value}`
}

function isLocalTarget(target: Target, bypassCgnat: boolean): boolean {
  if (target.kind === 'domain') return LOCAL_DOMAINS.some((local) => covers(local, targetMatch(target))) || target.value === 'localhost'
  if (target.kind === 'ipv4') {
    const [a = -1, b = -1] = target.value.split('.').map(Number)
    return a === 127 || a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254) || (bypassCgnat && a === 100 && b >= 64 && b <= 127)
  }
  const first = Number.parseInt(target.value.split(':')[0] || '0', 16)
  return target.value === '::1' || (first & 0xfe00) === 0xfc00 || (first & 0xffc0) === 0xfe80
}

function normalizeZones(values: IntranetZone[]): IntranetZone[] {
  const zones = new Map<string, IntranetZone>()
  for (const zone of values) {
    const target = parseRoutingTarget(zone.suffix)
    if (!target || target.kind !== 'domain' || !zone.nameservers.length) throw new ConversionError('INVALID_URI', 'An intranet domain or DNS server is invalid.')
    const nameservers: string[] = []
    for (const value of zone.nameservers) {
      // `system` is the literal Mihomo resolver. It is intentionally accepted
      // only here, after routing input has already been structurally validated.
      const server = value === 'system' ? 'system' : normalizeDnsServer(value)
      if (!server) throw new ConversionError('INVALID_URI', 'An intranet DNS server is invalid.')
      if (!nameservers.includes(server)) nameservers.push(server)
    }
    const previous = zones.get(target.value)
    if (previous && JSON.stringify(previous.nameservers) !== JSON.stringify(nameservers)) throw new ConversionError('INVALID_URI', 'The same intranet domain has conflicting DNS servers.')
    zones.set(target.value, { suffix: target.value, nameservers })
  }
  // More specific zones win independently of the order entered by the user.
  return [...zones.values()].sort((a, b) => b.suffix.split('.').length - a.suffix.split('.').length || a.suffix.localeCompare(b.suffix, 'en'))
}

/** Pure rule/DNS planning: traffic order and DNS suffix precedence share one model. */
export function buildRulePlan(routing: CustomRouting = {}): RulePlan {
  const directMode = routing.mode === 'direct'
  const directResolvers = directMode ? SYSTEM_DNS : DIRECT_DNS
  const direct = parseTargets(routing.directDomains ?? [])
  const proxy = parseTargets(routing.proxyDomains ?? [])
  const zones = normalizeZones(routing.intranet ?? [])
  const intranetMatches: DomainRule[] = zones.map(({ suffix }) => ({ type: 'DOMAIN-SUFFIX', value: suffix }))
  const directMatches = direct.map(targetMatch)
  const warningCounts = new Map<RoutingWarning['code'], Set<string>>()
  const warn = (code: RoutingWarning['code'], match: Match) => {
    if (!warningCounts.has(code)) warningCounts.set(code, new Set())
    warningCounts.get(code)!.add(`${match.type}:${match.value}`)
  }
  const sections: RuleSection[] = [{
    id: 'local', comment: '本机 / 局域网优先直连；不会触发额外 DNS 查询',
    rules: [...LOCAL_DOMAINS.map((match) => rule(match, 'DIRECT')), ...LOCAL_IP_RULES, ...(routing.bypassCgnat ? [CGNAT_RULE] : [])],
  }]
  const planned: PlannedMatch[] = []
  const policy: Record<string, readonly string[]> = {}
  for (const local of LOCAL_DOMAINS) policy[dnsKey(local)] = [...(directMode ? SYSTEM_DNS : LOCAL_DNS)]
  // Explicit intranet resolvers take precedence over the safe local refusal policy.
  for (const zone of zones) policy[`+.${zone.suffix}`] = [...zone.nameservers]
  for (const local of LOCAL_DOMAINS) {
    const zone = zones.find(({ suffix }) => covers({ type: 'DOMAIN-SUFFIX', value: suffix }, local))
    if (zone) policy[dnsKey(local)] = [...zone.nameservers]
  }
  // Node-hostname lookup must use the same local/intranet resolution, but never
  // business/proxied DNS policies: resolving a proxy through itself would loop.
  // Clone each resolver list so the two public config objects share no arrays.
  const bootstrapPolicy = Object.fromEntries(Object.entries(policy).map(([key, servers]) => [key, [...servers]]))

  const addSection = (id: string, comment: string, matches: Match[], destination: Policy, resolvers: readonly string[]) => {
    const rules: string[] = []
    for (const match of matches) {
      // Earlier complete coverage makes later rules unreachable. Preserve earlier
      // child policies when adding a broader suffix: DNS uses longest matching.
      if (planned.some((earlier) => covers(earlier.match, match))) continue
      planned.push({ match, policy: destination, dns: resolvers })
      rules.push(rule(match, destination))
      // Mihomo skips UDP-incompatible nodes; the next identical matcher closes
      // that path rather than allowing a later GEOIP / MATCH rule to go DIRECT.
      if (destination === 'FORCE_PROXY') rules.push(rule(match, 'REJECT'))
    }
    if (rules.length) sections.push({ id, comment, rules })
  }

  for (const zone of zones) addSection(`intranet:${zone.suffix}`, '内网域名直连，使用指定内网 DNS，并排除 fake-IP', [{ type: 'DOMAIN-SUFFIX', value: zone.suffix }], 'DIRECT', zone.nameservers)
  const effectiveDirect = direct.filter((target) => {
    const match = targetMatch(target)
    if (isLocalTarget(target, routing.bypassCgnat === true)) { warn('LOCAL_OVERRIDE', match); return false }
    if (intranetMatches.some((zone) => overlaps(zone, match))) warn('INTRANET_OVERRIDE', match)
    return true
  })
  addSection('custom-direct', '用户始终直连：优先于用户代理及服务预设', effectiveDirect.map(targetMatch), 'DIRECT', directResolvers)

  const effectiveProxy = (match: Match, target?: Target): boolean => {
    if ((target && isLocalTarget(target, routing.bypassCgnat === true)) || LOCAL_DOMAINS.some((local) => covers(local, match))) {
      warn('LOCAL_OVERRIDE', match)
      return false
    }
    const localConflict = LOCAL_DOMAINS.some((local) => overlaps(local, match))
    if (localConflict) warn('LOCAL_OVERRIDE', match)
    if (intranetMatches.some((zone) => overlaps(zone, match))) warn('INTRANET_OVERRIDE', match)
    if (directMatches.some((directMatch) => overlaps(directMatch, match))) warn('DIRECT_OVERRIDE', match)
    return !intranetMatches.some((zone) => covers(zone, match)) && !directMatches.some((directMatch) => covers(directMatch, match))
  }
  addSection('custom-proxy', '用户必须代理：仅代理节点；不支持的流量拒绝，不降级直连', proxy.filter((target) => effectiveProxy(targetMatch(target), target)).map(targetMatch), 'FORCE_PROXY', proxyDns('FORCE_PROXY'))
  for (const preset of RULE_PRESETS) {
    if ((routing.presets?.[preset.id] ?? DEFAULT_PRESETS[preset.id]) === false) continue
    // Legacy GitHub and Google / YouTube keep their selectable PROXY group in
    // standard mode. Every other catalog service uses the fixed proxy group.
    const strict = directMode || (preset.id !== 'developer' && preset.id !== 'google')
    const destination = strict ? 'FORCE_PROXY' : 'PROXY'
    const presetRules = directMode ? [...preset.rules, ...(DIRECT_MODE_PRESET_ADDITIONS[preset.id] ?? [])] : preset.rules
    addSection(preset.id, `${preset.nameZh}：${strict ? '必须代理；失败不降级直连' : '使用 PROXY 组（可手动选 DIRECT）'}`, presetRules.filter((match) => effectiveProxy(match)), destination, proxyDns(destination))
  }
  for (const entry of planned) {
    if (!isDomain(entry.match)) continue
    const local = LOCAL_DOMAINS.some((localMatch) => covers(localMatch, entry.match))
    const intranet = intranetMatches.some((zone) => covers(zone, entry.match))
    if (local && !intranet) continue
    const key = dnsKey(entry.match)
    // The first rule for an identical domain owns its DNS policy as well.
    if (!(key in policy)) policy[key] = [...entry.dns]
  }
  // Mihomo evaluates DNS policy blocks in order. Keep explicit domains in one
  // continuous block ahead of GeoSite, whose broad categories are fallbacks.
  if (directMode) {
    sections.push({ id: 'fallback', comment: '其余流量使用当前网络直连', rules: ['MATCH,DIRECT'] })
  } else {
    policy['geosite:cn'] = [...DIRECT_DNS]
    policy['geosite:geolocation-!cn'] = proxyDns('PROXY')
    sections.push({ id: 'mainland', comment: '中国大陆域名 / IP 直连（需要客户端 GeoSite / GeoIP 数据）', rules: ['GEOSITE,CN,DIRECT', 'GEOIP,CN,DIRECT'] })
    sections.push({ id: 'fallback', comment: '其余流量交给 PROXY；关闭预设不等于直连', rules: ['MATCH,PROXY'] })
  }
  const seen = new Set<string>()
  for (const section of sections) section.rules = section.rules.filter((value) => { if (seen.has(value)) return false; seen.add(value); return true })

  return {
    sections: sections.filter(({ rules }) => rules.length > 0),
    dns: {
      enable: true,
      ipv6: false,
      'enhanced-mode': 'fake-ip',
      'fake-ip-range': '198.18.0.1/16',
      'fake-ip-filter': [...new Set(['+.localhost', '+.lan', '+.local', '+.home.arpa', 'localhost.ptlogin2.qq.com', '+.stun.*.*', '+.stun.*.*.*', ...zones.map(({ suffix }) => `+.${suffix}`)])],
      'use-hosts': true,
      'use-system-hosts': true,
      'default-nameserver': ['223.5.5.5', '119.29.29.29'],
      nameserver: [...directResolvers],
      'proxy-server-nameserver': [...directResolvers],
      'proxy-server-nameserver-policy': bootstrapPolicy,
      'direct-nameserver': [...directResolvers],
      // Direct mode must follow explicit intranet policies; otherwise a custom
      // corporate resolver would be silently replaced by `system`.
      'direct-nameserver-follow-policy': true,
      'nameserver-policy': policy,
    },
    warnings: [...warningCounts].map(([code, entries]) => ({ code, count: entries.size })),
  }
}
