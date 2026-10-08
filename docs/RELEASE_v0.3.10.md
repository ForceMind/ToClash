# v0.3.10 正式发布记录

发布日期：2026-10-08。

Claude 默认开启的预设新增 `clau.de` 及其子域，域名规则和代理 DNS 同步启停。[Anthropic 官方插件目录](https://github.com/anthropics/claude-plugins-community)使用该域名作为提交入口。

同时加入[官方 IP 说明](https://platform.claude.com/docs/en/api/ip-addresses)列出的全部 API / Console 入站目的范围：`160.79.104.0/23`、`2607:6bc0::/48`。生成带 `no-resolve` 的强制代理与相邻 REJECT，不生成 IP DNS policy；显式直连 IP 仍先匹配，默认 IPv6 禁用不变。YAML 导入识别这些匹配项，关闭 Claude 会移除接管规则、保留其他未接管 CIDR。

不加入工具出口源地址 `160.79.104.0/21`、退役地址或整个共享云 / CDN 的 IP 范围；上述目的 IP 不保证覆盖 Claude 网页或 AWS 托管端点。来源核对于本次发布日期，详情见[服务目录](SERVICE_CATALOG.md)。服务数量仍为 41 项，默认开关和旧保存选择不变。

## 代码与验证

- 功能源提交：`693d28155f653077c4610ecdffb1bb4f686bef83`，非强制推送到现有 `main`。
- 本地 lint、typecheck、247/247 测试、覆盖率检查和构建通过；核心行覆盖率 97.70%。
- 本机 Chrome 桌面浅色 / 移动深色完整浏览器回归 10/10 通过，含新规则开关及原有 YAML 导入、复制、下载和存储恢复；已查看实际截图。
- 完整 [GitHub CI](https://github.com/ForceMind/ToClash/actions/runs/37759666796) 与 [GitHub Pages 发布](https://github.com/ForceMind/ToClash/actions/runs/37759666920) 成功。

## 部署与访问

- Cloudflare Pages 项目 `to-clash`，列表回读 `Production/main/693d281`。
- 部署 ID：`ca69e24d-25f7-44db-bb94-4e2ce5154918`；Wrangler 4.131.1。
- 独立部署：[ca69e24d.to-clash.pages.dev](https://ca69e24d.to-clash.pages.dev/)。只上传四个构建文件，排除 macOS 附属文件、源码和节点配置。
- 实际打开[主站](https://toclash.xincreates.com/)、[Cloudflare 默认域名](https://to-clash.pages.dev/)和[GitHub Pages](https://forcemind.github.io/ToClash/)，均显示 v0.3.10。

这些证据证明配置生成、浏览器流程及静态站点发布。本批次未测试真实 Mihomo、节点出口、`clau.de` 跳转和 Claude 业务访问，未改变系统代理、DNS 或 TUN。更新已有客户端配置时，刷新页面后重新导入 / 粘贴 YAML，保持 Claude 开启，再生成并导入客户端；旧 YAML 不会自动更新。
