interface Props {
  enabled: boolean
  suffixInput: string
  dnsInput: string
  invalidSuffixLines: number[]
  invalidResolverLines: number[]
  incomplete: boolean
  onEnabledChange: (enabled: boolean) => void
  onSuffixChange: (value: string) => void
  onDnsChange: (value: string) => void
  zh: boolean
}

const inputClass =
  'mt-2 min-h-24 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950'

export function IntranetSettings({
  enabled,
  suffixInput,
  dnsInput,
  invalidSuffixLines,
  invalidResolverLines,
  incomplete,
  onEnabledChange,
  onSuffixChange,
  onDnsChange,
  zh,
}: Props) {
  return (
    <details className="rounded-xl border border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <summary className="cursor-pointer rounded font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/20">
        {zh
          ? '企业 / 家庭内网 DNS（可选）'
          : 'Enterprise / home intranet DNS (optional)'}
      </summary>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
        {zh
          ? '需要访问公司或家庭内网时，填写你自己的域名后缀和内网 DNS。生成的配置会同时设置专用 DNS、排除 fake-IP 和 DIRECT 直连。'
          : 'For company or home services, provide your domain suffixes and internal DNS servers. The config adds dedicated DNS, fake-IP exclusions, and DIRECT routing together.'}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
        {zh
          ? '.lan、.home.arpa 等本地域名默认不会发往公网 DNS，需填写可达的内网 DNS 后才能解析；.local 的 mDNS 仍由系统处理。'
          : 'Local zones such as .lan and .home.arpa are not queried through public DNS by default; configure a reachable intranet DNS server to resolve them. The operating system still handles .local mDNS.'}
      </p>
      <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onEnabledChange(event.target.checked)}
          aria-controls={enabled ? 'intranet-fields' : undefined}
          aria-expanded={enabled}
          className="h-4 w-4 accent-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/25"
        />
        {zh ? '启用内网 DNS 分流' : 'Enable intranet DNS routing'}
      </label>
      {enabled && (
        <div id="intranet-fields" className="mt-4 space-y-3">
          <div>
            <label
              htmlFor="intranet-suffixes"
              className="block text-sm font-semibold"
            >
              {zh
                ? '内网域名后缀（每行一个）'
                : 'Intranet domain suffixes (one per line)'}
            </label>
            <textarea
              id="intranet-suffixes"
              value={suffixInput}
              onChange={(event) => onSuffixChange(event.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="corp.example"
              aria-invalid={
                invalidSuffixLines.length > 0 ||
                (incomplete && !suffixInput.trim())
              }
              aria-describedby="intranet-validation intranet-help"
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="intranet-resolvers"
              className="block text-sm font-semibold"
            >
              {zh
                ? '内网 DNS 服务器（每行一个）'
                : 'Intranet DNS servers (one per line)'}
            </label>
            <textarea
              id="intranet-resolvers"
              value={dnsInput}
              onChange={(event) => onDnsChange(event.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              placeholder={'192.168.1.1\n[fd00::53]:53'}
              aria-invalid={
                invalidResolverLines.length > 0 ||
                (incomplete && !dnsInput.trim())
              }
              aria-describedby="intranet-validation intranet-help"
              className={inputClass}
            />
          </div>
          <p
            id="intranet-help"
            className="text-xs leading-5 text-slate-600 dark:text-slate-400"
          >
            {zh
              ? '仅接受 DNS 服务器的 IPv4 / IPv6 地址，可附端口；所有后缀共用这组服务器。示例只是格式提示，不会自动填入。内网或 VPN 必须已连通；ToClash 不会修改系统 DNS、浏览器 DNS 或 TUN。'
              : 'DNS servers must be IPv4 / IPv6 addresses with an optional port. All suffixes share this server list. Placeholders are not applied. Your intranet or VPN must already be reachable; ToClash does not modify system DNS, browser DNS, or TUN.'}
          </p>
          <div
            id="intranet-validation"
            className="text-xs leading-5 text-red-700 dark:text-red-300"
            aria-live="polite"
          >
            {incomplete && (
              <p>
                {zh
                  ? '请同时填写内网域名后缀和 DNS 服务器。'
                  : 'Provide both domain suffixes and DNS servers.'}
              </p>
            )}
            {invalidSuffixLines.length > 0 && (
              <p>
                {zh
                  ? `域名后缀无效行：${invalidSuffixLines.join('、')}`
                  : `Invalid suffix lines: ${invalidSuffixLines.join(', ')}`}
              </p>
            )}
            {invalidResolverLines.length > 0 && (
              <p>
                {zh
                  ? `DNS 服务器无效行：${invalidResolverLines.join('、')}`
                  : `Invalid DNS server lines: ${invalidResolverLines.join(', ')}`}
              </p>
            )}
          </div>
        </div>
      )}
    </details>
  )
}
