/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, Page } from '@playwright/test';
import { Bot } from './helpers/bot';

/** The text over the smith's head, when he is there ('' when he is not). */
const smithText = (page: Page) => page.evaluate(() => {
  const scene = (window as any).__botGame.scene.getScene('Game');
  const containers = scene.children.list.filter((o: any) => o.type === 'Container' && o.visible && o.alpha > 0.5);
  const text = containers.flatMap((c: any) => c.list).find((o: any) => o.type === 'Text' && /^(🔨 \d+:\d\d|✅ ສຳເລັດ!)$/.test(o.text));
  return (text?.text ?? '') as string;
});

const count = (page: Page, id: string) => page.evaluate((item: string) => (window as any).__entities.backpack.getItemCount(item) as number, id);

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

test.describe('Build time at the Workshop', () => {
  test('one job at a time: Materials are taken at the start, the tool is collected when the Game time is up, and the job is saved', async ({ page }) => {
    test.setTimeout(120000);
    // An exception inside the smith's animation (sparks on every strike) used to go unnoticed
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));
    const bot = await startInVillage(page);
    await page.evaluate(() => {
      const e = (window as any).__entities;
      e.backpack.addItem('wood', 30);
      e.backpack.addItem('stone', 10);
    });
    const axesBefore = await count(page, 'axe-t1');

    // The Workshop stands at x = 880
    expect(await bot.goTo(875, { tolerance: 25, fight: false, timeoutMs: 40000 })).toBe('arrived');
    await page.keyboard.press('KeyE');
    const axeCard = page.locator('div', { hasText: 'Wood Axe T1' }).filter({ has: page.getByRole('button', { name: /ເລີ່ມສ້າງ/ }) }).last();
    await expect(axeCard).toBeVisible();
    await axeCard.getByRole('button', { name: /ເລີ່ມສ້າງ \(0:15\)/ }).click();

    // Taken now, nothing handed over yet, and everything else waits
    expect(await count(page, 'wood')).toBe(25);
    expect(await count(page, 'axe-t1')).toBe(axesBefore);
    await expect(page.getByTestId('crafting-status')).toHaveAttribute('data-state', 'building');
    await expect(page.getByRole('button', { name: 'ກຳລັງສ້າງອັນອື່ນຢູ່' }).first()).toBeDisabled();

    // The job is part of the save
    const saved = await page.evaluate(() => (window as any).__entities.crafting.toSnapshot());
    expect(saved).toMatchObject({ recipeId: 'recipe-axe-t1', resultItemId: 'axe-t1', totalMs: 15000 });

    // Game time moves it: the scene ticks it while playing
    await page.keyboard.press('Escape');
    const before = await page.evaluate(() => (window as any).__entities.crafting.job.remainingMs as number);
    await expect.poll(() => page.evaluate(() => (window as any).__entities.crafting.job.remainingMs as number), { timeout: 5000 }).toBeLessThan(before);
    await expect(page.getByTestId('crafting-badge')).toContainText('ກຳລັງສ້າງ');
    // The smith is at the Workshop hammering, with the time left over his head
    await expect.poll(() => smithText(page), { timeout: 5000 }).toMatch(/^🔨 0:\d\d$/);
    // Long enough for the hammer to strike a few times (sparks fly on every strike)
    await page.waitForTimeout(2500);

    // Done: the badge says so, and the tool is collected at the Workshop
    await page.evaluate(() => (window as any).__entities.crafting.tick(15000));
    await expect(page.getByTestId('crafting-badge')).toContainText('ສ້າງສຳເລັດ');
    await expect.poll(() => smithText(page), { timeout: 5000 }).toBe('✅ ສຳເລັດ!');
    await page.keyboard.press('KeyE');
    await page.getByTestId('crafting-collect').click();
    expect(await count(page, 'axe-t1')).toBe(axesBefore + 1);
    await expect(page.getByTestId('crafting-status')).toHaveCount(0);
    // Nothing left to make: the smith goes
    await expect.poll(() => smithText(page), { timeout: 5000 }).toBe('');
    expect(pageErrors).toEqual([]);
  });
});
