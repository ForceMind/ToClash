import { stringify } from 'yaml'
import type { ProxyNode } from '../model/proxy'
import { buildMihomoConfig } from '../transformer/mihomo'

export type OutputFormat = 'full' | 'proxies'

export function serializeMihomo(nodes: ProxyNode[], format: OutputFormat): string {
  const output = stringify(buildMihomoConfig(nodes, format === 'full'), { lineWidth: 0, indent: 2 })
  if (format !== 'full') return output
  return output
    .replace('\nproxy-groups:\n', '\n# 代理组：手动选择、自动测速、直连或具体节点\nproxy-groups:\n')
    .replace('\ndns:\n', '\n# DNS：国内解析直连，国外域名通过 PROXY 组解析\ndns:\n')
    .replace('\nrules:\n', '\n# 分流规则：从上到下匹配，首条命中即停止\nrules:\n')
}
