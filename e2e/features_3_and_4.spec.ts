/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Features 3 & 4 Verification (SFX, Stage Progress HUD, Garden, Forge Upgrades)', () =>
{
    const outDir = path.join(process.cwd(), 'test-results', 'features_3_and_4');

    test.beforeAll(() =>
    {
        if (!fs.existsSync(outDir))
        {
            fs.mkdirSync(outDir, { recursive: true });
        }
    });

    test('Full interactive verification of Features 3 & 4 with screenshots', async ({ page }) =>
    {
        // -------------------------------------------------------------
        // Step 1: Start game and enter Stage 1
        // -------------------------------------------------------------
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const startBtn = page.getByRole('button', { name: /ເຂົ້າເກມ/i });
        await expect(startBtn).toBeVisible({ timeout: 10000 });
        await startBtn.click();

        await expect(page.locator('.game-hud')).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(1000);

        // Transition into Stage 1 to test Stage Progress Bar
        await page.evaluate(async () =>
        {
            const busModule = await import('/src/infrastructure/EventBus.ts');
            busModule.EventBus.emit('change-level', 'stage-001');
        });
        await page.waitForTimeout(1500);

        // -------------------------------------------------------------
        // Step 2: Stage Progress Bar at Start (0%)
        // -------------------------------------------------------------
        const progressBadge = page.locator('[data-testid="stage-progress"]');
        await expect(progressBadge).toBeVisible({ timeout: 10000 });

        await page.screenshot({
            path: path.join(outDir, '01-stage-progress-start.png'),
            fullPage: true,
        });

        // -------------------------------------------------------------
        // Step 3: Stage Progress Bar Midway (approx 50%)
        // -------------------------------------------------------------
        await page.evaluate(() =>
        {
            const scene = (window as any).__phaserGameScene;
            if (scene && scene.player)
            {
                scene.player.setPosition(650, scene.player.y);
            }
        });
        await page.waitForTimeout(600);

        await page.screenshot({
            path: path.join(outDir, '02-stage-progress-midway.png'),
            fullPage: true,
        });

        // -------------------------------------------------------------
        // Step 4: Stage Progress Bar near Exit Portal (approx 85-90%)
        // -------------------------------------------------------------
        await page.evaluate(() =>
        {
            const scene = (window as any).__phaserGameScene;
            if (scene && scene.player)
            {
                scene.player.setPosition(1050, scene.player.y);
            }
        });
        await page.waitForTimeout(600);

        await page.screenshot({
            path: path.join(outDir, '03-stage-progress-exit.png'),
            fullPage: true,
        });

        // -------------------------------------------------------------
        // Step 5: Potion Drinking Sound & HUD Buff Badge
        // -------------------------------------------------------------
        await page.evaluate(async () =>
        {
            const dev = window as any;
            const entities = dev.__entities;
            if (entities)
            {
                entities.backpack.addItem('strength-potion', 2);
                entities.quickSlotItemId = 'strength-potion';
                entities.effects.apply('strength', 60);
            }
            const soundModule = await import('/src/infrastructure/audio/SoundManager.ts');
            soundModule.soundManager.playPotionDrink();
        });
        await page.waitForTimeout(800);

        await page.screenshot({
            path: path.join(outDir, '04-hud-potion-sfx.png'),
            fullPage: true,
        });

        // -------------------------------------------------------------
        // Step 6: Visit the Village Garden (Scene & Plots)
        // -------------------------------------------------------------
        await page.evaluate(async () =>
        {
            const busModule = await import('/src/infrastructure/EventBus.ts');
            busModule.EventBus.emit('change-level', 'garden');
        });
        await page.waitForTimeout(1500);

        await page.screenshot({
            path: path.join(outDir, '05-village-garden-scene.png'),
            fullPage: true,
        });

        // -------------------------------------------------------------
        // Step 7: Open Garden Seed Picker Modal for Plot 0
        // -------------------------------------------------------------
        await page.evaluate(async () =>
        {
            const dev = window as any;
            const entities = dev.__entities;
            if (entities)
            {
                entities.backpack.addItem('wild-herb-seed', 5);
            }
            const busModule = await import('/src/infrastructure/EventBus.ts');
            busModule.EventBus.emit('open-garden', 0);
        });
        await page.waitForTimeout(700);

        const seedPicker = page.locator('[data-testid="seed-picker"]');
        await expect(seedPicker).toBeVisible({ timeout: 5000 });

        await page.screenshot({
            path: path.join(outDir, '06-garden-seed-picker.png'),
            fullPage: true,
        });

        // -------------------------------------------------------------
        // Step 8: Plant Seed and view growing Plot
        // -------------------------------------------------------------
        const seedBtn = page.locator('[data-testid="seed-wild-herb-seed"]');
        if (await seedBtn.isVisible())
        {
            await seedBtn.click();
        }
        else
        {
            await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(800);

        await page.screenshot({
            path: path.join(outDir, '07-garden-planted-plot.png'),
            fullPage: true,
        });

        // -------------------------------------------------------------
        // Step 9: Return to Village Hub and Open Forge Modal
        // -------------------------------------------------------------
        await page.evaluate(async () =>
        {
            const dev = window as any;
            const entities = dev.__entities;
            if (entities)
            {
                entities.forgeUnlocked = true;
                entities.wallet.earn(100);
                entities.backpack.addItem('iron-sword', 1);
                entities.backpack.addItem('iron-ore', 30);
            }
            const busModule = await import('/src/infrastructure/EventBus.ts');
            busModule.EventBus.emit('change-level', 'village');
        });
        await page.waitForTimeout(1000);

        await page.evaluate(async () =>
        {
            const busModule = await import('/src/infrastructure/EventBus.ts');
            busModule.EventBus.emit('open-forge');
        });
        await page.waitForTimeout(700);

        // Click Upgrade tab
        const upgradeTabBtn = page.getByRole('button', { name: /ອັບເກຣດ/i });
        await expect(upgradeTabBtn).toBeVisible({ timeout: 5000 });
        await upgradeTabBtn.click();
        await page.waitForTimeout(600);

        await page.screenshot({
            path: path.join(outDir, '08-forge-upgrade-tab.png'),
            fullPage: true,
        });

        // -------------------------------------------------------------
        // Step 10: Perform Upgrade (+1 and +2)
        // -------------------------------------------------------------
        const upgradeBtn = page.getByRole('button', { name: /ອັບເກຣດເປັນ \+1/i }).first();
        if (await upgradeBtn.isVisible())
        {
            await upgradeBtn.click();
            await page.waitForTimeout(500);
        }

        const upgrade2Btn = page.getByRole('button', { name: /ອັບເກຣດເປັນ \+2/i }).first();
        if (await upgrade2Btn.isVisible())
        {
            await upgrade2Btn.click();
            await page.waitForTimeout(500);
        }

        await page.screenshot({
            path: path.join(outDir, '09-forge-upgraded-success.png'),
            fullPage: true,
        });

        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);

        // -------------------------------------------------------------
        // Step 11: Combat with Upgraded Weapon (+2 Cyan Plasma Slash VFX!)
        // -------------------------------------------------------------
        await page.evaluate(async () =>
        {
            const busModule = await import('/src/infrastructure/EventBus.ts');
            busModule.EventBus.emit('change-level', 'stage-001');
        });
        await page.waitForTimeout(1200);

        await page.evaluate(() =>
        {
            const dev = window as any;
            const entities = dev.__entities;
            if (entities)
            {
                entities.equipment.equipWeapon('iron-sword');
            }
            const scene = (window as any).__phaserGameScene;
            if (scene && scene.player)
            {
                scene.player.triggerSlashVfx('iron-sword', 2);
            }
        });
        await page.keyboard.press('KeyJ');
        await page.waitForTimeout(300);

        await page.screenshot({
            path: path.join(outDir, '10-combat-upgraded-slash-vfx.png'),
            fullPage: true,
        });

        // -------------------------------------------------------------
        // Step 12: Quest Board Claim & Golden Fanfare Jingle
        // -------------------------------------------------------------
        await page.evaluate(async () =>
        {
            const busModule = await import('/src/infrastructure/EventBus.ts');
            busModule.EventBus.emit('change-level', 'village');
        });
        await page.waitForTimeout(800);

        await page.evaluate(async () =>
        {
            const questModule = await import('/src/application/QuestUseCases.ts');
            const dev = window as any;
            const entities = dev.__entities;
            if (entities)
            {
                questModule.recordQuestProgressUseCase(entities.questBoard, 'craft', 'pickaxe', 1);
            }
            const busModule = await import('/src/infrastructure/EventBus.ts');
            busModule.EventBus.emit('open-quest-board');
        });
        await page.waitForTimeout(700);

        const claimBtn = page.getByRole('button', { name: /🎁 ຮັບລາງວັນ/i }).first();
        if (await claimBtn.isVisible())
        {
            await claimBtn.click();
            await page.waitForTimeout(600);
        }

        await page.screenshot({
            path: path.join(outDir, '11-quest-claim-golden-fanfare.png'),
            fullPage: true,
        });

        console.log('Features 3 & 4 testing and screenshots complete!');
    });
});
