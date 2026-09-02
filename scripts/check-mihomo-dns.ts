import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { parse } from 'yaml'
import type { ProxyNode } from '../src/core/model/proxy'
import type { CustomRouting } from '../src/core/rules/types'
import { DIRECT_DNS, proxyDns } from '../src/core/rules/defaults'
import { serializeMihomo } from '../src/core/serializer/yaml'
import { mockDns, mockProxy, startMihomo } from './mihomo-runtime'

type Policy = Record<string, string[]>

async function main(): Promise<void> {
  const [binaryInput, dataInput] = process.argv.slice(2)
  assert(binaryInput && dataInput, 'Usage: npm run test:mihomo:dns -- /path/to/mihomo /path/to/test-geodata')
  const binary = resolve(binaryInput)
  const data = resolve(dataInput)
  assert([binary, join(data, 'geosite.dat'), join(data, 'country.mmdb')].every(existsSync), 'Provide a trusted Mihomo binary and existing test geodata.')
  const version = spawnSync(binary, ['-v'], { encoding: 'utf8', timeout: 10_000 })
  assert.equal(version.status, 0, 'Unable to run Mihomo.')
  console.log(version.stdout.trim())
  const directory = mkdtempSync(join(tmpdir(), 'toclash-dns-check-'))
  for (const name of ['geosite.dat', 'country.mmdb']) copyFileSync(join(data, name), join(directory, name))

  const cleanup: (() => Promise<void>)[] = []
  let assertions = 0
  try {
    const endpoints = new Map<string, string>()
    const mocks = []
    for (const label of ['direct', 'proxy', 'force', 'intranet', 'nested', 'node-bootstrap']) {
      const mock = await mockDns(label)
      cleanup.push(mock.close)
      mocks.push(mock)
      endpoints.set(label, mock.url)
    }
    const endpoint = (label: string) => { const value = endpoints.get(label); assert(value); return value }
    const proxy = await mockProxy()
    cleanup.push(proxy.close)
    const nodes: ProxyNode[] = ['gateway.public.example', 'gateway.corp.example', 'gateway.lab.corp.example', 'gateway.lan', 'gateway.home.arpa']
      .map((server, index) => ({ name: `Node${index}`, type: 'http', server, port: proxy.port }))
    const routing: CustomRouting = {
      directDomains: ['google.com', 'api.openai.com'],
      proxyDomains: ['github.com', 'public.example'],
      intranet: [
        { suffix: 'corp.example', nameservers: [endpoint('intranet')] },
        { suffix: 'lab.corp.example', nameservers: [endpoint('nested')] },
        { suffix: 'home.arpa', nameservers: [endpoint('intranet')] },
        { suffix: 'login.microsoft.com', nameservers: [endpoint('intranet')] },
      ],
    }
    const config = parse(serializeMihomo(nodes, 'full', routing)) as Record<string, unknown>
    const dns = config.dns as Record<string, unknown>
    const policy = dns['nameserver-policy'] as Policy
    const mapResolvers = (values: string[]): string[] => {
      if (JSON.stringify(values) === JSON.stringify(DIRECT_DNS)) return [endpoint('direct')]
      if (JSON.stringify(values) === JSON.stringify(proxyDns('PROXY'))) return [endpoint('proxy')]
      if (JSON.stringify(values) === JSON.stringify(proxyDns('FORCE_PROXY'))) return [endpoint('force')]
      assert(values.every((value) => value === 'rcode://refused' || [...endpoints.values()].includes(value)), 'Unexpected nonlocal upstream in runtime fixture.')
      return [...values]
    }
    // Substitute upstream endpoints only; preserve actual serialized key order and matchers.
    dns['nameserver-policy'] = Object.fromEntries(Object.entries(policy).map(([key, values]) => [key, mapResolvers(values)]))
    dns['proxy-server-nameserver-policy'] = Object.fromEntries(Object.entries((dns['proxy-server-nameserver-policy'] ?? {}) as Policy).map(([key, values]) => [key, mapResolvers(values)]))
    dns.nameserver = [endpoint('direct')]
    dns['default-nameserver'] = [endpoint('direct')]
    dns['direct-nameserver'] = [endpoint('direct')]
    dns['proxy-server-nameserver'] = [endpoint('node-bootstrap')]

    const core = await startMihomo(binary, directory, config)
    cleanup.push(core.close)
    const cases = [
      ['openai.com', 'force'], ['api.openai.com', 'direct'], ['google.com', 'direct'],
      ['github.com', 'force'], ['claude.ai', 'force'], ['youtube.com', 'proxy'],
      ['www.baidu.com', 'direct'], ['www.wikipedia.org', 'proxy'],
      ['app.corp.example', 'intranet'], ['app.lab.corp.example', 'nested'],
      ['login.microsoft.com', 'intranet'], ['device.home.arpa', 'intranet'],
    ] as const
    for (const [domain, expected] of cases) {
      assert.deepEqual(await core.txt(domain), [[expected]], `Wrong DNS destination for ${domain}`)
      assertions += 1
    }
    const beforeLocal = mocks.map(({ queries }) => queries.length)
    await assert.rejects(core.txt('unconfigured.lan'), { code: 'EREFUSED' })
    assert.deepEqual(mocks.map(({ queries }) => queries.length), beforeLocal, 'Local names must not reach any upstream.')
    assertions += 1

    for (const [index, expectedLabel] of [[0, 'node-bootstrap'], [1, 'intranet'], [2, 'nested'], [4, 'intranet']] as const) {
      for (const mock of mocks) mock.queries.length = 0
      const response = await core.delay(`Node${index}`)
      assert.equal(response.status, 200, `Mock node ${index} should connect: ${await response.text()}`)
      const hostname = nodes[index]!.server
      const expected = mocks.find((mock) => mock.url === endpoint(expectedLabel))!
      assert(expected.queries.includes(hostname), `Node ${index} used the wrong DNS resolver.`)
      assert(mocks.filter((mock) => mock !== expected).every((mock) => !mock.queries.includes(hostname)), 'Node hostname leaked to another upstream.')
      assertions += 1
    }
    for (const mock of mocks) mock.queries.length = 0
    const connections = proxy.connections()
    assert.notEqual((await core.delay('Node3')).status, 200, 'Unconfigured .lan node must fail closed.')
    assert(mocks.every(({ queries }) => !queries.includes('gateway.lan')), 'Local node name leaked to an upstream.')
    assert.equal(proxy.connections(), connections, 'Refused local node must not establish a connection.')
    assertions += 1

    await core.close()
    // Negative controls reproduce the two old defects without modifying source.
    const oldOrderConfig = structuredClone(config)
    const oldOrderDns = oldOrderConfig.dns as Record<string, unknown>
    const entries = Object.entries(oldOrderDns['nameserver-policy'] as Policy)
    oldOrderDns['nameserver-policy'] = Object.fromEntries([
      ...entries.filter(([key]) => key.startsWith('geosite:')),
      ...entries.filter(([key]) => !key.startsWith('geosite:')),
    ])
    const oldOrder = await startMihomo(binary, directory, oldOrderConfig)
    cleanup.push(oldOrder.close)
    assert.deepEqual(await oldOrder.txt('openai.com'), [['proxy']], 'Negative control must reproduce GeoSite shadowing FORCE_PROXY DNS.')
    await oldOrder.close()

    const missingNodePolicyConfig = structuredClone(config)
    delete (missingNodePolicyConfig.dns as Record<string, unknown>)['proxy-server-nameserver-policy']
    const missingNodePolicy = await startMihomo(binary, directory, missingNodePolicyConfig)
    cleanup.push(missingNodePolicy.close)
    for (const mock of mocks) mock.queries.length = 0
    assert.equal((await missingNodePolicy.delay('Node1')).status, 200)
    const bootstrap = mocks.find((mock) => mock.url === endpoint('node-bootstrap'))!
    assert(bootstrap.queries.includes('gateway.corp.example'), 'Negative control must reproduce the internal node name reaching the default node resolver.')
    assert(mocks.filter((mock) => mock !== bootstrap).every((mock) => !mock.queries.includes('gateway.corp.example')))
    await missingNodePolicy.close()

    console.log(`PASS: ${assertions} real Mihomo DNS/connection scenarios. All upstreams and proxy connections were local mocks.`)
    console.log('PASS: 2 negative controls reproduced the former DNS ordering and node-bootstrap defects.')
    console.log(`Test data retained in ${directory}; system DNS, proxy settings and TUN were not changed.`)
  } finally {
    for (const close of cleanup.reverse()) await close()
  }
}

await main()
