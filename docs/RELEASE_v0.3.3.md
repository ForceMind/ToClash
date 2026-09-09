# v0.3.3 发布说明

## 本次更新

- 修复 VLESS / VMess 的 UUID 变体误拒绝，保留 8-4-4-4-12 十六进制格式校验。
- 新增“默认直连，仅指定服务代理”。已选服务使用 FORCE_PROXY 固定节点，其他流量直连；默认系统 DNS，内网允许指定 DNS。
- 29 项服务按 6 类展示，支持搜索和分类批量选择，包括 X / Twitter、TikTok、Instagram、Netflix、Spotify 等；25 个新增项默认关闭。
- 模式、服务选择和 CGNAT 会保存；旧设置兼容迁移。节点凭据和 YAML 仍只留在页面内存。
- 更新填写指南、隐私声明、规则范围、开发文档和服务来源说明。

## 如何使用

打开[ToClash](https://forcemind.github.io/ToClash/)，确认页脚为 v0.3.3，选择“默认直连，仅指定服务代理”，在服务预设中搜索并勾选 X、TikTok 等所需服务，再转换并下载 YAML。导入 Mihomo 客户端后，在 FORCE_PROXY 中选择自己的节点。

## 验证与发布状态

本地单元/界面 212 项、桌面和手机 Chromium 浏览器 8 项通过；生产构建（含类型检查）与 ESLint 通过。发布前覆盖率检查再次通过，核心代码行覆盖率 99.71%，分支覆盖率 90.23%。域名规则和生成器证据不等同于真实账号、节点、公司 DNS 或所有原生客户端流量验收。

已发布到 main 和现有 GitHub Pages（2026-09-09）：

- 功能提交：`94d81b009062d1a3b7bb67dd27c27b1935270068`，远端 main 回读一致。
- [CI 通过](https://github.com/ForceMind/ToClash/actions/runs/34336257144)：该提交的完整质量检查通过。
- [GitHub Pages 部署成功](https://github.com/ForceMind/ToClash/actions/runs/34336257028)。
- 可见浏览器线上核验：页脚 v0.3.3、29 项服务、默认直连选择、X/TikTok 勾选与搜索、假节点转换 2/2 成功；输出包含 FORCE_PROXY、代理 DoH 与 MATCH,DIRECT。
- 首次普通地址仍命中旧页面缓存；带版本参数的[新版入口](https://forcemind.github.io/ToClash/?v=94d81b0)已核验。如果仍显示旧版，可刷新或使用该入口，无需清除已保存的网站设置。

以上线上验收使用公开示例节点，未连接真实 VPN 节点或服务账号。后续仅补写发布证据的文档提交不会改变上述应用代码。

## Cloudflare Pages 生产部署（2026-09-09）

- 现有项目：`to-clash`，生产分支 `main`，Direct Upload。
- 自定义域名：[toclash.xincreates.com](https://toclash.xincreates.com/)。默认域名：[to-clash.pages.dev](https://to-clash.pages.dev/)。
- 干净部署：[85bb1460.to-clash.pages.dev](https://85bb1460.to-clash.pages.dev)，来源提交 `b4ff088608f4b51cc6bf127f0bb1ebb6bd829cd7`，版本 v0.3.3。
- 使用 Wrangler 4.130.0 上传 4 个静态文件；构建目录中的 macOS AppleDouble 附属文件已在最终上传目录中排除，未删除工作区文件。
- 浏览器实际访问默认域名和自定义域名均显示 v0.3.3；自定义域名显示 29 项服务和 X/TikTok 入口。命令行 HTTP 检查遇到 403，因此未将逐字节远端文件比对列为通过证据。
- GitHub Pages 与 Cloudflare Pages 分别部署。该 Cloudflare 项目未绑定 Git，推送 GitHub 不会自动更新它；后续需再次 Direct Upload。
