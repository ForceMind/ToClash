import { ConversionError } from '../model/proxy'

export function decodeBase64(input: string): string {
  const compact = input.trim().replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/')
  if (!compact || /[^A-Za-z0-9+/=]/.test(compact)) throw new ConversionError('INVALID_BASE64', 'Unable to decode the Base64 payload.')
  const padded = compact + '='.repeat((4 - (compact.length % 4)) % 4)
  try {
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch { throw new ConversionError('INVALID_BASE64', 'Unable to decode the Base64 payload.') }
}
