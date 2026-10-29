# v0.3.14 Stripe 依赖补齐

日期：2026-10-29。

Stripe 预设保留 `stripe.com` 后缀，新增 `stripecdn.com` 后缀和精确主机 `m.stripe.network`，依据 [Stripe 官方清单](https://docs.stripe.com/ips)。启用后同步生成 FORCE_PROXY、相邻 REJECT 和经该组访问的 DoH。Stripe 仍默认关闭；不扩大到整个 `stripe.network`，不新增 hCaptcha / Intercom。YAML 导入能恢复开关，关闭后删除接管规则。

## 验证

- lint、typecheck、253 项单元 / 组件测试、覆盖率检查及构建通过，核心行覆盖率 97.72%。回归覆盖两种模式的开关、DNS、相邻 REJECT 和已有 YAML 导入。
- 本地两份现有配置先备份，再补齐 Stripe 基础域名及两个依赖。与备份比较，仅三项匹配的六条路由和三个 DNS policy 改变；节点、内网、Workers DNS 及其他设置保持不变。两份源配置和本地生成配置均通过已安装 Mihomo 的语法校验。
- 通过本机服务端 Unix 控制接口热加载当前配置，返回 204；回读六条 Stripe 运行规则，节点选择保持不变。未测试支付交易、实际 Stripe 业务连通性。
- 本批次未主动运行浏览器或浏览器端到端测试，浏览器未验证。线上检查使用 HTTP 获取首页及实际引用脚本，不是页面渲染或交互验收。

## 发布

- 功能源提交：`0ff5a3e518621cf804aeac0df14f243480394374`，非强制推送到现有 `main`。
- 仓库原有自动工作流：[CI](https://github.com/ForceMind/ToClash/actions/runs/40844301708)、[GitHub Pages](https://github.com/ForceMind/ToClash/actions/runs/40844301647)；结果可由链接核对，不修改既有工作流。
- Cloudflare Pages 回读 `Production/main/0ff5a3e`，部署 ID `0907c976-7555-49e2-a3c2-7ac02c525e70`；仅上传四个静态文件，没有上传本地配置或节点凭据。
- [主站](https://toclash.xincreates.com/)、[Cloudflare 默认入口](https://to-clash.pages.dev/)和 [GitHub Pages](https://forcemind.github.io/ToClash/) 均返回 HTTP 200，引用 `index-BU38DP2L.js`，脚本包含 v0.3.14 和两个 Stripe 依赖。

网页端已有保存选择保持不变；需要代理 Stripe 时请勾选 Stripe，重新生成并导入客户端。此处的本地两份配置已直接更新，无需再从网页生成。
