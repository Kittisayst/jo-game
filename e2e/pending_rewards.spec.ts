/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';
import { Bot } from './helpers/bot';

test.describe('A Boss that drops into a full Backpack', () => {
  test('keeps the Portal shards for later and hands them over when there is room', async ({ page }) => {
    test.setTimeout(90000);
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    await page.goto('/?stage=10');
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    const bot = new Bot(page, false);
    await expect.poll(async () => (await bot.state()).scene, { timeout: 20000 }).toBe('stage-010');

    const count = (id: string) => page.evaluate((item: string) => (window as any).__entities.backpack.getItemCount(item) as number, id);

    // Every Backpack slot taken by something that does not stack
    await page.evaluate(() => {
      const e = (window as any).__entities;
      for (let i = 0; i < e.backpack.maxSlots; i++) e.backpack.addItem('iron-sword', 1);
    });
    expect(await page.evaluate(() => (window as any).__entities.backpack.isFull)).toBe(true);

    // The finisher question is answered right: the Boss falls and drops its reward
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('quiz-finisher-passed');
    });

    // Nothing fit, but the shards are not lost: they wait, and the HUD says so
    await expect(page.getByTestId('pending-rewards')).toContainText('ລໍຮັບ');
    expect(await count('portal-shard-green')).toBe(0);
    expect(await page.evaluate(() => (window as any).__entities.pendingRewards.entries)).toEqual(
      expect.arrayContaining([{ itemId: 'portal-shard-green', count: 3 }, { itemId: 'boss-core', count: 1 }, { itemId: 'crystal', count: 3 }]),
    );

    // The Stage is cleared and the hero is home; make room, and opening the Backpack hands the Materials over
    await expect(page.locator('.level-badge')).toContainText(/ໝູ່ບ້ານ/, { timeout: 20000 });
    await page.evaluate(() => (window as any).__entities.backpack.removeItem('iron-sword', 5));
    await page.keyboard.press('KeyI');
    await expect.poll(() => count('portal-shard-green')).toBe(3);
    expect(await count('boss-core')).toBe(1);
    expect(await count('crystal')).toBe(3);
    expect(await page.evaluate(() => (window as any).__entities.pendingRewards.isEmpty)).toBe(true);
    await expect(page.getByTestId('pending-rewards')).toHaveCount(0);
  });
});
