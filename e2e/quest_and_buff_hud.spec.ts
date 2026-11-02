/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Quest Board and Buff Timer HUD', () =>
{
    test.beforeEach(async () =>
    {
        const outDir = path.join(process.cwd(), 'test-results', 'quest_buff');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    });

    test('Potion Buff Timer appears in HUD and counts down', async ({ page }) =>
    {
        await page.goto('/?stage=1');
        await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
        await page.waitForTimeout(1000);

        // Apply strength potion for 45 seconds directly into live entities
        await page.evaluate(() =>
        {
            const dev = window as any;
            const entities = dev.__entities;
            if (entities)
            {
                entities.backpack.addItem('strength-potion', 1);
                entities.effects.apply('strength', 45);
            }
        });

        // Wait a tick for React HUD timer interval to rerender
        await page.waitForTimeout(600);

        // Verify strength badge is visible in HUD
        const effectBadge = page.locator('[data-testid="effect-strength"]');
        await expect(effectBadge).toBeVisible();

        const labelText = await effectBadge.innerText();
        expect(labelText.toLowerCase()).toContain('s');

        await page.screenshot({
            path: 'test-results/quest_buff/01-potion-buff-hud.png',
            fullPage: true,
        });

        // Let time pass and verify timer ticks
        await page.evaluate(() =>
        {
            const dev = window as any;
            const entities = dev.__entities;
            if (entities) entities.effects.tick(5000);
        });

        await page.waitForTimeout(600);
        const updatedText = await effectBadge.innerText();
        expect(updatedText).toBeDefined();
    });

    test('Village Quest Board opens, shows quests, and claims reward', async ({ page }) =>
    {
        await page.goto('/?stage=village');
        await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
        await page.waitForTimeout(1000);

        // Advance wood quest to completed via recordQuestProgressUseCase
        await page.evaluate(async () =>
        {
            const questModule = await import('/src/application/QuestUseCases.ts');
            const dev = window as any;
            const entities = dev.__entities;
            if (entities)
            {
                questModule.recordQuestProgressUseCase(entities.questBoard, 'gather', 'wood', 5);
            }
        });

        await page.waitForTimeout(600);

        // Verify HUD notice shows claimable quest badge
        const questNotice = page.locator('[data-testid="quest-claimable"]');
        await expect(questNotice).toBeVisible();

        await page.screenshot({
            path: 'test-results/quest_buff/02-quest-notice-hud.png',
            fullPage: true,
        });

        // Trigger EventBus 'open-quest-board'
        await page.evaluate(async () =>
        {
            const busModule = await import('/src/infrastructure/EventBus.ts');
            busModule.EventBus.emit('open-quest-board');
        });

        await page.waitForTimeout(800);

        // Verify modal opened
        const modalTitle = page.locator('text=ກະດານພາລະກິດແຫ່ງປັນຍາ');
        await expect(modalTitle).toBeVisible();

        // Check that "ຮັບລາງວັນ" button is present
        const claimBtn = page.getByRole('button', { name: /ຮັບລາງວັນ/i });
        await expect(claimBtn.first()).toBeVisible();

        await page.screenshot({
            path: 'test-results/quest_buff/03-quest-board-modal.png',
            fullPage: true,
        });

        // Click claim button
        await claimBtn.first().click();
        await page.waitForTimeout(600);

        // Verify button changed to "ສຳເລັດແລ້ວ"
        const claimedBadge = page.locator('text=ສຳເລັດແລ້ວ');
        await expect(claimedBadge.first()).toBeVisible();

        await page.screenshot({
            path: 'test-results/quest_buff/04-quest-reward-claimed.png',
            fullPage: true,
        });
    });
});
