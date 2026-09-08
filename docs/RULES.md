# 规则与 DNS 使用指南

面向希望得到可理解、可维护 Mihomo 配置的用户。本指南描述规则增强工作区；发布状态和已知问题以[验证记录](VALIDATION.md)为准。

## 从哪里开始

1. 粘贴节点，点击“转换”；默认输出完整配置，四类服务预设全部开启。
2. 有特殊网站时，展开“自定义网站分流”。需要直连的填入第一栏，需要代理的填入第二栏，每行一个。
3. 访问企业或家庭内网时，展开“企业 / 家庭内网 DNS”，启用并同时填写域名后缀及内网 DNS 地址。不知道 DNS 地址时应询问网络管理员，不使用示例地址替代。
4. 处理所有无效行和覆盖提示，再复制或下载配置。配置导入 Mihomo 后才会产生 DNS 查询、测速和代理连接。

自定义分流与内网 DNS 设置自动保存在当前浏览器，刷新或重新打开同一站点会恢复；代理链接和输出不持久保存。具体填写、保存边界和重置操作见[表单填写指南](FILLING_GUIDE.md)。

## 代理组不等于分流规则

`proxy-groups` 决定选哪个出口；`rules` 决定哪些请求交给这个出口。节点使用 WS、gRPC 或 XHTTP 只是连接代理服务器的传输方式，不会绕开网站规则。网站自身的 `ws://` / `wss://` 连接也按目标域名/IP 分流，不存在“所有 WS 流量都必然代理”的规则。

| 组 | 可选择的出口 | 使用场景 |
| --- | --- | --- |
| `PROXY` | `AUTO`、`DIRECT`、全部节点 | 普通服务和最终兜底；允许用户改为直连 |
| `AUTO` | 全部节点 | Mihomo 的 `url-test` 自动选择；无 `DIRECT` |
| `FORCE_PROXY` | `AUTO`、全部节点 | 用户必须代理、OpenAI 和 Claude 预设；无 `DIRECT` |

Mihomo 遇到不支持 UDP 的代理时可能继续匹配后续规则。因此每条 `FORCE_PROXY` 规则后都附加同条件 `REJECT`。连接失败不会自动改用 `DIRECT`；这不保证所选节点可用，也不能拦截根本未进入 Mihomo 的流量。

同名节点自动编号，且避开 `PROXY`、`AUTO`、`FORCE_PROXY`、`DIRECT` 等保留名，防止引用冲突或组循环。

## 明确的匹配顺序

由上到下优先匹配：

1. 本机、局域网域名与地址直连：`localhost`、`.local`、`.lan`、`.home.arpa`，回环、RFC1918、链路本地以及 IPv6 回环/ULA/链路本地。
2. 用户配置的内网域名直连，更具体的内网子域优先。
3. 用户“始终直连”。
4. 用户“始终代理”，使用 `FORCE_PROXY`。
5. 已开启的服务预设，按 OpenAI、Claude、开发者、Google 顺序。
6. `GEOSITE,CN,DIRECT` 和 `GEOIP,CN,DIRECT`。
7. `MATCH,PROXY`。

共享地址 `100.64.0.0/10`（CGNAT）不是 RFC1918 私网，默认不加入局域网直连；确实需要本地访问时单独勾选。

### 冲突如何处理

- 直连 `example.com` + 代理 `app.example.com`：父域直连覆盖子域代理，显示覆盖提示。
- 直连 `app.example.com` + 代理 `example.com`：该子域直连，其余子域代理，显示覆盖提示。
- 内网 `corp.example` + 代理 `example`：内网子域仍然直连并使用内网 DNS，其余按代理规则。
- 本地/IP 保护与用户代理冲突：本地直连优先；界面不能用于强行代理本机或局域网。
- 关闭预设只移除专用规则，流量仍可能命中 `MATCH,PROXY`。要直连必须填入直连列表。

提示只展示覆盖类别和数量，不回显敏感输入。规则生成顺序稳定，相同设置得到相同输出。

## 输入契约

| 输入 | 处理 |
| --- | --- |
| `example.com` / `*.example.com` | 域名及其子域名规则 |
| `https://example.com/path` / `wss://example.com/socket` | 仅提取主机；忽略端口、路径和查询对网站分流的区别 |
| `192.0.2.1` | `IP-CIDR,192.0.2.1/32,...,no-resolve` |
| `[2001:db8::1]` | `IP-CIDR6,2001:db8::1/128,...,no-resolve` |
| Unicode 域名 | 使用标准 URL 解析为规范域名 |
| 含凭据的网址、换行注入、逗号规则片段、错误端口 | 拒绝并报告行号，不导出部分有效的完整配置 |

空行忽略；大小写、末尾点、重复项会规范化。IP 规则只匹配该 IP，域名目标不会仅因填写其某个 IP 就必然命中；`no-resolve` 不会专为这条规则发起解析。

只输出 `proxies:` 时不生成规则、DNS 或组，也不要求修正暂未使用的规则表单。

## DNS 的三个职责

