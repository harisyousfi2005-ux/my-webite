import { test, expect, SUPER_ADMIN, SUPER_ADMIN_STATE, SEEDED_USER_STATE } from './fixtures';

// Section headings as actually rendered by each page.tsx (h2, except the
// overview which has no second heading — just the stat-card grid).
const ADMIN_SECTIONS: { path: string; heading: string | null }[] = [
  { path: '/admin', heading: null },
  { path: '/admin/products', heading: 'Products' },
  { path: '/admin/categories', heading: 'Categories' },
  { path: '/admin/orders', heading: 'Orders' },
  { path: '/admin/contact', heading: 'Contact Messages' },
  { path: '/admin/users', heading: 'Users' },
  { path: '/admin/payment-settings', heading: 'Payment Settings' },
];

test.describe('SUPER_ADMIN', () => {
  // No separate "SUPER_ADMIN can log in" test here driving the real form —
  // tests/auth.setup.ts already proves that (it's a hard prerequisite: every
  // test below depends on it succeeding), and tests/auth.spec.ts already
  // covers the login flow itself with a different account. A third,
  // redundant real login here would just add more load against the
  // now-rate-limited /auth/login endpoint for no extra coverage. Everything
  // below reuses the session auth.setup.ts already logged in, via storageState.
  test.describe('as SUPER_ADMIN', () => {
    test.use({ storageState: SUPER_ADMIN_STATE });

    for (const section of ADMIN_SECTIONS) {
      test(`SUPER_ADMIN can access ${section.path}`, async ({ page }) => {
        await page.goto(section.path);
        await expect(page).toHaveURL(new RegExp(`${section.path.replace('/', '\\/')}$`));
        await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
        if (section.heading) {
          await expect(page.getByRole('heading', { name: section.heading, exact: true })).toBeVisible();
        }
      });
    }

    test("on Users, SUPER_ADMIN's own role selector is disabled (self-demotion guard)", async ({ page }) => {
      await page.goto('/admin/users');

      // Each user row is a UserRow's own div.flex.flex-wrap... — matching
      // that specific class directly (rather than filtering the generic
      // `div` locator, which also matches every ancestor wrapper containing
      // the same text) unambiguously targets the one row.
      const ownRow = page
        .locator('div.flex.flex-wrap.items-center.justify-between')
        .filter({ hasText: SUPER_ADMIN.email });

      // The user list is paginated (50/page) and this environment keeps
      // accumulating deactivated pw_test_ accounts across runs (never hard
      // deleted, only deactivated — see global-teardown.ts), so the admin's
      // own row keeps drifting to a later page over time — page forward
      // until it's found. The account list is also a shared, mutable
      // resource: other workers running in parallel are creating accounts
      // of their own right now, which insert at the top (newest-first
      // sort) and can shift page boundaries mid-scan — the generous
      // attempt cap and per-click wait give that room to settle rather
      // than racing it. Next.js's own dev-mode indicator badge is fixed to
      // the bottom-left of the viewport and can visually sit on top of
      // this button once the page scrolls, so `force: true` dispatches
      // straight to the real element instead of whatever's on top of it
      // at those screen coordinates.
      const nextButton = page.getByRole('button', { name: 'Next', exact: true });
      for (let attempt = 0; attempt < 40; attempt++) {
        if (await ownRow.isVisible().catch(() => false)) break;
        if (await nextButton.isDisabled()) break;
        await nextButton.click({ force: true });
        await page.waitForTimeout(400);
      }

      await expect(ownRow).toBeVisible();
      await expect(ownRow.locator('select')).toBeDisabled();
    });
  });

  test('signed-out visitor is redirected away from /admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
  });

  test.describe('as normal USER', () => {
    test.use({ storageState: SEEDED_USER_STATE });

    for (const section of ADMIN_SECTIONS) {
      test(`normal USER cannot access ${section.path}`, async ({ page }) => {
        await page.goto(section.path);
        await expect(page).toHaveURL('http://localhost:3000/');
        await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).not.toBeVisible();
      });
    }
  });
});
