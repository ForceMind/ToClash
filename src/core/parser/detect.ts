import { ConversionError, type ProxyType } from '../model/proxy'

export function detectProtocol(uri: string): ProxyType {
  const match = /^([a-z][a-z0-9+.-]*):\/\//i.exec(uri.trim())
  const protocol = match?.[1]?.toLowerCase()
  if (protocol === 'vless' || protocol === 'vmess' || protocol === 'trojan' || protocol === 'ss') return protocol
  if (protocol === 'socks' || protocol === 'socks5') return 'socks5'
  if (protocol === 'http' || protocol === 'https') return 'http'
  throw new ConversionError('UNSUPPORTED_PROTOCOL', protocol ? `Unsupported protocol "${protocol}".` : 'Link has no supported protocol.', protocol)
}
