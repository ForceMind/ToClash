export interface DomainListResult {
  domains: string[]
  invalidLines: number[]
}

export interface RoutingTarget {
  kind: 'domain' | 'ipv4' | 'ipv6'
  value: string
}

export function hasUnsafeRoutingText(value: string): boolean {
  return /[\s\\]/u.test(value) || [...value].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
}

/** Parse addresses without resolving them or retaining URL paths/credentials. */
export function parseRoutingTarget(input: string): RoutingTarget | null {
  const entry = input.trim()
  if (!entry || hasUnsafeRoutingText(entry)) return null
  try {
    const isUrl = entry.includes('://')
    const wildcard = !isUrl && /^(\*\.|\+\.)/.test(entry)
    const hostInput = wildcard ? entry.slice(2) : entry
    const bareIpv6 = !isUrl && !hostInput.startsWith('[') && (hostInput.match(/:/g)?.length ?? 0) > 1
    const url = new URL(isUrl ? entry : `http://${bareIpv6 ? `[${hostInput}]` : hostInput}`)
    if (!['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol)) return null
    if (url.username || url.password) return null
    if (!isUrl && (url.pathname !== '/' || url.search || url.hash)) return null
    const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase().replace(/\.$/, '')
    if (!host) return null
    if (host.includes(':')) return wildcard ? null : { kind: 'ipv6', value: host }
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return wildcard ? null : { kind: 'ipv4', value: host }
    if (host.length > 253 || !host.split('.').every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return null
    return { kind: 'domain', value: host }
  } catch {
    return null
  }
}

export function parseDomainList(input: string): DomainListResult {
  const domains: string[] = []
  const invalidLines: number[] = []
  const seen = new Set<string>()
  input.split(/\r?\n/).forEach((value, index) => {
    const entry = value.trim()
    if (!entry) return
    const target = parseRoutingTarget(entry)
    if (!target) invalidLines.push(index + 1)
    else if (!seen.has(target.value)) {
      seen.add(target.value)
      domains.push(target.value)
    }
  })
  return { domains, invalidLines }
}
