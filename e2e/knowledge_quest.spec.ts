import { test, expect } from '@playwright/test';

test.describe('Knowledge Quest — Buy-to-Read Textbook & Chapter 1 Loop E2E', () => {
  test('Enforces Buy-at-Library -> Read-All-Pages (3s timer) -> Unlock-Academy-Exam loop', async ({ page }) => {
    test.setTimeout(60000);
    page.on('console', msg => console.log(`BROWSER [${msg.type()}]:`, msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    // 1. Navigate to game with clean storage and start
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await expect(page).toHaveTitle(/JO RUNNER/i);

    const playBtn = page.locator('#btn-play-game');
    if (await playBtn.isVisible()) {
      await playBtn.click();
    }

    const hud = page.locator('.game-hud');
    await expect(hud).toBeVisible({ timeout: 12000 });

    // 2. Verify initial state: 50 Credit & 0 Owned Textbooks
    const creditBadge = page.locator('.wallet-hud-badge');
    await expect(creditBadge).toContainText('50');

    const textbookBtn = page.locator('#hud-library-btn');
    await expect(textbookBtn).toContainText('ຕຳລາ (0)');

    // 3. Clicking HUD Textbook button BEFORE buying shows Empty Reader State (no buy button!)
    await textbookBtn.click();
    await expect(page.locator('text=ທ່ານຍັງບໍ່ມີປຶ້ມຕຳລາຮຽນໃນຄອບຄອງ')).toBeVisible();
    await expect(page.locator('button:has-text("ຊື້ປຶ້ມຕຳລາ")')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.locator('text=ທ່ານຍັງບໍ່ມີປຶ້ມຕຳລາຮຽນໃນຄອບຄອງ')).not.toBeVisible();

    // 4. Walk from spawn (x=120) to Village Library building (x=320) and press E
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(750);
    await page.keyboard.up('KeyD');
    await page.waitForTimeout(150);
    await page.keyboard.press('KeyE');

    const libraryStoreHeader = page.locator('h2:has-text("ຫໍສະໝຸດແຫ່ງປັນຍາ (Library Bookstore)")');
    await expect(libraryStoreHeader).toBeVisible({ timeout: 5000 });

    // Verify Chapter 2 book is locked behind Chapter 1 Exam + Boss
    await expect(page.locator('button:has-text("ຍັງບໍ່ປົດລັອກບົດຮຽນນີ້")')).toBeVisible();

    // Purchase Chapter 1 book (20 Credit)
    const buyCh1Btn = page.locator('button:has-text("ຊື້ປຶ້ມຕຳລາ (20 🎓 Credit)")');
    await expect(buyCh1Btn).toBeVisible();
    await buyCh1Btn.click();

    // Verify Wallet deducted 50 -> 30 and HUD textbook badge updated to (1)
    await expect(creditBadge).toContainText('30');
    await expect(textbookBtn).toContainText('ຕຳລາ (1)');
    await expect(page.locator('button:has-text("ເປີດອ່ານຕຳລາ (0/5)")')).toBeVisible();

    // Close Library Store and walk to Academy (x=600) to verify Exam is still locked before reading all pages
    await page.keyboard.press('Escape');
    await expect(libraryStoreHeader).not.toBeVisible();

    await page.keyboard.down('KeyD');
    await page.waitForTimeout(1050);
    await page.keyboard.up('KeyD');
    await page.waitForTimeout(150);
    await page.keyboard.press('KeyE');

    const academyHeader = page.locator('h2:has-text("Academy")');
    await expect(academyHeader).toBeVisible({ timeout: 5000 });

    // Start Exam must NOT be visible yet because 0/5 pages read!
    await expect(page.locator('button:has-text("ເລີ່ມສອບເສັງ")')).toHaveCount(0);
    const continueReadingBtn = page.locator('button:has-text("ເປີດອ່ານປຶ້ມຕຳລາຕໍ່ (0/5)")');
    await expect(continueReadingBtn).toBeVisible();

    // 5. Click shortcut to open Personal Reader and read all 5 pages (3s first-read timer per page)
    await continueReadingBtn.click();
    await expect(page.locator('h2:has-text("ປຶ້ມຕຳລາສ່ວນຕົວ")')).toBeVisible();

    for (let pageNum = 1; pageNum <= 5; pageNum++) {
      await expect(page.locator(`text=ໜ້າທີ ${pageNum} / 5`)).toBeVisible();
      if (pageNum < 5) {
        const confirmNextBtn = page.locator('button:has-text("ອ່ານເຂົ້າໃຈແລ້ວ & ໜ້າຕໍ່ໄປ")');
        await expect(confirmNextBtn).toBeVisible({ timeout: 5000 });
        await confirmNextBtn.click();
      } else {
        const confirmFinalBtn = page.locator('button:has-text("ຢືນຢັນອ່ານຈົບໜ້າສຸດທ້າຍ")');
        await expect(confirmFinalBtn).toBeVisible({ timeout: 5000 });
        await confirmFinalBtn.click();
      }
    }

    // 6. All 5/5 pages read -> Jump to Academy Exam!
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
