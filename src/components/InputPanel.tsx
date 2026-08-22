interface Props { value: string; onChange: (value: string) => void }

export function InputPanel({ value, onChange }: Props) {
  return <div><label htmlFor="proxy-input" className="mb-2 block text-sm font-semibold">Proxy links</label><textarea id="proxy-input" value={value} onChange={(event) => onChange(event.target.value)} spellCheck={false} placeholder={'Paste one proxy link per line\n\nvless://...\nvmess://...\ntrojan://...'} className="min-h-64 w-full resize-y rounded-xl border border-slate-300 bg-white p-4 font-mono text-sm leading-6 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" /></div>
}
