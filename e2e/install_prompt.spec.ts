/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, Page } from '@playwright/test';

/** Plays the browser's part: offers the install (as Chrome does when the game can be installed). */
async function offerInstall (page: Page, outcome: 'accepted' | 'dismissed' = 'accepted')
{
  await page.evaluate((choice: string) => {
    const event: any = new Event('beforeinstallprompt', { cancelable: true });
    (window as any).__prompted = 0;
    event.prompt = async () => { (window as any).__prompted++; };
    event.userChoice = Promise.resolve({ outcome: choice });
    window.dispatchEvent(event);
  }, outcome);
}

test.describe('Install the game as an app', () => {
  test('the title screen shows an Install banner when the browser offers it, and the button opens the browser dialog once', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/ເຂົ້າເກມ \(Play Game\)/)).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('install-banner')).toHaveCount(0);

    await offerInstall(page);
    await expect(page.getByTestId('install-banner')).toBeVisible();
    await page.getByTestId('install-button').click();
    await expect.poll(() => page.evaluate(() => (window as any).__prompted)).toBe(1);
    // The offer can be used once: the banner goes away
    await expect(page.getByTestId('install-banner')).toHaveCount(0);
  });

  test('✕ hides the banner for good, and Settings still has the Install button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/ເຂົ້າເກມ \(Play Game\)/)).toBeVisible({ timeout: 20000 });
    await offerInstall(page);
    await page.getByTestId('install-banner').getByRole('button', { name: 'ປິດ' }).click();
    await expect(page.getByTestId('install-banner')).toHaveCount(0);

    await page.reload();
    await expect(page.getByText(/ເຂົ້າເກມ \(Play Game\)/)).toBeVisible({ timeout: 20000 });
    await offerInstall(page);
    await page.waitForTimeout(300);
    await expect(page.getByTestId('install-banner')).toHaveCount(0);

    // Settings (from the pause menu in the game) keeps an Install button
    await page.getByText(/ເຂົ້າເກມ \(Play Game\)/).click();
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /ຕັ້ງຄ່າ|Settings/ }).first().click();
    await page.getByTestId('settings-install-button').click();
    await expect.poll(() => page.evaluate(() => (window as any).__prompted)).toBe(1);
  });

  test('nothing is shown when the browser does not offer an install', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/ເຂົ້າເກມ \(Play Game\)/)).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(500);
    await expect(page.getByTestId('install-banner')).toHaveCount(0);
  });
});
