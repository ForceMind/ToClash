# Architecture

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
