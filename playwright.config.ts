import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config. Runs against `vite preview` on the real production build, so the
 * tests exercise the shipped bundle rather than the dev server.
 *
 * The port is unusual on purpose: local machines often already have something
 * on 4173, and a stale server would silently test the wrong app.
 */
const PORT = 4180;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 12_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'off',
    screenshot: 'off',
    ...devices['Desktop Chrome'],
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'iphone',
      use: {
        ...devices['iPhone 13'],
        // iOS users frequently enable Reduce Motion, and our CSS explicitly
        // supports it by collapsing animation durations. Running the iPhone
        // project this way tests that supported path and removes timing flake.
        reducedMotion: 'reduce',
      },
    },
  ],
  webServer: {
    // `--host 127.0.0.1` matters: without it Vite binds only to ::1, and the
    // 127.0.0.1 readiness probe below would never succeed.
    command: `npm run preview -- --port ${PORT} --strictPort --host 127.0.0.1`,
    url: `${BASE_URL}/digital-dna/`,
    reuseExistingServer: false,
    timeout: 90_000,
    env: { NO_PROXY: '127.0.0.1,localhost', no_proxy: '127.0.0.1,localhost' },
  },
});
