import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Dungeon & In-Stage NPCs Playtest', () => {
  const outDir = path.join(process.cwd(), 'test-results', 'dungeon_screenshots');

  test.beforeAll(() => {
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
  });

  test('Hunter Bounmy, Dungeon exploration, Somchay, monsters, chest and Stage 1 Guide Keo', async ({ page }) => {
    test.setTimeout(90000);

    // -----------------------------------------------------------------
    // 1. Load the game into Village Hub
    // -----------------------------------------------------------------
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('#btn-play-game').click();
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.level-badge')).toContainText('ໝູ່ບ້ານ');
    await page.waitForTimeout(1000);

    // -----------------------------------------------------------------
    // 2. Hunter Bounmy in Village Hub
    // -----------------------------------------------------------------
    await page.evaluate(async () => {
      const busModule = await import('/src/infrastructure/EventBus.ts');
      busModule.EventBus.emit('start-dialogue', 'hunter_bounmy');
    });
    await expect(page.locator('.dialogue-box')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.dialogue-speaker-name')).toContainText(/ນາຍພານ.*ບຸນມີ/);
    
    // Click box to finish typewriter fast
    await page.locator('.dialogue-box').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, '1_village_hunter_bounmy_dialogue.png') });

    // Click again to advance from start to intro_choices
    await page.locator('.dialogue-box').click();
    await page.waitForTimeout(400);
    // Click once more to complete typewriter of intro_choices
    await page.locator('.dialogue-box').click();
    await page.waitForTimeout(400);

    // Choose option to enter Dungeon
    const enterDungeonChoice = page.locator('.dialogue-choice-btn', { hasText: /ເປີດປະຕູດັນຈ້ຽນ|ຂ້ອຍພ້ອມແລ້ວ/i });
    await expect(enterDungeonChoice).toBeVisible({ timeout: 5000 });
    await enterDungeonChoice.click();

    // -----------------------------------------------------------------
    // 3. Dungeon Entry & Atmosphere
    // -----------------------------------------------------------------
    await expect(page.locator('.level-badge')).toContainText('ຄຸກໃຕ້ດິນບູຮານ', { timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '2_dungeon_entry.png') });

    // -----------------------------------------------------------------
    // 4. Archaeologist Somchay at Campfire in Dungeon
    // -----------------------------------------------------------------
    await page.evaluate(async () => {
      const busModule = await import('/src/infrastructure/EventBus.ts');
      busModule.EventBus.emit('start-dialogue', 'archaeologist_somchay');
    });
    await expect(page.locator('.dialogue-box')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.dialogue-speaker-name')).toContainText(/ສົມຊາຍ/);
    
    // Click box to complete typewriter
    await page.locator('.dialogue-box').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, '3_dungeon_somchay_dialogue.png') });

    // Close dialogue with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // -----------------------------------------------------------------
    // 5. Dungeon Monsters: Cave Bat, Spider, Skeleton Combat
    // -----------------------------------------------------------------
    // Move to monster area
    await page.evaluate(() => {
      const root = document.getElementById('root')!;
      const key = Object.keys(root).find(k => k.startsWith('__reactContainer'))!;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stack: any[] = [(root as any)[key]];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let game: any = null;
      while (stack.length && !game) {
        const node = stack.pop();
        if (!node) continue;
        let state = node.memoizedState;
        while (state) {
          const val = state.memoized;
          if (val?.current?.game?.scene) { game = val.current.game; break; }
          const inner = state.memoizedState;
          if (inner?.current?.game) { game = inner.current.game; break; }
          state = state.next;
        }
        if (node.child) stack.push(node.child);
        if (node.sibling) stack.push(node.sibling);
      }
      const scene = game?.scene?.getScene('Game');
      if (scene?.player) {
        scene.player.x = 850;
      }
    });
    await page.waitForTimeout(500);

    // Attack with sword
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('KeyJ');
      await page.waitForTimeout(150);
    }
    await page.screenshot({ path: path.join(outDir, '4_dungeon_monsters_combat.png') });

    // -----------------------------------------------------------------
    // 6. Open Ancient Dungeon Chest (x = 1450)
    // -----------------------------------------------------------------
    await page.evaluate(() => {
      const root = document.getElementById('root')!;
      const key = Object.keys(root).find(k => k.startsWith('__reactContainer'))!;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stack: any[] = [(root as any)[key]];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let game: any = null;
      while (stack.length && !game) {
        const node = stack.pop();
        if (!node) continue;
        let state = node.memoizedState;
        while (state) {
          const val = state.memoized;
          if (val?.current?.game?.scene) { game = val.current.game; break; }
          const inner = state.memoizedState;
          if (inner?.current?.game) { game = inner.current.game; break; }
          state = state.next;
        }
        if (node.child) stack.push(node.child);
        if (node.sibling) stack.push(node.sibling);
      }
      const scene = game?.scene?.getScene('Game');
      if (scene?.player) {
        scene.player.x = 1445;
      }
    });
    await page.waitForTimeout(400);

    // Press E to open chest
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, '5_dungeon_chest_rewards.png') });

    // -----------------------------------------------------------------
    // 7. Quest Board with Dungeon Quests
    // -----------------------------------------------------------------
    // Return to village
    await page.evaluate(async () => {
      const busModule = await import('/src/infrastructure/EventBus.ts');
      busModule.EventBus.emit('change-level', 'village');
    });
    await expect(page.locator('.level-badge')).toContainText('ໝູ່ບ້ານ', { timeout: 10000 });
    await page.waitForTimeout(800);

    // Open quest board via EventBus
    await page.evaluate(async () => {
      const busModule = await import('/src/infrastructure/EventBus.ts');
      busModule.EventBus.emit('open-quest-board');
    });
    await expect(page.locator('.quest-board-modal, .modal-content, [role="dialog"]').first()).toBeVisible({ timeout: 6000 });
    await page.screenshot({ path: path.join(outDir, '6_quest_board_dungeon_quests.png') });

    // Close quest board
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // -----------------------------------------------------------------
    // 8. In-Stage NPC: Guide Keo in Stage 1
    // -----------------------------------------------------------------
    await page.evaluate(async () => {
      const busModule = await import('/src/infrastructure/EventBus.ts');
      busModule.EventBus.emit('change-level', 'stage-001');
    });
    await expect(page.locator('.level-badge')).toContainText('ດ່ານ 1', { timeout: 10000 });
    await page.waitForTimeout(800);

    // Trigger dialogue with Guide Keo
    await page.evaluate(async () => {
      const busModule = await import('/src/infrastructure/EventBus.ts');
      busModule.EventBus.emit('start-dialogue', 'stage_guide_keo');
    });
    await expect(page.locator('.dialogue-box')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.dialogue-speaker-name')).toContainText(/ແກ້ວ/);
    
    // Complete typewriter
    await page.locator('.dialogue-box').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, '7_stage1_guide_keo_dialogue.png') });

    console.log('SUCCESS: All 7 screenshots captured!');
  });
});
