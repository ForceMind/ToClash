# v0.3.8 正式发布记录

发布日期：2026-09-28。

## 发布内容

- 新增 Meta / Meta AI / Quest、Amazon 购物、AWS 控制台、Cloudflare、Figma、Adobe、PayPal、Stripe、Pinterest、Snapchat、Roblox，共 11 个独立服务开关；目录现有 40 项、7 类。
- 新开关默认关闭；启用后同时生成 `FORCE_PROXY`、相邻 `REJECT` 和代理 DNS policy。原有四项默认启用服务及各用户已保存开关保持原约定。
- AWS 控制台覆盖官方控制台与登录域名；不把 `amazonaws.com`、`cloudfront.net` 等客户托管域名纳入预设。Figma 用户发布站点 `figma.site` 也未纳入。
- 各项域名依据与重叠边界见[服务目录](SERVICE_CATALOG.md)。

## Git 与验证

- 功能源提交：`76152051ef4328a90c21bf9288b02a5d5ed68897`（`feat: expand selectable US service routing presets`）。从 v0.3.7 的 `6d4ee56` 非强制快进到 `main`。
- 本地通过 lint、typecheck、242/242 项测试、97.69% 核心行覆盖率和构建。
- 本机 Chrome Playwright 桌面浅色与移动深色合计 10/10 通过，覆盖目录开关、规则、DNS、刷新恢复、现有 YAML 导入和页面布局；已查看两个尺寸的目录截图。
- [GitHub CI](https://github.com/ForceMind/ToClash/actions/runs/36392581346) 和 [GitHub Pages 工作流](https://github.com/ForceMind/ToClash/actions/runs/36392581309) 均通过。

## Cloudflare Pages 正式部署

- 项目：`to-clash`；环境：`Production`；分支：`main`；源提交：`7615205`。
- Wrangler：4.131.1；部署 ID：`dd1f1991-c6fc-44aa-a6d3-f80aa351520b`。
- 独立部署：[dd1f1991.to-clash.pages.dev](https://dd1f1991.to-clash.pages.dev/)。

从本地功能提交重新构建后，只上传 `index.html`、`favicon.svg` 和两份 `assets` 文件；macOS 生成的 `._*` 附属文件未上传。部署列表回读确认 `Production` / `main` / `7615205`。

## 生产入口验收

以下三个入口均已在实际浏览器中打开，显示 `ToClash v0.3.8` 与 YAML 导入入口：

1. [Cloudflare 自定义域名](https://toclash.xincreates.com/)
2. [Cloudflare 默认域名](https://to-clash.pages.dev/)
3. [GitHub Pages](https://forcemind.github.io/ToClash/)

GitHub Pages 的服务目录实际显示 40 项、7 类，Meta、Amazon、AWS、Cloudflare、Figma、Adobe、PayPal、Stripe、Pinterest、Snapchat 和 Roblox 均可见，默认未勾选。

这些证据证明静态部署及受测 UI 和 YAML 输出。没有使用用户真实节点、企业 DNS 或 VPN 验证实际代理流量；域名目录也不等于所有美国公司或服务的穷尽列表。具体本地证据见[验证记录](VALIDATION.md)。
