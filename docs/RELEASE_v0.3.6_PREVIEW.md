# v0.3.6 Cloudflare Pages 预览记录

日期：2026-09-15。

## 范围

- 功能：覆盖完整转换流程的六步新手模式。
- 入口：首次访问自动打开；页头“新手模式”可手动重开。
- 步骤：网络模式、代理链接、常用服务、可选网站分流、可选内网 DNS、确认并转换。
- 保存：只新增 `toclash.beginner-guide.v1=seen` 标记；不保存代理链接或未应用草稿。
- 默认值：内网域名和 DNS 为空；`svc.cluster.local` 不存在于部署资产中。
- 版本：ToClash v0.3.6。
- Git 分支：`codex/v0.3.6-beginner-mode`。
- 预览源提交：`bac8b2d9a14229e066b552adc18c6d0d37fdd54c`。
- Pages 项目：`to-clash`；环境：`Preview`；分支：`preview-v0-3-6-beginner-mode`。

## 预览地址

- 稳定分支地址：[preview-v0-3-6-beginner-mode.to-clash.pages.dev](https://preview-v0-3-6-beginner-mode.to-clash.pages.dev/)
- 本次独立部署：[f1252e68.to-clash.pages.dev](https://f1252e68.to-clash.pages.dev/)
- Cloudflare 部署 ID：`f1252e68-ec26-4591-8ade-2051a59cdd0c`

Wrangler 4.131.2 返回上传成功；部署列表回读为 `Preview` 环境、上述分支及源提交 `bac8b2d`。生产记录仍为 `main` 和 v0.3.3，本次没有更新 `to-clash.pages.dev` 或自定义生产域名。

## 线上检查

应用内浏览器首次打开新的稳定分支地址并确认：

1. 页面可访问，页脚显示 `ToClash v0.3.6`，页头存在“新手模式”按钮。
2. 新手模式在首次访问自动打开，标题为“新手模式：生成 Clash YAML”，显示第 1 步、共 6 步。
3. 代理链接步骤初始为空，未填写有效链接时“下一步”禁用；只使用通用假链接继续检查。
4. 常用服务、可选网站分流和可选内网 DNS 步骤均可到达。
5. 内网 DNS 初始关闭；启用后域名和 DNS 输入值仍为空，页面只说明不会自动填入任何后缀，没有出现 `svc.cluster.local`。

本次使用新的 Pages 预览分支和子域，不继承 v0.3.5 预览域名中的 LocalStorage。自动弹窗退出后只保存 `seen` 标记；页头按钮仍可手动打开。完整浏览器测试另行验证最终“应用并转换”会将六步草稿一次性写回正式页面并生成 YAML。

此次线上检查证明预览静态页面和受测交互可用，不证明真实节点、Clash Verge 接管、Edge 内网解析、公司 DNS、VPN、路由或服务可达。完整代码、构建、浏览器和独立审查证据见[验证记录](VALIDATION.md)。
