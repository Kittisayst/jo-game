import { test, expect, Page } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { answerStageQuestion, makeHeroInvincible, openStage, walkOutOfStage } from './helpers/stage';

async function progress (page: Page): Promise<{ credit: number; open3: boolean; cleared2: boolean }>
{
  return page.evaluate(() => {
    const entities = (window as any).__entities;
    return {
      credit: entities.wallet.balance,
      open3: entities.stageProgression.isStageUnlocked('stage-003'),
      cleared2: entities.stageProgression.isStageCompleted('stage-002'),
    };
  });
}

test.describe('The question at the end of a Stage', () => {
  test('a right answer pays Credit once, and the next Stage opens', async ({ page }) => {
    test.setTimeout(120000);
    const bot = await openStage(page, 2);
    await makeHeroInvincible(page);
    const before = await progress(page);

    await walkOutOfStage(page, bot);
    await expect(page.getByTestId('stage-question')).toContainText('ຄຳຖາມທ້າຍດ່ານ 2');
    // The Stage is frozen until it is answered: nothing is cleared yet
    expect((await progress(page)).cleared2).toBe(false);

    await answerStageQuestion(page, true);
    await expect(page.locator('.level-badge')).toContainText(/ໝູ່ບ້ານ/, { timeout: 15000 });

    const after = await progress(page);
    expect(after.credit - before.credit).toBe(5);
    expect(after).toMatchObject({ cleared2: true, open3: true });
  });

  test('a wrong answer still clears the Stage and opens the next one, but pays nothing', async ({ page }) => {
    test.setTimeout(120000);
    const bot = await openStage(page, 2);
    await makeHeroInvincible(page);
    const before = await progress(page);

    await walkOutOfStage(page, bot);
    await answerStageQuestion(page, false);
    await expect(page.locator('.level-badge')).toContainText(/ໝູ່ບ້ານ/, { timeout: 15000 });

    const after = await progress(page);
    expect(after.credit).toBe(before.credit);
    expect(after).toMatchObject({ cleared2: true, open3: true });
  });
});
