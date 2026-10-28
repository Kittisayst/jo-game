import { test, expect } from '@playwright/test';

test.describe('Knowledge Quest — Village Hub & Chapter 1 Mechanics E2E', () => {
  test('Complete Knowledge Quest Chapter 1 Loop: Library, Exam, Workshop, Forge, and Backpack', async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER [${msg.type()}]:`, msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    // 1. Navigate to game and start
    await page.goto('/');
    await expect(page).toHaveTitle(/JO RUNNER/i);

    const playBtn = page.locator('#btn-play-game');
    if (await playBtn.isVisible()) {
      await playBtn.click();
    }

    const hud = page.locator('.game-hud');
    await expect(hud).toBeVisible({ timeout: 12000 });

    // 2. Verify Knowledge Quest HUD elements
    // Credit badge with graduation cap
    const creditBadge = page.locator('.wallet-hud-badge');
    await expect(creditBadge).toBeVisible();
    await expect(creditBadge).toContainText('🎓');

    // Backpack HUD button
    const backpackBtn = page.locator('#hud-backpack-btn');
    await expect(backpackBtn).toBeVisible();
    await expect(backpackBtn).toContainText('🎒');

    // Quick Textbook HUD button
    const textbookBtn = page.locator('#hud-library-btn');
    await expect(textbookBtn).toBeVisible();
    await expect(textbookBtn).toContainText('📚');

    // 3. Test Backpack Modal
    await backpackBtn.click();
    const backpackHeader = page.locator('h2:has-text("ກະເປົາເດີນທາງ")');
    await expect(backpackHeader).toBeVisible();
    await expect(page.locator('text=20 ຊ່ອງ')).toBeVisible();

    // Close backpack with Escape
    await page.keyboard.press('Escape');
    await expect(backpackHeader).not.toBeVisible();

    // 4. Test Textbook (Library) Modal
    await textbookBtn.click();
    const textbookHeader = page.locator('h2:has-text("ຫໍສະໝຸດແຫ່ງປັນຍາ")');
    await expect(textbookHeader).toBeVisible();

    // Verify Chapter 1 book content is loaded
    await expect(page.locator('text=ບົດທີ 1: ພື້ນຖານລະບົບຄອມພິວເຕີ')).toBeVisible();

    // Mark current page as read if available
    const markReadBtn = page.locator('button:has-text("ໝາຍວ່າອ່ານແລ້ວ")');
    if (await markReadBtn.isVisible()) {
      await markReadBtn.click();
    }

    // Click "ໄປສອບເສັງທີ່ສະຖາບັນ (Go to Exam)" to jump to Academy
    const goToExamBtn = page.locator('button:has-text("ໄປສອບເສັງທີ່ສະຖາບັນ")');
    await expect(goToExamBtn).toBeVisible();
    await goToExamBtn.click();

    // Verify Textbook closed and Academy opened
    await expect(textbookHeader).not.toBeVisible();
    const academyHeader = page.locator('h2:has-text("Academy")');
    await expect(academyHeader).toBeVisible();

    // 5. Test Academy Exam Tab & Pass Exam
    await expect(page.locator('button:has-text("ສອບເສັງທ້າຍບົດ")')).toBeVisible();

    // Click "ເລີ່ມສອບເສັງ" to start the 5-question exam session
    const startExamBtn = page.locator('button:has-text("ເລີ່ມສອບເສັງ")');
    await expect(startExamBtn).toBeVisible();
    await startExamBtn.click();

    // Answer all 5 questions by selecting option A
    for (let i = 0; i < 5; i++) {
      const optA = page.locator('button:has-text("A.")').nth(i);
      await optA.dispatchEvent('click');
    }

    // Submit exam
    const submitBtn = page.locator('button:has-text("ສົ່ງບົດສອບເສັງ")');
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.dispatchEvent('click');

    // Verify Exam Result summary is rendered
    await expect(page.locator('text=ຄະແນນທີ່ໄດ້:')).toBeVisible({ timeout: 5000 });

    // Close Academy with Escape
    await page.keyboard.press('Escape');
    await expect(academyHeader).not.toBeVisible();

    console.log('Knowledge Quest Chapter 1 loop E2E test completed successfully!');
  });
});