1. `nameserver-policy`：业务域名由谁解析，应与上述分流意图一致。普通直连使用阿里/腾讯 DoH；代理业务使用经相应组访问的 Cloudflare/Google DoH。
2. `fake-ip-filter`：哪些域名应返回真实地址，不是路由规则。内网域名同时加入此列表及 `DIRECT`。
3. `proxy-server-nameserver` / `proxy-server-nameserver-policy`：独立解析代理服务器自身地址。公共节点用默认节点 DNS，内网节点用指定内网 DNS；未配置内网 DNS 的保留本地后缀拒绝上游查询。这套策略不包含业务域名的代理组标签，避免“先连代理才能解析代理”的依赖循环。

`direct-nameserver-follow-policy: true` 让直连出口解析继续遵循域名策略。默认保留本地后缀使用 `rcode://refused`，不送公网解析；配置内网 DNS 后覆盖拒绝策略。系统 hosts 可以先提供实际地址。

显式域名 DNS 策略连续排列在 GeoSite 兜底之前。Mihomo 按策略块顺序匹配：不能将 GeoSite 写在前面，再期待后面的精确域名覆盖它。内网域名的业务解析和节点服务器解析使用相同的本地 / 内网规则，但两套配置独立维护，不把 `#PROXY` / `#FORCE_PROXY` 的业务上游复制到节点引导解析中。修复与实际解析证据见[验证记录](VALIDATION.md)。

### 内网设置示例（全部为说明用值）

```text
内网域名后缀：corp.example
内网 DNS 服务器：192.0.2.53
```

UI 的所有后缀共用同一组服务器；核心 API 可为不同后缀配置不同 DNS。服务器仅接受 IPv4、IPv6 以及可选端口（或等价 `udp://` 格式）；不接受域名上游、`system://` 或自动发现，避免循环依赖。没有默认内网地址。

企业建议结构：

```text
浏览器 → 企业域名（前端/API） → 系统 / Mihomo DNS 分流
       → 内网 DNS → Ingress / 网关 → 内部服务
```

不要把 Kubernetes 的 `*.svc.cluster.local` 直接当作桌面浏览器 API 地址。前端与 API 都应使用浏览器可访问的企业域名。`.local` 可能走系统 mDNS；浏览器自有 DoH 也可能绕开系统解析路径，这些需要用户或管理员配置，ToClash 不会代为修改。内网/VPN 及 DNS 服务器必须已经可达。

## 服务预设范围与维护

预设不是远程规则订阅，不会自动更新；域名清单集中在 `src/core/rules/presets.ts`，修改须附来源和测试。

- OpenAI：API、ChatGPT、静态资源、认证相关自有域名，以及精确匹配的 `workos.imgix.net`、`challenges.cloudflare.com`。
- Claude：Anthropic/Claude 自有服务域名及精确的浏览器 WebSocket bridge、旧安装包存储和 release notes 主机。
- 开发者：GitHub 网站、资源和 Pages 域名。
- Google / YouTube：主站、API、静态资源与常见视频资源域名。

共享主机使用精确匹配，避免代理整个 `cloudflare.com`、`googleusercontent.com` 等大型服务空间。精确规则仍会影响同主机上的其他用途，例如共享验证码、存储桶；可以关闭相关预设或显式直连。该清单并非所有支付、遥测、SSO 或地区域名的全集，不能承诺完成所有账号验证。无进程级规则，也不会修改 Managed Provider 或 AgentBox 的环境变量。

## 验收与排障

- 导出设置无错误，组引用均存在，YAML 可以往返解析。
- 用可信 Mihomo 和 GeoSite / GeoIP 数据运行 `npm run test:mihomo -- /path/to/mihomo /path/to/geodata`；语法通过不代表真实流量策略已验证。
- 开发者可运行 `npm run test:mihomo:dns -- /path/to/mihomo /path/to/geodata`，验证真实核心的 DNS 匹配与节点域名解析。所有上游替换成本机模拟服务，测试不会查询这些示例域名的公网 DNS。
- 在自己的设备检查前端/API 的系统 DNS 和浏览器 DNS，再观察 Mihomo 连接/规则结果。
- 检查直连/代理父子域、内网子域、节点服务器域名各自的解析路径；不要只检查页面是否能打开。
- 切换 VPN/TUN、浏览器和重启客户端后重复检查。系统 DNS、网络路由、账号风控不属于网页转换器可控制的范围。

## 规范来源

- [Mihomo DNS 配置](https://wiki.metacubex.one/config/dns/)：业务策略、代理服务器解析、direct-nameserver-follow-policy。
- [Mihomo DNS 上游类型](https://wiki.metacubex.one/config/dns/type/)：`rcode://refused` 等类型与平台限制。
- [Mihomo 路由规则](https://wiki.metacubex.one/config/rules/)：匹配顺序、UDP、不解析 IP 规则。
- [Mihomo 通用配置](https://wiki.metacubex.one/config/general/)：GeoSite / GeoIP 数据要求。
- [OpenAI 网络建议](https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps)：服务及登录相关域名。
- [Claude Code 网络配置](https://code.claude.com/docs/en/network-config)：API、登录、安装更新及浏览器集成。
- [RFC 6598](https://www.rfc-editor.org/rfc/rfc6598.html)：共享地址空间不等同普通私网。

维护优先级：固定版本核心的真实行为 > 当前官方文档 > 此处说明 > 非规范 URI 或用户示例。发生偏差应报告并补回归测试，不能只增加看起来合理的字段。
