import { RULE_PRESETS } from '../core/rules/presets'
import type { PresetId } from '../core/rules/types'

interface Props {
  presets: Record<PresetId, boolean>
  bypassCgnat: boolean
  onPresetChange: (id: PresetId, enabled: boolean) => void
  onCgnatChange: (enabled: boolean) => void
  zh: boolean
}

const checkboxClass =
  'h-4 w-4 shrink-0 accent-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/25'

export function RuleSettings({
  presets,
  bypassCgnat,
  onPresetChange,
  onCgnatChange,
  zh,
}: Props) {
  const enabled = RULE_PRESETS.filter((preset) => presets[preset.id]).length
  return (
    <details className="rounded-xl border border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <summary className="cursor-pointer rounded font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/20">
        {zh
          ? `服务规则预设（已启用 ${enabled} 类）`
          : `Service rule presets (${enabled} enabled)`}
      </summary>
      <fieldset className="mt-4">
        <legend className="text-sm font-semibold">
          {zh
            ? '需要专用代理规则的服务'
            : 'Services with dedicated proxy rules'}
        </legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {RULE_PRESETS.map((preset) => (
            <label
              key={preset.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700"
            >
              <input
                type="checkbox"
                checked={presets[preset.id]}
                onChange={(event) =>
                  onPresetChange(preset.id, event.target.checked)
                }
                className={checkboxClass}
              />
              {zh ? preset.nameZh : preset.nameEn}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
        {zh
          ? 'AI 服务使用 FORCE_PROXY；开发者和 Google / YouTube 使用 PROXY（仍可手动选择 DIRECT）。关闭预设仅取消该类服务的专用规则，随后仍可能命中 MATCH,PROXY；需要直连，请加入“始终直连”。'
          : 'AI services use FORCE_PROXY; developer and Google / YouTube presets use PROXY (which still allows DIRECT). Disabling a preset only removes its dedicated rules; traffic may still match MATCH,PROXY. To connect directly, add the site to Always direct.'}
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
