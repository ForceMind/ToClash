import { ConversionError, type ParseResult, type ProxyNode } from '../model/proxy'
import { decodeBase64 } from '../utils/base64'
import { parseBoolean, parseNumber, parseString } from '../utils/boolean'
import { applyCommonParams, validateUuid } from './common'

type VmessPayload = Record<string, unknown>

export function parseVmess(uri: string): ParseResult {
  const payload = uri.slice(uri.indexOf('://') + 3).trim()
  let data: VmessPayload
  try { const parsed: unknown = JSON.parse(decodeBase64(payload)); if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(); data = parsed as VmessPayload } catch (error) {
    if (error instanceof ConversionError && error.code === 'INVALID_BASE64') throw error
    throw new ConversionError('INVALID_JSON', 'Invalid VMess link: unable to parse its JSON payload.', 'vmess')
  }
  const server = parseString(data.add)
  const uuid = parseString(data.id)
  const port = parseNumber(data.port)
  if (!server) throw new ConversionError('MISSING_HOST', 'VMess link is missing a server.', 'vmess')
  if (!port || !Number.isInteger(port) || port < 1 || port > 65535) throw new ConversionError('INVALID_PORT', 'VMess link has an invalid port.', 'vmess')
  if (!uuid) throw new ConversionError('MISSING_FIELD', 'VMess link is missing its UUID.', 'vmess')
  validateUuid(uuid, 'VMess')
  const node: ProxyNode = { name: parseString(data.ps) || `VMess ${server}`, type: 'vmess', server, port, uuid, alterId: parseNumber(data.aid) ?? 0, cipher: parseString(data.scy) || 'auto', udp: true }
  const params = new URLSearchParams()
  const mappings: [string, unknown][] = [['type', data.net], ['path', data.path], ['host', data.host], ['sni', data.sni], ['alpn', data.alpn], ['fp', data.fp], ['serviceName', data.path]]
  for (const [key, value] of mappings) { const parsed = parseString(value); if (parsed) params.set(key, parsed) }
  if (parseString(data.tls) && parseString(data.tls) !== 'none') params.set('security', 'tls')
  if (parseBoolean(data.allowInsecure) !== undefined) params.set('allowInsecure', String(parseBoolean(data.allowInsecure)))
  return { node, warnings: applyCommonParams(node, params, new Set(['tcp', 'ws', 'grpc', 'http', 'h2'])) }
}
