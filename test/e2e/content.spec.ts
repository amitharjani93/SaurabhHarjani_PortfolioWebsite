import { test, expect } from '@playwright/test';

/** The FAQ accordion, and the article contents list. */

test.describe('FAQ accordion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('faq');
  });

  test('starts closed and opens on click', async ({ page }) => {
    const first = page.locator('details.faq__item').first();
    await expect(first.locator('.faq__answer')).toBeHidden();

    await first.locator('summary').click();
    await expect(first.locator('.faq__answer')).toBeVisible();
  });

  test('keeps only one question open within a group', async ({ page }) => {
    const items = page.locator('#faq-general-0, #faq-general-1');

    await page.locator('#faq-general-0 summary').click();
    await expect(page.locator('#faq-general-0')).toHaveAttribute('open', '');

    await page.locator('#faq-general-1 summary').click();
    await expect(page.locator('#faq-general-1')).toHaveAttribute('open', '');
    await expect(page.locator('#faq-general-0')).not.toHaveAttribute('open', '');

    await expect(items).toHaveCount(2);
  });

  test('is operable from the keyboard', async ({ page }) => {
    const summary = page.locator('#faq-general-0 summary');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#faq-general-0')).toHaveAttribute('open', '');
  });

  test('jumps to a section from the index', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'the section index is a desktop affordance');

    await page.getByRole('navigation', { name: 'Question groups' }).getByRole('link').nth(1).click();
    await expect(page).toHaveURL(/#/);
  });
});

test.describe('article contents', () => {
  test('links to the sections of a long article', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'the contents list is a desktop affordance');

    await page.goto('insights/reading-a-property-document');
    const toc = page.getByRole('navigation', { name: 'On this page' });
    await expect(toc).toBeVisible();

    const first = toc.getByRole('link').first();
    const href = await first.getAttribute('href');
    await first.click();

    await expect(page.locator(href!)).toBeVisible();
  });
});

test.describe('practice area pages', () => {
  test('cross-link to the other areas', async ({ page }) => {
    await page.goto('practice-areas/civil-matters');
    const nav = page.getByRole('navigation', { name: 'Other areas of practice' });
    await expect(nav.getByRole('link')).toHaveCount(2);

    await nav.getByRole('link').first().click();
    await expect(page).toHaveURL(/\/practice-areas\/[a-z-]+$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('carry a disclaimer and a route to a consultation', async ({ page }) => {
    await page.goto('practice-areas/real-estate-property');
    await expect(page.getByText(/not legal advice/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /request a consultation/i }).first()).toBeVisible();
  });
});
