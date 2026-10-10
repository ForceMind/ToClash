# v0.3.13 Workers 站点直连解析修复

日期：2026-10-10。

默认直连模式下，为整个 `workers.dev` 后缀加入单独的直连 DoH 解析。所有现有及将来创建的 Worker 子域名均由此覆盖；站点连接仍经 `MATCH,DIRECT`。其他公网域名、节点、内网和指定服务的 DNS 保持原有设置。

先在物理网卡绕过代理和 TUN、为目标指定正确 IP，验证两个公网 IP 都能直接到达站点并返回 303 登录跳转。然后以无真实节点、不启用 TUN 的隔离 Mihomo 测试后缀策略，确认站点 303、百度 200。当前 w2 只加这一条 DNS policy，Mihomo 配置校验与四个在线入口检查通过，备份可供恢复。

项目 lint、250 项测试及构建通过；桌面 / 手机浏览器对完整配置导出和 YAML 导入 4/4 通过，截图显示 v0.3.13。本地导入当前 w2 再导出，节点、默认 DNS、Workers 专用 DNS、节点 DNS 和最终直连规则保持一致。v0.3.13 另新增 4 条 Claude 官方入站 CIDR 规则，这是旧 w2 与新服务目录之间的既有差异，不是本次 DNS 变更。

站点根路径验证止于登录跳转，未验证登录后的业务。

## 发布回读

- 功能源提交 `a8d9043c8bfc32437a3af839ef3a80ba5fcbb296`，已推送并回读远端 main 一致。GitHub [CI](https://github.com/ForceMind/ToClash/actions/runs/38038512158) 与 [Pages 工作流](https://github.com/ForceMind/ToClash/actions/runs/38038512180) 均成功。
- Cloudflare Pages 回读 `Production/main/a8d9043`，部署 ID `386be3f1-da89-49cd-8153-2410d4a23b21`，独立地址 [386be3f1.to-clash.pages.dev](https://386be3f1.to-clash.pages.dev/)。只上传四个静态文件，未上传真实节点或配置。
- 主站、Cloudflare 默认域名和 GitHub Pages 的首页均实际加载 `index-DBH_9WP4.js`，脚本含 v0.3.13 和本次定向 DNS 配置。
- 正式主站的默认直连转换检查通过，导出包含 `+.workers.dev` 定向 DNS，默认 DNS 仍为 `system`；首次页面刷新遇到 `ERR_CONNECTION_CLOSED`，保持原断言和超时重新执行后通过。这次浏览器检查没有输入真实节点凭据。
