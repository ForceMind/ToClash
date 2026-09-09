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

发布目标：仓库 main 与现有 GitHub Pages。CI 和部署状态以[GitHub Actions](https://github.com/ForceMind/ToClash/actions)中对应提交为准；本条发布记录在推送前建立，线上版本须在部署成功后核验。
