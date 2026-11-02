/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';

test('capture new storage chest asset in village and cottage', async ({ page }) => {
  test.setTimeout(90000);

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const playBtn = page.locator('#btn-play-game');
  if (await playBtn.isVisible()) {
    await playBtn.click();
  }
  await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
  await page.waitForTimeout(1000);

  // Position player at x = 180 (next to lamp & tree) looking at the chest at x = 240 and Cottage at x = 360
  await page.evaluate(() => {
    const scene = (window as any).__phaserGameScene;
    if (scene && scene.player) {
      scene.player.setPosition(180, 520);
      scene.cameras.main.scrollX = 0;
    }
  });

  await page.waitForTimeout(800);

  // Capture village front chest screenshot with hero beside it
  await page.screenshot({
    path: 'C:/Users/kitti/.gemini/antigravity/brain/e269caa4-7d52-4f9c-966b-6fcc06b43505/village_chest_new.png',
  });

  // Switch to cottage level to inspect indoor chest
  await page.evaluate(async () => {
    const { EventBus } = await import('/src/infrastructure/EventBus.ts');
    EventBus.emit('change-level', 'cottage');
  });

  await page.waitForTimeout(1500);

  // Move player near indoor chest (x = 240, looking towards chest at x = 320)
  await page.evaluate(() => {
    const scene = (window as any).__phaserGameScene;
    if (scene && scene.player) {
      scene.player.setPosition(240, 520);
      scene.cameras.main.scrollX = 0;
    }
  });

  await page.waitForTimeout(800);

  // Capture cottage indoor chest screenshot
  await page.screenshot({
    path: 'C:/Users/kitti/.gemini/antigravity/brain/e269caa4-7d52-4f9c-966b-6fcc06b43505/cottage_chest_new.png',
  });

  // Move player to stand right in front of the cozy fireplace at x = 740
  await page.evaluate(() => {
    const scene = (window as any).__phaserGameScene;
    if (scene && scene.player) {
      scene.player.setPosition(650, 520);
      scene.cameras.main.scrollX = 100;
    }
  });

  await page.waitForTimeout(800);

  // Capture cottage fireplace screenshot
  await page.screenshot({
    path: 'C:/Users/kitti/.gemini/antigravity/brain/e269caa4-7d52-4f9c-966b-6fcc06b43505/cottage_fireplace_fixed.png',
  });
});
