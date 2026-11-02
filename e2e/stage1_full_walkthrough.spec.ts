/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Full Playthrough & All UI Systems (Stage 1 Completion)', () =>
{
    const outDir = path.join(process.cwd(), 'test-results', 'stage1_playthrough');

    test.beforeAll(() =>
    {
        if (!fs.existsSync(outDir))
        {
            fs.mkdirSync(outDir, { recursive: true });
        }
    });

    test('Complete walkthrough of all UI systems, Village Hub, and Stage 1', async ({ page }) =>
    {
        // -------------------------------------------------------------
        // 1. Title Screen & Main Menu
        // -------------------------------------------------------------
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        await page.screenshot({
            path: path.join(outDir, '01-title-screen.png'),
            fullPage: true,
        });

        // Click start game button (ເຂົ້າເກມ) to enter Village
        const startBtn = page.getByRole('button', { name: /ເຂົ້າເກມ/i });
        await expect(startBtn).toBeVisible({ timeout: 10000 });
        await startBtn.click();

        await expect(page.locator('.game-hud')).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(1200);

        // -------------------------------------------------------------
        // 2. Village Hub Arrival
        // -------------------------------------------------------------
        await page.screenshot({
            path: path.join(outDir, '02-village-arrival.png'),
            fullPage: true,
        });

        // -------------------------------------------------------------
        // 3. Quest Board System Modal
        // -------------------------------------------------------------
        await page.evaluate(async () =>
        {
            const busModule = await import('/src/infrastructure/EventBus.ts');
            busModule.EventBus.emit('open-quest-board');
        });
        await page.waitForTimeout(600);
        await expect(page.locator('text=ກະດານພາລະກິດແຫ່ງປັນຍາ')).toBeVisible();

        await page.screenshot({
            path: path.join(outDir, '03-quest-board-modal.png'),
            fullPage: true,
        });

        // Close Quest Board
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);

        // -------------------------------------------------------------
        // 4. Library & Bookstore Modal
        // -------------------------------------------------------------
        await page.evaluate(async () =>
        {
            const busModule = await import('/src/infrastructure/EventBus.ts');
            busModule.EventBus.emit('open-library', 'book-ch1');
        });
        await page.waitForTimeout(600);
        await expect(page.locator('text=ຫໍສະໝຸດ')).toBeVisible();

        await page.screenshot({
            path: path.join(outDir, '04-library-store-modal.png'),
            fullPage: true,
        });

        // Buy Book 1 if button exists
        const buyBtn = page.getByRole('button', { name: /ຊື້ປຶ້ມຕຳລາ/i });
        if (await buyBtn.isVisible())
        {
            await buyBtn.click();
            await page.waitForTimeout(500);
        }

        // Open Reader
        const openReaderBtn = page.getByRole('button', { name: /ເປີດອ່ານຕຳລາ|ອ່ານຕຳລາ/i });
        if (await openReaderBtn.isVisible())
        {
            await openReaderBtn.click();
            await page.waitForTimeout(600);

            await page.screenshot({
                path: path.join(outDir, '05-textbook-reader-modal.png'),
                fullPage: true,
            });
        }

        // Close Reader / Library
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);

        // -------------------------------------------------------------
        // 5. Academy & Exam / Practice Modal
        // -------------------------------------------------------------
        await page.evaluate(async () =>
        {
            const busModule = await import('/src/infrastructure/EventBus.ts');
            busModule.EventBus.emit('open-academy', 'book-ch1');
        });
        await page.waitForTimeout(600);
        await expect(page.locator('text=ສະຖາບັນ')).toBeVisible();

        await page.screenshot({
            path: path.join(outDir, '06-academy-modal.png'),
            fullPage: true,
        });

        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);

        // -------------------------------------------------------------
        // 6. Workshop / Crafting Modal
        // -------------------------------------------------------------
        await page.evaluate(async () =>
        {
            const busModule = await import('/src/infrastructure/EventBus.ts');
            busModule.EventBus.emit('open-workshop');
        });
        await page.waitForTimeout(600);
        await expect(page.locator('text=ໂຮງຊ່າງ')).toBeVisible();

        await page.screenshot({
            path: path.join(outDir, '07-workshop-crafting-modal.png'),
            fullPage: true,
        });

        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);

        // -------------------------------------------------------------
        // 7. Storage Chest Modal
        // -------------------------------------------------------------
        await page.evaluate(async () =>
        {
            const busModule = await import('/src/infrastructure/EventBus.ts');
            busModule.EventBus.emit('open-storage');
        });
        await page.waitForTimeout(600);
        await expect(page.locator('text=ຫີບເກັບຂອງ')).toBeVisible();

        await page.screenshot({
            path: path.join(outDir, '08-storage-chest-modal.png'),
            fullPage: true,
        });

        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);

        // -------------------------------------------------------------
        // 8. Backpack & Character Stats Modals
        // -------------------------------------------------------------
        // Backpack
        await page.evaluate(async () =>
        {
            const busModule = await import('/src/infrastructure/EventBus.ts');
            busModule.EventBus.emit('open-backpack');
        });
        await page.waitForTimeout(600);

        await page.screenshot({
            path: path.join(outDir, '09-backpack-inventory-modal.png'),
            fullPage: true,
        });

        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);

        // Character Stats modal
        const heroLevelBadge = page.locator('[data-testid="hero-level"]');
        if (await heroLevelBadge.isVisible())
        {
            await heroLevelBadge.click();
            await page.waitForTimeout(600);

            await page.screenshot({
                path: path.join(outDir, '10-character-stats-modal.png'),
                fullPage: true,
            });

            await page.keyboard.press('Escape');
            await page.waitForTimeout(400);
        }

        // -------------------------------------------------------------
        // 9. Potion Buff System & HUD Timer
        // -------------------------------------------------------------
        await page.evaluate(() =>
        {
            const dev = window as any;
            const entities = dev.__entities;
            if (entities)
            {
                entities.backpack.addItem('strength-potion', 2);
                entities.backpack.addItem('speed-potion', 2);
                entities.effects.apply('strength', 50);
                entities.effects.apply('speed', 50);
            }
        });
        await page.waitForTimeout(700);

        await page.screenshot({
            path: path.join(outDir, '11-hud-buff-timer.png'),
            fullPage: true,
        });

        // -------------------------------------------------------------
        // 10. World Gate & Stage Map Modal
        // -------------------------------------------------------------
        await page.evaluate(async () =>
        {
            const busModule = await import('/src/infrastructure/EventBus.ts');
            busModule.EventBus.emit('open-stage-map');
        });
        await page.waitForTimeout(600);

        await page.screenshot({
            path: path.join(outDir, '12-world-stage-map.png'),
            fullPage: true,
        });

        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);

        // -------------------------------------------------------------
        // 11. Transition into Stage 1 (Cyber Forest)
        // -------------------------------------------------------------
        await page.evaluate(async () =>
        {
            const busModule = await import('/src/infrastructure/EventBus.ts');
            busModule.EventBus.emit('change-level', 'stage-001');
        });

        await expect(page.locator('.game-hud')).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(1500);

        await page.screenshot({
            path: path.join(outDir, '13-stage1-start.png'),
            fullPage: true,
        });

        // -------------------------------------------------------------
        // 12. Combat & Slashing in Stage 1
        // -------------------------------------------------------------
        await page.evaluate(() =>
        {
            const scene = (window as any).__phaserGameScene;
            if (scene && scene.player)
            {
                scene.player.triggerSlashVfx('wooden-sword');
            }
        });
        await page.keyboard.press('KeyJ');
        await page.waitForTimeout(400);

        await page.screenshot({
            path: path.join(outDir, '14-stage1-combat-slash.png'),
            fullPage: true,
        });

        // -------------------------------------------------------------
        // 13. Resource Gathering & Quest Progress in Stage 1
        // -------------------------------------------------------------
        await page.evaluate(async () =>
        {
            const scene = (window as any).__phaserGameScene;
            if (scene && scene.player)
            {
                scene.player.setPosition(420, scene.player.y);
            }
            const questModule = await import('/src/application/QuestUseCases.ts');
            const dev = window as any;
            const entities = dev.__entities;
            if (entities)
            {
                entities.backpack.addItem('wood', 5);
                questModule.recordQuestProgressUseCase(entities.questBoard, 'gather', 'wood', 5);
            }
        });
        await page.waitForTimeout(800);

        await page.screenshot({
            path: path.join(outDir, '15-stage1-harvesting.png'),
            fullPage: true,
        });

        await page.screenshot({
            path: path.join(outDir, '16-quest-completed-hud.png'),
            fullPage: true,
        });

        // -------------------------------------------------------------
        // 14. Reach Exit Portal & Complete Stage 1
        // -------------------------------------------------------------
        await page.evaluate(() =>
        {
            const scene = (window as any).__phaserGameScene;
            if (scene && scene.player)
            {
                scene.player.setPosition(1180, scene.player.y);
            }
        });
        await page.waitForTimeout(800);

        await page.screenshot({
            path: path.join(outDir, '17-stage1-exit-portal.png'),
            fullPage: true,
        });

        // Step through exit portal to trigger stage question / completion
        await page.evaluate(() =>
        {
            const scene = (window as any).__phaserGameScene;
            if (scene && (scene as any).handleStageExit)
            {
                (scene as any).handleStageExit();
            }
        });
        await page.waitForTimeout(1000);

        // Stage question modal
        const questionModal = page.locator('[data-testid="stage-question"]');
        if (await questionModal.isVisible())
        {
            await page.screenshot({
                path: path.join(outDir, '18-stage1-question-modal.png'),
                fullPage: true,
            });

            // Select option
            const firstOption = page.locator('[data-testid="stage-question-option"]').first();
            if (await firstOption.isVisible())
            {
                await firstOption.click();
                await page.waitForTimeout(400);

                const submitBtn = page.locator('[data-testid="stage-question-submit"]');
                if (await submitBtn.isVisible())
                {
                    await submitBtn.click();
                    await page.waitForTimeout(600);
                }

                await page.screenshot({
                    path: path.join(outDir, '18b-stage1-question-result.png'),
                    fullPage: true,
                });

                const continueBtn = page.locator('[data-testid="stage-question-continue"]');
                if (await continueBtn.isVisible())
                {
                    await continueBtn.click();
                    await page.waitForTimeout(1200);
                }
            }
        }

        // -------------------------------------------------------------
        // 15. Return to Village & Claim Quest Reward Victory
        // -------------------------------------------------------------
        await page.waitForTimeout(1000);

        // Open Quest Board in village to claim the reward
        await page.evaluate(async () =>
        {
            const busModule = await import('/src/infrastructure/EventBus.ts');
            busModule.EventBus.emit('open-quest-board');
        });
        await page.waitForTimeout(800);

        const claimBtn = page.getByRole('button', { name: /ຮັບລາງວັນ/i }).first();
        if (await claimBtn.isVisible())
        {
            await claimBtn.click();
            await page.waitForTimeout(600);
        }

        await page.screenshot({
            path: path.join(outDir, '19-village-quest-claimed-victory.png'),
            fullPage: true,
        });

        // Verify stage 1 is marked completed in live entities
        const stage1Completed = await page.evaluate(() =>
        {
            const dev = window as any;
            return dev.__entities ? dev.__entities.stageProgression.isStageCompleted('stage-001') : false;
        });
        expect(stage1Completed).toBe(true);
    });
});
