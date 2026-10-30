/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, Page } from '@playwright/test';
import { openStage } from './helpers/stage';

const hero = (page: Page) => page.evaluate(() => {
  const scene = (window as any).__botGame.scene.getScene('Game');
  return { x: scene.player.x as number, hearts: scene.health.current as number, dodging: scene.player.isDodging as boolean };
});

test.describe('Dash (dodge)', () => {
  test('Shift bursts the hero forward, waits for its cooldown and dodges an enemy', async ({ page }) => {
    test.setTimeout(90000);
    await openStage(page, 1);

    // Stand on open ground facing right, away from the slime
    await page.evaluate(() => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      scene.player.setPosition(150, scene.player.y);
      scene.player.facingDir = 1;
    });
    await page.waitForTimeout(400);

    const start = (await hero(page)).x;
    await page.keyboard.press('Shift');
    await expect.poll(async () => (await hero(page)).x - start, { timeout: 2000 }).toBeGreaterThan(80);
    expect(await page.evaluate(() => (window as any).__entities.movement.dashReadyInMs)).toBeGreaterThan(0);

    // A second Shift at once does nothing: the cooldown
    await page.waitForTimeout(250);
    const afterFirst = (await hero(page)).x;
    await page.keyboard.press('Shift');
    await page.waitForTimeout(150);
    expect((await hero(page)).x - afterFirst).toBeLessThan(40);

    // Dash straight through the slime: no heart is lost while dodging
    await page.waitForTimeout(900);
    const slime = await page.evaluate(() => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      const enemy = scene.enemies.getChildren().find((e: any) => e.active);
      scene.player.setPosition(enemy.x - 60, scene.player.y);
      scene.player.facingDir = 1;
      return enemy.x as number;
    });
    await page.keyboard.press('Shift');
    await expect.poll(async () => (await hero(page)).x, { timeout: 2000 }).toBeGreaterThan(slime + 20);
    expect((await hero(page)).hearts).toBe(3);
  });
});
