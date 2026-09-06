import { test, expect } from '@playwright/test';
import { routes } from './routes';

/**
 * Smoke checks, tagged @smoke.
 *
 * Deliberately narrow and assumption-free, so they can be pointed at a
 * deployed site as well as a local build:
 *
 *   SMOKE_BASE_URL=https://example.com/ npx playwright test --grep @smoke
 *
 * The nightly regression workflow runs these against the live URL.
 */

for (const route of routes) {
  test(`@smoke ${route.name} responds and renders`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
    page.on('pageerror', (error) => errors.push(error.message));

    const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });

    expect(response?.status(), `/${route.path}`).toBeLessThan(400);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('title')).not.toBeEmpty();
    expect(errors, `console errors on /${route.path}`).toEqual([]);
  });
}

test('@smoke the styles and fonts load', async ({ page }) => {
  const failed: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`);
  });

  await page.goto('', { waitUntil: 'load' });

  expect(failed, 'assets failed to load').toEqual([]);

  // A missing stylesheet is invisible to a status check but obvious here.
  const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(bodyFont).toContain('Inter');
});

test('@smoke the compliance notices are present', async ({ page }) => {
  await page.goto('contact');
  await expect(page.getByText(/does not by itself create an advocate-client relationship/i)).toBeVisible();

  await page.goto('');
  await expect(page.getByText(/not an advertisement or solicitation/i)).toBeVisible();
});

test('@smoke robots.txt and the sitemap are served', async ({ request, baseURL }) => {
  for (const path of ['robots.txt', 'sitemap-index.xml']) {
    const response = await request.get(new URL(path, baseURL).href);
    expect(response.status(), path).toBe(200);
  }
});
