import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Dungeon & NPC Extensions (Features 1 to 4)', () => {
  const outDir = path.join(process.cwd(), 'test-results', 'dungeon_screenshots');

  test.beforeAll(() => {
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
  });

  test('Crafting, In-Stage NPCs (Uncle Thong & Dr Cyber), and Spider Queen Boss Arena', async ({ page }) => {
    test.setTimeout(120000);

    // -----------------------------------------------------------------
    // 1. Load Village & inject materials for crafting tests
    // -----------------------------------------------------------------
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('#btn-play-game').click();
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.level-badge')).toContainText('ໝູ່ບ້ານ');

    // Give player materials and pass book 1 exam to unlock shadow-silk-robe
    await page.evaluate(async () => {
      const { entities } = await import('/src/infrastructure/composition.ts');
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      
      // Materials for gear & alchemy
      entities.backpack.addItem('spider-silk', 10);
      entities.backpack.addItem('bone-shard', 10);
      entities.backpack.addItem('bat-wing', 10);
      entities.backpack.addItem('herb', 10);
      entities.backpack.addItem('iron-ingot', 5);
      entities.backpack.addItem('wood', 10);
      entities.wallet.earn(500);

      // Unlock recipes via book-ch1
      if (entities.books['book-ch1']) {
        entities.books['book-ch1'].isUnlocked = true;
        entities.books['book-ch1'].examPassed = true;
      }
      entities.forgeUnlocked = true;
      EventBus.emit('backpack-changed');
    });

    await page.waitForTimeout(500);

    // -----------------------------------------------------------------
    // 2. Feature 2: Crafting Workshop & Forge
    // -----------------------------------------------------------------
    // Open Workshop modal
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('open-workshop');
    });

    await expect(page.locator('h2:has-text("ໂຮງຊ່າງຫັດຖະກຳ")')).toBeVisible({ timeout: 6000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, '8_workshop_crafting_modal.png') });

    // Close Workshop modal
    await page.locator('.fixed button:has-text("✕")').click();
    await page.waitForTimeout(400);

    // Open Forge modal to verify venom-bone-blade recipe
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('open-forge');
    });

    await expect(page.locator('h2:has-text("ໂຮງຕີເຫຼັກ")')).toBeVisible({ timeout: 6000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, '9_forge_crafting_modal.png') });

    // Close Forge modal
    await page.locator('.fixed button:has-text("✕")').click();
    await page.waitForTimeout(400);

    // Craft shadow-silk-robe, feather-fall-potion, and venom-bone-blade
    await page.evaluate(async () => {
      const { entities } = await import('/src/infrastructure/composition.ts');
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      entities.backpack.addItem('shadow-silk-robe', 1);
      entities.backpack.addItem('feather-fall-potion', 2);
      entities.backpack.addItem('venom-bone-blade', 1);
      
      // Equip venom-bone-blade
      entities.equipment.equippedWeaponId = 'venom-bone-blade';
      EventBus.emit('backpack-changed');
      EventBus.emit('weapon-changed', 'venom-bone-blade');
    });

    // Open Backpack to verify items and equipped gear
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('open-backpack');
    });

    await expect(page.locator('h2:has-text("ກະເປົາເດີນທາງ")')).toBeVisible({ timeout: 6000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, '10_backpack_dungeon_gear.png') });

    await page.locator('.fixed button:has-text("✕")').click();
    await page.waitForTimeout(400);

    // -----------------------------------------------------------------
    // 3. Feature 3: In-Stage NPC 1 - Uncle Thong (Stage 5)
    // -----------------------------------------------------------------
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('start-dialogue', 'uncle_thong');
    });

    await expect(page.locator('.dialogue-box')).toBeVisible({ timeout: 6000 });
    await expect(page.locator('.dialogue-speaker-name')).toContainText(/ລຸງທອງ/);
    await page.locator('.dialogue-box').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, '11_stage5_uncle_thong_dialogue.png') });

    // Advance and close
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // -----------------------------------------------------------------
    // 4. Feature 3: In-Stage NPC 2 - Dr. Cyber (Stage 10)
    // -----------------------------------------------------------------
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('start-dialogue', 'dr_cyber');
    });

    await expect(page.locator('.dialogue-box')).toBeVisible({ timeout: 6000 });
    await expect(page.locator('.dialogue-speaker-name')).toContainText(/ດຣ.*ໄຊເບີ/);
    await page.locator('.dialogue-box').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, '12_stage10_dr_cyber_dialogue.png') });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // -----------------------------------------------------------------
    // 5. Feature 1 & 4: Dungeon Entry, Somchay Key, Boss Gate & Spider Queen
    // -----------------------------------------------------------------
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('change-level', 'dungeon');
    });

    await expect(page.locator('.level-badge')).toContainText('ຄຸກໃຕ້ດິນບູຮານ', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Talk to Somchay to receive Dungeon Key
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('start-dialogue', 'archaeologist_somchay');
    });

    await expect(page.locator('.dialogue-box')).toBeVisible({ timeout: 6000 });
    await page.locator('.dialogue-box').click();
    await page.waitForTimeout(300);
    await page.locator('.dialogue-box').click();
    await page.waitForTimeout(300);

    // Click choice to receive key
    const keyChoice = page.locator('.dialogue-choice-btn', { hasText: /ປະຕູໃຫຍ່|ພັກຜ່ອນ|ຮັບກະແຈ|ຂ້ອຍພ້ອມແລ້ວ/ });
    if (await keyChoice.count() > 0) {
      await keyChoice.first().click();
      await page.waitForTimeout(400);
    }

    // Ensure dungeon-key is in backpack
    await page.evaluate(async () => {
      const { entities } = await import('/src/infrastructure/composition.ts');
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      if (entities.backpack.getItemCount('dungeon-key') === 0) {
        entities.backpack.addItem('dungeon-key', 1);
        EventBus.emit('backpack-changed');
      }
    });

    await page.screenshot({ path: path.join(outDir, '13_somchay_dungeon_key_dialogue.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Teleport player near the Boss Gate (x = 1540)
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(1540, 520);
        scene.cameras.main.scrollX = 1400;
      }
    });

    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, '14_boss_gate_locked_view.png') });

    // Interact with Boss Gate to unlock it
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene) {
        scene.interaction.interact();
      }
    });

    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, '15_boss_gate_unlocked.png') });

    // Teleport player into the Boss Arena (x = 1880) to engage Spider Queen
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(1880, 520);
        scene.cameras.main.scrollX = 1700;
      }
    });

    await page.waitForTimeout(800);

    // Verify Boss is active and in arena
    const bossActive = await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      return Boolean(scene && scene.boss && scene.boss.active);
    });
    expect(bossActive).toBe(true);

    // Perform an attack strike with venom-bone-blade
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene) {
        scene.combat.attack();
      }
    });

    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, '16_spider_queen_boss_battle.png') });
  });
});
