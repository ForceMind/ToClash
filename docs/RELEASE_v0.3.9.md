# v0.3.9 正式发布记录

发布日期：2026-10-08。

新增开发者服务分类中的 Spaceship 独立开关，默认关闭；开启后 `spaceship.com`（含 `www.spaceship.com`）及[官网](https://www.spaceship.com/)使用的 `spaceship-cdn.com` 同时生成强制代理、相邻 REJECT 和代理 DNS policy。服务总数为 41 项，旧设置缺少新字段时恢复为关闭。

## 代码与验证

- 功能源提交：`37f35d24930bcf553fc6df8167a8a8dd21f1730f`，非强制推送至 `main`。
- 本地 lint、typecheck、相关 137 项测试与构建通过；Chrome 桌面 / 移动服务目录流程 2/2 通过。
- 完整 [GitHub CI](https://github.com/ForceMind/ToClash/actions/runs/37757103948) 与 [GitHub Pages 发布](https://github.com/ForceMind/ToClash/actions/runs/37757103889) 成功。

## 部署与访问

- Cloudflare Pages 项目 `to-clash`，回读为 `Production/main/37f35d2`。
- 部署 ID：`5cb91e3a-0394-4fec-8de4-8fe8851a8c82`；Wrangler 4.131.1。
- 独立部署：[5cb91e3a.to-clash.pages.dev](https://5cb91e3a.to-clash.pages.dev/)。只上传四个真实构建文件，排除 macOS 附属文件。
- 实际打开[主站](https://toclash.xincreates.com/)、[Cloudflare 默认域名](https://to-clash.pages.dev/)与[GitHub Pages](https://forcemind.github.io/ToClash/)，均显示 v0.3.9；主站展开目录后显示 41 项及 Spaceship 开关。

这些证据证明配置生成及静态站点发布。真实节点、出口和 Spaceship 的代理访问未在本批次测试。
