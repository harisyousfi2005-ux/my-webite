import { defineConfig, devices } from '@playwright/test';

/**
 * This suite assumes the frontend (npm run dev, :3000) and backend
 * (cd backend && npm run start:dev, :4000) are already running — the
 * backend needs a live Postgres connection and real env vars that aren't
 * safe to spin up automatically from here, so no `webServer` is configured.
 * See tests/global-setup.ts, which fails fast with a clear message if
 * either isn't reachable instead of letting every test time out separately.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // Requirement: screenshots only on failure.
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
  ],
});
