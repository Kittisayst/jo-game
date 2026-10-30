/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, Page } from '@playwright/test';
import { Bot } from './helpers/bot';
import { openStage } from './helpers/stage';

/** The secret ledge, the platform the dash starts from, and which side the ledge is on, read from the running Stage. */
async function readLedge (page: Page): Promise<{ x: number; y: number; launch: { x: number; y: number }; dir: 1 | -1 }>
{
  return page.evaluate(() => {
    const scene = (window as any).__botGame.scene.getScene('Game');
    const secret = scene.level.secretPlatforms[0] as { x: number; y: number };
    const launch = scene.level.platforms
      .filter((p: any) => p.x !== secret.x && p.y === 512)
      .map((p: any) => ({ p, edgeGap: Math.abs(secret.x - p.x) - 160 }))
      .sort((a: any, b: any) => a.edgeGap - b.edgeGap)[0].p as { x: number; y: number };
    return { x: secret.x, y: secret.y, launch, dir: (secret.x > launch.x ? 1 : -1) as 1 | -1 };
  });
}

const hero = (page: Page) => page.evaluate(() => {
  const scene = (window as any).__botGame.scene.getScene('Game');
  return { x: scene.player.x as number, y: scene.player.y as number, onGround: scene.player.body.blocked.down as boolean };
});

/** True when the hero stands on the ledge. */
async function onLedge (page: Page, ledge: { x: number; y: number }): Promise<boolean>
{
  const h = await hero(page);
  return h.onGround && Math.abs(h.x - ledge.x) <= 80 && Math.abs(h.y - (ledge.y - 16 - 22)) < 14;
}

/** Stands on the launch platform at its edge towards the ledge, then runs and jumps, and dashes in the air if asked. */
async function tryTheLeap (page: Page, bot: Bot, ledge: Awaited<ReturnType<typeof readLedge>>, dash: boolean): Promise<void>
{
  await page.evaluate(({ launch, dir }) => {
    const scene = (window as any).__botGame.scene.getScene('Game');
    scene.player.isInvincible = true;
    scene.player.setPosition(launch.x + dir * 70, launch.y - 16 - 40);
    scene.player.setVelocity(0, 0);
    scene.player.facingDir = dir;
  }, { launch: ledge.launch, dir: ledge.dir });
  await page.waitForTimeout(500);
  // Wait out the Dash cooldown of an earlier try
  await page.evaluate(() => (window as any).__entities.movement.tick(2000));

  // Space is held through the whole jump: letting go early cuts the jump short
  await bot.walk(ledge.dir);
  await bot.hold('Space', true);
  // The jump peaks about half a second after it starts: that is the best moment for the air dash
  await page.waitForTimeout(440);
  if (dash) await bot.tap('ShiftLeft', 60);
  // Keep running until the hero stands on the ledge (stopping early would stop it in the air), then stop at once
  // so it does not walk off the far edge
  const until = Date.now() + 1800;
  while (Date.now() < until && !(await onLedge(page, ledge))) await page.waitForTimeout(30);
  await bot.walk(0);
  await bot.hold('Space', false);
  await page.waitForTimeout(300);
}

test.describe('Secret ledge (Stage 14)', () => {
  test('only the air dash gets the hero across the gap, and the crystal vein on it can be mined', async ({ page }) => {
    test.setTimeout(120000);
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));
    const bot = await openStage(page, 14);
    const ledge = await readLedge(page);

    // The reward is on the ledge and the ledge shines
    const reward = await page.evaluate(() => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      const node = scene.resourceNodes.find((n: any) => n.secret);
      return { x: node.x as number, y: node.y as number };
    });
    expect(Math.abs(reward.x - ledge.x)).toBeLessThan(5);
    expect(reward.y).toBeLessThan(500);

    // Without the air dash the leap falls short: three tries, never on the ledge
    for (let attempt = 0; attempt < 3; attempt++) {
      await tryTheLeap(page, bot, ledge, false);
      expect(await onLedge(page, ledge), `try ${attempt + 1} without the air dash`).toBe(false);
    }

    // With the air dash it works (a few tries allowed for timing)
    await page.evaluate(() => { (window as any).__entities.movement.unlock('air-dash'); });
    let made = false;
    for (let attempt = 0; attempt < 5 && !made; attempt++) {
      await tryTheLeap(page, bot, ledge, true);
      made = await onLedge(page, ledge);
    }
    expect(made).toBe(true);

    // Up there the vein gives its reward (a pickaxe, and 3 Strikes)
    await page.evaluate(() => { (window as any).__entities.backpack.addItem('pickaxe-t1', 1); });
    const crystalBefore = await page.evaluate(() => (window as any).__entities.backpack.getItemCount('crystal') as number);
    await page.evaluate((x: number) => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      scene.player.setPosition(x - 20, scene.player.y);
      scene.player.setVelocity(0, 0);
    }, reward.x);
    await page.waitForTimeout(400);
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('KeyE');
      await page.waitForTimeout(550);
    }
    await expect.poll(() => page.evaluate(() => (window as any).__entities.backpack.getItemCount('crystal') as number), { timeout: 3000 }).toBe(crystalBefore + 3);
    expect(pageErrors).toEqual([]);
  });
});
