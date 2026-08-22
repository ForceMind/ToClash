import { ConversionError } from '../model/proxy'

export function parseUrl(uri: string, protocol: string): URL {
  try { return new URL(uri) } catch { throw new ConversionError('INVALID_URI', `Invalid ${protocol} link.`, protocol) }
}

export function requireHost(url: URL, protocol: string): string {
  if (!url.hostname) throw new ConversionError('MISSING_HOST', `${protocol} link is missing a server.`, protocol)
  return url.hostname.replace(/^\[|\]$/g, '')
}

export function requirePort(value: string, fallback?: number): number {
  const port = value ? Number(value) : fallback
  if (!port || !Number.isInteger(port) || port < 1 || port > 65535) throw new ConversionError('INVALID_PORT', 'Proxy link has an invalid port.')
  return port
}

export function fragmentName(url: URL): string | undefined {
  if (!url.hash) return undefined
  try { return decodeURIComponent(url.hash.slice(1)) || undefined } catch { return url.hash.slice(1) || undefined }
}

export function splitList(value: string | null): string[] | undefined {
  const items = value?.split(',').map((item) => item.trim()).filter(Boolean)
  return items?.length ? items : undefined
}
