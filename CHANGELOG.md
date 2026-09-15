# 变更日志

这里记录 ToClash 的重要变更。

## 0.3.6 — 2026-09-15

- 将内网专用向导升级为全局六步新手模式，覆盖网络模式、代理链接、常用服务、网站分流、内网 DNS 和确认转换。
- 首次访问自动打开，页头按钮可随时手动重新触发；关闭或 Escape 不应用草稿。
- 只保存 `seen` 首次展示标记，不持久化代理链接或向导草稿；内网字段不自动填入任何后缀。
- 保留完整页面的全部 29 项服务与高级设置，新手模式只提供常用、安全的简易入口。
- 增加中英文、输入阻断、完整应用、存储、桌面浅色和手机深色浏览器回归，并修复深色弹窗文字对比度。
- 部署到新的 Cloudflare Pages 预览分支，验证首次自动打开、手动入口和空白内网字段；不更新生产环境。
- 非强制快进远程 `main`，完成 GitHub Pages 与 Cloudflare Pages 正式部署，并验证三处生产入口。

### English

Expanded the intranet-only dialog into a six-step beginner mode for the complete conversion flow. It opens on first visit, remains available from the header, applies only after confirmation, stores only a `seen` marker, and preserves the full advanced page.

## 0.3.5 — 2026-09-15

- 增加三步弹窗式内网 DNS 新手引导，覆盖网络前提、域名后缀和 DNS 输入。
- 空表单首次启用内网 DNS 时自动打开向导，也可以通过按钮随时重新打开。
- 域名和 DNS 默认保持空白；不预填 `svc.cluster.local` 或任何实际配置，只有用户确认后才写回表单。
- 增加中英文、输入校验、关闭/Escape、默认直连和桌面/手机浏览器回归。
- 部署到新的 Cloudflare Pages 预览分支，使首次打开使用独立空白 LocalStorage；不更新生产环境。

### English

Added a three-step intranet DNS setup dialog with blank-by-default inputs, explicit apply behavior, bilingual guidance, validation, and keyboard/mobile coverage. The guide never pre-fills `svc.cluster.local` or a DNS server.

## 0.3.4 — 2026-09-15

- 当有效内网后缀为 `local` 或以 `.local` 结尾时，显示 macOS Edge / Chromium + Clash Verge 的中英文上下文提示。
- 说明 Clash Verge 默认 `*.local` 系统代理绕过、必要绕过项保留方式，以及 ToClash 仅生成 Mihomo YAML 的能力边界。
- 增加 `svc.cluster.local` 的 DNS 规范化、两类 DNS 策略、fake-IP 排除和 DIRECT 规则回归，并覆盖 UI 触发、非触发、语言切换与 Chromium 布局。
- 补充关闭 hosts 命中后验证内网 DNS 的方法，并部署独立 Cloudflare Pages 预览；不更新生产环境或真实客户端配置。

### English

Added a bilingual macOS Edge / Chromium + Clash Verge notice for `.local` intranet suffixes, exact `svc.cluster.local` DNS and routing regression coverage, and client-side verification guidance. ToClash still only generates Mihomo YAML and does not change operating-system or Clash Verge settings.

## 0.3.1

- 自定义网站分流和内网 DNS 自动本地保存与恢复，存储失败明确提示。
- 拆分清空节点与重置设置；节点凭据和 YAML 不持久保存。
- 增加填写指南与仓库阅读路径，忽略 macOS AppleDouble 附属文件。

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
