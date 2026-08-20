import { test, expect } from './fixtures';

test.describe('Public website', () => {
  test('homepage loads successfully', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('header')).toBeVisible();
    // Preloader/entrance animation settles before content is meaningfully checkable.
    await page.waitForTimeout(1500);
  });

  test('logo returns to homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    await page.getByRole('link', { name: 'Meridian' }).first().click();
    await expect(page).toHaveURL('http://localhost:3000/');
  });

  test('main navigation: Philosophy and Contact links scroll to their sections', async ({ page, isMobile }) => {
    // The desktop <nav> is `hidden sm:flex` — mobile has its own dedicated
    // hamburger-menu test below.
    test.skip(isMobile, 'desktop-nav-only check');
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Scoped to <header> — the same links are repeated in the footer.
    const headerNav = page.locator('header');
    await headerNav.getByRole('link', { name: 'Philosophy', exact: true }).click();
    await expect(page).toHaveURL(/#philosophy$/);
    await expect(page.locator('#philosophy')).toBeVisible();

    await headerNav.getByRole('link', { name: 'Contact', exact: true }).click();
    await expect(page).toHaveURL(/#newsletter$/);
    await expect(page.locator('#newsletter')).toBeVisible();
  });

  test('Collection dropdown opens and its links reach the collection section', async ({ page, isMobile }) => {
    // The Collection dropdown only exists in the desktop nav (hidden sm:flex).
    test.skip(isMobile, 'desktop-nav-only check');
    await page.goto('/');
    await page.waitForTimeout(1500);

    const trigger = page.getByRole('button', { name: 'Collection' });
    await trigger.click();
    await expect(page.getByRole('link', { name: 'All' })).toBeVisible();

    await page.getByRole('link', { name: 'All' }).click();
    await expect(page.locator('#collection')).toBeVisible();
  });

  test('collection grid renders real product cards', async ({ page }) => {
    await page.goto('/#collection');
    await page.waitForTimeout(1000);
    const cards = page.locator('article').filter({ has: page.locator('a[href^="/products/"]') });
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('product card links to a working product detail page', async ({ page }) => {
    await page.goto('/#collection');
    await page.waitForTimeout(1000);

    const firstProductLink = page.locator('a[href^="/products/"]').first();
    const href = await firstProductLink.getAttribute('href');
    expect(href).toMatch(/^\/products\/[a-z0-9-]+$/);

    await firstProductLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

    // Real product content, not an error boundary.
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByText('Size', { exact: false }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Add to Cart/ })).toBeVisible();

    await page.getByRole('link', { name: /Back to collection/ }).click();
    await expect(page).toHaveURL(/\/#collection$/);
  });

  test('important internal routes do not lead to broken pages', async ({ page }) => {
    // Real routes found in the app (src/app/**), not guessed. Auth-gated
    // ones are expected to redirect to /login — that's a working page, not
    // a broken one.
    const routes = ['/login', '/register', '/account', '/wishlist', '/checkout', '/admin'];

    for (const route of routes) {
      try {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
      } catch (err) {
        // requireServerUser()'s redirect() can resolve after the 200 shell
        // has already started streaming (Next.js App Router dev mode), so
        // it lands as a client-side navigation instead of a clean HTTP 3xx
        // — Playwright can report the superseded initial navigation as
        // net::ERR_ABORTED. Benign here; the checks below confirm where
        // the page actually settled, not the redirect mechanics.
        if (!String(err).includes('ERR_ABORTED')) throw err;
      }
      await page.waitForLoadState('networkidle');
      const bodyText = await page.locator('body').innerText();
      expect(bodyText, `${route} rendered an error page`).not.toMatch(/application error|this page could not be found/i);
    }
  });

  test('desktop viewport: header nav is visible', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop-only check');
    await page.goto('/');
    await page.waitForTimeout(1500);
    await expect(page.getByRole('button', { name: 'Collection' })).toBeVisible();
  });

  test('mobile viewport: hamburger menu opens and links work', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only check');
    await page.goto('/');
    await page.waitForTimeout(1500);

    const toggle = page.getByRole('button', { name: 'Toggle menu' });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await page.waitForTimeout(700);

    // Scoped to <nav> — the footer has its own "Philosophy" link too, and
    // the open mobile menu's <motion.nav> carries an implicit navigation role.
    const mobileNav = page.getByRole('navigation');
    await expect(mobileNav.getByRole('link', { name: 'Philosophy' })).toBeVisible();
    await mobileNav.getByRole('link', { name: 'Philosophy' }).click();
    await expect(page.locator('#philosophy')).toBeVisible();
  });
});
