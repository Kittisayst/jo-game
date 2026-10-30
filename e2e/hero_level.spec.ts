/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';
import { openStage } from './helpers/stage';

test.describe('Hero Level and XP', () => {
  test('defeating a monster pays XP, enough XP raises the Hero Level, and the HUD shows it', async ({ page }) => {
    test.setTimeout(60000);
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));
    await openStage(page, 2);

    const badge = page.getByTestId('hero-level');
    const creditBefore = await page.evaluate(() => (window as any).__entities.wallet.balance as number);
    await expect(badge).toBeVisible();
    await expect(badge).toHaveAttribute('data-level', '1');

    // A hit that fells the first monster, the way the sword and every Skill do it
    const felled = await page.evaluate(() => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      const enemy = scene.enemies.getChildren().find((e: any) => e.active && !e.entity.isDefeated);
      const xp = enemy.entity.xp as number;
      scene.player.isInvincible = true;
      scene['combat'].strikeEnemy(enemy, 100000, 1);
      return { xp, defeated: enemy.entity.isDefeated as boolean };
    });
    expect(felled.defeated).toBe(true);
    // A forest slime pays 6 XP in Stage 1; in Stage 2 the scaling adds more
    expect(felled.xp).toBeGreaterThanOrEqual(6);

    // Level 1 -> 2 needs 10 XP and a Stage 2 slime pays 13: the first kill is already a level up
    const hero = () => page.evaluate(() => (window as any).__entities.heroLevel.toSnapshot() as { level: number; xp: number; unspentPoints: number });
    await expect.poll(async () => (await hero()).level, { timeout: 4000 }).toBeGreaterThanOrEqual(2);

    // Every level gives one Stat point, and the HUD shows the level the hero has
    const now = await hero();
    expect(now.unspentPoints).toBe(now.level - 1);
    await expect(badge).toHaveAttribute('data-level', String(now.level), { timeout: 4000 });

    // XP is not Credit: the wallet did not move
    expect(await page.evaluate(() => (window as any).__entities.wallet.balance as number)).toBe(creditBefore);
    expect(pageErrors).toEqual([]);
  });

  test('the level is saved and comes back', async ({ page }) => {
    test.setTimeout(60000);
    await openStage(page, 2);
    await page.evaluate(() => { (window as any).__entities.heroLevel.loadFrom({ level: 12, xp: 5, unspentPoints: 3 }); });
    const snapshot = await page.evaluate(() => (window as any).__entities.toSnapshot('manual-1') as { heroLevel: unknown });
    expect(snapshot.heroLevel).toEqual({ level: 12, xp: 5, unspentPoints: 3 });
    await page.evaluate((s: unknown) => {
      const entities = (window as any).__entities;
      entities.heroLevel.loadFrom({ level: 1, xp: 0, unspentPoints: 0 });
      entities.loadFromSnapshot(s);
    }, snapshot);
    expect(await page.evaluate(() => (window as any).__entities.heroLevel.level as number)).toBe(12);
  });
});
