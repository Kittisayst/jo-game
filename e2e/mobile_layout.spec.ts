/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, Page } from '@playwright/test';
import { Bot } from './helpers/bot';

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
        if (m.header) expect(m.header.h, `${label}: header height`).toBeLessThanOrEqual(56);
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
  if (m.header) expect(m.header.h).toBeGreaterThan(60);
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

test.describe('The pause menu on a phone held sideways', () => {
  for (const phone of PHONES) {
    test(`shows all its buttons without scrolling on ${phone.name}`, async ({ browser }) => {
      test.setTimeout(120000);
      const ctx = await browser.newContext({ viewport: phone.viewport, isMobile: true, hasTouch: true });
      const page = await ctx.newPage();
      await page.goto('/?stage=2');
      await expect(page.locator('.game-hud')).toBeVisible({ timeout: 30000 });
      await page.waitForTimeout(1200);
      await page.keyboard.press('Escape');
      await expect(page.locator('.pause-menu-card')).toBeVisible();
      await page.waitForTimeout(500);

      const r = await page.evaluate(() => {
        const card = document.querySelector('.pause-menu-card') as HTMLElement;
        const cb = card.getBoundingClientRect();
        const buttons = [...card.querySelectorAll('button')].map(b => { const x = b.getBoundingClientRect(); return { n: (b.textContent ?? '').trim().slice(0, 14), top: x.top, bottom: x.bottom, h: x.height, w: x.width }; });
        const tiny: string[] = [];
        for (const e of card.querySelectorAll('*')) {
          if (![...e.childNodes].some(n => n.nodeType === 3 && (n.textContent ?? '').trim())) continue;
          const b = e.getBoundingClientRect(); const cs = getComputedStyle(e);
          if (b.width > 0 && cs.display !== 'none' && parseFloat(cs.fontSize) < 11.99) tiny.push(`${(e.textContent ?? '').trim().slice(0, 12)} ${cs.fontSize}`);
        }
        return { vh: innerHeight, top: cb.top, bottom: cb.bottom, scroll: card.scrollHeight - card.clientHeight, buttons, tiny };
      });

      expect(r.top, 'card top').toBeGreaterThanOrEqual(0);
      expect(r.bottom, 'card bottom').toBeLessThanOrEqual(r.vh);
      expect(r.scroll, 'card needs no scrolling').toBeLessThanOrEqual(1);
      expect(r.buttons.length).toBeGreaterThanOrEqual(7); // close, 2 switches, 4 actions
      for (const b of r.buttons) {
        expect(b.bottom, `${b.n}: inside the screen`).toBeLessThanOrEqual(r.vh);
        expect(b.h, `${b.n}: height`).toBeGreaterThanOrEqual(39.5);
      }
      expect(r.tiny, 'text under 12px').toEqual([]);

      // The last button works (it was cut off before)
      await page.locator('.pause-menu-card .menu-action-btn.primary').click();
      await expect(page.locator('.pause-menu-card')).toHaveCount(0);
      await ctx.close();
    });
  }
});

/**
 * The other dialogs. The Quiz finisher and the end-of-Stage question were 592 px tall and cut off at both ends of a
 * phone screen: the Confirm button could not be pressed, so a Stage could not be finished.
 */
const DIALOGS: { name: string; card: string; open: (page: Page) => Promise<void> }[] = [
  { name: 'Settings', card: '.settings-modal-card', open: async p => { await p.keyboard.press('Escape'); await p.getByRole('button', { name: /ຕັ້ງຄ່າ/ }).first().click(); } },
  { name: 'Skin shop', card: '.outfit-card', open: async p => { await p.evaluate(() => (window as any).__eventBus.emit('start-dialogue', 'skin_shop')); await p.getByRole('button', { name: /ເບິ່ງຊຸດ/ }).click(); } },
  { name: 'Pet shop', card: '.pet-shop-modal', open: async p => { await p.evaluate(() => (window as any).__eventBus.emit('open-pet-shop')); } },
  { name: 'Quiz finisher', card: '[data-testid=quiz-finisher] > div', open: async p => { await p.evaluate(() => (window as any).__eventBus.emit('open-quiz-finisher', { bookId: 'book-ch1' })); } },
  { name: 'Stage question', card: '[data-testid=stage-question] > div', open: async p => { await p.evaluate(() => (window as any).__eventBus.emit('open-stage-question', { stageId: 'stage-001' })); } },
];

