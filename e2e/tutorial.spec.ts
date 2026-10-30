/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, Page } from '@playwright/test';
import { Bot } from './helpers/bot';
import { answerStageQuestion, enterStage, makeHeroInvincible, walkOutOfStage } from './helpers/stage';

const hint = (page: Page) => page.getByTestId('tutorial-hint');

async function doneSteps (page: Page): Promise<string[]>
{
  return page.evaluate(() => (window as any).__entities.tutorial.doneSteps as string[]);
}

async function startFirstStage (page: Page): Promise<Bot>
{
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  await page.goto('/');
  await enterStage(page, 1);
  await expect(page.locator('.game-hud')).toBeVisible({ timeout: 12000 });
  const bot = new Bot(page, false);
  await expect.poll(async () => (await bot.state()).scene, { timeout: 20000 }).toBe('stage-001');
  return bot;
}

test.describe('The first Stage teaches the loop', () => {
  test('a new game follows the hints one by one and ends with Stage 2 open', async ({ page }) => {
    test.setTimeout(150000);
    const bot = await startFirstStage(page);
    await makeHeroInvincible(page);

    // 1. Walk
    await expect(hint(page)).toContainText('ກົດ ← →');
    await bot.goTo(300, { tolerance: 20, fight: false });
    await expect(hint(page)).toContainText('ສະໝຸນໄພ');

    // 2. Herb (x = 420)
    await bot.goTo(412, { tolerance: 12, fight: false });
    await page.keyboard.press('KeyE');
    await expect(hint(page)).toContainText('ຕົ້ນໄມ້');

    // 3. Tree (x = 560): three Strikes
    await bot.goTo(548, { tolerance: 12, fight: false });
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('KeyE');
      await page.waitForTimeout(500);
    }
    await expect(hint(page)).toContainText('ຕີສະໄລມ໌');

    // 4. Fight the slime (x = 800)
    await bot.goTo(790, { tolerance: 30, timeoutMs: 40000 });
    await expect(hint(page)).toContainText('ກະເປົາ', { timeout: 30000 });

    // 5. Backpack
    await page.keyboard.press('KeyI');
    await expect(hint(page)).toContainText('ທາງອອກ');
    await page.keyboard.press('Escape');

    // 6. Exit and the question
    await walkOutOfStage(page, bot);
    await answerStageQuestion(page, true);
    await expect(page.locator('.level-badge')).toContainText(/ໝູ່ບ້ານ/, { timeout: 15000 });

    // 7. Back in the village the last hint is about the Textbook
    await expect(hint(page)).toContainText('ປຶ້ມຕຳລາ');
    expect(await doneSteps(page)).toEqual(['move', 'herb', 'tree', 'fight', 'backpack', 'exit']);
    const stage2Open = await page.evaluate(() => (window as any).__entities.stageProgression.isStageUnlocked('stage-002'));
    expect(stage2Open).toBe(true);
  });

  test('the player can skip the hints and they stay skipped', async ({ page }) => {
    await startFirstStage(page);
    await expect(hint(page)).toBeVisible();

    await page.getByTestId('tutorial-skip').click();
    await expect(hint(page)).toHaveCount(0);
    expect(await page.evaluate(() => (window as any).__entities.tutorial.isDismissed)).toBe(true);
  });

  test('dying in the first Stage loses no Materials', async ({ page }) => {
    test.setTimeout(90000);
    const bot = await startFirstStage(page);
    await page.evaluate(() => (window as any).__entities.backpack.addItem('wood', 10));
    const wood = () => page.evaluate(() => (window as any).__entities.backpack.getItemCount('wood') as number);
    expect(await wood()).toBe(10);

    // Stand on the slime (x = 800) without fighting back until the hero falls
    await bot.state();
    await page.evaluate(() => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      scene.player.setPosition(800, 580);
    });
    await expect(page.locator('.level-badge')).toContainText(/ໝູ່ບ້ານ/, { timeout: 40000 });

    expect(await wood()).toBe(10);
  });
});
