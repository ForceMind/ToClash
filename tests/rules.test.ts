import { describe, expect, it } from 'vitest'
import { ConversionError } from '../src/core/model/proxy'
import { DIRECT_DNS, LOCAL_DNS, LOCAL_IP_RULES, proxyDns } from '../src/core/rules/defaults'
import { buildRulePlan } from '../src/core/rules/plan'
import { RULE_PRESETS } from '../src/core/rules/presets'
import type { CustomRouting, PresetId, RulePlan } from '../src/core/rules/types'

const rulesOf = (plan: RulePlan) => plan.sections.flatMap(({ rules }) => rules)
const policyOf = (plan: RulePlan) => plan.dns['nameserver-policy'] as Record<string, string[]>
const noPresets: Record<PresetId, boolean> = { openai: false, claude: false, developer: false, google: false }

describe('service rule presets', () => {
  it.each(Array.from({ length: 16 }, (_, mask) => mask))('supports every preset combination (mask %s)', (mask) => {
    const presets = Object.fromEntries(RULE_PRESETS.map(({ id }, index) => [id, (mask & (1 << index)) !== 0]))
    const plan = buildRulePlan({ presets })
    const rules = rulesOf(plan)
    for (const [index, preset] of RULE_PRESETS.entries()) {
      const enabled = (mask & (1 << index)) !== 0
      const strict = preset.id === 'openai' || preset.id === 'claude'
      for (const { type, value } of preset.rules) {
        const match = `${type},${value},${strict ? 'FORCE_PROXY' : 'PROXY'}`
        expect(rules.includes(match)).toBe(enabled)
        expect(policyOf(plan)[type === 'DOMAIN' ? value : `+.${value}`]).toEqual(enabled ? proxyDns(strict ? 'FORCE_PROXY' : 'PROXY') : undefined)
      }
    }
    expect(rules.slice(-3)).toEqual(['GEOSITE,CN,DIRECT', 'GEOIP,CN,DIRECT', 'MATCH,PROXY'])
    expect(Object.keys(policyOf(plan)).slice(-2)).toEqual(['geosite:cn', 'geosite:geolocation-!cn'])
    expect(new Set(rules).size).toBe(rules.length)
  })

  it('enables all presets by default and uses exact matching for shared service domains', () => {
    const rules = rulesOf(buildRulePlan())
    expect(rules).toEqual(expect.arrayContaining([
      'DOMAIN-SUFFIX,oaistatsig.com,FORCE_PROXY', 'DOMAIN-SUFFIX,workos.com,FORCE_PROXY',
      'DOMAIN,workos.imgix.net,FORCE_PROXY', 'DOMAIN,challenges.cloudflare.com,FORCE_PROXY',
      'DOMAIN-SUFFIX,claude.com,FORCE_PROXY', 'DOMAIN-SUFFIX,anthropic-static.com,FORCE_PROXY',
      'DOMAIN-SUFFIX,githubassets.com,PROXY', 'DOMAIN-SUFFIX,googlevideo.com,PROXY',
    ]))
    expect(rules).not.toContain('DOMAIN-SUFFIX,cloudflare.com,FORCE_PROXY')
    expect(rules).not.toContain('DOMAIN-SUFFIX,imgix.net,FORCE_PROXY')
  })

  it('closes UDP-incompatible strict proxy matches with an immediately adjacent rejection', () => {
    const rules = rulesOf(buildRulePlan({ proxyDomains: ['video.example', '203.0.113.1', '2001:db8::1'] }))
    for (const [index, value] of rules.entries()) {
      if (value.includes(',FORCE_PROXY')) expect(rules[index + 1]).toBe(value.replace(',FORCE_PROXY', ',REJECT'))
    }
    expect(rules).not.toContain('DOMAIN-SUFFIX,github.com,REJECT')
  })
})

