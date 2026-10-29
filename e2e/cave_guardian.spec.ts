import { test, expect, Page } from '@playwright/test';
import { readState } from './helpers/bot';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Puts the hero (who cannot be hurt in this spec) at `x`, on the Cave Guardian's level. */
async function placeHero (page: Page, x: number): Promise<void>
{
  await page.evaluate((x) => {
    const scene = (window as any).__botGame.scene.getScene('Game');
    const guardian = scene.enemies.getChildren().find((e: any) => e.entity.definitionId === 'cave-guardian');
    scene.player.isInvincible = true;
    scene.player.setPosition(x, guardian.y);
    scene.player.setVelocity(0, 0);
  }, x);
}

/** What the Cave Guardian is doing and how many rocks are flying. */
async function guardianSnapshot (page: Page): Promise<{ phase: string; x: number; rocks: number; defeated: boolean }>
{
  return page.evaluate(() => {
    const scene = (window as any).__botGame.scene.getScene('Game');
    const guardian = scene.enemies.getChildren().find((e: any) => e.entity.definitionId === 'cave-guardian');
    return {
      phase: guardian.attackBehavior.phase,
      x: Math.round(guardian.x),
      rocks: scene.enemyProjectiles.countActive(true),
      defeated: guardian.entity.isDefeated,
    };
  });
}

/** Samples the guardian until `done` says so (or time runs out) and returns every phase and the most rocks seen. */
async function watchGuardian (page: Page, done: (phases: Set<string>, rocks: number) => boolean, timeoutMs = 20000)
{
  const phases = new Set<string>();
  let rocks = 0;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const snap = await guardianSnapshot(page);
    phases.add(snap.phase);
    rocks = Math.max(rocks, snap.rocks);
    if (done(phases, rocks)) break;
    await page.waitForTimeout(60);
  }
  return { phases, rocks };
}

test.describe('Cave Guardian special attacks', () => {
  test('warns first, then throws rocks from afar and charges and is dazed up close', async ({ page }) => {
    test.setTimeout(90000);
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: /ເລືອກດ່ານ/i }).click();
    await page.locator('.stage-map-node').filter({ hasText: /ບົດທີ 1|Chapter 1/i }).first().click();
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 12000 });
    await page.waitForTimeout(1000);
    await readState(page); // lets the helpers find the running game

    // From afar (about 350 px) the Guardian throws rocks, after a warning
    await placeHero(page, 1500);
    const far = await watchGuardian(page, (phases, rocks) => phases.has('throw') && rocks > 0);
    expect(far.phases.has('telegraph')).toBe(true);
    expect(far.phases.has('throw')).toBe(true);
    expect(far.rocks).toBeGreaterThan(0);

    // Up close it charges and is dazed afterwards
    await page.waitForTimeout(3500);
    const guardian = await guardianSnapshot(page);
    expect(guardian.defeated).toBe(false);
    await placeHero(page, guardian.x - 90);
    const near = await watchGuardian(page, phases => phases.has('charge') && phases.has('stunned'));
    expect(near.phases.has('telegraph')).toBe(true);
    expect(near.phases.has('charge')).toBe(true);
    expect(near.phases.has('stunned')).toBe(true);
  });
});
