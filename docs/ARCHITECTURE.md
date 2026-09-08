# 架构说明

ToClash 是纯静态 React 应用，不包含后端、数据库、Service Worker、统计服务或在线转换 API。

阅读路径：用户先看[规则指南](RULES.md)，开发者看本页，验收者看[验证记录](VALIDATION.md)。当前发布/未通过状态以验证记录为准。

## 转换流程

```text
文本输入 → 行归一化与协议识别 → 协议 Parser → 统一 ProxyNode
        → Schema 校验与 Mihomo Transformer → YAML Serializer → 内存输出
```

每种协议 parser 都是 `src/core/parser` 下的纯函数，优先使用标准 URL parser，IPv6 地址也由标准实现处理。VMess 与旧版 Shadowsocks 共用 UTF-8 Base64 工具。单行失败会转换为结构化问题，不会中断批次。

`src/core/model/proxy.ts` 定义与输出格式无关的节点和错误类型；未来的 sing-box 或 Xray transformer 可以复用它。`mihomo.ts` 校验必要字段并保持 YAML 字段顺序稳定。React UI 通过核心层转换、规则规划与序列化 API 生成结果，代理链接始终留在组件内存，自定义分流和内网 DNS 由 `src/settings/storage.ts` 保存到 LocalStorage。

## 规则 / DNS 分支

```text
URI → Parser → ProxyNode[] ────────────────────────────────┐
                                                          ↓
规则表单 → 规范化 → CustomRouting → buildRulePlan → Mihomo Transformer
                                                          ↓
                                 YAML Document → 内存输出 → 复制 / 下载
```

协议 parser 不依赖规则或 YAML；规则规划器不访问节点凭据或 DOM；serializer 不解析 URI。未来输出器可以复用 `ProxyNode`，但不会直接复用带有 Mihomo 语义的 DNS 输出对象。

| 职责 | 实现 | 验证 |
| --- | --- | --- |
| 域名/IP 规范化、内网服务器校验 | `utils/domain.ts`、`utils/intranet.ts` | `tests/routing-utils.test.ts` |
| 节点与组保留名冲突处理 | `utils/names.ts` | routing-utils / transformer tests |
| 静态服务清单、本地默认值 | `rules/presets.ts`、`rules/defaults.ts` | `tests/rules.test.ts` |
| 规则、DNS、覆盖提示共同编译 | `rules/plan.ts` | rules tests、真实核心验证 |
| 节点映射、组引用校验 | `transformer/mihomo.ts` | `tests/transformer.test.ts` |
| YAML AST 和分类注释 | `serializer/yaml.ts` | transformer tests、YAML 往返解析 |
| 表单状态、错误阻断、浏览器操作 | `App.tsx`、`components/` | `tests/ui.test.tsx`、`e2e/routing.spec.ts` |

### 核心契约

`CustomRouting` 支持 `directDomains`、`proxyDomains`、四类服务 `presets`（未指定默认开启）、`bypassCgnat`（默认关闭），以及由后缀和 IP-literal UDP DNS 数组组成的 `intranet`。核心 API 可为不同内网后缀指定不同 DNS；更具体后缀优先，同后缀不同 DNS 定义报错。

`buildRulePlan(routing)` 是纯函数，返回有序 `sections`、`dns`、脱敏 `warnings`；输入非法则抛结构化 `ConversionError`，不静默省略无效目标。节点转换仍独立逐行容错，不因为一个坏节点丢失其他成功结果。

`buildMihomoConfig(nodes, full, routing)` 验证必需字段、分配唯一安全名称，确认组引用存在且无环。完整配置至少需要一个有效节点；`full=false` 时只输出节点，不读取分流设置。

`serializeMihomo` 使用 `yaml.Document` / AST 和稳定对象顺序，不对 YAML 成品做字符串替换，不插入不可信注释。分类注释来自静态元数据。

### 规则与 DNS 一致性

规划器先建立有效匹配项，再产出规则和域名 DNS。较早父域完全覆盖后续子域时，不保留不可达的后续策略；较早子域与后续父域并存时保留两者。

Mihomo DNS 并非全局最长后缀查找：连续普通域名可以构成最长匹配块，但 GeoSite 等匹配器会分割块，多个块按声明顺序处理。因此规划器先产出全部显式普通域名，最后追加 GeoSite 兜底。

代理节点自身有独立解析器。规划器在生成业务策略之前，深复制本地拒绝和内网 DNS 作为 `proxy-server-nameserver-policy`；不含业务 direct/proxy、GeoSite 或代理组 DNS 标签，防止引导解析循环。两套策略不共享可变数组，公共节点继续使用默认 `proxy-server-nameserver`。

