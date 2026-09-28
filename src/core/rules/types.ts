export type PresetId =
  | 'openai' | 'claude' | 'developer' | 'google'
  | 'x' | 'tiktok' | 'meta' | 'facebook' | 'instagram' | 'threads' | 'reddit' | 'telegram' | 'whatsapp' | 'discord' | 'linkedin' | 'pinterest' | 'snapchat'
  | 'netflix' | 'disney' | 'primevideo' | 'spotify' | 'twitch'
  | 'perplexity' | 'grok' | 'microsoft' | 'apple' | 'notion' | 'slack' | 'zoom' | 'dropbox' | 'figma' | 'adobe' | 'amazon' | 'aws' | 'cloudflare' | 'paypal' | 'stripe' | 'steam' | 'epic' | 'roblox'

export type PresetCategory = 'ai' | 'social' | 'media' | 'work' | 'developer' | 'commerce' | 'gaming'

export interface IntranetZone {
  suffix: string
  nameservers: string[]
}

export interface CustomRouting {
  /** standard preserves the existing mainland split; direct only proxies selected services. */
  mode?: 'standard' | 'direct'
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
  category: PresetCategory
  nameZh: string
  nameEn: string
  defaultEnabled: boolean
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
