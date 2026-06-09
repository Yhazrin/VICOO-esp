/**
 * 云电脑可见浏览器演示 — 配合 scripts/record-cloud-desktop.sh 的 X11 录屏
 */
import { test, expect, type Page } from '@playwright/test';

const ADMIN_BASE = 'http://127.0.0.1:5173';

async function wait(page: Page, ms = 4000) {
  await page.waitForTimeout(ms);
}

function impactToggle(page: Page) {
  return page
    .locator('header')
    .getByRole('navigation', { name: /main navigation|主导航/i })
    .locator('button[aria-pressed]');
}

test('云桌面 VICOO 功能浏览', async ({ page, context }) => {
  test.setTimeout(600_000);

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await wait(page, 5000);

  const toggle = impactToggle(page);
  if ((await toggle.getAttribute('aria-pressed')) !== 'true') {
    await toggle.click();
    await wait(page, 2000);
  }

  await page.goto('/impact/shop', { waitUntil: 'domcontentloaded' });
  await wait(page, 6000);

  await page.goto('/impact/shop/2', { waitUntil: 'domcontentloaded' });
  await wait(page, 4000);
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight * 0.5, behavior: 'smooth' }));
  await wait(page, 10000);

  const aiBtn = page.locator('button.fixed.z-50').last();
  if (await aiBtn.isVisible().catch(() => false)) {
    await aiBtn.click();
    await wait(page, 5000);
    await page.getByRole('button', { name: 'Close' }).click().catch(() => {});
    await wait(page, 1500);
  }

  await page.goto('/donate', { waitUntil: 'domcontentloaded' });
  await wait(page, 6000);

  await page.goto('/campaigns', { waitUntil: 'domcontentloaded' });
  await wait(page, 5000);

  const admin = await context.newPage();
  await admin.goto(`${ADMIN_BASE}/admin/`, { waitUntil: 'domcontentloaded' });
  await admin.evaluate(() => {
    sessionStorage.setItem(
      'vicoo-admin-auth',
      JSON.stringify({
        state: {
          user: { id: '1', username: '管理员', email: 'admin@tonghua.org', role: 'admin', permissions: [] },
          token: 'demo-token',
          isAuthenticated: true,
        },
        version: 0,
      }),
    );
  });
  await admin.goto(`${ADMIN_BASE}/admin/products`, { waitUntil: 'domcontentloaded' });
  await wait(admin, 6000);
  await admin.goto(`${ADMIN_BASE}/admin/orders`, { waitUntil: 'domcontentloaded' });
  await wait(admin, 5000);

  const api = await context.newPage();
  await api.goto('http://127.0.0.1:8000/docs', { waitUntil: 'domcontentloaded' });
  await wait(api, 5000);

  const health = await api.request.get('http://127.0.0.1:8000/api/v1/health');
  expect(health.ok()).toBeTruthy();

  await page.bringToFront();
  await page.goto('/');
  await wait(page, 4000);

  await admin.close();
  await api.close();
});
