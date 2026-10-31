import { test, expect } from '@playwright/test';

test.describe('Targeted Stage Playtest for Bosses and Held Items', () => {
  test.setTimeout(90000);

  test('Stage 1: Held item in hand and slash VFX', async ({ page }) => {
    await page.goto('/?stage=1');
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(1500);

    // Equip blue sword in Stage 1 so it appears in the hero's hand!
    await page.evaluate(() => {
      const entities = (window as any).__entities;
      if (entities) {
        entities.equipment.equipWeapon('blue-sword');
      }
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/playtest/stage1-blue-sword-held.png' });

    // Attack with blue-sword to see the held swing and slash VFX
    await page.keyboard.press('j');
    await page.waitForTimeout(100);
    await page.screenshot({ path: 'test-results/playtest/stage1-blue-slash-swing.png' });
  });

  test('Stage 15: Realm 2 Crystal Warden Mini-boss', async ({ page }) => {
    await page.goto('/?stage=15');
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(2000);
    // Walk towards the miniboss arena
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(1000);
    await page.keyboard.up('ArrowRight');
    await page.screenshot({ path: 'test-results/playtest/stage15-crystal-warden.png' });
  });

  test('Stage 20: Realm 2 Network Core Boss', async ({ page }) => {
    await page.goto('/?stage=20');
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(2000);
    // Walk towards the boss arena
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(1500);
    await page.keyboard.up('ArrowRight');
    await page.screenshot({ path: 'test-results/playtest/stage20-network-core.png' });
  });

  test('Stage 25: Realm 3 Dune Sentinel Mini-boss', async ({ page }) => {
    await page.goto('/?stage=25');
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(2000);
    // Walk towards the miniboss arena
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(1000);
    await page.keyboard.up('ArrowRight');
    await page.screenshot({ path: 'test-results/playtest/stage25-dune-sentinel.png' });
  });

  test('Stage 30: Realm 3 Kernel Titan Boss', async ({ page }) => {
    await page.goto('/?stage=30');
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(2000);
    // Walk towards the boss arena
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(1500);
    await page.keyboard.up('ArrowRight');
    await page.screenshot({ path: 'test-results/playtest/stage30-kernel-titan.png' });
  });
});