describe('routing and DNS precedence', () => {
  it('keeps every explicit DNS domain in one block before the GeoSite fallbacks', () => {
    const plan = buildRulePlan({ directDomains: ['baidu.com'], proxyDomains: ['example.com'], intranet: [{ suffix: 'corp.example', nameservers: ['10.0.0.53'] }] })
    const keys = Object.keys(policyOf(plan))
    expect(keys.slice(-2)).toEqual(['geosite:cn', 'geosite:geolocation-!cn'])
    expect(keys.slice(0, -2).every((key) => !key.startsWith('geosite:'))).toBe(true)
    expect(keys.slice(0, -2)).toEqual(expect.arrayContaining(['+.localhost', '+.corp.example', '+.baidu.com', '+.example.com', '+.openai.com', 'challenges.cloudflare.com']))
  })

  it('removes a proxy child covered by a direct parent, including its proxy DNS', () => {
    const plan = buildRulePlan({ directDomains: ['example.com'], proxyDomains: ['api.example.com', 'example.com'], presets: noPresets })
    expect(rulesOf(plan)).toContain('DOMAIN-SUFFIX,example.com,DIRECT')
    expect(rulesOf(plan).filter((rule) => rule.includes('FORCE_PROXY'))).toEqual([])
    expect(policyOf(plan)['+.example.com']).toEqual(DIRECT_DNS)
    expect(policyOf(plan)['+.api.example.com']).toBeUndefined()
    expect(plan.warnings).toEqual([{ code: 'DIRECT_OVERRIDE', count: 2 }])
  })

  it('preserves direct children within proxy parents, and observes suffix boundaries', () => {
    const plan = buildRulePlan({ directDomains: ['bank.example.com'], proxyDomains: ['example.com', 'notbank.example.com'], presets: noPresets })
    const rules = rulesOf(plan)
    expect(rules.indexOf('DOMAIN-SUFFIX,bank.example.com,DIRECT')).toBeLessThan(rules.indexOf('DOMAIN-SUFFIX,example.com,FORCE_PROXY'))
    expect(policyOf(plan)['+.bank.example.com']).toEqual(DIRECT_DNS)
    expect(policyOf(plan)['+.example.com']).toEqual(proxyDns('FORCE_PROXY'))
    expect(policyOf(plan)['+.notbank.example.com']).toBeUndefined()
    const distinct = buildRulePlan({ directDomains: ['example.com'], proxyDomains: ['notexample.com'], presets: noPresets })
    expect(distinct.warnings).toEqual([])
    expect(rulesOf(distinct)).toContain('DOMAIN-SUFFIX,notexample.com,FORCE_PROXY')
  })

  it('custom direct overrides built-in service rules without dropping subdomain exceptions', () => {
    const parent = buildRulePlan({ directDomains: ['openai.com', 'workos.imgix.net'] })
    expect(rulesOf(parent)).not.toContain('DOMAIN-SUFFIX,openai.com,FORCE_PROXY')
    expect(policyOf(parent)['+.openai.com']).toEqual(DIRECT_DNS)
    expect(policyOf(parent)['workos.imgix.net']).toBeUndefined()
    const child = buildRulePlan({ directDomains: ['api.openai.com'] })
    expect(policyOf(child)['+.api.openai.com']).toEqual(DIRECT_DNS)
    expect(policyOf(child)['+.openai.com']).toEqual(proxyDns('FORCE_PROXY'))
    expect(child.warnings).toContainEqual({ code: 'DIRECT_OVERRIDE', count: 1 })
  })

  it('honors user proxy settings before service preset DNS', () => {
    const plan = buildRulePlan({ proxyDomains: ['github.com', 'googleapis.com'] })
    expect(policyOf(plan)['+.github.com']).toEqual(proxyDns('FORCE_PROXY'))
    expect(rulesOf(plan)).not.toContain('DOMAIN-SUFFIX,github.com,PROXY')
    expect(rulesOf(plan).filter((value) => value === 'DOMAIN-SUFFIX,github.com,FORCE_PROXY')).toHaveLength(1)
  })

  it('normalizes targets, removes duplicates, and emits IP rules instead of domain suffixes', () => {
    const input: CustomRouting = { directDomains: ['https://Example.COM./path', 'example.com', '203.0.113.7'], proxyDomains: ['https://例子.测试', '2001:db8::1'], presets: noPresets }
    const snapshot = JSON.stringify(input)
    const plan = buildRulePlan(input)
    expect(rulesOf(plan)).toEqual(expect.arrayContaining([
      'DOMAIN-SUFFIX,example.com,DIRECT', 'DOMAIN-SUFFIX,xn--fsqu00a.xn--0zwm56d,FORCE_PROXY',
      'IP-CIDR,203.0.113.7/32,DIRECT,no-resolve', 'IP-CIDR6,2001:db8::1/128,FORCE_PROXY,no-resolve',
    ]))
    expect(Object.keys(policyOf(plan)).some((key) => key.includes('203.0.113.7') || key.includes('2001:db8'))).toBe(false)
    expect(plan.dns['fake-ip-filter']).not.toContain('+.example.com')
    expect(JSON.stringify(input)).toBe(snapshot)
    expect(buildRulePlan(input)).toEqual(plan)
  })

  it.each(['example.com,DIRECT', 'example.com\nMATCH,DIRECT', 'https://user:secret@example.com', 'bad domain', '300.1.1.1'])('rejects malformed custom routing without echoing its value: %s', (value) => {
    expect(() => buildRulePlan({ directDomains: [value] })).toThrow(ConversionError)
    try { buildRulePlan({ proxyDomains: [value] }) } catch (error) {
      expect((error as Error).message).not.toContain(value)
    }
  })
})

