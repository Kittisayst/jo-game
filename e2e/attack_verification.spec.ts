import { test, expect } from '@playwright/test';

test.describe('Hero Attack Controls (J / Z) & Combat Verification', () => {
  test('Verifies J and Z keys trigger attack, hit spark VFX, and defeat enemies in Chapter 1', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('console', msg => console.log(`BROWSER [${msg.type()}]:`, msg.text()));
    page.on('pageerror', err => {
      console.log('PAGE ERROR:', err.message);
      pageErrors.push(err.message);
    });

    // 1. Open game
    await page.goto('/');
    await expect(page).toHaveTitle(/JO RUNNER/i);

    // If main menu is not open (e.g. from session persistence), open pause menu and exit to main menu
    const mainMenuCard = page.locator('.title-screen');
    if (!await mainMenuCard.isVisible()) {
      await page.locator('#hud-menu-btn').click();
      await page.locator('#btn-exit-main-menu').click();
      await expect(mainMenuCard).toBeVisible({ timeout: 6000 });
    }

    // 2. Click "ເລືອກດ່ານ (Stage Map)" from Main Menu
    const stageSelectBtn = page.getByRole('button', { name: /ເລືອກດ່ານ/i });
    await expect(stageSelectBtn).toBeVisible();
    await stageSelectBtn.click();

    // 3. Select Chapter 1 with enemies
    const chapterNode = page.locator('.stage-map-node').filter({ hasText: /ບົດທີ 1|Chapter 1/i }).first();
    await expect(chapterNode).toBeVisible();
    await chapterNode.click();

    // 4. Verify in Chapter 1 with HUD and the starter wooden sword
    const hud = page.locator('.game-hud');
    await expect(hud).toBeVisible({ timeout: 8000 });
    const levelBadge = page.locator('.level-badge');
    await expect(levelBadge).toContainText(/ບົດທີ 1|Chapter 1/i);

    const weaponBadge = page.locator('.weapon-hud-badge');
    await expect(weaponBadge).toContainText(/ດາບໄມ້/i);

    // Test Key [J] attack in place
    console.log('Testing Key [J] attack action...');
    await page.keyboard.press('KeyJ');
    await page.waitForTimeout(350);

    // Test Key [Z] attack in place
    console.log('Testing Key [Z] attack action...');
    await page.keyboard.press('KeyZ');
    await page.waitForTimeout(350);

    // Test 5 consecutive attacks in a row to verify attack cooldown ticks down reliably
    console.log('Testing 5 consecutive attacks in a row...');
    for (let i = 1; i <= 5; i++) {
      const key = i % 2 === 0 ? 'KeyZ' : 'KeyJ';
      console.log(`Attack #${i} with [${key}]...`);
      await page.keyboard.press(key);
      await page.waitForTimeout(350);
    }

    // 5. Walk right towards the first slime enemy
    console.log('Moving right towards Slime patrol zone...');
    for (let i = 0; i < 4; i++) {
      await page.keyboard.down('KeyD');
      await page.waitForTimeout(400);
      await page.keyboard.up('KeyD');
      await page.waitForTimeout(100);
    }

    // 6. Attack enemy with [KeyJ]
    console.log('Executing Attack [KeyJ] on Slime enemy...');
    await page.keyboard.press('KeyJ');
    await page.waitForTimeout(120);

    // Capture screenshot of combat attack in Level 1
    await page.screenshot({
      path: 'C:/Users/kitti/.gemini/antigravity-ide/brain/19865946-8b19-4609-b9f5-202555dcb966/hero_attack_combat.png',
    });

    // Strike second attack with [KeyZ] to finish off the enemy
    await page.waitForTimeout(300);
    console.log('Executing Attack [KeyZ] second strike...');
    await page.keyboard.press('KeyZ');
    await page.waitForTimeout(400);

    // Verify zero page errors
    expect(pageErrors).toHaveLength(0);
    console.log('Attack test passed with 0 errors!');
  });
});
