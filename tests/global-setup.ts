const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:4000/api/v1';

/**
 * Fails fast with one clear message instead of letting every single test
 * time out separately when a dev server isn't running.
 */
export default async function globalSetup() {
  const checks: { name: string; url: string }[] = [
    { name: 'Frontend (npm run dev)', url: FRONTEND_URL },
    { name: 'Backend (backend: npm run start:dev)', url: `${BACKEND_URL}/products` },
  ];

  for (const check of checks) {
    try {
      const res = await fetch(check.url);
      if (!res.ok && res.status >= 500) {
        throw new Error(`responded with ${res.status}`);
      }
    } catch (err) {
      throw new Error(
        `\n\n${check.name} is not reachable at ${check.url}.\n` +
          `Start it before running the Playwright suite.\n` +
          `(${err instanceof Error ? err.message : String(err)})\n`,
      );
    }
  }
}
