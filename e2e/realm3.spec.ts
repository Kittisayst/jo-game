/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';
import { answerStageQuestion, exitXOf, makeHeroInvincible, openStage, walkOutOfStage } from './helpers/stage';

const stageKey = (n: number) => `stage-${String(n).padStart(3, '0')}`;

test.describe('Realm 3: the Desert (Stages 21 to 30)', () => {
  for (const n of [21, 22, 23, 24, 25, 26, 27, 28, 29, 30]) {
    test(`Stage ${n} opens and has something to harvest or fight`, async ({ page }) => {
      const bot = await openStage(page, n);
      const state = await bot.state();
      expect(state.scene).toBe(stageKey(n));

      const nodes = await page.evaluate(() => (window as any).__botGame.scene.getScene('Game').resourceNodes?.length ?? -1);
      // Stage 30 is the boss arena: the Boss, plus a few things to harvest on the way
      if (n === 30) expect(state.boss).not.toBeNull();
      else expect(state.enemies.length + (nodes > 0 ? nodes : 0)).toBeGreaterThan(0);
    });
  }

  test('Stage 22 can be walked to its exit, and its question comes from the Realm 3 lesson', async ({ page }) => {
    test.setTimeout(120000);
    const bot = await openStage(page, 22);
    await makeHeroInvincible(page);
    expect(await exitXOf(page)).toBeGreaterThan(2000);

    await walkOutOfStage(page, bot, { fight: false });
    const asked = (await page.getByTestId('stage-question-text').innerText()).trim();
    const lesson = await page.evaluate(async (text: string) => {
      const all = (await (await fetch('/data/questions.json')).json()) as { question: string; lesson: string }[];
      return all.find(q => q.question === text)?.lesson;
    }, asked);
    expect(lesson).toBe('22-1');

    await answerStageQuestion(page, true);
    await expect(page.locator('.level-badge')).toContainText(/ໝູ່ບ້ານ/, { timeout: 15000 });
  });

  test('the Stage 30 Boss finisher asks from the Realm 3 Textbook and the Boss drops yellow Portal shards', async ({ page }) => {
    test.setTimeout(90000);
    const bot = await openStage(page, 30);
    await makeHeroInvincible(page);
    expect((await bot.state()).boss?.maxHp).toBeGreaterThanOrEqual(600);

    // The Boss's own "defeated" hook opens the finisher, as the last hit does
    await page.evaluate(() => (window as any).__botGame.scene.getScene('Game').boss.onDefeated());
    const finisher = page.getByTestId('quiz-finisher');
    await expect(finisher).toBeVisible();

    const text = (await finisher.locator('.font-bold.text-white').first().innerText()).trim();
    const fromBook = await page.evaluate(async (question: string) => {
      const res = await fetch('/data/questions.json');
      const all = (await res.json()) as { question: string; bookId: string }[];
      return all.find(q => q.question === question)?.bookId;
    }, text);
    expect(fromBook).toBe('book-ch3');

    // A right answer ends the fight: the reward is the Boss's drop table
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('quiz-finisher-passed');
    });
    await expect.poll(() => page.evaluate(() => (window as any).__entities.backpack.getItemCount('portal-shard-yellow'))).toBe(3);
  });
});
