/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, Page } from '@playwright/test';

/**
 * Windows on a phone held sideways (docs/plans/2026-11-02-mobile-ui-improvements.md, M1/M2): a window fills the
 * screen as a sheet with a slim header, so most of the height is content. The checks are measurements, so a window
 * that goes back to the desktop layout fails here.
 */
const PHONES = [
  { name: 'Android 915x412', viewport: { width: 915, height: 412 } },
  { name: 'small phone 667x375', viewport: { width: 667, height: 375 } },
];

const WINDOWS: { name: string; event: string; arg?: string; testid?: string }[] = [
  { name: 'Smithy (tools)', event: 'open-smithy', arg: 'tools' },
  { name: 'Smithy (weapons)', event: 'open-smithy', arg: 'weapons' },
  { name: 'Shop', event: 'open-shop' },
  { name: 'Backpack', event: 'open-backpack' },
];

async function measure (page: Page)
{
  return page.evaluate(() => {
    const box = (sel: string) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, bottom: b.bottom, right: b.right }; };
    const win = document.querySelector('.gw-window') as HTMLElement;
    const small: string[] = [];
    for (const el of win.querySelectorAll('*')) {
      const own = [...el.childNodes].some(n => n.nodeType === 3 && (n.textContent ?? '').trim());
      const cs = getComputedStyle(el);
      const b = el.getBoundingClientRect();
      if (own && b.width > 0 && b.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.fontSize) < 11.99) {
        small.push(`${(el.textContent ?? '').trim().slice(0, 14)} ${cs.fontSize}`);
      }
    }
    const tiny: string[] = [];
    for (const el of win.querySelectorAll('button')) {
      const b = el.getBoundingClientRect();
      if (b.width > 0 && b.height > 0 && b.height < 43.5) tiny.push(`${(el.textContent ?? '').trim().slice(0, 14)} ${Math.round(b.width)}x${Math.round(b.height)}`);
    }
    return {
      vw: innerWidth, vh: innerHeight,
      window: box('.gw-window'), header: box('.gw-header'), body: box('.gw-body'), tabs: box('.gw-tabs'),
      smallText: small, smallButtons: tiny,
      hasTabs: !!document.querySelector('.gw-tabs'),
    };
  });
}

for (const phone of PHONES) {
  test.describe(`Windows on ${phone.name}`, () => {
    test('are full-screen sheets with a slim header and room for content', async ({ browser }) => {
      test.setTimeout(150000);
      const ctx = await browser.newContext({ viewport: phone.viewport, isMobile: true, hasTouch: true });
      const page = await ctx.newPage();
      const errors: string[] = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto('/');
      await page.getByText(/ເຂົ້າເກມ \(Play Game\)/).click();
      await expect(page.locator('.game-hud')).toBeVisible({ timeout: 30000 });
      await page.waitForTimeout(1200);

      for (const w of WINDOWS) {
        await page.evaluate(({ event, arg }) => (window as any).__eventBus.emit(event, arg), { event: w.event, arg: w.arg });
        await expect(page.locator('.gw-window')).toBeVisible();
        await page.waitForTimeout(450);
        const m = await measure(page);
        const label = `${w.name} on ${phone.name}`;

        // Fills the screen: no outer margin
        expect(m.window!.x, `${label}: left edge`).toBeLessThanOrEqual(1);
        expect(m.window!.w, `${label}: width`).toBeGreaterThanOrEqual(m.vw - 1);
        expect(m.window!.h, `${label}: height`).toBeGreaterThanOrEqual(m.vh - 1);
        // Slim header
        expect(m.header!.h, `${label}: header height`).toBeLessThanOrEqual(56);
        // Most of the screen is content
        expect(m.body!.h / m.vh, `${label}: body share of the height`).toBeGreaterThanOrEqual(0.5);
        // Tabs (or the filter row) are a single strip, not clipped
        expect(m.hasTabs).toBe(true);
        expect(m.tabs!.h, `${label}: tab strip height`).toBeLessThanOrEqual(64);
        // Nothing smaller than 12 px, no button smaller than 44 px high
        expect(m.smallText, `${label}: text under 12px`).toEqual([]);
        expect(m.smallButtons, `${label}: buttons under 44px`).toEqual([]);

        await page.keyboard.press('Escape');
        await expect(page.locator('.gw-window')).toHaveCount(0);
      }
      expect(errors).toEqual([]);
      await ctx.close();
    });
  });
}

test('on a desktop the windows keep their own size and header', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByText(/ເຂົ້າເກມ \(Play Game\)/).click();
  await expect(page.locator('.game-hud')).toBeVisible({ timeout: 30000 });
  await page.evaluate(() => (window as any).__eventBus.emit('open-smithy', 'tools'));
  await expect(page.locator('.gw-window')).toBeVisible();
  const m = await measure(page);
  expect(m.window!.w).toBeLessThan(m.vw - 100);
  expect(m.header!.h).toBeGreaterThan(60);
});
