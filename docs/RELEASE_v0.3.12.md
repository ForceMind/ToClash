# v0.3.12 默认公网 DNS 回滚

日期：2026-10-10。

用户报告 v0.3.11 的全局公网 DNS 改动影响正常联网。本版撤回该改动，恢复默认直连模式的 `nameserver`、`direct-nameserver` 与显式直连域名使用 `system`，内网 DNS、节点解析、指定服务代理 DNS 和最终 `MATCH,DIRECT` 保持原有行为。页面说明及 YAML 注释已同步。

当前 w2 与生成配置已从修改前备份恢复并重载，除恢复我改动的 DNS 外没有引入新修改，代理选择保留。恢复后通过当前 Clash 入口访问百度、Cloudflare API、ToClash Pages 和 GitHub API 均得到正常 HTTP 响应。

lint、规则 / 输出 / 导入 125 项测试、TypeScript / Vite 构建和桌面 / 手机默认直连导出 2 项浏览器检查通过。原游戏域名的 DNS 错答仍待小范围方案解决；v0.3.11 的局部访问成功不证明全局 DNS 默认值适用于用户网络。

## 发布回读

- 回滚源提交：`ed0d9a61fed3b6ee259055f97f958e6c15b3f0d1`，已推送并回读远端 main 一致。
- Cloudflare Pages：`Production/main/ed0d9a6`，部署 ID `f4127b87-9d03-4555-a496-cd260c34fa60`，独立地址 [f4127b87.to-clash.pages.dev](https://f4127b87.to-clash.pages.dev/)。主站和默认域名的实际 JS 均显示 v0.3.12，且不包含 v0.3.11 的公网 DoH 默认。
- GitHub Pages 工作流 [38034893146](https://github.com/ForceMind/ToClash/actions/runs/38034893146) 成功；首页已引用新构建脚本，脚本资源回读遇到 TLS 错误，未将其标为完整线上验收。
- 本机四个联网对照正常响应，不等于所有应用和所有站点已得到用户确认。当前保留原 w2，不继续修改公网 DNS。
