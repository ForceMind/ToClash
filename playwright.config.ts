import { defineConfig } from '@playwright/test'

const port = Number(process.env.TOCLASH_TEST_PORT || 4173)

export default defineConfig({
  testDir: './e2e',
  testIgnore: '**/._*',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: 'chromium',
    launchOptions: process.env.TOCLASH_CHROMIUM_PATH
      ? { executablePath: process.env.TOCLASH_CHROMIUM_PATH }
      : {},
  },
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
  },
  projects: [
    {
      name: 'desktop-light',
      use: { viewport: { width: 1440, height: 1000 }, colorScheme: 'light' },
    },
    {
      name: 'mobile-dark',
      use: { viewport: { width: 390, height: 844 }, colorScheme: 'dark' },
    },
  ],
})
