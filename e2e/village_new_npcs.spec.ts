import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Village New NPCs Playtest', () => {
  const outDir = path.join(process.cwd(), 'test-results', 'village_new_npcs_screenshots');

  test.beforeAll(() => {
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
  });

  test('Interact with Master Vanh, Grandma Chanthy, Swordsman Kham, and Shrine Maiden Noy', async ({ page }) => {
    test.setTimeout(90000);

    // 1. Enter Village
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('#btn-play-game').click();
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.level-badge')).toContainText('ໝູ່ບ້ານ');
    await page.waitForTimeout(1000);

    // 2. Master Vanh (x = 680) outside Academy
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(680, 520);
        scene.cameras.main.scrollX = 540;
      }
    });
    await page.waitForTimeout(400);

    // Start Master Vanh dialogue
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('start-dialogue', 'master_vanh');
    });
    await expect(page.locator('.dialogue-box')).toBeVisible({ timeout: 6000 });
    await expect(page.locator('.dialogue-speaker-name')).toContainText(/ອາຈານ.*ວັນ/);
    await page.locator('.dialogue-box').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, '01_master_vanh_dialogue.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // 3. Grandma Chanthy (x = 950) outside Garden door
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(950, 520);
        scene.cameras.main.scrollX = 810;
      }
    });
    await page.waitForTimeout(400);

    // Start Grandma Chanthy dialogue
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('start-dialogue', 'grandma_chanthy');
    });
    await expect(page.locator('.dialogue-box')).toBeVisible({ timeout: 6000 });
    await expect(page.locator('.dialogue-speaker-name')).toContainText(/ແມ່ເຖົ້າ.*ຈັນທີ/);
    await page.locator('.dialogue-box').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, '02_grandma_chanthy_dialogue.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // 4. Swordsman Kham (x = 1660) at Training Grounds
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(1660, 520);
        scene.cameras.main.scrollX = 1520;
      }
    });
    await page.waitForTimeout(400);

    // Start Swordsman Kham dialogue
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('start-dialogue', 'swordsman_kham');
    });
    await expect(page.locator('.dialogue-box')).toBeVisible({ timeout: 6000 });
    await expect(page.locator('.dialogue-speaker-name')).toContainText(/ນັກດາບ.*ຄຳ/);
    await page.locator('.dialogue-box').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, '03_swordsman_kham_dialogue.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // 5. Shrine Maiden Noy (x = 2310) at Eastern Shrine
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(2310, 520);
        scene.cameras.main.scrollX = 2170;
      }
    });
    await page.waitForTimeout(400);

    // Start Shrine Maiden Noy dialogue
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('start-dialogue', 'shrine_noy');
    });
    await expect(page.locator('.dialogue-box')).toBeVisible({ timeout: 6000 });
    await expect(page.locator('.dialogue-speaker-name')).toContainText(/ນາງນ້ອຍ/);
    await page.locator('.dialogue-box').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, '04_shrine_noy_dialogue.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  });
});

