import { test as base, expect, type Page } from '@playwright/test';

/** Existing, seeded credentials — see backend/prisma/seed.ts. Not invented. */
export const SUPER_ADMIN = { email: 'harisyousfi2005@gmail.com', password: '@mo#2662' };
export const SEEDED_TEST_USER = { email: 'testuser1@meridian.dev', password: 'TestUser123!' };

/** Every account this suite creates is prefixed with this so global-teardown can find and deactivate it. */
export const TEST_DATA_PREFIX = 'pw_test_';

/**
 * Saved sessions from tests/auth.setup.ts — logged in once via the real UI
 * form, then reused via `test.use({ storageState })`. Backend login is now
 * rate-limited (5/60s per IP), and this suite's own volume of logins from a
 * single machine would otherwise trip that same limit; this also just
 * makes the suite faster and less flaky. Tests that are actually about the
 * login/register flow itself (tests/auth.spec.ts) still drive the real
 * form — only tests that need to *be* authenticated as a precondition use these.
 */
export const SUPER_ADMIN_STATE = 'playwright/.auth/super-admin.json';
export const SEEDED_USER_STATE = 'playwright/.auth/seeded-user.json';

export function uniqueTestEmail(): string {
  return `${TEST_DATA_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`;
}

interface QualityTracking {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
}

export const test = base.extend<{ tracking: QualityTracking }>({
  tracking: [
    async ({ page }, use) => {
      const tracking: QualityTracking = { consoleErrors: [], pageErrors: [], failedRequests: [] };

      page.on('console', (msg) => {
        if (msg.type() !== 'error') return;
        // Chromium auto-logs every failed fetch/XHR resource to the console
        // itself (not application code) — a deliberate wrong-password login
        // attempt legitimately gets a 401/403 from the app, and that's the
        // behavior under test, not a bug. Real 5xx server errors still fail.
        if (/Failed to load resource: the server responded with a status of (401|403)/.test(msg.text())) {
          return;
        }
        tracking.consoleErrors.push(msg.text());
      });
      page.on('pageerror', (err) => {
        tracking.pageErrors.push(err.message);
      });
      page.on('requestfailed', (req) => {
        // Navigation-triggered aborts (route changes cancelling an in-flight
        // fetch) are routine, not real failures — everything else is.
        if (req.failure()?.errorText !== 'net::ERR_ABORTED') {
          tracking.failedRequests.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText}`);
        }
      });
      page.on('response', (res) => {
        if (res.status() >= 500) {
          tracking.failedRequests.push(`${res.request().method()} ${res.url()} — HTTP ${res.status()}`);
        }
      });

      await use(tracking);

      // Runs after every test automatically (fixture is `auto`) — this is
      // the "capture console errors / detect failed requests" requirement
      // applied uniformly, not something each spec has to remember to do.
      expect(tracking.pageErrors, `Uncaught JS exceptions:\n${tracking.pageErrors.join('\n')}`).toEqual([]);
      expect(tracking.consoleErrors, `Console errors:\n${tracking.consoleErrors.join('\n')}`).toEqual([]);
      expect(
        tracking.failedRequests,
        `Failed/5xx requests:\n${tracking.failedRequests.join('\n')}`,
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/**
 * Drives the real login form — not a cookie/localStorage shortcut.
 * 15s (not Playwright's 5s action-timeout default) because both dev servers
 * are unoptimized dev builds (next dev / nest start --watch), and under the
 * full suite's concurrent load response times can genuinely run slower —
 * this is headroom for real contention, not masking a bug.
 */
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/account', { timeout: 15000 });
}
