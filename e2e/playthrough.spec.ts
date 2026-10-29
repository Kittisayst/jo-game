import { test, expect, Page } from '@playwright/test';
import items from '../public/data/items.json';
import questions from '../public/data/questions.json';
import { Bot } from './helpers/bot';

/**
 * An experimental bot that tries to play Chapter 1 with real key presses and real clicks: buy and
 * read the textbook, pass the exam, craft, explore the forest and the cavern. It never teleports the
 * hero or edits game state; it only reads the scene to decide what to press.
 *
 * Status: the learning half works (buy, read five pages, answer the exam from the book: ends with
 * 50 Credit and the recipes unlocked). The fighting half does not finish the chapter: the bot is
 * crude (it cannot dodge, and fights with the sword only now that stomping is gone) and usually dies
 * before the cavern, so it never gets stone, the gate or the Boss. It asserts only the learning half and logs the rest, so read the log, not the pass mark.
 *
 * NOTE: Chapter 1 is now Stage 1 to 10 of Realm 1 (see docs/plans/2026-10-29-hundred-stages-realms.md). This bot was
 * written for the old single Stage, so it only enters Stage 1 now and its forest, cavern, gate and boss steps no longer
 * match the stage layouts. It needs rewriting for the 10-stage flow before its fighting half means anything again.
 *
 * Opt-in because it takes minutes:   PLAYTHROUGH=1 npx playwright test e2e/playthrough.spec.ts
 */

const itemName = (id: string) => items.find(i => i.id === id)!.name;

async function inventory (page: Page)
{
  return page.evaluate(async () => {
    const { entities } = await import('/src/infrastructure/composition.ts');
    const count = (id: string) => entities.backpack.getItemCount(id);
    return {
      credit: entities.wallet.balance,
      wood: count('wood'), stone: count('stone'), iron: count('iron-ore'), herb: count('herb'), crystal: count('crystal'),
      pickaxe: count('pickaxe-t1'), hammer: count('hammer-t1'), kit: count('repair-kit'), potion: count('herb-potion'),
      ironSword: count('iron-sword'), crystalSword: count('crystal-sword'), bossCore: count('boss-core'),
      weapon: entities.equipment.equippedWeaponId,
      bookOwned: entities.books['book-ch1'].isUnlocked, examPassed: entities.books['book-ch1'].examPassed,
      gateRepaired: entities.repairedGates.has('gate-ch1'),
      cleared: entities.stageProgression.isStageCompleted('stage-010'),
    };
  });
}

async function walkVillageTo (bot: Bot, x: number)
{
  const result = await bot.goTo(x, { fight: false, timeoutMs: 20000 });
  expect(result, `walk to x=${x}`).toBe('arrived');
}

async function learnChapterOne (page: Page, bot: Bot)
{
  // Library: buy the textbook with the starting 20 Credit
  await walkVillageTo(bot, 300);
  await bot.interact();
  await page.getByRole('button', { name: /ຊື້ປຶ້ມຕຳລາ/ }).first().click();
  await expect(page.locator('.wallet-hud-badge')).toContainText('0');
  bot.note('bought the textbook');

  // Read all five pages (the page timer makes this the slow part)
  await page.getByRole('button', { name: /ເປີດອ່ານຕຳລາ/ }).click();
  for (let n = 1; n <= 5; n++) {
    await expect(page.locator(`text=ໜ້າທີ ${n} / 5`)).toBeVisible();
    const next = page.locator(n < 5 ? 'button:has-text("ອ່ານເຂົ້າໃຈແລ້ວ & ໜ້າຕໍ່ໄປ")' : 'button:has-text("ຢືນຢັນອ່ານຈົບໜ້າສຸດທ້າຍ")');
    await expect(next).toBeVisible({ timeout: 10000 });
    await next.click();
  }
  bot.note('read all 5 pages');

  // Academy: take the exam and answer every question correctly from the book
  await page.locator('button:has-text("ໄປສອບເສັງທີ່ສະຖາບັນ")').click();
  await page.locator('button:has-text("ເລີ່ມສອບເສັງ")').click();
  const cards = page.locator('div.space-y-4 > div').filter({ has: page.locator('h4') });
  const total = await cards.count();
  for (let i = 0; i < total; i++) {
    const card = cards.nth(i);
    const text = await card.innerText();
    const known = questions.find(entry => text.includes(entry.question));
    if (!known) throw new Error(`Unknown exam question: ${text.slice(0, 60)}`);
    await card.locator('button').filter({ hasText: known.options[known.correctIndex] }).first().click();
  }
  await page.locator('button:has-text("ສົ່ງບົດສອບເສັງ")').click();
  await expect(page.locator('text=ຄະແນນທີ່ໄດ້:')).toBeVisible();
  await page.keyboard.press('Escape');
  const inv = await inventory(page);
  expect(inv.examPassed).toBe(true);
  bot.note(`exam passed, credit now ${inv.credit}`);
}

