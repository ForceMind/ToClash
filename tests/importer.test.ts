import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { convertInput } from '../src/core/importer/mihomo'
import { parseLink } from '../src/core/parser'
import { RULE_PRESETS } from '../src/core/rules/presets'
import { serializeMihomo } from '../src/core/serializer/yaml'
import { parseIntranetConfig } from '../src/core/utils/intranet'

const profile = `mixed-port: 7890
allow-lan: false
mode: rule
log-level: info
ipv6: false
tun:
  enable: true
  stack: system
proxies:
  - name: preserved-xhttp
    type: vless
    server: edge.example.test
    port: 443
    uuid: 00000000-0000-4000-8000-000000000000
    encryption: none
    udp: true
    tls: true
    alpn:
      - h2
      - http/1.1
    client-fingerprint: chrome
    network: xhttp
    xhttp-opts:
      path: /
      mode: auto
      x-padding-bytes: 100-1000
proxy-groups:
  - name: Existing group
    type: select
    proxies:
      - preserved-xhttp
dns:
  enable: true
  fallback-filter:
    geoip: true
  fake-ip-filter:
    - +.preserved.example
  nameserver-policy:
    +.corp.example:
      - udp://192.0.2.53:53
    +.preserved.example:
      - system
rules:
  - DOMAIN-SUFFIX,corp.example,DIRECT
  - DOMAIN-SUFFIX,bovada.lv,FORCE_PROXY
  - DOMAIN-SUFFIX,bovada.lv,REJECT
  - DOMAIN-SUFFIX,openai.com,FORCE_PROXY
  - DOMAIN-SUFFIX,openai.com,REJECT
  - DOMAIN-KEYWORD,keep,DIRECT
  - MATCH,DIRECT
`

