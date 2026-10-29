import { test, expect, Page } from '@playwright/test';
import { Bot } from './helpers/bot';
import { enterStage } from './helpers/stage';

/* eslint-disable @typescript-eslint/no-explicit-any */

async function woodCount (page: Page): Promise<number>
{
  return page.evaluate(async () => {
    const { entities } = await import('/src/infrastructure/composition.ts');
    return entities.backpack.getItemCount('wood');
  });
}

test.describe('Harvesting takes several Strikes', () => {
  test('A tree gives its wood only on the third Strike, and a mashed E key cannot skip the cooldown', async ({ page }) => {
    test.setTimeout(90000);
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();

    // Stage 1 through the stage map, like a player would
    await enterStage(page, 1);
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 12000 });
    await page.waitForTimeout(1000);

    // Too far away (56 px from the tree at x = 560; the old reach was 65 px): striking does nothing
    const bot = new Bot(page, false);
    // The hero slides a long way after the keys come up on this slow machine, so put it exactly 56 px from the
    // tree (outside the new reach of 44, inside the old 65: the test proves the change) instead of walking there
    await bot.state(); // lets the helpers find the running game
    await page.evaluate(() => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      scene.player.setX(504);
      scene.player.setVelocityX(0);
    });
    await page.waitForTimeout(400);
    expect(Math.round(560 - (await bot.state()).x)).toBe(56);
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('KeyE');
      await page.waitForTimeout(500);
    }
    expect(await woodCount(page)).toBe(0);

    // Walk next to the tree (x = 560)
    expect(await bot.goTo(545, { fight: false, tolerance: 20 })).toBe('arrived');
    expect(await woodCount(page)).toBe(0);

    // Three presses within a moment: only the first Strike counts, so nothing drops yet
    // (sent in one tick: real key presses can be slower than the cooldown on a busy machine)
    await page.evaluate(() => {
      for (let i = 0; i < 3; i++) {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e', keyCode: 69 }));
        window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE', key: 'e', keyCode: 69 }));
      }
    });
    await page.waitForTimeout(200);
    expect(await woodCount(page)).toBe(0);

    // Second Strike after the cooldown
    await page.waitForTimeout(450);
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(200);
    expect(await woodCount(page)).toBe(0);

    // The third Strike fells the tree and drops 3 wood
    await page.waitForTimeout(450);
    await page.keyboard.press('KeyE');
    await expect.poll(() => woodCount(page)).toBe(3);

    // The tree is gone: more presses give nothing
    await page.waitForTimeout(450);
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(300);
    expect(await woodCount(page)).toBe(3);
  });
});
