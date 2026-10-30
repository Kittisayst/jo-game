/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, Page } from '@playwright/test';
import { Bot } from './helpers/bot';
import { openStage } from './helpers/stage';

const count = (page: Page, id: string) => page.evaluate((item: string) => (window as any).__entities.backpack.getItemCount(item) as number, id);

async function startInVillage (page: Page): Promise<Bot>
{
  await page.goto('/');
  await page.getByRole('button', { name: /ເຂົ້າເກມ/i }).click();
  await expect(page.locator('.game-hud')).toBeVisible({ timeout: 12000 });
  const bot = new Bot(page, false);
  await expect.poll(async () => (await bot.state()).scene, { timeout: 20000 }).toBe('village');
  return bot;
}

test.describe('Tool upgrades', () => {
  test('the Workshop upgrades the axe for Materials only, and says so on the tab', async ({ page }) => {
    test.setTimeout(90000);
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));
    const bot = await startInVillage(page);
    await page.evaluate(() => {
      const e = (window as any).__entities;
      e.backpack.addItem('wood', 10);
      e.backpack.addItem('stone', 5);
    });
    const credit = await page.evaluate(() => (window as any).__entities.wallet.balance);

    expect(await bot.goTo(875, { tolerance: 25, fight: false, timeoutMs: 40000 })).toBe('arrived');
    await page.keyboard.press('KeyE');
    await page.getByTestId('workshop-tab-upgrade').click();
    await expect(page.getByTestId('tool-axe-t1')).toHaveAttribute('data-level', '0');

    await page.getByTestId('upgrade-axe-t1').click();
    await expect(page.getByTestId('tool-axe-t1')).toHaveAttribute('data-level', '1');
    expect(await count(page, 'wood')).toBe(0);
    expect(await count(page, 'stone')).toBe(0);
    expect(await page.evaluate(() => (window as any).__entities.toolUpgrades.getLevel('axe-t1'))).toBe(1);
    expect(await page.evaluate(() => (window as any).__entities.wallet.balance)).toBe(credit);

    // No Materials left for +2: the button says so and nothing happens
    await expect(page.getByTestId('upgrade-axe-t1')).toBeDisabled();
    expect(pageErrors).toEqual([]);
  });

  test('an upgraded axe fells the oak tree in 2 Strikes instead of 3', async ({ page }) => {
    test.setTimeout(90000);
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));
    const bot = await openStage(page, 1);
    await page.evaluate(() => { (window as any).__entities.toolUpgrades.upgrade('axe-t1'); });

    // The oak tree stands at x = 560 and gives 3 Wood on its last Strike
    expect(await bot.goTo(545, { tolerance: 12, fight: false, timeoutMs: 30000 })).toBe('arrived');
    const woodBefore = await count(page, 'wood');
    for (let i = 0; i < 2; i++) {
      await page.keyboard.press('KeyE');
      await page.waitForTimeout(550);
    }
    await expect.poll(() => count(page, 'wood'), { timeout: 3000 }).toBe(woodBefore + 3);
    expect(pageErrors).toEqual([]);
  });
});
