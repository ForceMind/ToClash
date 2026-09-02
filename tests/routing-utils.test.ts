import { describe, expect, it } from 'vitest'
import { parseDomainList, parseRoutingTarget } from '../src/core/utils/domain'
import { normalizeDnsServer, parseIntranetConfig } from '../src/core/utils/intranet'
import { uniqueNodeNames } from '../src/core/utils/names'

describe('routing input validation', () => {
  it.each(['example.com,DIRECT', 'bad space.example', 'bad\t.example', 'bad\\example.com', 'bad/path', '-bad.example', 'bad-.example', 'a..example', '*.192.0.2.1', '*.::1', 'ftp://example.com', 'https://user:secret@example.com', 'http://', '', '_srv.example', 'a'.repeat(64) + '.example', Array(5).fill('a'.repeat(60)).join('.')])('rejects unsafe or unsupported input %j', (value) => {
    expect(parseRoutingTarget(value)).toBeNull()
  })

  it.each([
    ['Example.COM.', 'domain', 'example.com'],
    ['*.Example.com', 'domain', 'example.com'],
    ['+.Example.com', 'domain', 'example.com'],
    ['https://例子.测试/path?q=1#anchor', 'domain', 'xn--fsqu00a.xn--0zwm56d'],
    ['wss://api.example.com/socket', 'domain', 'api.example.com'],
    ['ws://example.com/path', 'domain', 'example.com'],
    ['localhost', 'domain', 'localhost'],
    ['https://example.com/path,REJECT?value=x', 'domain', 'example.com'],
    ['192.0.2.1:443', 'ipv4', '192.0.2.1'],
    ['http://[2001:db8::1]:443/path', 'ipv6', '2001:db8::1'],
    ['2001:0db8::1', 'ipv6', '2001:db8::1'],
  ])('normalizes %s', (value, kind, normalized) => {
    expect(parseRoutingTarget(value)).toEqual({ kind, value: normalized })
  })

  it('keeps physical line numbers and canonical deduplication', () => {
    expect(parseDomainList('Example.com\r\n\r\nexample.com.\r\nbad,value\n[::1]\n::1')).toEqual({ domains: ['example.com', '::1'], invalidLines: [4] })
  })
})

describe('explicit intranet DNS', () => {
  it.each([
    ['10.0.0.53', 'udp://10.0.0.53:53'],
    ['10.0.0.53:5353', 'udp://10.0.0.53:5353'],
    ['10.0.0.53:80', 'udp://10.0.0.53:80'],
    ['2001:db8::53', 'udp://[2001:db8::53]:53'],
    ['[2001:db8::53]:5353', 'udp://[2001:db8::53]:5353'],
    ['udp://[2001:db8::53]:53', 'udp://[2001:db8::53]:53'],
  ])('normalizes %s', (value, expected) => expect(normalizeDnsServer(value)).toBe(expected))

  it.each(['', '0.0.0.0', '::', 'system', 'dhcp://system', 'dns.example.com', '10.0.0.53:0', '10.0.0.53:65536', '10.0.0.53:', 'user:secret@10.0.0.53', '10.0.0.53#PROXY', '10.0.0.53/path', 'https://1.1.1.1/dns-query', 'bad ip', 'bad\\ip', '[not-ipv6]'])('rejects %j', (value) => expect(normalizeDnsServer(value)).toBeNull())

  it('requires both suffixes and servers; rejects incomplete or invalid settings atomically', () => {
    expect(parseIntranetConfig('', '').incomplete).toBe(true)
    expect(parseIntranetConfig('corp.example', '').zones).toEqual([])
    const result = parseIntranetConfig('corp.example\n192.0.2.1\nhttps://internal.example', '10.0.0.53\nsecret@bad')
    expect(result.invalidSuffixLines).toEqual([2, 3])
    expect(result.invalidResolverLines).toEqual([2])
    expect(result.zones).toEqual([])
  })

  it('deduplicates and maps a shared resolver list to each suffix', () => {
    expect(parseIntranetConfig('Corp.example\n\n+.corp.example\nlab.example', '10.0.0.53\n\nudp://10.0.0.53:53')).toEqual({
      zones: [{ suffix: 'corp.example', nameservers: ['udp://10.0.0.53:53'] }, { suffix: 'lab.example', nameservers: ['udp://10.0.0.53:53'] }],
      invalidSuffixLines: [], invalidResolverLines: [], incomplete: false,
    })
  })
})

describe('stable names', () => {
  it('avoids existing suffixes and reserved names without mutating input', () => {
    const nodes = [{ name: 'Tokyo' }, { name: 'Tokyo' }, { name: 'Tokyo 2' }, { name: 'PROXY' }, { name: 'PROXY 2' }]
    const result = uniqueNodeNames(nodes, ['PROXY'])
    expect(result.map(({ name }) => name)).toEqual(['Tokyo', 'Tokyo 2', 'Tokyo 2 2', 'PROXY 2', 'PROXY 2 2'])
    expect(nodes[1]?.name).toBe('Tokyo')
    expect(uniqueNodeNames(result, ['PROXY'])).toEqual(result)
  })
  it('keeps Unicode names and handles an empty array', () => {
    expect(uniqueNodeNames([{ name: '香港' }, { name: '香港' }]).map(({ name }) => name)).toEqual(['香港', '香港 2'])
    expect(uniqueNodeNames([])).toEqual([])
  })
})