for (const phone of [...PHONES, { name: 'narrow phone 568x320', viewport: { width: 568, height: 320 } }]) {
  test(`the other dialogs fit and can be used on ${phone.name}`, async ({ browser }) => {
    test.setTimeout(240000);
    const ctx = await browser.newContext({ viewport: phone.viewport, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto('/');
    await page.getByText(/ເຂົ້າເກມ \(Play Game\)/).click();
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(1500);

    for (const d of DIALOGS) {
      await d.open(page);
      await expect(page.locator(d.card).first()).toBeVisible();
      await page.waitForTimeout(600);
      const r = await page.evaluate((sel: string) => {
        const card = document.querySelector(sel) as HTMLElement;
        const cb = card.getBoundingClientRect();
        const scrollableAncestor = (e: Element) => { let p = e.parentElement; while (p && p !== card.parentElement) { const s = getComputedStyle(p); if (/(auto|scroll)/.test(s.overflowY) && p.scrollHeight > p.clientHeight + 1) return true; p = p.parentElement; } return false; };
        const unreachable: string[] = []; const small: string[] = []; const tiny: string[] = [];
        for (const b of card.querySelectorAll('button')) {
          const x = b.getBoundingClientRect(); if (x.width === 0) continue;
          const n = ((b.textContent ?? '').trim() || b.getAttribute('aria-label') || b.className).toString().slice(0, 14);
          // A button outside the screen is only fine when it can be scrolled to
          if ((x.bottom > innerHeight + 1 || x.top < -1) && !scrollableAncestor(b)) unreachable.push(n);
          if (x.height < 43.5) small.push(`${n} ${Math.round(x.width)}x${Math.round(x.height)}`);
        }
        for (const e of card.querySelectorAll('*')) {
          if (![...e.childNodes].some(n => n.nodeType === 3 && (n.textContent ?? '').trim())) continue;
          const x = e.getBoundingClientRect(); const s = getComputedStyle(e);
          if (x.width > 0 && s.display !== 'none' && parseFloat(s.fontSize) < 11.99) tiny.push(`${(e.textContent ?? '').trim().slice(0, 10)} ${s.fontSize}`);
        }
        return { top: cb.top, bottom: cb.bottom, vh: innerHeight, unreachable, small, tiny: [...new Set(tiny)] };
      }, d.card);
      const label = `${d.name} on ${phone.name}`;
      expect(r.top, `${label}: card top is on screen`).toBeGreaterThanOrEqual(-1);
      expect(r.bottom, `${label}: card bottom is on screen`).toBeLessThanOrEqual(r.vh + 1);
      expect(r.unreachable, `${label}: buttons that cannot be reached`).toEqual([]);
      expect(r.small, `${label}: buttons under 44px`).toEqual([]);
      expect(r.tiny, `${label}: text under 12px`).toEqual([]);

      // Close whatever is open and go on
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      if (await page.locator('.pause-menu-card').count()) await page.keyboard.press('Escape');
    }
    await ctx.close();
  });
}

for (const phone of [...PHONES, { name: 'narrow phone 568x320', viewport: { width: 568, height: 320 } }]) {
  test(`the end-of-Stage question can be answered with taps on ${phone.name}`, async ({ browser }) => {
    test.setTimeout(120000);
    const ctx = await browser.newContext({ viewport: phone.viewport, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto('/');
    await page.getByText(/ເຂົ້າເກມ \(Play Game\)/).click();
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(1200);
    await page.evaluate(() => (window as any).__eventBus.emit('open-stage-question', { stageId: 'stage-001' }));
    await expect(page.getByTestId('stage-question')).toBeVisible();
    await page.getByTestId('stage-question-option').first().tap();
    // The Confirm button is reachable (scrolled into view if the card scrolls) and works
    await page.getByTestId('stage-question-submit').tap();
    await expect(page.getByTestId('stage-question-continue')).toBeVisible();
    await ctx.close();
  });
}

/**
 * The textbook reader: the lesson is the point of the game. It used to get about 70 px of a 412 px screen (and none
 * at 320 px) because the header, book row, page info row, title and footer took the rest.
 */
for (const phone of [...PHONES, { name: 'narrow phone 568x320', viewport: { width: 568, height: 320 } }]) {
  test(`the textbook reader leaves room to read on ${phone.name}`, async ({ browser }) => {
    test.setTimeout(120000);
    const ctx = await browser.newContext({ viewport: phone.viewport, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto('/');
    await page.getByText(/ເຂົ້າເກມ \(Play Game\)/).click();
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(1200);
    await page.evaluate(() => (window as any).__entities.books['book-ch1'].unlock());
    await page.locator('#hud-library-btn').click();
    await expect(page.locator('.gw-reader-body')).toBeVisible();
    await page.waitForTimeout(600);

    const r = await page.evaluate(() => {
      const body = document.querySelector('.gw-reader-body') as HTMLElement;
      const bb = body.getBoundingClientRect();
      const foot = document.querySelector('.gw-readerfoot')!.getBoundingClientRect();
      const small: string[] = [];
      for (const b of document.querySelectorAll('.gw-window button')) {
        const x = b.getBoundingClientRect();
        if (x.width > 0 && x.height < 43.5) small.push(`${(b.textContent ?? '').trim().slice(0, 14)} ${Math.round(x.height)}`);
      }
      return { vh: innerHeight, bodyH: bb.height, footBottom: foot.bottom, footH: foot.height, small };
    });
    // Most of the screen is the lesson (a scrolling area), the controls stay on the screen
    expect(r.bodyH / r.vh, 'reading area share of the height').toBeGreaterThanOrEqual(phone.viewport.height <= 340 ? 0.30 : 0.40);
    expect(r.footBottom, 'footer is on the screen').toBeLessThanOrEqual(r.vh + 1);
    expect(r.small, 'buttons under 44px').toEqual([]);

    // The page can be read: after the timer the confirm button turns the page
    await expect(page.getByRole('button', { name: /ອ່ານເຂົ້າໃຈແລ້ວ/ })).toBeEnabled({ timeout: 9000 });
    await page.getByRole('button', { name: /ອ່ານເຂົ້າໃຈແລ້ວ/ }).tap();
    await expect(page.getByText(/ໜ້າທີ 2 \//)).toBeVisible();
    await ctx.close();
  });
}

test.describe('A phone held upright (M5)', () => {
  test('a full-screen message appears and the game pauses; turning the phone back resumes it', async ({ browser }) => {
    test.setTimeout(120000);
    const ctx = await browser.newContext({ viewport: { width: 915, height: 412 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto('/');
    await page.getByText(/ເຂົ້າເກມ \(Play Game\)/).click();
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('rotate-overlay')).toHaveCount(0);
    const bot = new Bot(page, false);
    await expect.poll(async () => (await bot.state()).scene, { timeout: 20000 }).toBe('village');

    // Turned upright: the message covers the screen and the game is paused
    await page.setViewportSize({ width: 412, height: 915 });
    const overlay = page.getByTestId('rotate-overlay');
    await expect(overlay).toBeVisible();
    const box = await overlay.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(411);
    expect(box!.height).toBeGreaterThanOrEqual(914);
    await expect(page.locator('.pause-menu-card')).toBeVisible();
    expect((await bot.state()).isPaused, 'the game scene is paused').toBe(true);

    // Turned back: the message goes and the game runs again (it was this hook that paused it)
    await page.setViewportSize({ width: 915, height: 412 });
    await expect(overlay).toHaveCount(0);
    await expect(page.locator('.pause-menu-card')).toHaveCount(0);
    await expect.poll(async () => (await bot.state()).isPaused).toBe(false);
    await ctx.close();
  });

  test('"keep playing upright" hides the message and the game is not paused again', async ({ browser }) => {
    test.setTimeout(120000);
    const ctx = await browser.newContext({ viewport: { width: 915, height: 412 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto('/');
    await page.getByText(/ເຂົ້າເກມ \(Play Game\)/).click();
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 30000 });
    const bot = new Bot(page, false);
    await expect.poll(async () => (await bot.state()).scene, { timeout: 20000 }).toBe('village');
    await page.setViewportSize({ width: 412, height: 915 });
    await expect(page.getByTestId('rotate-overlay')).toBeVisible();
    await page.getByTestId('rotate-continue').tap();
    await expect(page.getByTestId('rotate-overlay')).toHaveCount(0);
    // The game it paused is resumed, and turning the phone again does not bring the message back
    await expect.poll(async () => (await bot.state()).isPaused).toBe(false);
    await page.setViewportSize({ width: 915, height: 412 });
    await page.setViewportSize({ width: 412, height: 915 });
    await page.waitForTimeout(400);
    await expect(page.getByTestId('rotate-overlay')).toHaveCount(0);
    await ctx.close();
  });

  test('a desktop window that is taller than wide is not blocked', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 900 });
    await page.goto('/');
    await page.getByText(/ເຂົ້າເກມ \(Play Game\)/).click();
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('rotate-overlay')).toHaveCount(0);
  });
});
