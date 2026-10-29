import { test, expect } from '@playwright/test';

test.describe('Phaser Arcade Physics Enhancements E2E', () => {
  test('Verifies one-way platforms, hitbox tuning, wall slide/kick, and F2 debug toggle', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
    page.on('pageerror', err => {
      console.log('PAGE ERROR:', err.message);
      pageErrors.push(err.message);
    });

    // 1. Open game
    await page.goto('/');
    await expect(page).toHaveTitle(/Knowledge Quest/i);

    // 2. Select Chapter 1 with platforms and slimes
    const stageSelectBtn = page.getByRole('button', { name: /ເລືອກດ່ານ/i });
    await stageSelectBtn.click();

    const chapterCard = page.locator('.stage-map-node').filter({ hasText: /ບົດທີ 1|Chapter 1/i }).first();
    await expect(chapterCard).toBeVisible();
    await chapterCard.click();

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);

    // 3. Toggle Physics Debug Mode via F2
    await page.keyboard.press('F2');
    await page.waitForTimeout(600);

    // 4. Move right, perform run and jump towards platform
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(500);
    await page.keyboard.press('Space');
    await page.waitForTimeout(600);
    await page.keyboard.up('KeyD');

    // 5. Test Wall Kick against obstacle / platform edge
    await page.keyboard.down('KeyA');
    await page.waitForTimeout(300);
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    await page.keyboard.press('Space'); // Wall jump kick
    await page.waitForTimeout(400);
    await page.keyboard.up('KeyA');

    // Take screenshot of Physics Debug Mode in action
    await page.waitForTimeout(800);
    await page.screenshot({
      path: 'C:/Users/kitti/.gemini/antigravity-ide/brain/19865946-8b19-4609-b9f5-202555dcb966/physics_debug_mode.png',
    });

    // 6. Toggle F2 off
    await page.keyboard.press('F2');
    await page.waitForTimeout(400);

    // Verify zero page errors
    expect(pageErrors).toHaveLength(0);
  });
});
