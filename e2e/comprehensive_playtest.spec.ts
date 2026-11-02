/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';

test.describe('Knowledge Quest - Comprehensive Gameplay & Asset Playtest', () => {
  test.setTimeout(90000);

  test('01. Village Hub: Exploration & Controls', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    await page.goto('/');
    await expect(page).toHaveTitle(/Knowledge Quest/i);

    // Enter game
    const enterBtn = page.getByRole('button', { name: /ເຂົ້າເກມ/i });
    await expect(enterBtn).toBeVisible();
    await enterBtn.click();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 15000 });

    // Wait for scene to settle
    await page.waitForTimeout(1000);

    // Walk right and jump
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(600);
    await page.keyboard.up('ArrowRight');

    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(400);

    // Interact with Elder NPC
    await page.keyboard.press('e');
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'test-results/playtest/01-village-exploration.png' });
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });

  test('02. Realm 1 Combat & Slash VFX (Stage 1)', async ({ page }) => {
    await page.goto('/?stage=1');
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(1500);

    // Equip iron-sword
    await page.evaluate(() => {
      const entities = (window as any).__entities;
      if (entities) {
        entities.equipment.equipWeapon('iron-sword');
      }
    });
    await page.waitForTimeout(400);

    // Walk toward forest slime at x=800
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(720, scene.player.y);
      }
    });
    await page.waitForTimeout(500);

    // Attack slime with sword swing and slash VFX
    await page.keyboard.press('j');
    await page.waitForTimeout(80);
    await page.screenshot({ path: 'test-results/playtest/02-stage1-forest-combat.png' });
  });

  test('03. Realm 2 Crystal Realm: Blue Sword, VFX & Crystal Enemies (Stage 11 & 15)', async ({ page }) => {
    await page.goto('/?stage=11');
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(1500);

    // Equip blue-sword
    await page.evaluate(() => {
      const entities = (window as any).__entities;
      if (entities) {
        entities.equipment.equipWeapon('blue-sword');
      }
    });
    await page.waitForTimeout(300);

    // Move close to first crystal enemy
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(400, scene.player.y);
      }
    });
    await page.waitForTimeout(400);

    // Trigger attack to capture blue slash VFX
    await page.keyboard.press('j');
    await page.waitForTimeout(60);
    await page.screenshot({ path: 'test-results/playtest/03-realm2-blue-slash.png' });

    // Now go to Stage 15 to test Crystal Warden Miniboss
    await page.goto('/?stage=15');
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(1500);

    // Equip blue-sword and position near miniboss arena (x=1650)
    await page.evaluate(() => {
      const entities = (window as any).__entities;
      if (entities) entities.equipment.equipWeapon('blue-sword');
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(1520, scene.player.y);
      }
    });
    await page.waitForTimeout(600);

    // Hero attacks Miniboss
    await page.keyboard.press('j');
    await page.waitForTimeout(100);
    await page.screenshot({ path: 'test-results/playtest/04-stage15-crystal-warden-fight.png' });
  });

  test('04. Realm 2 Boss: Network Core Overlord (Stage 20)', async ({ page }) => {
    await page.goto('/?stage=20');
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(1500);

    // Equip blue-sword and teleport player to boss arena (x=1560)
    await page.evaluate(() => {
      const entities = (window as any).__entities;
      if (entities) entities.equipment.equipWeapon('blue-sword');
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(1560, scene.player.y);
      }
    });
    await page.waitForTimeout(800);

    // Attack boss
    await page.keyboard.press('j');
    await page.waitForTimeout(100);
    await page.screenshot({ path: 'test-results/playtest/05-stage20-network-core-boss.png' });
  });

  test('05. Realm 3 Sand Realm: Copper Sword, VFX & Sand Enemies (Stage 21 & 25)', async ({ page }) => {
    await page.goto('/?stage=21');
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(1500);

    // Equip copper-sword
    await page.evaluate(() => {
      const entities = (window as any).__entities;
      if (entities) {
        entities.equipment.equipWeapon('copper-sword');
      }
    });
    await page.waitForTimeout(300);

    // Move close to first sand enemy
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(400, scene.player.y);
      }
    });
    await page.waitForTimeout(400);

    // Trigger attack to capture copper slash VFX
    await page.keyboard.press('j');
    await page.waitForTimeout(60);
    await page.screenshot({ path: 'test-results/playtest/06-realm3-copper-slash.png' });

    // Now go to Stage 25 to test Dune Sentinel Miniboss
    await page.goto('/?stage=25');
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(1500);

    // Equip copper-sword and position near miniboss arena (x=1650)
    await page.evaluate(() => {
      const entities = (window as any).__entities;
      if (entities) entities.equipment.equipWeapon('copper-sword');
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(1520, scene.player.y);
      }
    });
    await page.waitForTimeout(600);

    // Hero attacks Miniboss
    await page.keyboard.press('j');
    await page.waitForTimeout(100);
    await page.screenshot({ path: 'test-results/playtest/07-stage25-dune-sentinel-fight.png' });
  });

  test('06. Realm 3 Boss: Kernel Titan Overlord (Stage 30)', async ({ page }) => {
    await page.goto('/?stage=30');
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(1500);

    // Equip copper-sword and position in boss arena
    await page.evaluate(() => {
      const entities = (window as any).__entities;
      if (entities) entities.equipment.equipWeapon('copper-sword');
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(1560, scene.player.y);
      }
    });
    await page.waitForTimeout(800);

    // Attack boss
    await page.keyboard.press('j');
    await page.waitForTimeout(100);
    await page.screenshot({ path: 'test-results/playtest/08-stage30-kernel-titan-boss.png' });
  });

  test('07. Tools Swap & Held Item Visuals', async ({ page }) => {
    await page.goto('/?stage=11');
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(1000);

    const tools = ['pickaxe-t2', 'axe-t2', 'hammer-t2', 'pickaxe-t3', 'axe-t3', 'hammer-t3'];
    for (const tool of tools) {
      const hasItem = await page.evaluate((toolId) => {
        const entities = (window as any).__entities;
        if (!entities) return false;
        entities.equipment.equipWeapon(toolId);
        return true;
      }, tool);
      expect(hasItem).toBe(true);
      await page.waitForTimeout(150);
    }

    await page.screenshot({ path: 'test-results/playtest/09-tool-swap-held.png' });
  });
});

