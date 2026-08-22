import { describe, expect, it } from 'vitest'
import { decodeBase64 } from '../src/core/utils/base64'
import { parseBoolean, parseNumber, parseString } from '../src/core/utils/boolean'
import { detectProtocol } from '../src/core/parser/detect'

describe('utilities', () => {
  it('parses explicit booleans without truthy string mistakes', () => {
    expect(parseBoolean('false')).toBe(false); expect(parseBoolean('YES')).toBe(true); expect(parseBoolean('0')).toBe(false); expect(parseBoolean('maybe')).toBeUndefined()
  })
  it('parses typed values', () => { expect(parseNumber('443')).toBe(443); expect(parseNumber('x')).toBeUndefined(); expect(parseString(' a ')).toBe('a') })
  it('decodes unicode, URL-safe and unpadded base64', () => {
    const encoded = btoa(unescape(encodeURIComponent('香港-node'))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    expect(decodeBase64(encoded)).toBe('香港-node')
  })
  it('detects aliases and reports unsupported protocols', () => { expect(detectProtocol('socks://host:1')).toBe('socks5'); expect(() => detectProtocol('hysteria2://x')).toThrow('Unsupported protocol') })
})
