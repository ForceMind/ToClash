import { describe, expect, it } from 'vitest'
import { convertLinks, parseLink } from '../src/core/parser'

const uuid = '00000000-0000-4000-8000-000000000000'
const b64 = (value: string) => btoa(unescape(encodeURIComponent(value))).replace(/=+$/, '')

describe('VLESS', () => {
  it('parses TCP, TLS, WS, unicode name and encoded path', () => {
    const { node } = parseLink(`vless://${uuid}@example.com:443?encryption=none&security=tls&type=ws&host=edge.example.com&path=%2Fws&sni=example.com&fp=chrome#%E9%A6%99%E6%B8%AF`)
    expect(node).toMatchObject({ name: '香港', type: 'vless', port: 443, tls: true, servername: 'example.com', clientFingerprint: 'chrome', network: 'ws', ws: { path: '/ws', host: 'edge.example.com' } })
  })
  it('parses gRPC and Reality', () => {
    const { node } = parseLink(`vless://${uuid}@[2001:db8::1]:8443?security=reality&type=grpc&serviceName=api&pbk=public&sid=abcd&sni=example.com#Reality`)
    expect(node).toMatchObject({ server: '2001:db8::1', grpc: { serviceName: 'api' }, reality: { publicKey: 'public', shortId: 'abcd' } })
  })
  it('supports HTTP, h2 and XHTTP options', () => {
    expect(parseLink(`vless://${uuid}@example.com:443?type=http&path=%2Fa&host=a.example`).node.http).toEqual({ path: '/a', host: ['a.example'] })
    expect(parseLink(`vless://${uuid}@example.com:443?type=h2`).node.network).toBe('h2')
    expect(parseLink(`vless://${uuid}@example.com:443?type=xhttp&path=%2Fx&host=x.example&mode=packet-up`).node.xhttp).toEqual({ path: '/x', host: 'x.example', mode: 'packet-up' })
  })
  it('maps XHTTP padding from explicit and extra URI forms without duplicate warnings', () => {
    const explicit = parseLink(`vless://${uuid}@example.com:443?type=xhttp&x_padding_bytes=100-1000&extra=%7B%22xPaddingBytes%22%3A%22200-2000%22%7D`)
    expect(explicit.node.xhttp?.xPaddingBytes).toBe('100-1000')
    expect(explicit.warnings).toEqual([])
    const extra = parseLink(`vless://${uuid}@example.com:443?type=xhttp&extra=%7B%22xPaddingBytes%22%3A%22100-1000%22%7D`)
    expect(extra.node.xhttp?.xPaddingBytes).toBe('100-1000')
    expect(extra.warnings).toEqual([])
  })
  it('warns for ignored parameters and rejects invalid values', () => {
    expect(parseLink(`vless://${uuid}@example.com:443?spx=%2F`).warnings[0]?.code).toBe('IGNORED_PARAMETER')
    expect(() => parseLink('vless://bad@example.com:443')).toThrow('UUID')
    expect(() => parseLink(`vless://${uuid}@example.com:443?type=kcp`)).toThrow('transport')
  })
})

describe('VMess', () => {
  const make = (extra: object = {}) => `vmess://${b64(JSON.stringify({ v: '2', ps: '东京', add: 'example.com', port: '443', id: uuid, aid: '0', scy: 'auto', net: 'ws', host: 'cdn.example.com', path: '/ws', tls: 'tls', sni: 'example.com', ...extra }))}`
  it('parses unpadded base64, WS, TLS and unicode', () => expect(parseLink(make()).node).toMatchObject({ name: '东京', type: 'vmess', tls: true, ws: { path: '/ws', host: 'cdn.example.com' } }))
  it('parses URL-safe base64', () => { const link = make(); const payload = link.slice(8).replace(/\+/g, '-').replace(/\//g, '_'); expect(parseLink(`vmess://${payload}`).node.type).toBe('vmess') })
  it('parses gRPC', () => expect(parseLink(make({ net: 'grpc', path: 'svc' })).node.grpc).toEqual({ serviceName: 'svc' }))
  it('rejects invalid JSON and base64', () => { expect(() => parseLink(`vmess://${b64('{bad')}`)).toThrow('JSON'); expect(() => parseLink('vmess://***')).toThrow('Base64') })
})

describe('Trojan, Shadowsocks, SOCKS and HTTP', () => {
  it('parses Trojan TLS, WS and gRPC', () => {
    expect(parseLink('trojan://p%40ss@example.com:443?security=tls&type=ws&path=%2Ft&host=cdn.example&sni=sni.example#T').node).toMatchObject({ password: 'p@ss', tls: true, ws: { path: '/t' } })
    expect(parseLink('trojan://pass@example.com:443?type=grpc&serviceName=svc').node.grpc).toEqual({ serviceName: 'svc' })
  })
  it('parses SIP002 userinfo and legacy Shadowsocks forms', () => {
    const userinfo = b64('aes-256-gcm:secret')
    expect(parseLink(`ss://${userinfo}@example.com:8388#%E9%A6%99%E6%B8%AF`).node).toMatchObject({ name: '香港', cipher: 'aes-256-gcm', password: 'secret' })
    expect(parseLink(`ss://${b64('chacha20-ietf-poly1305:pass@example.com:8388')}#Legacy`).node.server).toBe('example.com')
  })
  it('parses SS plugins and warns for unknown plugins', () => {
    const known = parseLink(`ss://${b64('aes-128-gcm:p')}@example.com:8388?plugin=v2ray-plugin%3Btls%3Bhost%3Dcdn.example`)
    expect(known.node.plugin).toMatchObject({ name: 'v2ray-plugin', options: { tls: true, host: 'cdn.example' } })
    expect(parseLink(`ss://${b64('aes-128-gcm:p')}@example.com:8388?plugin=unknown`).warnings[0]?.code).toBe('UNSUPPORTED_PLUGIN')
  })
  it('parses credentials, defaults, encoded password and IPv6', () => {
    expect(parseLink('socks://user:p%40ss@[2001:db8::1]:1080#S').node).toMatchObject({ type: 'socks5', server: '2001:db8::1', password: 'p@ss' })
    expect(parseLink('https://user:pass@example.com#H').node).toMatchObject({ type: 'http', port: 443, tls: true })
  })
})

describe('batch conversion', () => {
  it('handles blanks, CRLF, mixed protocols, failures and duplicate names', () => {
    const result = convertLinks(`\r\nvless://${uuid}@one.example:443#Node\r\ninvalid\r\nhttp://two.example:8080#Node\n`)
    expect(result).toMatchObject({ total: 3, success: 2, failed: 1 }); expect(result.nodes.map((n) => n.name)).toEqual(['Node', 'Node 2']); expect(result.errors[0]).toMatchObject({ line: 3, code: 'UNSUPPORTED_PROTOCOL' })
  })
})
