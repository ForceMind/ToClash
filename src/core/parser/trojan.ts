import { ConversionError, type ParseResult, type ProxyNode } from '../model/proxy'
import { fragmentName, parseUrl, requireHost, requirePort } from '../utils/uri'
import { applyCommonParams } from './common'

export function parseTrojan(uri: string): ParseResult {
  const url = parseUrl(uri, 'Trojan')
  const password = decodeURIComponent(url.username)
  if (!password) throw new ConversionError('MISSING_FIELD', 'Trojan link is missing its password.', 'trojan')
  const server = requireHost(url, 'Trojan')
  const node: ProxyNode = { name: fragmentName(url) || `Trojan ${server}`, type: 'trojan', server, port: requirePort(url.port, 443), password, udp: true }
  return { node, warnings: applyCommonParams(node, url.searchParams) }
}
