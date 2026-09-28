import { expect, test } from '@playwright/test'
import { parse } from 'yaml'

test('choose overseas services and preserve choices on reload', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await page.getByRole('button', { name: '退出新手模式' }).click()
  await page.getByLabel('网络模式', { exact: true }).selectOption('direct')
  await page.getByRole('button', { name: '示例', exact: true }).click()
  await page.getByRole('button', { name: '转换', exact: true }).click()
  await page.locator('summary').filter({ hasText: '服务规则预设' }).click()
  const search = page.getByLabel('搜索服务', { exact: true })
  const output = page.getByLabel('Mihomo YAML')
  await search.fill('TikTok')
  const tiktok = page.getByLabel('TikTok', { exact: true })
  await expect(tiktok).not.toBeChecked()
  await tiktok.check()
  let config = parse(await output.inputValue())
  expect(config.rules).toContain('DOMAIN-SUFFIX,tiktok.com,FORCE_PROXY')
  expect(config.dns['nameserver-policy']['+.tiktok.com']).toEqual([
    'https://1.1.1.1/dns-query#FORCE_PROXY',
    'https://8.8.8.8/dns-query#FORCE_PROXY',
  ])
  await search.fill('Meta AI')
  const meta = page.getByLabel('Meta / Meta AI / Quest', { exact: true })
  await expect(meta).not.toBeChecked()
  await meta.check()
  config = parse(await output.inputValue())
  expect(config.rules).toContain('DOMAIN-SUFFIX,meta.com,FORCE_PROXY')
  expect(config.rules).toContain('DOMAIN-SUFFIX,meta.ai,FORCE_PROXY')
  expect(config.rules).toContain('DOMAIN-SUFFIX,oculus.com,FORCE_PROXY')
  expect(config.dns['nameserver-policy']['+.meta.com']).toEqual([
    'https://1.1.1.1/dns-query#FORCE_PROXY',
    'https://8.8.8.8/dns-query#FORCE_PROXY',
  ])
  await search.fill('AWS')
  const aws = page.getByLabel('AWS 控制台', { exact: true })
  await expect(aws).not.toBeChecked()
  await aws.check()
  config = parse(await output.inputValue())
  expect(config.rules).toContain('DOMAIN-SUFFIX,aws.amazon.com,FORCE_PROXY')
  expect(config.rules).not.toContain('DOMAIN-SUFFIX,amazonaws.com,FORCE_PROXY')
  await search.fill('PayPal')
  await page.getByLabel('PayPal', { exact: true }).check()
  config = parse(await output.inputValue())
  expect(config.rules).toContain('DOMAIN-SUFFIX,paypalobjects.com,FORCE_PROXY')
  await search.fill('Twitter')
  await page.getByLabel('X / Twitter', { exact: true }).check()
  config = parse(await output.inputValue())
  expect(config.rules).toContain('DOMAIN-SUFFIX,x.com,FORCE_PROXY')
  expect(config.rules).toContain('DOMAIN-SUFFIX,tiktok.com,FORCE_PROXY')
  expect(config.rules.at(-1)).toBe('MATCH,DIRECT')
  await search.fill('not-a-service-98765')
  await expect(
    page.getByRole('checkbox', { name: 'TikTok', exact: true }),
  ).toHaveCount(0)
  expect(parse(await output.inputValue()).rules).toContain(
    'DOMAIN-SUFFIX,tiktok.com,FORCE_PROXY',
  )
  await search.fill('')
  expect(
    await page
      .locator('body')
      .evaluate((el) => el.scrollWidth <= window.innerWidth),
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('service-catalog.png'),
    fullPage: true,
  })
  await page.reload()
  await page.locator('summary').filter({ hasText: '服务规则预设' }).click()
  await expect(page.getByLabel('TikTok', { exact: true })).toBeChecked()
  await expect(page.getByLabel('X / Twitter', { exact: true })).toBeChecked()
  await expect(page.getByLabel('Meta / Meta AI / Quest', { exact: true })).toBeChecked()
  await expect(page.getByLabel('AWS 控制台', { exact: true })).toBeChecked()
  await expect(page.getByLabel('PayPal', { exact: true })).toBeChecked()
  await page.getByLabel('TikTok', { exact: true }).uncheck()
  await page.getByRole('button', { name: '示例', exact: true }).click()
  await page.getByRole('button', { name: '转换', exact: true }).click()
  expect(parse(await output.inputValue()).rules).not.toContain(
    'DOMAIN-SUFFIX,tiktok.com,FORCE_PROXY',
  )
  expect(parse(await output.inputValue()).rules).toContain(
    'DOMAIN-SUFFIX,x.com,FORCE_PROXY',
  )
})
