# v0.3.6 正式发布记录

发布日期：2026-09-16。

## 发布内容

- 全局六步新手模式：网络模式、代理链接、常用服务、网站分流、内网 DNS、确认并转换。
- 首次访问自动打开；页头按钮可手动重开。
- 关闭或 Escape 不应用草稿；只有“应用并转换”写回正式页面。
- 代理链接和向导草稿不持久化，只保存固定的 `seen` 首次展示标记。
- 内网字段不自动填入任何后缀，生产构建资产不包含 `svc.cluster.local`。
- 保留 v0.3.4 的 macOS Edge / Chromium + Clash Verge `.local` 上下文提示。

## Git 与 CI

- 正式功能与生产资产源提交：`ec12a314a40d9f32f3eda80396004bc7372c9d3a`；本文件作为后续纯文档记录提交，不改变生产页面资产。
- 推送方式：从 `5875a0915244909f4be44e3899b9e1267b9eaf92` 非强制快进 6 个提交，没有 force push。
- [主分支 CI](https://github.com/ForceMind/ToClash/actions/runs/34997274303)：通过 lint、typecheck、221 项测试、coverage、build 和 Chromium 浏览器测试。
- [GitHub Pages 工作流](https://github.com/ForceMind/ToClash/actions/runs/34997274281)：构建和部署通过。

GitHub Pages 工作流提示其 Pages Actions 仍以 Node.js 20 为目标，并由 runner 强制使用 Node.js 24。该提醒没有导致本次构建或部署失败，后续可单独升级工作流依赖。

## Cloudflare Pages 正式部署

- 项目：`to-clash`。
- 环境：`Production`。
- 分支：`main`。
- 源提交：`ec12a31`。
- Wrangler：4.131.2。
- 独立部署：[b8fb4311.to-clash.pages.dev](https://b8fb4311.to-clash.pages.dev/)。
- 部署 ID：`b8fb4311-7de6-4166-b8c1-51944ef55f8c`。

Wrangler 返回部署完成；部署列表随后回读为 `Production` / `main` / `ec12a31`。

## 生产入口验收

以下三个入口均已使用应用内浏览器实际打开：

1. [Cloudflare 自定义域名](https://toclash.xincreates.com/)
2. [Cloudflare 默认域名](https://to-clash.pages.dev/)
3. [GitHub Pages](https://forcemind.github.io/ToClash/)

三个入口均显示 `ToClash v0.3.6`、页头“新手模式”，并在首次访问显示“第 1 步，共 6 步”的自动弹窗。自定义生产域名页面已保留为用户可见结果。

这些证据证明静态站点正式部署、页面版本和新手入口可见，不证明真实节点、公司 DNS、VPN、Clash Verge 接管或 Edge `.local` 解析。相关本地、预览、浏览器和独立审查证据见[验证记录](VALIDATION.md)。
