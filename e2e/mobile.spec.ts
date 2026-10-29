import { test, expect } from '@playwright/test';

test.describe('Mobile Viewport & Touch Controls Test', () => {
  test('Mobile Landscape (844x390) - Horizontal Platformer View', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/');

    // 1. Verify Main Menu in Landscape
    await expect(page.locator('.title-screen')).toBeVisible();
    await page.screenshot({
      path: 'C:/Users/kitti/.gemini/antigravity-ide/brain/19865946-8b19-4609-b9f5-202555dcb966/mobile_landscape_menu.png',
    });

    // Start the game
    await page.getByRole('button', { name: /ເຂົ້າເກມ/i }).click();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // 2. Verify HUD & Virtual Touch Controls
    await expect(page.locator('.virtual-touch-controls')).toBeVisible();
    await expect(page.locator('.virtual-touch-cluster-left')).toBeVisible();
    await expect(page.locator('.virtual-touch-cluster-right')).toBeVisible();

    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'C:/Users/kitti/.gemini/antigravity-ide/brain/19865946-8b19-4609-b9f5-202555dcb966/mobile_landscape_gameplay.png',
    });
  });

  test('Mobile Portrait (390x844) - Vertical Screen View', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    // 1. Verify Main Menu in Portrait
    await expect(page.locator('.title-screen')).toBeVisible();
    await page.screenshot({
      path: 'C:/Users/kitti/.gemini/antigravity-ide/brain/19865946-8b19-4609-b9f5-202555dcb966/mobile_portrait_menu.png',
    });

    await page.getByRole('button', { name: /ເຂົ້າເກມ/i }).click();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // 2. Verify HUD & Virtual Touch Controls
    await expect(page.locator('.virtual-touch-controls')).toBeVisible();
    await expect(page.locator('.virtual-touch-cluster-left')).toBeVisible();
    await expect(page.locator('.virtual-touch-cluster-right')).toBeVisible();

    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'C:/Users/kitti/.gemini/antigravity-ide/brain/19865946-8b19-4609-b9f5-202555dcb966/mobile_portrait_gameplay.png',
    });
  });
});
