import { useMemo, useState } from 'react'
import { PRESET_CATEGORIES, RULE_PRESETS } from '../core/rules/presets'
import type { PresetId, RulePreset } from '../core/rules/types'

interface Props {
  directMode?: boolean
  presets: Record<PresetId, boolean>
  bypassCgnat: boolean
  onPresetChange: (id: PresetId, enabled: boolean) => void
  onCgnatChange: (enabled: boolean) => void
  zh: boolean
}

const checkboxClass =
  'h-4 w-4 shrink-0 accent-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/25'

function matchesSearch(preset: RulePreset, query: string): boolean {
  if (!query) return true
  return `${preset.nameZh} ${preset.nameEn} ${preset.id}`
    .toLowerCase()
    .includes(query.toLowerCase())
}

export function RuleSettings({
  directMode = false,
  presets,
  bypassCgnat,
  onPresetChange,
  onCgnatChange,
  zh,
}: Props) {
  const [query, setQuery] = useState('')
  const enabled = RULE_PRESETS.filter((preset) => presets[preset.id]).length
  const visible = useMemo(
    () => RULE_PRESETS.filter((preset) => matchesSearch(preset, query.trim())),
    [query],
  )
  const filtered = query.trim().length > 0
  const updateCategory = (items: readonly RulePreset[], value: boolean) => {
    for (const preset of items) onPresetChange(preset.id, value)
  }

  return (
    <details className="min-w-0 rounded-xl border border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <summary className="cursor-pointer rounded font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/20">
        {zh
          ? `服务规则预设（已启用 ${enabled} 类）`
          : `Service rule presets (${enabled} enabled)`}
      </summary>
      <div className="mt-4">
        <label
          htmlFor="service-preset-search"
          className="block text-sm font-semibold"
        >
          {zh ? '搜索服务' : 'Search services'}
        </label>
        <input
          id="service-preset-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            zh
              ? '按中文、英文或服务名搜索'
              : 'Search by Chinese, English, or service name'
          }
          className="mt-2 block w-full min-w-0 rounded-lg border border-slate-300 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950"
        />
        <p
          className="mt-2 text-xs text-slate-600 dark:text-slate-400"
          aria-live="polite"
        >
          {zh
            ? `已选择 ${enabled} 项；显示 ${visible.length} 项`
            : `${enabled} selected; ${visible.length} shown`}
        </p>

        {visible.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
            {zh ? '没有匹配的服务。' : 'No matching services.'}
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {PRESET_CATEGORIES.map((category) => {
              const items = visible.filter(
                (preset) => preset.category === category.id,
              )
              if (!items.length) return null
              const scope = filtered
                ? zh
                  ? '当前可见结果'
                  : 'visible results'
                : zh
                  ? '当前分类'
                  : 'this category'
              return (
                <fieldset
                  key={category.id}
                  className="min-w-0 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                >
                  <legend className="px-1 text-sm font-semibold">
                    {zh ? category.nameZh : category.nameEn}
                  </legend>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updateCategory(items, true)}
                      className="rounded border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-slate-600 dark:hover:bg-slate-800"
                    >
                      {zh ? `全选${scope}` : `Select all ${scope}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCategory(items, false)}
                      className="rounded border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-slate-600 dark:hover:bg-slate-800"
                    >
                      {zh ? `清空${scope}` : `Clear ${scope}`}
                    </button>
                  </div>
                  <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2">
                    {items.map((preset) => (
                      <label
                        key={preset.id}
                        className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={presets[preset.id]}
                          onChange={(event) =>
                            onPresetChange(preset.id, event.target.checked)
                          }
                          className={checkboxClass}
                        />
                        <span className="min-w-0 break-words">
                          {zh ? preset.nameZh : preset.nameEn}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )
            })}
          </div>
        )}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
        {directMode
          ? zh
            ? '勾选的服务全部使用固定代理出口；未勾选的服务默认直连，但仍受自定义规则及其他预设中重叠域名影响。Google / YouTube 包含 Gmail，登录和验证域名可能被多个服务共用。'
            : 'Selected services use the fixed proxy exit. Unselected services default to direct, subject to custom rules and overlapping presets. Google / YouTube includes Gmail; sign-in and verification domains may be shared.'
          : zh
            ? 'Google / YouTube 和开发者服务 / GitHub 使用 PROXY（仍可手动选择 DIRECT）；其他已选服务使用 FORCE_PROXY。关闭预设仅取消该类服务的专用规则，随后仍可能命中 MATCH,PROXY；需要直连，请加入“始终直连”。'
            : 'Google / YouTube and Developer services / GitHub use PROXY (which still allows DIRECT); other selected services use FORCE_PROXY. Disabling a preset only removes its dedicated rules; traffic may still match MATCH,PROXY. To connect directly, add the site to Always direct.'}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
        {zh
          ? '预设按域名分流；Telegram 等客户端的 IP 直连和音视频流量可能需要额外规则。'
          : 'Presets route by domain. Clients such as Telegram may need additional rules for direct IP and voice or video traffic.'}
      </p>
      <label className="mt-4 flex cursor-pointer items-start gap-2 border-t border-slate-200 pt-4 text-sm dark:border-slate-700">
        <input
          type="checkbox"
          checked={bypassCgnat}
          onChange={(event) => onCgnatChange(event.target.checked)}
          className={`${checkboxClass} mt-1`}
        />
        <span>
          <span className="font-medium">
            {zh ? '直连共享地址段（CGNAT）' : 'Bypass shared addresses (CGNAT)'}
          </span>
          <span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-400">
            {zh
              ? '仅当运营商或内网设备使用 100.64.0.0/10 且需要本地访问时开启。它不是普通私有网段，默认关闭。'
              : 'Enable only when your carrier or internal devices need local access to 100.64.0.0/10. This is shared address space, not a private LAN range; disabled by default.'}
          </span>
        </span>
      </label>
    </details>
  )
}
