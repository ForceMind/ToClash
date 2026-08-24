export interface DomainListResult {
  domains: string[]
  invalidLines: number[]
}

export function parseDomainList(input: string): DomainListResult {
  const domains: string[] = []
  const invalidLines: number[] = []
  const seen = new Set<string>()
  input.split(/\r?\n/).forEach((value, index) => {
    const entry = value.trim()
    if (!entry) return
    try {
      const candidate = entry.includes('://') ? entry : `http://${entry.replace(/^(\*\.|\+\.)/, '')}`
      const url = new URL(candidate)
      const domain = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
      if (!domain || url.username || url.password || (!entry.includes('://') && (url.pathname !== '/' || url.search || url.hash))) throw new Error()
      if (!seen.has(domain)) { seen.add(domain); domains.push(domain) }
    } catch { invalidLines.push(index + 1) }
  })
  return { domains, invalidLines }
}
