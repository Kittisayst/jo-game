import { expect, Page } from '@playwright/test';

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
    const { entities } = await import('/src/infrastructure/composition.ts');
    for (let n = 1; n <= last; n++) entities.stageProgression.unlockStage(`stage-${String(n).padStart(3, '0')}`);
  }, upTo);
}
