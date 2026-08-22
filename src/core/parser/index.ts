import { ConversionError, type ConversionIssue, type ConversionResult, type ParseResult } from '../model/proxy'
import { detectProtocol } from './detect'
import { parseHttp } from './http'
import { parseShadowsocks } from './shadowsocks'
import { parseSocks } from './socks'
import { parseTrojan } from './trojan'
import { parseVless } from './vless'
import { parseVmess } from './vmess'

export function parseLink(uri: string): ParseResult {
  switch (detectProtocol(uri)) {
    case 'vless': return parseVless(uri)
    case 'vmess': return parseVmess(uri)
    case 'trojan': return parseTrojan(uri)
    case 'ss': return parseShadowsocks(uri)
    case 'socks5': return parseSocks(uri)
    case 'http': return parseHttp(uri)
  }
}

export function convertLinks(input: string): ConversionResult {
  const lines = input.split(/\r?\n/).map((value, index) => ({ value: value.trim(), line: index + 1 })).filter(({ value }) => value)
  const nodes: ConversionResult['nodes'] = []; const errors: ConversionIssue[] = []; const warnings: ConversionIssue[] = []
  for (const item of lines) {
    try { const result = parseLink(item.value); nodes.push(result.node); warnings.push(...result.warnings.map((issue) => ({ ...issue, line: item.line }))) }
    catch (error) { const safe = error instanceof ConversionError ? error : new ConversionError('INVALID_URI', 'Unable to parse this proxy link.'); errors.push({ line: item.line, code: safe.code, message: safe.message, ...(safe.protocol ? { protocol: safe.protocol } : {}) }) }
  }
  const counts = new Map<string, number>()
  for (const node of nodes) { const original = node.name; const count = (counts.get(original) ?? 0) + 1; counts.set(original, count); if (count > 1) node.name = `${original} ${count}` }
  return { nodes, errors, warnings, total: lines.length, success: nodes.length, failed: errors.length }
}
