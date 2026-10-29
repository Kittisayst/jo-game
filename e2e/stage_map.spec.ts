import { test, expect, Page } from '@playwright/test';
import { Bot } from './helpers/bot';
import { enterStage, unlockStages } from './helpers/stage';

/* eslint-disable @typescript-eslint/no-explicit-any */

async function progress (page: Page): Promise<{ cleared1: boolean; open2: boolean; open3: boolean }>
{
  return page.evaluate(async () => {
    const { entities } = await import('/src/infrastructure/composition.ts');
    return {
      cleared1: entities.stageProgression.isStageCompleted('stage-001'),
      open2: entities.stageProgression.isStageUnlocked('stage-002'),
      open3: entities.stageProgression.isStageUnlocked('stage-003'),
    };
  });
}

test.describe('The map of 100 stages', () => {
  test('shows ten realms of ten, opens only Stage 1 and keeps the unbuilt stages grey', async ({ page }) => {
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();

    await page.getByRole('button', { name: /ເລືອກດ່ານ/i }).click();
    await expect(page.locator('.realm-row')).toHaveCount(10);
    await expect(page.locator('.realm-cell')).toHaveCount(100);
    // Stages 1-10 are built; 90 are placeholders
    await expect(page.locator('.realm-cell.cell-placeholder')).toHaveCount(90);
    await expect(page.locator('.realm-cell.cell-open')).toHaveCount(1);
    await expect(page.locator('.realm-cell.cell-locked')).toHaveCount(9);

    // A grey stage cannot be entered: clicking it leaves the player on the map and starts no game
    // (aria-disabled makes Playwright wait for the button to be enabled, so the click is forced as a player could)
    await page.getByRole('button', { name: /^ດ່ານ 37/ }).click({ force: true });
    await expect(page.locator('.stage-map-card')).toBeVisible();
    await expect(page.locator('.game-hud')).toHaveCount(0);
    // So is a built stage that is not open yet
    await page.getByRole('button', { name: /^ດ່ານ 2: / }).click({ force: true });
    await expect(page.locator('.stage-map-card')).toBeVisible();
    await expect(page.locator('.game-hud')).toHaveCount(0);
  });

  test('clearing Stage 1 by walking out sends the hero home and opens Stage 2 only', async ({ page }) => {
    test.setTimeout(120000);
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();

    await enterStage(page, 1);
    await expect(page.locator('.level-badge')).toContainText(/ດ່ານ 1/, { timeout: 12000 });
    await page.waitForTimeout(1500);
    expect(await progress(page)).toEqual({ cleared1: false, open2: false, open3: false });

    const bot = new Bot(page, false);
    await bot.goTo(1255, { tolerance: 15, timeoutMs: 60000 });

    await expect(page.locator('.level-badge')).toContainText(/ໝູ່ບ້ານ/, { timeout: 15000 });
    expect(await progress(page)).toEqual({ cleared1: true, open2: true, open3: false });
  });

  test('loads every built stage, with the miniboss at 5 and the gate and boss at 10', async ({ page }) => {
    test.setTimeout(180000);
    const errors: string[] = [];
    page.on('pageerror', err => { console.log('PAGE ERROR:', err.message); errors.push(err.message); });
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await unlockStages(page, 10);
    await enterStage(page, 1);

    // The badge changes the moment a stage is chosen; the scene is running once the bot can read it
    const bot = new Bot(page, false);
    const stageId = (n: number) => `stage-${String(n).padStart(3, '0')}`;
    await expect.poll(async () => (await bot.state()).scene, { timeout: 20000 }).toBe(stageId(1));

    for (let n = 2; n <= 10; n++) {
      await page.evaluate(async (id: string) => {
        const { EventBus } = await import('/src/infrastructure/EventBus.ts');
        EventBus.emit('change-level', id);
      }, stageId(n));
      await expect(page.locator('.level-badge')).toContainText(new RegExp(`ດ່ານ ${n}$`), { timeout: 12000 });
      await expect.poll(async () => (await bot.state()).scene, { timeout: 20000 }).toBe(stageId(n));
    }

    // Stage 10 is the last one loaded: the broken gate and the boss are there, and no exit
    const stage10 = await page.evaluate(() => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      return { gate: Boolean(scene.brokenGate), boss: Boolean(scene.boss), width: scene.level.worldWidth };
    });
    expect(stage10).toEqual({ gate: true, boss: true, width: 2400 });
    expect(errors).toEqual([]);
  });
});
