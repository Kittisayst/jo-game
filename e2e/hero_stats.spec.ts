/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';
import { openStage } from './helpers/stage';

test.describe('Character window and Stat points', () => {
  test('C opens the window, a point goes into Hearts, Attack and the reset work, and the HUD follows', async ({ page }) => {
    test.setTimeout(60000);
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));
    await openStage(page, 2);
    await page.evaluate(() => { (window as any).__entities.heroLevel.loadFrom({ level: 12, xp: 0, unspentPoints: 11 }); });

    await page.keyboard.press('KeyC');
    const modal = page.getByTestId('character-modal');
    await expect(modal).toBeVisible();
    await expect(page.getByTestId('character-level')).toContainText('Level 12');
    // The XP bar and the + buttons have a size you can see and touch (style.css has no Tailwind: a class it lacks does nothing)
    expect((await page.getByTestId('character-xp-bar').boundingBox())!.height).toBeGreaterThanOrEqual(6);
    expect((await page.getByTestId('stat-hearts-add').boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(page.getByTestId('character-points')).toContainText('11');

    // 10 points in Hearts is one more heart, full at once
    const hearts = page.getByTestId('stat-hearts-add');
    for (let i = 0; i < 10; i++) await hearts.click();
    await expect(page.getByTestId('stat-hearts')).toHaveAttribute('data-points', '10');
    expect(await page.evaluate(() => (window as any).__entities.health.max as number)).toBe(4);
    expect(await page.evaluate(() => (window as any).__entities.health.current as number)).toBe(4);
    // ... and the HUD shows four hearts
    await expect(page.getByTestId('health-hearts')).toHaveAttribute('data-max', '4');
    await expect(page.getByTestId('health-hearts')).toHaveAttribute('data-current', '4');

    // The last point goes into Attack and raises the sword's damage by 1 %
    await page.getByTestId('stat-attack-add').click();
    await expect(page.getByTestId('character-points')).toContainText('0');
    await expect(page.getByTestId('stat-attack-add')).toBeDisabled();
    const attack = await page.evaluate(() => {
      const e = (window as any).__entities;
      return e.heroStats.pointsIn('attack') as number;
    });
    expect(attack).toBe(1);

    // Starting over needs the Material (3 moon dust) and never Credit
    const creditBefore = await page.evaluate(() => (window as any).__entities.wallet.balance as number);
    await page.getByTestId('stat-reset').click();
    await expect(page.getByTestId('character-notice')).toContainText('ວັດຖຸດິບບໍ່ພໍ');
    expect(await page.evaluate(() => (window as any).__entities.heroStats.totalSpent as number)).toBe(11);

    await page.evaluate(() => { (window as any).__entities.backpack.addItem('moon-dust', 3); });
    await page.getByTestId('stat-reset').click();
    await expect(page.getByTestId('character-points')).toContainText('11');
    expect(await page.evaluate(() => (window as any).__entities.health.max as number)).toBe(3);
    await expect(page.getByTestId('health-hearts')).toHaveAttribute('data-max', '3');
    expect(await page.evaluate(() => (window as any).__entities.backpack.getItemCount('moon-dust') as number)).toBe(0);
    expect(await page.evaluate(() => (window as any).__entities.wallet.balance as number)).toBe(creditBefore);

    // Esc closes it
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
    expect(pageErrors).toEqual([]);
  });

  test('Agility makes the hero faster, and the points are saved', async ({ page }) => {
    test.setTimeout(60000);
    await openStage(page, 2);

    await page.evaluate(() => {
      const e = (window as any).__entities;
      e.heroLevel.loadFrom({ level: 40, xp: 0, unspentPoints: 0 });
      e.heroStats.loadFrom({ attack: 0, hearts: 0, guard: 30, agility: 39 });
    });
    // The scene sets the speed factor every frame from the Stat (39 points of 0.25 % = +9.75 %)
    await expect.poll(() => page.evaluate(() => (window as any).__botGame.scene.getScene('Game').player.speedMultiplier as number)).toBeCloseTo(1.0975, 3);

    const snapshot = await page.evaluate(() => (window as any).__entities.toSnapshot('manual-1') as { heroStats: unknown });
    expect(snapshot.heroStats).toEqual({ attack: 0, hearts: 0, guard: 30, agility: 39 });
  });
});
