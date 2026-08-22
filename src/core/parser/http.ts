import type { ParseResult, ProxyNode } from '../model/proxy'
import { parseBoolean } from '../utils/boolean'
import { fragmentName, parseUrl, requireHost, requirePort } from '../utils/uri'

export function parseHttp(uri: string): ParseResult {
  const url = parseUrl(uri, 'HTTP')
  const server = requireHost(url, 'HTTP')
  const tls = url.protocol === 'https:'
  const username = url.username ? decodeURIComponent(url.username) : undefined
  const password = url.password ? decodeURIComponent(url.password) : undefined
  const node: ProxyNode = { name: fragmentName(url) || `${tls ? 'HTTPS' : 'HTTP'} ${server}`, type: 'http', server, port: requirePort(url.port, tls ? 443 : 80), ...(username ? { username } : {}), ...(password ? { password } : {}), tls }
  const servername = url.searchParams.get('sni'); if (servername) node.servername = servername
  const skipCertVerify = parseBoolean(url.searchParams.get('skip-cert-verify')); if (skipCertVerify !== undefined) node.skipCertVerify = skipCertVerify
  return { node, warnings: [] }
}
