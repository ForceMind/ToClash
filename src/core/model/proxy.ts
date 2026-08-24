export type ProxyType = 'vless' | 'vmess' | 'trojan' | 'ss' | 'socks5' | 'http'
export type NetworkType = 'tcp' | 'ws' | 'grpc' | 'http' | 'h2' | 'xhttp'

export interface WsOptions { path?: string; host?: string }
export interface GrpcOptions { serviceName?: string }
export interface HttpOptions { path?: string; host?: string[] }
export interface XHttpOptions { path?: string; host?: string; mode?: string; xPaddingBytes?: string }
export interface RealityOptions { publicKey: string; shortId?: string }
export interface PluginOptions { name: string; options: Record<string, string | boolean> }

export interface ProxyNode {
  name: string
  type: ProxyType
  server: string
  port: number
  uuid?: string
  password?: string
  username?: string
  cipher?: string
  alterId?: number
  encryption?: string
  tls?: boolean
  servername?: string
  network?: NetworkType
  flow?: string
  alpn?: string[]
  clientFingerprint?: string
  skipCertVerify?: boolean
  packetEncoding?: string
  udp?: boolean
  ws?: WsOptions
  grpc?: GrpcOptions
  http?: HttpOptions
  xhttp?: XHttpOptions
  reality?: RealityOptions
  plugin?: PluginOptions
}

export type IssueCode = 'INVALID_URI' | 'INVALID_PORT' | 'MISSING_HOST' | 'INVALID_UUID' | 'INVALID_BASE64' | 'INVALID_JSON' | 'UNSUPPORTED_PROTOCOL' | 'UNSUPPORTED_TRANSPORT' | 'MISSING_FIELD' | 'IGNORED_PARAMETER' | 'UNSUPPORTED_PLUGIN'
export interface ConversionIssue { line: number; code: IssueCode; message: string; protocol?: string }
export interface ParseResult { node: ProxyNode; warnings: Omit<ConversionIssue, 'line'>[] }
export interface ConversionResult { nodes: ProxyNode[]; errors: ConversionIssue[]; warnings: ConversionIssue[]; total: number; success: number; failed: number }

export class ConversionError extends Error {
  constructor(public readonly code: IssueCode, message: string, public readonly protocol?: string) { super(message); this.name = 'ConversionError' }
}