describe('local and intranet routing', () => {
  it('uses only local and intranet policies for node-hostname bootstrap, never business routes or proxy DNS', () => {
    const plan = buildRulePlan({ directDomains: ['bank.example'], proxyDomains: ['service.example'], intranet: [{ suffix: 'corp.example', nameservers: ['10.0.0.53'] }, { suffix: 'lab.corp.example', nameservers: ['10.0.0.54'] }] })
    const bootstrap = plan.dns['proxy-server-nameserver-policy'] as Record<string, string[]>
    expect(bootstrap).toEqual({
      '+.localhost': [...LOCAL_DNS], '+.local': [...LOCAL_DNS], '+.lan': [...LOCAL_DNS], '+.home.arpa': [...LOCAL_DNS],
      '+.lab.corp.example': ['udp://10.0.0.54:53'], '+.corp.example': ['udp://10.0.0.53:53'],
    })
    expect(Object.keys(bootstrap).some((key) => key.startsWith('geosite:'))).toBe(false)
    expect(Object.values(bootstrap).flat().some((resolver) => resolver.includes('#'))).toBe(false)
    expect(plan.dns['proxy-server-nameserver']).toEqual(DIRECT_DNS)
    expect(policyOf(plan)['+.bank.example']).toEqual(DIRECT_DNS)
    expect(policyOf(plan)['+.service.example']).toEqual(proxyDns('FORCE_PROXY'))
  })

  it('applies identical explicit intranet overrides to both DNS paths, without mutable sharing', () => {
    const routing = { intranet: [{ suffix: 'arpa', nameservers: ['10.0.0.52'] }, { suffix: 'home.arpa', nameservers: ['10.0.0.53'] }, { suffix: 'lab.home.arpa', nameservers: ['10.0.0.54'] }, { suffix: 'corp.local', nameservers: ['10.0.0.55'] }] }
    const plan = buildRulePlan(routing)
    const business = policyOf(plan)
    const bootstrap = plan.dns['proxy-server-nameserver-policy'] as Record<string, string[]>
    expect(bootstrap).toBeDefined()
    expect(bootstrap).not.toBe(business)
    expect(bootstrap['+.home.arpa']).toEqual(['udp://10.0.0.53:53'])
    expect(bootstrap['+.lab.home.arpa']).toEqual(['udp://10.0.0.54:53'])
    expect(bootstrap['+.local']).toEqual(LOCAL_DNS)
    expect(bootstrap['+.corp.local']).toEqual(['udp://10.0.0.55:53'])
    for (const [key, servers] of Object.entries(bootstrap)) {
      expect(servers).toEqual(business[key])
      expect(servers).not.toBe(business[key])
    }
    const originalBootstrap = JSON.stringify(bootstrap)
    business['+.home.arpa']!.push('udp://10.0.0.99:53')
    expect(JSON.stringify(bootstrap)).toBe(originalBootstrap)
    bootstrap['+.corp.local']!.push('udp://10.0.0.98:53')
    expect(business['+.corp.local']).toEqual(['udp://10.0.0.55:53'])
    expect(buildRulePlan(routing).dns['proxy-server-nameserver-policy']).toEqual(JSON.parse(originalBootstrap))
  })

  it('always isolates reserved local node hostnames even with no intranet configured', () => {
    const plan = buildRulePlan({ directDomains: ['openai.com'], proxyDomains: ['example.com'] })
    expect(plan.dns['proxy-server-nameserver-policy']).toEqual({
      '+.localhost': [...LOCAL_DNS], '+.local': [...LOCAL_DNS], '+.lan': [...LOCAL_DNS], '+.home.arpa': [...LOCAL_DNS],
    })
  })

  it('keeps local ranges first, never routes fake-IP ranges directly, and defaults CGNAT off', () => {
    const plan = buildRulePlan()
    expect(plan.sections[0]?.id).toBe('local')
    expect(rulesOf(plan)).toEqual(expect.arrayContaining([...LOCAL_IP_RULES, 'DOMAIN-SUFFIX,localhost,DIRECT', 'DOMAIN-SUFFIX,home.arpa,DIRECT']))
    expect(rulesOf(plan).some((rule) => rule.includes('100.64.0.0') || rule.includes('198.18.0.0'))).toBe(false)
    expect(rulesOf(buildRulePlan({ bypassCgnat: true }))).toContain('IP-CIDR,100.64.0.0/10,DIRECT,no-resolve')
    for (const key of ['+.localhost', '+.local', '+.lan', '+.home.arpa']) expect(policyOf(plan)[key]).toEqual(LOCAL_DNS)
    expect(plan.dns['use-system-hosts']).toBe(true)
  })

  it('cannot override local domains or IP ranges with a must-proxy entry', () => {
    const localTargets = ['localhost', 'api.localhost', 'api.local', 'router.lan', 'server.home.arpa', '127.0.0.2', '10.4.5.6', '172.20.0.1', '192.168.1.2', '169.254.2.3', '::1', 'fc00::1', 'fd12::1', 'fe80::1', 'febf::1']
    const plan = buildRulePlan({ proxyDomains: localTargets, directDomains: ['router.lan'], presets: noPresets })
    expect(rulesOf(plan).some((rule) => rule.includes('FORCE_PROXY'))).toBe(false)
    expect(policyOf(plan)['+.router.lan']).toBeUndefined()
    expect(plan.warnings).toContainEqual({ code: 'LOCAL_OVERRIDE', count: localTargets.length })
    const optional = buildRulePlan({ proxyDomains: ['100.64.0.1'], bypassCgnat: true, presets: noPresets })
    expect(rulesOf(optional)).not.toContain('IP-CIDR,100.64.0.1/32,FORCE_PROXY,no-resolve')
    const disabled = buildRulePlan({ proxyDomains: ['100.64.0.1'], presets: noPresets })
    expect(rulesOf(disabled)).toContain('IP-CIDR,100.64.0.1/32,FORCE_PROXY,no-resolve')
  })

  it('creates DNS, fake-IP exclusion and DIRECT together for each explicitly configured intranet', () => {
    const plan = buildRulePlan({ intranet: [{ suffix: 'corp.example', nameservers: ['10.0.0.53', '10.0.0.53', '[fd00::53]:5353'] }], directDomains: ['api.corp.example'], proxyDomains: ['static.corp.example'], presets: noPresets })
    expect(rulesOf(plan)).toContain('DOMAIN-SUFFIX,corp.example,DIRECT')
    expect(rulesOf(plan)).not.toContain('DOMAIN-SUFFIX,static.corp.example,FORCE_PROXY')
    expect(policyOf(plan)['+.corp.example']).toEqual(['udp://10.0.0.53:53', 'udp://[fd00::53]:5353'])
    expect(policyOf(plan)['+.api.corp.example']).toBeUndefined()
    expect(policyOf(plan)['+.static.corp.example']).toBeUndefined()
    expect(plan.dns['fake-ip-filter']).toContain('+.corp.example')
    expect(plan.warnings).toContainEqual({ code: 'INTRANET_OVERRIDE', count: 2 })
  })

  it('preserves the more specific intranet resolver under a direct/proxy parent', () => {
    const plan = buildRulePlan({ intranet: [{ suffix: 'corp.example', nameservers: ['10.0.0.53'] }, { suffix: 'lab.corp.example', nameservers: ['10.0.0.54'] }], directDomains: ['example'], proxyDomains: ['corp.example'], presets: noPresets })
    expect(policyOf(plan)['+.example']).toEqual(DIRECT_DNS)
    expect(policyOf(plan)['+.corp.example']).toEqual(['udp://10.0.0.53:53'])
    expect(policyOf(plan)['+.lab.corp.example']).toEqual(['udp://10.0.0.54:53'])
    expect(rulesOf(plan).indexOf('DOMAIN-SUFFIX,lab.corp.example,DIRECT')).toBeLessThan(rulesOf(plan).indexOf('DOMAIN-SUFFIX,corp.example,DIRECT'))
  })

  it('allows explicit intranet DNS to replace local refusal but not ordinary routing entries', () => {
    const plan = buildRulePlan({ intranet: [{ suffix: 'local', nameservers: ['10.0.0.53'] }, { suffix: 'localhost', nameservers: ['10.0.0.54'] }], directDomains: ['api.local'], proxyDomains: ['local'], presets: noPresets })
    expect(policyOf(plan)['+.local']).toEqual(['udp://10.0.0.53:53'])
    expect(policyOf(plan)['+.localhost']).toEqual(['udp://10.0.0.54:53'])
    expect(policyOf(plan)['+.api.local']).toBeUndefined()
    expect(rulesOf(plan).filter((rule) => rule === 'DOMAIN-SUFFIX,local,DIRECT')).toHaveLength(1)
    const specific = buildRulePlan({ intranet: [{ suffix: 'corp.local', nameservers: ['10.0.0.53'] }] })
    expect(policyOf(specific)['+.local']).toEqual(LOCAL_DNS)
    expect(policyOf(specific)['+.corp.local']).toEqual(['udp://10.0.0.53:53'])
  })

  it('warns when a broad proxy suffix contains a reserved local suffix', () => {
    const plan = buildRulePlan({ proxyDomains: ['arpa'], presets: noPresets })
    expect(plan.warnings).toContainEqual({ code: 'LOCAL_OVERRIDE', count: 1 })
    expect(policyOf(plan)['+.arpa']).toEqual(proxyDns('FORCE_PROXY'))
    expect(policyOf(plan)['+.home.arpa']).toEqual(LOCAL_DNS)
  })

  it('deduplicates identical intranet definitions but rejects inconsistent DNS for the same suffix', () => {
    const zone = { suffix: 'corp.example', nameservers: ['10.0.0.53'] }
    expect(rulesOf(buildRulePlan({ intranet: [zone, zone] })).filter((rule) => rule === 'DOMAIN-SUFFIX,corp.example,DIRECT')).toHaveLength(1)
    expect(() => buildRulePlan({ intranet: [zone, { ...zone, nameservers: ['10.0.0.54'] }] })).toThrow('conflicting DNS')
  })

  it.each([
    { suffix: 'corp.example', nameservers: [] },
    { suffix: '10.0.0.1', nameservers: ['10.0.0.53'] },
    { suffix: 'bad,domain', nameservers: ['10.0.0.53'] },
    { suffix: 'corp.example', nameservers: ['https://secret@dns.example/query'] },
  ])('rejects invalid intranet settings in the core API', (zone) => {
    expect(() => buildRulePlan({ intranet: [zone] })).toThrow(ConversionError)
  })
})
