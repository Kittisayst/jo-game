import { test, expect } from '@playwright/test';

test.describe('Achievements & Quests System E2E Verification', () => {
  test('Opens Achievement Modal from Main Menu, filters tabs, and verifies in-game HUD & Pause menu access', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
    page.on('pageerror', err => {
      console.log('PAGE ERROR:', err.message);
      pageErrors.push(err.message);
    });

    // 1. Open game
    await page.goto('/');
    await expect(page).toHaveTitle(/JO RUNNER/i);

    // 2. Main Menu should display Achievements button
    const menuAchBtn = page.locator('#menu-achievements-btn');
    await expect(menuAchBtn).toBeVisible({ timeout: 10000 });
    await expect(menuAchBtn).toContainText(/ຜົນສຳເລັດ/i);

    // 3. Click Achievements button to open modal
    await menuAchBtn.click();
    const modal = page.locator('.achievement-modal-card');
    await expect(modal).toBeVisible();

    // Verify modal header title and stats bar
    await expect(page.locator('.achievement-title-group h2')).toContainText(/ຜົນສຳເລັດ & ພາລະກິດ/i);
    await expect(page.locator('.achievement-overview-bar')).toBeVisible();

    // Verify all category tabs are clickable
    const tabs = page.locator('.achievement-tab-btn');
    await expect(tabs).toHaveCount(5); // all, combat, progression, mastery, economy

    // Click 'combat' tab
    await page.getByRole('button', { name: /ຕໍ່ສູ້/i }).click();
    await expect(page.locator('.achievement-card').first()).toBeVisible();

    // Click 'economy' tab
    await page.getByRole('button', { name: /ເສດຖະກິດ/i }).click();
    await expect(page.locator('.achievement-card').first()).toBeVisible();

    // Click back to 'all' tab
    await page.getByRole('button', { name: /ທັງໝົດ/i }).click();
    await expect(page.locator('.achievement-card')).toHaveCount(10); // exactly 10 achievements

    // Take screenshot of Trophy Room / Achievements Modal
    await page.waitForTimeout(600);
    await page.screenshot({
      path: 'C:/Users/kitti/.gemini/antigravity-ide/brain/19865946-8b19-4609-b9f5-202555dcb966/achievements_modal.png',
    });

    // 4. Close modal
    await page.locator('.achievement-close-btn').click();
    await expect(modal).not.toBeVisible();

    // 5. Enter game
    const playBtn = page.getByRole('button', { name: /ເຂົ້າເກມ/i });
    await playBtn.click();

    // Canvas should load
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // 6. Check HUD Achievements button
    const hudAchBtn = page.locator('#hud-achievements-btn');
    await expect(hudAchBtn).toBeVisible();
    await hudAchBtn.click();
    await expect(modal).toBeVisible();

    // Close modal from HUD
    await page.locator('.achievement-close-btn').click();
    await expect(modal).not.toBeVisible();

    // 7. Test in Pause Menu
    const hudMenuBtn = page.locator('#hud-menu-btn');
    await hudMenuBtn.click();
    const pauseCard = page.locator('.pause-menu-card');
    await expect(pauseCard).toBeVisible();

    const pauseAchBtn = page.locator('#pause-achievements-btn');
    await expect(pauseAchBtn).toBeVisible();
    await pauseAchBtn.click();
    await expect(modal).toBeVisible();

    // Close modal to return to pause menu
    await page.locator('.achievement-close-btn').click();
    await expect(modal).not.toBeVisible();

    // Resume game
    const resumeBtn = page.getByRole('button', { name: /ສືບຕໍ່ຫຼິ້ນ/i });
    await resumeBtn.click();
    await expect(pauseCard).not.toBeVisible();

    // Verify no page errors encountered
    expect(pageErrors).toHaveLength(0);
  });
});
