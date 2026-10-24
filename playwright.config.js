import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:8123', serviceWorkers: 'block' },
  webServer: { command: 'node tools/serve.mjs 8123', url: 'http://localhost:8123', reuseExistingServer: true },
  projects: [
    // iPad Safari engine with touch input
    { name: 'ipad-webkit', use: { ...devices['iPad (gen 7)'] } },
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
  ],
});
