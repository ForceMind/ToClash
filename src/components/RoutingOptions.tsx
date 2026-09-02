interface Props {
  direct: string
  proxy: string
  directInvalid: number[]
  proxyInvalid: number[]
  directCount: number
  proxyCount: number
  onDirectChange: (value: string) => void
  onProxyChange: (value: string) => void
  zh: boolean
}

const inputClass =
  'mt-2 min-h-28 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950'

export function RoutingOptions({
  direct,
  proxy,
  directInvalid,
  proxyInvalid,
  directCount,
  proxyCount,
  onDirectChange,
  onProxyChange,
  zh,
}: Props) {
  return (
    <details className="rounded-xl border border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <summary className="cursor-pointer rounded font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/20">
        {zh ? '自定义网站分流（可选）' : 'Custom website routing (optional)'}
      </summary>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
        {zh
          ? '每行一个域名、网址或 IP。网址只提取主机名；域名包含其子域名，IP 仅匹配该地址。请勿填写逗号分隔的 Clash 规则。内容仅保存在当前页面内存。'
          : 'One domain, URL, or IP per line. URLs contribute only their hostname; domains include subdomains, while IPs match exactly. Do not paste comma-separated Clash rules. Values stay in page memory.'}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="direct-domains"
            className="block text-sm font-semibold"
          >
            {zh ? '第 1 步：始终直连' : 'Step 1: Always direct'}
          </label>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
            {zh
              ? '使用 DIRECT，不经过代理节点。需要专用 DNS 的内网，请同时设置下方“内网 DNS”。'
              : 'Use DIRECT without a proxy node. If an intranet needs its own DNS, also configure Intranet DNS below.'}
          </p>
          <textarea
            id="direct-domains"
            value={direct}
            onChange={(event) => onDirectChange(event.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder={'bank.example.cn\n192.168.1.10'}
            aria-invalid={directInvalid.length > 0}
            aria-describedby="direct-domains-status"
            className={inputClass}
          />
          <p
            id="direct-domains-status"
            className="mt-1 text-xs leading-5"
            aria-live="polite"
          >
            {zh
              ? `已识别 ${directCount} 个直连目标`
              : `${directCount} direct targets recognized`}
            {directInvalid.length > 0 && (
              <span className="text-red-700 dark:text-red-300">
                {zh
                  ? `；无效行：${directInvalid.join('、')}。请修正后再导出。`
                  : `; invalid lines: ${directInvalid.join(', ')}. Correct them before exporting.`}
              </span>
            )}
          </p>
        </div>
        <div>
          <label
            htmlFor="proxy-domains"
            className="block text-sm font-semibold"
          >
            {zh ? '第 2 步：始终代理' : 'Step 2: Always proxy'}
          </label>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
            {zh
              ? '使用 FORCE_PROXY，只能选择代理节点或 AUTO，不提供 DIRECT 选项。'
              : 'Use FORCE_PROXY, which offers only proxy nodes or AUTO, never DIRECT.'}
          </p>
          <textarea
            id="proxy-domains"
            value={proxy}
            onChange={(event) => onProxyChange(event.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder={'example.com\nhttps://app.example.net/path'}
            aria-invalid={proxyInvalid.length > 0}
            aria-describedby="proxy-domains-status"
            className={inputClass}
          />
          <p
            id="proxy-domains-status"
            className="mt-1 text-xs leading-5"
            aria-live="polite"
          >
            {zh
              ? `已识别 ${proxyCount} 个代理目标`
              : `${proxyCount} proxy targets recognized`}
            {proxyInvalid.length > 0 && (
              <span className="text-red-700 dark:text-red-300">
                {zh
                  ? `；无效行：${proxyInvalid.join('、')}。请修正后再导出。`
                  : `; invalid lines: ${proxyInvalid.join(', ')}. Correct them before exporting.`}
              </span>
            )}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-400">
        {zh
          ? '优先级：本机 / 内网直连 → 自定义直连 → 自定义代理 → 服务预设 → 中国大陆直连 → PROXY 兜底。发生覆盖时直连优先。规则仅约束交给 Mihomo 的流量，不是系统级防泄漏开关。'
          : 'Priority: local / intranet direct → custom direct → custom proxy → service presets → mainland China direct → PROXY fallback. Direct wins overlaps. Rules apply only to traffic handled by Mihomo; they are not a system-wide kill switch.'}
      </p>
    </details>
  )
}
