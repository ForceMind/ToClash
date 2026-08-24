import { useEffect, useMemo, useState } from 'react'
import { ErrorList } from './components/ErrorList'
import { FormatSelector } from './components/FormatSelector'
import { InputPanel } from './components/InputPanel'
import { OutputPanel } from './components/OutputPanel'
import { RoutingOptions } from './components/RoutingOptions'
import { ThemeToggle } from './components/ThemeToggle'
import { convertLinks } from './core/parser'
import { serializeMihomo, type OutputFormat } from './core/serializer/yaml'
import { parseDomainList } from './core/utils/domain'

const example = `vless://00000000-0000-4000-8000-000000000000@example.com:443?encryption=none&security=tls&type=ws&host=example.com&path=%2Fws&sni=example.com#Example%20VLESS
trojan://example-password@example.net:443?security=tls&sni=example.net#Example%20Trojan`

export default function App() {
  const [input, setInput] = useState(''); const [format, setFormat] = useState<OutputFormat>('full'); const [result, setResult] = useState<ReturnType<typeof convertLinks> | null>(null)
  const [notice, setNotice] = useState(''); const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches); const [zh, setZh] = useState(true)
  const [directInput, setDirectInput] = useState(''); const [proxyInput, setProxyInput] = useState('')
  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])
  const directDomains = useMemo(() => parseDomainList(directInput), [directInput]); const proxyDomains = useMemo(() => parseDomainList(proxyInput), [proxyInput])
  const output = useMemo(() => result?.nodes.length ? serializeMihomo(result.nodes, format, { directDomains: directDomains.domains, proxyDomains: proxyDomains.domains }) : '', [result, format, directDomains, proxyDomains])
  const convert = () => { setResult(convertLinks(input)); setNotice('') }
  const clear = () => { setInput(''); setDirectInput(''); setProxyInput(''); setResult(null); setNotice('') }
  const copy = async () => { if (!output) return; try { if (!navigator.clipboard) throw new Error(); await navigator.clipboard.writeText(output); setNotice(zh ? '已复制' : 'Copied') } catch { setNotice(zh ? '复制失败，请手动选择输出内容并复制。' : 'Copy failed. Select the output and copy it manually.') } }
  const download = () => { if (!output) return; const url = URL.createObjectURL(new Blob([output], { type: 'application/yaml;charset=utf-8' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'toclash.yaml'; anchor.click(); URL.revokeObjectURL(url); setNotice(zh ? '已开始下载' : 'Download started') }
  return <div className="min-h-screen bg-slate-50 text-ink transition-colors dark:bg-slate-950 dark:text-slate-100">
    <header className="border-b border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/80"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><a href="./" className="text-xl font-bold tracking-tight">ToClash</a><div className="flex gap-2"><button type="button" onClick={() => { setZh((value) => !value); setNotice('') }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-slate-700 dark:hover:bg-slate-800" aria-label={zh ? 'Switch to English' : '切换到简体中文'}>{zh ? 'English' : '简体中文'}</button><ThemeToggle dark={dark} onToggle={() => setDark((value) => !value)} zh={zh} /></div></div></header>
    <main className="mx-auto max-w-6xl px-5 py-10"><div className="mb-8"><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{zh ? '代理链接 → Clash YAML' : 'Proxy links → Clash YAML'}</h1><p className="mt-3 text-slate-600 dark:text-slate-400">{zh ? '将代理链接转换为 Clash / Mihomo 配置。所有数据仅在浏览器本地处理。' : 'Convert proxy links to Clash / Mihomo config. Everything stays in your browser.'}</p></div>
      <div className="grid gap-7 lg:grid-cols-2"><section className="space-y-5"><InputPanel value={input} onChange={setInput} zh={zh} /><div className="flex flex-wrap items-end justify-between gap-4"><FormatSelector value={format} onChange={setFormat} zh={zh} /><div className="flex gap-2"><button type="button" onClick={() => { setInput(example); setResult(null) }} className="button-secondary">{zh ? '示例' : 'Example'}</button><button type="button" onClick={convert} className="button-primary">{zh ? '转换' : 'Convert'}</button></div></div>{format === 'full' && <RoutingOptions direct={directInput} proxy={proxyInput} directInvalid={directDomains.invalidLines} proxyInvalid={proxyDomains.invalidLines} directCount={directDomains.domains.length} proxyCount={proxyDomains.domains.length} onDirectChange={setDirectInput} onProxyChange={setProxyInput} zh={zh} />}{result && <div className="text-sm font-medium" aria-live="polite">{zh ? `检测到 ${result.total} 条链接 · 成功 ${result.success} 条 · 失败 ${result.failed} 条` : `${result.total} links detected · ${result.success} converted · ${result.failed} failed`}</div>}<ErrorList errors={result?.errors ?? []} warnings={result?.warnings ?? []} zh={zh} /></section>
        <section className="space-y-4"><OutputPanel value={output} zh={zh} /><div className="flex flex-wrap gap-2"><button type="button" disabled={!output} onClick={copy} className="button-secondary">{zh ? '复制' : 'Copy'}</button><button type="button" disabled={!output} onClick={download} className="button-secondary">{zh ? '下载 YAML' : 'Download YAML'}</button><button type="button" onClick={clear} className="button-secondary">{zh ? '清空' : 'Clear'}</button></div><div className="min-h-6 text-sm text-slate-600 dark:text-slate-400" role="status">{notice}</div></section></div>
    </main><footer className="mx-auto max-w-6xl border-t border-slate-200 px-5 py-8 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400"><p>{zh ? '代理链接仅在你的浏览器本地处理，不会上传任何数据。' : 'Your proxy links are processed locally in your browser. No data is uploaded.'}</p><p className="mt-2">Apache 2.0 License</p></footer>
  </div>
}