async function craftAtWorkshop (page: Page, bot: Bot, itemIds: string[])
{
  if (itemIds.length === 0) return;
  await walkVillageTo(bot, 880);
  await bot.interact();
  for (const id of itemIds) {
    const card = page.locator('div.p-4.rounded-xl').filter({ has: page.locator('h3', { hasText: itemName(id) }) });
    const button = card.getByRole('button', { name: 'ສ້າງ (Craft)' });
    if (await button.count()) {
      await button.click();
      bot.note(`crafted ${id}`);
    }
  }
  await page.keyboard.press('Escape');
}

async function enterStage (page: Page, bot: Bot)
{
  await walkVillageTo(bot, 1420);
  await bot.interact();
  await page.getByRole('button', { name: /^ດ່ານ 1: / }).click();
  await expect.poll(async () => (await bot.state()).scene, { timeout: 15000 }).toBe('stage-001');
  await page.waitForTimeout(600);
}

async function returnThroughWaypoint (page: Page, bot: Bot, waypointX: number)
{
  const result = await bot.goTo(waypointX, { fight: true, timeoutMs: 60000 });
  if (result === 'dead' || result === 'left-scene') return result;
  await bot.interact();
  await page.getByRole('button', { name: 'ວາບກັບໝູ່ບ້ານ' }).click();
  await expect.poll(async () => (await bot.state()).scene, { timeout: 15000 }).toBe('village');
  await page.waitForTimeout(600);
  return 'returned';
}

async function waitForVillage (bot: Bot)
{
  await expect.poll(async () => (await bot.state()).scene, { timeout: 20000 }).toBe('village');
  await bot.page.waitForTimeout(800);
}

/** Walks through a list of stops, fights what gets in the way, heals when low, and presses E at each stop (several times, since a node needs several Strikes). */
async function sweep (bot: Bot, stops: { x: number; interact?: boolean }[])
{
  for (const stop of stops) {
    const result = await bot.goTo(stop.x, { fight: true, timeoutMs: 45000 });
    if (result === 'dead' || result === 'left-scene') return false;

    let s = await bot.state();
    if (s.hearts <= 1 && !s.enemies.some(e => Math.abs(e.x - s.x) < 200)) {
      await bot.drinkPotion();
      s = await bot.state();
    }
    if (stop.interact !== false) {
      // Trees take 3 Strikes and iron veins 4, one every 400 ms at most; extra presses on a node that is gone do nothing
      for (let strike = 0; strike < 5; strike++) {
        await bot.interact();
        await bot.page.waitForTimeout(450);
      }
    }
  }
  return true;
}

test('Chapter 1 played with real keys (learning half asserted, fighting half logged)', async ({ page }) => {
  test.skip(!process.env.PLAYTHROUGH, 'Opt-in: set PLAYTHROUGH=1 (takes several minutes)');
  test.setTimeout(25 * 60 * 1000);
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: /ເຂົ້າເກມ/i }).click();
  await expect(page.locator('.game-hud')).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(1200);

  const bot = new Bot(page);
  await learnChapterOne(page, bot);

  for (let attempt = 1; attempt <= 8; attempt++) {
    const inv = await inventory(page);
    bot.note(`attempt ${attempt}: ${JSON.stringify(inv)}`);
    if (inv.cleared) break;

    // Craft whatever the pack allows: tools first, then potions with spare herbs
    const toCraft: string[] = [];
    if (!inv.pickaxe && inv.wood >= 8 && inv.stone >= 5) toCraft.push('pickaxe-t1');
    if (!inv.hammer && inv.wood >= 6 && inv.iron >= 4) toCraft.push('hammer-t1');
    if (!inv.kit && inv.wood >= 5 && inv.iron >= 3 && inv.crystal >= 1) toCraft.push('repair-kit');
    if (inv.herb >= 2 && inv.wood >= 1) toCraft.push('herb-potion');
    await craftAtWorkshop(page, bot, toCraft);

    await enterStage(page, bot);
    bot.note('entered the stage');

    // Forest: trees and herbs (the tree next to the spike is chopped from the left)
    const forest = [{ x: 300 }, { x: 420 }, { x: 550 }, { x: 625 }, { x: 780 }, { x: 880 }];
    // Cavern: the golems drop stone; stay clear of the spike at x=1680
    const cavern = [{ x: 1240, interact: false }, { x: 1480, interact: false }];

    let alive = await sweep(bot, forest);
    bot.note(`forest done, alive=${alive}`);
    if (alive) {
      alive = await sweep(bot, cavern);
      bot.note(`cavern done, alive=${alive}`);
    }

    if (!alive) {
      bot.note('the hero fell; waiting to wake up in the village');
      await waitForVillage(bot);
      continue;
    }

    const back = await returnThroughWaypoint(page, bot, 120);
    bot.note(`return result: ${back}`);
    if (back !== 'returned') await waitForVillage(bot);
  }

  console.log(['PLAYTHROUGH LOG', ...bot.log].join(String.fromCharCode(10)));
  console.log('FINAL', JSON.stringify(await inventory(page)));
});
