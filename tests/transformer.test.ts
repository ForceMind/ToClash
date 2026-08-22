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
  it('builds valid full groups with existing node references', () => {
    const node = parseLink(`vless://${uuid}@example.com:443#Only`).node
    const config = buildMihomoConfig([node], true)
    expect(config['proxy-groups']).toEqual([{ name: 'Proxy', type: 'select', proxies: ['Auto', 'DIRECT', 'Only'] }, { name: 'Auto', type: 'url-test', proxies: ['Only'], url: 'https://www.gstatic.com/generate_204', interval: 300 }])
    expect(serializeMihomo([node], 'proxies')).toContain('proxies:\n  - name: Only')
  })
  it('validates required schema fields', () => expect(() => validateNode({ name: 'x', type: 'vless', server: 'x', port: 443 })).toThrow('UUID'))
})
