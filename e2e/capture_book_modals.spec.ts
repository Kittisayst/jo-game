/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Inspect and Capture Book / Adventurer Journal UI Modals', () => {
  test('Capture screenshots of all new Book UI modals across desktop and mobile', async ({ page }) => {
    test.setTimeout(120000);

    const outDir = 'C:/Users/kitti/.gemini/antigravity/brain/0773a79a-59e1-49a2-abe8-2b35941fea76/book_ui';
    const parentDir = 'C:/Users/kitti/.gemini/antigravity/brain/0773a79a-59e1-49a2-abe8-2b35941fea76';
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const saveSnap = async (name: string) => {
      await page.screenshot({ path: path.join(outDir, name) });
      fs.copyFileSync(path.join(outDir, name), path.join(parentDir, name));
    };

    // 1. Open game
    await page.goto('./');
    await expect(page.locator('.title-screen')).toBeVisible({ timeout: 20000 });

    // 2. Start game
    await page.locator('#btn-play-game').click();
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(1200);

    // Grant items and unlock textbooks for rich inspector view
    await page.evaluate(() => {
      const e = (window as any).__entities;
      if (e) {
        e.backpack.addItem('wood', 30);
        e.backpack.addItem('stone', 25);
        e.backpack.addItem('iron-ore', 15);
        e.backpack.addItem('herb', 10);
        e.backpack.addItem('potion-heal', 3);
        e.backpack.addItem('axe-t1', 1);
        e.backpack.addItem('pickaxe-t1', 1);
        e.backpack.addItem('iron-helmet', 1);
        e.backpack.addItem('iron-armor', 1);
        e.backpack.addItem('iron-boots', 1);
        e.storage.addItem('wood', 50);
        e.storage.addItem('stone', 40);
        e.storage.addItem('portal-block-green', 1);
        e.wallet.setBalance(150);
        if (e.books['book-ch1']) {
          e.books['book-ch1'].unlock();
        }
      }
    });

    // 3. Inspect Smithy (Crafting Journal - Minecraft Legends style)
    await page.evaluate(() => (window as any).__eventBus.emit('open-smithy', 'tools'));
    await expect(page.locator('.gw-window')).toBeVisible();
    await page.waitForTimeout(600);
    await saveSnap('01-book-smithy-tools.png');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // 4. Inspect Backpack (Inventory Journal - UnderMine style)
    await page.evaluate(() => (window as any).__eventBus.emit('open-backpack'));
    await expect(page.locator('.gw-window')).toBeVisible();
    await page.waitForTimeout(600);
    await saveSnap('02-book-backpack-inventory.png');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // 5. Inspect Shop (Grandma Chanthy's Market Ledger)
    await page.evaluate(() => (window as any).__eventBus.emit('open-shop'));
    await expect(page.locator('.gw-window')).toBeVisible();
    await page.waitForTimeout(600);
    await saveSnap('03-book-shop-ledger.png');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // 6. Inspect Quest Board (Bounty Notice Board)
    await page.evaluate(() => (window as any).__eventBus.emit('open-quest-board'));
    await expect(page.locator('.gw-window')).toBeVisible();
    await page.waitForTimeout(600);
    await saveSnap('04-book-quest-board.png');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // 7. Inspect Character (Hero Chronicle)
    await page.keyboard.press('KeyC');
    await expect(page.locator('.gw-window')).toBeVisible();
    await page.waitForTimeout(600);
    await saveSnap('05-book-character-chronicle.png');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // 8. Inspect Storage Chest (Village Vault Journal)
    await page.evaluate(() => (window as any).__eventBus.emit('open-storage'));
    await expect(page.locator('.gw-window')).toBeVisible();
    await page.waitForTimeout(600);
    await saveSnap('08-book-storage-chest.png');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // 9. Inspect Academy (Examination Scrolls)
    await page.evaluate(() => (window as any).__eventBus.emit('open-academy'));
    await expect(page.locator('.gw-window')).toBeVisible();
    await page.waitForTimeout(600);
    await saveSnap('09-book-academy-exam.png');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // 10. Inspect Textbook Reader (Personal Study Journal)
    await page.locator('#hud-library-btn').click();
    await expect(page.locator('.gw-window')).toBeVisible();
    await page.waitForTimeout(600);
    await saveSnap('10-book-textbook-reader.png');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // 11. Inspect World Stage Map (Fantasy Cartographer Atlas)
    await page.evaluate(() => (window as any).__eventBus.emit('open-stage-map'));
    await expect(page.locator('.gw-window')).toBeVisible();
    await page.waitForTimeout(600);
    await saveSnap('11-book-world-atlas-map.png');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // 12. Mobile Landscape Test (915x412)
    await page.setViewportSize({ width: 915, height: 412 });
    await page.evaluate(() => (window as any).__eventBus.emit('open-backpack'));
    await expect(page.locator('.gw-window')).toBeVisible();
    await page.waitForTimeout(600);
    await saveSnap('06-mobile-landscape-backpack.png');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    await page.evaluate(() => (window as any).__eventBus.emit('open-smithy', 'tools'));
    await expect(page.locator('.gw-window')).toBeVisible();
    await page.waitForTimeout(600);
    await saveSnap('07-mobile-landscape-smithy.png');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    console.log('Successfully captured all book modal screenshots to', outDir);
  });
});
