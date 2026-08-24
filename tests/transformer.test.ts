import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'
import { parseLink } from '../src/core/parser'
import { serializeMihomo } from '../src/core/serializer/yaml'
import { buildMihomoConfig, toMihomoProxy, validateNode } from '../src/core/transformer/mihomo'

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
    expect(config['proxy-groups']).toEqual([{ name: 'PROXY', type: 'select', proxies: ['AUTO', 'DIRECT', 'Only'] }, { name: 'AUTO', type: 'url-test', proxies: ['Only'], url: 'https://www.gstatic.com/generate_204', interval: 300 }])
    expect(config.dns).toMatchObject({ enable: true, 'enhanced-mode': 'fake-ip', 'nameserver-policy': { 'geosite:geolocation-!cn': ['https://1.1.1.1/dns-query#PROXY', 'https://8.8.8.8/dns-query#PROXY'] } })
    expect(config.rules).toEqual(expect.arrayContaining(['IP-CIDR,192.168.0.0/16,DIRECT,no-resolve', 'DOMAIN-SUFFIX,openai.com,PROXY', 'GEOSITE,CN,DIRECT', 'GEOIP,CN,DIRECT', 'MATCH,PROXY']))
    expect(serializeMihomo([node], 'proxies')).toContain('proxies:\n  - name: Only')
    const yaml = serializeMihomo([node], 'full')
    expect(yaml).toContain('# DNS：国内解析直连，国外域名通过 PROXY 组解析')
    expect(parse(yaml).rules.at(-1)).toBe('MATCH,PROXY')
  })
  it('validates required schema fields', () => expect(() => validateNode({ name: 'x', type: 'vless', server: 'x', port: 443 })).toThrow('UUID'))
  it('places custom direct rules before custom proxy rules and resolves conflicts to DIRECT', () => {
    const node = parseLink(`vless://${uuid}@example.com:443#Only`).node
    const config = buildMihomoConfig([node], true, { directDomains: ['bank.example'], proxyDomains: ['video.example', 'bank.example'] })
    const rules = config.rules as string[]
    expect(rules).toContain('DOMAIN-SUFFIX,bank.example,DIRECT')
    expect(rules).toContain('DOMAIN-SUFFIX,video.example,PROXY')
    expect(rules).not.toContain('DOMAIN-SUFFIX,bank.example,PROXY')
    expect(rules.indexOf('DOMAIN-SUFFIX,bank.example,DIRECT')).toBeLessThan(rules.indexOf('DOMAIN-SUFFIX,video.example,PROXY'))
  })
})
