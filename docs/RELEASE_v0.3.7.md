# v0.3.7 正式发布记录

发布日期：2026-09-22。

## 发布内容

- 主输入框支持完整 Clash / Mihomo YAML 粘贴与 `.yaml` / `.yml` 文件导入。
- 保留原 `proxies:` 节点，包括 VLESS XHTTP、`xhttp-opts` 和未知节点字段；不重新解析或丢弃未知协议字段。
- 保留未接管的顶层配置、额外 DNS 字段、规则和策略组；ToClash 接管 `mode: rule`、自己的策略组、服务 / 自定义分流、DNS policy 与最终 `MATCH`。
- 自动恢复可安全识别的默认直连模式、服务选择、自定义分流、统一内网 DNS 和 CGNAT。多 DNS 内网区域及常规模式的 `system` 区域保留原配置并提示，避免错误合并。
- 原始 YAML 与节点凭据只留在页面内存，不写入 LocalStorage、URL 或远端服务。

## Git 与 CI

- 功能源提交：`01892406772b3e312e114175cfaa32d2e0b11fe8`（`feat: import existing Clash YAML profiles`）。
- 远端 `main` 已回读为该提交；从 v0.3.6 的 `928d63f` 非强制快进。
- [GitHub CI](https://github.com/ForceMind/ToClash/actions/runs/35685317450) 通过。
- [GitHub Pages 工作流](https://github.com/ForceMind/ToClash/actions/runs/35685317534) 通过。

## Cloudflare Pages 正式部署

- 项目：`to-clash`。
- 环境：`Production`。
- 分支：`main`。
- 源提交：`0189240`。
- Wrangler：4.131.1。
- 部署 ID：`64bd7e8b-766a-4397-8520-8c2f79e9c45f`。
- 独立部署：[64bd7e8b.to-clash.pages.dev](https://64bd7e8b.to-clash.pages.dev/)。

上传前重新构建 v0.3.7，并从构建目录剔除 macOS `._*` AppleDouble 附属文件。Cloudflare 部署列表随后回读为 `Production` / `main` / `0189240`。

## 生产入口验收

以下入口均在实际浏览器中打开，显示 `ToClash v0.3.7`、"代理链接或 Clash YAML" 输入与"导入 YAML 文件"入口，并保留首次新手模式：

1. [Cloudflare 自定义域名](https://toclash.xincreates.com/)
2. [Cloudflare 默认域名](https://to-clash.pages.dev/)
3. [GitHub Pages](https://forcemind.github.io/ToClash/)

本记录证明静态生产部署与页面版本已更新；不证明用户真实节点、Mihomo 核心兼容性、企业 DNS、VPN、Clash Verge 接管或 Edge `.local` 实际网络路径。完整本地验证和边界见[验证记录](VALIDATION.md)。
