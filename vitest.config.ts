import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['**/._*'],
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    environmentOptions: {
      jsdom: { url: 'http://localhost/' },
    },
    coverage: { provider: 'v8', include: ['src/core/**/*.ts'], thresholds: { lines: 90 } },
  },
})
