import { defineConfig, devices } from '@playwright/test';

/**
 * e2e runs against a production build served by `vite preview`.
 * A second static origin (127.0.0.1:8099) plays the previous Boxy for the handoff test; the app is built with
 * VITE_LEGACY_ORIGIN pointing at it (see the `e2e` script in package.json).
 */
const PORT = 4173;
export const APP_ORIGIN = `http://localhost:${PORT}`;
export const LEGACY_ORIGIN = 'http://127.0.0.1:8099';
/** Same stand-in on another port: an origin that is NOT allow-listed. */
export const ROGUE_ORIGIN = 'http://127.0.0.1:8098';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  outputDir: 'test-results',
  use: {
    baseURL: APP_ORIGIN,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'en-US',
    timezoneId: 'Asia/Jakarta',
    permissions: ['clipboard-read', 'clipboard-write'],
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1360, height: 860 } }, testIgnore: /mobile\.spec\.ts/ },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: [
    {
      command: `npx vite preview --host 0.0.0.0 --port ${PORT} --strictPort`,
      url: APP_ORIGIN,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: 'node e2e/legacy-server.mjs',
      url: LEGACY_ORIGIN,
      reuseExistingServer: !process.env.CI,
      timeout: 15_000,
    },
  ],
});
