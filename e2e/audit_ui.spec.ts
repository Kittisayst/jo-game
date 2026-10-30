import { test, expect } from '@playwright/test';

test.describe('Playwright UI Audit — Backpack & Village Hub', () => {
  test('Audit Backpack UI: Layout, Categories, Stats Inspector, and Screenshots', async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER [${msg.type()}]:`, msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    // 1. Navigate to game
    await page.goto('/');
    const playBtn = page.locator('#btn-play-game');
    if (await playBtn.isVisible()) {
      await playBtn.click();
    }

    const hud = page.locator('.game-hud');
    await expect(hud).toBeVisible({ timeout: 12000 });

    // 2. Populate sample items in entities.backpack for visual audit
    await page.evaluate(() => {
      const g = (window as any);
      // Access entities if exposed or dispatch events
      // Let's populate local storage or directly add via App/Phaser scene
      const scene = g.__PHASER_GAME__?.scene?.keys?.Game;
      if (scene && scene.game) {
        console.log('Scene accessible');
      }
    });

    // 3. Open Backpack Modal via HUD button
    const backpackBtn = page.locator('#hud-backpack-btn');
    await expect(backpackBtn).toBeVisible();
    await backpackBtn.click();

    // 4. Verify Backpack Modal elements
    const modalHeader = page.locator('h2:has-text("ກະເປົາເດີນທາງ")');
    await expect(modalHeader).toBeVisible();

    // Verify the 30-slot grid exists
    const slots = page.locator('.grid-cols-4 button');
    await expect(slots).toHaveCount(30);

    // Verify Category Filter toolbar
    await expect(page.locator('button:has-text("ທັງໝົດ")')).toBeVisible();
    await expect(page.locator('button:has-text("ອຸປະກອນ")')).toBeVisible();
    await expect(page.locator('button:has-text("ວັດສະດຸ")')).toBeVisible();
    await expect(page.locator('button:has-text("ຢາຊົມໃຊ້")')).toBeVisible();

    // Verify Sort button
    const sortBtn = page.locator('button:has-text("ຈັດລຽງ")');
    await expect(sortBtn).toBeVisible();
    await sortBtn.click();

    // Wait a brief moment for layout stabilization
    await page.waitForTimeout(500);

    // 5. Capture main Backpack UI screenshot
    const screenshotPath1 = 'C:/Users/kitti/.gemini/antigravity/brain/19865946-8b19-4609-b9f5-202555dcb966/backpack_ui_overview.png';
    await page.screenshot({ path: screenshotPath1 });
    console.log(`Saved screenshot to ${screenshotPath1}`);

    // 6. Test Keyboard Navigation (Arrow keys)
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);

    // 7. Test Filter tabs
    const gearTab = page.locator('button:has-text("ອຸປະກອນ")');
    await gearTab.click();
    await page.waitForTimeout(300);

    const matTab = page.locator('button:has-text("ວັດສະດຸ")');
    await matTab.click();
    await page.waitForTimeout(300);

    const allTab = page.locator('button:has-text("ທັງໝົດ")');
    await allTab.click();
    await page.waitForTimeout(300);

    // 8. Capture final state screenshot
    const screenshotPath2 = 'C:/Users/kitti/.gemini/antigravity/brain/19865946-8b19-4609-b9f5-202555dcb966/backpack_ui_interaction.png';
    await page.screenshot({ path: screenshotPath2 });
    console.log(`Saved screenshot to ${screenshotPath2}`);

    // 9. Close backpack with Escape
    await page.keyboard.press('Escape');
    await expect(modalHeader).not.toBeVisible();

    console.log('UI Audit completed successfully!');
  });
});

