import { test, expect, Page } from '@playwright/test';
import { Bot } from './helpers/bot';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Opens Stage `n` straight from the address (`?stage=N`, development only) and waits until it is running. */
async function openStage (page: Page, n: number): Promise<Bot>
{
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  await page.goto(`/?stage=${n}`);
  await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('.level-badge')).toContainText(new RegExp(`ດ່ານ ${n}`), { timeout: 12000 });

  const bot = new Bot(page, false);
  await expect.poll(async () => (await bot.state()).scene, { timeout: 20000 }).toBe(`stage-${String(n).padStart(3, '0')}`);
  return bot;
}

async function exitXOf (page: Page): Promise<number>
{
  return page.evaluate(() => (window as any).__botGame.scene.getScene('Game').stageExitX as number);
}

async function makeHeroInvincible (page: Page): Promise<void>
{
  await page.evaluate(() => { (window as any).__botGame.scene.getScene('Game').player.isInvincible = true; });
}

test.describe('Generated stages', () => {
  for (const n of [3, 7]) {
    test(`Stage ${n} can be walked from the start to its exit`, async ({ page }) => {
      test.setTimeout(120000);
      const bot = await openStage(page, n);
      await makeHeroInvincible(page);

      const exitX = await exitXOf(page);
      expect(exitX).toBeGreaterThan(1400);

      // The Stage is cleared once the hero is past the exit marker, so walk a little beyond it
      const result = await bot.goTo(exitX + 55, { tolerance: 15, timeoutMs: 90000 });
      expect(['arrived', 'left-scene']).toContain(result);

      // Walking out clears the Stage and sends the hero home
      await expect(page.locator('.level-badge')).toContainText(/ໝູ່ບ້ານ/, { timeout: 15000 });
    });
  }

  test('Stage 9 has tougher golems than the plain data says', async ({ page }) => {
    const bot = await openStage(page, 9);
    const golems = (await bot.state()).enemies.filter(e => e.id === 'rock-golem');
    expect(golems.length).toBeGreaterThan(0);
    // rock-golem has 60 HP in enemies.json; +8 % of that per Stage after the first
    for (const golem of golems) expect(golem.hp).toBeGreaterThan(60);
  });
});
