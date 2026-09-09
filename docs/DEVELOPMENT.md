# 开发与部署

日常使用请看 [README](../README.md)；本页保留协议支持、开发命令与部署说明。

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

XHTTP 支持 URI 中的 `x_padding_bytes` / `x-padding-bytes`，以及 `extra` JSON 内的 `xPaddingBytes`，统一输出为 Mihomo `xhttp-opts.x-padding-bytes`。显式参数与 `extra` 重复时以显式参数为准。

常规模式完整配置包含 `PROXY` 手动选择组、`AUTO` 自动选择组、仅代理的 `FORCE_PROXY` 组，以及局域网直连、可选内网规则、用户规则、服务预设、国内直连和 `MATCH,PROXY` 兜底。`AUTO` 的测速发生在用户导入配置后的 Mihomo 中，网页不会连接节点。默认直连模式只生成节点组成的 `FORCE_PROXY`，选中的服务强制代理，其他流量 `MATCH,DIRECT`；不生成 GeoSite / GeoIP 兜底或 `AUTO`。

用户直连优先于用户代理和服务预设，但不能覆盖更优先的本机 / 局域网与内网保护。用户“始终代理”和 AI 预设使用 `FORCE_PROXY`；该组没有 `DIRECT`，对应规则后附同条件 `REJECT`，避免不支持 UDP 时落入后续直连规则。普通 `PROXY` 仍允许手动选择 `DIRECT`。

v0.3.3 有 29 项、6 类服务预设。既有 Codex / OpenAI、Claude / Anthropic、开发者服务 / GitHub、Google / YouTube 默认开启；新增 25 项默认关闭。常规模式保留 Google / YouTube 和 GitHub 的 `PROXY` 行为，其余选中服务使用 `FORCE_PROXY`。设置与 DNS 由同一规则计划生成，详见[服务目录](SERVICE_CATALOG.md)。预设按域名分流，不能保证 Telegram 等客户端的 IP 直连或音视频流量。

本版的交付范围和验证边界见 [v0.3.3 发布记录](RELEASE_v0.3.3.md)。

VLESS / VMess 的 UUID 输入验证为 8-4-4-4-12 十六进制形状。它保留节点提供方发放的 128 位凭据，不额外限制 RFC UUID 的版本位或变体位。

域名规则覆盖自身及子域名；网址只提取主机，不按路径分流。IPv4 / IPv6 转换为精确 IP 规则。任何无效设置都会暂停完整配置导出，修正后自动恢复；切换为“仅 proxies”不应用分流设置。“清空节点和结果”保留分流设置；“重置已保存设置”单独清除自定义及内网配置并恢复规则默认值。详见[规则与 DNS 使用指南](RULES.md)。

## 本地开发

需要 Node.js 20 或更高版本；推荐 Node.js 22（本轮验证版本）。Node.js 26 的实验性 Web Storage 与当前 Vitest / jsdom 存在冲突；测试请使用 Node.js 22，或临时设置 `NODE_OPTIONS=--no-experimental-webstorage`。

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
npx playwright install chromium
npm run test:browser
```

生产构建输出到 `dist/`。

规则和 DNS 变更还可使用本机可信 Mihomo 及已准备的 GeoSite / GeoIP 数据验证：

```bash
npm run test:mihomo -- /path/to/mihomo /path/to/geodata
npm run test:mihomo:dns -- /path/to/mihomo /path/to/geodata
```

第一项只检查配置可加载；第二项实际验证解析策略和模拟节点连接，全程使用回环地址上的模拟上游，不修改系统 DNS/TUN。详见[验证记录](VALIDATION.md)。

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
Environment variable: NODE_VERSION=22
```

Vite 使用相对资源路径，因此同一构建可部署到 GitHub Pages 的 `/ToClash/` 子路径或自定义域名根路径。应用只有首页，不需要 `_redirects`。公共界面不显示仓库推广链接；规则预设中的 GitHub 指需要分流的开发者服务。

#### Cloudflare Direct Upload

Cloudflare Direct Upload 只能上传预先构建的静态资源，不能上传项目源码包。先运行：

```bash
npm ci
npm run build
```

然后在控制台拖入 `dist/` 文件夹，或把 **`dist/` 里面的内容**压缩为 ZIP 后上传。ZIP 根目录必须直接包含：

```text
index.html
favicon.svg
assets/
```

不要上传源码 ZIP；根目录的源码 `index.html` 会引用 `/src/main.tsx`，无法由 Direct Upload 自动编译。上传当前构建产生的 `dist/` 内容。

如果浏览器报模块 MIME 类型错误，首先确认上传的是构建产物，并在开发者工具中检查 `assets/*.js` 返回 JavaScript 文件（不是源码、404 或 HTML）。不要通过关闭 MIME 校验处理。

## 架构

协议 parser 只生成统一的 `ProxyNode`，不会直接生成 YAML。纯函数规则规划器将用户设置与预设统一编译为规则和 DNS；Mihomo transformer 校验并映射节点、组和规则；serializer 使用 YAML AST 编码并加入分类注释。详见[架构文档](ARCHITECTURE.md)与[验证记录](VALIDATION.md)。
