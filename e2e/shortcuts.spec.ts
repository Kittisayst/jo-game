import { test, expect, Page } from '@playwright/test';

/** Reads live game state through the dev server's module graph (same instance the app uses). */
async function readState (page: Page) {
  return page.evaluate(async () => {
    const { entities } = await import('/src/infrastructure/composition.ts');
    return {
      weapon: entities.equipment.equippedWeaponId,
      paused: entities.pauseState.isPaused,
      soundMuted: entities.settings.isSoundMuted,
    };
  });
}

test.describe('Keyboard shortcuts', () => {
  test('Q swaps the sword once per press; I and Esc work the backpack; Esc pauses only when nothing is open', async ({ page }) => {
    test.setTimeout(60000);
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();

    await page.getByRole('button', { name: /ເຂົ້າເກມ/i }).click();
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 12000 });
    await page.waitForTimeout(1000);

    // Carry a second sword so there is something to swap to
    await page.evaluate(async () => {
      const { entities } = await import('/src/infrastructure/composition.ts');
      entities.backpack.addItem('iron-sword', 1);
    });

    // Q: one press, one swap (it used to swap twice, ending on the same sword)
    expect((await readState(page)).weapon).toBe('wooden-sword');
    await page.keyboard.press('KeyQ');
    await expect.poll(async () => (await readState(page)).weapon).toBe('iron-sword');
    await page.keyboard.press('KeyQ');
    await expect.poll(async () => (await readState(page)).weapon).toBe('wooden-sword');

    // I opens the backpack, Esc closes that modal first and does not pause
    const backpackTitle = page.locator('text=(Backpack)').first();
    await page.keyboard.press('KeyI');
    await expect(backpackTitle).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(backpackTitle).not.toBeVisible();
    expect((await readState(page)).paused).toBe(false);

    // With nothing open, Esc pauses and the next Esc resumes
    await page.keyboard.press('Escape');
    await expect.poll(async () => (await readState(page)).paused).toBe(true);
    await page.keyboard.press('Escape');
    await expect.poll(async () => (await readState(page)).paused).toBe(false);

    // M toggles the sound
    const before = (await readState(page)).soundMuted;
    await page.keyboard.press('KeyM');
    await expect.poll(async () => (await readState(page)).soundMuted).toBe(!before);
  });
});
