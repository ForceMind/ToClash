import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { parseLink } from '../src/core/parser'
import { serializeMihomo } from '../src/core/serializer/yaml'
import type { CustomRouting, PresetId } from '../src/core/rules/types'

const [binaryInput, dataInput] = process.argv.slice(2)
if (!binaryInput || !dataInput) throw new Error('Usage: npm run test:mihomo -- /path/to/mihomo /path/to/test-geodata')
const binary = resolve(binaryInput)
const data = resolve(dataInput)
if (![binary, join(data, 'geosite.dat'), join(data, 'country.mmdb')].every(existsSync)) {
  throw new Error('Provide an installed Mihomo binary and existing geosite.dat / country.mmdb test data.')
}
const workspace = mkdtempSync(join(tmpdir(), 'toclash-core-check-'))
for (const name of ['geosite.dat', 'country.mmdb']) copyFileSync(join(data, name), join(workspace, name))
const version = spawnSync(binary, ['-v'], { encoding: 'utf8', timeout: 10_000 })
if (version.status !== 0) throw new Error('Unable to run the supplied Mihomo binary.')
console.log(version.stdout.trim())
const node = parseLink('http://example.invalid:8080#Example').node
const ids: PresetId[] = ['openai', 'claude', 'developer', 'google']
const scenarios: CustomRouting[] = Array.from({ length: 16 }, (_, mask) => ({
  presets: Object.fromEntries(ids.map((id, bit) => [id, Boolean(mask & (1 << bit))])),
}))
scenarios.push(
  { directDomains: ['example.com'], proxyDomains: ['child.example.com', '192.0.2.1', '2001:db8::1'] },
  { directDomains: ['child.example.com'], proxyDomains: ['example.com'] },
  { bypassCgnat: true, intranet: [{ suffix: 'corp.example', nameservers: ['192.0.2.53'] }, { suffix: 'lab.corp.example', nameservers: ['[2001:db8::53]:53'] }] },
  { directDomains: ['openai.com'], intranet: [{ suffix: 'lan', nameservers: ['192.0.2.53'] }] },
)
for (const [index, routing] of scenarios.entries()) {
  const config = join(workspace, `case-${index + 1}.yaml`)
  writeFileSync(config, serializeMihomo([node, { ...node, name: 'AUTO' }, { ...node, name: 'DIRECT' }], 'full', routing))
  const result = spawnSync(binary, ['-t', '-d', workspace, '-f', config], { encoding: 'utf8', timeout: 30_000 })
  if (result.status !== 0) throw new Error(`Mihomo rejected fixture ${index + 1}: ${result.stdout}\n${result.stderr}`)
}
console.log(`PASS: ${scenarios.length} generated configs accepted by Mihomo. No proxy service was started.`)
console.log(`Synthetic fixtures retained in ${workspace}`)
