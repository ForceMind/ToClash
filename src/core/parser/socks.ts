import type { ParseResult, ProxyNode } from '../model/proxy'
import { parseBoolean } from '../utils/boolean'
import { fragmentName, parseUrl, requireHost, requirePort } from '../utils/uri'

export function parseSocks(uri: string): ParseResult {
  const url = parseUrl(uri.replace(/^socks:\/\//i, 'socks5://'), 'SOCKS5')
  const server = requireHost(url, 'SOCKS5')
  const username = url.username ? decodeURIComponent(url.username) : undefined
  const password = url.password ? decodeURIComponent(url.password) : undefined
  const node: ProxyNode = { name: fragmentName(url) || `SOCKS5 ${server}`, type: 'socks5', server, port: requirePort(url.port, 1080), ...(username ? { username } : {}), ...(password ? { password } : {}), udp: true }
  const tls = parseBoolean(url.searchParams.get('tls')); if (tls !== undefined) node.tls = tls
  const skipCertVerify = parseBoolean(url.searchParams.get('skip-cert-verify')); if (skipCertVerify !== undefined) node.skipCertVerify = skipCertVerify
  return { node, warnings: [] }
}
