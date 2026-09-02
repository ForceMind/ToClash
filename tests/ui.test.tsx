import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parse } from 'yaml'
import App from '../src/App'
import { RULE_PRESETS } from '../src/core/rules/presets'
import * as serializer from '../src/core/serializer/yaml'

const exampleLink =
  'vless://00000000-0000-4000-8000-000000000000@example.com:443'

function convertExample(): void {
  fireEvent.change(screen.getByLabelText('代理链接'), {
    target: { value: exampleLink },
  })
  fireEvent.click(screen.getByRole('button', { name: '转换' }))
}

function output(): string {
  return (screen.getByLabelText('Mihomo YAML') as HTMLTextAreaElement).value
}

function fill(label: string, value: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

function openPresets(): void {
  fireEvent.click(screen.getByText(/服务规则预设（已启用/))
}

function openIntranet(): void {
  fireEvent.click(screen.getByText('企业 / 家庭内网 DNS（可选）'))
  fireEvent.click(screen.getByLabelText('启用内网 DNS 分流'))
}

describe('界面与分流引导', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
  })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('默认使用简体中文，并可切换到英文', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: '代理链接 → Clash YAML' }),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: '转换' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Switch to English' }))
    expect(
      screen.getByRole('heading', { name: 'Proxy links → Clash YAML' }),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Convert' })).toBeTruthy()
    expect(screen.queryByText('GitHub')).toBeNull()
    expect(document.documentElement.lang).toBe('en')
  })

  it('中文警告保留被忽略的参数名称', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('代理链接'), {
      target: {
        value:
          'vless://00000000-0000-4000-8000-000000000000@example.com:443?unknown=value',
      },
    })
    fireEvent.click(screen.getByRole('button', { name: '转换' }))
    expect(
      screen.getByText('第 1 行：参数“unknown”当前无法映射到 Mihomo，已忽略。'),
    ).toBeTruthy()
  })

  it('引导用户添加始终直连和始终代理规则', () => {
    render(<App />)
    fireEvent.click(screen.getByText('自定义网站分流（可选）'))
    fill('第 1 步：始终直连', 'bank.example\n192.0.2.12')
    fill('第 2 步：始终代理', 'https://video.example/watch\n2001:db8::1')
    convertExample()
    expect(output()).toContain('DOMAIN-SUFFIX,bank.example,DIRECT')
    expect(output()).toContain('DOMAIN-SUFFIX,video.example,FORCE_PROXY')
    expect(output()).toContain('IP-CIDR,192.0.2.12/32,DIRECT,no-resolve')
    expect(output()).toContain(
      'IP-CIDR6,2001:db8::1/128,FORCE_PROXY,no-resolve',
    )
  })

  it.each(RULE_PRESETS)(
    '$nameZh 预设默认启用，关闭只移除专用规则',
    (preset) => {
      render(<App />)
      openPresets()
      const checkbox = screen.getByLabelText(preset.nameZh) as HTMLInputElement
      expect(checkbox.checked).toBe(true)
      convertExample()
      const firstRule = preset.rules[0]
      if (!firstRule)
        throw new Error('Each preset must contain at least one rule')
      const destination =
        preset.id === 'openai' || preset.id === 'claude'
          ? 'FORCE_PROXY'
          : 'PROXY'
      const generatedRule = `${firstRule.type},${firstRule.value},${destination}`
      expect(output()).toContain(generatedRule)
      fireEvent.click(checkbox)
      expect(output()).not.toContain(generatedRule)
      expect(output()).toContain('MATCH,PROXY')
      expect(screen.getByText(/关闭预设仅取消该类服务的专用规则/)).toBeTruthy()
      fireEvent.click(checkbox)
      expect(output()).toContain(generatedRule)
    },
  )

  it.each(['第 1 步：始终直连', '第 2 步：始终代理'])(
    '%s 的非法输入阻止完整配置复制和下载',
    (label) => {
      render(<App />)
      convertExample()
      expect(output()).not.toBe('')
      fireEvent.click(screen.getByText('自定义网站分流（可选）'))
      fill(label, 'good.example\nexample.com,DIRECT')
      expect(output()).toBe('')
      expect(screen.getByRole('alert').textContent).toContain('分流设置有误')
      expect(
        (screen.getByRole('button', { name: '复制' }) as HTMLButtonElement)
          .disabled,
      ).toBe(true)
      expect(
        (screen.getByRole('button', { name: '下载 YAML' }) as HTMLButtonElement)
          .disabled,
      ).toBe(true)
      expect(screen.getByLabelText(label).getAttribute('aria-invalid')).toBe(
        'true',
      )
      fill(label, 'good.example')
      expect(output()).not.toBe('')
      expect(screen.queryByRole('alert')).toBeNull()
    },
  )

  it('仅 proxies 忽略分流错误但保留设置，切回完整配置继续阻止导出', () => {
    render(<App />)
    fill('第 1 步：始终直连', 'bad.example,DIRECT')
    openIntranet()
    convertExample()
    expect(output()).toBe('')
    fireEvent.click(screen.getByLabelText('仅 proxies'))
    expect(screen.queryByRole('alert')).toBeNull()
    expect(Object.keys(parse(output()) as Record<string, unknown>)).toEqual([
      'proxies',
    ])
    expect(screen.getByText(/仅 proxies 模式不包含 DNS/)).toBeTruthy()
    expect(
      (screen.getByRole('button', { name: '复制' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false)
    fireEvent.click(screen.getByLabelText('完整配置'))
    expect(
      (screen.getByLabelText('第 1 步：始终直连') as HTMLTextAreaElement).value,
    ).toBe('bad.example,DIRECT')
    expect(
      (screen.getByLabelText('启用内网 DNS 分流') as HTMLInputElement).checked,
    ).toBe(true)
    expect(output()).toBe('')
  })

  it('内网默认关闭；启用后缺少后缀或 DNS 都阻止导出', () => {
    render(<App />)
    expect(
      (screen.getByLabelText('启用内网 DNS 分流') as HTMLInputElement).checked,
    ).toBe(false)
    convertExample()
    openIntranet()
    expect(output()).toBe('')
    expect(
      screen.getByText('请同时填写内网域名后缀和 DNS 服务器。'),
    ).toBeTruthy()
    fill('内网域名后缀（每行一个）', 'corp.example')
    expect(output()).toBe('')
    fill('内网 DNS 服务器（每行一个）', '192.168.1.53')
    expect(output()).toContain('DOMAIN-SUFFIX,corp.example,DIRECT')
    fill('内网域名后缀（每行一个）', '')
    expect(output()).toBe('')
    fireEvent.click(screen.getByLabelText('启用内网 DNS 分流'))
    expect(output()).not.toBe('')
  })

  it('内网多后缀生成专用 DNS、fake-IP 排除和直连，并校验非法行', () => {
    render(<App />)
    openIntranet()
    fill('内网域名后缀（每行一个）', 'corp.example\nhome.example')
    fill('内网 DNS 服务器（每行一个）', '192.168.1.53\n[fd00::53]:5353')
    convertExample()
    const config = parse(output()) as {
      dns: {
        'fake-ip-filter': string[]
        'nameserver-policy': Record<string, string[]>
      }
      rules: string[]
    }
    for (const suffix of ['corp.example', 'home.example']) {
      expect(config.dns['fake-ip-filter']).toContain(`+.${suffix}`)
      expect(config.dns['nameserver-policy'][`+.${suffix}`]).toEqual([
        'udp://192.168.1.53:53',
        'udp://[fd00::53]:5353',
      ])
      expect(config.rules).toContain(`DOMAIN-SUFFIX,${suffix},DIRECT`)
    }
    fill(
      '内网 DNS 服务器（每行一个）',
      '192.168.1.53\nhttps://dns.example/query',
    )
    expect(screen.getByText('DNS 服务器无效行：2')).toBeTruthy()
    expect(output()).toBe('')
    fill('内网 DNS 服务器（每行一个）', '192.168.1.53')
    fill('内网域名后缀（每行一个）', 'https://corp.example')
    expect(screen.getByText('域名后缀无效行：1')).toBeTruthy()
    expect(output()).toBe('')
  })

  it('CGNAT 直连默认为关闭，开启后才生成对应规则', () => {
    render(<App />)
    openPresets()
    const checkbox = screen.getByLabelText(
      /直连共享地址段（CGNAT）/,
    ) as HTMLInputElement
    expect(checkbox.checked).toBe(false)
    convertExample()
    expect(output()).not.toContain('IP-CIDR,100.64.0.0/10,DIRECT,no-resolve')
    fireEvent.click(checkbox)
    expect(output()).toContain('IP-CIDR,100.64.0.0/10,DIRECT,no-resolve')
  })

  it('显示覆盖数量，不将域名或原始输入放进提示', () => {
    render(<App />)
    fill('第 1 步：始终直连', 'private.example')
    fill('第 2 步：始终代理', 'api.private.example')
    convertExample()
    const warning = screen.getByText(/项代理设置与自定义直连范围重叠/)
    expect(warning.textContent).toContain('1 项')
    expect(warning.textContent).not.toContain('private.example')
    expect(output()).not.toContain(
      'DOMAIN-SUFFIX,api.private.example,FORCE_PROXY',
    )
  })

  it('内网与本地域名覆盖提示明确直连优先', () => {
    render(<App />)
    openIntranet()
    fill('内网域名后缀（每行一个）', 'corp.example')
    fill('内网 DNS 服务器（每行一个）', '192.168.1.53')
    fill('第 2 步：始终代理', 'api.corp.example\nhost.lan')
    convertExample()
    expect(screen.getByText(/项设置与内网范围重叠/)).toBeTruthy()
    expect(screen.getByText(/项设置与本机 \/ 局域网范围重叠/)).toBeTruthy()
  })

  it('清空重置分流、预设、内网和错误，同时保留语言与主题', () => {
    render(<App />)
    openPresets()
    fireEvent.click(screen.getByLabelText('Codex / OpenAI'))
    fireEvent.click(screen.getByLabelText(/直连共享地址段（CGNAT）/))
    openIntranet()
    fill('内网域名后缀（每行一个）', 'corp.example')
    fill('内网 DNS 服务器（每行一个）', '192.168.1.53')
    fill('第 1 步：始终直连', 'bad.example,DIRECT')
    fill('第 2 步：始终代理', 'proxy.example')
    convertExample()
    fireEvent.click(screen.getByRole('button', { name: '切换到深色模式' }))
    fireEvent.click(screen.getByRole('button', { name: 'Switch to English' }))
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(
      screen.getByRole('heading', { name: 'Proxy links → Clash YAML' }),
    ).toBeTruthy()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(output()).toBe('')
    expect(
      (screen.getByLabelText('Proxy links') as HTMLTextAreaElement).value,
    ).toBe('')
    expect(
      (screen.getByLabelText('Step 1: Always direct') as HTMLTextAreaElement)
        .value,
    ).toBe('')
    expect(
      (screen.getByLabelText('Step 2: Always proxy') as HTMLTextAreaElement)
        .value,
    ).toBe('')
    for (const preset of RULE_PRESETS)
      expect(
        (screen.getByLabelText(preset.nameEn) as HTMLInputElement).checked,
      ).toBe(true)
    expect(
      (screen.getByLabelText(/Bypass shared addresses/) as HTMLInputElement)
        .checked,
    ).toBe(false)
    expect(
      (screen.getByLabelText('Enable intranet DNS routing') as HTMLInputElement)
        .checked,
    ).toBe(false)
    expect(screen.queryByRole('alert')).toBeNull()
    fireEvent.click(screen.getByLabelText('Enable intranet DNS routing'))
    expect(
      (
        screen.getByLabelText(
          'Intranet domain suffixes (one per line)',
        ) as HTMLTextAreaElement
      ).value,
    ).toBe('')
    expect(
      (
        screen.getByLabelText(
          'Intranet DNS servers (one per line)',
        ) as HTMLTextAreaElement
      ).value,
    ).toBe('')
  })

  it('序列化异常显示安全错误，不崩溃或回显异常内容', () => {
    vi.spyOn(serializer, 'serializeMihomo').mockImplementation(() => {
      throw new Error('secret-node-password')
    })
    render(<App />)
    convertExample()
    expect(screen.getByRole('alert').textContent).toContain('无法安全生成配置')
    expect(document.body.textContent).not.toContain('secret-node-password')
    expect(output()).toBe('')
  })

  it('复制成功后修改输入或设置会清理旧状态，链接修改还会清理旧输出', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    render(<App />)
    convertExample()
    fireEvent.click(screen.getByRole('button', { name: '复制' }))
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe('已复制'),
    )
    expect(writeText).toHaveBeenCalledWith(output())
    fill('第 2 步：始终代理', 'proxy.example')
    expect(screen.getByRole('status').textContent).toBe('')
    fireEvent.click(screen.getByRole('button', { name: '复制' }))
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe('已复制'),
    )
    fill('代理链接', `${exampleLink}#changed`)
    expect(screen.getByRole('status').textContent).toBe('')
    expect(output()).toBe('')
  })

  it.each(['unavailable', 'rejected'])(
    '剪贴板 %s 时提示手动复制',
    async (mode) => {
      vi.stubGlobal(
        'navigator',
        mode === 'unavailable'
          ? {}
          : {
              clipboard: {
                writeText: vi.fn().mockRejectedValue(new Error('denied')),
              },
            },
      )
      render(<App />)
      convertExample()
      fireEvent.click(screen.getByRole('button', { name: '复制' }))
      await waitFor(() =>
        expect(screen.getByRole('status').textContent).toContain(
          '复制失败，请手动选择输出内容并复制',
        ),
      )
    },
  )

  it('异步复制结束前清空，不显示失效的复制成功状态', async () => {
    let resolveCopy: (() => void) | undefined
    const promise = new Promise<void>((resolve) => {
      resolveCopy = resolve
    })
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn(() => promise) },
    })
    render(<App />)
    convertExample()
    fireEvent.click(screen.getByRole('button', { name: '复制' }))
    fireEvent.click(screen.getByRole('button', { name: '清空' }))
    resolveCopy?.()
    await promise
    expect(screen.getByRole('status').textContent).toBe('')
  })

  it('下载使用本地 Blob，挂载链接后点击并延迟释放 URL', () => {
    vi.useFakeTimers()
    const createObjectURL = vi.fn(() => 'blob:toclash-test')
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    })
    const clickDetails: { download: string; href: string }[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(document.body.contains(this)).toBe(true)
      clickDetails.push({ download: this.download, href: this.href })
    })
    render(<App />)
    convertExample()
    fireEvent.click(screen.getByRole('button', { name: '下载 YAML' }))
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(clickDetails).toEqual([
      { download: 'toclash.yaml', href: 'blob:toclash-test' },
    ])
    expect(document.querySelector('a[download]')).toBeNull()
    expect(revokeObjectURL).not.toHaveBeenCalled()
    expect(screen.getByRole('status').textContent).toBe('已开始下载')
    vi.advanceTimersByTime(1000)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:toclash-test')
  })

  it('下载不可用时提示复制保存，不显示成功', () => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => {
        throw new Error('unavailable')
      }),
    })
    render(<App />)
    convertExample()
    fireEvent.click(screen.getByRole('button', { name: '下载 YAML' }))
    expect(screen.getByRole('status').textContent).toContain(
      '下载失败，请复制输出内容',
    )
  })

  it('示例使用假数据并清理旧结果', () => {
    render(<App />)
    convertExample()
    fireEvent.click(screen.getByRole('button', { name: '示例' }))
    const input = (screen.getByLabelText('代理链接') as HTMLTextAreaElement)
      .value
    expect(input).toContain('00000000-0000-4000-8000-000000000000@example.com')
    expect(output()).toBe('')
    fireEvent.click(screen.getByRole('button', { name: '转换' }))
    expect(
      screen.getByText('检测到 2 条链接 · 成功 2 条 · 失败 0 条'),
    ).toBeTruthy()
  })
})
