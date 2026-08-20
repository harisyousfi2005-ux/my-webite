import { test as setup } from '@playwright/test';
import { SUPER_ADMIN, SEEDED_TEST_USER, SUPER_ADMIN_STATE, SEEDED_USER_STATE } from './fixtures';

async function loginAndSave(page: import('@playwright/test').Page, email: string, password: string, statePath: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/account', { timeout: 15000 });
  await page.context().storageState({ path: statePath });
}

setup('authenticate as SUPER_ADMIN', async ({ page }) => {
  await loginAndSave(page, SUPER_ADMIN.email, SUPER_ADMIN.password, SUPER_ADMIN_STATE);
});

setup('authenticate as seeded test user', async ({ page }) => {
  await loginAndSave(page, SEEDED_TEST_USER.email, SEEDED_TEST_USER.password, SEEDED_USER_STATE);
});
