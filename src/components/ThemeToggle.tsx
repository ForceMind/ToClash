export function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return <button type="button" onClick={onToggle} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-slate-700 dark:hover:bg-slate-800">{dark ? 'Light' : 'Dark'}</button>
}
