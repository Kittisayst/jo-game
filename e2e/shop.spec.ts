/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, Page } from '@playwright/test';
import { Bot } from './helpers/bot';

const count = (page: Page, id: string) => page.evaluate((item: string) => (window as any).__entities.backpack.getItemCount(item) as number, id);

async function startInVillage (page: Page): Promise<Bot>
{
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  await page.goto('/');
  await page.getByRole('button', { name: /ເຂົ້າເກມ/i }).click();
  await expect(page.locator('.game-hud')).toBeVisible({ timeout: 12000 });
  const bot = new Bot(page, false);
  await expect.poll(async () => (await bot.state()).scene, { timeout: 20000 }).toBe('village');
  return bot;
}

test.describe("Grandma Chanthy's shop", () => {
  test('is opened from her dialogue, takes Materials for goods, never touches Credit, and limits the daily offers', async ({ page }) => {
    test.setTimeout(120000);
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));
    const bot = await startInVillage(page);
    await page.evaluate(() => {
      const e = (window as any).__entities;
      e.backpack.addItem('herb', 40);
      e.backpack.addItem('fiber', 20);
      e.backpack.addItem('iron-ore', 20);
    });
    const credit = await page.evaluate(() => (window as any).__entities.wallet.balance as number);

    // Chanthy stands at x = 2480; her dialogue has the shop choice
    expect(await bot.goTo(2480, { tolerance: 40, fight: false, timeoutMs: 60000 })).toBe('arrived');
    await page.keyboard.press('KeyE');
    await page.getByRole('button', { name: /ຂໍເບິ່ງຮ້ານ/ }).click();
    await expect(page.getByTestId('shop-modal')).toBeVisible({ timeout: 8000 });

    // A Seed for 3 Herb
    await page.getByTestId('shop-item-herb-seed').getByRole('button', { name: 'ແລກ' }).click();
    expect(await count(page, 'herb-seed')).toBe(1);
    expect(await count(page, 'herb')).toBe(37);

    // Nothing is sold when the Materials are short
    await page.evaluate(() => (window as any).__entities.backpack.removeItem('cactus-pulp', 99));
    await expect(page.getByTestId('shop-item-cactus-seed').getByRole('button')).toBeDisabled();

    // Today's offers: two of them, each limited to 2 a day
    await page.getByTestId('shop-tab-daily').click();
    const offers = page.locator('[data-testid^="shop-item-"]');
    await expect(offers).toHaveCount(2);
    const first = offers.first();
    await first.getByRole('button', { name: 'ແລກ' }).click();
    await first.getByRole('button', { name: 'ແລກ' }).click();
    await expect(first.getByRole('button')).toBeDisabled();
    await expect(first.getByRole('button')).toContainText('ຂາຍໝົດ');

    // Credit was never asked for or paid
    expect(await page.evaluate(() => (window as any).__entities.wallet.balance as number)).toBe(credit);

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('shop-modal')).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });
});
