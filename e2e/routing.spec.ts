import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { parse } from 'yaml'

const guideLink = 'vless://00000000-0000-4000-8000-000000000000@example.com:443'

test('real browser conversion, privacy, settings, download and keyboard workflow', async ({
  page,
  context,
}, testInfo) => {
  const requests: string[] = []
  const errors: string[] = []
  page.on('request', (request) => requests.push(request.url()))
  page.on('pageerror', (error) => errors.push(error.message))
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    '代理链接 → Clash YAML',
  )
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
  expect(
    ((await page.locator('html').getAttribute('class')) ?? '')
      .split(' ')
      .includes('dark'),
  ).toBe(testInfo.project.name === 'mobile-dark')
  const beginnerGuide = page.getByRole('dialog', {
    name: '新手模式：生成 Clash YAML',
  })
  await expect(beginnerGuide).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('beginner-mode.png') })
  await page.getByRole('button', { name: '下一步' }).click()
  await expect(page.getByLabel('粘贴代理链接')).toHaveValue('')
  await expect(page.getByLabel('粘贴代理链接')).toBeFocused()
  await expect(page.getByRole('button', { name: '下一步' })).toBeDisabled()
  await page.getByLabel('粘贴代理链接').fill(guideLink)
  await page.getByRole('button', { name: '下一步' }).click()
  await expect(page.getByText(/全部 29 项服务/)).toBeVisible()
  await page.getByRole('button', { name: '下一步' }).click()
  await expect(page.getByLabel('始终直连', { exact: true })).toHaveValue('')
  await expect(page.getByLabel('始终代理', { exact: true })).toHaveValue('')
  await page.getByRole('button', { name: '下一步' }).click()
  await expect(page.getByLabel('我需要访问公司或家庭内网')).not.toBeChecked()
  await expect(page.getByText(/不会自动填入任何后缀/)).toBeVisible()
  await page.getByRole('button', { name: '下一步' }).click()
  await expect(page.getByText('有效节点')).toBeVisible()
  await page.getByRole('button', { name: '应用并转换' }).click()
  await expect(beginnerGuide).toHaveCount(0)
  await expect(page.getByRole('button', { name: '新手模式' })).toBeFocused()
  const output = page.getByLabel('Mihomo YAML')
  await expect(output).not.toHaveValue('')
  expect(parse(await output.inputValue()).rules).toContain(
    'DOMAIN-SUFFIX,openai.com,FORCE_PROXY',
  )
  expect(
    Object.keys(
      parse(await output.inputValue()).dns['nameserver-policy'],
    ).slice(-2),
  ).toEqual(['geosite:cn', 'geosite:geolocation-!cn'])
  await page.screenshot({
    path: testInfo.outputPath('default.png'),
    fullPage: true,
  })

  const presets = page.locator('summary').filter({ hasText: '服务规则预设' })
  await presets.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByLabel('Codex / OpenAI', { exact: true })).toBeVisible()
  await page.getByLabel('Codex / OpenAI', { exact: true }).uncheck()
  expect(parse(await output.inputValue()).rules).not.toContain(
    'DOMAIN-SUFFIX,openai.com,FORCE_PROXY',
  )
  expect(parse(await output.inputValue()).rules.at(-1)).toBe('MATCH,PROXY')
  await expect(page.getByText(/关闭预设仅取消/)).toBeVisible()

  await page.locator('summary').filter({ hasText: '自定义网站分流' }).click()
  await page
    .getByLabel('第 1 步：始终直连', { exact: true })
    .fill('bank.example\n192.0.2.1')
  await page.getByLabel('第 2 步：始终代理').fill('bank.example\nvideo.example')
  const config = parse(await output.inputValue())
  expect(config.rules).toContain('IP-CIDR,192.0.2.1/32,DIRECT,no-resolve')
  expect(config.rules).toContain('DOMAIN-SUFFIX,video.example,FORCE_PROXY')
  expect(config.rules).not.toContain('DOMAIN-SUFFIX,bank.example,FORCE_PROXY')
  await expect(
    page.getByRole('heading', { name: '分流覆盖提示' }),
  ).toBeVisible()

  await page.getByRole('button', { name: '复制', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('已复制')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    await output.inputValue(),
  )
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '下载 YAML' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('toclash.yaml')
  const downloaded = await download.path()
  expect(downloaded).not.toBeNull()
  expect(parse(readFileSync(downloaded!, 'utf8'))).toEqual(config)

  await page.getByLabel('第 2 步：始终代理').fill('example.com,REJECT')
  await expect(page.getByRole('alert')).toContainText('输出已暂停')
  await expect(output).toHaveValue('')
  await expect(page.getByRole('button', { name: '下载 YAML' })).toBeDisabled()
  await page.screenshot({
    path: testInfo.outputPath('validation-error.png'),
    fullPage: true,
  })
  await page.getByLabel('仅 proxies', { exact: true }).check()
  expect(Object.keys(parse(await output.inputValue()))).toEqual(['proxies'])
  await page.getByLabel('完整配置', { exact: true }).check()
  await expect(output).toHaveValue('')
  await page.locator('summary').filter({ hasText: '自定义网站分流' }).click()
  await page.getByLabel('第 2 步：始终代理').fill('video.example')

  await page
    .locator('summary')
    .filter({ hasText: '企业 / 家庭内网 DNS' })
    .click()
  await page.getByLabel('启用内网 DNS 分流').check()
  await expect(output).toHaveValue('')
  await expect(
    page.getByRole('heading', {
      name: 'macOS 上使用 Edge / Chromium 和 Clash Verge',
    }),
  ).toHaveCount(0)
  await page.getByLabel('内网域名后缀（每行一个）').fill('svc.cluster.local')
  await page.getByLabel('内网 DNS 服务器（每行一个）').fill('192.0.2.53')
  await expect(
    page.getByRole('heading', {
      name: 'macOS 上使用 Edge / Chromium 和 Clash Verge',
    }),
  ).toBeVisible()
  await expect(page.getByText(/默认绕过 \*\.local/)).toBeVisible()
  const internalConfig = parse(await output.inputValue())
  expect(
    internalConfig.dns['nameserver-policy']['+.svc.cluster.local'],
  ).toEqual(['udp://192.0.2.53:53'])
  expect(
    internalConfig.dns['proxy-server-nameserver-policy']['+.svc.cluster.local'],
  ).toEqual(['udp://192.0.2.53:53'])
  expect(internalConfig.dns['proxy-server-nameserver-policy']['+.lan']).toEqual(
    ['rcode://refused'],
  )
  expect(internalConfig.dns['fake-ip-filter']).toContain('+.svc.cluster.local')
  expect(internalConfig.rules).toContain(
    'DOMAIN-SUFFIX,svc.cluster.local,DIRECT',
  )
  await page.locator('summary').filter({ hasText: '服务规则预设' }).click()
  await page.getByLabel('直连共享地址段（CGNAT）', { exact: false }).check()
  expect(parse(await output.inputValue()).rules).toContain(
    'IP-CIDR,100.64.0.0/10,DIRECT,no-resolve',
  )
  await page.screenshot({
    path: testInfo.outputPath('settings.png'),
    fullPage: true,
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)

  await page
    .getByRole('button', { name: '清空节点和结果', exact: true })
    .click()
  await expect(output).toHaveValue('')
  await expect(page.getByLabel('启用内网 DNS 分流')).toBeChecked()
  await page.getByRole('button', { name: '重置已保存设置' }).click()
  await expect(page.getByLabel('Codex / OpenAI', { exact: true })).toBeChecked()
  await expect(page.getByLabel('启用内网 DNS 分流')).not.toBeChecked()
  await page.getByRole('button', { name: 'Switch to English' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Proxy links → Clash YAML',
  )
  await page.getByRole('button', { name: 'Beginner mode' }).click()
  await expect(
    page.getByRole('dialog', { name: 'Beginner mode: build Clash YAML' }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const wasDark = (await page.locator('html').getAttribute('class')) === 'dark'
  await page
    .getByRole('button', {
      name: wasDark ? 'Switch to light mode' : 'Switch to dark mode',
    })
    .click()
  expect((await page.locator('html').getAttribute('class')) === 'dark').toBe(
    !wasDark,
  )
  await page.screenshot({
    path: testInfo.outputPath('english.png'),
    fullPage: true,
    animations: 'disabled',
  })
  expect(
    await page.evaluate(() => ({
      guide: localStorage.getItem('toclash.beginner-guide.v1'),
      localKeys: Object.keys(localStorage),
      session: sessionStorage.length,
    })),
  ).toEqual({
    guide: 'seen',
    localKeys: ['toclash.beginner-guide.v1'],
    session: 0,
  })
  expect(
    requests.every((url) => url.startsWith(`${testInfo.project.use.baseURL}/`)),
  ).toBe(true)
  expect(page.url()).toBe(`${testInfo.project.use.baseURL}/`)
  expect(errors).toEqual([])
})

test('routing survives reload and a new tab while node input does not', async ({
  page,
  context,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: '退出新手模式' }).click()
  await page.getByRole('button', { name: '示例', exact: true }).click()
  await page.locator('summary').filter({ hasText: '自定义网站分流' }).click()
  await page
    .getByLabel('第 1 步：始终直连', { exact: true })
    .fill('direct.example')
  await page.getByLabel('第 2 步：始终代理').fill('proxy.example')
  await page
    .locator('summary')
    .filter({ hasText: '企业 / 家庭内网 DNS' })
    .click()
  await page.getByLabel('启用内网 DNS 分流').check()
  await page.getByLabel('内网域名后缀（每行一个）').fill('corp.example')
  await page.getByLabel('内网 DNS 服务器（每行一个）').fill('192.0.2.53')
  await page.reload()
  await expect(
    page.getByLabel('代理链接或 Clash YAML', { exact: true }),
  ).toHaveValue('')
  await page.locator('summary').filter({ hasText: '自定义网站分流' }).click()
  await expect(
    page.getByLabel('第 1 步：始终直连', { exact: true }),
  ).toHaveValue('direct.example')
  await expect(page.getByLabel('第 2 步：始终代理')).toHaveValue(
    'proxy.example',
  )
  const reopened = await context.newPage()
  await page.close()
  await reopened.goto('/')
  await reopened
    .locator('summary')
    .filter({ hasText: '企业 / 家庭内网 DNS' })
    .click()
  await expect(reopened.getByLabel('启用内网 DNS 分流')).toBeChecked()
  await expect(reopened.getByLabel('内网域名后缀（每行一个）')).toHaveValue(
    'corp.example',
  )
  await expect(reopened.getByLabel('内网 DNS 服务器（每行一个）')).toHaveValue(
    '192.0.2.53',
  )
  await reopened.getByRole('button', { name: '重置已保存设置' }).click()
  await reopened.reload()
  await reopened
    .locator('summary')
    .filter({ hasText: '企业 / 家庭内网 DNS' })
    .click()
  await expect(reopened.getByLabel('启用内网 DNS 分流')).not.toBeChecked()
})
