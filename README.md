# ToClash

Convert proxy links to Clash / Mihomo configs directly in your browser.

ToClash is a privacy-first, static single-page application. Paste one proxy URI per line and receive stable, importable Mihomo YAML. A malformed link does not stop the rest of a batch.

**Live site:** <https://forcemind.github.io/ToClash/>

> All conversion happens locally in your browser. Your proxy links are never uploaded by ToClash.

## Features

- VLESS, VMess, Trojan, Shadowsocks (SIP002), SOCKS5, HTTP, and HTTPS input
- TLS, WebSocket, gRPC, HTTP/H2, Reality, and VLESS XHTTP mapping
- Full minimal Mihomo config or `proxies:`-only output
- Unicode names, IPv4/IPv6, duplicate-name handling, batch errors and warnings
- Local copy and download; no backend, analytics, persistence, or conversion API
- Responsive light/dark interface

## Supported protocols

| Input | Important support |
| --- | --- |
| VLESS | TLS, Reality, WS, gRPC, HTTP/H2, XHTTP, flow, ALPN, fingerprint |
| VMess | Base64 JSON, TLS, WS, gRPC, HTTP/H2 |
| Trojan | TLS, WS, gRPC, HTTP/H2 |
| Shadowsocks | SIP002 and legacy Base64, common plugin metadata |
| SOCKS / SOCKS5 | Authentication, TLS flags |
| HTTP / HTTPS | Authentication, SNI, certificate verification flag |

Unknown URI parameters are reported as warnings when they cannot be safely mapped. ToClash targets current Mihomo / Clash.Meta syntax.

## Development

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Quality commands:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
```

The production build is written to `dist/`.

## Deployment

This project is a static Vite application and needs no server or database.

### Cloudflare Pages

- Framework preset: Vite (or None)
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `NODE_VERSION=20`

No SPA redirect is needed because v0.1.0 has only the root page.

### GitHub Pages

The repository includes `.github/workflows/deploy-pages.yml`. Every push to `main` builds and publishes `dist/` using the official GitHub Pages artifact flow. In the repository settings, select **GitHub Actions** as the Pages source. The expected project URL is:

```text
https://forcemind.github.io/ToClash/
```

Vite uses relative asset paths, so the same build works under the `/ToClash/` project path and at a custom-domain root.

## Architecture

Protocol parsers produce a normalized `ProxyNode`; they never generate YAML. The Mihomo transformer validates and maps normalized nodes to ordered configuration objects, and the serializer handles YAML output. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Privacy and security

Input exists in React component memory only. It is not put in URLs or local storage and is not logged. Clipboard and file download actions happen only after user interaction. Do not include real credentials in bug reports; see [SECURITY.md](SECURITY.md).

For a concise data-handling statement, see [PRIVACY.md](PRIVACY.md).

## Contributing

Bug fixes, tests, documentation, and carefully scoped protocol compatibility improvements are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Scope

ToClash is a converter, not a VPN client, proxy server, subscription service, latency tester, account system, or node marketplace.

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE).
