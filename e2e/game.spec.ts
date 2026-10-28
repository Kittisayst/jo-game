import { test, expect } from '@playwright/test';

test.describe('JO RUNNER Combat & Shop Systems E2E', () => {
  test('Main Menu, Cyber Shop modal, HUD, Mina NPC, and Combat Controls', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack));

    // 1. Open game
    await page.goto('/');
    await expect(page).toHaveTitle(/JO RUNNER/i);

    // 2. Verify Main Menu contains Cyber Shop button
    const shopBtn = page.getByRole('button', { name: /ຮ້ານຄ້າ/i });
    await expect(shopBtn).toBeVisible();

    // 3. Open Cyber Shop from Main Menu
    await shopBtn.click();
    const shopTitle = page.locator('.shop-title');
    await expect(shopTitle).toBeVisible();
    await expect(shopTitle).toContainText(/CYBER SHOP/i);

    // Verify tabs
    await expect(page.getByRole('button', { name: /ອາວຸດ/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /ອັບເກຣດ/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /ໄອເທັມ/i })).toBeVisible();

    // Take screenshot of Shop Modal
    await page.screenshot({
      path: 'C:/Users/kitti/.gemini/antigravity-ide/brain/19865946-8b19-4609-b9f5-202555dcb966/test_shop_modal.png',
    });

    // 4. Close Shop Modal
    const closeBtn = page.locator('.shop-close-btn');
    await closeBtn.click();
    await expect(shopTitle).not.toBeVisible();

    // 5. Start Game from Main Menu
    const startBtn = page.getByRole('button', { name: /ເຂົ້າເກມ/i });
    await startBtn.click();

    // Wait for canvas to be present
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // 6. Verify HUD elements
    const walletBadge = page.locator('.wallet-hud-badge');
    await expect(walletBadge).toBeVisible();

    const weaponBadge = page.locator('.weapon-hud-badge');
    await expect(weaponBadge).toBeVisible();

    const hudShopBtn = page.locator('.shop-hud-btn');
    await expect(hudShopBtn).toBeVisible();

    const hudHotbar = page.locator('.hud-hotbar');
    await expect(hudHotbar).toBeVisible();

    // Wait for Phaser scene to load
    await page.waitForTimeout(1000);

    // 7. Walk right towards Merchant Mina
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(1200);
    await page.keyboard.up('ArrowRight');

    // 8. Test Combat Inputs
    // Press 'j' to attack (melee slash)
    await page.keyboard.press('j');
    await page.waitForTimeout(300);

    // Press 'Shift' to dash
    await page.keyboard.press('Shift');
    await page.waitForTimeout(400);

    // Press 'e' to talk to Mina or Elder
    await page.keyboard.press('e');
    await page.waitForTimeout(600);

    // Check if dialogue opened
    const dialogueSpeaker = page.locator('.dialogue-speaker');
    if (await dialogueSpeaker.isVisible()) {
      console.log('Dialogue opened with speaker:', await dialogueSpeaker.textContent());
    }

    // 9. Take final gameplay screenshot
    await page.screenshot({
      path: 'C:/Users/kitti/.gemini/antigravity-ide/brain/19865946-8b19-4609-b9f5-202555dcb966/test_gameplay.png',
    });
  });
});
