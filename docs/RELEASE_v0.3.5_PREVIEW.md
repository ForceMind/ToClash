# v0.3.5 Cloudflare Pages 预览记录

日期：2026-09-15。

## 范围

- 功能：三步弹窗式内网 DNS 新手填写引导。
- 默认值：新空表单不预填域名或 DNS；`svc.cluster.local` 不存在于部署资产中。
- 版本：ToClash v0.3.5。
- Git 分支：`codex/v0.3.5-onboarding`。
- 预览源提交：`315f6b173ac662fc93e9cacdae12549cc2ccfb36`。
- Pages 项目：`to-clash`；环境：`Preview`；分支：`preview-v0-3-5-onboarding`。

## 预览地址

- 稳定分支地址：[preview-v0-3-5-onboarding.to-clash.pages.dev](https://preview-v0-3-5-onboarding.to-clash.pages.dev/)
- 本次独立部署：[f6a6e6a1.to-clash.pages.dev](https://f6a6e6a1.to-clash.pages.dev/)
- Cloudflare 部署 ID：`f6a6e6a1-9b8c-4fde-805c-380eddff6d38`

Wrangler 4.131.2 返回上传成功；部署列表回读为 `Preview` 环境、上述分支及源提交 `315f6b1`。生产记录仍为 `main` 和 v0.3.3，本次没有更新 `to-clash.pages.dev` 或自定义生产域名。

## 线上检查

应用内浏览器首次打开新的稳定分支地址并确认：

1. 页面可访问，页脚显示 `ToClash v0.3.5`。
2. 内网 DNS 区域默认关闭，主表单没有域名或 DNS 值。
3. 点击“新手填写引导”后显示三步弹窗；第 1 步明确说明不提供默认域名或 DNS。
4. 进入第 2 步后，域名输入值为空、键盘焦点进入输入框、“下一步”禁用，页面没有出现 `svc.cluster.local`。

本次使用新的 Pages 预览分支和子域，因此不会继承 v0.3.4 预览域名中的 LocalStorage。用户在同一 v0.3.5 预览域名主动填写并应用后，配置仍会按既有规则保存在该浏览器；重新打开向导会显示用户已有内容用于编辑。

此次线上检查证明预览静态页面和受测交互可用，不证明真实 Clash Verge 接管、Edge 内网解析、公司 DNS、VPN、路由或服务可达。完整代码、构建和浏览器证据见[验证记录](VALIDATION.md)。
