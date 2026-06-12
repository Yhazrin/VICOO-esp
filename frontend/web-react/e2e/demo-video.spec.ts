/**
 * VICOO 用户文档功能验证与演示录屏（约 4–5 分钟）
 *
 * 流程对齐 scripts/generate_video_script_docx.py / 期末 Demo 文字稿：
 * 首页 → Impact Shop → 产品详情（追溯 Globe + 时间线）→ AI 助手 → 捐赠 → 管理后台
 */
import { test, expect, type Page } from '@playwright/test';

const ADMIN_BASE = process.env.DEMO_ADMIN_URL ?? 'http://127.0.0.1:5173';
const ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL ?? 'admin@tonghua.org';
const ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD ?? 'vicoo-admin';
const IMPACT_PRODUCT_ID = process.env.DEMO_IMPACT_PRODUCT_ID ?? '2';

function impactToggle(page: Page) {
  return page
    .locator('header')
    .getByRole('navigation', { name: /main navigation|主导航/i })
    .locator('button[aria-pressed]');
}

async function gotoReady(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.locator('body').waitFor({ state: 'visible' });
}

async function pause(page: Page, ms = 3500) {
  await page.waitForTimeout(ms);
}

test.describe.configure({ mode: 'serial' });

test('VICOO 功能演示录屏', async ({ page, context }) => {
  test.setTimeout(300_000);

  // ── 0:00 开场 / 首页 ─────────────────────────────────────
  await gotoReady(page, '/');
  await pause(page, 8000);

  // ── 0:42 Impact Shop ─────────────────────────────────────
  const toggle = impactToggle(page);
  await expect(toggle).toBeVisible({ timeout: 15_000 });
  if ((await toggle.getAttribute('aria-pressed')) !== 'true') {
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  }
  await pause(page, 2500);

  await gotoReady(page, '/impact/shop');
  await pause(page, 10000);

  // ── 1:12 产品详情页 + 追溯 Globe ─────────────────────────
  await gotoReady(page, `/impact/shop/${IMPACT_PRODUCT_ID}`);
  await pause(page, 8000);

  const globe = page.getByRole('application', { name: /traceability globe|追溯/i });
  if (await globe.count()) {
    await globe.scrollIntoViewIfNeeded();
  } else {
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight * 0.5 }));
  }
  await pause(page, 15000);

  const globeCanvas = page.locator('canvas').first();
  if (await globeCanvas.isVisible().catch(() => false)) {
    const box = await globeCanvas.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width * 0.55, box.y + box.height * 0.45);
      await pause(page, 6000);
    }
  }

  // ── 2:38 AI 助手 UI ──────────────────────────────────────
  const aiOpen = page.locator('button.fixed.z-50').last();
  if (await aiOpen.isVisible().catch(() => false)) {
    await aiOpen.click();
    await pause(page, 8000);
    await page.getByRole('button', { name: 'Close' }).click().catch(async () => {
      await page.keyboard.press('Escape');
    });
    await pause(page, 1500);
  }

  // ── 3:03 捐赠 / 公益 ─────────────────────────────────────
  await gotoReady(page, '/donate');
  await pause(page, 10000);

  await gotoReady(page, '/campaigns');
  await pause(page, 8000);

  // ── 3:22 管理后台（本地 dev 注入 session，避免跨端口登录跳转）──
  const adminPage = await context.newPage();
  await adminPage.goto(`${ADMIN_BASE}/admin/`, { waitUntil: 'domcontentloaded' });
  await adminPage.evaluate(
    ({ email }) => {
      sessionStorage.setItem(
        'vicoo-admin-auth',
        JSON.stringify({
          state: {
            user: {
              id: '1',
              username: '管理员',
              email,
              role: 'admin',
              permissions: [],
            },
            token: 'demo-token',
            isAuthenticated: true,
          },
          version: 0,
        }),
      );
    },
    { email: ADMIN_EMAIL },
  );
  await adminPage.goto(`${ADMIN_BASE}/admin/`, { waitUntil: 'domcontentloaded' });
  await adminPage.locator('aside').waitFor({ state: 'visible', timeout: 25_000 });
  await pause(adminPage, 8000);

  for (const path of ['/admin/products', '/admin/orders', '/admin/clothing-donations', '/admin/audit-log']) {
    await adminPage.goto(`${ADMIN_BASE}${path}`, { waitUntil: 'domcontentloaded' });
    await pause(adminPage, 8000);
  }

  // ── 3:47 API 文档 ────────────────────────────────────────
  const apiPage = await context.newPage();
  await apiPage.goto('http://127.0.0.1:8000/docs', { waitUntil: 'domcontentloaded' });
  await pause(apiPage, 8000);

  const health = await apiPage.request.get('http://127.0.0.1:8000/api/v1/health');
  expect(health.ok()).toBeTruthy();

  // ── 4:07 结尾 ────────────────────────────────────────────
  await page.bringToFront();
  await gotoReady(page, '/');
  await pause(page, 8000);

  await adminPage.close();
  await apiPage.close();
});