describe('Mihomo YAML import', () => {
  it('round-trips a complete default-direct profile with XHTTP, services and intranet DNS', () => {
    const node = parseLink(
      'vless://00000000-0000-4000-8000-000000000000@edge.example.test:443?encryption=none&security=tls&type=xhttp&path=%2F&mode=auto&x-padding-bytes=100-1000#XHTTP',
    ).node
    const presets = Object.fromEntries(
      RULE_PRESETS.map(({ id }) => [id, true]),
    )
    const existing = serializeMihomo([node], 'full', {
      mode: 'direct',
      presets,
      proxyDomains: ['bovada.lv'],
      intranet: [
        { suffix: 'svc.cluster.local', nameservers: ['192.0.2.53'] },
        { suffix: 'corp.example', nameservers: ['192.0.2.53'] },
      ],
    })
    const imported = convertInput(existing)
    expect(imported.recoveredRouting).toMatchObject({
      mode: 'direct',
      proxyDomains: ['bovada.lv'],
      intranetEnabled: true,
      intranetSuffixInput: 'svc.cluster.local\ncorp.example',
      intranetDnsInput: 'udp://192.0.2.53:53',
    })
    expect(imported.imported?.proxies[0]).toMatchObject({
      network: 'xhttp',
      'xhttp-opts': {
        path: '/',
        mode: 'auto',
        'x-padding-bytes': '100-1000',
      },
    })
    for (const preset of RULE_PRESETS) {
      expect(imported.recoveredRouting?.presets[preset.id]).toBe(true)
    }
  })

  it('keeps raw XHTTP nodes and unowned configuration while rebuilding ToClash routing', () => {
    const result = convertInput(`%YAML 1.2\n---\n${profile}`)
    expect(result).toMatchObject({
      source: 'yaml',
      total: 1,
      success: 1,
      failed: 0,
    })
    expect(result.imported?.proxies[0]).toMatchObject({
      name: 'preserved-xhttp',
      network: 'xhttp',
      'xhttp-opts': {
        path: '/',
        mode: 'auto',
        'x-padding-bytes': '100-1000',
      },
    })
    expect(result.recoveredRouting).toMatchObject({
      mode: 'direct',
      proxyDomains: ['bovada.lv'],
      intranetEnabled: true,
      intranetSuffixInput: 'corp.example',
      intranetDnsInput: 'udp://192.0.2.53:53',
      bypassCgnat: false,
    })
    expect(result.recoveredRouting?.presets.openai).toBe(true)
    expect(result.recoveredRouting?.presets.claude).toBe(false)

    const recovered = result.recoveredRouting!
    const intranet = parseIntranetConfig(
      recovered.intranetSuffixInput,
      recovered.intranetDnsInput,
      recovered.mode === 'direct',
    )
    const output = serializeMihomo(
      result.nodes,
      'full',
      {
        mode: recovered.mode,
        presets: recovered.presets,
        directDomains: recovered.directDomains,
        proxyDomains: recovered.proxyDomains,
        intranet: intranet.zones,
        bypassCgnat: recovered.bypassCgnat,
      },
      result.imported,
    )
    const config = parse(output) as Record<string, unknown>
    expect(config.tun).toEqual({ enable: true, stack: 'system' })
    expect(config.proxies).toEqual([
      expect.objectContaining({
        name: 'preserved-xhttp',
        network: 'xhttp',
        'xhttp-opts': expect.objectContaining({
          'x-padding-bytes': '100-1000',
        }),
      }),
    ])
    expect(config['proxy-groups']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Existing group' }),
        expect.objectContaining({
          name: 'FORCE_PROXY',
          proxies: ['preserved-xhttp'],
        }),
      ]),
    )
    const dns = config.dns as Record<string, unknown>
    expect(dns['fallback-filter']).toEqual({ geoip: true })
    expect(dns['fake-ip-filter']).toEqual(
      expect.arrayContaining(['+.preserved.example', '+.corp.example']),
    )
    expect(dns['nameserver-policy']).toEqual(
      expect.objectContaining({
        '+.preserved.example': ['system'],
        '+.corp.example': ['udp://192.0.2.53:53'],
        '+.openai.com': [
          'https://1.1.1.1/dns-query#FORCE_PROXY',
          'https://8.8.8.8/dns-query#FORCE_PROXY',
        ],
      }),
    )
    const rules = config.rules as string[]
    expect(rules).toContain('DOMAIN-SUFFIX,bovada.lv,FORCE_PROXY')
    expect(rules).toContain('DOMAIN-SUFFIX,bovada.lv,REJECT')
    expect(rules).toContain('DOMAIN-SUFFIX,openai.com,FORCE_PROXY')
    expect(rules).toContain('DOMAIN-KEYWORD,keep,DIRECT')
    expect(rules.filter((rule) => rule.startsWith('MATCH,'))).toEqual([
      'MATCH,DIRECT',
    ])
    expect(rules.at(-1)).toBe('MATCH,DIRECT')
    expect(rules.indexOf('DOMAIN-KEYWORD,keep,DIRECT')).toBeLessThan(
      rules.indexOf('MATCH,DIRECT'),
    )
  })

  it('reports malformed YAML and profiles without usable proxy nodes', () => {
    expect(convertInput('proxies: [')).toMatchObject({
      source: 'yaml',
      failed: 1,
      errors: [{ code: 'INVALID_YAML' }],
    })
    expect(convertInput('mixed-port: 7890\nrules: []')).toMatchObject({
      source: 'yaml',
      failed: 1,
      errors: [{ code: 'INVALID_CONFIG' }],
    })
  })

  it('does not collapse imported intranet zones that use different resolvers', () => {
    const source = `proxies:
  - name: node
    type: vless
    server: edge.example.test
    port: 443
    uuid: 00000000-0000-4000-8000-000000000000
rules:
  - DOMAIN-SUFFIX,one.corp.example,DIRECT
  - DOMAIN-SUFFIX,two.corp.example,DIRECT
  - MATCH,DIRECT
dns:
  nameserver-policy:
    +.one.corp.example:
      - udp://192.0.2.53:53
    +.two.corp.example:
      - udp://192.0.2.54:53
`
    const result = convertInput(source)
    expect(result.recoveredRouting).toMatchObject({
      intranetEnabled: false,
      intranetSuffixInput: 'one.corp.example\ntwo.corp.example',
    })
    expect(result.warnings).toEqual([
      expect.objectContaining({ code: 'UNSUPPORTED_CONFIG' }),
    ])
    const output = serializeMihomo(
      result.nodes,
      'full',
      {
        mode: result.recoveredRouting!.mode,
        presets: result.recoveredRouting!.presets,
      },
      result.imported,
    )
    const config = parse(output) as Record<string, unknown>
    expect(config.rules).toEqual(
      expect.arrayContaining([
        'DOMAIN-SUFFIX,one.corp.example,DIRECT',
        'DOMAIN-SUFFIX,two.corp.example,DIRECT',
      ]),
    )
    expect(
      (config.dns as Record<string, unknown>)['nameserver-policy'],
    ).toEqual(
      expect.objectContaining({
        '+.one.corp.example': ['udp://192.0.2.53:53'],
        '+.two.corp.example': ['udp://192.0.2.54:53'],
      }),
    )
  })

  it('preserves a standard-mode system DNS zone instead of turning it into invalid form state', () => {
    const source = `mode: global
proxies:
  - name: node
    type: vless
    server: edge.example.test
    port: 443
    uuid: 00000000-0000-4000-8000-000000000000
rules:
  - DOMAIN-SUFFIX,corp.example,DIRECT
  - MATCH,PROXY
dns:
  nameserver-policy:
    +.corp.example:
      - system
`
    const result = convertInput(source)
    expect(result.recoveredRouting).toMatchObject({
      mode: 'standard',
      intranetEnabled: false,
      intranetSuffixInput: 'corp.example',
      intranetDnsInput: '',
    })
    expect(result.warnings).toEqual([
      expect.objectContaining({ code: 'UNSUPPORTED_CONFIG' }),
    ])
    const output = serializeMihomo(
      result.nodes,
      'full',
      { mode: 'standard', presets: result.recoveredRouting!.presets },
      result.imported,
    )
    const config = parse(output) as Record<string, unknown>
    expect(config.mode).toBe('rule')
    expect(config.rules).toContain('DOMAIN-SUFFIX,corp.example,DIRECT')
    expect(
      (config.dns as Record<string, unknown>)['nameserver-policy'],
    ).toEqual(expect.objectContaining({ '+.corp.example': ['system'] }))
  })

  it('keeps established proxy-link conversion as a separate input path', () => {
    expect(
      convertInput(
        'vless://00000000-0000-4000-8000-000000000000@example.com:443',
      ),
    ).toMatchObject({ source: 'links', success: 1, failed: 0 })
  })
})
