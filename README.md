# ToClash

在浏览器本地将代理链接转换为 Clash / Mihomo 配置。

ToClash 是一个隐私优先的纯前端单页工具。每行粘贴一个代理 URI，即可获得稳定、可导入的 Mihomo YAML；某一条链接损坏不会影响批次中的其他链接。

> 所有转换均在浏览器本地完成。ToClash 永远不会上传你的代理链接。

**在线使用：** <https://forcemind.github.io/ToClash/>

## 功能

- 支持 VLESS、VMess、Trojan、Shadowsocks、SOCKS5、HTTP 和 HTTPS
- 支持 TLS、WebSocket、gRPC、HTTP/H2、Reality 和 VLESS XHTTP
- 输出完整的最简 Mihomo 配置，或仅输出 `proxies:`
- 支持 Unicode 名称、IPv4/IPv6、节点重名处理、批量错误与警告
- 本地复制和 YAML 下载；无后端、无统计、无持久化、无转换 API
- 简体中文默认界面，可切换 English；响应式明暗主题

## 支持范围

| 输入 | 主要支持 |
| --- | --- |
| VLESS | TLS、Reality、WS、gRPC、HTTP/H2、XHTTP、flow、ALPN、fingerprint |
| VMess | Base64 JSON、TLS、WS、gRPC、HTTP/H2 |
| Trojan | TLS、WS、gRPC、HTTP/H2 |
| Shadowsocks | SIP002、legacy Base64、常用插件元数据 |
| SOCKS / SOCKS5 | 用户名密码、TLS 参数 |
| HTTP / HTTPS | 用户名密码、SNI、证书校验参数 |

无法安全映射到 Mihomo 的 URI 参数会显示警告，不会静默丢弃。

## 本地开发

需要 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

质量检查：

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
```

生产构建输出到 `dist/`。

## 部署

### GitHub Pages

仓库包含 `.github/workflows/deploy-pages.yml`。推送到 `main` 后会自动构建并发布 `dist/`。仓库 Pages 的 Source 必须选择 **GitHub Actions**。

```text
https://forcemind.github.io/ToClash/
```

### Cloudflare Pages

```text
Build command: npm run build
Build output directory: dist
Environment variable: NODE_VERSION=20
```

Vite 使用相对资源路径，因此同一构建可部署到 GitHub Pages 的 `/ToClash/` 子路径或自定义域名根路径。v0.1.0 只有根页面，不需要 `_redirects`。

## 架构

协议 parser 只生成统一的 `ProxyNode`，不会直接生成 YAML。Mihomo transformer 负责校验和稳定字段映射，serializer 只负责 YAML 编码。详见[架构文档](docs/ARCHITECTURE.md)。

## 隐私与安全

输入仅存在于 React 组件内存中，不写入 URL、LocalStorage 或日志。剪贴板和文件下载仅由用户主动触发。请勿在 Issue 中提交真实节点或凭据，详见[隐私声明](PRIVACY.md)和[安全政策](SECURITY.md)。

## 项目范围

ToClash 是格式转换器，不是 VPN 客户端、代理服务器、订阅服务、测速工具、账户系统或节点市场。

## 贡献与许可

欢迎提交测试、文档、错误修复和范围明确的协议兼容改进，参见[贡献指南](CONTRIBUTING.md)。本项目依据 Apache License 2.0 授权，详见 [LICENSE](LICENSE)。

---

English summary: ToClash converts common proxy URIs to Mihomo / Clash YAML entirely in your browser. No input is uploaded or persisted. The interface defaults to Simplified Chinese and can switch to English.
