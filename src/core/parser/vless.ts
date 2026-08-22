import type { ParseResult, ProxyNode } from '../model/proxy'
import { fragmentName, parseUrl, requireHost, requirePort } from '../utils/uri'
import { applyCommonParams, validateUuid } from './common'

export function parseVless(uri: string): ParseResult {
  const url = parseUrl(uri, 'VLESS')
  const uuid = decodeURIComponent(url.username)
  validateUuid(uuid, 'VLESS')
  const server = requireHost(url, 'VLESS')
  const node: ProxyNode = { name: fragmentName(url) || `VLESS ${server}`, type: 'vless', server, port: requirePort(url.port, 443), uuid, udp: true }
  const warnings = applyCommonParams(node, url.searchParams)
  const encryption = url.searchParams.get('encryption'); if (encryption) node.encryption = encryption
  return { node, warnings }
}
