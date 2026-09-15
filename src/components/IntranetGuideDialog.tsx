import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { parseRoutingTarget } from '../core/utils/domain'
import { normalizeDnsServer } from '../core/utils/intranet'

interface Props {
  open: boolean
  directMode: boolean
  initialSuffix: string
  initialDns: string
  onApply: (suffix: string, dns: string) => void
  onClose: () => void
  zh: boolean
}

type Step = 0 | 1 | 2

function validSuffixes(input: string): boolean {
  const values = input.split(/\r?\n/).filter((line) => line.trim())
  return (
    values.length > 0 &&
    values.every((line) => {
      const value = line.trim()
      const target = parseRoutingTarget(value)
      return target?.kind === 'domain' && !/[:/?#]/.test(value)
    })
  )
}

function validDns(input: string, optional: boolean): boolean {
  const values = input.split(/\r?\n/).filter((line) => line.trim())
  return (
    (optional || values.length > 0) &&
    values.every((line) => normalizeDnsServer(line) !== null)
  )
}

export function IntranetGuideDialog({
  open,
  directMode,
  initialSuffix,
  initialDns,
  onApply,
  onClose,
  zh,
}: Props) {
  const [step, setStep] = useState<Step>(0)
  const [suffix, setSuffix] = useState('')
  const [dns, setDns] = useState('')
  const dialogRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const suffixRef = useRef<HTMLTextAreaElement>(null)
  const dnsRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return
    setStep(0)
    setSuffix(initialSuffix)
    setDns(initialDns)
  }, [open, initialSuffix, initialDns])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    if (step === 0) closeRef.current?.focus()
    else if (step === 1) suffixRef.current?.focus()
    else dnsRef.current?.focus()
  }, [open, step])

  if (!open) return null

  const suffixReady = validSuffixes(suffix)
  const dnsReady = validDns(dns, directMode)
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key !== 'Tab') return
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), textarea:not([disabled])',
    )
    if (!focusable?.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="intranet-guide-title"
        aria-describedby="intranet-guide-description"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl outline-none dark:border-slate-700 dark:bg-slate-900 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300"
              aria-live="polite"
            >
              {zh ? `第 ${step + 1} 步，共 3 步` : `Step ${step + 1} of 3`}
            </p>
            <h2 id="intranet-guide-title" className="mt-1 text-xl font-bold">
              {zh ? '内网 DNS 新手填写引导' : 'Intranet DNS setup guide'}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={zh ? '关闭填写引导' : 'Close setup guide'}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            {zh ? '关闭' : 'Close'}
          </button>
        </div>

        <p
          id="intranet-guide-description"
          className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300"
        >
          {zh
            ? '向导不会提供默认域名或 DNS。主表单已有内容时会显示现有值；只有点击“应用到表单”后，修改才会写入页面。'
            : 'The guide does not provide a default domain or DNS server. Existing form entries are shown for editing; changes are written only after you select “Apply to form”.'}
        </p>

        <div className="mt-5 min-h-56">
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {zh ? '先准备这些信息' : 'Prepare these details'}
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700 dark:text-slate-200">
                <li>
                  {zh
                    ? '网络管理员提供的内网域名后缀。'
                    : 'The intranet domain suffix provided by your network administrator.'}
                </li>
                <li>
                  {zh
                    ? '可访问该域名的内网 DNS IP；默认直连模式也可以沿用系统 DNS。'
                    : 'An internal DNS IP that can resolve the domain; direct mode may use system DNS instead.'}
                </li>
                <li>
                  {zh
                    ? '已经连接公司网络、家庭网络或相应 VPN。'
                    : 'An active connection to the company, home network, or required VPN.'}
                </li>
              </ul>
              <p className="rounded-lg bg-slate-100 p-3 text-sm leading-6 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {zh
                  ? '不知道后缀或 DNS 时先询问管理员，不要照抄占位示例。'
                  : 'Ask your administrator if you do not know the suffix or DNS; do not copy placeholder examples.'}
              </p>
            </div>
          )}

          {step === 1 && (
            <div>
              <label
                htmlFor="guide-intranet-suffixes"
                className="block text-lg font-semibold"
              >
                {zh ? '填写内网域名后缀' : 'Enter intranet domain suffixes'}
              </label>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {zh
                  ? '每行一个裸域名，不加 https://、路径或端口。下面只是格式占位，不会自动填入。'
                  : 'Enter one bare domain per line, without https://, paths, or ports. The placeholder shows format only and is not applied.'}
              </p>
              <textarea
                ref={suffixRef}
                id="guide-intranet-suffixes"
                value={suffix}
                onChange={(event) => setSuffix(event.target.value)}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                placeholder="corp.example"
                aria-invalid={Boolean(suffix.trim()) && !suffixReady}
                aria-describedby="guide-suffix-validation"
                className="mt-3 min-h-32 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950"
              />
              <p
                id="guide-suffix-validation"
                className="mt-2 min-h-5 text-sm text-red-700 dark:text-red-300"
                aria-live="polite"
              >
                {suffix.trim() && !suffixReady
                  ? zh
                    ? '请填写有效的裸域名后缀。'
                    : 'Enter valid bare domain suffixes.'
                  : ''}
              </p>
            </div>
          )}

          {step === 2 && (
            <div>
              <label
                htmlFor="guide-intranet-dns"
                className="block text-lg font-semibold"
              >
                {zh
                  ? directMode
                    ? '填写内网 DNS（可选）'
                    : '填写内网 DNS'
                  : directMode
                    ? 'Enter intranet DNS (optional)'
                    : 'Enter intranet DNS'}
              </label>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {directMode
                  ? zh
                    ? '可留空沿用系统 DNS；如需指定服务器，每行填写一个 IPv4 或 IPv6 地址。'
                    : 'Leave blank to use system DNS, or enter one IPv4 or IPv6 server per line.'
                  : zh
                    ? '每行填写一个可达的 IPv4 或 IPv6 DNS 地址。下面只是文档保留地址的格式占位。'
                    : 'Enter one reachable IPv4 or IPv6 DNS address per line. The placeholder is a documentation-only address.'}
              </p>
              <textarea
                ref={dnsRef}
                id="guide-intranet-dns"
                value={dns}
                onChange={(event) => setDns(event.target.value)}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                placeholder="192.0.2.53"
                aria-invalid={Boolean(dns.trim()) && !dnsReady}
                aria-describedby="guide-dns-validation"
                className="mt-3 min-h-32 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950"
              />
              <p
                id="guide-dns-validation"
                className="mt-2 min-h-5 text-sm text-red-700 dark:text-red-300"
                aria-live="polite"
              >
                {!dnsReady && dns.trim()
                  ? zh
                    ? '请填写有效的 DNS IP 地址。'
                    : 'Enter valid DNS IP addresses.'
                  : !directMode && !dns.trim()
                    ? zh
                      ? '常规模式需要填写内网 DNS。'
                      : 'Standard mode requires an intranet DNS server.'
                    : ''}
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
          <button type="button" onClick={onClose} className="button-secondary">
            {zh ? '稍后填写' : 'Fill later'}
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((step - 1) as Step)}
                className="button-secondary"
              >
                {zh ? '上一步' : 'Back'}
              </button>
            )}
            {step < 2 ? (
              <button
                type="button"
                onClick={() => setStep((step + 1) as Step)}
                disabled={step === 1 && !suffixReady}
                className="button-primary"
              >
                {zh ? '下一步' : 'Next'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onApply(suffix.trim(), dns.trim())}
                disabled={!suffixReady || !dnsReady}
                className="button-primary"
              >
                {zh ? '应用到表单' : 'Apply to form'}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
