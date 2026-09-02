import assert from 'node:assert/strict'
import { spawn, type ChildProcess } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { createSocket } from 'node:dgram'
import { Resolver } from 'node:dns/promises'
import { createServer, type Server, type Socket } from 'node:net'
import { setTimeout as pause } from 'node:timers/promises'
import { stringify } from 'yaml'

export interface MockDns {
  url: string
  queries: string[]
  close: () => Promise<void>
}

/** Controlled local DNS responder: TXT identifies an upstream; A resolves mock nodes. */
export async function mockDns(label: string): Promise<MockDns> {
  const socket = createSocket('udp4')
  const queries: string[] = []
  socket.on('message', (message, remote) => {
    if (message.length < 17 || message.readUInt16BE(4) !== 1) return
    let end = 12
    const labels: string[] = []
    while (end < message.length && message[end] !== 0) {
      const length = message[end]!
      if (length > 63 || end + 1 + length >= message.length) return
      labels.push(message.toString('ascii', end + 1, end + 1 + length))
      end += 1 + length
    }
    end += 1
    if (end + 4 > message.length) return
    const type = message.readUInt16BE(end)
    end += 4
    queries.push(labels.join('.').toLowerCase())
    const answer = type === 1 ? Buffer.from([127, 0, 0, 1])
      : type === 16 ? Buffer.concat([Buffer.from([label.length]), Buffer.from(label)]) : null
    const header = Buffer.from(message.subarray(0, 12))
    header.writeUInt16BE(0x8180, 2)
    header.writeUInt16BE(answer ? 1 : 0, 6)
    header.writeUInt16BE(0, 8)
    header.writeUInt16BE(0, 10)
    const record = Buffer.alloc(12)
    record.writeUInt16BE(0xc00c, 0)
    record.writeUInt16BE(type, 2)
    record.writeUInt16BE(1, 4)
    record.writeUInt16BE(answer?.length ?? 0, 10)
    socket.send(Buffer.concat([header, message.subarray(12, end), ...(answer ? [record, answer] : [])]), remote.port, remote.address)
  })
  await new Promise<void>((resolve, reject) => {
    socket.once('error', reject)
    socket.bind(0, '127.0.0.1', resolve)
  })
  return {
    url: `udp://127.0.0.1:${socket.address().port}`, queries,
    close: () => new Promise<void>((resolve) => socket.close(() => resolve())),
  }
}

async function listen(server: Server): Promise<number> {
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  assert(address && typeof address !== 'string')
  return address.port
}

async function unusedPort(): Promise<number> {
  const server = createServer()
  const port = await listen(server)
  await new Promise<void>((resolve) => server.close(() => resolve()))
  return port
}

/** A local HTTP CONNECT endpoint that never forwards or resolves its target. */
export async function mockProxy() {
  const sockets = new Set<Socket>()
  let connections = 0
  const server = createServer((socket) => {
    sockets.add(socket)
    connections += 1
    let buffer = ''
    let tunnel = false
    socket.setTimeout(5000, () => socket.destroy())
    socket.on('error', () => socket.destroy())
    socket.on('close', () => sockets.delete(socket))
    socket.on('data', (chunk) => {
      buffer += chunk.toString('ascii')
      if (buffer.length > 8192) { socket.destroy(); return }
      if (!buffer.includes('\r\n\r\n')) return
      if (!tunnel && buffer.startsWith('CONNECT ')) {
        buffer = buffer.slice(buffer.indexOf('\r\n\r\n') + 4)
        tunnel = true
        socket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
      } else {
        // Nonzero elapsed time keeps Mihomo URLTest from treating a 0 ms result as failure.
        setTimeout(() => socket.end('HTTP/1.1 204 No Content\r\nContent-Length: 0\r\nConnection: close\r\n\r\n'), 15)
      }
    })
  })
  const port = await listen(server)
  return {
    port, connections: () => connections,
    close: async () => {
      for (const socket of sockets) socket.destroy()
      await new Promise<void>((resolve) => server.close(() => resolve()))
    },
  }
}

async function stop(child: ChildProcess): Promise<void> {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return
  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => child.kill('SIGKILL'), 2000)
    child.once('exit', () => { clearTimeout(timer); resolve() })
    child.kill('SIGTERM')
  })
}

export async function startMihomo(binary: string, directory: string, config: Record<string, unknown>) {
  const apiPort = await unusedPort()
  const dnsPort = await unusedPort()
  const secret = randomBytes(16).toString('hex')
  const api = `http://127.0.0.1:${apiPort}`
  const dns = config.dns as Record<string, unknown>
  const controlled = {
    ...config, 'mixed-port': 0, port: 0, 'socks-port': 0,
    'allow-lan': false, 'bind-address': '127.0.0.1',
    'external-controller': `127.0.0.1:${apiPort}`, secret,
    'log-level': 'silent', 'geodata-auto-update': false,
    profile: { 'store-selected': false, 'store-fake-ip': false },
    dns: { ...dns, listen: `127.0.0.1:${dnsPort}`, 'use-hosts': false, 'use-system-hosts': false },
    // Disable automatic health checks in the harness. Only explicit local tests may dial.
    'proxy-groups': (config['proxy-groups'] as { name: string; proxies: string[] }[])
      .map(({ name, proxies }) => ({ name, proxies, type: 'select' })),
  }
  const child = spawn(binary, ['-d', directory, '-config', Buffer.from(stringify(controlled)).toString('base64')], { stdio: ['ignore', 'pipe', 'pipe'] })
  let log = ''
  let spawnError: Error | undefined
  child.once('error', (error) => { spawnError = error })
  child.stdout.on('data', (chunk: Buffer) => { log = (log + chunk.toString()).slice(-4096) })
  child.stderr.on('data', (chunk: Buffer) => { log = (log + chunk.toString()).slice(-4096) })
  const request = (path: string) => fetch(`${api}${path}`, { headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(5000) })
  const resolver = new Resolver({ timeout: 1000, tries: 1 })
  resolver.setServers([`127.0.0.1:${dnsPort}`])
  try {
    let ready = false
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (spawnError) throw spawnError
      if (child.exitCode !== null) throw new Error(`Mihomo exited during startup: ${log}`)
      try { ready = (await request('/version')).ok } catch { /* Startup is asynchronous. */ }
      if (ready) break
      await pause(50)
    }
    assert(ready, `Mihomo failed to start: ${log}`)
    // The controller starts before configuration/DNS initialization finishes.
    let dnsReady = false
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (child.exitCode !== null) throw new Error(`Mihomo exited before DNS was ready: ${log}`)
      try {
        await resolver.resolveTxt('toclash-readiness.invalid')
        dnsReady = true
        break
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ECONNREFUSED') throw error
      }
      await pause(50)
    }
    assert(dnsReady, `Mihomo DNS failed to start: ${log}`)
    return {
      txt: (domain: string) => resolver.resolveTxt(domain),
      delay: (name: string) => request(`/proxies/${encodeURIComponent(name)}/delay?${new URLSearchParams({ url: 'http://127.0.0.1/check', timeout: '2000', expected: '204' })}`),
      close: async () => { resolver.cancel(); await stop(child) },
    }
  } catch (error) {
    resolver.cancel()
    await stop(child)
    throw error
  }
}
