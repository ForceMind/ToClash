import type { IntranetZone } from '../rules/types'
import { hasUnsafeRoutingText, parseRoutingTarget } from './domain'

export interface IntranetResult {
  zones: IntranetZone[]
  invalidSuffixLines: number[]
  invalidResolverLines: number[]
  incomplete: boolean
}

/** IP-literal UDP resolvers only: no DNS bootstrap, proxy selectors or secrets. */
export function normalizeDnsServer(input: string): string | null {
  const entry = input.trim().replace(/^udp:\/\//i, '')
  if (!entry || hasUnsafeRoutingText(entry) || /[/@?#]/.test(entry)) return null
  try {
    const bareIpv6 = !entry.startsWith('[') && (entry.match(/:/g)?.length ?? 0) > 1
    const url = new URL(`http://${bareIpv6 ? `[${entry}]` : entry}`)
    const target = parseRoutingTarget(url.hostname)
    if (!target || target.kind === 'domain' || ['0.0.0.0', '::'].includes(target.value)) return null
    // HTTP's standard parser elides port 80; preserve the explicitly supplied value.
    const explicitPort = entry.startsWith('[') ? entry.match(/\]:(\d+)$/)?.[1] : !bareIpv6 ? entry.match(/:(\d+)$/)?.[1] : undefined
    if (entry.endsWith(':') && !bareIpv6) return null
    const port = explicitPort ? Number(explicitPort) : 53
    if (!Number.isInteger(port) || port < 1 || port > 65535) return null
    return `udp://${target.kind === 'ipv6' ? `[${target.value}]` : target.value}:${port}`
  } catch {
    return null
  }
}

export function parseIntranetConfig(suffixInput: string, dnsInput: string): IntranetResult {
  const suffixes = new Set<string>()
  const nameservers = new Set<string>()
  const invalidSuffixLines: number[] = []
  const invalidResolverLines: number[] = []
  suffixInput.split(/\r?\n/).forEach((line, index) => {
    const value = line.trim()
    if (!value) return
    const target = parseRoutingTarget(value)
    if (!target || target.kind !== 'domain' || /[:/?#]/.test(value)) invalidSuffixLines.push(index + 1)
    else suffixes.add(target.value)
  })
  dnsInput.split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) return
    const server = normalizeDnsServer(line)
    if (!server) invalidResolverLines.push(index + 1)
    else nameservers.add(server)
  })
  const incomplete = suffixes.size === 0 || nameservers.size === 0
  return {
    zones: incomplete || invalidSuffixLines.length || invalidResolverLines.length
      ? []
      : [...suffixes].map((suffix) => ({ suffix, nameservers: [...nameservers] })),
    invalidSuffixLines,
    invalidResolverLines,
    incomplete,
  }
}
