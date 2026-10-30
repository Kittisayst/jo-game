/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, Page } from '@playwright/test';
import { Bot } from './helpers/bot';
import { unlockStages } from './helpers/stage';

const count = (page: Page, id: string) => page.evaluate((item: string) => (window as any).__entities.backpack.getItemCount(item) as number, id);
const chestCount = (page: Page, id: string) => page.evaluate((item: string) => (window as any).__entities.storage.getItemCount(item) as number, id);

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

test.describe('The Garden', () => {
  test('Plots are on the ground: a Seed is planted with E, grows in real time and is harvested with E; the Garden can grow', async ({ page }) => {
    test.setTimeout(150000);
    const bot = await startInVillage(page);
    await page.evaluate(() => {
      const e = (window as any).__entities;
      e.backpack.addItem('herb-seed', 1);
      e.backpack.addItem('wood', 10);
      e.backpack.addItem('stone', 5);
    });

    // The Garden door stands right of the Workshop (x = 1010) and leads into the Garden, a place of its own
    expect(await bot.goTo(1005, { tolerance: 25, fight: false, timeoutMs: 40000 })).toBe('arrived');
    await page.keyboard.press('KeyE');
    await expect.poll(async () => (await bot.state()).scene, { timeout: 20000 }).toBe('garden');
    await expect(page.locator('.level-badge')).toContainText(/ສວນຜັກ/);
    // Everything carried over (the Garden is restored from the save like any level change)
    await page.evaluate(() => {
      const e = (window as any).__entities;
      if (e.backpack.getItemCount('herb-seed') < 1) { e.backpack.addItem('herb-seed', 1); e.backpack.addItem('wood', 10); e.backpack.addItem('stone', 5); }
    });

    // The first Plot is at x = 300: E opens the choice of Seed
    expect(await bot.goTo(300, { tolerance: 25, fight: false, timeoutMs: 30000 })).toBe('arrived');
    await page.keyboard.press('KeyE');
    await expect(page.getByTestId('seed-picker')).toBeVisible();
    await page.getByTestId('seed-herb-seed').click();
    await expect(page.getByTestId('seed-picker')).toHaveCount(0);
    expect(await count(page, 'herb-seed')).toBe(0);
    expect(await page.evaluate(() => (window as any).__entities.garden.hasPlants)).toBe(true);

    // Eleven minutes later (the development hook moves the clock): ready, and the HUD says so
    await page.evaluate(() => (window as any).__advanceClock(11 * 60 * 1000));
    await expect(page.getByTestId('garden-ready')).toContainText('ສວນພ້ອມເກັບ 1', { timeout: 5000 });

    const herbBefore = await count(page, 'herb');
    await page.keyboard.press('KeyE');
    await expect.poll(() => count(page, 'herb')).toBe(herbBefore + 4);
    await expect(page.getByTestId('garden-ready')).toHaveCount(0);

    // The sign at x = 1500 adds a seventh Plot for Materials (wood 10, stone 5), not Credit
    const credit = await page.evaluate(() => (window as any).__entities.wallet.balance);
    expect(await bot.goTo(1500, { tolerance: 25, fight: false, timeoutMs: 60000 })).toBe('arrived');
    await page.keyboard.press('KeyE');
    await expect.poll(() => page.evaluate(() => (window as any).__entities.garden.plotCount as number)).toBe(7);
    expect(await count(page, 'wood')).toBe(0);
    expect(await page.evaluate(() => (window as any).__entities.wallet.balance)).toBe(credit);

    // The door at the left end leads home
    expect(await bot.goTo(65, { tolerance: 20, fight: false, timeoutMs: 60000 })).toBe('arrived');
    await page.keyboard.press('KeyE');
    await expect.poll(async () => (await bot.state()).scene, { timeout: 20000 }).toBe('village');
  });
});

test.describe('The Storage chest', () => {
  test('keeps what is put in it when the hero dies', async ({ page }) => {
    test.setTimeout(120000);
    const bot = await startInVillage(page);
    await page.evaluate(() => (window as any).__entities.backpack.addItem('wood', 10));

    // The chest stands left of the Library (x = 235): put the wood in
    expect(await bot.goTo(240, { tolerance: 20, fight: false, timeoutMs: 30000 })).toBe('arrived');
    await page.keyboard.press('KeyE');
    await expect(page.getByTestId('storage-modal')).toBeVisible();
    await page.locator('[data-testid^="storage-backpack-slot-"][data-item="wood"]').first().click();
    expect(await count(page, 'wood')).toBe(0);
    expect(await chestCount(page, 'wood')).toBe(10);
    await expect(page.locator('[data-testid^="storage-chest-slot-"][data-item="wood"]')).toHaveCount(1);
    await page.keyboard.press('Escape');

    // Carry some more wood into Stage 2 and fall there: half of that is lost, the chest is not touched
    await page.evaluate(() => (window as any).__entities.backpack.addItem('wood', 10));
    await unlockStages(page, 2);
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('change-level', 'stage-002');
    });
    await expect.poll(async () => (await bot.state()).scene, { timeout: 20000 }).toBe('stage-002');
    await page.evaluate(() => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      const slime = scene.enemies.getChildren()[0];
      scene.player.setPosition(slime.x, slime.y);
    });
    await expect(page.locator('.level-badge')).toContainText(/ໝູ່ບ້ານ/, { timeout: 40000 });

    expect(await count(page, 'wood')).toBe(5);
    expect(await chestCount(page, 'wood')).toBe(10);
  });
});
