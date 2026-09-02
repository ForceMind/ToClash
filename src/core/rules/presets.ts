import type { DomainRule, RulePreset } from './types'

const suffixes = (...values: string[]): DomainRule[] => values.map((value) => ({ type: 'DOMAIN-SUFFIX', value }))

// Curated first-party service/login domains, not a remote rule subscription.
// Sources and scope are documented in docs/RULES.md. Shared hosts use exact matches.
export const RULE_PRESETS: readonly RulePreset[] = [
  {
    id: 'openai', nameZh: 'Codex / OpenAI', nameEn: 'Codex / OpenAI',
    rules: [
      ...suffixes('openai.com', 'chatgpt.com', 'oaistatic.com', 'oaiusercontent.com', 'oaistatsig.com', 'workos.com', 'workoscdn.com'),
      { type: 'DOMAIN', value: 'workos.imgix.net' },
      { type: 'DOMAIN', value: 'challenges.cloudflare.com' },
    ],
  },
  {
    id: 'claude', nameZh: 'Claude / Anthropic', nameEn: 'Claude / Anthropic',
    rules: [
      ...suffixes('anthropic.com', 'claude.ai', 'claude.com', 'anthropic-static.com'),
      { type: 'DOMAIN', value: 'bridge.claudeusercontent.com' }, // Chrome integration WebSocket bridge.
      { type: 'DOMAIN', value: 'storage.googleapis.com' }, // Older native installer/update packages.
      { type: 'DOMAIN', value: 'raw.githubusercontent.com' }, // Claude Code release notes.
    ],
  },
  {
    id: 'developer', nameZh: '开发者服务 / GitHub', nameEn: 'Developer services / GitHub',
    rules: suffixes('github.com', 'githubusercontent.com', 'githubassets.com', 'github.io'),
  },
  {
    id: 'google', nameZh: 'Google / YouTube', nameEn: 'Google / YouTube',
    rules: suffixes('google.com', 'googleapis.com', 'gstatic.com', 'youtube.com', 'ytimg.com', 'googlevideo.com', 'ggpht.com', 'gvt1.com', 'youtu.be'),
  },
]
