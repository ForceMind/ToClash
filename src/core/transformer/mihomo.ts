import { ConversionError, type ProxyNode } from '../model/proxy'
import { buildRulePlan } from '../rules/plan'
import type { CustomRouting } from '../rules/types'
import { uniqueNodeNames } from '../utils/names'

export type MihomoProxy = Record<string, unknown>
export type { CustomRouting } from '../rules/types'

export const RESERVED_PROXY_NAMES = ['DIRECT', 'REJECT', 'REJECT-DROP', 'PASS', 'COMPATIBLE', 'GLOBAL', 'DNS', 'PROXY', 'AUTO', 'FORCE_PROXY'] as const
interface ProxyGroup { name: string; type: string; proxies: string[]; url?: string; interval?: number }

/** All references must resolve, and policy groups must never contain a cycle. */
export function validateGroupReferences(groups: ProxyGroup[], nodeNames: string[]): void {
  const builtins = new Set<string>(['DIRECT', 'REJECT', 'REJECT-DROP', 'PASS', 'COMPATIBLE', 'GLOBAL', 'DNS'])
  const names = [...nodeNames, ...groups.map(({ name }) => name)]
  if (new Set(names).size !== names.length || names.some((name) => builtins.has(name))) throw new ConversionError('INVALID_URI', 'Proxy and policy group names conflict.')
  const available = new Set([...names, ...builtins])
  const byName = new Map(groups.map((group) => [group.name, group]))
  const visited = new Set<string>()
  const active = new Set<string>()
  function visit(group: ProxyGroup): void {
    if (active.has(group.name)) throw new ConversionError('INVALID_URI', 'Policy groups contain a circular reference.')
    if (visited.has(group.name)) return
    if (!group.proxies.length) throw new ConversionError('MISSING_FIELD', 'A policy group has no proxy members.')
    active.add(group.name)
    for (const name of group.proxies) {
      if (!available.has(name)) throw new ConversionError('MISSING_FIELD', 'A policy group references a missing proxy.')
      const child = byName.get(name)
      if (child) visit(child)
    }
    active.delete(group.name)
    visited.add(group.name)
  }
  groups.forEach(visit)
}

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
  if (node.xhttp) result['xhttp-opts'] = { ...(node.xhttp.path ? { path: node.xhttp.path } : {}), ...(node.xhttp.host ? { host: node.xhttp.host } : {}), ...(node.xhttp.mode ? { mode: node.xhttp.mode } : {}), ...(node.xhttp.xPaddingBytes ? { 'x-padding-bytes': node.xhttp.xPaddingBytes } : {}) }
  if (node.plugin) { result.plugin = node.plugin.name === 'obfs-local' ? 'obfs' : node.plugin.name; result['plugin-opts'] = node.plugin.options }
  return result
}

export function buildMihomoConfig(nodes: ProxyNode[], full: boolean, routing: CustomRouting = {}): Record<string, unknown> {
  nodes.forEach(validateNode)
  const namedNodes = uniqueNodeNames(nodes, RESERVED_PROXY_NAMES)
  const proxies = namedNodes.map(toMihomoProxy)
  if (!full) return { proxies }
  if (!nodes.length) throw new ConversionError('MISSING_FIELD', 'A full configuration requires at least one valid proxy node.')
  const names = namedNodes.map(({ name }) => name)
  const groups: ProxyGroup[] = [
    { name: 'PROXY', type: 'select', proxies: ['AUTO', 'DIRECT', ...names] },
    { name: 'AUTO', type: 'url-test', proxies: names, url: 'https://www.gstatic.com/generate_204', interval: 300 },
    { name: 'FORCE_PROXY', type: 'select', proxies: ['AUTO', ...names] },
  ]
  validateGroupReferences(groups, names)
  const plan = buildRulePlan(routing)
  return {
    'mixed-port': 7890,
    'allow-lan': false,
    mode: 'rule',
    'log-level': 'info',
    proxies,
    'proxy-groups': groups,
    dns: plan.dns,
    rules: plan.sections.flatMap(({ rules }) => rules),
  }
}
