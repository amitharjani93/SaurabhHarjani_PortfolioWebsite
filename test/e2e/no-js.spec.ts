import { test, expect } from '@playwright/test';
import { routes } from './routes';

/**
 * Progressive enhancement.
 *
 * Every script on this site is an enhancement. With JavaScript disabled the
 * pages must still be readable, navigable and understandable — which is also
 * how they appear to a crawler that does not execute scripts.
 */

test.describe('without JavaScript', () => {
  for (const route of routes) {
    test(`${route.name} renders its content`, async ({ page }) => {
      await page.goto(route.path);

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('main')).not.toBeEmpty();

      const words = await page.locator('main').innerText();
      expect(words.trim().split(/\s+/).length, `/${route.path} has too little content`).toBeGreaterThan(120);
    });
  }

  test('sections that animate in are visible from the start', async ({ page }) => {
    await page.goto('');

    const hidden = await page.evaluate(
      () => [...document.querySelectorAll('.reveal')].filter((el) => Number(getComputedStyle(el).opacity) < 1).length,
    );

    expect(hidden, 'content must not depend on the reveal script').toBe(0);
  });

  test('the FAQ still opens, because it is built on <details>', async ({ page }) => {
    await page.goto('faq');

    const first = page.locator('details.faq__item').first();
    await expect(first).not.toHaveAttribute('open', '');

    await first.locator('summary').click();
    await expect(first).toHaveAttribute('open', '');
    await expect(first.locator('.faq__answer')).toBeVisible();
  });

  test('navigation is reachable without the drawer script', async ({ page }) => {
    await page.goto('');
    const footerLinks = page.getByRole('navigation', { name: 'Footer' }).getByRole('link');
    await expect(footerLinks).not.toHaveCount(0);

    await page.getByRole('navigation', { name: 'Footer' }).getByRole('link', { name: 'Profile' }).click();
    await expect(page).toHaveURL(/\/profile$/);
  });

  test('the consultation form falls back to the published contact routes', async ({ page }) => {
    await page.goto('contact');
    // The form needs a script to submit, so the page must offer another way.
    await expect(page.getByRole('heading', { name: 'Direct contact' })).toBeVisible();
    await expect(page.locator('.disclaimer--form')).toBeVisible();
  });
});