`scripts/check-mihomo-dns.ts` 将序列化结果中的上游替换为本机模拟 DNS，保留键顺序与匹配器，实际启动 Mihomo 验证 TXT 解析目的地；再通过本机模拟 HTTP CONNECT 节点验证独立节点解析器。测试关闭自动测速、禁用系统 hosts，所有监听仅绑定回环、控制 API 使用随机凭据，不设置 TUN 或系统代理。反例测试重排 GeoSite / 删除节点 DNS 策略以确认能够复现旧缺陷。具体结果见[验证记录](VALIDATION.md)。

### UI 状态与失败路径

- 初始：简体中文、跟随系统初始主题、完整配置、四类预设开启、内网及 CGNAT 关闭。
- 编辑节点：立即清除旧结果，需要再次转换，避免复制过期结果。
- 编辑规则：实时重新生成；非法输入暂停完整输出和复制/下载。
- 切换仅 proxies：隐藏面板并暂时忽略规则错误；回到完整模式仍保留和验证表单值。
- 内网开关：关闭时保留输入但不应用；开启后必须完整有效。
- 清空节点和结果：仅清除节点、结果和通知。
- 重置已保存设置：删除本工具存储项并恢复规则默认值，保留节点、语言、主题和输出格式。
- 自动恢复：只读取 v1 存储的五个白名单字段，检查字段类型；损坏或未知版本提示失败且初次挂载不覆盖原值，编辑或显式重置后可以替换。输入继续由规则校验器验证。
- 保存：自定义及内网输入变化时同步写入；空默认值删除本工具 key，不清理同源其他存储项。写入失败显示提示。
- 输出失败：不显示原始异常/堆栈，只显示安全提示。
- 复制/下载：仅显式点击触发。异步复制用修订号防止过期提示；下载移除临时元素并延迟释放 Blob URL。

不存在远程同步、后台轮询或系统设置变更。持久化仅限自定义分流和内网 DNS，服务预设和 CGNAT 不保存。临时 Blob URL 仅用于下载，不将输入写入页面 URL。

### 验证边界

规则扩展集中修改清单或规划器，不在 UI 拼接 YAML。最低回归覆盖正常/非法目标、父子域交叉、内网、命名、输出模式、复制下载、清空与原协议。`mihomo -t` 只证明配置可加载；DNS 匹配顺序或节点解析变更需实际核心路径验证。

开发脚本可以读写临时假数据、启动本地测试进程，但不进入浏览器构建，不修改宿主机代理或 DNS。生产入口只有 `src/main.tsx`。

## 扩展协议

1. 新增或修改职责单一的 parser。
2. 只为可复用语义扩展统一模型。
3. 在 transformer 中映射 Mihomo 支持的字段。
4. 无法安全映射的输入必须返回 warning。
5. 添加正常、边界和错误输入测试。

---

## English reference

ToClash is a static React application. It has no backend, database, service worker, analytics integration, or conversion API.

## Conversion flow

```text
Text input
  → line normalization and protocol detection
  → protocol-specific parser
  → normalized ProxyNode
  → schema validation and Mihomo transformer
  → YAML serializer
  → in-memory output
```

### Parsers

Each protocol parser is a pure function under `src/core/parser`. Standard URL parsing is preferred, including bracketed IPv6 addresses. VMess and legacy Shadowsocks use the shared UTF-8 Base64 utility.

Parsers return normalized nodes and warnings. They do not know about YAML key names. A failed line becomes a structured issue and does not abort the batch.

### Normalized model

`src/core/model/proxy.ts` defines transport-independent node, option, error, and batch-result types. Future sing-box or Xray transformers can consume the same model without rewriting URI parsing.

### Mihomo output

`src/core/transformer/mihomo.ts` validates required fields and constructs objects in stable key order. `src/core/serializer/yaml.ts` delegates encoding to the maintained `yaml` package.

### UI boundary

React uses pure conversion and rule-planning APIs. Clipboard and Blob downloads are explicit user actions. Proxy input stays in component memory. Custom routing and intranet DNS are stored locally with a versioned, validated field allowlist. Rule and DNS semantics need runtime verification beyond configuration syntax checks.

## Adding protocol compatibility

1. Add or update a focused parser.
2. Extend the normalized model only for reusable semantics.
3. Map supported fields in the transformer.
4. Emit a warning for input that cannot be mapped safely.
5. Add parser and transformer fixtures, including invalid input.
