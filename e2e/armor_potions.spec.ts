/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, Page } from '@playwright/test';
import { Bot } from './helpers/bot';
import { enterStage } from './helpers/stage';

async function startFirstStage (page: Page): Promise<Bot>
{
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  await page.goto('/');
  await enterStage(page, 1);
  await expect(page.locator('.game-hud')).toBeVisible({ timeout: 12000 });
  const bot = new Bot(page, false);
  await expect.poll(async () => (await bot.state()).scene, { timeout: 20000 }).toBe('stage-001');
  return bot;
}

/** Opens the Backpack (I), picks the slot that holds `itemName` and returns. */
async function selectInBackpack (page: Page, itemName: string): Promise<void>
{
  await page.keyboard.press('KeyI');
  await page.getByRole('button', { name: new RegExp(itemName) }).first().click();
}

const armorState = (page: Page) => page.evaluate(() => {
  const e = (window as any).__entities;
  return { armor: e.health.armor as number, maxArmor: e.health.maxArmor as number, hearts: e.health.current as number };
});

test.describe('Armor and Potions', () => {
  test('a worn helmet takes the first hit before a heart of Health, and wears', async ({ page }) => {
    test.setTimeout(90000);
    await startFirstStage(page);
    await page.evaluate(() => (window as any).__entities.backpack.addItem('iron-helmet', 1));

    // Wear it from the Backpack: the piece leaves its slot and gives an Armor heart
    const slotsBefore = await page.evaluate(() => (window as any).__entities.backpack.usedSlotsCount as number);
    await selectInBackpack(page, 'ໝວກເຫຼັກ');
    await page.getByTestId('equip-armor').click();
    await expect(page.getByTestId('armor-slot-head')).toHaveAttribute('data-item', 'iron-helmet');
    expect(await page.evaluate(() => (window as any).__entities.backpack.usedSlotsCount as number)).toBe(slotsBefore - 1);
    expect(await armorState(page)).toEqual({ armor: 1, maxArmor: 1, hearts: 3 });
    await page.keyboard.press('Escape');
    await expect(page.locator('.game-hud').getByTestId('armor-hearts')).toHaveAttribute('data-armor', '1');

    // A hit (a spike under the hero): the Armor heart goes, Health stays, the helmet wears by one
    const hit = () => page.evaluate(() => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      scene.player.isInvincible = false;
      scene.combat.onPlayerTouchesSpike({ x: scene.player.x + 10, y: scene.player.y });
    });
    await hit();
    expect(await armorState(page)).toEqual({ armor: 0, maxArmor: 1, hearts: 3 });
    expect(await page.evaluate(() => (window as any).__entities.equipment.getArmor('head').durability)).toBe(59);
    await expect(page.locator('.game-hud').getByTestId('armor-hearts')).toHaveCount(0);

    // The next hit costs a real heart
    await page.waitForTimeout(1500);
    await hit();
    expect(await armorState(page)).toMatchObject({ armor: 0, hearts: 2 });

    // And it comes off again, back into the Backpack
    await page.keyboard.press('KeyI');
    await page.getByTestId('unequip-head').click();
    await expect(page.getByTestId('armor-slot-head')).toHaveAttribute('data-item', '');
    expect(await page.evaluate(() => (window as any).__entities.backpack.getItemCount('iron-helmet'))).toBe(1);
  });

  test('a speed potion in the Quick slot is drunk with R and makes the hero faster for a while', async ({ page }) => {
    test.setTimeout(90000);
    await startFirstStage(page);
    await page.evaluate(() => (window as any).__entities.backpack.addItem('speed-potion', 2));
    const speed = () => page.evaluate(() => (window as any).__botGame.scene.getScene('Game').player.speedMultiplier as number);
    expect(await speed()).toBe(1);

    await selectInBackpack(page, 'ຢາເພີ່ມຄວາມໄວ');
    await page.getByTestId('set-quick-slot').click();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('quick-slot')).toContainText('x2');

    await page.keyboard.press('KeyR');
    await expect(page.getByTestId('effect-speed')).toBeVisible();
    await expect.poll(speed).toBeCloseTo(1.3, 2);
    await expect(page.getByTestId('quick-slot')).toContainText('x1');

    // The time runs down on the HUD
    const seconds = Number((await page.getByTestId('effect-speed').innerText()).replace(/\D/g, ''));
    expect(seconds).toBeGreaterThan(50);
    expect(seconds).toBeLessThanOrEqual(60);
  });
});
