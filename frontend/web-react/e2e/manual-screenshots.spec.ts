/**
 * 生成用户文档配图（仓库 tex/user-manual-figures/）。
 *
 * 前置条件：
 * - 消费者站点：默认 http://127.0.0.1:9111（playwright.config 的 webServer 可拉起）
 * - API：与 vite 代理一致（默认前端代理到 8080）
 * - 管理后台 U3：需单独启动 admin（http://127.0.0.1:5173），否则 U3 会被 skip
 *
 * 运行：cd frontend/web-react && npx playwright test e2e/manual-screenshots.spec.ts
 */
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test, expect, request } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const OUT_DIR = path.join(REPO_ROOT, 'tex', 'user-manual-figures');

/** Vite 在部分环境下只监听 \`localhost\`（IPv6），与 \`127.0.0.1\` 不等价 */
const ADMIN_ORIGIN = process.env.MANUAL_ADMIN_ORIGIN ?? 'http://localhost:5173';
const ADMIN_EMAIL = process.env.MANUAL_ADMIN_EMAIL ?? 'admin@tonghua.org';
const ADMIN_PASSWORD = process.env.MANUAL_ADMIN_PASSWORD ?? 'vicoo-admin';

test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
});

test('U1: Impact shop grid', async ({ page }) => {
  await page.goto('/impact/shop', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await expect(page.locator('body')).toBeVisible();
  await page.screenshot({
    path: path.join(OUT_DIR, 'u1-impact-shop.png'),
    fullPage: true,
  });
});

test('U2: Globe + timeline on impact product detail', async ({ page }) => {
  await page.goto('/impact/shop/1', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2500);
  await page.screenshot({
    path: path.join(OUT_DIR, 'u2-globe-timeline.png'),
    fullPage: true,
  });
});

test('U3: Admin products (requires admin dev server)', async ({ browser }) => {
  const api = await request.newContext();
  const probe = await api.get(`${ADMIN_ORIGIN}/admin/`).catch(() => null);
  await api.dispose();
  test.skip(!probe?.ok(), `Admin not reachable at ${ADMIN_ORIGIN} — run: cd admin && npm run dev`);

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(`${ADMIN_ORIGIN}/admin/`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[type="text"]').first().fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page.locator('form button[type="submit"]').click();
    await page.locator('aside a[href$="/products"]').waitFor({ state: 'visible', timeout: 20_000 });
    await page.goto(`${ADMIN_ORIGIN}/admin/products`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(OUT_DIR, 'u3-admin-products.png'),
      fullPage: true,
    });
  } finally {
    await page.close();
  }
});
