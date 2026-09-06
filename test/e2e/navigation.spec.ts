import { test, expect } from '@playwright/test';

/**
 * Navigation, including the mobile drawer's keyboard and focus behaviour.
 * The drawer is the most stateful thing on the site and the easiest to break.
 *
 * Per-route reachability lives in smoke.spec.ts.
 */

test.describe('primary navigation', () => {
  test('reaches every section from the header on desktop', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop header only');

    await page.goto('');
    const nav = page.getByRole('navigation', { name: 'Primary' });

    for (const label of ['Profile', 'Practice Areas', 'Insights', 'Contact']) {
      await nav.getByRole('link', { name: label, exact: true }).click();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.goBack();
    }
  });

  test('marks the section in view as the current page', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop header only');

    await page.goto('practice-areas/civil-matters');
    const nav = page.getByRole('navigation', { name: 'Primary' });
    await expect(nav.getByRole('link', { name: 'Practice Areas' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current', 'page');
  });

  test('hides the drawer toggle on desktop and shows it on mobile', async ({ page }, testInfo) => {
    await page.goto('');
    const toggle = page.getByRole('button', { name: 'Open menu' });

    if (testInfo.project.name === 'desktop') {
      await expect(toggle).toBeHidden();
      await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
    } else {
      await expect(toggle).toBeVisible();
    }
  });

  test('gives the header a scrolled state once the page moves', async ({ page }) => {
    await page.goto('');
    const header = page.locator('[data-site-header]');
    await expect(header).toHaveAttribute('data-scrolled', 'false');
    await page.mouse.wheel(0, 800);
    await expect(header).toHaveAttribute('data-scrolled', 'true');
  });

  test('the logo returns to the home page', async ({ page }) => {
    await page.goto('faq');
    await page.getByRole('link', { name: /home$/i }).first().click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/clarity/i);
  });
});

test.describe('mobile drawer', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'mobile viewport only');
  });

  test('opens, navigates and closes', async ({ page }) => {
    await page.goto('');

    const toggle = page.getByRole('button', { name: 'Open menu' });
    await toggle.click();

    const drawer = page.getByRole('dialog', { name: 'Site menu' });
    await expect(drawer).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await drawer.getByRole('link', { name: /Profile/ }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('closes on Escape and returns focus to the toggle', async ({ page }) => {
    await page.goto('');
    const toggle = page.getByRole('button', { name: 'Open menu' });
    await toggle.click();
    await expect(page.getByRole('dialog', { name: 'Site menu' })).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog', { name: 'Site menu' })).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });

  test('closes when the backdrop is tapped', async ({ page }) => {
    await page.goto('');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.locator('[data-nav-backdrop]').click({ position: { x: 5, y: 5 } });
    await expect(page.getByRole('dialog', { name: 'Site menu' })).toBeHidden();
  });

  test('keeps focus inside while it is open', async ({ page }) => {
    await page.goto('');
    await page.getByRole('button', { name: 'Open menu' }).click();

    const insideDrawer = () =>
      page.evaluate(() => Boolean(document.activeElement?.closest('[data-nav-panel]')));

    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press('Tab');
      expect(await insideDrawer(), `focus escaped after ${i + 1} tabs`).toBe(true);
    }

    await page.keyboard.press('Shift+Tab');
    expect(await insideDrawer()).toBe(true);
  });

  test('locks the page behind it', async ({ page }) => {
    await page.goto('');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');

    await page.getByRole('button', { name: 'Close menu' }).click();
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  });
});

test.describe('not found', () => {
  test('offers a way onward', async ({ page }) => {
    // Served directly, because `astro preview` has no rewrite rule.
    await page.goto('404');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/does not exist/i);
    await expect(page.getByRole('navigation', { name: 'Site index' }).getByRole('link')).not.toHaveCount(0);
  });
});
