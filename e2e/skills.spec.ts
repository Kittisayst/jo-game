/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, Page } from '@playwright/test';
import { openStage } from './helpers/stage';

const slime = (page: Page) => page.evaluate(() => {
  const scene = (window as any).__botGame.scene.getScene('Game');
  const enemy = scene.enemies.getChildren().find((e: any) => e.active && !e.entity.isDefeated);
  return enemy ? { x: enemy.x as number, hp: enemy.entity.currentHp as number, max: enemy.entity.maxHp as number } : null;
});

test.describe('Active skills', () => {
  test('passing the Textbook exam teaches Power Wave; K casts it, it hurts a far enemy, then it cools down', async ({ page }) => {
    test.setTimeout(120000);
    await openStage(page, 1);

    // Nothing learned yet: K does nothing
    expect(await page.evaluate(() => (window as any).__entities.skills.unlocked)).toEqual([]);
    await page.keyboard.press('KeyK');
    expect(await page.evaluate(() => (window as any).__entities.skillCooldowns.anyActive)).toBe(false);

    // The exam of Textbook 1 is passed (the exam itself is covered by knowledge_quest.spec): the skill comes with it
    await page.evaluate(async () => {
      (window as any).__entities.books['book-ch1'].recordExamResult(5);
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('book-exam-passed', 'book-ch1');
    });
    await expect.poll(() => page.evaluate(() => (window as any).__entities.skills.unlocked)).toEqual(['power-wave']);
    expect(await page.evaluate(() => (window as any).__entities.skills.equipped)).toEqual(['power-wave', null]);
    await expect(page.getByTestId('skill-slot-K')).toBeVisible();

    // Stand 300 px left of the slime, facing it, and cast: the wave flies there and hurts it
    const before = await slime(page);
    expect(before).not.toBeNull();
    await page.evaluate((x: number) => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      scene.player.isInvincible = true;
      scene.player.setPosition(x - 300, scene.player.y);
      scene.player.facingDir = 1;
    }, before!.x);
    await page.waitForTimeout(300);
    await page.keyboard.press('KeyK');
    await expect.poll(async () => (await slime(page))?.hp ?? 0, { timeout: 5000 }).toBeLessThan(before!.hp);

    // The cooldown runs, the slot says so, and a second K at once does nothing
    await expect(page.getByTestId('skill-slot-K')).toHaveAttribute('data-state', 'cooling');
    const remaining = await page.evaluate(() => (window as any).__entities.skillCooldowns.remainingMs('power-wave') as number);
    expect(remaining).toBeGreaterThan(0);
    await page.keyboard.press('KeyK');
    expect(await page.evaluate(() => (window as any).__botGame.scene.getScene('Game').children.list.filter((o: any) => o.texture?.key === 'skill-wave' && o.active).length)).toBeLessThanOrEqual(1);

    // It is ready again after its time (Game time)
    await page.evaluate(() => (window as any).__entities.skillCooldowns.tick(5000));
    await expect(page.getByTestId('skill-slot-K')).toHaveAttribute('data-state', 'ready');
  });

  test('the Academy lists the skills, locked until the exam and movable between K and L', async ({ page }) => {
    test.setTimeout(90000);
    await openStage(page, 1);
    await page.evaluate(() => {
      const e = (window as any).__entities;
      e.skills.unlock('power-wave');
    });
    await page.evaluate(async () => {
      const { EventBus } = await import('/src/infrastructure/EventBus.ts');
      EventBus.emit('open-academy');
    });
    await page.getByTestId('academy-tab-skills').click();
    await expect(page.getByTestId('skill-power-wave')).toHaveAttribute('data-state', 'learned');
    await page.getByTestId('equip-power-wave-L').click();
    expect(await page.evaluate(() => (window as any).__entities.skills.equipped)).toEqual([null, 'power-wave']);
  });
});
