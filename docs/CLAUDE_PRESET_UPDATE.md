# Claude 预设更新：进度、接手与项目记忆

批准范围：生成器、对应回归及直接相关说明；2026-11-24 用户追加授权合并 main 并更新网站部署。目标为既有 Cloudflare Pages `to-clash` 和公开仓库的 GitHub Pages；不修改客户端配置、不启动本机浏览器。

## 计划与进度

1. 核对 v0.3.14、当前差异和官方资料：完成。原有内容后缀只在默认直连模式覆盖；官方公布三个入站目的网段。
2. 更新目录及两种模式、开关、旧 YAML 再生成回归：完成。版本 v0.3.15；保留 bridge 和共享主机精确项，内容后缀移入公共 Claude 目录。
3. 验证、更新结果、提交同步：完成。功能修复提交 `a6381550a95ea23da6c9bafa5ee1c6d08fd114e2` 已推送到 `codex/claude-preset-v0315`；[CI 45438599080](https://github.com/ForceMind/ToClash/actions/runs/45438599080) 全部成功：lint、typecheck、255 项测试、覆盖率、构建及远端浏览器 10/10。核心行覆盖率 97.75%。该阶段尚未合并 main 或部署。
4. 合并与部署：完成。`bf36f56` 已快进合并 main，发布源提交 `dee68ea6ef3b7f3aea4a7cd4235a493be5ef5136` 已推送并回读一致。[主线 CI 45440600622](https://github.com/ForceMind/ToClash/actions/runs/45440600622) 和 [GitHub Pages 45440598765](https://github.com/ForceMind/ToClash/actions/runs/45440598765) 成功。复用该 Pages 工作流的四文件构建产物 Direct Upload 到 Cloudflare；三个入口与发布产物脚本哈希一致。未覆盖原有未跟踪文件。

## 生产部署证据

- 已核对源仓库 PUBLIC、现有 Cloudflare 账号、项目 `to-clash` 及其两个既有域名；没有改变可见性或域名绑定。
- Cloudflare 回读 `Production/main/dee68ea`，部署 ID `f27f44c7-58e1-438c-b22b-672d49fa13da`，独立地址 [f27f44c7.to-clash.pages.dev](https://f27f44c7.to-clash.pages.dev/)，Wrangler 4.164.0。
- [主站](https://toclash.xincreates.com/)、[Cloudflare 默认域名](https://to-clash.pages.dev/)和 [GitHub Pages](https://forcemind.github.io/ToClash/) 均 HTTP 200，引用 `index-9x2GL4lc.js`；脚本包含 v0.3.15、三个域名覆盖和新网段。
- 三端脚本 SHA-256 均为 `8b25c365024b0b51f34b68f6e22e1aeb1955dc59fc64e6fd7f96ed7ff241300d`，与本次 CI 发布产物完全一致。后续仅文档提交不改变此发布版本的应用产物。
- 使用 HTTP 检查线上资源，不等同线上浏览器交互或真实业务访问；浏览器回归证据来自远端 CI。本机未安装依赖、未启动浏览器、未改动客户端。

初次功能提交 `2986137` 的 CI 45437943250 在新回归中发现：旧 YAML 再导入后关闭 Claude 残留业务 DNS。已修复为重建接管代理域名规则对应的业务 DNS，原断言保持；未接管和 bootstrap DNS 保留。本机 npm lint 因 ESLint 入口缺失退出 1，随后复用远端 CI；本机未安装依赖或启动浏览器。

## 接手

入口为 `src/core/rules/presets.ts`；验证在 `tests/rules.test.ts` 和 `tests/importer.test.ts`。DNS 合并修复在 `src/core/importer/mihomo.ts`。v0.3.15 已合并主线并在两个平台发布，本批次无剩余实施事项；客户端更新不在授权范围。真实节点、DNS 出口及 Claude 业务连通性未验证。现有未跟踪本地 DNS 文档未修改。

## 项目记忆

Claude 域名与目的 IP 共用开关，但只有域名生成代理 DoH；IP 带 `no-resolve`。保持 FORCE_PROXY 后紧随同条件 REJECT。目录覆盖已知目的地，不保证未知地址的出口：常规模式仍由 PROXY 兜底，默认直连模式仍由 DIRECT 兜底。不能将官方工具调用的出口源网段或共享云整体范围当作入站目的地址。
