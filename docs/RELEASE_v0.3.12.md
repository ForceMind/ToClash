# v0.3.12 默认公网 DNS 回滚

日期：2026-10-10。

用户报告 v0.3.11 的全局公网 DNS 改动影响正常联网。本版撤回该改动，恢复默认直连模式的 `nameserver`、`direct-nameserver` 与显式直连域名使用 `system`，内网 DNS、节点解析、指定服务代理 DNS 和最终 `MATCH,DIRECT` 保持原有行为。页面说明及 YAML 注释已同步。

当前 w2 与生成配置已从修改前备份恢复并重载，除恢复我改动的 DNS 外没有引入新修改，代理选择保留。恢复后通过当前 Clash 入口访问百度、Cloudflare API、ToClash Pages 和 GitHub API 均得到正常 HTTP 响应。

lint、规则 / 输出 / 导入 125 项测试、TypeScript / Vite 构建和桌面 / 手机默认直连导出 2 项浏览器检查通过。原游戏域名的 DNS 错答仍待小范围方案解决；v0.3.11 的局部访问成功不证明全局 DNS 默认值适用于用户网络。
