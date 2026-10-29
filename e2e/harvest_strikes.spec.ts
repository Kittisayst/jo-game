import { test, expect, Page } from '@playwright/test';
import { Bot } from './helpers/bot';

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

    // Chapter 1 through the stage map, like a player would
    await page.getByRole('button', { name: /ເລືອກດ່ານ/i }).click();
    await page.locator('.stage-map-node').filter({ hasText: /ບົດທີ 1|Chapter 1/i }).first().click();
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 12000 });
    await page.waitForTimeout(1000);

    // Too far away (55 px from the tree at x = 300; the old reach was 65 px): striking does nothing
    const bot = new Bot(page, false);
    expect(await bot.goTo(245, { fight: false, tolerance: 8 })).toBe('arrived');
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('KeyE');
      await page.waitForTimeout(500);
    }
    expect(await woodCount(page)).toBe(0);

    // Walk next to the first tree (x = 300)
    expect(await bot.goTo(285, { fight: false, tolerance: 20 })).toBe('arrived');
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
