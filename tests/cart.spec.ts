import { test, expect, uniqueTestEmail } from './fixtures';

test.describe('Cart functionality', () => {
  test('add to cart, update quantity, and remove — full cycle ends empty', async ({ page }) => {
    // Isolated throwaway account (pw_test_-prefixed, swept up by
    // global-teardown) so this never touches a real customer's cart.
    const email = uniqueTestEmail();
    await page.goto('/register');
    await page.fill('input[placeholder="First name"]', 'Cart');
    await page.fill('input[placeholder="Last name"]', 'Tester');
    await page.fill('input[placeholder="Email address"]', email);
    await page.fill('input[placeholder="Password (min. 8 characters)"]', 'TestPass123!');
    await page.fill('input[placeholder="Confirm password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/account', { timeout: 10000 });

    await page.goto('/#collection');
    await page.waitForTimeout(1000);
    await page.locator('a[href^="/products/"]').first().click();
    await page.waitForLoadState('networkidle');

    // Real sizes come from the product itself, whatever they actually say —
    // scoped structurally (the SizeSelector's buttons live in the div right
    // after the "Size" label, per AddToCartButton.tsx) rather than matching
    // against an assumed size-token shape, which breaks on real catalog
    // entries with unusual size values.
    await page.waitForSelector('text=Size');
    const sizeButtons = page
      .locator('span', { hasText: /^Size/ })
      .locator('xpath=following-sibling::div[1]')
      .locator('button');
    await sizeButtons.first().click();
    await page.getByRole('button', { name: /Add to Cart/ }).click();
    await expect(page.getByRole('button', { name: /Added/ })).toBeVisible({ timeout: 5000 });

    // addToCart() auto-opens the drawer.
    await page.waitForTimeout(700);
    await expect(page.getByRole('heading', { name: 'Cart' })).toBeVisible();

    // The product page's own AddToCartButton has identically-labelled
    // Decrease/Increase quantity buttons, still present behind the drawer
    // overlay — CartDrawer renders after {children} in layout.tsx, so its
    // controls are the *last* matches in the DOM.
    const decreaseBtn = page.getByRole('button', { name: 'Decrease quantity' }).last();
    const quantityDisplay = decreaseBtn.locator('xpath=following-sibling::span[1]');
    await expect(quantityDisplay).toHaveText('1');

    await page.getByRole('button', { name: 'Increase quantity' }).last().click();
    await expect(quantityDisplay).toHaveText('2');
    await decreaseBtn.click();
    await expect(quantityDisplay).toHaveText('1');

    await expect(page.getByRole('link', { name: /Proceed to Checkout/ })).toBeVisible();

    await page.getByText('[ Remove ]').click();
    await expect(page.getByText('Your cart is empty.')).toBeVisible({ timeout: 5000 });
  });

  test('checkout page loads for an authenticated user (no redirect)', async ({ page }) => {
    const email = uniqueTestEmail();
    await page.goto('/register');
    await page.fill('input[placeholder="First name"]', 'Checkout');
    await page.fill('input[placeholder="Last name"]', 'Tester');
    await page.fill('input[placeholder="Email address"]', email);
    await page.fill('input[placeholder="Password (min. 8 characters)"]', 'TestPass123!');
    await page.fill('input[placeholder="Confirm password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/account', { timeout: 10000 });

    await page.goto('/checkout');
    await expect(page).toHaveURL('http://localhost:3000/checkout');
  });
});
