import { SUPER_ADMIN, TEST_DATA_PREFIX } from './fixtures';

const BACKEND_URL = 'http://localhost:4000/api/v1';

/**
 * Sweeps up every account this suite created (all emails are prefixed with
 * TEST_DATA_PREFIX, see fixtures.ts) after the full run finishes, pass or
 * fail. The backend only exposes deactivate (no hard delete) for user
 * accounts, so "clean up" here means deactivating — the account row stays,
 * clearly marked, but can no longer log in or place orders.
 */
export default async function globalTeardown() {
  try {
    const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(SUPER_ADMIN),
    });
    if (!loginRes.ok) {
      console.warn('[global-teardown] Could not log in as SUPER_ADMIN, skipping test-data cleanup.');
      return;
    }
    const loginJson = await loginRes.json();
    const token = loginJson.data.accessToken;
    const headers = { Authorization: `Bearer ${token}` };

    const usersRes = await fetch(`${BACKEND_URL}/users?limit=100`, { headers });
    if (!usersRes.ok) return;
    const usersJson = await usersRes.json();
    const testUsers = (usersJson.data.items as { id: string; email: string; isActive?: boolean }[]).filter(
      (u) => u.email.startsWith(TEST_DATA_PREFIX) && u.isActive !== false,
    );

    for (const user of testUsers) {
      await fetch(`${BACKEND_URL}/users/${user.id}/deactivate`, { method: 'PATCH', headers });
    }

    if (testUsers.length > 0) {
      console.log(`[global-teardown] Deactivated ${testUsers.length} Playwright test account(s).`);
    }
  } catch (err) {
    console.warn('[global-teardown] Cleanup skipped:', err instanceof Error ? err.message : err);
  }
}
