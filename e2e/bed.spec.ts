/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';
import { Bot } from './helpers/bot';

async function startInVillage (page: any): Promise<Bot>
{
  page.on('pageerror', (err: Error) => console.log('PAGE ERROR:', err.message));
  await page.goto('/');
  await page.getByRole('button', { name: /ເຂົ້າເກມ/i }).click();
  await expect(page.locator('.game-hud')).toBeVisible({ timeout: 12000 });
  const bot = new Bot(page, false);
  await expect.poll(async () => (await bot.state()).scene, { timeout: 20000 }).toBe('village');
  return bot;
}

test.describe('The Bed', () => {
  test('by day it says it is not the time; at night it skips to the morning, fills the hearts and moves a build job on', async ({ page }) => {
    test.setTimeout(120000);
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));
    const bot = await startInVillage(page);

    // The Bed stands at x = 1535
    expect(await bot.goTo(1535, { tolerance: 25, fight: false, timeoutMs: 40000 })).toBe('arrived');
    const phase = () => page.evaluate(() => (window as any).__entities.worldTime.phase as string);
    expect(await phase()).toBe('day');
    const fractionBefore = await page.evaluate(() => (window as any).__entities.worldTime.dayFraction as number);

    // By day: nothing happens
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(1500);
    expect(await phase()).toBe('day');
    const fractionAfter = await page.evaluate(() => (window as any).__entities.worldTime.dayFraction as number);
    expect(Math.abs(fractionAfter - fractionBefore)).toBeLessThan(0.02);

    // At night, with a hurt hero and a 5 minute build job
    await page.evaluate(() => {
      const e = (window as any).__entities;
      e.health.takeDamage();
      e.health.takeDamage();
      e.crafting.start('axe-t1', 'axe-t1', 1, 5 * 60_000);
      (window as any).__advanceWorldTime(12 * 60_000);
    });
    await expect.poll(phase, { timeout: 3000 }).toBe('night');
    expect(await page.evaluate(() => (window as any).__entities.health.current as number)).toBe(1);

    await page.keyboard.press('KeyE');
    await expect.poll(phase, { timeout: 8000 }).toBe('day');
    await expect.poll(() => page.evaluate(() => (window as any).__entities.health.current as number), { timeout: 3000 }).toBe(3);
    expect(await page.evaluate(() => (window as any).__entities.crafting.isReady as boolean)).toBe(true);
    await expect(page.getByTestId('health-hearts')).toHaveAttribute('data-current', '3');

    // The hero can move again once the screen is back
    await expect.poll(async () => {
      const before = (await bot.state()).x;
      await bot.walk(1);
      await page.waitForTimeout(400);
      await bot.walk(0);
      return (await bot.state()).x - before;
    }, { timeout: 8000 }).toBeGreaterThan(20);
    expect(pageErrors).toEqual([]);
  });
});
