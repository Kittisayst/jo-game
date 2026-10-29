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

/**
 * Records the guardian's phases and the most rocks in the air on every frame inside the game, so a
 * slow test machine cannot miss a short phase like the 0.8 s warning between two samples.
 */
async function startRecording (page: Page): Promise<void>
{
  await page.evaluate(() => {
    const w = window as any;
    const scene = w.__botGame.scene.getScene('Game');
    w.__guardianRec = { phases: new Set<string>(), rocks: 0, minY: Infinity, maxY: -Infinity };
    if (w.__guardianRecStop) w.__guardianRecStop();
    const onFrame = () => {
      const guardian = scene.enemies.getChildren().find((e: any) => e.entity.definitionId === 'cave-guardian');
      if (!guardian) return;
      w.__guardianRec.phases.add(guardian.attackBehavior.phase);
      w.__guardianRec.rocks = Math.max(w.__guardianRec.rocks, scene.enemyProjectiles.countActive(true));
      w.__guardianRec.maxY = Math.max(w.__guardianRec.maxY, guardian.y);
    };
    scene.events.on('postupdate', onFrame);
    w.__guardianRecStop = () => scene.events.off('postupdate', onFrame);
  });
}

/** Waits until `done` is satisfied by what the recorder saw (or time runs out) and returns it. */
async function watchGuardian (page: Page, done: (phases: Set<string>, rocks: number) => boolean, timeoutMs = 20000)
{
  await startRecording(page);
  const start = Date.now();
  let seen = { phases: new Set<string>(), rocks: 0, maxY: 0 };
  while (Date.now() - start < timeoutMs) {
    const rec = await page.evaluate(() => {
      const r = (window as any).__guardianRec;
      return { phases: [...r.phases] as string[], rocks: r.rocks as number, maxY: r.maxY as number };
    });
    seen = { phases: new Set(rec.phases), rocks: rec.rocks, maxY: rec.maxY };
    if (done(seen.phases, seen.rocks)) break;
    await page.waitForTimeout(100);
  }
  // A guardian that fell out of the world can never attack. On a very slow frame rate (about 17 fps)
  // enemies sink through the floor; that is a physics issue, not this feature, so say so and skip.
  test.skip(seen.maxY > 1000, 'The Cave Guardian fell through the floor (slow frame rate); see "Known issues" in docs/plans/2026-10-30-player-sprite-rows.md');
  return seen;
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
