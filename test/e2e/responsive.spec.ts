import { test, expect } from '@playwright/test';
import { keyRoutes, routes, breakpoints } from './routes';

/**
 * Responsive behaviour.
 *
 * Mobile is designed rather than shrunk, so these check the properties that
 * would reveal a shrunken desktop: sideways scrolling, cramped tap targets and
 * text too small to read.
 *
 * The breakpoint sweep uses one route per template — the remaining pages reuse
 * those layouts, so testing all twelve at six widths would cost six times as
 * long without covering anything new.
 */

test.describe('layout', () => {
  // Viewport is set per test, so this block runs once rather than per project.
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'viewport is set per test');
  });

  for (const size of breakpoints) {
    test(`no sideways scrolling at ${size.width}px (${size.name})`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });

      for (const route of keyRoutes) {
        await page.goto(route.path);
        const overflow = await page.evaluate(() => {
          const de = document.documentElement;
          return de.scrollWidth - de.clientWidth;
        });
        expect(overflow, `/${route.path} overflows at ${size.width}px`).toBeLessThanOrEqual(0);
      }
    });
  }

  test('switches between the drawer and the full navigation at 1024px', async ({ page }) => {
    await page.goto('');
    const toggle = page.getByRole('button', { name: 'Open menu' });

    await page.setViewportSize({ width: 1023, height: 900 });
    await expect(toggle).toBeVisible();

    await page.setViewportSize({ width: 1024, height: 900 });
    await expect(toggle).toBeHidden();
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  });

  test('closes the drawer if the window grows past the breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.getByRole('dialog', { name: 'Site menu' })).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(page.getByRole('dialog', { name: 'Site menu' })).toBeHidden();
  });

  test('keeps text readable on a small phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    const problems: string[] = [];

    for (const route of keyRoutes) {
      await page.goto(route.path);
      const found = await page.evaluate(() => {
        const out: string[] = [];
        for (const el of document.querySelectorAll('p, li, dd')) {
          const text = (el.textContent ?? '').trim();
          if (text.length < 40) continue;
          const size = Number.parseFloat(getComputedStyle(el).fontSize);

          // Nothing may be genuinely tiny.
          if (size < 13) out.push(`${size}px (too small) — ${text.slice(0, 40)}`);

          // Primary reading content is held to a higher bar than the
          // secondary microcopy in disclaimers, captions and the footer.
          const isPrimary = el.closest('.prose-legal, .measure') && !el.closest('.disclaimer, footer');
          if (isPrimary && size < 16) out.push(`${size}px (primary prose) — ${text.slice(0, 40)}`);
        }
        return out;
      });
      problems.push(...found.map((f) => `/${route.path}: ${f}`));
    }

    expect(problems).toEqual([]);
  });

  test('keeps line length within a comfortable measure on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('insights/what-a-legal-notice-is-for');

    const overlyWide = await page.evaluate(() => {
      const body = document.querySelector('.prose-legal');
      if (!body) return ['no article body found'];
      const width = body.getBoundingClientRect().width;
      const fontSize = Number.parseFloat(getComputedStyle(body).fontSize);
      const charactersPerLine = width / (fontSize * 0.5);
      return charactersPerLine > 95 ? [`${Math.round(charactersPerLine)} characters per line`] : [];
    });

    expect(overlyWide).toEqual([]);
  });
});

test.describe('touch targets', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'mobile viewport only');
  });

  test('every page has comfortably sized controls', async ({ page }) => {
    const cramped: string[] = [];

    for (const route of routes) {
      await page.goto(route.path);

      const offenders = await page.evaluate(() => {
        const found: string[] = [];

        for (const el of document.querySelectorAll('a[href], button, input, select, textarea')) {
          // Off-screen helpers: the skip link, the honeypot, hidden inputs.
          if (el.closest('[aria-hidden="true"]')) continue;
          if (el.classList.contains('sr-only')) continue;

          // A visually hidden radio or checkbox is operated through its label,
          // so that is what has to be big enough.
          const target =
            (el as HTMLElement).offsetWidth <= 2 && el.closest('label')
              ? (el.closest('label') as HTMLElement)
              : (el as HTMLElement);

          const rect = target.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          // Links inside a paragraph are exempt under WCAG 2.2 (inline targets).
          if (el.tagName === 'A' && el.closest('p, li, .prose-legal')) continue;

          if (rect.height < 40) {
            found.push(`${rect.height.toFixed(0)}px — ${(target.textContent ?? '').trim().slice(0, 30)}`);
          }
        }
        return found;
      });

      cramped.push(...offenders.map((o) => `/${route.path}: ${o}`));
    }

    expect([...new Set(cramped)]).toEqual([]);
  });
});

test.describe('motion', () => {
  test('shows all content immediately when motion is reduced', async ({ page }) => {
    // Emulated explicitly, at the point of use, so the intent is unambiguous.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('');

    const state = await page.evaluate(() => {
      const all = [...document.querySelectorAll('.reveal')];
      return {
        emulated: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        total: all.length,
        transparent: all.filter((el) => Number(getComputedStyle(el).opacity) < 1).length,
      };
    });

    expect(state.emulated, 'reduced-motion emulation did not reach the page').toBe(true);
    expect(state.total).toBeGreaterThan(0);
    expect(state.transparent, 'revealed sections must not stay transparent').toBe(0);
  });
});
