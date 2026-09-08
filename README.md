# ToClash

在浏览器本地将代理链接转换为 Clash / Mihomo 配置。

ToClash 是一个隐私优先的纯前端单页工具。每行粘贴一个代理 URI，即可获得稳定、可导入的 Mihomo YAML；某一条链接损坏不会影响批次中的其他链接。

> 所有转换均在浏览器本地完成。ToClash 永远不会上传你的代理链接。

**在线使用：** <https://forcemind.github.io/ToClash/>

填写时先看[表单填写指南](docs/FILLING_GUIDE.md)，规则细节看[规则与 DNS 使用指南](docs/RULES.md)。

## 功能

- 支持 VLESS、VMess、Trojan、Shadowsocks、SOCKS5、HTTP 和 HTTPS
- 支持 TLS、WebSocket、gRPC、HTTP/H2、Reality 和 VLESS XHTTP
- 输出包含策略组、fake-ip DNS 和常用分流规则的完整 Mihomo 配置，或仅输出 `proxies:`
- 支持 Unicode 名称、IPv4/IPv6、节点重名处理、批量错误与警告
- 本地复制和 YAML 下载；无后端、无统计、无转换 API；自定义分流和内网 DNS 在浏览器本地保存
- 简体中文默认界面，可切换 English；响应式明暗主题
- 提供“始终直连”和“始终代理”的自定义网站分流引导，支持域名或完整网址
- 提供 OpenAI、Claude、开发者服务、Google / YouTube 四类可切换规则预设
- 可填写内网域名后缀和内网 DNS，统一生成 DNS 分流、fake-IP 排除及直连规则

开发中的规则增强版本、验收结果和已知限制见[验证记录](docs/VALIDATION.md)。本地工作区更新不代表线上版本已更新。

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

完整配置默认包含 `PROXY` 手动选择组、`AUTO` 自动选择组、仅代理的 `FORCE_PROXY` 组，以及局域网直连、可选内网规则、用户规则、服务预设、国内直连和 `MATCH,PROXY` 兜底。`AUTO` 的测速发生在用户导入配置后的 Mihomo 中，网页不会连接节点。

用户直连优先于用户代理和服务预设，但不能覆盖更优先的本机 / 局域网与内网保护。用户“始终代理”和 AI 预设使用 `FORCE_PROXY`；该组没有 `DIRECT`，对应规则后附同条件 `REJECT`，避免不支持 UDP 时落入后续直连规则。普通 `PROXY` 仍允许手动选择 `DIRECT`。

域名规则覆盖自身及子域名；网址只提取主机，不按路径分流。IPv4 / IPv6 转换为精确 IP 规则。任何无效设置都会暂停完整配置导出，修正后自动恢复；切换为“仅 proxies”不应用分流设置。“清空节点和结果”保留分流设置；“重置已保存设置”单独清除自定义及内网配置并恢复规则默认值。详见[规则与 DNS 使用指南](docs/RULES.md)。

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

第一项只检查配置可加载；第二项实际验证解析策略和模拟节点连接，全程使用回环地址上的模拟上游，不修改系统 DNS/TUN。详见[验证记录](docs/VALIDATION.md)。

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

不要上传 `ToClash-v0.3.0-source.zip`；它用于开发，根目录的源码 `index.html` 会引用 `/src/main.tsx`，无法由 Direct Upload 自动编译。发布包使用 `ToClash-v0.3.0-pages.zip`。

如果浏览器报模块 MIME 类型错误，首先确认上传的是构建产物，并在开发者工具中检查 `assets/*.js` 返回 JavaScript 文件（不是源码、404 或 HTML）。不要通过关闭 MIME 校验处理。

## 架构

协议 parser 只生成统一的 `ProxyNode`，不会直接生成 YAML。纯函数规则规划器将用户设置与预设统一编译为规则和 DNS；Mihomo transformer 校验并映射节点、组和规则；serializer 使用 YAML AST 编码并加入分类注释。详见[架构文档](docs/ARCHITECTURE.md)与[验证记录](docs/VALIDATION.md)。

## 隐私与安全

代理链接和生成的 YAML 仅存在于 React 组件内存中，不写入 URL、LocalStorage 或日志。自定义网站分流和内网 DNS 使用 LocalStorage 自动保存。剪贴板和文件下载仅由用户主动触发。请勿在 Issue 中提交真实节点或凭据，详见[隐私声明](PRIVACY.md)和[安全政策](SECURITY.md)。

## 项目范围

ToClash 是格式转换器，不是 VPN 客户端、代理服务器、订阅服务、测速工具、账户系统或节点市场。

生成配置不保证账号验证成功、节点可达或应用一定经过 Mihomo。浏览器自带 DoH、系统 mDNS、VPN 路由和未被代理接管的流量仍需在客户端环境中处理；ToClash 不修改这些设置。国内分流依赖客户端可用的 GeoSite / GeoIP 数据。普通“始终直连”不等于自动排除 fake-IP，内网访问请使用专门的内网设置。

## 贡献与许可

欢迎提交测试、文档、错误修复和范围明确的协议兼容改进，参见[贡献指南](CONTRIBUTING.md)。本项目依据 Apache License 2.0 授权，详见 [LICENSE](LICENSE)。

---

English summary: ToClash converts common proxy URIs to Mihomo / Clash YAML entirely in your browser. No input is uploaded. Custom routing and intranet DNS are persisted locally; proxy links are not. The interface defaults to Simplified Chinese and can switch to English.
