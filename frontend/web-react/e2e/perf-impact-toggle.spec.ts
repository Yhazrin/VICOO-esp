/**
 * 压测：在**页面内**用 MutationObserver 量 `aria-pressed` 更新延迟。
 * 注意：用 Playwright 的 `expect().toHaveAttribute` 会跨进程轮询，曾误报 ~800ms+；以本脚本为准。
 * 运行：cd frontend/web-react && npm run test:perf
 */
import { test, expect, type Page } from '@playwright/test';

function median(values: number[]): number {
  if (values.length === 0) return NaN;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

function impactToggleInHeader(page: Page) {
  return page
    .locator('header')
    .getByRole('navigation', { name: /main navigation|主导航/i })
    .locator('button[aria-pressed]');
}

test.describe('Impact ↔ Uniqlo 切换性能', () => {
  test('10 次切换：点击 → aria-pressed 更新耗时', async ({ page }) => {
    const durations: number[] = [];

    await page.goto('/');

    const button = impactToggleInHeader(page);
    await expect(button).toBeVisible();

    const toImpactMs: number[] = [];
    const toCompanyMs: number[] = [];

    for (let i = 0; i < 10; i += 1) {
      const before = await button.getAttribute('aria-pressed');
      const expectAfter = before === 'true' ? 'false' : 'true';
      const ms = await page.evaluate((wanted) => {
        const el = document.querySelector<HTMLButtonElement>(
          'header [aria-label="Main navigation"] button[aria-pressed]'
        );
        if (!el) return -1;
        return new Promise<number>((resolve) => {
          let finished = false;
          const t0 = performance.now();
          const finish = (dt: number) => {
            if (finished) return;
            finished = true;
            resolve(dt);
          };
          const check = () => {
            if (el.getAttribute('aria-pressed') === wanted) {
              window.clearTimeout(failSafe);
              mo.disconnect();
              finish(performance.now() - t0);
            }
          };
          const mo = new MutationObserver(check);
          mo.observe(el, { attributes: true, attributeFilter: ['aria-pressed'] });
          const failSafe = window.setTimeout(() => {
            mo.disconnect();
            finish(performance.now() - t0);
          }, 10_000);
          el.click();
          queueMicrotask(check);
          requestAnimationFrame(() => {
            check();
            requestAnimationFrame(check);
          });
        });
      }, expectAfter);
      expect(ms).toBeGreaterThan(0);
      expect(ms).toBeLessThan(10_000);
      durations.push(ms);
      if (expectAfter === 'true') toImpactMs.push(ms);
      else toCompanyMs.push(ms);

      if (i === 0) {
        // eslint-disable-next-line no-console
        console.log(
          JSON.stringify(
            {
              run: 'first-toggle-to-dom',
              ms: Math.round(ms),
              note: '含首包 hydrate/懒组件；2–9 次更接近纯切壳',
            },
            null,
            2
          )
        );
      }
    }

    const sorted = [...durations].sort((a, b) => a - b);
    const summary = {
      samples: durations.length,
      minMs: Math.round(sorted[0]!),
      maxMs: Math.round(sorted[sorted.length - 1]!),
      medianMs: Math.round(median(durations)),
      p90Ms: Math.round(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))]!),
    };
    // eslint-disable-next-line no-console
    console.log(`[perf-impact-toggle] ${JSON.stringify(summary)}`);
    // eslint-disable-next-line no-console
    console.log(
      `[perf-impact-toggle] by-direction ${JSON.stringify({
        toImpact: { n: toImpactMs.length, medianMs: Math.round(median(toImpactMs)) },
        toCompany: { n: toCompanyMs.length, medianMs: Math.round(median(toCompanyMs)) },
      })}`
    );
    expect(durations.length).toBe(10);
  });
});
