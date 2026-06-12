import { defineConfig, devices } from '@playwright/test';

/** 云桌面可见浏览器录屏 — headless: false，由 ffmpeg 捕获整个 X11 桌面 */
export default defineConfig({
  testDir: './e2e',
  testMatch: 'cloud-desktop-demo.spec.ts',
  workers: 1,
  retries: 0,
  timeout: 600_000,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:9111',
    viewport: { width: 1400, height: 900 },
    locale: 'zh-CN',
    trace: 'off',
    video: 'off',
    launchOptions: {
      headless: false,
      slowMo: 400,
      args: [
        '--window-size=1400,900',
        '--window-position=480,120',
        '--disable-infobars',
        '--no-first-run',
      ],
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
