import { stringify } from 'yaml'
import type { ProxyNode } from '../model/proxy'
import { buildMihomoConfig } from '../transformer/mihomo'

export type OutputFormat = 'full' | 'proxies'

export function serializeMihomo(nodes: ProxyNode[], format: OutputFormat): string {
  return stringify(buildMihomoConfig(nodes, format === 'full'), { lineWidth: 0, indent: 2 })
}
