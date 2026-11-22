import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,   // the iPad (WebKit) engine is slow when several tests run at once
  // reducedMotion: the den fox stands still and confetti is skipped, which keeps the slow WebKit engine steady.
  // Tests that check animation switch it back on with test.use({ reducedMotion: 'no-preference' }).
  use: { baseURL: 'http://localhost:8123', serviceWorkers: 'block', reducedMotion: 'reduce' },
  webServer: { command: 'node tools/serve.mjs 8123', url: 'http://localhost:8123', reuseExistingServer: true },
  projects: [
    // iPad Safari engine with touch input
    { name: 'ipad-webkit', use: { ...devices['iPad (gen 7)'] } },
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
  ],
});
