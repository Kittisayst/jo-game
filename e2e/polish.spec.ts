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
});
