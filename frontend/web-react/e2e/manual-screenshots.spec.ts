/**
 * 生成用户文档配图 → 仓库 tex/user-manual-figures/
 *
 * 默认截取线上站点（与课程演示一致）：
 *   U1 = MANUAL_U1_URL 或 baseURL + MANUAL_U1_PATH（默认首页 /）
 *   U2 = MANUAL_U2_URL 或 baseURL + MANUAL_U2_PATH（默认 /impact/shop/2）
 *
 * U3 仍为本地 admin（需另开终端 npm run dev）；不可用时 skip。
 *
 * 运行：cd frontend/web-react && npm run screenshots:manual
 * （使用 playwright.manual-figures.config.ts，不拉起本地 9111）
 */
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test, expect, request } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const OUT_DIR = path.join(REPO_ROOT, 'tex', 'user-manual-figures');

const DEFAULT_ORIGIN = (process.env.MANUAL_PUBLIC_ORIGIN ?? 'http://vicoo.yhazrin.xyz').replace(/\/$/, '');

function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const p = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${DEFAULT_ORIGIN}${p}`;
}

const U1_TARGET =
  process.env.MANUAL_U1_URL?.trim() ||
  absoluteUrl(process.env.MANUAL_U1_PATH?.trim() || '/');

const U2_TARGET =
  process.env.MANUAL_U2_URL?.trim() ||
  absoluteUrl(process.env.MANUAL_U2_PATH?.trim() || '/impact/shop/2');

/** Vite 在部分环境下只监听 localhost（IPv6） */
const ADMIN_ORIGIN = process.env.MANUAL_ADMIN_ORIGIN ?? 'http://localhost:5173';
const ADMIN_EMAIL = process.env.MANUAL_ADMIN_EMAIL ?? 'admin@vicoo.org';
const ADMIN_PASSWORD = process.env.MANUAL_ADMIN_PASSWORD ?? 'vicoo-admin';

test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
});

test('U1: Homepage (production)', async ({ page }) => {
  await page.goto(U1_TARGET, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await expect(page.locator('body')).toBeVisible();
  await page.screenshot({
    path: path.join(OUT_DIR, 'u1-homepage.png'),
    fullPage: true,
  });
});

test('U2: Globe + timeline — impact product detail (production)', async ({ page }) => {
  await page.goto(U2_TARGET, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(4000);
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
