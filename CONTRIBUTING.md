# 贡献指南

感谢你改进 ToClash。禁止提交真实代理凭据、UUID、Token、订阅地址或私人服务器地址。

1. 安装 Node.js 20+，运行 `npm install`。
2. 使用 `npm run dev` 启动开发环境。
3. 行为变更必须添加有针对性的 parser 或 transformer 测试。
4. 提交前运行 `npm run lint`、`npm run typecheck`、`npm run test` 和 `npm run build`。
5. Pull Request 应说明协议兼容性变化和隐私影响。

协议变更必须保持“URI → 统一 ProxyNode → Mihomo transformer”的边界，并以 Mihomo 官方文档为输出字段依据。界面文案应同时维护简体中文和英文，简体中文为默认语言。
