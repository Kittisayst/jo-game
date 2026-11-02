/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';

test('debug black screen in cottage', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[CONSOLE_ERROR] ${msg.text()}`);
    } else {
      console.log(`[${msg.type()}] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    errors.push(`[PAGE_ERROR] ${err.stack || err.message}`);
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const playBtn = page.locator('#btn-play-game');
  if (await playBtn.isVisible()) {
    await playBtn.click();
  }
  await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
  await page.waitForTimeout(1000);

  // Switch to cottage level like player does (EventBus change-level cottage)
  await page.evaluate(async () => {
    const { EventBus } = await import('/src/infrastructure/EventBus.ts');
    EventBus.emit('change-level', 'cottage');
  });

  await page.waitForTimeout(2000);

  // Check scene state
  const state = await page.evaluate(() => {
    const scene = (window as any).__phaserGameScene;
    if (!scene) return { error: 'No __phaserGameScene' };
    return {
      currentLevelKey: scene.currentLevelKey,
      playerExists: !!scene.player,
      playerX: scene.player?.x,
      playerY: scene.player?.y,
      cameraScrollX: scene.cameras?.main?.scrollX,
      cameraScrollY: scene.cameras?.main?.scrollY,
      cameraAlpha: scene.cameras?.main?.alpha,
      isSleeping: scene.isSleeping,
      worldTimeDarkness: (window as any).__DEV__?.__entities?.worldTime?.darkness,
      dayNightExists: !!scene.dayNight,
    };
  });

  console.log('COTTAGE STATE:', JSON.stringify(state, null, 2));
  console.log('COLLECTED ERRORS:', JSON.stringify(errors, null, 2));

  await page.screenshot({
    path: 'C:/Users/kitti/.gemini/antigravity/brain/e269caa4-7d52-4f9c-966b-6fcc06b43505/debug_cottage_screen.png',
  });
});

