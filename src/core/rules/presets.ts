import type { DomainRule, PresetCategory, PresetId, RulePreset } from './types'

const suffixes = (...values: string[]): DomainRule[] => values.map((value) => ({ type: 'DOMAIN-SUFFIX', value }))

export const PRESET_CATEGORIES: readonly { id: PresetCategory; nameZh: string; nameEn: string }[] = [
  { id: 'ai', nameZh: 'AI 服务', nameEn: 'AI services' },
  { id: 'social', nameZh: '社交与通讯', nameEn: 'Social & messaging' },
  { id: 'media', nameZh: '媒体与流媒体', nameEn: 'Media & streaming' },
  { id: 'work', nameZh: '工作与协作', nameEn: 'Work & collaboration' },
  { id: 'developer', nameZh: '开发者服务', nameEn: 'Developer services' },
  { id: 'gaming', nameZh: '游戏', nameEn: 'Gaming' },
]

// Curated first-party service/login domains, not a remote rule subscription.
// Shared providers are deliberately excluded unless a service-owned hostname is
// known. Sources and catalogue limits are documented in SERVICE_CATALOG.md.
export const RULE_PRESETS: readonly RulePreset[] = [
  {
    id: 'openai', category: 'ai', nameZh: 'Codex / OpenAI', nameEn: 'Codex / OpenAI', defaultEnabled: true,
    rules: [
      ...suffixes('openai.com', 'chatgpt.com', 'oaistatic.com', 'oaiusercontent.com', 'oaistatsig.com', 'workos.com', 'workoscdn.com'),
      { type: 'DOMAIN', value: 'workos.imgix.net' },
      { type: 'DOMAIN', value: 'challenges.cloudflare.com' },
    ],
  },
  {
    id: 'claude', category: 'ai', nameZh: 'Claude / Anthropic', nameEn: 'Claude / Anthropic', defaultEnabled: true,
    rules: [
      ...suffixes('anthropic.com', 'claude.ai', 'claude.com', 'anthropic-static.com'),
      { type: 'DOMAIN', value: 'bridge.claudeusercontent.com' },
      { type: 'DOMAIN', value: 'storage.googleapis.com' },
      { type: 'DOMAIN', value: 'raw.githubusercontent.com' },
    ],
  },
  {
    id: 'developer', category: 'developer', nameZh: '开发者服务 / GitHub', nameEn: 'Developer services / GitHub', defaultEnabled: true,
    rules: suffixes('github.com', 'githubusercontent.com', 'githubassets.com', 'github.io'),
  },
  {
    id: 'google', category: 'media', nameZh: 'Google / YouTube', nameEn: 'Google / YouTube', defaultEnabled: true,
    rules: suffixes('google.com', 'googleapis.com', 'gstatic.com', 'youtube.com', 'ytimg.com', 'googlevideo.com', 'ggpht.com', 'gvt1.com', 'youtu.be'),
  },
  { id: 'x', category: 'social', nameZh: 'X / Twitter', nameEn: 'X / Twitter', defaultEnabled: false, rules: suffixes('x.com', 'twitter.com', 'twimg.com', 't.co') },
  { id: 'tiktok', category: 'social', nameZh: 'TikTok', nameEn: 'TikTok', defaultEnabled: false, rules: suffixes('tiktok.com', 'tiktokv.com', 'tiktokcdn.com', 'tiktokcdn-us.com', 'byteoversea.com', 'musical.ly', 'muscdn.com') },
  { id: 'facebook', category: 'social', nameZh: 'Facebook', nameEn: 'Facebook', defaultEnabled: false, rules: suffixes('facebook.com', 'fb.com', 'fb.me', 'fbcdn.net', 'fbsbx.com') },
  { id: 'instagram', category: 'social', nameZh: 'Instagram', nameEn: 'Instagram', defaultEnabled: false, rules: suffixes('instagram.com', 'cdninstagram.com') },
  { id: 'threads', category: 'social', nameZh: 'Threads', nameEn: 'Threads', defaultEnabled: false, rules: suffixes('threads.com', 'threads.net') },
  { id: 'reddit', category: 'social', nameZh: 'Reddit', nameEn: 'Reddit', defaultEnabled: false, rules: suffixes('reddit.com', 'redd.it', 'redditstatic.com', 'redditmedia.com') },
  { id: 'telegram', category: 'social', nameZh: 'Telegram', nameEn: 'Telegram', defaultEnabled: false, rules: suffixes('telegram.org', 'telegram.me', 't.me', 'tdlib.org', 'telegram.dog') },
  { id: 'whatsapp', category: 'social', nameZh: 'WhatsApp', nameEn: 'WhatsApp', defaultEnabled: false, rules: suffixes('whatsapp.com', 'whatsapp.net', 'wa.me') },
  { id: 'discord', category: 'social', nameZh: 'Discord', nameEn: 'Discord', defaultEnabled: false, rules: suffixes('discord.com', 'discordapp.com', 'discordapp.net', 'discord.gg', 'discord.media', 'discordcdn.com') },
  { id: 'linkedin', category: 'social', nameZh: 'LinkedIn', nameEn: 'LinkedIn', defaultEnabled: false, rules: suffixes('linkedin.com', 'licdn.com', 'lnkd.in') },
  { id: 'netflix', category: 'media', nameZh: 'Netflix', nameEn: 'Netflix', defaultEnabled: false, rules: suffixes('netflix.com', 'netflix.net', 'nflxext.com', 'nflximg.com', 'nflximg.net', 'nflxvideo.net', 'fast.com') },
  { id: 'disney', category: 'media', nameZh: 'Disney+', nameEn: 'Disney+', defaultEnabled: false, rules: suffixes('disneyplus.com', 'disney-plus.net', 'disneyplus.net', 'bamgrid.com') },
  { id: 'primevideo', category: 'media', nameZh: 'Prime Video', nameEn: 'Prime Video', defaultEnabled: false, rules: suffixes('primevideo.com', 'amazonvideo.com', 'aiv-cdn.net') },
  { id: 'spotify', category: 'media', nameZh: 'Spotify', nameEn: 'Spotify', defaultEnabled: false, rules: suffixes('spotify.com', 'spoti.fi', 'scdn.co', 'spotifycdn.com', 'spotifycdn.net') },
  { id: 'twitch', category: 'media', nameZh: 'Twitch', nameEn: 'Twitch', defaultEnabled: false, rules: suffixes('twitch.tv', 'ttvnw.net', 'jtvnw.net', 'twitchcdn.net') },
  { id: 'perplexity', category: 'ai', nameZh: 'Perplexity', nameEn: 'Perplexity', defaultEnabled: false, rules: suffixes('perplexity.ai', 'pplx.ai', 'perplexityusercontent.com') },
  { id: 'grok', category: 'ai', nameZh: 'Grok', nameEn: 'Grok', defaultEnabled: false, rules: suffixes('grok.com', 'x.ai') },
  { id: 'microsoft', category: 'work', nameZh: 'Microsoft', nameEn: 'Microsoft', defaultEnabled: false, rules: suffixes('microsoft.com', 'microsoftonline.com', 'office.com', 'office365.com', 'outlook.com', 'live.com', 'msauth.net', 'msftauth.net', 'msftauthimages.net') },
  { id: 'apple', category: 'work', nameZh: 'Apple / iCloud', nameEn: 'Apple / iCloud', defaultEnabled: false, rules: suffixes('apple.com', 'apple.co', 'icloud.com', 'icloud-content.com', 'apple-cloudkit.com', 'apple-mapkit.com', 'cdn-apple.com') },
  { id: 'notion', category: 'work', nameZh: 'Notion', nameEn: 'Notion', defaultEnabled: false, rules: suffixes('notion.so', 'notion.site', 'notion-static.com', 'notionusercontent.com', 'notion.com') },
  { id: 'slack', category: 'work', nameZh: 'Slack', nameEn: 'Slack', defaultEnabled: false, rules: suffixes('slack.com', 'slack-edge.com', 'slack-files.com', 'slackb.com') },
  { id: 'zoom', category: 'work', nameZh: 'Zoom', nameEn: 'Zoom', defaultEnabled: false, rules: suffixes('zoom.us', 'zoom.com', 'zoomgov.com', 'zoomcdn.com') },
  { id: 'dropbox', category: 'work', nameZh: 'Dropbox', nameEn: 'Dropbox', defaultEnabled: false, rules: suffixes('dropbox.com', 'dropboxapi.com', 'dropboxstatic.com', 'dropboxusercontent.com', 'getdropbox.com') },
  { id: 'steam', category: 'gaming', nameZh: 'Steam', nameEn: 'Steam', defaultEnabled: false, rules: suffixes('steampowered.com', 'steamcommunity.com', 'steamstatic.com', 'steamcontent.com', 'steam-chat.com', 'steamgames.com') },
  { id: 'epic', category: 'gaming', nameZh: 'Epic Games', nameEn: 'Epic Games', defaultEnabled: false, rules: suffixes('epicgames.com', 'epicgames.dev', 'unrealengine.com', 'fortnite.com') },
]

export const DEFAULT_PRESETS: Record<PresetId, boolean> = Object.fromEntries(
  RULE_PRESETS.map(({ id, defaultEnabled }) => [id, defaultEnabled]),
) as Record<PresetId, boolean>

/**
 * Additional public service endpoints used only by the default-direct mode.
 * Standard routing deliberately keeps its established, narrower coverage.
 */
export const DIRECT_MODE_PRESET_ADDITIONS: Readonly<Partial<Record<PresetId, readonly DomainRule[]>>> = {
  openai: [{ type: 'DOMAIN', value: 'cdn.openaimerge.com' }],
  claude: suffixes('claudeusercontent.com'),
  google: suffixes(
    'google.com.hk', 'google.com.tw', 'google.com.sg', 'google.co.jp', 'google.co.uk',
    'googleusercontent.com', 'gvt2.com', 'gmail.com', 'googlemail.com',
    'recaptcha.net', 'g.co', 'goo.gl', 'youtube-nocookie.com',
  ),
}
