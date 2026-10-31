import { test, expect } from '@playwright/test';

test.describe('Desert Biome & Boss Animations Verification', () => {
  test.setTimeout(90000);

  test('Stage 21: Full Desert Biome with Dunes Backdrop and Sand Ground Tile', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/?stage=21');
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(1500);

    // Verify backdrop texture is bg-desert and ground has ground-tile-desert
    const hasDesertAssets = await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (!scene) return false;
      const textures = scene.textures;
      return textures.exists('bg-desert') && textures.exists('ground-tile-desert');
    });
    expect(hasDesertAssets).toBe(true);

    // Equip copper-sword and walk forward
    await page.evaluate(() => {
      const entities = (window as any).__entities;
      if (entities) entities.equipment.equipWeapon('copper-sword');
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(450, scene.player.y);
      }
    });
    await page.waitForTimeout(600);

    // Attack with copper slash
    await page.keyboard.press('j');
    await page.waitForTimeout(100);

    await page.screenshot({ path: 'test-results/desert/stage21-desert-dunes.png' });
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });

  test('Stage 25: Dune Sentinel Miniboss in Desert Setting', async ({ page }) => {
    await page.goto('/?stage=25');
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(1500);

    // Move to Dune Sentinel arena (x=1520)
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
    await page.screenshot({ path: 'test-results/desert/stage25-desert-sentinel.png' });
  });

  test('Stage 20: Network Core Boss Idle Animation', async ({ page }) => {
    await page.goto('/?stage=20');
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(1500);

    // Check boss idle animation
    const bossAnim = await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (!scene || !scene.boss) return null;
      return {
        textureKey: scene.boss.texture.key,
        currentAnim: scene.boss.anims.currentAnim?.key,
        isPlaying: scene.boss.anims.isPlaying,
      };
    });

    expect(bossAnim?.textureKey).toBe('boss-network-core');
    expect(bossAnim?.currentAnim).toBe('boss-network-core-idle');
    expect(bossAnim?.isPlaying).toBe(true);

    // Move to arena
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) scene.player.setPosition(1550, scene.player.y);
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/desert/stage20-network-core-animated.png' });
  });

  test('Stage 30: Kernel Titan Boss Idle Animation in Desert Setting', async ({ page }) => {
    await page.goto('/?stage=30');
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(1500);

    // Check boss idle animation
    const bossAnim = await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (!scene || !scene.boss) return null;
      return {
        textureKey: scene.boss.texture.key,
        currentAnim: scene.boss.anims.currentAnim?.key,
        isPlaying: scene.boss.anims.isPlaying,
      };
    });

    expect(bossAnim?.textureKey).toBe('boss-kernel-titan');
    expect(bossAnim?.currentAnim).toBe('boss-kernel-titan-idle');
    expect(bossAnim?.isPlaying).toBe(true);

    // Move to arena
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) scene.player.setPosition(1550, scene.player.y);
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/desert/stage30-kernel-titan-animated.png' });
  });
});

