/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, Page } from '@playwright/test';
import { Bot } from './helpers/bot';
import { openStage } from './helpers/stage';

/** Jumps from the ground, taps jump again in the air, and returns how high (px above the start) the hero got. */
async function jumpTwice (page: Page, bot: Bot): Promise<number>
{
  await page.evaluate(() => {
    const scene = (window as any).__botGame.scene.getScene('Game');
    scene.player.isInvincible = true;
    scene.player.setVelocity(0, 0);
  });
  await page.waitForTimeout(700);
  const startY = await page.evaluate(() => (window as any).__botGame.scene.getScene('Game').player.y as number);
  let minY = startY;
  const sample = async () => {
    const y = await page.evaluate(() => (window as any).__botGame.scene.getScene('Game').player.y as number);
    minY = Math.min(minY, y);
  };

  await bot.hold('Space', true);
  await page.waitForTimeout(250);
  await bot.hold('Space', false);
  // The first jump is near its top: the second press comes in the air
  await page.waitForTimeout(150);
  await bot.hold('Space', true);
  const until = Date.now() + 700;
  while (Date.now() < until) { await sample(); await page.waitForTimeout(25); }
  await bot.hold('Space', false);
  await page.waitForTimeout(900);
  return startY - minY;
}

test.describe('Double jump', () => {
  test('a second press in the air lifts the hero higher, but only once the double jump is unlocked', async ({ page }) => {
    test.setTimeout(90000);
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));
    const bot = await openStage(page, 1);

    expect(await page.evaluate(() => (window as any).__entities.movement.has('double-jump'))).toBe(false);
    const single = await jumpTwice(page, bot);

    // The Boss of Stage 30 gives it (syncMovement is what a clear calls)
    await page.evaluate(() => { (window as any).__entities.movement.unlock('double-jump'); });
    const double = await jumpTwice(page, bot);
    expect(double).toBeGreaterThan(single + 40);

    expect(pageErrors).toEqual([]);
  });
});
