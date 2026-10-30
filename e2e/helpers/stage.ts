/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, Page } from '@playwright/test';
import { Bot } from './bot';

/**
 * Opens the stage map from the title menu and enters Stage `stageNumber`, like a player would.
 * Only an open (unlocked) Stage can be entered, Stage 1 always is; for a later Stage unlock it first
 * with `unlockStages`.
 */
export async function enterStage (page: Page, stageNumber: number): Promise<void>
{
  await page.getByRole('button', { name: /ເລືອກດ່ານ/i }).click();
  const cell = page.getByRole('button', { name: new RegExp(`^ດ່ານ ${stageNumber}: `) });
  await expect(cell).toBeVisible();
  await cell.click();
}

/** Marks Stages 1..`upTo` as open in the live game state, as if the player had cleared the ones before. */
export async function unlockStages (page: Page, upTo: number): Promise<void>
{
  await page.evaluate(async (last: number) =>
  {
    const entities = (window as any).__entities; // the app's own state (a second import() can be a second copy)
    for (let n = 1; n <= last; n++) entities.stageProgression.unlockStage(`stage-${String(n).padStart(3, '0')}`);
  }, upTo);
}

/** Opens Stage `n` straight from the address (`?stage=N`, development only) and waits until it is running. */
export async function openStage (page: Page, n: number): Promise<Bot>
{
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  await page.goto(`/?stage=${n}`);
  await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('.level-badge')).toContainText(new RegExp(`ດ່ານ ${n}`), { timeout: 12000 });

  const bot = new Bot(page, false);
  await expect.poll(async () => (await bot.state()).scene, { timeout: 20000 }).toBe(`stage-${String(n).padStart(3, '0')}`);
  return bot;
}

/** Where walking out clears the running Stage. */
export async function exitXOf (page: Page): Promise<number>
{
  return page.evaluate(() => (window as any).__botGame.scene.getScene('Game').stageExitX as number);
}

export async function makeHeroInvincible (page: Page): Promise<void>
{
  await page.evaluate(() => { (window as any).__botGame.scene.getScene('Game').player.isInvincible = true; });
}

/**
 * Walks the hero out of the running Stage through its exit, until the Stage's question opens. The Stage freezes
 * the moment the hero passes the exit marker, so the walk ends there instead of at a position. A spec that only
 * cares whether the way can be walked passes `fight: false` (the hero is invincible; the combat bot is slow
 * and flaky when three specs share the CPU).
 */
export async function walkOutOfStage (page: Page, bot: Bot, options: { fight?: boolean } = {}): Promise<void>
{
  await bot.state(); // lets the helpers find the running game
  const exitX = await exitXOf(page);
  const modal = page.getByTestId('stage-question');
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline && !(await modal.isVisible())) {
    await bot.goTo(exitX + 55, { tolerance: 15, timeoutMs: 3000, fight: options.fight ?? true });
  }
  await expect(modal).toBeVisible({ timeout: 1000 });
}

/**
 * Answers the question that opens when the hero walks out of a Stage, rightly or wrongly (the right option is
 * looked up in the loaded content by the question text), then presses "back to the village".
 */
export async function answerStageQuestion (page: Page, correct: boolean): Promise<void>
{
  const modal = page.getByTestId('stage-question');
  await expect(modal).toBeVisible({ timeout: 15000 });

  const text = (await page.getByTestId('stage-question-text').innerText()).trim();
  const correctIndex = await page.evaluate(async (questionText: string) => {
    const questions = await (await fetch('/data/questions.json')).json();
    return questions.find((q: { question: string }) => q.question === questionText).correctIndex as number;
  }, text);

  const optionCount = await page.getByTestId('stage-question-option').count();
  const choice = correct ? correctIndex : (correctIndex + 1) % optionCount;
  await page.getByTestId('stage-question-option').nth(choice).click();
  await page.getByTestId('stage-question-submit').click();
  await page.getByTestId('stage-question-continue').click();
}
