import { useEffect, useMemo, useRef, useState } from 'react'
import { ErrorList } from './components/ErrorList'
import { FormatSelector } from './components/FormatSelector'
import { InputPanel } from './components/InputPanel'
import { IntranetSettings } from './components/IntranetSettings'
import { OutputPanel } from './components/OutputPanel'
import { RoutingOptions } from './components/RoutingOptions'
import { RuleSettings } from './components/RuleSettings'
import { ThemeToggle } from './components/ThemeToggle'
import { convertLinks } from './core/parser'
import { buildRulePlan } from './core/rules/plan'
import type { CustomRouting, RoutingWarning } from './core/rules/types'
import { serializeMihomo, type OutputFormat } from './core/serializer/yaml'
import { parseDomainList } from './core/utils/domain'
import { parseIntranetConfig } from './core/utils/intranet'
import { defaultPresets, loadSettings, saveSettings } from './settings/storage'
import packageJson from '../package.json'

const example = `vless://00000000-0000-4000-8000-000000000000@example.com:443?encryption=none&security=tls&type=ws&host=example.com&path=%2Fws&sni=example.com#Example%20VLESS
trojan://example-password@example.net:443?security=tls&sni=example.net#Example%20Trojan`

function warningMessage(warning: RoutingWarning, zh: boolean): string {
  const { count, code } = warning
  if (code === 'DIRECT_OVERRIDE') {
    return zh
      ? `${count} 项代理设置与自定义直连范围重叠，重叠部分优先直连。`
      : `${count} proxy settings overlap custom direct targets; overlapping traffic uses DIRECT.`
  }
  if (code === 'INTRANET_OVERRIDE') {
    return zh
      ? `${count} 项设置与内网范围重叠，内网 DNS 和直连规则优先。`
      : `${count} settings overlap intranet zones; intranet DNS and direct routing take priority.`
  }
  return zh
    ? `${count} 项设置与本机 / 局域网范围重叠，重叠部分优先直连。`
    : `${count} settings overlap local / LAN targets; overlapping traffic uses DIRECT.`
}

