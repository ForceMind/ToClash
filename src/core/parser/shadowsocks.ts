import { ConversionError, type ParseResult, type PluginOptions, type ProxyNode } from '../model/proxy'
import { decodeBase64 } from '../utils/base64'
import { fragmentName, parseUrl, requireHost, requirePort } from '../utils/uri'

function credentials(value: string): [string, string] {
  const uriDecoded = decodeURIComponent(value)
  const decoded = uriDecoded.includes(':') ? uriDecoded : decodeBase64(uriDecoded)
  const split = decoded.indexOf(':')
  if (split <= 0) throw new ConversionError('INVALID_URI', 'Invalid Shadowsocks credentials.', 'ss')
  return [decoded.slice(0, split), decoded.slice(split + 1)]
}

function parsePlugin(value: string): PluginOptions {
  const [name = '', ...parts] = value.split(';')
  const options: Record<string, string | boolean> = {}
  for (const part of parts) { const at = part.indexOf('='); if (at < 0) options[part] = true; else options[part.slice(0, at)] = part.slice(at + 1) }
  return { name, options }
}

export function parseShadowsocks(uri: string): ParseResult {
  const body = uri.slice(5)
  const withoutFragment = body.split('#', 1)[0] ?? ''
  const authority = withoutFragment.split('?', 1)[0] ?? ''
  let normalized = uri
  if (!authority.includes('@')) {
    const decoded = decodeBase64(authority)
    normalized = `ss://${decoded}${body.slice(authority.length)}`
  }
  const url = parseUrl(normalized, 'Shadowsocks')
  const [cipher, password] = url.password
    ? [decodeURIComponent(url.username), decodeURIComponent(url.password)]
    : credentials(url.username)
  const server = requireHost(url, 'Shadowsocks')
  const node: ProxyNode = { name: fragmentName(url) || `Shadowsocks ${server}`, type: 'ss', server, port: requirePort(url.port), cipher, password, udp: true }
  const warnings: ParseResult['warnings'] = []
  const pluginValue = url.searchParams.get('plugin')
  if (pluginValue) {
    node.plugin = parsePlugin(pluginValue)
    if (!['obfs-local', 'simple-obfs', 'v2ray-plugin'].includes(node.plugin.name)) warnings.push({ code: 'UNSUPPORTED_PLUGIN', message: `Plugin "${node.plugin.name}" may not be supported by Mihomo.` })
  }
  for (const key of new Set(url.searchParams.keys())) if (key !== 'plugin') warnings.push({ code: 'IGNORED_PARAMETER', message: `Parameter "${key}" is currently ignored.` })
  return { node, warnings }
}
