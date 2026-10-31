/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, Page } from '@playwright/test';
import { openStage } from './helpers/stage';

const readPits = (page: Page) => page.evaluate(() => {
  const scene = (window as any).__botGame.scene.getScene('Game');
  return (scene.level.pits ?? []) as { x: number; width: number }[];
});

/** Stands the hero on the ground `distance` px before a pit's left edge, looking right. */
async function standBeforePit (page: Page, pit: { x: number }, distance: number): Promise<void>
{
  await page.evaluate(({ x }) => {
    const scene = (window as any).__botGame.scene.getScene('Game');
    scene.player.isInvincible = true; // a fall kills whatever the hero is
    scene.player.setPosition(x, 600);
    scene.player.setVelocity(0, 0);
    scene.player.facingDir = 1;
  }, { x: pit.x - distance });
  await page.waitForTimeout(500);
}

test.describe('Pits', () => {
  test('Stage 3 has a pit that is drawn as a drop in the ground, and the ground stops at it', async ({ page }) => {
    test.setTimeout(60000);
    await openStage(page, 3);
    const pits = await readPits(page);
    expect(pits.length).toBeGreaterThanOrEqual(1);

    const info = await page.evaluate(({ pit }) => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      const strips = scene.ground.getChildren().map((g: any) => ({ left: g.x - g.width / 2, right: g.x + g.width / 2 }));
      return { strips, worldWidth: scene.level.worldWidth as number, pit };
    }, { pit: pits[0] });
    // One strip of ground on each side of the pit and none over it
    expect(info.strips.length).toBe(pits.length + 1);
    expect(info.strips.some((s: any) => s.left < pits[0].x + pits[0].width && s.right > pits[0].x)).toBe(false);
  });

  test('a running jump crosses a pit, and the hero lives', async ({ page }) => {
    test.setTimeout(90000);
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));
    await openStage(page, 3);
    const [pit] = await readPits(page);
    await standBeforePit(page, pit, 24);

    await page.keyboard.down('ArrowRight');
    await page.keyboard.down('Space');
    await page.waitForTimeout(560);
    await page.keyboard.up('Space');
    await page.waitForTimeout(700);
    await page.keyboard.up('ArrowRight');

    const state = await page.evaluate(() => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      return { x: scene.player.x as number, y: scene.player.y as number, dead: scene.health.isDead as boolean };
    });
    expect(state.dead).toBe(false);
    expect(state.x).toBeGreaterThan(pit.x + pit.width);
    expect(state.y).toBeLessThan(700); // on the ground again, not sinking
    expect(pageErrors).toEqual([]);
  });

  test('walking into a pit kills the hero, even an invincible one, and the hearts are gone', async ({ page }) => {
    test.setTimeout(90000);
    await openStage(page, 3);
    const [pit] = await readPits(page);
    await standBeforePit(page, pit, 40);

    await page.keyboard.down('ArrowRight');
    await expect.poll(() => page.evaluate(() => (window as any).__botGame.scene.getScene('Game').health.isDead as boolean), { timeout: 8000 }).toBe(true);
    await page.keyboard.up('ArrowRight');

    const health = await page.evaluate(() => {
      const e = (window as any).__entities;
      return { current: e.health.current as number, armor: e.health.armor as number };
    });
    expect(health).toEqual({ current: 0, armor: 0 });
  });
});
