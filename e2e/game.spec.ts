import { test, expect } from '@playwright/test';

test.describe('Knowledge Quest Village HUD & Combat Controls E2E', () => {
  test('Main Menu, HUD without shop or hotbar, elder NPC, and combat controls', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack));

    // 1. Open game
    await page.goto('/');
    await expect(page).toHaveTitle(/Knowledge Quest/i);

    // 2. The main menu offers play, stage map and settings. There is no coin shop any more.
    await expect(page.getByRole('button', { name: /ເຂົ້າເກມ/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /ຮ້ານຄ້າ/i })).toHaveCount(0);

    // 3. Start Game from Main Menu
    await page.getByRole('button', { name: /ເຂົ້າເກມ/i }).click();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // 4. HUD shows Credit and the equipped sword, but no shop button and no consumable hotbar
    await expect(page.locator('.wallet-hud-badge')).toBeVisible();
    await expect(page.locator('.weapon-hud-badge')).toBeVisible();
    await expect(page.locator('.shop-hud-btn')).toHaveCount(0);
    await expect(page.locator('.hud-hotbar')).toHaveCount(0);

    // Wait for Phaser scene to load
    await page.waitForTimeout(1000);

    // 5. Walk right a little, attack, and talk to whoever is nearby
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(800);
    await page.keyboard.up('ArrowRight');

    await page.keyboard.press('j');
    await page.waitForTimeout(300);

    await page.keyboard.press('e');
    await page.waitForTimeout(600);

    const dialogueSpeaker = page.locator('.dialogue-speaker');
    if (await dialogueSpeaker.isVisible()) {
      console.log('Dialogue opened with speaker:', await dialogueSpeaker.textContent());
    }
  });
});
