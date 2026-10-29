import { test, expect, Page } from '@playwright/test';
import { Bot, readState } from './helpers/bot';

/* eslint-disable @typescript-eslint/no-explicit-any */
async function held (page: Page): Promise<{ id: string | null; texture: string; visible: boolean }>
{
  await readState(page);
  return page.evaluate(() => {
    const h = (window as any).__botGame.scene.getScene('Game').heldItem as any;
    return { id: h.heldItemId, texture: h.image.texture.key, visible: h.image.visible };
  });
}

test.describe('Held item', () => {
  test('empty hands in the village, the sword in a Stage, the axe while chopping', async ({ page }) => {
    test.setTimeout(90000);
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: /ເຂົ້າເກມ/i }).click();
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 12000 });
    await page.waitForTimeout(800);
    expect((await held(page)).visible).toBe(false);

    await page.locator('#hud-menu-btn').click();
    await page.locator('#btn-exit-main-menu').click();
    await page.getByRole('button', { name: /ເລືອກດ່ານ/i }).click();
    await page.locator('.stage-map-node').filter({ hasText: /ບົດທີ 1|Chapter 1/i }).first().click();
    await expect(page.locator('.level-badge')).toContainText(/ບົດທີ 1|Chapter 1/i, { timeout: 12000 });
    await page.waitForTimeout(800);
    expect(await held(page)).toMatchObject({ id: 'wooden-sword', texture: 'held-wooden-sword', visible: true });

    const bot = new Bot(page, false);
    expect(await bot.goTo(285, { fight: false, tolerance: 20 })).toBe('arrived');
    await page.keyboard.press('KeyE');
    await expect.poll(async () => (await held(page)).id).toBe('axe-t1');
    await expect.poll(async () => (await held(page)).id, { timeout: 3000 }).toBe('wooden-sword');
  });
});
