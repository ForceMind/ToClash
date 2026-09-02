# 变更日志

这里记录 ToClash 的重要变更。

## 0.3.0 — 2026-09-02

- 增加 OpenAI、Claude、开发者服务与 Google / YouTube 四类可切换规则预设。
- 增加不含 `DIRECT` 的 `FORCE_PROXY` 组，以及同条件 `REJECT` 防止不支持 UDP 时降级直连。
- 增加内网后缀 / DNS 引导、fake-IP 排除和可选 CGNAT 直连。
- 统一规则 / DNS 编译、父子域覆盖提示、IPv4 / IPv6 目标和保留节点名称处理。
- 错误规则设置阻断完整配置导出；仅 proxies 模式不受暂未使用的设置影响。
- 使用 YAML AST 添加分类注释；补充核心回归、浏览器交互和实际 Mihomo 配置检查。
- 修复独立审查发现的 DNS 优先级问题：显式域名策略排在 GeoSite 兜底前。
- 补齐代理节点独立 DNS 策略，仅包含本地拒绝和内网 DNS；避免内网节点名送往公共节点解析器。
- 增加真实 Mihomo DNS / 本机连接测试与两项旧缺陷反例。具体验收状态见[验证记录](docs/VALIDATION.md)。
- 锁定 Playwright 下载来源为官方 npm registry，避免 CI / Pages 依赖不可用镜像。

### English

Added configurable service presets, a proxy-only group, coordinated intranet settings, validated domain/IP overrides and annotated YAML. Fixed explicit DNS policy ordering and isolated internal node hostname resolution; added real Mihomo DNS/connection tests and negative controls. See the validation record for acceptance status.

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