export default function App() {
  const [input, setInput] = useState('')
  const [format, setFormat] = useState<OutputFormat>('full')
  const [result, setResult] = useState<ReturnType<typeof convertLinks> | null>(
    null,
  )
  const [notice, setNotice] = useState('')
  const [dark, setDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
  const [zh, setZh] = useState(true)
  const [restored] = useState(loadSettings)
  const [storageFailed, setStorageFailed] = useState(restored.failed)
  const lastSaved = useRef(JSON.stringify(restored.settings))
  const [directInput, setDirectInput] = useState(restored.settings.directInput)
  const [proxyInput, setProxyInput] = useState(restored.settings.proxyInput)
  const [mode, setMode] = useState<'standard' | 'direct'>(
    restored.settings.mode,
  )
  const [presets, setPresets] = useState(restored.settings.presets)
  const [bypassCgnat, setBypassCgnat] = useState(restored.settings.bypassCgnat)
  const [intranetEnabled, setIntranetEnabled] = useState(
    restored.settings.intranetEnabled,
  )
  const [intranetSuffixInput, setIntranetSuffixInput] = useState(
    restored.settings.intranetSuffixInput,
  )
  const [intranetDnsInput, setIntranetDnsInput] = useState(
    restored.settings.intranetDnsInput,
  )
  const revision = useRef(0)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    document.documentElement.lang = zh ? 'zh-CN' : 'en'
  }, [zh])

  useEffect(() => {
    // Do not overwrite unreadable or future-version storage on initial mount.
    const settings = {
      directInput,
      proxyInput,
      intranetEnabled,
      intranetSuffixInput,
      intranetDnsInput,
      mode,
      presets,
      bypassCgnat,
    }
    const serialized = JSON.stringify(settings)
    if (serialized === lastSaved.current) return
    lastSaved.current = serialized
    setStorageFailed(!saveSettings(settings))
  }, [
    mode,
    presets,
    bypassCgnat,
    directInput,
    proxyInput,
    intranetEnabled,
    intranetSuffixInput,
    intranetDnsInput,
  ])

  const directDomains = useMemo(
    () => parseDomainList(directInput),
    [directInput],
  )
  const proxyDomains = useMemo(() => parseDomainList(proxyInput), [proxyInput])
  const intranet = useMemo(
    () =>
      parseIntranetConfig(
        intranetSuffixInput,
        intranetDnsInput,
        mode === 'direct',
      ),
    [intranetSuffixInput, intranetDnsInput, mode],
  )
  const routingInvalid =
    format === 'full' &&
    (directDomains.invalidLines.length > 0 ||
      proxyDomains.invalidLines.length > 0 ||
      (intranetEnabled &&
        (intranet.incomplete ||
          intranet.invalidSuffixLines.length > 0 ||
          intranet.invalidResolverLines.length > 0)))

  const routing = useMemo<CustomRouting>(
    () => ({
      mode,
      directDomains: directDomains.domains,
      proxyDomains: proxyDomains.domains,
      presets,
      bypassCgnat,
      intranet: intranetEnabled ? intranet.zones : [],
    }),
    [
      mode,
      directDomains,
      proxyDomains,
      presets,
      bypassCgnat,
      intranetEnabled,
      intranet,
    ],
  )

  const generated = useMemo(() => {
    if (routingInvalid) return { output: '', failed: false, warnings: [] }
    try {
      const warnings = format === 'full' ? buildRulePlan(routing).warnings : []
      const output = result?.nodes.length
        ? serializeMihomo(result.nodes, format, routing)
        : ''
      return { output, failed: false, warnings }
    } catch {
      // Never surface raw exceptions: parser/serializer input can contain secrets.
      return { output: '', failed: true, warnings: [] }
    }
  }, [routingInvalid, format, routing, result])
  const { output } = generated

  const invalidateNotice = () => {
    revision.current += 1
    setNotice('')
  }

  const changeInput = (value: string) => {
    invalidateNotice()
    setInput(value)
    setResult(null)
  }

  const convert = () => {
    invalidateNotice()
    setResult(convertLinks(input))
  }

  const clear = () => {
    invalidateNotice()
    setInput('')
    setResult(null)
  }

  const resetSettings = () => {
    invalidateNotice()
    setDirectInput('')
    setProxyInput('')
    setMode('standard')
    setPresets(defaultPresets)
    setBypassCgnat(false)
    setIntranetEnabled(false)
    setIntranetSuffixInput('')
    setIntranetDnsInput('')
    setStorageFailed(
      !saveSettings({
        mode: 'standard',
        presets: defaultPresets,
        bypassCgnat: false,
        directInput: '',
        proxyInput: '',
        intranetEnabled: false,
        intranetSuffixInput: '',
        intranetDnsInput: '',
      }),
    )
  }

  const copy = async () => {
    if (!output) return
    const copiedRevision = revision.current
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(output)
      if (copiedRevision === revision.current)
        setNotice(zh ? '已复制' : 'Copied')
    } catch {
      if (copiedRevision === revision.current) {
        setNotice(
          zh
            ? '复制失败，请手动选择输出内容并复制。'
            : 'Copy failed. Select the output and copy it manually.',
        )
      }
    }
  }

  const download = () => {
    if (!output) return
    let url: string | undefined
    const anchor = document.createElement('a')
    try {
      url = URL.createObjectURL(
        new Blob([output], { type: 'application/yaml;charset=utf-8' }),
      )
      anchor.href = url
      anchor.download = 'toclash.yaml'
      document.body.appendChild(anchor)
      anchor.click()
      setNotice(zh ? '已开始下载' : 'Download started')
    } catch {
      setNotice(
        zh
          ? '下载失败，请复制输出内容并保存为 toclash.yaml。'
          : 'Download failed. Copy the output and save it as toclash.yaml.',
      )
    } finally {
      anchor.remove()
      if (url) {
        const downloadUrl = url
        // Give Safari time to consume the Blob before releasing it.
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-ink transition-colors dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <a
            href="./"
            className="rounded text-xl font-bold tracking-tight focus:outline-none focus:ring-4 focus:ring-blue-500/20"
          >
            ToClash
          </a>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                invalidateNotice()
                setZh((value) => !value)
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-slate-700 dark:hover:bg-slate-800"
              aria-label={zh ? 'Switch to English' : '切换到简体中文'}
            >
              {zh ? 'English' : '简体中文'}
            </button>
            <ThemeToggle
              dark={dark}
              onToggle={() => setDark((value) => !value)}
              zh={zh}
            />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {zh ? '代理链接 → Clash YAML' : 'Proxy links → Clash YAML'}
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            {zh
              ? '将代理链接转换为 Clash / Mihomo 配置。所有数据仅在浏览器本地处理。'
              : 'Convert proxy links to Clash / Mihomo config. Everything stays in your browser.'}
          </p>
        </div>
        <div className="grid items-start gap-7 lg:grid-cols-2">
          <section className="min-w-0 space-y-5">
            <InputPanel value={input} onChange={changeInput} zh={zh} />
            <div className="flex flex-wrap items-end justify-between gap-4">
              <FormatSelector
                value={format}
                onChange={(value) => {
                  invalidateNotice()
                  setFormat(value)
                }}
                zh={zh}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => changeInput(example)}
                  className="button-secondary"
                >
                  {zh ? '示例' : 'Example'}
                </button>
                <button
                  type="button"
                  onClick={convert}
                  className="button-primary"
                >
                  {zh ? '转换' : 'Convert'}
                </button>
              </div>
            </div>
            {format === 'full' ? (
              <div className="space-y-3">
                <p
                  className="text-sm text-slate-600 dark:text-slate-400"
                  aria-live="polite"
                >
                  {storageFailed
                    ? zh
                      ? '本地设置读取或保存失败，当前内容可能无法在下次打开时恢复。请检查浏览器的网站存储权限，或重置已保存设置。'
                      : 'Local settings could not be read or saved. They may not survive reopening. Check site storage permissions or reset saved settings.'
                    : zh
                      ? '网络模式、服务选择、自定义分流和内网 DNS 自动保存在此浏览器；同一站点下次打开会恢复。清除网站数据会删除设置。'
                      : 'Network mode, service choices, custom routing and intranet DNS are saved in this browser and restored on this site. Clearing site data removes them.'}
                </p>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={resetSettings}
                >
                  {zh ? '重置已保存设置' : 'Reset saved settings'}
                </button>
                <div className="rounded-xl border border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <label htmlFor="network-mode" className="block font-semibold">
                    {zh ? '网络模式' : 'Network mode'}
                  </label>
                  <select
                    id="network-mode"
                    value={mode}
                    onChange={(event) => {
                      invalidateNotice()
                      setMode(event.target.value as 'standard' | 'direct')
                    }}
                    className="mt-3 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="standard">
                      {zh
                        ? '常规分流：国内直连，其他代理'
                        : 'Standard: mainland China direct, others proxied'}
                    </option>
                    <option value="direct">
                      {zh
                        ? '默认直连，仅指定服务代理'
                        : 'Direct by default, proxy selected services only'}
                    </option>
                  </select>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {mode === 'direct'
                      ? zh
                        ? '适合当前网络已能访问国际互联网。勾选下方需要代理的服务；其他流量直连，默认使用系统 DNS。代理出口在客户端的 FORCE_PROXY 中手动选择，不自动切换节点。'
                        : 'For networks with direct Internet access. Select services below to proxy; other traffic connects directly using system DNS. Choose the exit manually in FORCE_PROXY; nodes do not switch automatically.'
                      : zh
                        ? '中国大陆直连，其他流量交给 PROXY；保留原有分流和公共 DNS 设置。'
                        : 'Mainland China connects directly; other traffic uses PROXY with the existing public DNS settings.'}
                  </p>
                </div>
                <RuleSettings
                  directMode={mode === 'direct'}
                  presets={presets}
                  bypassCgnat={bypassCgnat}
                  onPresetChange={(id, enabled) => {
                    invalidateNotice()
                    setPresets((current) => ({ ...current, [id]: enabled }))
                  }}
                  onCgnatChange={(enabled) => {
                    invalidateNotice()
                    setBypassCgnat(enabled)
                  }}
                  zh={zh}
                />
                <RoutingOptions
                  directMode={mode === 'direct'}
                  direct={directInput}
                  proxy={proxyInput}
                  directInvalid={directDomains.invalidLines}
                  proxyInvalid={proxyDomains.invalidLines}
                  directCount={directDomains.domains.length}
                  proxyCount={proxyDomains.domains.length}
                  onDirectChange={(value) => {
                    invalidateNotice()
                    setDirectInput(value)
                  }}
                  onProxyChange={(value) => {
                    invalidateNotice()
                    setProxyInput(value)
                  }}
                  zh={zh}
                />
                <IntranetSettings
                  directMode={mode === 'direct'}
                  enabled={intranetEnabled}
                  suffixInput={intranetSuffixInput}
                  dnsInput={intranetDnsInput}
                  invalidSuffixLines={intranet.invalidSuffixLines}
                  invalidResolverLines={intranet.invalidResolverLines}
                  incomplete={intranet.incomplete}
                  onEnabledChange={(enabled) => {
                    invalidateNotice()
                    setIntranetEnabled(enabled)
                  }}
                  onSuffixChange={(value) => {
                    invalidateNotice()
                    setIntranetSuffixInput(value)
                  }}
                  onDnsChange={(value) => {
                    invalidateNotice()
                    setIntranetDnsInput(value)
                  }}
                  zh={zh}
                />
              </div>
            ) : (
              <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                {zh
                  ? '仅 proxies 模式不包含 DNS、策略组或分流规则。分流设置和其中的错误在此模式下不参与导出；切回完整配置后保留。'
                  : 'Proxies-only output contains no DNS, groups, or routing rules. Routing settings and their errors do not affect this mode; your settings are kept when you switch back.'}
              </p>
            )}
            {result && (
              <div className="text-sm font-medium" aria-live="polite">
                {zh
                  ? `检测到 ${result.total} 条链接 · 成功 ${result.success} 条 · 失败 ${result.failed} 条`
                  : `${result.total} links detected · ${result.success} converted · ${result.failed} failed`}
              </div>
            )}
            <ErrorList
              errors={result?.errors ?? []}
              warnings={result?.warnings ?? []}
              zh={zh}
            />
          </section>
          <section className="min-w-0 space-y-4">
            {(routingInvalid || generated.failed) && (
              <div
                role="alert"
                className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm leading-6 text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
              >
                {routingInvalid
                  ? zh
                    ? '分流设置有误：请修正自定义目标的无效行，或补齐内网域名和 DNS。为避免导出与要求不符的配置，输出已暂停。'
                    : 'Routing settings need attention: correct invalid custom targets or complete the intranet domain and DNS fields. Output is paused to avoid exporting an unintended configuration.'
                  : zh
                    ? '无法安全生成配置，请检查节点和分流设置后重试。未导出任何部分配置。'
                    : 'Could not safely generate the configuration. Check nodes and routing settings, then retry. No partial configuration was exported.'}
              </div>
            )}
            {generated.warnings.length > 0 && (
              <section
                aria-live="polite"
                className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
              >
                <h2 className="font-semibold">
                  {zh ? '分流覆盖提示' : 'Routing overlap notices'}
                </h2>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {generated.warnings.map((warning) => (
                    <li key={warning.code}>{warningMessage(warning, zh)}</li>
                  ))}
                </ul>
              </section>
            )}
            <OutputPanel value={output} zh={zh} />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!output}
                onClick={copy}
                className="button-secondary"
              >
                {zh ? '复制' : 'Copy'}
              </button>
              <button
                type="button"
                disabled={!output}
                onClick={download}
                className="button-secondary"
              >
                {zh ? '下载 YAML' : 'Download YAML'}
              </button>
              <button
                type="button"
                onClick={clear}
                className="button-secondary"
              >
                {zh ? '清空节点和结果' : 'Clear nodes and output'}
              </button>
            </div>
            <div
              className="min-h-6 text-sm text-slate-600 dark:text-slate-400"
              role="status"
            >
              {notice}
            </div>
          </section>
        </div>
      </main>
      <footer className="mx-auto max-w-6xl border-t border-slate-200 px-5 py-8 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
        <p>
          {zh
            ? '代理链接仅在你的浏览器本地处理，不会上传任何数据。'
            : 'Your proxy links are processed locally in your browser. No data is uploaded.'}
        </p>
        <p className="mt-2">
          ToClash v{packageJson.version} · Apache 2.0 License
        </p>
      </footer>
    </div>
  )
}
