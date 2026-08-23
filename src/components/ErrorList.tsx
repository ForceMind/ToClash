import type { ConversionIssue, IssueCode } from '../core/model/proxy'

const zhMessages: Record<IssueCode, string> = {
  INVALID_URI: '代理链接格式无效。', INVALID_PORT: '代理端口无效。', MISSING_HOST: '代理链接缺少服务器地址。', INVALID_UUID: 'UUID 格式无效。', INVALID_BASE64: '无法解码 Base64 内容。', INVALID_JSON: '无法解析 VMess JSON 内容。', UNSUPPORTED_PROTOCOL: '不支持此协议。', UNSUPPORTED_TRANSPORT: '不支持此传输方式。', MISSING_FIELD: '代理链接缺少必要字段。', IGNORED_PARAMETER: '存在当前无法映射的参数，已忽略。', UNSUPPORTED_PLUGIN: '此 Shadowsocks 插件可能不受 Mihomo 支持。',
}

export function ErrorList({ errors, warnings, zh }: { errors: ConversionIssue[]; warnings: ConversionIssue[]; zh: boolean }) {
  if (!errors.length && !warnings.length) return null
  return <div className="space-y-3" aria-live="polite">
    {errors.length > 0 && <section className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"><h2 className="font-semibold">{zh ? '转换失败' : 'Could not convert'}</h2><ul className="mt-2 list-disc space-y-1 pl-5">{errors.map((issue, index) => <li key={`${issue.line}-${issue.code}-${index}`}>{zh ? `第 ${issue.line} 行：${zhMessages[issue.code]}` : `Line ${issue.line}: ${issue.message}`}</li>)}</ul></section>}
    {warnings.length > 0 && <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><h2 className="font-semibold">{zh ? '警告' : 'Warnings'}</h2><ul className="mt-2 list-disc space-y-1 pl-5">{warnings.map((issue, index) => <li key={`${issue.line}-${issue.code}-${index}`}>{zh ? `第 ${issue.line} 行：${zhMessages[issue.code]}` : `Line ${issue.line}: ${issue.message}`}</li>)}</ul></section>}
  </div>
}
