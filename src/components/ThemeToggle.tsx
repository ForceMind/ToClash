export function ThemeToggle({ dark, onToggle, zh }: { dark: boolean; onToggle: () => void; zh: boolean }) {
  const label = dark ? (zh ? '浅色' : 'Light') : (zh ? '深色' : 'Dark')
  return <button type="button" onClick={onToggle} aria-label={zh ? `切换到${label}模式` : `Switch to ${label.toLowerCase()} mode`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-slate-700 dark:hover:bg-slate-800">{label}</button>
}
