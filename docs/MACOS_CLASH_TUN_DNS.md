# macOS、Clash TUN 与公司 DNS：配置和排查记录

记录日期：2026-10-16。本文根据 macOS 26.2、Clash Verge Rev 2.5.8、Mihomo v1.19.32 的源码和本机实测整理。其他版本需要重新核对，不能直接套用所有实现细节。

本文使用 `corp.example` 和文档保留地址 `192.0.2.53` 作示例，不能直接照抄为实际公司配置。本机实际地址、配置快照和恢复位置另存于 Clash Verge 的本地备份目录，不进入 Git。

## 先记住这三件事

1. `DIRECT` 决定连接不经过代理节点，不会自动选择公司 DNS。
2. macOS 界面显示的 DNS，可能是 Clash TUN 写入的占位地址。
3. 真正负责查目标地址的是 Mihomo 的上游 DNS，需要检查 YAML 中的默认解析、直连解析、节点解析和域名策略。

## 为什么系统设置里会出现 114.114.114.114

Clash Verge Rev 2.5.8 在 macOS 上运行 TUN、启用 DNS 且采用 `fake-ip` 时，会把系统 DNS 设为源码中的固定占位地址 `114.114.114.114`，让系统 DNS 流量进入 TUN 接管路径。它会保存原值，供不再需要占位地址时恢复。

因此，不能只看到这个地址就认定它是用户手动填写的，也不能直接据此认定所有请求都发给这个公网 DNS。应同时检查 Mihomo 的实际上游、域名策略和 TUN 状态。

本次实测中，直接把 Wi-Fi DNS 改成公司 DNS 曾短暂生效，但重新应用 Clash 配置后又显示占位地址。Clash 保存的恢复值已成为公司 DNS；这与 TUN 开着时界面显示占位地址是两种状态。

| 位置 | 含义 | 应检查的内容 |
| --- | --- | --- |
| macOS「网络 → Wi-Fi → 详细信息 → DNS」 | 系统当前使用的 DNS 入口 | TUN 运行时是否被 Clash 写为占位地址 |
| YAML `nameserver` | 普通业务域名的默认上游 | 实际交给哪个服务器查询 |
| YAML `direct-nameserver` | DIRECT 出口的域名解析上游 | 是否明确使用公司 DNS |
| YAML `proxy-server-nameserver` | 代理节点自身的域名解析上游 | 节点在连接代理前能否被解析 |
| YAML `nameserver-policy` | 指定域名或后缀的解析上游 | 是否有更具体的内网或服务专用策略 |
| Clash 保存的原 DNS | 关闭 TUN / 退出时的恢复数据 | 不能与当前界面显示值混为一谈 |

Clash 2.5.8 使用 `.original_dns/` 保存网络服务对应的恢复数据。这是客户端内部状态，不建议手动修改或删除；记录中应明确“已读到保存值”还是“已实际关闭 TUN 验证恢复”。

## 如何让普通直连实际使用公司 DNS

公司 DNS 能同时解析内网、公网和节点域名，而且当前网络或 VPN 能访问它时，可明确配置以下默认上游：

```yaml
dns:
  nameserver:
    - udp://192.0.2.53:53
  direct-nameserver:
    - udp://192.0.2.53:53
  proxy-server-nameserver:
    - udp://192.0.2.53:53
  direct-nameserver-follow-policy: true
```

这是修改 Clash 的解析上游，TUN 和系统代理方式下进入 Clash 的普通直连请求都可使用，不只影响 TUN。

`direct-nameserver-follow-policy: true` 会保留已有域名策略的作用。服务专用代理 DNS、Workers 专用 DNS、内网策略及保留本地域名仍按各自配置执行，不能把上述三个默认值描述成“所有 DNS 查询无条件都去公司服务器”。

不要让代理节点域名必须先经过该代理才能解析，否则会形成启动依赖循环。改变 `proxy-server-nameserver` 前，必须验证公司 DNS 能解析实际节点域名。

`system` 是让 Mihomo读取系统 DNS，不等于“公司 DNS”。本次核对的 Mihomo 版本从 `/etc/resolv.conf` 读取服务器列表，并有约 5 分钟的列表刷新间隔；不能仅凭系统界面改动就宣称内核已即时采用新服务器。

## 一次覆盖整个内网后缀

如需明确固定某个公司后缀，可同步维护业务解析、节点解析、fake-IP 排除及直连规则：

```yaml
dns:
  nameserver-policy:
    "+.corp.example":
      - udp://192.0.2.53:53
  proxy-server-nameserver-policy:
    "+.corp.example":
      - udp://192.0.2.53:53
  fake-ip-filter:
    - "+.corp.example"
  direct-nameserver-follow-policy: true

rules:
  - DOMAIN-SUFFIX,corp.example,DIRECT
```

这些是合并片段，不是完整配置。不要覆盖原有 DNS policy、fake-IP 排除或规则列表。后缀应覆盖该域及其子域，新子域在公司 DNS 登记后无需逐个加入 Clash。只设置 DNS 不会创建 DNS 记录、VPN 路由或服务器入口。

