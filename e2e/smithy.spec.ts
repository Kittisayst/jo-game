/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, Page } from '@playwright/test';
import { Bot } from './helpers/bot';

async function startInVillage (page: Page): Promise<Bot>
{
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  await page.goto('/');
  await page.getByRole('button', { name: /ເຂົ້າເກມ/i }).click();
  await expect(page.locator('.game-hud')).toBeVisible({ timeout: 12000 });
  const bot = new Bot(page, false);
  await expect.poll(async () => (await bot.state()).scene, { timeout: 20000 }).toBe('village');
  return bot;
}

test.describe('The Smithy (Workshop and Forge in one building)', () => {
  test('one building, one window: tools first, the Forge side locked until the Textbook 1 exam, repairs and upgrades in tabs', async ({ page }) => {
    test.setTimeout(120000);
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));
    const bot = await startInVillage(page);

    // One E spot at x = 3100 opens the window on the tools
    expect(await bot.goTo(3100, { tolerance: 25, fight: false, timeoutMs: 60000 })).toBe('arrived');
    await page.keyboard.press('KeyE');
    await expect(page.locator('h2:has-text("Smithy")')).toBeVisible();
    await expect(page.getByTestId('recipes-workshop')).toBeVisible();

    // A new player cannot use the Forge side yet, and is told why
    await page.getByTestId('smithy-tab-weapons').click();
    await expect(page.getByTestId('smithy-forge-locked')).toBeVisible();
    // Tool upgrades are open; the sword upgrades say they are locked
    await page.getByTestId('smithy-tab-upgrade').click();
    await expect(page.getByTestId('smithy-forge-locked')).toBeVisible();
    await expect(page.getByTestId('tool-axe-t1')).toBeVisible();

    // Repairs are open from the start and list both kinds
    await page.getByTestId('smithy-tab-repair').click();
    await expect(page.getByTestId('workshop-repairs')).toBeVisible();
    await expect(page.getByTestId('forge-repairs')).toBeVisible();

    // Passing the exam of Textbook 1 opens the Forge tabs
    await page.evaluate(() => { (window as any).__entities.forgeUnlocked = true; });
    await page.getByTestId('smithy-tab-weapons').click();
    await expect(page.getByTestId('recipes-forge')).toBeVisible();
    // The Forge tab lists Forge recipes, not the tools of the tab before it
    await expect(page.getByText('Wood Axe T1')).toHaveCount(0);
    await page.getByTestId('smithy-tab-tools').click();
    await expect(page.getByText('Wood Axe T1')).toBeVisible();
    await page.getByTestId('smithy-tab-upgrade').click();
    await expect(page.getByTestId('weapon-upgrades')).toBeVisible();

    // Esc closes it
    await page.keyboard.press('Escape');
    await expect(page.locator('h2:has-text("Smithy")')).toHaveCount(0);

    // The old events still open the right tab
    await page.evaluate(() => (window as any).__eventBus.emit('open-forge'));
    await expect(page.getByTestId('recipes-forge')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.evaluate(() => (window as any).__eventBus.emit('open-workshop'));
    await expect(page.getByTestId('recipes-workshop')).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});
