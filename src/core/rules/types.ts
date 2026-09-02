export type PresetId = 'openai' | 'claude' | 'developer' | 'google'

export interface IntranetZone {
  suffix: string
  nameservers: string[]
}

export interface CustomRouting {
  directDomains?: string[]
  proxyDomains?: string[]
  presets?: Partial<Record<PresetId, boolean>>
  bypassCgnat?: boolean
  intranet?: IntranetZone[]
}

export interface DomainRule {
  type: 'DOMAIN' | 'DOMAIN-SUFFIX'
  value: string
}

export interface RulePreset {
  id: PresetId
  nameZh: string
  nameEn: string
  rules: readonly DomainRule[]
}

export interface RuleSection {
  id: string
  comment: string
  rules: string[]
}

export interface RoutingWarning {
  code: 'DIRECT_OVERRIDE' | 'INTRANET_OVERRIDE' | 'LOCAL_OVERRIDE'
  count: number
}

export interface RulePlan {
  sections: RuleSection[]
  dns: Record<string, unknown>
  warnings: RoutingWarning[]
}
