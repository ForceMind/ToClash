# 规则增强版验证记录

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
