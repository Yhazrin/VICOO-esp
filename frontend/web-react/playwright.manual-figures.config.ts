/**
 * 仅用于生成用户手册配图：直连线上站点，不启动本地 webServer。
 *
 *   cd frontend/web-react && npm run screenshots:manual
 */
import { defineConfig, devices } from '@playwright/test';

const origin = process.env.MANUAL_PUBLIC_ORIGIN ?? 'http://vicoo.yhazrin.xyz';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: origin.replace(/\/$/, ''),
    trace: 'off',
    locale: 'en-US',
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
});
