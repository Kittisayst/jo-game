import { defineConfig } from '@playwright/test';

/**
 * Headless Chromium falls back to software WebGL (SwiftShader), which holds the game near 40 fps and
 * lower in a Stage. A real GPU is about 55 fps and lets specs run side by side. Set `PW_NO_GPU=1` on a
 * machine without a GPU (the ANGLE backend below is for Windows; use `--use-angle=gl` or `swiftshader` elsewhere).
 */
export const launchArgs = process.env.PW_NO_GPU
  ? []
  : ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'];

export default defineConfig({
  testDir: './e2e',
  timeout: 45000,
  // Three workers were stable on the development machine, four were not. Software rendering cannot run in parallel.
  workers: Number(process.env.PW_WORKERS ?? (process.env.PW_NO_GPU ? 1 : 3)),
  globalSetup: './e2e/globalSetup.ts',
  use: {
    baseURL: 'http://127.0.0.1:8080',
    headless: true,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    launchOptions: { args: launchArgs },
  },
  webServer: {
    command: 'node ./node_modules/vite/bin/vite.js --config vite/config.dev.mjs',
    url: 'http://127.0.0.1:8080',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
