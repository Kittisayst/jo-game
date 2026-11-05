/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';
import { walkRightTo } from './helpers/gameProbe';

test.describe('Knowledge Quest — Buy-to-Read Textbook & Chapter 1 Loop E2E', () => {
  test('Enforces Buy-at-Library -> Read-All-Pages (5s timer) -> Unlock-Academy-Exam loop', async ({ page }) => {
    test.setTimeout(150000);
    page.on('console', msg => console.log(`BROWSER [${msg.type()}]:`, msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    // The textbook grows with the lessons; read how many pages it has from the data
    const books = await (await page.request.get('/data/books.json')).json();
    const total: number = books.find((b: { id: string }) => b.id === 'book-ch1').pages.length;

    // 1. Navigate to game with clean storage and start
    await page.goto('/');
    await expect(page).toHaveTitle(/Knowledge Quest/i);

    // Wait for the start menu (it appears once the game data is loaded) instead of checking once
    await page.locator('#btn-play-game').click();

    const hud = page.locator('.game-hud');
    await expect(hud).toBeVisible({ timeout: 12000 });

    // Give the Phaser village scene a moment to finish loading before sending key input
    await page.waitForTimeout(1000);

    // 2. Verify initial state: 20 Credit (exactly the first textbook) & 0 Owned Textbooks
    // (the HUD no longer shows the Credit or the number of books: the state is read from the game)
    const credit = () => page.evaluate(() => (window as any).__entities.wallet.balance as number);
    const ownedBooks = () => page.evaluate(() => Object.values((window as any).__entities.books).filter((b: any) => b.isUnlocked).length);
    expect(await credit()).toBe(20);

    const textbookBtn = page.locator('#hud-library-btn');
    expect(await ownedBooks()).toBe(0);

    // 3. Clicking HUD Textbook button BEFORE buying shows Empty Reader State (no buy button!)
    await textbookBtn.click();
    await expect(page.locator('text=ທ່ານຍັງບໍ່ມີປຶ້ມຕຳລາຮຽນໃນຄອບຄອງ')).toBeVisible();
    await expect(page.locator('button:has-text("ຊື້ປຶ້ມຕຳລາ")')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.locator('text=ທ່ານຍັງບໍ່ມີປຶ້ມຕຳລາຮຽນໃນຄອບຄອງ')).not.toBeVisible();

    // 4. Walk from spawn (x=120) to Village Library building (x=1050) and press E
    await walkRightTo(page, 'KeyD', 1030);
    await page.waitForTimeout(150);
    await page.keyboard.press('KeyE');

    const libraryStoreHeader = page.getByTestId('library-modal');
    await expect(libraryStoreHeader).toBeVisible({ timeout: 5000 });

    // The Library has three parts; it opens on "For sale" with both books still unbought
    const shopTab = page.getByRole('tab', { name: /ວາງຂາຍ/ });
    const mineTab = page.getByRole('tab', { name: /ປຶ້ມຂອງຂ້ອຍ/ });
    const readTab = page.getByRole('tab', { name: /ອ່ານ/ });
    await expect(shopTab).toHaveAttribute('aria-selected', 'true');
    await expect(mineTab).toContainText('0');
    await expect(readTab).toBeDisabled();

    // Verify Chapter 2 book is locked behind Chapter 1 Exam + Boss
    await expect(page.getByRole('button', { name: /🔒 ບົດທີ 2/ })).toBeVisible();

    // Purchase Chapter 1 book (20 Credit)
    const buyCh1Btn = page.locator('button:has-text("ຊື້ປຶ້ມຕຳລາ (20 🎓 Credit)")');
    await expect(buyCh1Btn).toBeVisible();
    await buyCh1Btn.click();

    // Verify Wallet deducted 20 -> 0 and HUD textbook badge updated to (1)
    expect(await credit()).toBe(0);
    expect(await ownedBooks()).toBe(1);

    // The bought book moves from "For sale" to "My books" (unread: 0/5)
    await expect(mineTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator(`button:has-text("ເປີດອ່ານຕຳລາ (0/${total})")`)).toBeVisible();
    await expect(page.locator('button:has-text("ຊື້ປຶ້ມຕຳລາ")')).toHaveCount(0);
    await shopTab.click();
    await expect(page.getByRole('button', { name: /ບົດທີ 1 / })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /🔒 ບົດທີ 2/ })).toBeVisible();

    // Close Library Store and walk to Academy (x=600) to verify Exam is still locked before reading all pages
    await page.keyboard.press('Escape');
    await expect(libraryStoreHeader).not.toBeVisible();

    // Walk far enough to stand at the Academy (x=600), past the elder NPC (x=460) who would otherwise take the E key
    await walkRightTo(page, 'KeyD', 1680);
    await page.waitForTimeout(150);
    await page.keyboard.press('KeyE');

    const academyHeader = page.getByTestId('academy-modal');
    await expect(academyHeader).toBeVisible({ timeout: 5000 });

    // Start Exam must NOT be visible yet because 0 pages read!
    await expect(page.locator('button:has-text("ເລີ່ມສອບເສັງ")')).toHaveCount(0);
    const continueReadingBtn = page.locator(`button:has-text("ເປີດອ່ານປຶ້ມຕຳລາຕໍ່ (0/${total})")`);
    await expect(continueReadingBtn).toBeVisible();

    // 5. Click shortcut to open Personal Reader and read every page (5s first-read timer per page)
    await continueReadingBtn.click();
    await expect(page.getByTestId('library-modal')).toBeVisible();

    // Each page shows its lesson number (<stage>-<order>) and says when its Stage has not been cleared yet
    await expect(page.getByTestId('lesson-badge')).toContainText('ບົດ 1-1 · ດ່ານ 1 ຍັງບໍ່ຜ່ານ');

    for (let pageNum = 1; pageNum <= total; pageNum++) {
      await expect(page.locator(`text=ໜ້າທີ ${pageNum} / ${total}`)).toBeVisible();
      if (pageNum < total) {
        const confirmNextBtn = page.locator('button:has-text("ອ່ານເຂົ້າໃຈແລ້ວ & ໜ້າຕໍ່ໄປ")');
        await expect(confirmNextBtn).toBeVisible({ timeout: 8000 });
        await confirmNextBtn.click();
      } else {
        const confirmFinalBtn = page.locator('button:has-text("ຢືນຢັນອ່ານຈົບໜ້າສຸດທ້າຍ")');
        await expect(confirmFinalBtn).toBeVisible({ timeout: 8000 });
        await confirmFinalBtn.click();
      }
    }

    // 6. All pages read -> Jump to Academy Exam!
    const goToExamBtn = page.locator('button:has-text("ໄປສອບເສັງທີ່ສະຖາບັນ")');
    await expect(goToExamBtn).toBeVisible();
    await goToExamBtn.click();

    await expect(academyHeader).toBeVisible();
    const startExamBtn = page.locator('button:has-text("ເລີ່ມສອບເສັງ")');
    await expect(startExamBtn).toBeVisible();
    await startExamBtn.click();

    // Answer all 5 questions and submit
    for (let i = 0; i < 5; i++) {
      const optA = page.locator('button:has-text("A.")').nth(i);
      await optA.dispatchEvent('click');
    }

    const submitBtn = page.locator('button:has-text("ສົ່ງບົດສອບເສັງ")');
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.dispatchEvent('click');

    await expect(page.locator('text=ຄະແນນທີ່ໄດ້:')).toBeVisible({ timeout: 5000 });

    await page.keyboard.press('Escape');
    await expect(academyHeader).not.toBeVisible();

    console.log('Buy-to-Read Textbook Chapter 1 E2E test completed successfully!');
  });
});
