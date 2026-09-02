import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'
import type { ProxyNode } from '../src/core/model/proxy'
import { parseLink } from '../src/core/parser'
import { serializeMihomo } from '../src/core/serializer/yaml'
import { buildMihomoConfig, RESERVED_PROXY_NAMES, toMihomoProxy, validateGroupReferences, validateNode } from '../src/core/transformer/mihomo'

const uuid = '00000000-0000-4000-8000-000000000000'

describe('Mihomo output', () => {
  it('uses official transport and TLS key names in stable order', () => {
    const proxy = toMihomoProxy(parseLink(`vless://${uuid}@example.com:443?security=reality&type=ws&path=%2Fws&host=cdn.example&pbk=key&sid=id&fp=chrome`).node)
    expect(Object.keys(proxy).slice(0, 5)).toEqual(['name', 'type', 'server', 'port', 'uuid'])
    expect(proxy).toMatchObject({ tls: true, 'client-fingerprint': 'chrome', 'reality-opts': { 'public-key': 'key', 'short-id': 'id' }, 'ws-opts': { path: '/ws', headers: { Host: 'cdn.example' } } })
  })
  it('emits the official XHTTP padding field', () => {
    const proxy = toMihomoProxy(parseLink(`vless://${uuid}@example.com:443?type=xhttp&x_padding_bytes=100-1000`).node)
    expect(proxy['xhttp-opts']).toEqual({ 'x-padding-bytes': '100-1000' })
  })
  it('builds full policy groups, DNS and ordered routing rules', () => {
    const node = parseLink(`vless://${uuid}@example.com:443#Only`).node
    const config = buildMihomoConfig([node], true)
    expect(config['proxy-groups']).toEqual([{ name: 'PROXY', type: 'select', proxies: ['AUTO', 'DIRECT', 'Only'] }, { name: 'AUTO', type: 'url-test', proxies: ['Only'], url: 'https://www.gstatic.com/generate_204', interval: 300 }, { name: 'FORCE_PROXY', type: 'select', proxies: ['AUTO', 'Only'] }])
    expect(config.dns).toMatchObject({ enable: true, 'enhanced-mode': 'fake-ip', 'nameserver-policy': { 'geosite:geolocation-!cn': ['https://1.1.1.1/dns-query#PROXY', 'https://8.8.8.8/dns-query#PROXY'] } })
    expect(config.rules).toEqual(expect.arrayContaining(['IP-CIDR,192.168.0.0/16,DIRECT,no-resolve', 'DOMAIN-SUFFIX,openai.com,FORCE_PROXY', 'GEOSITE,CN,DIRECT', 'GEOIP,CN,DIRECT', 'MATCH,PROXY']))
    expect(serializeMihomo([node], 'proxies')).toContain('proxies:\n  - name: Only')
    const yaml = serializeMihomo([node], 'full')
    expect(yaml).toContain('# DNS：域名策略与分流保持一致')
    expect(yaml).toContain('# Codex / OpenAI：必须代理')
    expect(parse(yaml).rules.at(-1)).toBe('MATCH,PROXY')
  })
  it('validates required schema fields', () => expect(() => validateNode({ name: 'x', type: 'vless', server: 'x', port: 443 })).toThrow('UUID'))
  it.each<ProxyNode>([
    { name: '', type: 'http', server: 'example.com', port: 80 },
    { name: 'x', type: 'http', server: '', port: 80 },
    { name: 'x', type: 'http', server: 'example.com', port: 0 },
    { name: 'x', type: 'http', server: 'example.com', port: 65536 },
    { name: 'x', type: 'http', server: 'example.com', port: 80.5 },
    { name: 'x', type: 'vmess', server: 'example.com', port: 443 },
    { name: 'x', type: 'trojan', server: 'example.com', port: 443 },
    { name: 'x', type: 'ss', server: 'example.com', port: 443, password: 'example' },
  ])('rejects malformed normalized node %# before serialization', (node) => {
    expect(() => toMihomoProxy(node)).toThrow()
    expect(() => buildMihomoConfig([node], false)).toThrow()
  })

  it('preserves protocol credentials, defaults, false booleans and optional Mihomo fields', () => {
    const base = { name: 'Example', server: 'example.com', port: 443 }
    expect(toMihomoProxy({ ...base, type: 'vmess', uuid })).toMatchObject({ uuid, alterId: 0, cipher: 'auto' })
    expect(toMihomoProxy({ ...base, type: 'vmess', uuid, alterId: 1, cipher: 'aes-128-gcm' })).toMatchObject({ alterId: 1, cipher: 'aes-128-gcm' })
    const vless = toMihomoProxy({ ...base, type: 'vless', uuid, encryption: 'none', udp: false, tls: false, skipCertVerify: false, servername: 'cdn.example', alpn: ['h2'], clientFingerprint: 'chrome', flow: 'xtls-rprx-vision', packetEncoding: 'xudp', network: 'tcp', reality: { publicKey: 'example-key' } })
    expect(vless).toMatchObject({ encryption: 'none', udp: false, tls: false, 'skip-cert-verify': false, servername: 'cdn.example', alpn: ['h2'], 'client-fingerprint': 'chrome', flow: 'xtls-rprx-vision', 'packet-encoding': 'xudp', network: 'tcp', 'reality-opts': { 'public-key': 'example-key' } })
    expect(toMihomoProxy({ ...base, type: 'http', username: '', password: '', network: 'tcp', alpn: [] })).toEqual({ ...base, type: 'http', username: '', password: '' })
    expect(toMihomoProxy({ ...base, type: 'socks5', username: 'example', password: 'example', network: 'tcp' })).not.toHaveProperty('network')
    expect(toMihomoProxy({ ...base, type: 'ss', cipher: 'aes-128-gcm', password: 'example', network: 'tcp', plugin: { name: 'obfs-local', options: { mode: 'http' } } })).toMatchObject({ cipher: 'aes-128-gcm', password: 'example', plugin: 'obfs', 'plugin-opts': { mode: 'http' } })
    expect(toMihomoProxy({ ...base, type: 'ss', cipher: 'aes-128-gcm', password: 'example', plugin: { name: 'v2ray-plugin', options: { tls: true } } })).toMatchObject({ plugin: 'v2ray-plugin', 'plugin-opts': { tls: true } })
    expect(toMihomoProxy({ ...base, type: 'trojan', password: 'example' })).toHaveProperty('password', 'example')
  })

  it('maps optional transport structures without inventing empty fields', () => {
    const base: ProxyNode = { name: 'Example', server: 'example.com', port: 443, type: 'vless', uuid }
    expect(toMihomoProxy({ ...base, network: 'ws', ws: {} })['ws-opts']).toEqual({})
    expect(toMihomoProxy({ ...base, network: 'grpc', grpc: {} })['grpc-opts']).toEqual({})
    expect(toMihomoProxy({ ...base, network: 'grpc', grpc: { serviceName: 'service' } })['grpc-opts']).toEqual({ 'grpc-service-name': 'service' })
    expect(toMihomoProxy({ ...base, network: 'http', http: {} })['http-opts']).toEqual({})
    expect(toMihomoProxy({ ...base, network: 'http', http: { path: '/path', host: ['cdn.example'] } })['http-opts']).toEqual({ path: ['/path'], headers: { Host: ['cdn.example'] } })
    expect(toMihomoProxy({ ...base, network: 'xhttp', xhttp: {} })['xhttp-opts']).toEqual({})
    expect(toMihomoProxy({ ...base, network: 'xhttp', xhttp: { path: '/path', host: 'cdn.example', mode: 'auto', xPaddingBytes: '100-1000' } })['xhttp-opts']).toEqual({ path: '/path', host: 'cdn.example', mode: 'auto', 'x-padding-bytes': '100-1000' })
  })
  it('places custom direct rules before custom proxy rules and resolves conflicts to DIRECT', () => {
    const node = parseLink(`vless://${uuid}@example.com:443#Only`).node
    const config = buildMihomoConfig([node], true, { directDomains: ['bank.example'], proxyDomains: ['video.example', 'bank.example'] })
    const rules = config.rules as string[]
    expect(rules).toContain('DOMAIN-SUFFIX,bank.example,DIRECT')
    expect(rules).toContain('DOMAIN-SUFFIX,video.example,FORCE_PROXY')
    expect(rules).not.toContain('DOMAIN-SUFFIX,bank.example,FORCE_PROXY')
    expect(rules.indexOf('DOMAIN-SUFFIX,bank.example,DIRECT')).toBeLessThan(rules.indexOf('DOMAIN-SUFFIX,video.example,FORCE_PROXY'))
  })

  it('renames node collisions with every group and built-in policy without mutating inputs', () => {
    const node = parseLink(`vless://${uuid}@example.com:443#Tokyo`).node
    const nodes = [...RESERVED_PROXY_NAMES, 'Tokyo', 'Tokyo', 'Tokyo 2', 'PROXY 2'].map((name) => ({ ...node, name }))
    const snapshot = JSON.stringify(nodes)
    const full = buildMihomoConfig(nodes, true)
    const minimal = buildMihomoConfig(nodes, false)
    expect(minimal.proxies).toEqual(full.proxies)
    const names = (full.proxies as { name: string }[]).map(({ name }) => name)
    expect(names).toHaveLength(nodes.length)
    expect(new Set(names).size).toBe(nodes.length)
    expect(names.some((name) => (RESERVED_PROXY_NAMES as readonly string[]).includes(name))).toBe(false)
    const groups = full['proxy-groups'] as { name: string; type: string; proxies: string[] }[]
    expect(() => validateGroupReferences(groups, names)).not.toThrow()
    expect(groups.find(({ name }) => name === 'FORCE_PROXY')!.proxies).not.toContain('DIRECT')
    expect(groups.find(({ name }) => name === 'AUTO')!.proxies).not.toContain('DIRECT')
    expect(JSON.stringify(nodes)).toBe(snapshot)
  })

  it('rejects empty full configurations but keeps proxies-only independent of routing validation', () => {
    expect(() => buildMihomoConfig([], true)).toThrow('at least one')
    expect(buildMihomoConfig([], false, { proxyDomains: ['bad,domain'] })).toEqual({ proxies: [] })
    const node = parseLink(`vless://${uuid}@example.com:443#Only`).node
    const output = serializeMihomo([node], 'proxies', { directDomains: ['bad,domain'], intranet: [{ suffix: 'bad', nameservers: [] }] })
    expect(Object.keys(parse(output))).toEqual(['proxies'])
    expect(output).not.toContain('rules:')
    expect(output).not.toContain('dns:')
    expect(output).not.toContain('proxy-groups:')
    expect(output).not.toContain('FORCE_PROXY')
  })

  it('round-trips all generated group/DNS/rule values through YAML including names with punctuation', () => {
    const node = { ...parseLink(`vless://${uuid}@example.com:443`).node, name: '香港: [节点] # 1' }
    const routing = { directDomains: ['bank.example'], proxyDomains: ['203.0.113.5'], intranet: [{ suffix: 'corp.example', nameservers: ['10.0.0.53'] }] }
    const output = serializeMihomo([node], 'full', routing)
    expect(parse(output)).toEqual(buildMihomoConfig([node], true, routing))
    expect(output).toContain('# 用户始终直连')
    expect(output).toContain('# 内网域名直连')
    expect(output).not.toContain('&#x20;')
  })

  it('serializes explicit DNS entries before GeoSite and preserves independent node-bootstrap policies', () => {
    const node = parseLink(`vless://${uuid}@proxy.corp.example:443#Only`).node
    const routing = { directDomains: ['baidu.com'], proxyDomains: ['example.com'], intranet: [{ suffix: 'corp.example', nameservers: ['10.0.0.53'] }] }
    const output = serializeMihomo([node], 'full', routing)
    const config = parse(output) as { dns: Record<string, unknown> }
    const policy = config.dns['nameserver-policy'] as Record<string, string[]>
    expect(Object.keys(policy).slice(-2)).toEqual(['geosite:cn', 'geosite:geolocation-!cn'])
    expect(config.dns['proxy-server-nameserver-policy']).toEqual({
      '+.localhost': ['rcode://refused'], '+.local': ['rcode://refused'], '+.lan': ['rcode://refused'], '+.home.arpa': ['rcode://refused'],
      '+.corp.example': ['udp://10.0.0.53:53'],
    })
    expect(config).toEqual(buildMihomoConfig([node], true, routing))
    expect(output).toContain('proxy-server-nameserver-policy:')
    expect(output).not.toMatch(/&a\d+|\*a\d+/)
  })

  it('rejects missing, duplicate, reserved, empty and cyclic group references', () => {
    const group = (name: string, proxies: string[]) => ({ name, type: 'select', proxies })
    expect(() => validateGroupReferences([group('Test', ['Missing'])], ['Node'])).toThrow('missing proxy')
    expect(() => validateGroupReferences([group('Node', ['DIRECT'])], ['Node'])).toThrow('names conflict')
    expect(() => validateGroupReferences([], ['DIRECT'])).toThrow('names conflict')
    expect(() => validateGroupReferences([group('Empty', [])], ['Node'])).toThrow('no proxy members')
    expect(() => validateGroupReferences([group('A', ['B']), group('B', ['A'])], ['Node'])).toThrow('circular reference')
    expect(() => validateGroupReferences([group('A', ['A'])], ['Node'])).toThrow('circular reference')
  })
})
