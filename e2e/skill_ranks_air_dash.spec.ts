/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, Page } from '@playwright/test';
import { openStage } from './helpers/stage';

const hero = (page: Page) => page.evaluate(() => {
  const scene = (window as any).__botGame.scene.getScene('Game');
  return { x: scene.player.x as number, y: scene.player.y as number, onGround: scene.player.body.blocked.down as boolean };
});

/** Puts the hero high above open ground, facing right, and waits until the fall has really started. */
async function launch (page: Page, x: number): Promise<void>
{
  await page.evaluate((x: number) => {
    const scene = (window as any).__botGame.scene.getScene('Game');
    scene.player.isInvincible = true;
    scene.player.setPosition(x, scene.player.y - 280);
    scene.player.setVelocity(0, 0);
    scene.player.facingDir = 1;
  }, x);
  await page.waitForTimeout(120);
}

test.describe('Skill ranks and the air dash', () => {
  test('the Academy raises Power Wave to rank 2 for Credit and Materials, and the cooldown gets shorter', async ({ page }) => {
    test.setTimeout(90000);
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));
    await openStage(page, 1);
    await page.evaluate(() => {
      const e = (window as any).__entities;
      e.skills.unlock('power-wave');
      e.wallet.setBalance(100);
      e.backpack.addItem('iron-ore', 10);
      e.backpack.addItem('wood', 12);
    });

    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('open-academy');
    });
    await page.getByTestId('academy-tab-skills').click();
    await expect(page.getByTestId('skill-power-wave')).toHaveAttribute('data-rank', '1');
    await page.getByTestId('upgrade-skill-power-wave').click();
    await expect(page.getByTestId('skill-power-wave')).toHaveAttribute('data-rank', '2');

    // Credit (30) and Materials (iron ore 8, wood 10) were spent
    expect(await page.evaluate(() => (window as any).__entities.wallet.balance)).toBe(70);
    expect(await page.evaluate(() => (window as any).__entities.backpack.getItemCount('iron-ore'))).toBe(2);
    expect(await page.evaluate(() => (window as any).__entities.backpack.getItemCount('wood'))).toBe(2);

    // Rank 3 costs more than this hero has: the button says so and nothing is taken
    await expect(page.getByTestId('upgrade-skill-power-wave')).toBeDisabled();
    await page.keyboard.press('Escape');

    // Casting now starts the rank 2 cooldown (3.5 s, not 4 s)
    await page.waitForTimeout(300);
    await page.keyboard.press('KeyK');
    const remaining = await page.evaluate(() => (window as any).__entities.skillCooldowns.remainingMs('power-wave') as number);
    expect(remaining).toBeGreaterThan(2500);
    expect(remaining).toBeLessThanOrEqual(3500);
    expect(pageErrors).toEqual([]);
  });

  test('Shift in the air does nothing until the air dash is learned, then once per jump', async ({ page }) => {
    test.setTimeout(90000);
    await openStage(page, 1);

    // Without the air dash: Shift in the air moves the hero nowhere sideways
    await launch(page, 200);
    expect((await hero(page)).onGround).toBe(false);
    const x0 = (await hero(page)).x;
    await page.keyboard.press('Shift');
    await page.waitForTimeout(250);
    expect(Math.abs((await hero(page)).x - x0)).toBeLessThan(25);

    // With it: one burst in the air
    await page.evaluate(() => { (window as any).__entities.movement.unlock('air-dash'); });
    await page.waitForTimeout(1200); // landed, the Dash cooldown is over
    await launch(page, 200);
    expect((await hero(page)).onGround).toBe(false);
    const x1 = (await hero(page)).x;
    await page.keyboard.press('Shift');
    await expect.poll(async () => (await hero(page)).x - x1, { timeout: 2000 }).toBeGreaterThan(80);

    // A second one in the same jump is refused, even after the cooldown
    await page.evaluate(() => { (window as any).__entities.movement.tick(2000); });
    const x2 = (await hero(page)).x;
    const stillInAir = !(await hero(page)).onGround;
    if (stillInAir) {
      await page.keyboard.press('Shift');
      await page.waitForTimeout(250);
      expect((await hero(page)).x - x2).toBeLessThan(40);
    }
  });
});
