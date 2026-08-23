import type { OutputFormat } from '../core/serializer/yaml'

interface Props { value: OutputFormat; onChange: (value: OutputFormat) => void; zh: boolean }

export function FormatSelector({ value, onChange, zh }: Props) {
  return <fieldset><legend className="mb-2 text-sm font-semibold">{zh ? '输出格式' : 'Output format'}</legend><div className="flex gap-5 text-sm"><label className="flex cursor-pointer items-center gap-2"><input type="radio" name="format" checked={value === 'full'} onChange={() => onChange('full')} /> {zh ? '完整配置' : 'Full config'}</label><label className="flex cursor-pointer items-center gap-2"><input type="radio" name="format" checked={value === 'proxies'} onChange={() => onChange('proxies')} /> {zh ? '仅 proxies' : 'proxies only'}</label></div></fieldset>
}
