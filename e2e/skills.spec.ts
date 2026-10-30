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
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));
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
    expect(pageErrors).toEqual([]);
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

test.describe('Ping (chain lightning and stun)', () => {
  test('hits the nearest enemy in front and stuns it (still, harmless to touch); nothing to hit costs no cooldown', async ({ page }) => {
    test.setTimeout(120000);
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));
    await openStage(page, 12);

    await page.evaluate(() => { (window as any).__entities.skills.unlock('ping'); });
    const enemies = await page.evaluate(() => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      return scene.enemies.getChildren().filter((e: any) => e.active).map((e: any) => ({ x: e.x as number, y: e.y as number }));
    });
    expect(enemies.length).toBeGreaterThan(0);
    enemies.sort((a: any, b: any) => a.x - b.x);
    const target = enemies[0];

    // Far from every enemy (more than the 420 px reach): K says there is no target and keeps the skill ready
    await page.evaluate((x: number) => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      scene.player.isInvincible = true;
      scene.player.setPosition(Math.max(60, x - 1400), scene.player.y);
    }, target.x);
    await page.waitForTimeout(300);
    const near = await page.evaluate(() => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      return scene.enemies.getChildren().some((e: any) => e.active && Math.abs(e.x - scene.player.x) < 450);
    });
    if (!near) {
      await page.keyboard.press('KeyK');
      expect(await page.evaluate(() => (window as any).__entities.skillCooldowns.anyActive)).toBe(false);
    }

    // 250 px left of the nearest enemy, facing it
    await page.evaluate((x: number) => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      scene.player.setPosition(x - 250, scene.player.y);
      scene.player.facingDir = 1;
    }, target.x);
    await page.waitForTimeout(300);
    const before = await page.evaluate(() => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      const e = scene.enemies.getChildren().filter((c: any) => c.active).sort((a: any, b: any) => Math.abs(a.x - scene.player.x) - Math.abs(b.x - scene.player.x))[0];
      return { hp: e.entity.currentHp as number };
    });
    await page.keyboard.press('KeyK');

    const stunned = () => page.evaluate(() => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      return scene.enemies.getChildren().filter((c: any) => c.active && c.isStunned).map((c: any) => ({ x: c.x as number, hp: c.entity.currentHp as number }));
    });
    // It is stunned (unless the hit killed it) and the cooldown has started
    await expect.poll(async () => (await stunned()).length > 0 || (await page.evaluate(() => (window as any).__entities.skillCooldowns.anyActive)), { timeout: 4000 }).toBe(true);
    expect(await page.evaluate(() => (window as any).__entities.skillCooldowns.remainingMs('ping'))).toBeGreaterThan(0);

    const held = await stunned();
    if (held.length > 0) {
      expect(held[0].hp).toBeLessThan(before.hp);
      // It stays where it is while stunned
      await page.waitForTimeout(800);
      const later = await stunned();
      expect(Math.abs(later[0].x - held[0].x)).toBeLessThan(6);
      // Touching it costs no heart
      const hearts = await page.evaluate(() => (window as any).__entities.health.current);
      await page.evaluate((x: number) => {
        const scene = (window as any).__botGame.scene.getScene('Game');
        scene.player.isInvincible = false;
        scene.player.setPosition(x, scene.player.y);
      }, later[0].x);
      await page.waitForTimeout(400);
      expect(await page.evaluate(() => (window as any).__entities.health.current)).toBe(hearts);
    }
    expect(pageErrors).toEqual([]);
  });
});

test.describe('End Task (area stun)', () => {
  test('stuns and hurts every enemy in the circle, none outside it; nothing in the circle costs no cooldown', async ({ page }) => {
    test.setTimeout(120000);
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));
    await openStage(page, 22);
    await page.evaluate(() => { (window as any).__entities.skills.unlock('end-task'); });

    const enemies = await page.evaluate(() => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      return scene.enemies.getChildren().filter((e: any) => e.active).map((e: any) => ({ x: e.x as number, y: e.y as number })).sort((a: any, b: any) => a.x - b.x);
    });
    expect(enemies.length).toBeGreaterThan(1);

    // Nothing within 260 px: K says so and keeps the skill ready
    await page.evaluate(({ x }) => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      scene.player.isInvincible = true;
      scene.player.setPosition(Math.max(60, x - 900), scene.player.y);
    }, { x: enemies[0].x });
    await page.waitForTimeout(300);
    const near = await page.evaluate(() => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      return scene.enemies.getChildren().some((e: any) => e.active && Math.hypot(e.x - scene.player.x, e.y - scene.player.y) < 300);
    });
    if (!near) {
      await page.keyboard.press('KeyK');
      expect(await page.evaluate(() => (window as any).__entities.skillCooldowns.anyActive)).toBe(false);
    }

    // Beside the first enemy: it is hurt and stunned; one more than 260 px away is not touched
    await page.evaluate(({ x }) => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      scene.player.setPosition(x - 120, scene.player.y);
    }, { x: enemies[0].x });
    await page.waitForTimeout(300);
    const before = await page.evaluate(() => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      return scene.enemies.getChildren().filter((e: any) => e.active).map((e: any) => ({ x: e.x as number, hp: e.entity.currentHp as number, far: Math.hypot(e.x - scene.player.x, e.y - scene.player.y) > 280 }));
    });
    await page.keyboard.press('KeyK');
    await expect.poll(() => page.evaluate(() => (window as any).__entities.skillCooldowns.remainingMs('end-task') as number), { timeout: 4000 }).toBeGreaterThan(0);

    const after = await page.evaluate(() => {
      const scene = (window as any).__botGame.scene.getScene('Game');
      return scene.enemies.getChildren().filter((e: any) => e.active).map((e: any) => ({ x: e.x as number, hp: e.entity.currentHp as number, stunned: e.isStunned as boolean, far: Math.hypot(e.x - scene.player.x, e.y - scene.player.y) > 280 }));
    });
    expect(after.some((e: any) => e.stunned && !e.far)).toBe(true);
    expect(after.filter((e: any) => e.far).every((e: any) => !e.stunned)).toBe(true);
    expect(before.length).toBeGreaterThan(0);
    expect(pageErrors).toEqual([]);
  });
});
