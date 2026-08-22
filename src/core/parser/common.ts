import type { ConversionIssue, NetworkType, ProxyNode } from '../model/proxy'
import { ConversionError } from '../model/proxy'
import { parseBoolean } from '../utils/boolean'
import { splitList } from '../utils/uri'

const transports = new Set<NetworkType>(['tcp', 'ws', 'grpc', 'http', 'h2', 'xhttp'])
const handled = new Set(['encryption', 'security', 'type', 'net', 'path', 'host', 'sni', 'servername', 'alpn', 'fp', 'fingerprint', 'flow', 'serviceName', 'service-name', 'pbk', 'public-key', 'sid', 'short-id', 'spx', 'spiderX', 'packetEncoding', 'packet-encoding', 'allowInsecure', 'allow-insecure', 'skip-cert-verify', 'mode', 'headerType', 'authority'])

export function applyCommonParams(node: ProxyNode, params: URLSearchParams, allowedTransports = transports): Omit<ConversionIssue, 'line'>[] {
  const rawNetwork = (params.get('type') || params.get('net') || 'tcp').toLowerCase()
  if (!allowedTransports.has(rawNetwork as NetworkType)) throw new ConversionError('UNSUPPORTED_TRANSPORT', `Unsupported transport "${rawNetwork}".`)
  node.network = rawNetwork as NetworkType
  const security = params.get('security')?.toLowerCase()
  node.tls = security === 'tls' || security === 'reality' || parseBoolean(params.get('tls')) === true
  const servername = params.get('sni') || params.get('servername'); if (servername) node.servername = servername
  const alpn = splitList(params.get('alpn')); if (alpn) node.alpn = alpn
  const fingerprint = params.get('fp') || params.get('fingerprint'); if (fingerprint) node.clientFingerprint = fingerprint
  const skipCertVerify = parseBoolean(params.get('allowInsecure') ?? params.get('allow-insecure') ?? params.get('skip-cert-verify')); if (skipCertVerify !== undefined) node.skipCertVerify = skipCertVerify
  const flow = params.get('flow'); if (flow) node.flow = flow
  const packetEncoding = params.get('packetEncoding') || params.get('packet-encoding'); if (packetEncoding) node.packetEncoding = packetEncoding
  const path = params.get('path') || undefined
  const host = params.get('host') || params.get('authority') || undefined
  if (node.network === 'ws') node.ws = { ...(path ? { path } : {}), ...(host ? { host } : {}) }
  if (node.network === 'grpc') { const serviceName = params.get('serviceName') || params.get('service-name') || path; node.grpc = serviceName ? { serviceName } : {} }
  if (node.network === 'http' || node.network === 'h2') node.http = { ...(path ? { path } : {}), ...(host ? { host: host.split(',').map((x) => x.trim()) } : {}) }
  if (node.network === 'xhttp') node.xhttp = { ...(path ? { path } : {}), ...(host ? { host } : {}), ...(params.get('mode') ? { mode: params.get('mode')! } : {}) }
  if (security === 'reality') {
    const publicKey = params.get('pbk') || params.get('public-key')
    if (!publicKey) throw new ConversionError('MISSING_FIELD', 'Reality link is missing its public key.')
    const shortId = params.get('sid') || params.get('short-id') || undefined
    node.reality = { publicKey, ...(shortId ? { shortId } : {}) }
  }
  const warnings: Omit<ConversionIssue, 'line'>[] = []
  const spider = params.get('spx') || params.get('spiderX')
  if (spider) warnings.push({ code: 'IGNORED_PARAMETER', message: 'Parameter "spiderX" has no Mihomo outbound equivalent and was ignored.' })
  for (const key of new Set(params.keys())) if (!handled.has(key) && key !== 'tls') warnings.push({ code: 'IGNORED_PARAMETER', message: `Parameter "${key}" is currently ignored.` })
  return warnings
}

export function validateUuid(uuid: string, protocol: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid)) throw new ConversionError('INVALID_UUID', `Invalid ${protocol} UUID.`, protocol)
}
