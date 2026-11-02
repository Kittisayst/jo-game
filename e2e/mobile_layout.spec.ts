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

const WINDOWS: { name: string; event?: string; arg?: string; key?: string }[] = [
  { name: 'Smithy (tools)', event: 'open-smithy', arg: 'tools' },
  { name: 'Smithy (weapons)', event: 'open-smithy', arg: 'weapons' },
  { name: 'Shop', event: 'open-shop' },
  { name: 'Backpack', event: 'open-backpack' },
  { name: 'Academy', event: 'open-academy' },
  { name: 'Library', event: 'open-library' },
  { name: 'World Map', event: 'open-stage-map' },
  { name: 'Quest Board', event: 'open-quest-board' },
  { name: 'Character', key: 'KeyC' },
  { name: 'Storage', event: 'open-storage' },
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
        if (w.key) await page.keyboard.press(w.key);
        else await page.evaluate(({ event, arg }) => (window as any).__eventBus.emit(event, arg), { event: w.event, arg: w.arg });
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
        // (the World Map has no separate body or tab strip: its card scrolls under the sticky header)
        if (m.body) expect(m.body.h / m.vh, `${label}: body share of the height`).toBeGreaterThanOrEqual(0.5);
        // Tabs (or the filter row) are a single strip, not clipped
        if (m.tabs) expect(m.tabs.h, `${label}: tab strip height`).toBeLessThanOrEqual(64);
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

test.describe('The play area on a phone held sideways', () => {
  for (const phone of PHONES) {
    test(`HUD in two rows, quest panel collapsed, short one-line toast on ${phone.name}`, async ({ browser }) => {
      test.setTimeout(120000);
      const ctx = await browser.newContext({ viewport: phone.viewport, isMobile: true, hasTouch: true });
      const page = await ctx.newPage();
      await page.goto('/');
      await page.getByText(/ເຂົ້າເກມ \(Play Game\)/).click();
      await expect(page.locator('.game-hud')).toBeVisible({ timeout: 30000 });

      // The welcome toast: one line, narrow, under the HUD, and gone after a few seconds
      const toast = page.locator('.village-welcome-toast');
      await expect(toast).toBeVisible();
      await page.waitForTimeout(600); // after its slide-in
      const t = await toast.boundingBox();
      expect(t!.height, 'toast height (one line)').toBeLessThanOrEqual(48);
      expect(t!.width, 'toast width').toBeLessThanOrEqual(phone.viewport.width * 0.6 + 1);
      expect(t!.y, 'toast sits under the HUD rows').toBeGreaterThanOrEqual(80);
      await expect(toast).toHaveCount(0, { timeout: 6000 });

      // The vitals row fits one row: the HUD is two rows at most
      const left = await page.locator('.hud-cluster-left').boundingBox();
      expect(left!.height, 'HUD left cluster height').toBeLessThanOrEqual(80);

      // The quest panel starts as a 44 px pill, not a 13% panel
      const pill = page.locator('.quest-tracker-pill');
      await expect(pill).toBeVisible();
      await expect(page.locator('.quest-tracker-card')).toHaveCount(0);
      const p = await pill.boundingBox();
      expect(p!.height).toBeGreaterThanOrEqual(43.5);
      expect(p!.width).toBeGreaterThanOrEqual(43.5);

      // Tapping it opens the list; its buttons are big enough, and ➖ puts it back
      await pill.click();
      await expect(page.locator('.quest-tracker-card')).toBeVisible();
      for (const b of await page.locator('.quest-tracker-btn').all()) {
        const bb = await b.boundingBox();
        expect(bb!.height).toBeGreaterThanOrEqual(43.5);
        expect(bb!.width).toBeGreaterThanOrEqual(43.5);
      }
      await page.locator('.quest-tracker-btn').last().click();
      await expect(page.locator('.quest-tracker-pill')).toBeVisible();
      await ctx.close();
    });
  }

  test('on a desktop the quest panel is open at first', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.getByText(/ເຂົ້າເກມ \(Play Game\)/).click();
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('.quest-tracker-card')).toBeVisible();
  });
});

test.describe('Touch sizes on a phone held sideways', () => {
  for (const phone of PHONES) {
    test(`HUD buttons and touch controls are tappable on ${phone.name}`, async ({ browser }) => {
      test.setTimeout(120000);
      const ctx = await browser.newContext({ viewport: phone.viewport, isMobile: true, hasTouch: true });
      const page = await ctx.newPage();
      await page.goto('/?stage=2');
      await expect(page.locator('.game-hud')).toBeVisible({ timeout: 30000 });
      await page.waitForTimeout(2000);

      const r = await page.evaluate(() => {
        const vis = (e: Element) => { const b = e.getBoundingClientRect(); const s = getComputedStyle(e); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
        const name = (e: Element) => ((e.getAttribute('aria-label') || e.textContent || e.className) as string).toString().trim().slice(0, 14);
        const small: string[] = [];
        for (const e of document.querySelectorAll('.game-hud button, .hud-hotbar button, .quest-tracker-hud button, button.virtual-touch-btn')) {
          if (!vis(e)) continue;
          const b = e.getBoundingClientRect();
          if (b.width < 43.5 || b.height < 43.5) small.push(`${name(e)} ${Math.round(b.width)}x${Math.round(b.height)}`);
        }
        const tiny: string[] = [];
        for (const e of document.querySelectorAll('.game-hud *, .virtual-touch-controls *, .quest-tracker-hud *')) {
          if (!vis(e) || ![...e.childNodes].some(n => n.nodeType === 3 && (n.textContent ?? '').trim())) continue;
          const fs = parseFloat(getComputedStyle(e).fontSize);
          if (fs < 11.99) tiny.push(`${name(e)} ${fs}px`);
        }
        const size = (sel: string) => { const e = document.querySelector(sel); if (!e) return 0; const b = e.getBoundingClientRect(); return Math.min(b.width, b.height); };
        const touch = [...document.querySelectorAll('button.virtual-touch-btn')].filter(vis).map(e => { const b = e.getBoundingClientRect(); return { n: name(e), x: b.x, y: b.y, r: b.right, b: b.bottom }; });
        const overlaps: string[] = [];
        for (let i = 0; i < touch.length; i++) {
          if (touch[i].x < 0 || touch[i].r > innerWidth || touch[i].y < 0 || touch[i].b > innerHeight) overlaps.push(`${touch[i].n} outside the screen`);
          for (let j = i + 1; j < touch.length; j++) {
            const a = touch[i], c = touch[j];
            if (a.x < c.r && c.x < a.r && a.y < c.b && c.y < a.b) overlaps.push(`${a.n} / ${c.n}`);
          }
        }
        return { small, tiny, overlaps, attack: size('.virtual-touch-attack'), jump: size('.virtual-touch-jump'), count: touch.length };
      });

      expect(r.count, 'touch buttons shown').toBeGreaterThanOrEqual(5);
      expect(r.small, `buttons under 44px on ${phone.name}`).toEqual([]);
      expect(r.tiny, `text under 12px on ${phone.name}`).toEqual([]);
      expect(r.overlaps, `touch buttons that overlap or leave the screen on ${phone.name}`).toEqual([]);
      expect(r.attack, 'attack button').toBeGreaterThanOrEqual(60);
      expect(r.jump, 'jump button').toBeGreaterThanOrEqual(70);

      // The HUD did not grow to make room for the bigger buttons
      const left = await page.locator('.hud-cluster-left').boundingBox();
      expect(left!.height, 'HUD left cluster height').toBeLessThanOrEqual(80);
      await ctx.close();
    });
  }
});
