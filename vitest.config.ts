import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: { provider: 'v8', include: ['src/core/**/*.ts'], thresholds: { lines: 90 } },
  },
})
