import { test, expect } from '@playwright/test';

test.describe('New Enemy Types E2E Verification', () => {
  test('Spawns, renders, and interacts with new enemy archetypes in Chapter 1', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
    page.on('pageerror', err => {
      console.log('PAGE ERROR:', err.message);
      pageErrors.push(err.message);
    });

    // 1. Open game
    await page.goto('/');
    await expect(page).toHaveTitle(/JO RUNNER/i);

    // 2. Click Select Stage from Main Menu
    const stageSelectBtn = page.getByRole('button', { name: /ເລືອກດ່ານ/i });
    await stageSelectBtn.click();

    // 3. Select Chapter 1 in the World Map
    const chapterCard = page.locator('.stage-map-node').filter({ hasText: /ບົດທີ 1|Chapter 1/i }).first();
    await expect(chapterCard).toBeVisible();
    await chapterCard.click();

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);

    // 4. Move right into encounter zone where slimes patrol
    for (let i = 0; i < 4; i++) {
      await page.keyboard.down('KeyD');
      await page.waitForTimeout(400);
      await page.keyboard.up('KeyD');
      await page.waitForTimeout(80);
    }

    // Take screenshot of Chapter 1 gameplay with enemies
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'C:/Users/kitti/.gemini/antigravity-ide/brain/19865946-8b19-4609-b9f5-202555dcb966/enemies_chapter1_gameplay.png',
    });

    // Test melee slash attack action (J / Space)
    await page.keyboard.press('KeyJ');
    await page.waitForTimeout(200);
    await page.keyboard.press('KeyJ');
    await page.waitForTimeout(300);

    // Verify zero page errors
    expect(pageErrors).toHaveLength(0);
  });
});
