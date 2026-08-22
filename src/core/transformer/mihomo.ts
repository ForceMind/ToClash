import { ConversionError, type ProxyNode } from '../model/proxy'

export type MihomoProxy = Record<string, unknown>

export function validateNode(node: ProxyNode): void {
  if (!node.name || !node.server) throw new ConversionError('MISSING_FIELD', 'Proxy node is missing a name or server.')
  if (!Number.isInteger(node.port) || node.port < 1 || node.port > 65535) throw new ConversionError('INVALID_PORT', 'Proxy node has an invalid port.')
  if ((node.type === 'vless' || node.type === 'vmess') && !node.uuid) throw new ConversionError('MISSING_FIELD', `${node.type.toUpperCase()} node is missing its UUID.`)
  if ((node.type === 'trojan' || node.type === 'ss') && node.password === undefined) throw new ConversionError('MISSING_FIELD', `${node.type} node is missing its password.`)
  if (node.type === 'ss' && !node.cipher) throw new ConversionError('MISSING_FIELD', 'Shadowsocks node is missing its cipher.')
}

export function toMihomoProxy(node: ProxyNode): MihomoProxy {
  validateNode(node)
  const result: MihomoProxy = { name: node.name, type: node.type, server: node.server, port: node.port }
  if (node.uuid) result.uuid = node.uuid
  if (node.password !== undefined) result.password = node.password
  if (node.username !== undefined) result.username = node.username
  if (node.type === 'vmess') { result.alterId = node.alterId ?? 0; result.cipher = node.cipher ?? 'auto' }
  if (node.type === 'ss') result.cipher = node.cipher
  if (node.encryption) result.encryption = node.encryption
  if (node.udp !== undefined) result.udp = node.udp
  if (node.flow) result.flow = node.flow
  if (node.packetEncoding) result['packet-encoding'] = node.packetEncoding
  if (node.tls !== undefined) result.tls = node.tls
  if (node.servername) result.servername = node.servername
  if (node.alpn?.length) result.alpn = node.alpn
  if (node.clientFingerprint) result['client-fingerprint'] = node.clientFingerprint
  if (node.skipCertVerify !== undefined) result['skip-cert-verify'] = node.skipCertVerify
  if (node.reality) result['reality-opts'] = { 'public-key': node.reality.publicKey, ...(node.reality.shortId ? { 'short-id': node.reality.shortId } : {}) }
  if (node.network && !['socks5', 'http', 'ss'].includes(node.type)) result.network = node.network
  if (node.ws) result['ws-opts'] = { ...(node.ws.path ? { path: node.ws.path } : {}), ...(node.ws.host ? { headers: { Host: node.ws.host } } : {}) }
  if (node.grpc) result['grpc-opts'] = node.grpc.serviceName ? { 'grpc-service-name': node.grpc.serviceName } : {}
  if (node.http) result['http-opts'] = { ...(node.http.path ? { path: [node.http.path] } : {}), ...(node.http.host ? { headers: { Host: node.http.host } } : {}) }
  if (node.xhttp) result['xhttp-opts'] = { ...(node.xhttp.path ? { path: node.xhttp.path } : {}), ...(node.xhttp.host ? { host: node.xhttp.host } : {}), ...(node.xhttp.mode ? { mode: node.xhttp.mode } : {}) }
  if (node.plugin) { result.plugin = node.plugin.name === 'obfs-local' ? 'obfs' : node.plugin.name; result['plugin-opts'] = node.plugin.options }
  return result
}

export function buildMihomoConfig(nodes: ProxyNode[], full: boolean): Record<string, unknown> {
  const proxies = nodes.map(toMihomoProxy)
  if (!full) return { proxies }
  const names = nodes.map(({ name }) => name)
  return {
    'mixed-port': 7890,
    'allow-lan': false,
    mode: 'rule',
    'log-level': 'info',
    proxies,
    'proxy-groups': [
      { name: 'Proxy', type: 'select', proxies: ['Auto', 'DIRECT', ...names] },
      { name: 'Auto', type: 'url-test', proxies: names, url: 'https://www.gstatic.com/generate_204', interval: 300 },
    ],
    rules: ['MATCH,Proxy'],
  }
}
