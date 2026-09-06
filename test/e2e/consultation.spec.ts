import { test, expect } from '@playwright/test';

/**
 * The consultation flow.
 *
 * The site is currently built with no endpoint and no published email address,
 * so the honest outcome is "online submission is not available". These tests
 * assert that outcome and, above all, that no path ever claims an inquiry was
 * delivered when it was not.
 */

const AFFIRMATIVE_DELIVERY = /your (inquiry|enquiry|message|details) (has|have) been (received|sent)|thank you/i;

/**
 * The radio and checkbox inputs are visually hidden and operated through their
 * labels — the standard accessible pattern. Tests click the label, as a pointer
 * user does, rather than forcing a click on a 1px input.
 */
function consentLabel(page: import('@playwright/test').Page) {
  return page.locator('label.checkbox');
}

function contactOption(page: import('@playwright/test').Page, name: string) {
  return page.locator('label.radio').filter({ hasText: name });
}

async function fillValidInquiry(page: import('@playwright/test').Page) {
  await page.getByLabel('Full name').fill('A. Client');
  // By role, because the label "Email" also matches the contact-method radio.
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('client@example.com');
  await page.getByLabel('What does the matter relate to?').selectOption({ index: 1 });
  await page
    .getByLabel('Brief description of the matter')
    .fill('A contract was breached last month and I need to know where I stand.');

  await consentLabel(page).click();
  await expect(page.getByRole('checkbox')).toBeChecked();
}

test.beforeEach(async ({ page }) => {
  await page.goto('contact');
});

test.describe('validation', () => {
  test('reports every missing field at once, and confirms nothing', async ({ page }) => {
    await page.getByRole('button', { name: /Send Inquiry|Compose Inquiry Email/i }).click();

    const errors = page.locator('[data-error]:not([hidden])');
    await expect(errors).toHaveCount(5);

    const result = page.locator('[data-result]');
    await expect(result).toBeVisible();
    await expect(result).not.toContainText(AFFIRMATIVE_DELIVERY);
  });

  test('associates each error with its field for assistive technology', async ({ page }) => {
    await page.getByRole('button', { name: /Send Inquiry|Compose Inquiry Email/i }).click();

    const name = page.getByLabel('Full name');
    await expect(name).toHaveAttribute('aria-invalid', 'true');

    const describedBy = await name.getAttribute('aria-describedby');
    expect(describedBy).toContain('fullName-error');
    await expect(page.locator('#fullName-error')).toBeVisible();
  });

  test('moves focus to the first field needing attention', async ({ page }) => {
    await page.getByRole('button', { name: /Send Inquiry|Compose Inquiry Email/i }).click();
    await expect(page.getByLabel('Full name')).toBeFocused();
  });

  test('clears an error as soon as the field is corrected', async ({ page }) => {
    await page.getByRole('button', { name: /Send Inquiry|Compose Inquiry Email/i }).click();
    await expect(page.locator('#fullName-error')).toBeVisible();

    await page.getByLabel('Full name').fill('A. Client');
    await expect(page.locator('#fullName-error')).toBeHidden();
  });

  test('rejects a malformed email address', async ({ page }) => {
    await fillValidInquiry(page);
    await page.getByRole('textbox', { name: 'Email', exact: true }).fill('not-an-address');
    await page.getByRole('button', { name: /Send Inquiry|Compose Inquiry Email/i }).click();

    await expect(page.locator('#email-error')).toBeVisible();
  });

  test('asks for a number when the client prefers to be called', async ({ page }) => {
    await fillValidInquiry(page);
    await contactOption(page, 'Phone').click();
    await expect(page.getByRole('radio', { name: 'Phone' })).toBeChecked();

    await page.getByRole('button', { name: /Send Inquiry|Compose Inquiry Email/i }).click();

    await expect(page.locator('#phone-error')).toBeVisible();
  });

  test('requires the consent acknowledgement', async ({ page }) => {
    await fillValidInquiry(page);
    await consentLabel(page).click();
    await expect(page.getByRole('checkbox')).not.toBeChecked();

    await page.getByRole('button', { name: /Send Inquiry|Compose Inquiry Email/i }).click();

    await expect(page.locator('#consent-error')).toBeVisible();
  });

  test('counts characters as the description is written', async ({ page }) => {
    await page.getByLabel('Brief description of the matter').fill('A short note about the matter.');
    await expect(page.locator('[data-counter]')).toContainText('of 3,000 characters');
  });
});

test.describe('submission', () => {
  test('states plainly that online submission is unavailable, rather than pretending', async ({ page }) => {
    const form = page.locator('form[data-consultation-form]');
    const endpoint = (await form.getAttribute('data-endpoint')) ?? '';
    const email = (await form.getAttribute('data-email')) ?? '';

    // Guards the current build: no endpoint and no published email address.
    test.skip(endpoint !== '' || email !== '', 'a delivery transport is configured');

    await fillValidInquiry(page);
    await page.getByRole('button', { name: /Send Inquiry/i }).click();

    const result = page.locator('[data-result]');
    await expect(result).toContainText(/not available/i);
    await expect(result).not.toContainText(AFFIRMATIVE_DELIVERY);
  });

  test('never posts anywhere when no endpoint is configured', async ({ page }) => {
    const posts: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST') posts.push(request.url());
    });

    await fillValidInquiry(page);
    await page.getByRole('button', { name: /Send Inquiry|Compose Inquiry Email/i }).click();
    await expect(page.locator('[data-result]')).toBeVisible();

    expect(posts).toEqual([]);
  });
});

test.describe('compliance notices', () => {
  test('warns against sending confidential material before the form', async ({ page }) => {
    const notice = page.locator('.disclaimer--form');
    await expect(notice).toBeVisible();
    await expect(notice).toContainText(/do not (send|submit) confidential/i);
    await expect(notice).toContainText(/does not by itself create an advocate-client relationship/i);
  });

  test('asks the client to acknowledge it before sending', async ({ page }) => {
    // The accessible name is what a screen reader announces, and unlike
    // textContent it has its whitespace collapsed.
    await expect(page.getByRole('checkbox')).toHaveAccessibleName(
      /does not create an advocate-client relationship/i,
    );
  });

  test('tells the client not to attach documents yet', async ({ page }) => {
    await expect(page.getByText(/do not attach documents to your first inquiry/i)).toBeVisible();
  });
});
