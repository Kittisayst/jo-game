/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';
import { Bot } from './helpers/bot';

test.describe('Portal shards open the next Realm', () => {
  test('5 shards become a block at the Forge, and the block opens Realm 2 at the World Gate', async ({ page }) => {
    test.setTimeout(120000);
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    await page.goto('/');
    await page.getByRole('button', { name: /ເຂົ້າເກມ/i }).click();
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 12000 });
    const bot = new Bot(page, false);
    await expect.poll(async () => (await bot.state()).scene, { timeout: 20000 }).toBe('village');

    // A save fixture made through the live state: the Boss's shards and the Realm 1 Materials, exam passed, Forge open
    await page.evaluate(() => {
      const e = (window as any).__entities;
      e.backpack.addItem('portal-shard-green', 5);
      e.backpack.addItem('iron-ore', 8);
      e.backpack.addItem('crystal', 2);
      e.books['book-ch1'].unlock();
      e.books['book-ch1'].recordExamResult(5, 5, '2026-01-01');
      e.forgeUnlocked = true;
    });
    const count = (id: string) => page.evaluate((item: string) => (window as any).__entities.backpack.getItemCount(item) as number, id);

    // The Forge (x = 1140): the recipe is there, taught by the book
    expect(await bot.goTo(1135, { tolerance: 25, fight: false, timeoutMs: 40000 })).toBe('arrived');
    await page.keyboard.press('KeyE');
    const card = page.locator('div', { hasText: 'ກ້ອນປະຕູມິຕິສີຂຽວ' }).filter({ has: page.getByRole('button', { name: /ເລີ່ມຫຼອມ/ }) }).last();
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: /ເລີ່ມຫຼອມ/ }).click();

    // The block takes two minutes of Game time: shards and Materials are taken now, the block comes when it is collected
    expect(await count('portal-shard-green')).toBe(0);
    expect(await count('portal-block-green')).toBe(0);
    await page.evaluate(() => (window as any).__entities.crafting.tick(120000));
    await page.getByTestId('crafting-collect').click();

    expect(await count('portal-block-green')).toBe(1);
    expect(await count('portal-shard-green')).toBe(0);
    await page.keyboard.press('Escape');

    // The World Gate (x = 1420): Realm 2 is closed and says what it needs; the block is ready to place
    expect(await bot.goTo(1415, { tolerance: 25, fight: false, timeoutMs: 40000 })).toBe('arrived');
    await page.keyboard.press('KeyE');
    await expect(page.getByTestId('portal-gate')).toBeVisible();
    await expect(page.getByTestId('realm-row-2')).toHaveAttribute('data-open', 'false');
    await expect(page.getByTestId('realm-locked-2')).toContainText('ຕ້ອງໃຊ້ກ້ອນປະຕູ');
    await expect(page.getByTestId('portal-slot-1')).toHaveAttribute('data-state', 'ready');
    // Realm 3 is not next: its slot is not offered
    await expect(page.getByTestId('portal-slot-2')).toHaveAttribute('data-state', 'empty');

    // Placing it opens Realm 2 for good, and the block is used up
    await page.getByTestId('portal-slot-1').click();
    await expect(page.getByTestId('portal-slot-1')).toHaveAttribute('data-state', 'filled');
    await expect(page.getByTestId('realm-row-2')).toHaveAttribute('data-open', 'true');
    await expect(page.getByTestId('realm-locked-2')).toHaveCount(0);
    expect(await count('portal-block-green')).toBe(0);
    expect(await page.evaluate(() => (window as any).__entities.realms.openedRealms)).toEqual([1, 2]);
    // Stage 11 is not built yet, so it stays grey, but Realm 3 still needs Realm 2's block
    await expect(page.getByTestId('realm-row-3')).toHaveAttribute('data-open', 'false');
  });
});
