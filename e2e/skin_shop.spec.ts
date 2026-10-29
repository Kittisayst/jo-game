import { test, expect, Page } from '@playwright/test';
import { Bot } from './helpers/bot';
import { getPlayerTexture } from './helpers/gameProbe';

/** What the player has bought and worn, as written to the autosave. */
async function savedState (page: Page)
{
  return page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem('jo_save_autosave') || 'null');
    return save && { credit: save.wallet.balance as number, worn: save.activeSkinId as string, owned: save.ownedSkins as string[] };
  });
}

/** Walks to Mina from the village start and talks to her. */
async function talkToMina (page: Page)
{
  const bot = new Bot(page, false);
  expect(await bot.goTo(1250, { fight: false, tolerance: 20 })).toBe('arrived');
  await bot.interact();
  return bot;
}

test.describe('Skin shop (Mina)', () => {
  test('A new player talks to Mina, tries a Skin on for free and cannot afford it', async ({ page }) => {
    test.setTimeout(90000);
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: /ເຂົ້າເກມ/i }).click();
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 12000 });
    await page.waitForTimeout(1000);

    const bot = await talkToMina(page);

    const dialogue = page.locator('.dialogue-box').filter({ hasText: 'Mina' });
    await expect(dialogue).toBeVisible();
    // The textbook has not been bought yet, so Mina reminds the player to keep its price
    await expect(dialogue).toContainText('ຍິນດີຕ້ອນຮັບ!');
    await expect(dialogue).toContainText('ເກັບ 20 Credit ໄວ້ຊື້ປຶ້ມຕຳລາກ່ອນນະ.');

    // "Later" closes without opening the shop
    await page.getByRole('button', { name: /ໄວ້ກ່ອນ/ }).click();
    await expect(page.locator('.outfit-card')).toHaveCount(0);
    await bot.interact();

    // "Look at the outfits" opens the shop
    await page.getByRole('button', { name: /ເບິ່ງຊຸດ/ }).click();
    const shop = page.locator('.outfit-card');
    await expect(shop).toBeVisible();
    await expect(shop.locator('.outfit-wallet')).toContainText('20');

    // Try-on shows the Skin inside the shop only: nothing is worn or spent
    await shop.locator('[data-skin-id="neon-ninja"]').click();
    await expect(shop.locator('.outfit-tryon')).toBeVisible();
    await expect(shop.locator('.outfit-detail h3')).toContainText('Neon Shinobi');
    await expect(page.locator('.wallet-hud-badge')).toContainText('20');
    expect(await getPlayerTexture(page)).toBe('player-skin-cyber-blue');

    // Too poor: the shop says so and buying does nothing
    await expect(shop.locator('.outfit-reason')).toContainText('Credit ບໍ່ພໍ');
    await shop.locator('.outfit-action').click();
    await expect(shop.locator('.outfit-notice')).toContainText('Credit ບໍ່ພໍ');
    await expect(shop.locator('.outfit-wallet')).toContainText('20');
    await expect(shop.locator('[data-skin-id="neon-ninja"] .outfit-row-tag')).not.toContainText('ເປັນຂອງເຈົ້າ');
    expect(await getPlayerTexture(page)).toBe('player-skin-cyber-blue');
  });

  test('With enough Credit the Skin is bought and worn at Mina, saved, and Esc only closes the shop', async ({ page }) => {
    test.setTimeout(90000);
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto('/');
    await page.evaluate(async () => {
      const { createDefaultSaveSnapshot } = await import('/src/domain/entities/SaveData.ts');
      const snap = createDefaultSaveSnapshot('slot_1');
      snap.wallet.balance = 100;
      window.localStorage.setItem('jo_save_slot_1', JSON.stringify(snap));
    });
    await page.reload();
    await page.locator('#btn-play-game').click();
    await expect(page.locator('.game-hud')).toBeVisible({ timeout: 12000 });
    await page.waitForTimeout(1000);

    await talkToMina(page);
    await page.getByRole('button', { name: /ເບິ່ງຊຸດ/ }).click();
    const shop = page.locator('.outfit-card');
    await expect(shop).toBeVisible();
    await expect(shop.locator('.outfit-wallet')).toContainText('100');

    // The price and the Credit left after buying are shown before the player commits
    await shop.locator('[data-skin-id="neon-ninja"]').click();
    await expect(shop.locator('.outfit-after')).toContainText('60');
    await shop.locator('.outfit-action').click();
    await expect(shop.locator('.outfit-notice')).toContainText('ຊື້ຊຸດສຳເລັດ');
    await expect(shop.locator('.outfit-wallet')).toContainText('60');
    await expect(shop.locator('[data-skin-id="neon-ninja"] .outfit-row-tag')).toContainText('ເປັນຂອງເຈົ້າ');
    // Buying does not change the hero by itself
    expect(await getPlayerTexture(page)).toBe('player-skin-cyber-blue');

    // Enter wears the owned Skin: the hero changes at once
    await page.keyboard.press('Enter');
    await expect(shop.locator('.outfit-action')).toBeDisabled();
    await expect.poll(() => getPlayerTexture(page)).toBe('player-skin-neon-ninja');

    // The purchase and the choice are saved (autosave writes at most every 3 seconds)
    await expect.poll(() => savedState(page), { timeout: 8000 }).toEqual({
      credit: 60,
      worn: 'neon-ninja',
      owned: ['cyber-blue', 'neon-ninja'],
    });

    // Esc closes the shop and does not pause the game
    await page.keyboard.press('Escape');
    await expect(shop).toHaveCount(0);
    await expect(page.locator('.pause-menu-card')).toHaveCount(0);
  });
});
