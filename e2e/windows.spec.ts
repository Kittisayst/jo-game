/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, Page } from '@playwright/test';

const emit = (page: Page, event: string, ...args: unknown[]) =>
  page.evaluate(([e, a]) => (window as any).__eventBus.emit(e, ...(a as unknown[])), [event, args] as const);

const background = (page: Page, locator: ReturnType<Page['locator']>) =>
  locator.evaluate(el => getComputedStyle(el).backgroundColor);

test.describe('Windows show their states', () => {
  test('every window opens without an error, and a chosen answer, a ready button and a selected slot have a colour', async ({ page }) => {
    test.setTimeout(150000);
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));
    await page.goto('/?stage=2');
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      const e = (window as any).__entities;
      e.forgeUnlocked = true;
      for (const [id, n] of [['wood', 5], ['repair-kit', 1], ['hammer-t1', 1]] as const) e.backpack.addItem(id, n);
    });

    // The windows the scene opens with an event (a development build exposes the event bus)
    for (const [event, args] of [
      ['open-workshop', []], ['open-forge', []], ['open-academy', []], ['open-library', []], ['open-storage', []],
      ['open-waypoint', ['Waypoint']], ['open-stage-map', []],
    ] as const) {
      await emit(page, event, ...args);
      await page.waitForTimeout(400);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
    }

    // The Gate: the chosen answer and the confirm button are coloured (their classes were once undefined)
    await emit(page, 'open-gate-repair', 'gate-ch1', { requiredTool: 'hammer', requiredItem: 'repair-kit' });
    const option = page.getByRole('button', { name: /^B\./ }).first();
    await option.click();
    await page.waitForTimeout(400); // the colour fades in over 150 ms
    const confirm = page.getByRole('button', { name: /ຢືນຢັນການສ້ອມແປງ/ });
    expect(await background(page, confirm)).toBe('rgb(245, 158, 11)');
    expect(await background(page, option)).toBe('rgba(245, 158, 11, 0.3)');
    await page.keyboard.press('Escape');

    // The Quiz Finisher: the chosen answer is highlighted and the button has its gradient
    await emit(page, 'open-quiz-finisher', { bookId: 'book-ch1' });
    const answer = page.getByRole('button', { name: /^B\./ }).first();
    await answer.click();
    await page.waitForTimeout(400);
    expect(await background(page, answer)).toBe('rgba(147, 51, 234, 0.4)');
    expect(await page.getByRole('button', { name: /ປ່ອຍພະລັງ/ }).evaluate(el => getComputedStyle(el).backgroundImage)).toContain('gradient');
    await page.keyboard.press('Escape');

    // The Backpack: the selected slot has a cyan border
    await page.keyboard.press('KeyI');
    await page.locator('button', { hasText: 'x5' }).first().click();
    await page.waitForTimeout(400);
    const border = await page.locator('button', { hasText: 'x5' }).first().evaluate(el => getComputedStyle(el).borderTopColor);
    expect(border).toBe('rgb(34, 211, 238)');
    expect(pageErrors).toEqual([]);
  });
});