配置了全局公司上游后，普通直连域名可使用这个上游，不必逐个列出；保留已有后缀策略，有助于明确公司区域及真实地址解析要求。

## 多份节点配置怎样保持策略一致

切换代理配置时，节点不同不代表 DNS 和内网分流也应不同。需要统一策略的配置应比较并同步完整的 `dns` 和 `rules`，不能只同步最后新增的一条域名。

同步时保留每份配置自己的 `proxies`、策略组内节点引用和所选出口，先检查复制的规则引用了哪些策略组，再用已安装的可信 Mihomo 校验。不要直接把另一份配置的节点列表或整份 YAML 覆盖过去。

当前运行配置也应与已启用配置的 DNS / rules 一致；修改未启用的配置文件不会自动改变当前内核。

## 修改前后怎样验证

1. 备份所有要修改的配置，记录当前配置、所选出口、系统 DNS 和原可达站点。
2. 直接查询公司 DNS，验证内网、公网和节点域名。普通 `dig` 可能被 TUN 接管；其显示的服务器地址不能独自证明实际应答者。
3. 使用已安装的可信核心执行 `mihomo -t`，配置可加载后再重载当前配置。
4. 回读系统显示值、Clash 保存的恢复值和 YAML 实际上游，三者分别记录。
5. 用同一组 URL 比较修改前后，检查浏览器实际渲染、前端资源和后端域名；未执行登录就不能宣称登录后业务通过。
6. 回读所有来源配置及运行配置，确认 DNS / rules 一致、节点与出口选择未意外改变。

本次验证中，公司 DNS 能解析所需内网、公网及两份节点域名；修改默认上游后，六个原可达的内外网 URL 保持同样的 HTTP 状态。两份来源配置与当前运行配置的 DNS / rules 均一致。

HTTP `200` 只证明请求收到响应。接口仍可能在 JSON 中返回业务错误码，例如 `code: -1`；应与 DNS 失败、连接超时分开记录。登录跳转也不代表游戏或后台登录后的业务已验证。

## 恢复方法与网络切换

公司 DNS 是私网服务，离开公司且 VPN 不可达时，显式使用它的默认解析可能失效。切换网络前应恢复到当前网络可用的上游，不能只看 Wi-Fi 界面里是否还有占位地址。

恢复步骤：

1. 先备份当前配置。根据记录只恢复这次改动的字段，保留之后新增的节点和规则。
2. 如果恢复至原来的 `system` 模式，在两份来源配置中恢复三个默认 DNS 字段，并重新加载当前配置、保留节点选择。
3. 若还需恢复 macOS DNS，通过正常客户端流程关闭 TUN，再到系统设置中选用原值或当前网络自动分配的 DNS；重新开启后核对占位值、保存的恢复值和实际上游。
4. 验证原来可达的内外网站点。失败时恢复备份并保留原始错误，不用反复扩大 DNS 修改范围。

备份位于本机 Clash Verge 数据目录的 `backups/`。不可盲目整份覆盖较新的配置，不要把含节点凭据的备份提交到仓库。

## 网页重新导出时需要注意

ToClash v0.3.13 默认直连模式仍生成 `system` 作为默认 DNS。本机手动指定公司上游，不会自动成为网页默认值。

YAML 导入器会重建 ToClash 管理的字段，包括三个默认 DNS 字段；即使导入当前完整 YAML，再导出也可能将这些值恢复为网页默认。域名 policy 的保留行为不能代替对默认 DNS 字段的检查。

因此，重新导出后要核对 `nameserver`、`direct-nameserver`、`proxy-server-nameserver`，再导入客户端。要长期通过网页维护公司默认上游，需要网页支持相应选项，不能假设本机改动已自动同步。

## 核对来源

- [Apple：更改 DNS 设置](https://support.apple.com/zh-sg/guide/mac-help/mh14127/mac)
- [Clash Verge Rev 2.5.8：TUN 占位 DNS 的条件、固定值与恢复机制](https://github.com/clash-verge-rev/clash-verge-rev/blob/v2.5.8/src-tauri/src/utils/resolve/dns.rs)
- [Clash Verge Rev 2.5.8：保存系统 DNS 的脚本](https://github.com/clash-verge-rev/clash-verge-rev/blob/v2.5.8/scripts/set_dns.sh) · [恢复脚本](https://github.com/clash-verge-rev/clash-verge-rev/blob/v2.5.8/scripts/unset_dns.sh)
- [Mihomo DNS 配置](https://wiki.metacubex.one/config/dns/)
- [Mihomo v1.19.32：系统 DNS 读取](https://github.com/MetaCubeX/mihomo/blob/v1.19.32/dns/system_posix.go) · [刷新逻辑](https://github.com/MetaCubeX/mihomo/blob/v1.19.32/dns/system_common.go) · [刷新间隔](https://github.com/MetaCubeX/mihomo/blob/v1.19.32/dns/system.go)
- 项目实现：[`plan.ts`](../src/core/rules/plan.ts)、[`defaults.ts`](../src/core/rules/defaults.ts)、[`mergeDns()`](../src/core/importer/mihomo.ts)。规则背景见 [规则与 DNS 说明](RULES.md)。
