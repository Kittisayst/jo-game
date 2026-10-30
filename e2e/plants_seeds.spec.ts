/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, Page } from '@playwright/test';
import { Bot } from './helpers/bot';
import { enterStage } from './helpers/stage';

const count = (page: Page, id: string) => page.evaluate((item: string) => (window as any).__entities.backpack.getItemCount(item) as number, id);
const prompt = (page: Page) => page.evaluate(() => (window as any).__botGame.scene.getScene('Game').interaction.promptText.text as string);

async function openStageOne (page: Page): Promise<Bot>
{
  await enterStage(page, 1);
  await expect(page.locator('.game-hud')).toBeVisible({ timeout: 12000 });
  const bot = new Bot(page, false);
  await expect.poll(async () => (await bot.state()).scene, { timeout: 20000 }).toBe('stage-001');
  return bot;
}

test.describe('Plants give Seeds and grow back in real time', () => {
  test('a harvested herb is a Sapling, stays one after a restart, and can be harvested again once grown', async ({ page }) => {
    test.setTimeout(120000);
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    await page.goto('/');
    const bot = await openStageOne(page);

    // The herb at x = 420 (Stage 1 makes sure it drops a Seed): harvest it
    expect(await bot.goTo(412, { tolerance: 12, fight: false })).toBe('arrived');
    await page.keyboard.press('KeyE');
    await expect.poll(() => count(page, 'herb')).toBe(2);
    expect(await count(page, 'herb-seed')).toBe(1);

    // It is a Sapling now: the prompt says how long, and more presses give nothing
    await expect.poll(() => prompt(page)).toContain('ຕົ້ນອ່ອນ');
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('KeyE');
      await page.waitForTimeout(450);
    }
    expect(await count(page, 'herb')).toBe(2);
    expect(Object.keys(await page.evaluate(() => (window as any).__entities.plantRegrowth.toSnapshot()))).toContain('stage-001:wild-herb-420');

    // Close the game and open it again: the Sapling is still there (the time is kept in the save)
    await page.waitForTimeout(3500);
    await page.reload();
    // The game resumes where it was left: in Stage 1
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    const again = new Bot(page, false);
    await expect.poll(async () => (await again.state()).scene, { timeout: 20000 }).toBe('stage-001');
    expect(await count(page, 'herb')).toBe(2);
    await page.evaluate(() => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      scene.player.setPosition(412, scene.player.y);
    });
    await expect.poll(() => prompt(page)).toContain('ຕົ້ນອ່ອນ');

    // Nine minutes later (a development hook moves the clock) it is grown again and can be harvested
    await page.evaluate(() => (window as any).__advanceClock(9 * 60 * 1000));
    await expect.poll(() => prompt(page), { timeout: 5000 }).not.toContain('ຕົ້ນອ່ອນ');
    await page.keyboard.press('KeyE');
    await expect.poll(() => count(page, 'herb')).toBe(4);
    expect(Object.keys(await page.evaluate(() => (window as any).__entities.plantRegrowth.toSnapshot()))).toContain('stage-001:wild-herb-420');
  });
});
