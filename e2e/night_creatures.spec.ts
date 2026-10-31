/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, Page } from '@playwright/test';
import { openStage } from './helpers/stage';

/** The night creatures standing in the running Stage now. */
const creatures = (page: Page) => page.evaluate(() => {
  const scene = (window as any).__botGame.scene.getScene('Game');
  return scene.enemies.getChildren()
    .filter((e: any) => e.active && e.entity.definitionId?.startsWith('night-'))
    .map((e: any) => ({ id: e.entity.definitionId as string, hp: e.entity.maxHp as number, xp: e.entity.xp as number, x: e.x as number, heroX: scene.player.x as number }));
});

test.describe('Night creatures', () => {
  test('they walk a Stage only at night, are tougher and pay more, keep away from the hero, and are gone at dawn', async ({ page }) => {
    test.setTimeout(90000);
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));
    await openStage(page, 2);

    // By day there are none
    expect(await creatures(page)).toEqual([]);
    const dayHp = await page.evaluate(() => (window as any).__botGame.scene.getScene('Game').enemies.getChildren()[0].entity.maxHp as number);

    // The clock starts at 2:00 of 20; 12 more minutes is night
    await page.evaluate(() => (window as any).__advanceWorldTime(12.5 * 60_000));
    await expect.poll(async () => (await creatures(page)).length, { timeout: 4000 }).toBeGreaterThanOrEqual(1);

    const night = await creatures(page);
    for (const creature of night) {
      expect(creature.id).toBe('night-wisp');
      expect(Math.abs(creature.x - creature.heroX)).toBeGreaterThanOrEqual(480);
      // Tougher than the Stage's ordinary monster, and worth more XP than a day one (6 base, scaled)
      expect(creature.hp).toBeGreaterThan(dayHp);
      expect(creature.xp).toBeGreaterThan(20);
    }

    // One that falls pays its XP like any monster
    const before = await page.evaluate(() => (window as any).__entities.heroLevel.toSnapshot() as { level: number; xp: number });
    const xp = await page.evaluate(() => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      const creature = scene.enemies.getChildren().find((e: any) => e.active && e.entity.definitionId === 'night-wisp');
      scene.player.isInvincible = true;
      scene['combat'].strikeEnemy(creature, 100000, 1);
      return creature.entity.xp as number;
    });
    const after = await page.evaluate(() => (window as any).__entities.heroLevel.toSnapshot() as { level: number; xp: number });
    expect(after.level * 10_000 + after.xp).toBeGreaterThan(before.level * 10_000 + before.xp);
    expect(xp).toBeGreaterThan(20);

    // Dawn: the rest fade away
    await page.evaluate(() => (window as any).__advanceWorldTime(6 * 60_000));
    await expect.poll(async () => (await creatures(page)).length, { timeout: 4000 }).toBe(0);
    expect(pageErrors).toEqual([]);
  });

  test('none in the first Stage, even at night', async ({ page }) => {
    test.setTimeout(60000);
    await openStage(page, 1);
    await page.evaluate(() => (window as any).__advanceWorldTime(12.5 * 60_000));
    await expect.poll(() => page.evaluate(() => (window as any).__entities.worldTime.phase as string), { timeout: 3000 }).toBe('night');
    await page.waitForTimeout(800);
    expect(await creatures(page)).toEqual([]);
  });

  test('a Stage entered at night already has them', async ({ page }) => {
    test.setTimeout(60000);
    await openStage(page, 2);
    await page.evaluate(() => (window as any).__advanceWorldTime(12.5 * 60_000));
    await expect.poll(async () => (await creatures(page)).length, { timeout: 4000 }).toBeGreaterThanOrEqual(1);

    // Back to the first Stage's neighbour by reloading the scene at night (the clock is kept)
    await page.evaluate(() => (window as any).__botGame.scene.getScene('Game').scene.restart({ levelKey: 'stage-003' }));
    await expect.poll(async () => (await creatures(page)).length, { timeout: 6000 }).toBeGreaterThanOrEqual(1);

    // Once a night: the same Stage again in the same night has none (no farming by leaving and coming back)
    await page.evaluate(() => (window as any).__botGame.scene.getScene('Game').scene.restart({ levelKey: 'stage-003' }));
    await page.waitForTimeout(1500);
    expect(await creatures(page)).toEqual([]);

    // The next night they walk it again: through the morning, the day, and into the night
    await page.evaluate(() => (window as any).__advanceWorldTime(7 * 60_000));
    await page.evaluate(() => (window as any).__advanceWorldTime(12.5 * 60_000));
    await expect.poll(async () => (await creatures(page)).length, { timeout: 6000 }).toBeGreaterThanOrEqual(1);
  });
});
