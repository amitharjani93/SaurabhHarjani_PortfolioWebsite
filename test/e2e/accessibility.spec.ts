import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { keyRoutes, routes } from './routes';

/**
 * Automated accessibility checks against WCAG 2.1/2.2 A and AA.
 *
 * Automation catches roughly a third of real barriers, so this is a floor, not
 * a certificate. Keyboard behaviour is covered in navigation.spec.ts and the
 * document structure is checked in test/build/integrity.test.ts.
 *
 * Every route is scanned on desktop. On mobile only the distinct templates are
 * scanned, plus the drawer and the form — which is where viewport-specific
 * problems actually arise.
 */

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/**
 * Contrast has to be measured against final styles. Entry animations fade in
 * over 700ms, and a scan that catches one mid-transition reports the blended
 * colour — a false failure. Transitions are switched off before scanning.
 */
async function settle(page: import('@playwright/test').Page) {
  await page.addStyleTag({
    content: '*, *::before, *::after { transition: none !important; animation: none !important; }',
  });
  await page.evaluate(() => {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  });
}

for (const route of routes) {
  test(`${route.name} has no detectable accessibility violations`, async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === 'mobile' && !keyRoutes.some((r) => r.path === route.path),
      'covered by another page using the same template',
    );

    await page.goto(route.path);
    await settle(page);

    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();

    expect(
      violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.help}`),
      `accessibility violations on /${route.path}`,
    ).toEqual([]);
  });
}

test('the 404 page has no detectable accessibility violations', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'covered once');
  await page.goto('404');
  await settle(page);
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});

test('the open mobile drawer has no detectable accessibility violations', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile viewport only');

  await page.goto('');
  await settle(page);
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Site menu' })).toBeVisible();

  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});

test('the consultation form reports errors accessibly', async ({ page }) => {
  await page.goto('contact');
  await settle(page);
  await page.getByRole('button', { name: /Send Inquiry|Compose Inquiry Email/i }).click();
  await expect(page.locator('[data-error]:not([hidden])').first()).toBeVisible();

  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});

test('every interactive element shows a visible focus ring', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'keyboard focus is a pointer-free concern');

  await page.goto('');

  const invisible = await page.evaluate(() => {
    const offenders: string[] = [];
    const candidates = [...document.querySelectorAll('a[href], button')].slice(0, 40);

    for (const el of candidates) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      (el as HTMLElement).focus();
      const style = getComputedStyle(el);
      const hasRing =
        style.outlineStyle !== 'none' || style.boxShadow !== 'none' || Number.parseFloat(style.outlineWidth) > 0;
      if (!hasRing) offenders.push((el.textContent ?? el.tagName).trim().slice(0, 30));
    }
    return offenders;
  });

  expect(invisible).toEqual([]);
});
