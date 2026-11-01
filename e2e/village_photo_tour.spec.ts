import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Village Full Photo Tour', () => {
  const outDir = path.join(process.cwd(), 'test-results', 'village_photo_tour');

  test.beforeAll(() => {
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
  });

  test('Walk through Village, stand beside each new NPC, trigger speech bubbles and dialogues', async ({ page }) => {
    test.setTimeout(120000);

    // 1. Enter Village
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('#btn-play-game').click();
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.level-badge')).toContainText('ໝູ່ບ້ານ');
    await page.waitForTimeout(1000);

    // -------------------------------------------------------------
    // PHOTO 1 & 2: Master Vanh (Academy Scholar) at x = 680
    // -------------------------------------------------------------
    // Walk/teleport hero right next to Master Vanh to show speech bubble
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(650, 520);
        scene.cameras.main.scrollX = 480;
      }
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, '01_master_vanh_field_view.png') });

    // Open dialogue
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('start-dialogue', 'master_vanh');
    });
    await expect(page.locator('.dialogue-box')).toBeVisible({ timeout: 6000 });
    await page.locator('.dialogue-box').click();
    await page.waitForTimeout(400);

    // Click Quiz choice
    const quizChoice = page.locator('.dialogue-choice-btn', { hasText: /ທົດສອບຄວາມຮູ້|Mini-Quiz/ });
    if (await quizChoice.count() > 0) {
      await quizChoice.first().click();
      await page.waitForTimeout(400);
    }
    await page.screenshot({ path: path.join(outDir, '02_master_vanh_quiz_dialogue.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // -------------------------------------------------------------
    // PHOTO 3 & 4: Grandma Chanthy (Herbalist) at x = 950
    // -------------------------------------------------------------
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(920, 520);
        scene.cameras.main.scrollX = 750;
      }
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, '03_grandma_chanthy_field_view.png') });

    // Open dialogue
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('start-dialogue', 'grandma_chanthy');
    });
    await expect(page.locator('.dialogue-box')).toBeVisible({ timeout: 6000 });
    await page.locator('.dialogue-box').click();
    await page.waitForTimeout(400);

    // Click gift choice
    const giftChoice = page.locator('.dialogue-choice-btn', { hasText: /ເມັດພັນ|ແບ່ງປັນ/ });
    if (await giftChoice.count() > 0) {
      await giftChoice.first().click();
      await page.waitForTimeout(400);
    }
    await page.screenshot({ path: path.join(outDir, '04_grandma_chanthy_gift_dialogue.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // -------------------------------------------------------------
    // PHOTO 5 & 6: Swordsman Kham at x = 1660 (Training Grounds)
    // -------------------------------------------------------------
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(1630, 520);
        scene.cameras.main.scrollX = 1460;
      }
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, '05_swordsman_kham_field_view.png') });

    // Open dialogue
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('start-dialogue', 'swordsman_kham');
    });
    await expect(page.locator('.dialogue-box')).toBeVisible({ timeout: 6000 });
    await page.locator('.dialogue-box').click();
    await page.waitForTimeout(400);

    // Click weapon tiers choice
    const weaponChoice = page.locator('.dialogue-choice-btn', { hasText: /ດາບກະດູກ|ດາບພິດ|ພິເສດ/ });
    if (await weaponChoice.count() > 0) {
      await weaponChoice.first().click();
      await page.waitForTimeout(400);
    }
    await page.screenshot({ path: path.join(outDir, '06_swordsman_kham_tiers_dialogue.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // -------------------------------------------------------------
    // PHOTO 7 & 8: Shrine Maiden Noy at x = 2310 (Eastern Shrine)
    // -------------------------------------------------------------
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(2280, 520);
        scene.cameras.main.scrollX = 2100;
      }
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, '07_shrine_noy_field_view.png') });

    // Open dialogue
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('start-dialogue', 'shrine_noy');
    });
    await expect(page.locator('.dialogue-box')).toBeVisible({ timeout: 6000 });
    await page.locator('.dialogue-box').click();
    await page.waitForTimeout(400);

    // Click fortune slip choice
    const fortuneChoice = page.locator('.dialogue-choice-btn', { hasText: /ຊຽມຊີ|ທຳນວາຍ/ });
    if (await fortuneChoice.count() > 0) {
      await fortuneChoice.first().click();
      await page.waitForTimeout(400);
    }
    await page.screenshot({ path: path.join(outDir, '08_shrine_noy_fortune_dialogue.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });
});

