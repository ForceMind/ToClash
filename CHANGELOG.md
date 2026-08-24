# 变更日志

这里记录 ToClash 的重要变更。

## 0.2.0 — 2026-08-24

- 界面和项目文档默认使用简体中文，并保留英文切换。
- 完整配置新增 `PROXY` / `AUTO` 策略组、fake-ip DNS、局域网与国内直连、国际服务代理规则。
- 新增用户自定义“始终直连”和“始终代理”网站的引导、输入校验及冲突处理。
- 支持 VLESS XHTTP `x_padding_bytes`、`x-padding-bytes` 与 `extra.xPaddingBytes` 参数映射。
- 新增可直接上传 Cloudflare Pages 的静态成品压缩包说明。
- 公共页面不再显示 GitHub 链接，并在页脚显示当前版本。

### English

- Made Simplified Chinese the default UI and documentation language while retaining the English toggle.
- Added practical `PROXY` / `AUTO` groups, fake-IP DNS, LAN/China direct rules, and international service proxy rules.
- Added guided custom always-direct and always-proxy domain routing with validation and conflict handling.
- Added VLESS XHTTP padding mapping for `x_padding_bytes`, `x-padding-bytes`, and `extra.xPaddingBytes`.
- Documented the ready-to-upload Cloudflare Pages archive and added the app version to the footer.

## 0.1.0 — 2026-08-23

- 新增 VLESS、VMess、Trojan、Shadowsocks、SOCKS5、HTTP 和 HTTPS 本地批量转换。
- 新增 TLS、WebSocket、gRPC、HTTP/H2、Reality 和 VLESS XHTTP 映射。
- 新增完整 Mihomo 配置与仅 `proxies:` 两种输出模式。
- 新增逐行错误、警告、Unicode 名称、IPv6 和重名处理。
- 新增复制、YAML 下载、示例、响应式布局、明暗主题以及默认简体中文/英文切换。
- 新增单元测试、覆盖率、严格 TypeScript、CI、GitHub Pages、Cloudflare Pages 和项目文档。

### English

- Added local batch conversion for VLESS, VMess, Trojan, Shadowsocks, SOCKS5, HTTP, and HTTPS links.
- Added TLS, WebSocket, gRPC, HTTP/H2, Reality, and VLESS XHTTP mappings.
- Added full Mihomo config and `proxies:`-only output modes.
- Added structured per-line errors, warnings, Unicode names, IPv6, and duplicate-name handling.
- Added copy, local YAML download, example input, responsive layout, and system-aware light/dark themes.
- Added unit tests, coverage, linting, strict TypeScript, CI, GitHub Pages deployment, Cloudflare Pages instructions, and project governance documents.
