import { useRef } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  onYamlImport: (value: string) => void
  onYamlImportError: () => void
  zh: boolean
}

export function InputPanel({
  value,
  onChange,
  onYamlImport,
  onYamlImportError,
  zh,
}: Props) {
  const fileInput = useRef<HTMLInputElement>(null)

  const importFile = async (file: File | undefined) => {
    if (!file) return
    try {
      onYamlImport(await file.text())
    } catch {
      onYamlImportError()
    }
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor="proxy-input" className="text-sm font-semibold">
          {zh ? '代理链接或 Clash YAML' : 'Proxy links or Clash YAML'}
        </label>
        <input
          ref={fileInput}
          type="file"
          accept=".yaml,.yml,application/yaml,application/x-yaml,text/yaml,text/plain"
          aria-label={zh ? '选择 YAML 文件' : 'Choose YAML file'}
          className="sr-only"
          onChange={(event) => {
            void importFile(event.currentTarget.files?.[0])
            event.currentTarget.value = ''
          }}
        />
        <button
          type="button"
          className="rounded border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-slate-600 dark:hover:bg-slate-800"
          onClick={() => fileInput.current?.click()}
        >
          {zh ? '导入 YAML 文件' : 'Import YAML file'}
        </button>
      </div>
      <p className="mb-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
        {zh
          ? '可逐行粘贴代理链接，也可直接粘贴完整 Clash / Mihomo YAML。YAML 导入会保留节点和未由 ToClash 接管的配置；原始 YAML 与节点凭据不会保存到浏览器。'
          : 'Paste proxy links one per line, or paste a full Clash / Mihomo YAML profile. YAML import preserves nodes and settings not managed by ToClash; the raw YAML and node credentials are not saved in your browser.'}
      </p>
      <textarea
        id="proxy-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        placeholder={
          zh
            ? '每行一个代理链接\n\nvless://...\nvmess://...\ntrojan://...\n\n或粘贴完整 Clash YAML'
            : 'One proxy link per line\n\nvless://...\nvmess://...\ntrojan://...\n\nOr paste a full Clash YAML profile'
        }
        className="min-h-64 w-full resize-y rounded-xl border border-slate-300 bg-white p-4 font-mono text-sm leading-6 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
    </div>
  )
}
