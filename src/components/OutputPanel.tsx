interface Props { value: string }

export function OutputPanel({ value }: Props) {
  return <div><label htmlFor="yaml-output" className="mb-2 block text-sm font-semibold">Mihomo YAML</label><textarea id="yaml-output" value={value} readOnly spellCheck={false} placeholder="Converted YAML appears here." className="min-h-80 w-full resize-y rounded-xl border border-slate-300 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700" /></div>
}
