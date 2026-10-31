import { test, expect } from '@playwright/test';

test.describe('Boss Unique Attacks & Game Feel Verification', () => {
  test.setTimeout(90000);

  test('Stage 20: Network Core Boss specialized attacks & impact feedback', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/?stage=20');
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(1500);

    // Position player in boss arena (x=1560)
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(1560, scene.player.y);
      }
    });
    await page.waitForTimeout(800);

    // Verify boss is loaded with bossId stage-ch2-boss
    const bossInfo = await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (!scene || !scene.boss) return null;
      return {
        bossId: scene.boss.bossId,
        textureKey: scene.boss.texture.key,
        hasBurstCallback: typeof scene.boss.onPacketBurst === 'function',
        hasEmpCallback: typeof scene.boss.onEmpShockwave === 'function',
      };
    });

    expect(bossInfo?.bossId).toBe('stage-ch2-boss');
    expect(bossInfo?.textureKey).toBe('boss-network-core');
    expect(bossInfo?.hasBurstCallback).toBe(true);
    expect(bossInfo?.hasEmpCallback).toBe(true);

    // Trigger packet burst attack explicitly to verify projectile creation
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.boss && scene.boss.onPacketBurst) {
        scene.boss.onPacketBurst(scene.boss.x, scene.boss.y, -1);
      }
    });
    await page.waitForTimeout(200);

    const projectileCount = await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      return scene ? scene.enemyProjectiles.countActive(true) : 0;
    });
    expect(projectileCount).toBeGreaterThanOrEqual(1);

    // Attack the boss to test hit impact & screen shake
    await page.keyboard.press('j');
    await page.waitForTimeout(100);

    await page.screenshot({ path: 'test-results/combat/01-network-core-attack.png' });
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });

  test('Stage 30: Kernel Titan Boss specialized attacks & seismic shockwave', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/?stage=30');
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(1500);

    // Position player in boss arena
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.player) {
        scene.player.setPosition(1560, scene.player.y);
      }
    });
    await page.waitForTimeout(800);

    // Verify boss is loaded with bossId stage-ch3-boss
    const bossInfo = await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (!scene || !scene.boss) return null;
      return {
        bossId: scene.boss.bossId,
        textureKey: scene.boss.texture.key,
        hasStompCallback: typeof scene.boss.onGroundStomp === 'function',
        hasDebrisCallback: typeof scene.boss.onDebrisDrop === 'function',
      };
    });

    expect(bossInfo?.bossId).toBe('stage-ch3-boss');
    expect(bossInfo?.textureKey).toBe('boss-kernel-titan');
    expect(bossInfo?.hasStompCallback).toBe(true);
    expect(bossInfo?.hasDebrisCallback).toBe(true);

    // Trigger seismic ground stomp to verify shockwave projectile creation
    await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      if (scene && scene.boss && scene.boss.onGroundStomp) {
        scene.boss.onGroundStomp(scene.boss.x, scene.boss.y + 40, -1);
      }
    });
    await page.waitForTimeout(150);

    const projectileCount = await page.evaluate(() => {
      const scene = (window as any).__phaserGameScene;
      return scene ? scene.enemyProjectiles.countActive(true) : 0;
    });
    expect(projectileCount).toBeGreaterThanOrEqual(1);

    // Attack titan
    await page.keyboard.press('j');
    await page.waitForTimeout(100);

    await page.screenshot({ path: 'test-results/combat/02-kernel-titan-attack.png' });
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });
});

