// Node 26 exposes an experimental global localStorage getter. Vitest 2 does
// not replace that existing global with JSDOM's storage, so explicitly point
// test code at the JSDOM implementation used by the browser application.
const vitestGlobal = globalThis as typeof globalThis & {
  jsdom?: { window: Window }
}

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  get: () => vitestGlobal.jsdom?.window.localStorage,
})
