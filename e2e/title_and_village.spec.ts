import { test, expect } from '@playwright/test';

test.describe('Title Start Screen and Village Hub Transition E2E', () => {
  test('Starts on Title Screen, shows all menus, transitions to Village Hub, and exits back to Title', async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER [${msg.type()}]:`, msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    // 1. Open game
    await page.goto('/');
    await expect(page).toHaveTitle(/JO RUNNER/i);

    // 2. Verify Title Screen Header & Elements
    const titleCard = page.locator('.main-menu-card');
    await expect(titleCard).toBeVisible();

    const titleHero = page.locator('.main-menu-title');
    await expect(titleHero).toContainText('JO RUNNER');

    const editionBadge = page.locator('.title-edition-badge');
    await expect(editionBadge).toBeVisible();
    await expect(editionBadge).toContainText('CYBER EDITION');

    // Verify all menu buttons exist
    const playBtn = page.locator('#btn-play-game');
    await expect(playBtn).toBeVisible();
    await expect(playBtn).toContainText(/ເຂົ້າເກມ/i);

    // The coin shop and the old achievements are gone: Credit is only earned by learning
    await expect(page.locator('#menu-shop-btn')).toHaveCount(0);
    await expect(page.locator('#menu-achievements-btn')).toHaveCount(0);

    const stageBtn = page.locator('#menu-stage-select-btn');
    await expect(stageBtn).toBeVisible();

    // Skins are cosmetics bought with Credit
    await expect(page.locator('#menu-skins-btn')).toBeVisible();

    const settingsBtn = page.locator('#menu-settings-btn');
    await expect(settingsBtn).toBeVisible();

    // Verify player stats bar
    const statsBar = page.locator('.menu-stats-bar');
    await expect(statsBar).toBeVisible();

    // Capture Title Screen screenshot
    await page.screenshot({
      path: 'C:/Users/kitti/.gemini/antigravity-ide/brain/19865946-8b19-4609-b9f5-202555dcb966/title_screen_menu.png',
    });

    // 3. Click "ເຂົ້າເກມ (Play Game)" to enter Starter Village
    await playBtn.click();

    // Wait for transition to complete
    await expect(titleCard).not.toBeVisible({ timeout: 6000 });

    // 4. Verify HUD and Village Hub elements
    const hud = page.locator('.game-hud');
    await expect(hud).toBeVisible({ timeout: 8000 });

    // Verify Current Stage Label is "ໝູ່ບ້ານ"
    const stageBadge = page.locator('.level-badge');
    await expect(stageBadge).toBeVisible();
    await expect(stageBadge).toContainText(/ໝູ່ບ້ານ/i);

    // Verify Village Welcome Toast
    const welcomeToast = page.locator('.village-welcome-toast');
    await expect(welcomeToast).toBeVisible();
    await expect(welcomeToast).toContainText(/Cyber Village/i);

    // Capture Village Hub screenshot
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'C:/Users/kitti/.gemini/antigravity-ide/brain/19865946-8b19-4609-b9f5-202555dcb966/village_hub_entrance.png',
    });

    // 5. Open Pause Menu from HUD and exit back to Title Screen
    const hudMenuBtn = page.locator('#hud-menu-btn');
    await expect(hudMenuBtn).toBeVisible();
    await hudMenuBtn.click();
    const pauseMenu = page.locator('.pause-menu-card');
    await expect(pauseMenu).toBeVisible();

    const exitBtn = page.locator('#btn-exit-main-menu');
    await expect(exitBtn).toBeVisible();
    await exitBtn.click();

    // 6. Verify returned to Title Screen
    await expect(titleCard).toBeVisible({ timeout: 6000 });
    await expect(playBtn).toBeVisible();

    // 7. Verify Refresh Session Persistence:
    // Click play to enter village again
    await playBtn.click();
    await expect(hud).toBeVisible({ timeout: 8000 });
    await expect(stageBadge).toContainText(/ໝູ່ບ້ານ/i);

    // Refresh page
    await page.reload();

    // On reload, it should directly resume into Village with HUD visible, NOT Title screen
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.level-badge')).toContainText(/ໝູ່ບ້ານ/i);
    await expect(page.locator('.main-menu-card')).not.toBeVisible();
  });
});
