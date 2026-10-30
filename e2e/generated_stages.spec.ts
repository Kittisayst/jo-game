import { test, expect } from '@playwright/test';
import { answerStageQuestion, exitXOf, makeHeroInvincible, openStage, walkOutOfStage } from './helpers/stage';

test.describe('Generated stages', () => {
  for (const n of [3, 7]) {
    test(`Stage ${n} can be walked from the start to its exit`, async ({ page }) => {
      test.setTimeout(120000);
      const bot = await openStage(page, n);
      await makeHeroInvincible(page);

      expect(await exitXOf(page)).toBeGreaterThan(1400);
      await walkOutOfStage(page, bot);

      // Walking out asks the Stage's question, then clears it and sends the hero home
      await answerStageQuestion(page, true);
      await expect(page.locator('.level-badge')).toContainText(/ໝູ່ບ້ານ/, { timeout: 15000 });
    });
  }

  test('Stage 9 has tougher golems than the plain data says', async ({ page }) => {
    const bot = await openStage(page, 9);
    const golems = (await bot.state()).enemies.filter(e => e.id === 'rock-golem');
    expect(golems.length).toBeGreaterThan(0);
    // rock-golem has 60 HP in enemies.json; +8 % of that per Stage after the first
    for (const golem of golems) expect(golem.hp).toBeGreaterThan(60);
  });
});
