# 架构说明

ToClash 是纯静态 React 应用，不包含后端、数据库、Service Worker、统计服务或在线转换 API。

## 转换流程

```text
文本输入 → 行归一化与协议识别 → 协议 Parser → 统一 ProxyNode
        → Schema 校验与 Mihomo Transformer → YAML Serializer → 内存输出
```

每种协议 parser 都是 `src/core/parser` 下的纯函数，优先使用标准 URL parser，IPv6 地址也由标准实现处理。VMess 与旧版 Shadowsocks 共用 UTF-8 Base64 工具。单行失败会转换为结构化问题，不会中断批次。

`src/core/model/proxy.ts` 定义与输出格式无关的节点和错误类型；未来的 sing-box 或 Xray transformer 可以复用它。`mihomo.ts` 校验必要字段并保持 YAML 字段顺序稳定。React UI 只调用 `convertLinks()` 和 `serializeMihomo()`，输入始终留在组件内存。

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

React calls only `convertLinks()` and `serializeMihomo()`. Clipboard and Blob downloads are explicit user actions. Input stays in component memory and is cleared without page reload.

## Adding protocol compatibility

1. Add or update a focused parser.
2. Extend the normalized model only for reusable semantics.
3. Map supported fields in the transformer.
4. Emit a warning for input that cannot be mapped safely.
5. Add parser and transformer fixtures, including invalid input.
