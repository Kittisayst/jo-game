/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';
import { Bot } from './helpers/bot';

const SHOT = 'C:/Users/kitti/AppData/Local/Temp/claude/D--developer-game-jo-game/c7121a21-fd52-4547-9c3a-eb382977ed44/scratchpad/';

async function startInVillage (page: any): Promise<Bot>
{
  await page.goto('/');
  await page.getByRole('button', { name: /ເຂົ້າເກມ/i }).click();
  await expect(page.locator('.game-hud')).toBeVisible({ timeout: 12000 });
  const bot = new Bot(page, false);
  await expect.poll(async () => (await bot.state()).scene, { timeout: 20000 }).toBe('village');
  return bot;
}

test.describe('Village polish', () => {
  test('the nearest spot gets the E prompt (the Storage chest, not the Library, between them)', async ({ page }) => {
    test.setTimeout(90000);
    await startInVillage(page);
    const prompt = () => page.evaluate(() => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      const t = scene.children.list.find((o: any) => o.type === 'Text' && o.visible && /^\S*\s?\[E\]/.test(o.text));
      return (t?.text ?? '') as string;
    });
    // The chest is at x = 235 and the Library at 320; both reach 70 px
    for (const [x, word] of [[258, 'Storage'], [300, 'Library']] as const) {
      await page.evaluate((px: number) => {
        const scene = (window as any).__botGame.scene.getScene('Game');
        scene.player.setPosition(px, scene.player.y);
        scene.player.setVelocity(0, 0);
      }, x);
      await expect.poll(prompt, { timeout: 3000 }).toContain(word);
    }
  });

  test('the lanterns of the village shine at night and not by day', async ({ page }) => {
    test.setTimeout(90000);
    await startInVillage(page);
    const lit = () => page.evaluate(() => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      return scene.children.list.filter((o: any) => o.type === 'Image' && o.depth === 902 && o.alpha > 0.4).length as number;
    });
    expect(await lit()).toBe(0);
    await page.evaluate(() => (window as any).__advanceWorldTime(12.5 * 60_000));
    await expect.poll(lit, { timeout: 3000 }).toBe(5);
    await page.screenshot({ path: SHOT + 'polish_village_night.png' });
    await page.evaluate(() => (window as any).__advanceWorldTime(7 * 60_000));
    await expect.poll(lit, { timeout: 3000 }).toBe(0);
  });

  test('the Backpack shows its capacity bar and the three armor slots side by side', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/?stage=2');
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(1000);
    await page.keyboard.press('KeyI');
    const fill = page.getByTestId('backpack-capacity-fill');
    await expect(fill).toBeVisible();
    // The fill has a height and a colour (its classes were not in style.css, so it was an empty bar)
    expect((await fill.boundingBox())!.height).toBeGreaterThanOrEqual(3);
    expect(await fill.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');

    // Head, body and feet in one row, not three tall panels one under the other
    const ys = await Promise.all(['head', 'body', 'feet'].map(async slot => (await page.getByTestId(`armor-slot-${slot}`).boundingBox())!.y));
    expect(new Set(ys.map(Math.round)).size).toBe(1);
  });

  test('on a phone held sideways the HUD leaves most of the screen free', async ({ browser }) => {
    test.setTimeout(90000);
    const context = await browser.newContext({ viewport: { width: 812, height: 375 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto('/?stage=2');
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(2000);
    const box = await page.locator('.hud-cluster-left').boundingBox();
    await page.screenshot({ path: SHOT + 'polish_phone_hud.png' });
    console.log('HUD box ' + JSON.stringify(box));
    expect(box!.height).toBeLessThanOrEqual(375 * 0.3);
    await context.close();
  });
  test('on a phone the hero is drawn bigger and sits above the on-screen buttons', async ({ browser }) => {
    test.setTimeout(90000);
    const context = await browser.newContext({ viewport: { width: 812, height: 375 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto('/?stage=2');
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    const bot = new Bot(page, false);
    await bot.state(); // lets the helpers find the running game
    await page.waitForTimeout(2500);
    const view = await page.evaluate(() => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      const cam = scene.cameras.main;
      const canvas = document.querySelector('canvas')!.getBoundingClientRect();
      // Where the hero's feet are on the screen: the camera zooms about its centre
      const feet = scene.player.y + 24;
      const fraction = ((feet - cam.scrollY - cam.height / 2) * cam.zoom + cam.height / 2) / cam.height;
      return { zoom: cam.zoom as number, feetY: canvas.top + fraction * canvas.height };
    });
    const buttonTops = await page.locator('.virtual-touch-btn').evaluateAll(els => els.map(e => e.getBoundingClientRect().top));
    expect(view.zoom).toBeGreaterThan(1.2);
    expect(buttonTops.length).toBeGreaterThan(2);
    // The feet are clearly above the highest button
    expect(view.feetY).toBeLessThan(Math.min(...buttonTops) - 10);
    await context.close();
  });
});
