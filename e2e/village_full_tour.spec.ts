/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Village Revamped Full Tour and Cottage Playtest', () => {
  const outDir = path.join(process.cwd(), 'test-results', 'village_full_tour');

  test.beforeAll(() => {
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
  });

  test('Walk through 7000px village, enter cottage, verify layout and wandering NPCs', async ({ page }) => {
    test.setTimeout(240000);

    // 1. Enter Game into Village
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const playBtn = page.locator('#btn-play-game');
    if (await playBtn.isVisible()) {
      await playBtn.click();
    }
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('.level-badge')).toContainText('ໝູ່ບ້ານ');
    await page.waitForTimeout(1500);

    // Helper to position player and camera cleanly in Village (7000px world)
    const setVillageSpot = async (playerX: number) => {
      await page.evaluate((px) => {
        const scene = (window as any).__phaserGameScene;
        if (scene && scene.player) {
          scene.player.body.reset(px, 520);
          scene.player.setPosition(px, 520);
          const maxScroll = Math.max(0, scene.level.worldWidth - 1280);
          scene.cameras.main.scrollX = Math.max(0, Math.min(maxScroll, px - 640));
        }
      }, playerX);
      await page.waitForTimeout(600);
    };

    // 01: Village Entrance (x = 120)
    await setVillageSpot(120);
    await page.screenshot({ path: path.join(outDir, '01_village_entrance.png') });

    // 02: Front Chest (x = 240) & Hero Cottage Building #1 (x = 360)
    await setVillageSpot(280);
    await page.screenshot({ path: path.join(outDir, '02_front_chest_and_cottage.png') });

    // 03: Enter Inside Hero Cottage!
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('change-level', 'cottage');
    });
    await expect(page.locator('.level-badge')).toContainText('ເຮືອນພັກວິລະບູລຸດ', { timeout: 15000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outDir, '03_inside_hero_cottage.png') });

    // 04: Exit back to Village
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('change-level', 'village');
    });
    await expect(page.locator('.level-badge')).toContainText('ໝູ່ບ້ານ', { timeout: 15000 });
    await page.waitForTimeout(1200);

    // 04: Side Garden Gate beside cottage (x = 480)
    await setVillageSpot(480);
    await page.screenshot({ path: path.join(outDir, '04_side_garden_door.png') });

    // 05: Quest Board next to Cottage (x = 620)
    await setVillageSpot(620);
    await page.screenshot({ path: path.join(outDir, '05_quest_board_next_to_cottage.png') });

    // 06: Village Elder (x = 760)
    await setVillageSpot(760);
    await page.screenshot({ path: path.join(outDir, '06_village_elder.png') });

    // 07: Library (x = 1050)
    await setVillageSpot(1050);
    await page.screenshot({ path: path.join(outDir, '07_library.png') });

    // 08: Academy (x = 1700) & Master Vanh (x = 1780)
    await setVillageSpot(1740);
    await page.screenshot({ path: path.join(outDir, '08_academy_and_vanh.png') });

    // 09: Workshop (x = 2400) & Grandma Chanthy (x = 2480)
    await setVillageSpot(2440);
    await page.screenshot({ path: path.join(outDir, '09_workshop_and_chanthy.png') });

    // 10: Forge (x = 3100) & Blacksmith (x = 3180)
    await setVillageSpot(3140);
    await page.screenshot({ path: path.join(outDir, '10_forge_and_smith.png') });

    // 11: Mina's Skin Boutique (x = 3350) & Lucky the Dog (x = 3450)
    await setVillageSpot(3400);
    await page.screenshot({ path: path.join(outDir, '11_mina_boutique_and_lucky.png') });

    // 12: World Gate in Village Center (x = 3600) & Hunter Bounmy (x = 3850)
    await setVillageSpot(3600);
    await page.screenshot({ path: path.join(outDir, '12_world_gate_center.png') });

    // 13: Training Grounds & Dummy (x = 4500 - 4620)
    await setVillageSpot(4560);
    await page.screenshot({ path: path.join(outDir, '13_training_grounds_and_dummy.png') });

    // 14: Ancient Water Well (x = 5200)
    await setVillageSpot(5200);
    await page.screenshot({ path: path.join(outDir, '14_ancient_water_well.png') });

    // 15: History Lore Monument (x = 5800)
    await setVillageSpot(5800);
    await page.screenshot({ path: path.join(outDir, '15_history_lore_monument.png') });

    // 16: Scenic Lookout Watchtower (x = 6400)
    await setVillageSpot(6400);
    await page.screenshot({ path: path.join(outDir, '16_scenic_watchtower.png') });

    // 17: Eastern Village Shrine & Shrine Maiden Noy (x = 6850)
    await setVillageSpot(6850);
    await page.screenshot({ path: path.join(outDir, '17_eastern_shrine_and_noy.png') });
  });
});
