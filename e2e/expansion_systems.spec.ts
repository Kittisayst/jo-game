/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Multi-System Expansion Playtest & Tour', () => {
  const outDir = path.join(process.cwd(), 'test-results', 'expansion_tour');

  test.beforeAll(() => {
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
  });

  test('Verify Garden Overhaul, World Gate Dungeon, Pet Companion, and Quest 3 Tabs + HUD Tracker', async ({ page }) => {
    test.setTimeout(120000);

    // 1. Enter Village
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const playBtn = page.locator('#btn-play-game');
    if (await playBtn.isVisible()) {
      await playBtn.click();
    }
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('.level-badge')).toContainText('ໝູ່ບ້ານ');
    await page.waitForTimeout(1200);

    // Set 1000 credits to allow pet buying smoothly
    await page.evaluate(() => {
      const dev = window as any;
      if (dev.__entities) {
        dev.__entities.wallet.setBalance(1000);
      }
    });

    // ==========================================
    // MODULE 1: Garden Overhaul (2 Exits, Visuals)
    // ==========================================
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('change-level', 'garden');
    });
    await expect(page.locator('.level-badge')).toContainText('ສວນຜັກ', { timeout: 15000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outDir, '01_garden_overhaul_2_exits.png') });

    // ==========================================
    // MODULE 2: World Gate & Dungeon Entry
    // ==========================================
    // Return to village center (x = 3600)
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('change-level', 'village');
    });
    await expect(page.locator('.level-badge')).toContainText('ໝູ່ບ້ານ', { timeout: 15000 });
    await page.waitForTimeout(800);

    // Teleport player & camera to World Gate (x = 3600)
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.body.reset(3600, 520);
        scene.player.setPosition(3600, 520);
        scene.cameras.main.scrollX = 3600 - 640;
      }
    });
    await page.waitForTimeout(600);

    // Open World Gate (StageMapModal)
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('open-stage-map');
    });
    const dungeonBtn = page.getByRole('button', { name: /ຄຸກໃຕ້ດິນ/i });
    await expect(dungeonBtn).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(outDir, '02_world_gate_with_dungeon.png') });

    // Click to enter Dungeon-001
    await dungeonBtn.click();
    await expect(page.locator('.level-badge')).toContainText('ຄຸກໃຕ້ດິນ', { timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(outDir, '03_inside_dungeon_001.png') });

    // ==========================================
    // MODULE 3: Pet Companion System (Buy & Equip)
    // ==========================================
    // Return to village
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('change-level', 'village');
    });
    await expect(page.locator('.level-badge')).toContainText('ໝູ່ບ້ານ', { timeout: 15000 });
    await page.waitForTimeout(800);

    // Open Pet Shop Modal & ensure 1000 credits
    await page.evaluate(async () => {
      const dev = window as any;
      if (dev.__entities) {
        dev.__entities.wallet.setBalance(1000);
      }
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('open-pet-shop');
    });
    const petShopModal = page.locator('.pet-shop-modal');
    await expect(petShopModal).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(outDir, '04_pet_shop_modal.png') });

    // Buy Lucky the Dog (80 C)
    const buyLuckyBtn = petShopModal.locator('button').filter({ hasText: '80 C' });
    await expect(buyLuckyBtn).toBeEnabled({ timeout: 5000 });
    await buyLuckyBtn.click();
    await page.waitForTimeout(800);

    // Close Pet Shop Modal
    const closePetBtn = petShopModal.locator('button[aria-label="Close"]');
    await closePetBtn.click();
    await expect(petShopModal).toBeHidden({ timeout: 5000 });
    await page.waitForTimeout(800);

    // Walk slightly to see Lucky companion running behind hero
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(800);
    await page.keyboard.up('KeyD');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, '05_lucky_dog_following_hero.png') });

    // ==========================================
    // MODULE 4: Quest System (3 Tabs) & Toggleable HUD Tracker
    // ==========================================
    // Open Quest Board Modal
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('open-quest-board');
    });
    const questModal = page.locator('.quest-board-modal');
    await expect(questModal).toBeVisible({ timeout: 10000 });

    // Switch to Daily Tab
    const dailyTab = questModal.locator('button').filter({ hasText: 'Daily' });
    await dailyTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, '06_quest_board_daily_tab.png') });

    // Accept a Daily Quest (Click "📥 ຮັບພາລະກິດ")
    const acceptBtn = questModal.locator('button').filter({ hasText: 'ຮັບພາລະກິດ' }).first();
    await acceptBtn.click();
    await page.waitForTimeout(800);

    // Close Quest Board Modal
    const closeQuestBtn = questModal.locator('button[aria-label="Close"]');
    await closeQuestBtn.click();
    await expect(questModal).toBeHidden({ timeout: 5000 });
    await page.waitForTimeout(800);

    // Verify QuestTrackerHud is visible in expanded view
    const trackerHud = page.locator('.quest-tracker-hud');
    await expect(trackerHud).toBeVisible();
    await page.screenshot({ path: path.join(outDir, '07_quest_hud_tracker_expanded.png') });

    // Toggle minimize Quest Tracker HUD
    const minimizeBtn = trackerHud.getByTitle(/ຫຍໍ້ເກັບໄວ້/i);
    await minimizeBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, '08_quest_hud_tracker_minimized.png') });
  });
});
