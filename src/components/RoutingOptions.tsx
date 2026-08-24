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

export function RoutingOptions(props: Props) {
  const { direct, proxy, directInvalid, proxyInvalid, directCount, proxyCount, onDirectChange, onProxyChange, zh } = props
  return <details className="rounded-xl border border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
    <summary className="cursor-pointer font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/20">{zh ? '自定义网站分流（可选）' : 'Custom website routing (optional)'}</summary>
    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{zh ? '每行一个域名或完整网址。系统会自动提取域名；始终直连的优先级高于始终代理。内容仅保存在当前页面内存。' : 'One domain or URL per line. Hostnames are extracted automatically; Always direct takes priority over Always proxy. Values stay in page memory.'}</p>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <div><label htmlFor="direct-domains" className="block text-sm font-semibold">{zh ? '第 1 步：始终直连（绝不代理）' : 'Step 1: Always direct (never proxy)'}</label><p className="mt-1 text-xs text-slate-500">{zh ? '适合银行、公司内网或明确要求本地出口的网站。' : 'For banking, intranet, or sites that require your local connection.'}</p><textarea id="direct-domains" value={direct} onChange={(event) => onDirectChange(event.target.value)} spellCheck={false} placeholder={'bank.example.cn\nintranet.example.com'} className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950" /><p className="mt-1 text-xs" aria-live="polite">{zh ? `已识别 ${directCount} 个直连域名` : `${directCount} direct domains recognized`}{directInvalid.length ? (zh ? `；无效行：${directInvalid.join('、')}` : `; invalid lines: ${directInvalid.join(', ')}`) : ''}</p></div>
      <div><label htmlFor="proxy-domains" className="block text-sm font-semibold">{zh ? '第 2 步：始终代理' : 'Step 2: Always proxy'}</label><p className="mt-1 text-xs text-slate-500">{zh ? '适合需要固定通过代理访问的网站。' : 'For sites that must always use the proxy.'}</p><textarea id="proxy-domains" value={proxy} onChange={(event) => onProxyChange(event.target.value)} spellCheck={false} placeholder={'example.com\nhttps://app.example.net/path'} className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950" /><p className="mt-1 text-xs" aria-live="polite">{zh ? `已识别 ${proxyCount} 个代理域名` : `${proxyCount} proxy domains recognized`}{proxyInvalid.length ? (zh ? `；无效行：${proxyInvalid.join('、')}` : `; invalid lines: ${proxyInvalid.join(', ')}`) : ''}</p></div>
    </div>
    <p className="mt-3 text-xs text-slate-500">{zh ? '第 3 步：点击“转换”。生成的 DOMAIN-SUFFIX 规则会插入到默认国际服务和中国大陆规则之前。' : 'Step 3: Select Convert. Generated DOMAIN-SUFFIX rules are inserted before the default international and mainland China rules.'}</p>
  </details>
}
