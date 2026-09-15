# v0.3.4 Cloudflare Pages 预览记录

日期：2026-09-15。

## 范围

- 功能：macOS Edge / Chromium + Clash Verge 使用 `local` / `.local` 内网后缀时的中英文提示。
- 版本：ToClash v0.3.4。
- Git 分支：`codex/v0.3.4-local-guide`。
- 预览源提交：`f9994f31eec74df8db039ea41bc8b6af2f2d4825`。
- Pages 项目：`to-clash`；环境：`Preview`；分支：`preview-v0-3-4-local-guide`。

## 预览地址

- 稳定分支地址：[preview-v0-3-4-local-guide.to-clash.pages.dev](https://preview-v0-3-4-local-guide.to-clash.pages.dev/)
- 本次独立部署：[f049dfa0.to-clash.pages.dev](https://f049dfa0.to-clash.pages.dev/)
- Cloudflare 部署 ID：`f049dfa0-9494-4167-820e-a86a35f19ccf`

Wrangler 4.131.2 返回上传成功；部署列表回读为 `Preview` 环境、上述分支及源提交 `f9994f3`。生产记录仍为 `main` 和 v0.3.3，本次没有更新 `to-clash.pages.dev` 或自定义生产域名。

## 线上检查

应用内浏览器已打开稳定分支地址并确认：

1. 页面可访问，页脚显示 `ToClash v0.3.4`。
2. 启用内网 DNS 分流，填写 `svc.cluster.local` 和文档保留地址 `192.0.2.53` 后，显示 macOS Edge / Chromium + Clash Verge 提示。
3. 提示包含 `ERR_NAME_NOT_RESOLVED`、移除 `*.local`、保留必要绕过项，以及 ToClash 只生成 Mihomo YAML 的边界。

此次线上检查证明预览静态页面和受测交互可用，不证明真实 Clash Verge 接管、Edge 内网解析、公司 DNS、VPN、路由或服务可达。完整代码、构建、浏览器与独立审查证据见[验证记录](VALIDATION.md)。
