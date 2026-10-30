/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, Page } from '@playwright/test';
import { Bot } from './helpers/bot';
import { enterStage } from './helpers/stage';

const sword = (page: Page) => page.evaluate(() => (window as any).__entities.backpack.getDurability('iron-sword'));
const hudBarState = (page: Page) => page.locator('.game-hud').getByTestId('durability-bar').getAttribute('data-state');

test.describe('Weapons wear out and are repaired at the Forge', () => {
  test('a sword breaks, hits for half, stays in the Backpack and is repaired for Materials', async ({ page }) => {
    test.setTimeout(120000);
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    await page.goto('/');
    await enterStage(page, 1);
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 12000 });
    const bot = new Bot(page, false);
    await expect.poll(async () => (await bot.state()).scene, { timeout: 20000 }).toBe('stage-001');

    // An iron sword with one use left, and what its repair costs (a "save fixture" made through the live state)
    await page.evaluate(() => {
      const e = (window as any).__entities;
      e.backpack.addItem('iron-sword', 1);
      e.backpack.wearItem('iron-sword', 79);
      e.backpack.addItem('iron-ore', 3);
      e.backpack.addItem('wood', 1);
      e.forgeUnlocked = true;
    });
    expect(await sword(page)).toMatchObject({ current: 1, max: 80, state: 'low' });
    // Q swaps to it the way a player would, which also puts it on the HUD
    await page.keyboard.press('KeyQ');
    await expect.poll(() => page.evaluate(() => (window as any).__entities.equipment.equippedWeaponId)).toBe('iron-sword');
    await expect.poll(() => hudBarState(page)).toBe('low');

    // A slime that stands still and does not die, so the damage of each swing can be read from its HP
    const slimeHp = () => page.evaluate(() => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      return scene.enemies.getChildren()[0].entity._currentHp as number;
    });
    await page.evaluate(() => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      const slime = scene.enemies.getChildren()[0];
      slime.entity._currentHp = 1000;
      slime.entity._maxHp = 1000;
      slime.speed = 0;
      slime.body.setVelocity(0, 0);
      scene.player.isInvincible = true;
    });
    const swing = async () => {
      await page.evaluate(() => {
        const scene = (window as any).__botGame.scene.getScene('Game');
        const slime = scene.enemies.getChildren()[0];
        slime.body.setVelocity(0, 0);
        scene.player.setPosition(slime.x - 30, slime.y);
        scene.player.setVelocity(0, 0);
      });
      await page.waitForTimeout(150);
      await page.keyboard.press('KeyJ');
      await page.waitForTimeout(500);
    };

    // The last use before it breaks still does full damage...
    const hp0 = await slimeHp();
    await swing();
    const hp1 = await slimeHp();
    expect(hp0 - hp1).toBe(22);
    expect(await sword(page)).toMatchObject({ current: 0, state: 'broken' });
    await expect.poll(() => hudBarState(page)).toBe('broken');

    // ...the next one does half, and the sword is still there
    await swing();
    const hp2 = await slimeHp();
    expect(hp1 - hp2).toBe(11);
    expect(await page.evaluate(() => (window as any).__entities.backpack.getItemCount('iron-sword'))).toBe(1);

    // The Backpack says it is broken
    await page.keyboard.press('KeyI');
    await expect(page.getByTestId('broken-badge')).toBeVisible();
    await page.keyboard.press('Escape');

    // Home to the Forge (x = 1140): the Repair tab costs Materials, not Credit
    const credit = await page.evaluate(() => (window as any).__entities.wallet.balance);
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('change-level', 'village');
    });
    await expect.poll(async () => (await bot.state()).scene, { timeout: 20000 }).toBe('village');
    expect(await bot.goTo(1135, { tolerance: 25, fight: false, timeoutMs: 40000 })).toBe('arrived');
    await page.keyboard.press('KeyE');

    await page.getByTestId('forge-repair-tab').click();
    // The starting axe is listed too, but it is not worn so there is nothing to repair
    await expect(page.getByTestId('forge-repair-row')).toHaveCount(2);
    const axeRow = page.getByTestId('forge-repair-row').filter({ hasText: 'ຂວານ' });
    await expect(axeRow.getByTestId('forge-repair-button')).toBeDisabled();
    await page.getByTestId('forge-repair-row').filter({ hasText: 'ດາບເຫຼັກກ້າ' }).getByTestId('forge-repair-button').click();

    expect(await sword(page)).toMatchObject({ current: 80, state: 'ok' });
    expect(await page.evaluate(() => (window as any).__entities.backpack.getItemCount('iron-ore'))).toBe(0);
    expect(await page.evaluate(() => (window as any).__entities.wallet.balance)).toBe(credit);
    await expect.poll(() => hudBarState(page)).toBe('ok');
  });
});
