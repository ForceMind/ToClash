# v0.3.6 本地与正式发布验证（2026-09-16）

本轮将内网专用三步弹窗替换为全局六步新手模式。首次访问自动打开，页头按钮可手动重开；覆盖网络模式、代理链接、四项常用服务、可选网站分流、可选内网 DNS 和最终确认转换。关闭或 Escape 不应用草稿，只有“应用并转换”写回完整页面。

环境：macOS、Node.js 26.7.0（Vitest 使用 `NODE_OPTIONS=--no-experimental-webstorage`）、npm 11.19.0、Microsoft Edge 153.0.4234.32。

| 检查 | 当前结果 |
| --- | --- |
| `npm run lint` | 通过，无 ESLint 警告 |
| `npm run typecheck` | 通过 |
| `npm run test` | 8 个测试文件、221/221 通过 |
| `npm run test:coverage` | 通过；核心代码行覆盖率 99.85%，分支覆盖率 90.75% |
| `npm run build` | 通过，包含 TypeScript 构建并生成 v0.3.6 `dist/` |
| 本机 Microsoft Edge 运行 `npm run test:browser` | 8/8 通过：桌面 1440×1000 浅色、手机 390×844 深色；覆盖首次弹窗、六步完整应用、手动重开、保存边界及既有转换流程 |
| 深色修复后主流程复验 | 桌面浅色、手机深色 2/2 通过 |
| 实际截图检查 | 首次手机深色截图发现标题、选项和次要按钮对比度不足；为弹窗根节点补明确深浅色后重新截图，文字和按钮清晰，无明显遮挡或横向溢出 |
| 独立只读审查 | 通过；首次自动弹窗焦点回落问题已修复并补 UI / Edge 回归，未发现新增阻断 |
| GitHub 分支 | `codex/v0.3.6-beginner-mode` 已推送；功能源提交 `bac8b2d9a14229e066b552adc18c6d0d37fdd54c` 已回读一致 |
| Cloudflare Pages 预览 | Wrangler 4.131.2 上传成功；回读为 `Preview` 环境、分支 `preview-v0-3-6-beginner-mode`、源 `bac8b2d`；地址见[预览记录](RELEASE_v0.3.6_PREVIEW.md) |
| 线上可见验证 | 新预览域名首次访问自动打开六步模式；实际走到内网步骤，启用后域名和 DNS 值均为空，页面未出现 `svc.cluster.local` |
| 正式功能发布点 | 远程 `main` 从 `5875a09` 非强制快进到 `ec12a314a40d9f32f3eda80396004bc7372c9d3a`，回读一致；后续只追加正式发布记录 |
| `main` CI | [34997274303](https://github.com/ForceMind/ToClash/actions/runs/34997274303) 通过：lint、typecheck、221 项测试、coverage、build、Chromium |
| GitHub Pages 正式部署 | [34997274281](https://github.com/ForceMind/ToClash/actions/runs/34997274281) 通过；`forcemind.github.io/ToClash/` 已显示 v0.3.6 和首次新手模式 |
| Cloudflare Pages 正式部署 | Wrangler 回读为 `Production` / `main` / `ec12a31`；部署 `b8fb4311`，自定义和默认生产域名均显示 v0.3.6 |
| `git diff --check` | 通过 |

新手模式首次展示只使用 `toclash.beginner-guide.v1=seen` 标记。单元和浏览器测试确认代理链接不写入 LocalStorage，重置路由设置后仅保留该标记；手动按钮仍可重开。内网步骤字段为空，页面向导源码和构建资产不包含 `svc.cluster.local` 默认值。补充回归覆盖标记读写被拒绝、Tab / Shift+Tab 循环、首次关闭后的页头焦点回落、编辑后 Escape 丢弃草稿，以及默认直连模式内网 DNS 留空使用 `system`。

测试、截图、Pages 预览和三处生产入口证明受测简易流程、正式页面回填、YAML 生成、键盘焦点和响应式布局；不证明节点、真实 DNS、VPN、Clash Verge 或 Edge `.local` 解析。完整生产证据见[正式发布记录](RELEASE_v0.3.6.md)。

---

# 历史记录：v0.3.5 内网向导与 Pages 预览验证（2026-09-15）

本轮新增弹窗式内网 DNS 新手引导，所有空白输入保持为空，只在用户点击“应用到表单”后写回；没有把 `svc.cluster.local`、DNS 或其他配置作为默认值。没有修改生成规则、本机 hosts、DNS、系统代理或 Clash Verge 配置。

环境：macOS、Node.js 26.7.0（Vitest 使用 `NODE_OPTIONS=--no-experimental-webstorage`）、npm 11.19.0、Microsoft Edge 153.0.4234.32。

| 检查 | 当前结果 |
| --- | --- |
| `npm run lint` | 通过，无 ESLint 警告 |
| `npm run typecheck` | 通过 |
| `npm run test` | 8 个测试文件、217/217 通过 |
| `npm run test:coverage` | 通过；核心代码行覆盖率 99.71%，分支覆盖率 90.23% |
| `npm run build` | 通过，包含 TypeScript 构建并生成 v0.3.5 `dist/` |
| 本机 Microsoft Edge 运行 `npm run test:browser` | 8/8 通过：桌面 1440×1000 浅色、手机 390×844 深色；覆盖空白向导、三步填写、应用回填、默认直连回归及既有转换流程 |
| 实际截图检查 | 已查看桌面浅色和手机深色的向导弹窗；弹窗位于视口中心，文字、按钮和遮罩可见，无明显遮挡或横向溢出，页脚显示 v0.3.5 |
| GitHub 分支 | `codex/v0.3.5-onboarding` 已推送；功能源提交 `315f6b173ac662fc93e9cacdae12549cc2ccfb36` 已回读一致 |
| Cloudflare Pages 预览 | Wrangler 4.131.2 上传成功；回读为 `Preview` 环境、分支 `preview-v0-3-5-onboarding`、源 `315f6b1`；稳定地址与独立部署地址见[预览记录](RELEASE_v0.3.5_PREVIEW.md) |
| 线上可见验证 | 新预览域名首次打开显示 v0.3.5；向导第 2 步域名值为空、焦点进入输入框且下一步禁用，未出现 `svc.cluster.local` |
| `git diff --check` | 通过 |

UI 单元测试同时覆盖：中文和英文文案、`aria-modal`、非法域名与 DNS 阻止下一步、关闭、稍后填写、Escape、空白首次启用自动打开、仅确认后应用。向导使用 `corp.example` 与 `192.0.2.53` 作为 placeholder；测试确认字段值仍为空，placeholder 不会写入表单或 LocalStorage。主表单已有用户输入时，向导显示现有值用于继续编辑，这不属于默认预填。

浏览器测试、截图和 Pages 预览证明受测页面的向导交互和布局，不证明真实内网 DNS、VPN、Clash Verge 或 Edge `.local` 解析。v0.3.5 只推送到独立 Git 分支并部署到独立 Pages 预览；`main`、生产 Pages 和生产域名没有更新。

---

# 历史记录：v0.3.4 本地与 Pages 预览验证（2026-09-15）

本轮只修改静态页面、测试、版本和文档，没有修改本机 hosts、DNS、系统代理或 Clash Verge 配置。代码已推送到独立 Git 分支，并部署到独立 Cloudflare Pages 预览分支；没有更新或合并 `main`，也没有更新生产 Pages 环境。测试使用假节点、`svc.cluster.local` 和文档保留地址 `192.0.2.53`。

环境：macOS、Node.js 26.7.0（Vitest 使用 `NODE_OPTIONS=--no-experimental-webstorage`）、npm 11.19.0、Microsoft Edge 153.0.4234.32。

| 检查 | 当前结果 |
| --- | --- |
| `npm run lint` | 通过，无 ESLint 警告 |
| `npm run typecheck` | 通过 |
| `npm run test` | 8 个测试文件、214/214 通过 |
| `npm run test:coverage` | 通过；核心代码行覆盖率 99.71%，分支覆盖率 90.23%；`plan.ts` 行覆盖率 100%、分支覆盖率 98.82% |
| `npm run build` | 通过，包含 TypeScript 构建并生成 v0.3.4 `dist/` |
| 本机 Microsoft Edge 运行 `npm run test:browser` | 8/8 通过：桌面 1440×1000 浅色、手机 390×844 深色；覆盖 `.local` 提示、YAML 四项输出、键盘、下载、保存恢复、无横向溢出及无站外请求断言 |
| 实际截图检查 | 已查看桌面浅色与手机深色完整设置页；提示在两种布局和主题中可见，无明显遮挡或横向溢出，页脚显示 v0.3.4 |
| GitHub 分支 | `codex/v0.3.4-local-guide` 已推送；功能源提交 `f9994f31eec74df8db039ea41bc8b6af2f2d4825` 已回读一致 |
| Cloudflare Pages 预览 | Wrangler 4.131.2 上传成功；回读为 `Preview` 环境、分支 `preview-v0-3-4-local-guide`、源 `f9994f3`；稳定地址与独立部署地址见[预览记录](RELEASE_v0.3.4_PREVIEW.md) |
| 线上可见验证 | 应用内浏览器打开稳定预览地址，页脚显示 v0.3.4；填写通用示例后出现 `.local` 的 Clash Verge 提示 |
| `git diff --check` | 通过 |

精确回归证明 `SVC.Cluster.Local.` 规范化为 `svc.cluster.local`，DNS 地址规范化为 `udp://192.0.2.53:53`，并同时出现在 `nameserver-policy`、`proxy-server-nameserver-policy`、`fake-ip-filter` 和 `DOMAIN-SUFFIX,...,DIRECT` 规则中。UI 回归证明有效的 `.local` 子后缀显示中英文 Clash Verge 提示，普通 `corp.example` 不显示。

本机 Edge 测试和 Pages 预览验证证明静态成品在受测 Chromium 页面中的渲染、交互和生成结果，不证明 Edge 实际解析内网域名、请求已经被 Clash Verge 接管，或真实公司 DNS、VPN、路由和服务可达。页面说明来源于已验证的 macOS + Edge / Chromium + Clash Verge 场景，不能推广为所有 Clash 客户端的相同行为。生产域名仍使用既有 v0.3.3 发布版本。

安装锁定依赖时 npm 报告 7 项既有开发依赖风险（3 moderate、2 high、2 critical）；本轮没有改依赖版本、运行自动修复或将开发服务暴露到公网。

---

# 历史记录：v0.3.3 本地验证（2026-09-09）

以下是 v0.3.3 功能提交的本地证据，使用假节点和浏览器测试数据。它证明生成器、构建产物和受测 Chromium 流程；不证明真实节点、企业 DNS、VPN 出口 IP 或线上部署。

| 检查 | 当前结果 |
| --- | --- |
| `npm run lint` | 通过 |
| `npm run typecheck` | 通过 |
| `npm run test` | 8 个测试文件、212/212 通过 |
| `npm run test:coverage` | 通过；核心代码行覆盖率 99.71%，分支覆盖率 90.23% |
| `npm run build` | 通过，包含 TypeScript 构建检查并生成 `dist/` |
| `npm run test:browser` | Chromium 8/8 通过：桌面 1440×1000 浅色、手机 390×844 深色；覆盖服务搜索勾选、刷新恢复，以及既有默认直连、复制和下载流程 |
| `git diff --check` | 通过 |

实现范围：29 项、6 类服务预设，其中原四项默认开启，新增 25 项默认关闭；旧 v1 五字段设置会补齐新字段。默认直连模式使用 `system` DNS，选中服务使用 `FORCE_PROXY` 和对应的代理 DoH；显式内网 DNS 保持其业务及节点引导优先级。VLESS / VMess UUID 接受 8-4-4-4-12 十六进制凭据形状，不限制 RFC 版本或变体位。

远程发布已完成：功能提交 `94d81b009062d1a3b7bb67dd27c27b1935270068` 的 [CI](https://github.com/ForceMind/ToClash/actions/runs/34336257144) 和 [Pages 部署](https://github.com/ForceMind/ToClash/actions/runs/34336257028)均成功。可见浏览器核验线上 v0.3.3、29 项服务、默认直连和 X/TikTok 搜索勾选，使用假节点转换得到对应代理/DNS与 MATCH,DIRECT。完整发布与缓存说明见[发布记录](RELEASE_v0.3.3.md)。真实节点、公司网络和客户端实际流量仍未验证。

---

# 历史记录：v0.3.1 本地保存验收（2026-09-08）

- 批准范围：自定义网站分流 / 内网 DNS 的本地保存；拆分清空操作；仓库整理与填写文档；本地交付，不含推送或部署。
- 实现：`src/settings/storage.ts` 白名单保存五个字段，存储格式版本为 1；未知版本或损坏数据不在首次挂载时覆盖；禁止存储时提供失败提示。只删除本工具 key。
- 版本：0.3.0 → 0.3.1，package / lockfile / 可见页脚一致。
- 单元与界面：Node 22 下 `npm run test`，6 个文件、167 项通过，覆盖恢复、清空保留、重置、存储损坏 / 读取拒绝 / 写入拒绝及既有转换流程。
- 工具链：本机默认 Node 26 的实验性 Web Storage 与现有 Vitest / jsdom 冲突；使用项目推荐 Node 22 直接通过，Node 26 配置 `NODE_OPTIONS=--no-experimental-webstorage` 也通过。不是浏览器存储失败。
- 静态检查与构建：`npm run lint`、`npm run build` 通过，后者含 TypeScript 检查。
- Chromium：`npm run test:browser` 4 项通过，单 worker；桌面 1440×1000 浅色、手机 390×844 深色。覆盖刷新恢复、关闭页面后新标签打开恢复、节点不持久保存、重置后刷新、转换、下载、复制及无外发数据请求。
- 视觉：已查看两种尺寸的 settings 截图，保存说明与两个清空操作可见，无横向溢出；页脚 v0.3.1。截图位于忽略目录 `test-results/`。
- 自查：由主智能体检查字段范围、失败路径、StrictMode 首次 effect 不写入、其他站点存储保留、文档与行为一致；未安排独立代理审查。
- 仓库整理：核实 AppleDouble 魔数后备份并清理 `._*` 附属文件，包括造成 Git 索引错误的附属 `.idx`；真实 Git 数据保留，`git log` 已无原错误。外置盘可能重建附属文件，Git / ESLint / TypeScript / Vitest / Playwright 已排除它们。
- 交付：本地代码、填写指南、隐私及架构文档已完成。没有将真实代理凭据、企业域名或 DNS 写入仓库示例。
- 边界：没有推送或更新线上站点；没有改动系统 DNS / Clash，没有验证用户内网 DNS 可达性、实际企业网站或旧节点连接；未测试整个浏览器进程退出后的恢复、Safari / Edge 或跨标签同时编辑冲突。

---

# 历史记录：规则增强版验证记录

本文件区分已执行验证和待验证项。测试始终使用假节点，不包含真实密码、UUID 或服务器。

记录日期：2026-09-02。基线为 v0.2.0 / `e427525`，规则增强版本为 v0.3.0。**本轮 DNS 修复验收通过：P1 / P2 均已关闭，独立复核通过。** 这表示下述受测范围通过，不代表真实企业网络、全部代理协议链路或远程部署已经验证。

## 当前检查清单

| 项目 | 状态 |
| --- | --- |
| 路由输入规范化、IP 和内网 DNS 校验、名称分配 | 已完成：55 个工具用例通过 |
| 规则预设、DNS 联动、策略组、冲突和协议回归 | 已完成：43 项规则、20 项 transformer 测试；本轮两项 DNS 问题独立复核关闭 |
| 中英文界面、导出拦截、清空和模式切换 | 已完成：24 项 UI 单元 + 两个真实浏览器流程通过 |
| YAML 分类注释和往返解析 | 已完成：含在 20 项 transformer 测试中，增加 DNS 顺序和节点策略回归 |
| Mihomo 实际配置检查 | 已完成：v1.19.30 接受 20 份假节点配置，仅证明可加载 |
| Mihomo DNS / 节点解析运行验证 | 已完成：18 场景 + 2 项旧缺陷反例，通过主线程与独立审查者两次实际执行 |
| Chromium 桌面/手机、明暗主题实际渲染与交互 | 已完成：1440×1000 浅色、390×844 深色，主线程查看截图 |
| 独立视觉复核 | 已完成：中文默认/错误/手机设置、稳定英文桌面深色与手机浅色，未发现阻断视觉问题 |
| 独立质量审查 | 已完成：两项问题均关闭，本轮未发现新的 P1/P2；审查者未参与实现 |
| lint / typecheck / 单元测试 / coverage / build | 已完成：命令均通过，单元 161/161 |
| 发布版本、压缩包、远程仓库 / Pages | 未开始：不属于本轮 DNS 修复发布范围，未修改旧版压缩包 |

## 实际运行结果

环境：Node.js 22.23.2、npm 10.9.8、Chromium 151.0.7922.34、Mihomo v1.19.30。

| 检查 | 结果 |
| --- | --- |
| `npm run lint` | 通过，无 ESLint 警告 |
| `npm run typecheck` | 通过，包含测试与开发验证脚本 |
| `npm run test` | 6 个测试文件、161/161 通过 |
| `npm run test:coverage` | 通过；核心行 99.84%，分支 90.26%；规则行 100%，分支 98.74%；transformer / serializer 全部 100% |
| `npm run build` | 通过，生成 `dist/` |
| `npm run test:browser` | 2/2 通过，实际 clipboard 读回、Blob 下载 YAML 解析、键盘展开、错误阻断、清空、主题/语言切换 |
| `npm run test:mihomo -- <binary> <geodata>` | 20/20 通过，覆盖 16 种预设组合及 4 种冲突/内网/IP 设置 |
| `npm run test:mihomo:dns -- <binary> <geodata>` | 18/18 实际解析与本机连接场景通过；2/2 反例正确重现旧缺陷 |
| `git diff --check` | 通过 |
| `npm audit --omit=dev --json` | 上轮生产依赖报告 0 项漏洞，本轮未改依赖版本 |

浏览器流程同时断言未发出站外请求、页面 URL 未携带输入、localStorage / sessionStorage 为空且无页面异常。这是受测场景证据，不是对所有未来依赖行为的永久保证。

本环境浏览器使用临时提取的系统库及 Noto CJK 字体，未安装系统软件或修改系统代理。首次运行暴露测试定位器仍使用旧标签、输出模式切换后折叠面板未重新展开等测试脚本问题；已按实际交互修正，再跑通过。没有用强制点击或放宽关键断言掩盖问题。

上轮独立视觉审查识别到英文截图抓取了主题过渡中间帧。仅在英文截图使用 `animations: 'disabled'` 后重新跑 2/2 通过，主线程和独立审查者均查看稳定截图，确认未见持续低对比度、中文缺字、遮挡或横向溢出。本轮未改 UI 实现，重新构建并跑桌面/手机流程，额外验证 UI 输出的 DNS 顺序和节点内网策略。

## 独立审查发现与修复（已关闭）

### P1：GeoSite 先匹配，显式域名 DNS 覆盖失效

位置：`src/core/rules/plan.ts` 中 `nameserver-policy` 初始化。

旧实现把 `geosite:cn` / `geosite:geolocation-!cn` 放在显式域名策略之前。固定版本源码按策略块顺序返回首个命中；普通域名的最长匹配不会越过前面的 GeoSite 块。因此自定义直连、内网域名或 AI 的 `FORCE_PROXY` DNS 可能被地理策略抢先匹配。

独立审查者实际启动本机临时 Mihomo DNS，用 `rcode://refused` 和 `rcode://success` 模拟不同上游：GeoSite 在前时查询 `openai.com` 得到 rcode 5，仅交换次序后得到 rcode 0。没有真实节点或外网请求，进程已回收。

已修复：全部显式域名块排在 GeoSite 兜底前，补充序列化顺序与真实解析选择回归。实际 `openai.com` 命中 force 模拟上游，直接覆盖的 `google.com` 命中 direct，明确内网 `login.microsoft.com` 命中 intranet；故意将 GeoSite 移回前面时，`openai.com` 错误命中 proxy，反例准确复现。依据：[v1.19.30 策略构建](https://github.com/MetaCubeX/mihomo/blob/v1.19.30/dns/resolver.go#L534-L557)、[首个命中即返回](https://github.com/MetaCubeX/mihomo/blob/v1.19.30/dns/resolver.go#L245-L259)。

### P2：内网策略未覆盖代理节点自身解析

位置：`src/core/rules/plan.ts` 的 `proxy-server-nameserver`；关联内网 UI 的本地 DNS 保护说明。

公共 `proxy-server-nameserver` 非空时，节点服务器域名由独立解析器处理，不遵循业务 `nameserver-policy`。旧实现缺少节点专用策略，`gateway.corp.example` 或 `gateway.lan` 可能送公网 DNS。

已修复：单独生成 `proxy-server-nameserver-policy`，只包含默认本地拒绝及显式内网 DNS；不复制带 `#FORCE_PROXY` 的业务策略，避免启动解析循环。公共节点、内网节点、嵌套内网和显式配置的 `.home.arpa` 节点连接命中预期模拟 DNS；未配置的 `.lan` 节点不查询任何上游，也不建立连接。故意删除节点策略后，内网节点名到达默认 node-bootstrap 上游，反例准确复现。依据：[官方 DNS 字段](https://wiki.metacubex.one/config/dns/#proxy-server-nameserver-policy)、[v1.19.30 独立 ProxyResolver](https://github.com/MetaCubeX/mihomo/blob/v1.19.30/dns/resolver.go#L568-L575)。

本轮获得用户确认后，先新增 5 项回归：旧实现 5 项失败、原有 58 项通过。修复后相关测试 63/63 通过；独立审查者另行运行 63/63、真实运行 18/18 和反例 2/2，确认两项问题可关闭，未发现新的 P1/P2。上轮 6,655 种普通域名诊断未覆盖 GeoSite 跨块语义，不能替代本轮的运行验证。

## 真实 DNS 测试的范围

`scripts/check-mihomo-dns.ts` 从实际 YAML 序列化结果构造测试配置，保留域名键与顺序，只把公网 DoH 上游替换为本机 UDP 模拟上游，内网也使用本机模拟地址。TXT 回答标记实际命中的上游，A 回答将假节点解析到本机 HTTP CONNECT 模拟器。模拟器不会转发目标请求。

- 12 项业务解析：AI、用户直连/代理、GeoSite 兜底、内网、嵌套内网、显式本地后缀。
- 1 项未配置本地域名拒绝：没有任何上游收到查询。
- 4 项节点解析与连接：默认节点 DNS、内网、嵌套内网、显式本地后缀；同时检查其他上游未收到该节点域名。
- 1 项未配置本地节点拒绝：无上游查询、无模拟代理连接。
- 2 项反例：错误 GeoSite 顺序、缺失节点策略。只改内存测试配置，不改生产源码。

临时控制接口绑定 `127.0.0.1` 并使用随机认证信息，关闭自动测速和所有代理入站；测试成功、失败均有清理路径。本轮首次运行发现控制 API 就绪早于 DNS 监听，已补独立 DNS 就绪探测后重新通过，没有放宽策略断言。测试不使用真实密码、节点、企业 DNS 或公网解析，因此不证明实际公网 DoH 经代理传输成功。

## 重现方法

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
npx playwright install chromium
npm run test:browser
npm run test:mihomo -- /path/to/mihomo /path/to/test-geodata
npm run test:mihomo:dns -- /path/to/mihomo /path/to/test-geodata
```

核心检查需要自行准备可信来源的 Mihomo 可执行文件，以及含 `geosite.dat`、`country.mmdb` 的测试目录。脚本将数据复制到临时目录，生成假节点配置，仅使用 `mihomo -t` 检查，不启动系统代理、不修改 TUN 或系统 DNS。不会自动下载数据。

`test:mihomo:dns` 则启动临时本机测试服务，运行完成后关闭所有子进程和监听器；保留测试数据目录便于复核，同样不会自动下载或修改系统设置。运行环境必须允许绑定回环套接字。该测试独立于默认单元 CI，需要手动准备可信二进制和 GeoSite / GeoIP 数据。

浏览器测试针对 `dist/` 成品，仅在 `127.0.0.1` 启动预览。已有 Chromium 时，可设置 `TOCLASH_CHROMIUM_PATH` 指向其可执行文件。它验证 Chromium 行为，不能替代 Safari/Firefox 真机验收。

## 依赖安全范围

此前完整依赖审计发现既有 Vitest 2 及其传递开发依赖的 6 条风险（3 moderate、1 high、2 critical），本轮未改依赖版本，也未自动跨大版本升级。不要向外部网络暴露 Vitest UI 或开发服务器。新增 Playwright 测试依赖不是该报告的来源；此事项属于后续独立的测试工具升级范围，不应把测试通过视作依赖安全审计通过。此前生产依赖单独审计为 0 项，不等于开发环境无风险。

## 不能据此保证的行为

- 真实节点的可达性、速度、服务账号状态、地区限制或验证码成功率。
- UDP 防降级的真实代理端到端行为；当前验证了规则相邻关系，未连接真实节点。
- Firefox / Safari 真机、企业内网 DNS/VPN 和 GitHub 托管 runner 上的新 CI 流程（仅本地执行对应命令）。
- 未接管到 Mihomo 的应用流量、系统 VPN 路由、浏览器独立 DoH 或 `.local` mDNS。
- 远程 GeoSite/GeoIP 数据长期不变或永远可下载。
- 用户修改生成配置后的行为。
