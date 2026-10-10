import type { DomainRule } from './types'

export const DIRECT_DNS = ['https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query'] as const
export const SYSTEM_DNS = ['system'] as const
export const LOCAL_DNS = ['rcode://refused'] as const
export const LOCAL_DOMAINS: readonly DomainRule[] = [
  { type: 'DOMAIN-SUFFIX', value: 'localhost' },
  { type: 'DOMAIN-SUFFIX', value: 'local' },
  { type: 'DOMAIN-SUFFIX', value: 'lan' },
  { type: 'DOMAIN-SUFFIX', value: 'home.arpa' },
]
export const LOCAL_IP_RULES = [
  'IP-CIDR,127.0.0.0/8,DIRECT,no-resolve',
  'IP-CIDR,10.0.0.0/8,DIRECT,no-resolve',
  'IP-CIDR,172.16.0.0/12,DIRECT,no-resolve',
  'IP-CIDR,192.168.0.0/16,DIRECT,no-resolve',
  'IP-CIDR,169.254.0.0/16,DIRECT,no-resolve',
  'IP-CIDR6,::1/128,DIRECT,no-resolve',
  'IP-CIDR6,fc00::/7,DIRECT,no-resolve',
  'IP-CIDR6,fe80::/10,DIRECT,no-resolve',
] as const

export const CGNAT_RULE = 'IP-CIDR,100.64.0.0/10,DIRECT,no-resolve'

export function proxyDns(group: 'PROXY' | 'FORCE_PROXY'): string[] {
  return [`https://1.1.1.1/dns-query#${group}`, `https://8.8.8.8/dns-query#${group}`]
}
