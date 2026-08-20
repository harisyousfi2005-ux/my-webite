import { test, expect, loginAs, uniqueTestEmail, SEEDED_TEST_USER } from './fixtures';

test.describe('Authentication', () => {
  test('register creates a clearly-marked test account and logs in', async ({ page }) => {
    const email = uniqueTestEmail(); // pw_test_-prefixed — swept up by global-teardown
    await page.goto('/register');
    await page.fill('input[placeholder="First name"]', 'Playwright');
    await page.fill('input[placeholder="Last name"]', 'Test');
    await page.fill('input[placeholder="Email address"]', email);
    await page.fill('input[placeholder="Password (min. 8 characters)"]', 'TestPass123!');
    await page.fill('input[placeholder="Confirm password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/account', { timeout: 10000 });
    await expect(page.getByText(email)).toBeVisible();
  });

  test('login works with an existing seeded test account', async ({ page }) => {
    await loginAs(page, SEEDED_TEST_USER.email, SEEDED_TEST_USER.password);
    await expect(page.getByText(SEEDED_TEST_USER.email)).toBeVisible();
  });

  test('wrong password shows an inline error and does not crash', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', SEEDED_TEST_USER.email);
    await page.fill('input[type="password"]', 'DefinitelyWrongPassword123!');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('logout clears the session', async ({ page, isMobile }) => {
    await loginAs(page, SEEDED_TEST_USER.email, SEEDED_TEST_USER.password);
    await page.getByRole('button', { name: 'Log Out' }).click();
    await expect(page).toHaveURL('http://localhost:3000/');
    await page.waitForTimeout(500);

    // Header should now offer Log In again, not the account link — on
    // mobile that link only exists inside the (closed by default) hamburger menu.
    if (isMobile) {
      await page.getByRole('button', { name: 'Toggle menu' }).click();
      await page.waitForTimeout(500);
    }
    await expect(page.getByRole('link', { name: 'Log In' }).first()).toBeVisible();
  });

  test('protected pages redirect unauthenticated visitors to login', async ({ page }) => {
    const protectedRoutes = ['/account', '/wishlist', '/checkout'];
    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(route).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    }
  });
});
