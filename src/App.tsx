import { useEffect, useMemo, useState } from 'react'
import { ErrorList } from './components/ErrorList'
import { FormatSelector } from './components/FormatSelector'
import { InputPanel } from './components/InputPanel'
import { OutputPanel } from './components/OutputPanel'
import { ThemeToggle } from './components/ThemeToggle'
import { convertLinks } from './core/parser'
import { serializeMihomo, type OutputFormat } from './core/serializer/yaml'

const example = `vless://00000000-0000-4000-8000-000000000000@example.com:443?encryption=none&security=tls&type=ws&host=example.com&path=%2Fws&sni=example.com#Example%20VLESS
trojan://example-password@example.net:443?security=tls&sni=example.net#Example%20Trojan`

export default function App() {
  const [input, setInput] = useState(''); const [format, setFormat] = useState<OutputFormat>('full'); const [result, setResult] = useState<ReturnType<typeof convertLinks> | null>(null)
  const [notice, setNotice] = useState(''); const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])
  const output = useMemo(() => result?.nodes.length ? serializeMihomo(result.nodes, format) : '', [result, format])
  const convert = () => { setResult(convertLinks(input)); setNotice('') }
  const clear = () => { setInput(''); setResult(null); setNotice('') }
  const copy = async () => { if (!output) return; try { if (!navigator.clipboard) throw new Error(); await navigator.clipboard.writeText(output); setNotice('Copied') } catch { setNotice('Copy failed. Select the output and copy it manually.') } }
  const download = () => { if (!output) return; const url = URL.createObjectURL(new Blob([output], { type: 'application/yaml;charset=utf-8' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'toclash.yaml'; anchor.click(); URL.revokeObjectURL(url); setNotice('Download started') }
  return <div className="min-h-screen bg-slate-50 text-ink transition-colors dark:bg-slate-950 dark:text-slate-100">
    <header className="border-b border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/80"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><a href="./" className="text-xl font-bold tracking-tight">ToClash</a><ThemeToggle dark={dark} onToggle={() => setDark((value) => !value)} /></div></header>
    <main className="mx-auto max-w-6xl px-5 py-10"><div className="mb-8"><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Proxy links → Clash YAML</h1><p className="mt-3 text-slate-600 dark:text-slate-400">Convert proxy links to Clash / Mihomo config. Everything stays in your browser.</p></div>
      <div className="grid gap-7 lg:grid-cols-2"><section className="space-y-5"><InputPanel value={input} onChange={setInput} /><div className="flex flex-wrap items-end justify-between gap-4"><FormatSelector value={format} onChange={setFormat} /><div className="flex gap-2"><button type="button" onClick={() => { setInput(example); setResult(null) }} className="button-secondary">Example</button><button type="button" onClick={convert} className="button-primary">Convert</button></div></div>{result && <div className="text-sm font-medium" aria-live="polite">{result.total} links detected · {result.success} converted · {result.failed} failed</div>}<ErrorList errors={result?.errors ?? []} warnings={result?.warnings ?? []} /></section>
        <section className="space-y-4"><OutputPanel value={output} /><div className="flex flex-wrap gap-2"><button type="button" disabled={!output} onClick={copy} className="button-secondary">Copy</button><button type="button" disabled={!output} onClick={download} className="button-secondary">Download YAML</button><button type="button" onClick={clear} className="button-secondary">Clear</button></div><div className="min-h-6 text-sm text-slate-600 dark:text-slate-400" role="status">{notice}</div></section></div>
    </main><footer className="mx-auto max-w-6xl border-t border-slate-200 px-5 py-8 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400"><p>Your proxy links are processed locally in your browser. No data is uploaded.</p><p className="mt-2"><a className="underline hover:text-blue-600" href="https://github.com/ForceMind/ToClash" rel="noreferrer">GitHub</a><span aria-hidden="true"> · </span>Apache 2.0 License</p></footer>
  </div>
}
