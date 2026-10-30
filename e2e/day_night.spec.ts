/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';
import { openStage } from './helpers/stage';

test.describe('Day and night', () => {
  test('the HUD shows the time of day, night falls when the clock gets there, and the dark layer follows', async ({ page }) => {
    test.setTimeout(60000);
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));
    await openStage(page, 2);

    const badge = page.getByTestId('world-time');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveAttribute('data-phase', 'day');

    const darkness = () => page.evaluate(() => (window as any).__entities.worldTime.darkness as number);
    expect(await darkness()).toBe(0);

    // The clock starts at 2:00 into a 20 minute day: 12 minutes more is dusk, then a minute more is night
    await page.evaluate(() => (window as any).__advanceWorldTime(11 * 60_000 + 30_000));
    await expect(badge).toHaveAttribute('data-phase', 'dusk', { timeout: 3000 });
    await page.evaluate(() => (window as any).__advanceWorldTime(60_000));
    await expect(badge).toHaveAttribute('data-phase', 'night', { timeout: 3000 });
    expect(await darkness()).toBeCloseTo(0.55, 2);

    // The dark layer is on screen: the camera-fixed rectangle has the opacity of the darkness
    const layer = await page.evaluate(async () => {
      await new Promise(r => setTimeout(r, 300));
      const scene = (window as any).__botGame.scene.getScene('Game');
      const dark = scene.children.list.find((o: any) => o.type === 'Rectangle' && o.depth === 900);
      return { alpha: dark.alpha as number, visible: dark.visible as boolean };
    });
    expect(layer.visible).toBe(true);
    expect(layer.alpha).toBeCloseTo(0.55, 2);

    // Morning comes: back to day, no dark layer
    await page.evaluate(() => (window as any).__advanceWorldTime(7 * 60_000));
    await expect(badge).toHaveAttribute('data-phase', 'day', { timeout: 3000 });
    expect(await darkness()).toBe(0);
    expect(pageErrors).toEqual([]);
  });

  test('time only moves while the game runs, and the time of day is saved', async ({ page }) => {
    test.setTimeout(60000);
    await openStage(page, 2);

    const fraction = () => page.evaluate(() => (window as any).__entities.worldTime.dayFraction as number);
    const before = await fraction();
    await page.waitForTimeout(1500);
    const after = await fraction();
    expect(after).toBeGreaterThan(before);

    await page.evaluate(() => (window as any).__advanceWorldTime(14 * 60_000));
    const snapshot = await page.evaluate(() => (window as any).__entities.toSnapshot('manual-1') as { worldTime: { dayFraction: number } });
    expect(snapshot.worldTime.dayFraction).toBeGreaterThan(0.7);
    await page.evaluate((s: unknown) => {
      const e = (window as any).__entities;
      e.worldTime.loadFrom({ dayFraction: 0.2 });
      e.loadFromSnapshot(s);
    }, snapshot);
    expect(await page.evaluate(() => (window as any).__entities.worldTime.phase as string)).toBe('night');
  });
});
