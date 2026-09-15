import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { convertLinks } from '../core/parser'
import { RULE_PRESETS } from '../core/rules/presets'
import type { PresetId } from '../core/rules/types'
import { parseDomainList } from '../core/utils/domain'
import { parseIntranetConfig } from '../core/utils/intranet'

export interface BeginnerGuideValues {
  input: string
  mode: 'standard' | 'direct'
  presets: Record<PresetId, boolean>
  directInput: string
  proxyInput: string
  intranetEnabled: boolean
  intranetSuffixInput: string
  intranetDnsInput: string
}

interface Props {
  open: boolean
  initialValues: BeginnerGuideValues
  onApply: (values: BeginnerGuideValues) => void
  onClose: () => void
  zh: boolean
}

type Step = 0 | 1 | 2 | 3 | 4 | 5

const commonPresetIds = ['openai', 'claude', 'developer', 'google'] as const

function cloneValues(values: BeginnerGuideValues): BeginnerGuideValues {
  return { ...values, presets: { ...values.presets } }
}

export function BeginnerGuideDialog({
  open,
  initialValues,
  onApply,
  onClose,
  zh,
}: Props) {
  const [step, setStep] = useState<Step>(0)
  const [draft, setDraft] = useState(() => cloneValues(initialValues))
  const dialogRef = useRef<HTMLElement>(null)
  const wasOpen = useRef(false)

  useEffect(() => {
    if (open && !wasOpen.current) {
      setStep(0)
      setDraft(cloneValues(initialValues))
    }
    wasOpen.current = open
  }, [open, initialValues])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    dialogRef.current?.querySelector<HTMLElement>('[data-guide-focus]')?.focus()
  }, [open, step])

  const nodes = useMemo(() => convertLinks(draft.input), [draft.input])
  const direct = useMemo(
    () => parseDomainList(draft.directInput),
    [draft.directInput],
  )
  const proxy = useMemo(
    () => parseDomainList(draft.proxyInput),
    [draft.proxyInput],
  )
  const intranet = useMemo(
    () =>
      parseIntranetConfig(
        draft.intranetSuffixInput,
        draft.intranetDnsInput,
        draft.mode === 'direct',
      ),
    [draft.intranetSuffixInput, draft.intranetDnsInput, draft.mode],
  )

  if (!open) return null

  const customRoutingReady =
    direct.invalidLines.length === 0 && proxy.invalidLines.length === 0
  const intranetReady =
    !draft.intranetEnabled ||
    (!intranet.incomplete &&
      intranet.invalidSuffixLines.length === 0 &&
      intranet.invalidResolverLines.length === 0)
  const canContinue =
    step === 1
      ? nodes.success > 0
      : step === 3
        ? customRoutingReady
        : step === 4
          ? intranetReady
          : true
  const selectedServices = Object.values(draft.presets).filter(Boolean).length

  const update = <K extends keyof BeginnerGuideValues>(
    key: K,
    value: BeginnerGuideValues[K],
  ) => setDraft((current) => ({ ...current, [key]: value }))

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key !== 'Tab') return
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled])',
    )
    if (!focusable?.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-5">
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="beginner-guide-title"
        aria-describedby="beginner-guide-description"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-2xl outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300"
              aria-live="polite"
            >
              {zh ? `第 ${step + 1} 步，共 6 步` : `Step ${step + 1} of 6`}
            </p>
            <h2 id="beginner-guide-title" className="mt-1 text-xl font-bold">
              {zh
                ? '新手模式：生成 Clash YAML'
                : 'Beginner mode: build Clash YAML'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={zh ? '关闭新手模式' : 'Close beginner mode'}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            {zh ? '关闭' : 'Close'}
          </button>
        </div>

        <p
          id="beginner-guide-description"
          className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300"
        >
          {zh
            ? '这是完整页面的简易模式。向导只在最后确认时应用设置并转换，关闭不会修改当前页面。'
            : 'This is a simplified mode for the full page. Settings are applied and converted only at the final confirmation; closing leaves the page unchanged.'}
        </p>

        <div className="mt-5 min-h-80">
          {step === 0 && (
            <fieldset>
              <legend className="text-lg font-semibold">
                {zh ? '选择你的网络情况' : 'Choose your network setup'}
              </legend>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {zh
                  ? '不知道怎么选时使用常规分流。之后仍可在完整页面修改。'
                  : 'Use standard routing if you are unsure. You can change this later on the full page.'}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="cursor-pointer rounded-xl border border-slate-300 p-4 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 dark:border-slate-700 dark:has-[:checked]:border-blue-400 dark:has-[:checked]:bg-blue-950/30">
                  <input
                    data-guide-focus
                    type="radio"
                    name="guide-mode"
                    checked={draft.mode === 'standard'}
                    onChange={() => update('mode', 'standard')}
                    className="accent-blue-600"
                  />
                  <span className="ml-2 font-semibold">
                    {zh ? '常规分流' : 'Standard routing'}
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {zh
                      ? '中国大陆直连，其他流量使用代理。'
                      : 'Mainland China direct; other traffic uses the proxy.'}
                  </span>
                </label>
                <label className="cursor-pointer rounded-xl border border-slate-300 p-4 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 dark:border-slate-700 dark:has-[:checked]:border-blue-400 dark:has-[:checked]:bg-blue-950/30">
                  <input
                    type="radio"
                    name="guide-mode"
                    checked={draft.mode === 'direct'}
                    onChange={() => update('mode', 'direct')}
                    className="accent-blue-600"
                  />
                  <span className="ml-2 font-semibold">
                    {zh ? '默认直连' : 'Direct by default'}
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {zh
                      ? '当前网络可直接上网，仅选中的服务使用代理。'
                      : 'Use direct Internet access and proxy only selected services.'}
                  </span>
                </label>
              </div>
            </fieldset>
          )}

          {step === 1 && (
            <div>
              <label
                htmlFor="guide-proxy-links"
                className="text-lg font-semibold"
              >
                {zh ? '粘贴代理链接' : 'Paste proxy links'}
              </label>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {zh
                  ? '每行一条。链接只保留在当前页面，不会由新手模式写入 LocalStorage。'
                  : 'Enter one link per line. Beginner mode keeps links only on the current page and never writes them to LocalStorage.'}
              </p>
              <textarea
                data-guide-focus
                id="guide-proxy-links"
                value={draft.input}
                onChange={(event) => update('input', event.target.value)}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                placeholder="vless://..."
                aria-invalid={
                  Boolean(draft.input.trim()) && nodes.success === 0
                }
                aria-describedby="guide-proxy-validation"
                className="mt-3 min-h-44 w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950"
              />
              <p
                id="guide-proxy-validation"
                className="mt-2 min-h-6 text-sm text-slate-600 dark:text-slate-300"
                aria-live="polite"
              >
                {draft.input.trim()
                  ? zh
                    ? `已检测 ${nodes.total} 条，成功 ${nodes.success} 条，失败 ${nodes.failed} 条。`
                    : `${nodes.total} detected, ${nodes.success} valid, ${nodes.failed} invalid.`
                  : zh
                    ? '至少填写一条有效代理链接后才能继续。'
                    : 'Enter at least one valid proxy link to continue.'}
              </p>
            </div>
          )}

          {step === 2 && (
            <fieldset>
              <legend className="text-lg font-semibold">
                {zh ? '选择常用代理服务' : 'Choose common proxy services'}
              </legend>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {zh
                  ? '这里提供四个常用开关；完成后可在完整页面继续选择全部 29 项服务。'
                  : 'These four common switches keep the guide simple. The full page provides all 29 services.'}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {commonPresetIds.map((id, index) => {
                  const preset = RULE_PRESETS.find((item) => item.id === id)
                  if (!preset) return null
                  return (
                    <label
                      key={id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-300 p-3 dark:border-slate-700"
                    >
                      <input
                        {...(index === 0 ? { 'data-guide-focus': true } : {})}
                        type="checkbox"
                        checked={draft.presets[id]}
                        onChange={(event) =>
                          update('presets', {
                            ...draft.presets,
                            [id]: event.target.checked,
                          })
                        }
                        className="h-4 w-4 accent-blue-600"
                      />
                      <span className="text-sm font-medium">
                        {zh ? preset.nameZh : preset.nameEn}
                      </span>
                    </label>
                  )
                })}
              </div>
              <p className="mt-4 rounded-lg bg-slate-100 p-3 text-sm leading-6 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {zh
                  ? '未在这里显示的已有服务选择会保留，不会被新手模式清除。'
                  : 'Existing selections not shown here are preserved and are not cleared by beginner mode.'}
              </p>
            </fieldset>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-lg font-semibold">
                {zh ? '可选：网站分流' : 'Optional: website routing'}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {zh
                  ? '没有额外要求时两栏都留空。每行填写一个域名、网址或 IP。'
                  : 'Leave both fields blank if you have no extra requirements. Enter one domain, URL, or IP per line.'}
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="guide-direct"
                    className="text-sm font-semibold"
                  >
                    {zh ? '始终直连' : 'Always direct'}
                  </label>
                  <textarea
                    data-guide-focus
                    id="guide-direct"
                    value={draft.directInput}
                    onChange={(event) =>
                      update('directInput', event.target.value)
                    }
                    placeholder="bank.example"
                    spellCheck={false}
                    className="mt-2 min-h-32 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label
                    htmlFor="guide-proxy"
                    className="text-sm font-semibold"
                  >
                    {zh ? '始终代理' : 'Always proxy'}
                  </label>
                  <textarea
                    id="guide-proxy"
                    value={draft.proxyInput}
                    onChange={(event) =>
                      update('proxyInput', event.target.value)
                    }
                    placeholder="video.example"
                    spellCheck={false}
                    className="mt-2 min-h-32 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>
              {!customRoutingReady && (
                <p
                  className="mt-2 text-sm text-red-700 dark:text-red-300"
                  aria-live="polite"
                >
                  {zh
                    ? `请修正无效输入：直连 ${direct.invalidLines.length} 行，代理 ${proxy.invalidLines.length} 行。`
                    : `Correct invalid entries: ${direct.invalidLines.length} direct and ${proxy.invalidLines.length} proxy lines.`}
                </p>
              )}
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 className="text-lg font-semibold">
                {zh ? '可选：内网 DNS' : 'Optional: intranet DNS'}
              </h3>
              <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-300 p-3 dark:border-slate-700">
                <input
                  data-guide-focus
                  type="checkbox"
                  checked={draft.intranetEnabled}
                  onChange={(event) =>
                    update('intranetEnabled', event.target.checked)
                  }
                  className="h-4 w-4 accent-blue-600"
                />
                <span className="text-sm font-semibold">
                  {zh
                    ? '我需要访问公司或家庭内网'
                    : 'I need company or home intranet access'}
                </span>
              </label>
              {draft.intranetEnabled && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="guide-intranet-suffix"
                      className="text-sm font-semibold"
                    >
                      {zh ? '内网域名后缀' : 'Intranet domain suffixes'}
                    </label>
                    <textarea
                      id="guide-intranet-suffix"
                      value={draft.intranetSuffixInput}
                      onChange={(event) =>
                        update('intranetSuffixInput', event.target.value)
                      }
                      placeholder="corp.example"
                      spellCheck={false}
                      className="mt-2 min-h-32 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="guide-intranet-dns"
                      className="text-sm font-semibold"
                    >
                      {zh
                        ? draft.mode === 'direct'
                          ? '内网 DNS（可留空）'
                          : '内网 DNS'
                        : draft.mode === 'direct'
                          ? 'Intranet DNS (optional)'
                          : 'Intranet DNS'}
                    </label>
                    <textarea
                      id="guide-intranet-dns"
                      value={draft.intranetDnsInput}
                      onChange={(event) =>
                        update('intranetDnsInput', event.target.value)
                      }
                      placeholder="192.0.2.53"
                      spellCheck={false}
                      className="mt-2 min-h-32 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                </div>
              )}
              {!intranetReady && (
                <p
                  className="mt-3 text-sm text-red-700 dark:text-red-300"
                  aria-live="polite"
                >
                  {zh
                    ? draft.mode === 'direct'
                      ? '请填写有效的内网后缀；DNS 留空时使用系统 DNS。'
                      : '请填写有效的内网后缀和 DNS IP。'
                    : draft.mode === 'direct'
                      ? 'Enter valid suffixes; blank DNS uses system DNS.'
                      : 'Enter valid suffixes and DNS IP addresses.'}
                </p>
              )}
              <p className="mt-4 rounded-lg bg-slate-100 p-3 text-sm leading-6 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {zh
                  ? '字段默认为空，不会自动填入任何后缀。使用 .local 后缀时，应用后页面会显示 Clash Verge 的额外提示。'
                  : 'Fields start blank and never insert a default suffix. After applying a .local suffix, the page shows the extra Clash Verge notice.'}
              </p>
            </div>
          )}

          {step === 5 && (
            <div>
              <h3 className="text-lg font-semibold">
                {zh ? '确认并生成' : 'Review and generate'}
              </h3>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                  <dt className="text-slate-500 dark:text-slate-400">
                    {zh ? '有效节点' : 'Valid nodes'}
                  </dt>
                  <dd className="mt-1 font-semibold">{nodes.success}</dd>
                </div>
                <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                  <dt className="text-slate-500 dark:text-slate-400">
                    {zh ? '网络模式' : 'Network mode'}
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {draft.mode === 'direct'
                      ? zh
                        ? '默认直连'
                        : 'Direct by default'
                      : zh
                        ? '常规分流'
                        : 'Standard routing'}
                  </dd>
                </div>
                <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                  <dt className="text-slate-500 dark:text-slate-400">
                    {zh ? '已选服务' : 'Selected services'}
                  </dt>
                  <dd className="mt-1 font-semibold">{selectedServices}</dd>
                </div>
                <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                  <dt className="text-slate-500 dark:text-slate-400">
                    {zh ? '额外网站规则' : 'Extra website rules'}
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {direct.domains.length + proxy.domains.length}
                  </dd>
                </div>
                <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800 sm:col-span-2">
                  <dt className="text-slate-500 dark:text-slate-400">
                    {zh ? '内网 DNS' : 'Intranet DNS'}
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {draft.intranetEnabled
                      ? zh
                        ? '已启用'
                        : 'Enabled'
                      : zh
                        ? '未启用'
                        : 'Disabled'}
                  </dd>
                </div>
              </dl>
              {nodes.failed > 0 && (
                <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                  {zh
                    ? `${nodes.failed} 条代理链接无效；应用后页面会保留逐行错误，只使用有效节点。`
                    : `${nodes.failed} proxy links are invalid. The page will retain line errors and use only valid nodes.`}
                </p>
              )}
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {zh
                  ? '点击后会切换到完整配置、写入这些设置并立即转换。代理链接仍只保存在当前页面内存中。'
                  : 'This switches to full config, applies these settings, and converts immediately. Proxy links remain only in page memory.'}
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
          <button type="button" onClick={onClose} className="button-secondary">
            {zh ? '退出新手模式' : 'Exit beginner mode'}
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((step - 1) as Step)}
                className="button-secondary"
              >
                {zh ? '上一步' : 'Back'}
              </button>
            )}
            {step < 5 ? (
              <button
                type="button"
                onClick={() => setStep((step + 1) as Step)}
                disabled={!canContinue}
                className="button-primary"
              >
                {zh ? '下一步' : 'Next'}
              </button>
            ) : (
              <button
                data-guide-focus
                type="button"
                onClick={() => onApply(cloneValues(draft))}
                className="button-primary"
              >
                {zh ? '应用并转换' : 'Apply and convert'}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
