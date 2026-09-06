import { defineConfig, devices } from '@playwright/test';
import astroConfig from './astro.config.mjs';

/**
 * End-to-end and regression suite.
 *
 * Runs against the real production build served by `astro preview`, not the dev
 * server, so what is tested is what gets deployed — including the base path.
 *
 * Set SMOKE_BASE_URL to run the suite against a deployed site instead; the
 * nightly regression workflow uses this to check the live URL.
 */

const base = (astroConfig.base ?? '/').replace(/\/$/, '');
const localBaseURL = `http://localhost:4321${base}/`;
const baseURL = process.env.SMOKE_BASE_URL ?? localBaseURL;
const isRemote = Boolean(process.env.SMOKE_BASE_URL);

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // One worker locally: three browser projects in parallel saturates a laptop
  // and produces context-startup timeouts that look like test failures.
  workers: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  // Generous, because several tests sweep every route in a single case.
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      testIgnore: /no-js\.spec\.ts/,
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      // Reachability is viewport-independent; it runs once, on desktop.
      testIgnore: [/no-js\.spec\.ts/, /smoke\.spec\.ts/],
    },
    {
      // Everything must remain usable as plain documents.
      name: 'no-js',
      use: { ...devices['Desktop Chrome'], javaScriptEnabled: false },
      testMatch: /no-js\.spec\.ts/,
    },
  ],

  webServer: isRemote
    ? undefined
    : {
        command: 'npm run preview -- --port 4321',
        url: localBaseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
