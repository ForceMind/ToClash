# Claude 预设更新：进度、接手与项目记忆

批准范围：生成器、对应回归及直接相关说明；2026-11-24 用户追加授权合并 main 并更新网站部署。目标为既有 Cloudflare Pages `to-clash` 和公开仓库的 GitHub Pages；不修改客户端配置、不启动本机浏览器。

## 计划与进度

1. 核对 v0.3.14、当前差异和官方资料：完成。原有内容后缀只在默认直连模式覆盖；官方公布三个入站目的网段。
2. 更新目录及两种模式、开关、旧 YAML 再生成回归：完成。版本 v0.3.15；保留 bridge 和共享主机精确项，内容后缀移入公共 Claude 目录。
3. 验证、更新结果、提交同步：完成。功能修复提交 `a6381550a95ea23da6c9bafa5ee1c6d08fd114e2` 已推送到 `codex/claude-preset-v0315`；[CI 45438599080](https://github.com/ForceMind/ToClash/actions/runs/45438599080) 全部成功：lint、typecheck、单元测试、覆盖率、构建及远端浏览器 10/10。核心行覆盖率 97.75%。未合并 main，未部署。
4. 合并与部署：进行中。远端 main 为 `0453ae4`，本地已将工作分支 `bf36f56` 快进合并到 main，未覆盖原有未跟踪文件。已核对仓库 PUBLIC、Cloudflare 原账号与 Pages 写权限。下一步推送 main，跟踪 CI / Pages，用该发布的 GitHub Pages 构建产物 Direct Upload 到 Cloudflare，再以 HTTP 回读三个入口、版本与规则资源；验收通过后停止。

初次功能提交 `2986137` 的 CI 45437943250 在新回归中发现：旧 YAML 再导入后关闭 Claude 残留业务 DNS。已修复为重建接管代理域名规则对应的业务 DNS，原断言保持；未接管和 bootstrap DNS 保留。本机 npm lint 因 ESLint 入口缺失退出 1，随后复用远端 CI；本机未安装依赖或启动浏览器。

## 接手

入口为 `src/core/rules/presets.ts`；验证在 `tests/rules.test.ts` 和 `tests/importer.test.ts`。DNS 合并修复在 `src/core/importer/mihomo.ts`。v0.3.15 合并发布中，按第 4 步继续；客户端更新不在授权范围。真实节点、DNS 出口及 Claude 业务连通性未验证。现有未跟踪本地 DNS 文档未修改。

## 项目记忆

Claude 域名与目的 IP 共用开关，但只有域名生成代理 DoH；IP 带 `no-resolve`。保持 FORCE_PROXY 后紧随同条件 REJECT。目录覆盖已知目的地，不保证未知地址的出口：常规模式仍由 PROXY 兜底，默认直连模式仍由 DIRECT 兜底。不能将官方工具调用的出口源网段或共享云整体范围当作入站目的地址。
