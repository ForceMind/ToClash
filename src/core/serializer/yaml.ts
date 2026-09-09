import { Document, isMap, isScalar, isSeq } from 'yaml'
import type { ProxyNode } from '../model/proxy'
import { buildMihomoConfig } from '../transformer/mihomo'
import type { CustomRouting } from '../transformer/mihomo'
import { buildRulePlan } from '../rules/plan'

export type OutputFormat = 'full' | 'proxies'

export function serializeMihomo(nodes: ProxyNode[], format: OutputFormat, routing: CustomRouting = {}): string {
  const doc = new Document(buildMihomoConfig(nodes, format === 'full', routing), { aliasDuplicateObjects: false })
  if (format === 'full') {
    const comments: Record<string, string> = {
      'proxy-groups': routing.mode === 'direct' ? ' 代理组：FORCE_PROXY 仅包含代理节点' : ' 代理组：PROXY 可手动直连；FORCE_PROXY 仅包含代理节点；AUTO 自动选择',
      dns: routing.mode === 'direct' ? ' DNS：默认使用系统 DNS；直连流量保留指定内网 DNS 策略' : ' DNS：域名策略与分流保持一致；内网域名必须填写可达的内网 DNS',
      rules: ' 分流规则：从上到下匹配；必须代理规则后紧跟 REJECT，避免不支持 UDP 时降级直连',
    }
    if (isMap(doc.contents)) {
      for (const pair of doc.contents.items) {
        if (isScalar(pair.key) && typeof pair.key.value === 'string') {
          const comment = comments[pair.key.value]
          if (comment) {
            pair.key.commentBefore = comment
            pair.key.spaceBefore = true
          }
        }
      }
    }
    const rules = doc.get('rules', true)
    if (isSeq(rules)) {
      let index = 0
      for (const section of buildRulePlan(routing).sections) {
        const first = rules.items[index]
        if (section.rules.length && isScalar(first)) {
          first.commentBefore = ` ${section.comment}`
          first.spaceBefore = index > 0
        }
        index += section.rules.length
      }
    }
    const policy = doc.getIn(['dns', 'nameserver-policy'], true)
    if (isMap(policy)) policy.commentBefore = routing.mode === 'direct'
      ? ' 默认直连模式使用系统 DNS；direct-nameserver-follow-policy 保留指定内网 DNS'
      : ' 未配置内网 DNS 的保留本地后缀拒绝上游查询，避免发送到公网；不会配置系统或浏览器 DNS'
  }
  return doc.toString({ lineWidth: 0, indent: 2 })
}
