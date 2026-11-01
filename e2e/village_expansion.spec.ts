import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Village Expansion & Overlap Fix Playtest', () => {
  const outDir = path.join(process.cwd(), 'test-results', 'village_expansion_screenshots');

  test.beforeAll(() => {
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
  });

  test('Village 2400px expansion, separated Elder & Quest Board, and new East Wing landmarks', async ({ page }) => {
    test.setTimeout(90000);

    // 1. Enter Village
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('#btn-play-game').click();
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.level-badge')).toContainText('ໝູ່ບ້ານ');
    await page.waitForTimeout(1000);

    // 2. Verify Village Elder (x = 410) & Quest Board (x = 510) separation
    // Teleport player to x = 410 near Elder
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(410, 520);
        scene.cameras.main.scrollX = 300;
      }
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, '01_elder_at_x410.png') });

    // Open Elder dialogue directly
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('start-dialogue', 'village_elder');
    });
    await expect(page.locator('.dialogue-box')).toBeVisible({ timeout: 5000 });
    await page.locator('.dialogue-box').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, '02_elder_dialogue_working.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // Teleport to x = 510 near Quest Board
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(510, 520);
        scene.cameras.main.scrollX = 400;
      }
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, '03_quest_board_at_x510.png') });

    // 3. Teleport into the new Expanded East Wing: Training Dummy at x = 1720
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(1720, 520);
        scene.cameras.main.scrollX = 1580;
        scene.interaction.interact();
      }
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, '04_training_dummy_strike.png') });

    // 4. Village Well at x = 1860
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(1860, 520);
        scene.cameras.main.scrollX = 1720;
        scene.interaction.interact();
      }
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, '05_village_well_healing.png') });

    // 5. History Lore Monument at x = 2000
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(2000, 520);
        scene.cameras.main.scrollX = 1860;
        scene.interaction.interact();
      }
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, '06_history_lore_monument.png') });

    // 6. Scenic Watchtower Platforms at x = 2250 (deck at y = 430)
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(2250, 420);
        scene.cameras.main.scrollX = 2050;
        scene.interaction.interact();
      }
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, '07_watchtower_scenic_deck.png') });

    // 7. Eastern Village Shrine at x = 2360
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(2360, 520);
        scene.cameras.main.scrollX = 2160;
        scene.interaction.interact();
      }
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, '08_eastern_village_shrine.png') });
  });
});

