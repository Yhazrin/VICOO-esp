import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../../artifacts/demo-video');

export default defineConfig({
  testDir: './e2e',
  testMatch: 'demo-video.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 300_000,
  reporter: [['list'], ['html', { outputFolder: path.join(OUT_DIR, 'report'), open: 'never' }]],
  outputDir: path.join(OUT_DIR, 'test-results'),
  use: {
    baseURL: process.env.DEMO_BASE_URL ?? 'http://127.0.0.1:9111',
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
    video: 'on',
    trace: 'off',
    launchOptions: {
      slowMo: 0,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
});
