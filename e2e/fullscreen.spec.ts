import { test, expect } from '@playwright/test';

test.describe('Install and full screen', () => {
  test('Settings has a Full screen switch in a browser tab, and it enters and leaves full screen', async ({ page }) => {
    test.setTimeout(90000);
    await page.goto('/');
    await page.getByRole('button', { name: /ເຂົ້າເກມ/i }).click();
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });

    await page.keyboard.press('Escape'); // the pause menu
    await page.getByRole('button', { name: /ຕັ້ງຄ່າ|Settings/ }).first().click();
    const toggle = page.getByTestId('fullscreen-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveText('OFF');

    await toggle.click();
    await expect.poll(() => page.evaluate(() => document.fullscreenElement !== null), { timeout: 5000 }).toBe(true);
    await expect(toggle).toHaveText('ON');

    await toggle.click();
    await expect.poll(() => page.evaluate(() => document.fullscreenElement !== null), { timeout: 5000 }).toBe(false);
    await expect(toggle).toHaveText('OFF');
  });

  test('the page is ready to be installed: manifest, theme colour and iOS icon are linked, and no service worker runs in development', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#0b0720');
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', /apple-touch-icon\.png$/);
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /viewport-fit=cover/);
    // The dev server must stay free of a service worker (stale caches would hide edits)
    expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)).toBe(0);
    const icons = await Promise.all(['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png']
      .map(name => page.request.get(`/icons/${name}`).then(r => r.status())));
    expect(icons).toEqual([200, 200, 200, 200]);
  });
});
