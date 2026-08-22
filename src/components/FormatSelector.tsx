import type { OutputFormat } from '../core/serializer/yaml'

interface Props { value: OutputFormat; onChange: (value: OutputFormat) => void }

export function FormatSelector({ value, onChange }: Props) {
  return <fieldset><legend className="mb-2 text-sm font-semibold">Output format</legend><div className="flex gap-5 text-sm"><label className="flex cursor-pointer items-center gap-2"><input type="radio" name="format" checked={value === 'full'} onChange={() => onChange('full')} /> Full config</label><label className="flex cursor-pointer items-center gap-2"><input type="radio" name="format" checked={value === 'proxies'} onChange={() => onChange('proxies')} /> proxies only</label></div></fieldset>
}
