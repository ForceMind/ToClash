import { expect, test } from '@playwright/test'
import { parse } from 'yaml'

test('direct mode conversion and saved choices', async ({ page }, testInfo) => {
  await page.goto('/')
  await page.getByLabel('网络模式', { exact: true }).selectOption('direct')
  await page.getByRole('button', { name: '示例', exact: true }).click()
  await page.getByRole('button', { name: '转换', exact: true }).click()
  await page.locator('summary').filter({ hasText: '服务规则预设' }).click()
  await page.getByLabel('Google / YouTube', { exact: true }).uncheck()
  await page
    .locator('summary')
    .filter({ hasText: '企业 / 家庭内网 DNS' })
    .click()
  await page.getByLabel('启用内网 DNS 分流', { exact: true }).check()
  await page
    .getByLabel('内网域名后缀（每行一个）', { exact: true })
    .fill('corp.example')
  const output = page.getByLabel('Mihomo YAML')
  let config = parse(await output.inputValue())
  expect(config.rules.at(-1)).toBe('MATCH,DIRECT')
  expect(config.rules.some((r: string) => /GEOIP|GEOSITE/.test(r))).toBe(false)
  expect(config.rules).not.toContain('DOMAIN-SUFFIX,google.com,FORCE_PROXY')
  expect(config['proxy-groups']).toHaveLength(1)
  expect(config['proxy-groups'][0].proxies).not.toContain('AUTO')
  expect(config['proxy-groups'][0].proxies).not.toContain('DIRECT')
  expect(config.dns.nameserver).toEqual(['system'])
  expect(config.dns['nameserver-policy']['+.corp.example']).toEqual(['system'])
  await page
    .getByLabel('内网 DNS 服务器（可留空使用系统 DNS）', { exact: true })
    .fill('192.0.2.53')
  config = parse(await output.inputValue())
  expect(config.dns['nameserver-policy']['+.corp.example']).toEqual([
    'udp://192.0.2.53:53',
  ])
  await page.screenshot({
    path: testInfo.outputPath('direct-mode.png'),
    fullPage: true,
  })
  expect(
    await page
      .locator('body')
      .evaluate((el) => el.scrollWidth <= window.innerWidth),
  ).toBe(true)
  await page.reload()
  await expect(page.getByLabel('网络模式', { exact: true })).toHaveValue(
    'direct',
  )
  await page.locator('summary').filter({ hasText: '服务规则预设' }).click()
  await expect(
    page.getByLabel('Google / YouTube', { exact: true }),
  ).not.toBeChecked()
  await page.getByRole('button', { name: '示例', exact: true }).click()
  await page.getByRole('button', { name: '转换', exact: true }).click()
  expect(parse(await output.inputValue()).rules.at(-1)).toBe('MATCH,DIRECT')
  await page
    .getByRole('button', { name: '重置已保存设置', exact: true })
    .click()
  await expect(page.getByLabel('网络模式', { exact: true })).toHaveValue(
    'standard',
  )
  expect(parse(await output.inputValue()).rules.at(-1)).toBe('MATCH,PROXY')
})
