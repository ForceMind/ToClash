import { expect, test } from '@playwright/test'
import { parse } from 'yaml'

const importedYaml = `mode: global
mixed-port: 7890
tun:
  enable: true
proxies:
  - name: Imported XHTTP
    type: vless
    server: edge.example.test
    port: 443
    uuid: 00000000-0000-4000-8000-000000000000
    encryption: none
    tls: true
    network: xhttp
    xhttp-opts:
      path: /
      mode: auto
      x-padding-bytes: 100-1000
proxy-groups:
  - name: Preserved group
    type: select
    proxies:
      - Imported XHTTP
rules:
  - DOMAIN-SUFFIX,corp.example,DIRECT
  - DOMAIN-SUFFIX,bovada.lv,FORCE_PROXY
  - DOMAIN-SUFFIX,bovada.lv,REJECT
  - DOMAIN-SUFFIX,openai.com,FORCE_PROXY
  - DOMAIN-SUFFIX,openai.com,REJECT
  - DOMAIN-KEYWORD,keep,DIRECT
  - MATCH,DIRECT
dns:
  fallback-filter:
    geoip: true
  nameserver-policy:
    +.corp.example:
      - udp://192.0.2.53:53
`

test('pastes and imports an existing YAML profile without persisting node credentials', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await page.getByRole('button', { name: '退出新手模式' }).click()
  const input = page.getByLabel('代理链接或 Clash YAML', { exact: true })
  await input.fill(importedYaml)
  await page.getByRole('button', { name: '转换', exact: true }).click()

  const output = page.getByLabel('Mihomo YAML')
  await expect(output).not.toHaveValue('')
  const config = parse(await output.inputValue())
  expect(config.mode).toBe('rule')
  expect(config.tun).toEqual({ enable: true })
  expect(config.proxies[0]).toMatchObject({
    name: 'Imported XHTTP',
    network: 'xhttp',
    'xhttp-opts': { path: '/', mode: 'auto', 'x-padding-bytes': '100-1000' },
  })
  expect(config['proxy-groups']).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: 'Preserved group' }),
      expect.objectContaining({ name: 'FORCE_PROXY' }),
    ]),
  )
  expect(config.rules).toContain('DOMAIN-SUFFIX,bovada.lv,FORCE_PROXY')
  expect(config.rules).toContain('DOMAIN-KEYWORD,keep,DIRECT')
  expect(config.rules.at(-1)).toBe('MATCH,DIRECT')

  await expect(page.getByLabel('网络模式', { exact: true })).toHaveValue(
    'direct',
  )
  await page.locator('summary').filter({ hasText: '自定义网站分流' }).click()
  await expect(page.getByLabel('第 2 步：始终代理')).toHaveValue('bovada.lv')
  await page
    .locator('summary')
    .filter({ hasText: '企业 / 家庭内网 DNS' })
    .click()
  await expect(page.getByLabel('启用内网 DNS 分流')).toBeChecked()
  await expect(page.getByLabel('内网域名后缀（每行一个）')).toHaveValue(
    'corp.example',
  )
  await expect(
    page.getByLabel('内网 DNS 服务器（可留空使用系统 DNS）'),
  ).toHaveValue('udp://192.0.2.53:53')
  expect(
    await page.evaluate(
      () => localStorage.getItem('toclash.routing.v1') ?? '',
    ),
  ).not.toContain('00000000-0000-4000-8000-000000000000')
  expect(
    await page.evaluate(
      () => localStorage.getItem('toclash.routing.v1') ?? '',
    ),
  ).not.toContain('edge.example.test')
  await page.screenshot({
    path: testInfo.outputPath('yaml-import.png'),
    fullPage: true,
  })
  expect(
    await page
      .locator('body')
      .evaluate((element) => element.scrollWidth <= window.innerWidth),
  ).toBe(true)

  await page.getByRole('button', { name: '清空节点和结果' }).click()
  await page.locator('input[type="file"]').setInputFiles({
    name: 'existing-profile.yaml',
    mimeType: 'application/yaml',
    buffer: Buffer.from(importedYaml),
  })
  await expect(output).not.toHaveValue('')
  expect(parse(await output.inputValue()).proxies[0].name).toBe('Imported XHTTP')
})
