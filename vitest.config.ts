import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    coverage: { provider: 'v8', include: ['src/core/**/*.ts'], thresholds: { lines: 90 } },
  },
})
