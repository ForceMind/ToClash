# v0.3.11 默认直连公网 DNS 修复

日期：2026-10-10。

**状态：公网默认 DNS 改动已撤回，由 v0.3.12 恢复系统 DNS。用户报告 v0.3.11 影响正常联网；下列局部成功记录不足以证明该全局默认可用，不应继续使用该版本生成的新 DNS 默认值。**

默认直连模式原来将普通公网 DNS 交给 `system`。本次实测某公网域名在系统 DNS 查询路径得到错误 IP，而指定正确 IP 后可直接访问。现在普通公网和显式直连域名使用直连的 Cloudflare `1.0.0.1` / Google `8.8.8.8` DoH，网站继续使用 `DIRECT`。

公司内网 DNS、内网节点 DNS、本地后缀及节点 bootstrap 保持独立；指定服务仍使用现有代理 DNS，常规模式不变。两个 DoH URL 使用 IP 地址并显式指定 `#DIRECT`，不依赖系统 DNS 解析 DoH 服务器域名或代理节点启动。页面说明和 YAML 注释已同步。

## 验证与更新

- lint、249/249 单元 / 界面测试、TypeScript / Vite 构建通过。
- Chrome 桌面浅色 / 手机深色的默认直连和 YAML 导入回归 4/4 通过，并已检查实际截图。
- 当前用户 w2 已在授权范围内备份、修改并重载，可信 Mihomo 配置校验通过，游戏入口恢复 303 登录跳转。该结果不代表游戏登录后业务已验证。
- 重新转换时选择“默认直连，仅指定服务代理”；可以导入旧 YAML 或使用原节点链接。内网和指定服务设置继续保留，检查导出中的公网 DNS 后导入客户端。
- 完整证据范围见 [验证记录](VALIDATION.md)。

## 发布与线上回读

- 功能源提交：`e09f1cbed4cd0a06be85b9ff5ace086d392530f8`，已非强制推送到 `main` 并回读远端一致。
- GitHub Pages 工作流 [38031941271](https://github.com/ForceMind/ToClash/actions/runs/38031941271) 已成功。
- Cloudflare Pages 回读为 `Production/main/e09f1cb`，部署 ID `619cd9e7-06cc-43ff-a34b-2d1b82df4670`，独立部署 [619cd9e7.to-clash.pages.dev](https://619cd9e7.to-clash.pages.dev/)。Wrangler 4.131.1 仅上传四个静态文件，未上传源码、节点配置或 macOS 附属文件。
- [正式主站](https://toclash.xincreates.com/) 的桌面浅色 / 手机深色默认直连、YAML 导入流程均已运行通过，新公网 DNS 导出断言通过。首次桌面刷新因网络超时失败，保留原断言和超时，仅复验该项后通过。
- 先前观察到 TLS 超时，却过早将它归为独立网络问题。用户随后报告断网，已恢复 w2 原始备份；恢复后百度、Cloudflare API、ToClash Pages、GitHub API 均正常响应。该默认 DNS 改动不具备交付条件。
