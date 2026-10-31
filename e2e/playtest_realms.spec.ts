import { test, expect } from '@playwright/test';

test.describe('Playtest Knowledge Quest with New Assets', () => {
  test('Playtest through Village Hub, equip weapons, attack with VFX, and inspect bosses', async ({ page }) => {
    test.setTimeout(90000);

    page.on('console', msg => console.log('BROWSER:', msg.type(), msg.text()));

    // 1. Open game
    await page.goto('/');
    await expect(page.locator('.title-screen')).toBeVisible();

    // 2. Start game
    await page.locator('#btn-play-game').click();
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/playtest/01-village-hub.png' });

    // 3. Walk around the village and perform dash
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(800);
    await page.keyboard.up('ArrowRight');
    await page.keyboard.press('Shift'); // Dash
    await page.waitForTimeout(500);

    // 4. Test equipping weapons and swinging sword
    // Let's grant player weapons to test held items and slash vfx
    await page.evaluate(() => {
      const g = (window as any);
      const entities = g.__entities;
      if (entities) {
        // Add blue-sword and copper-sword and T2/T3 tools to backpack
        entities.backpack.addItem('blue-sword', 1);
        entities.backpack.addItem('copper-sword', 1);
        entities.backpack.addItem('axe-t2', 1);
        entities.backpack.addItem('pickaxe-t2', 1);
        entities.backpack.addItem('axe-t3', 1);
        entities.backpack.addItem('pickaxe-t3', 1);
        // Equip blue-sword
        entities.equipment.equipWeapon('blue-sword');
      }
    });
    await page.waitForTimeout(500);

    // Perform attack swing with blue-sword
    await page.keyboard.press('j');
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'test-results/playtest/02-blue-sword-slash.png' });
    await page.waitForTimeout(400);

    // Equip copper-sword and attack
    await page.evaluate(() => {
      const g = (window as any);
      const entities = g.__entities;
      if (entities) {
        entities.equipment.equipWeapon('copper-sword');
      }
    });
    await page.waitForTimeout(300);
    await page.keyboard.press('j');
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'test-results/playtest/03-copper-sword-slash.png' });
    await page.waitForTimeout(400);

    // 5. Open Backpack modal to inspect held items & icons
    await page.locator('#hud-backpack-btn').click();
    await expect(page.locator('h2:has-text("ກະເປົາເດີນທາງ")')).toBeVisible();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/playtest/04-backpack-inventory.png' });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // 6. Enter Realm 2 Stage 15 (Crystal Warden Mini-boss)
    await page.evaluate(() => {
      const eb = (window as any).__eventBus;
      if (eb) eb.emit('change-level', 'stage-015');
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'test-results/playtest/05-realm2-crystal-warden.png' });

    // 7. Enter Realm 2 Stage 20 (Network Core Boss)
    await page.evaluate(() => {
      const eb = (window as any).__eventBus;
      if (eb) eb.emit('change-level', 'stage-020');
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'test-results/playtest/06-realm2-network-core-boss.png' });

    // 8. Enter Realm 3 Stage 25 (Dune Sentinel Mini-boss)
    await page.evaluate(() => {
      const eb = (window as any).__eventBus;
      if (eb) eb.emit('change-level', 'stage-025');
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'test-results/playtest/07-realm3-dune-sentinel.png' });

    // 9. Enter Realm 3 Stage 30 (Kernel Titan Boss)
    await page.evaluate(() => {
      const eb = (window as any).__eventBus;
      if (eb) eb.emit('change-level', 'stage-030');
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'test-results/playtest/08-realm3-kernel-titan-boss.png' });

    // 10. Enter Realm 2 generated stage to view Crystal Slime & Golem
    await page.evaluate(() => {
      const eb = (window as any).__eventBus;
      if (eb) eb.emit('change-level', 'stage-011');
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'test-results/playtest/09-realm2-crystal-stage.png' });
  });
});

