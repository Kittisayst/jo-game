import { chromium, FullConfig } from '@playwright/test';
import { launchArgs } from '../playwright.config';

/**
 * Opens the game once before the specs so Vite has compiled every module. Without it the first
 * workers all hit a cold dev server at the same time and the slowest specs time out waiting for the HUD.
 */
export default async function globalSetup (config: FullConfig): Promise<void>
{
  const baseURL = config.projects[0].use.baseURL ?? 'http://127.0.0.1:8080';
  const browser = await chromium.launch({ args: launchArgs });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(90000);
    await page.goto(baseURL, { timeout: 90000 });
    await page.getByRole('button', { name: /ເຂົ້າເກມ/i }).click();
    await page.locator('.game-hud').waitFor({ timeout: 60000 });
  } finally {
    await browser.close();
  }
}
