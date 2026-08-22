# Contributing

Thanks for improving ToClash. Never commit or paste real proxy credentials, UUIDs, tokens, or private server addresses.

1. Install Node.js 20+ and run `npm install`.
2. Start the app with `npm run dev`.
3. Add focused parser/transformer tests for behavior changes.
4. Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.
5. Open a focused pull request explaining compatibility and privacy impact.

Protocol changes should preserve the URI → normalized node → Mihomo transformer boundary. Prefer official Mihomo documentation as the source for output fields.
