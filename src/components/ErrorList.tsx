import type { ConversionIssue } from '../core/model/proxy'

export function ErrorList({ errors, warnings }: { errors: ConversionIssue[]; warnings: ConversionIssue[] }) {
  if (!errors.length && !warnings.length) return null
  return <div className="space-y-3" aria-live="polite">
    {errors.length > 0 && <section className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"><h2 className="font-semibold">Could not convert</h2><ul className="mt-2 list-disc space-y-1 pl-5">{errors.map((issue, index) => <li key={`${issue.line}-${issue.code}-${index}`}>Line {issue.line}: {issue.message}</li>)}</ul></section>}
    {warnings.length > 0 && <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><h2 className="font-semibold">Warnings</h2><ul className="mt-2 list-disc space-y-1 pl-5">{warnings.map((issue, index) => <li key={`${issue.line}-${issue.code}-${index}`}>Line {issue.line}: {issue.message}</li>)}</ul></section>}
  </div>
}
