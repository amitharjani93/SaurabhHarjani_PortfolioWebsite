import { describe, expect, it } from 'vitest';
import { pages, visibleText } from '../support/dist';

/**
 * Privacy and markup integrity of the shipped HTML.
 *
 * The site promises that nothing third-party loads and no cookies are set
 * unless analytics has been deliberately configured. That promise is asserted
 * here against the actual build, not against the configuration that produced it.
 */

describe('third-party requests', () => {
  it('loads no cross-origin scripts while analytics is disabled', () => {
    const external = pages.flatMap((page) =>
      page.dom
        .querySelectorAll('script[src]')
        .map((s) => s.getAttribute('src')!)
        .filter((src) => /^(https?:)?\/\//.test(src))
        .map((src) => `${page.route} → ${src}`),
    );
    expect(external).toEqual([]);
  });

  it('loads no cross-origin stylesheets or fonts', () => {
    // Only fetching relationships matter here; canonical and sitemap links are
    // absolute by design.
    const fetching = ['stylesheet', 'preload', 'preconnect', 'dns-prefetch', 'prefetch', 'modulepreload'];
    const external = pages.flatMap((page) =>
      page.dom
        .querySelectorAll('link[href]')
        .filter((l) => fetching.includes((l.getAttribute('rel') ?? '').toLowerCase()))
        .map((l) => l.getAttribute('href')!)
        .filter((href) => /^(https?:)?\/\//.test(href))
        .map((href) => `${page.route} → ${href}`),
    );
    expect(external, 'fonts and styles must be self-hosted').toEqual([]);
  });

  it('embeds no third-party iframes, pixels or beacons', () => {
    for (const page of pages) {
      expect(page.dom.querySelectorAll('iframe').length, page.route).toBe(0);
      const remoteImages = page.dom
        .querySelectorAll('img[src]')
        .filter((img) => /^(https?:)?\/\//.test(img.getAttribute('src')!));
      expect(remoteImages.length, page.route).toBe(0);
    }
  });

  it('shows no cookie banner, because no cookies are set', () => {
    for (const page of pages) {
      expect(visibleText(page), page.route).not.toMatch(/we use cookies|accept (all )?cookies/i);
    }
  });
});

describe('images and media', () => {
  it('gives every image alt text', () => {
    const missing = pages.flatMap((page) =>
      page.dom
        .querySelectorAll('img')
        .filter((img) => img.getAttribute('alt') === undefined)
        .map((img) => `${page.route} → ${img.getAttribute('src')}`),
    );
    expect(missing).toEqual([]);
  });

  it('reserves space for every image, so nothing shifts as it loads', () => {
    const unsized = pages.flatMap((page) =>
      page.dom
        .querySelectorAll('img')
        .filter((img) => !img.getAttribute('width') || !img.getAttribute('height'))
        .map((img) => `${page.route} → ${img.getAttribute('src')}`),
    );
    expect(unsized).toEqual([]);
  });
});

describe('document structure', () => {
  it.each(pages)('$route has one main landmark, a header and a footer', ({ dom, route }) => {
    expect(dom.querySelectorAll('main').length, route).toBe(1);
    expect(dom.querySelectorAll('header').length, route).toBeGreaterThanOrEqual(1);
    expect(dom.querySelectorAll('footer').length, route).toBe(1);
  });

  it.each(pages)('$route offers a skip link to the main content', ({ dom, route }) => {
    const skip = dom.querySelector('a[href="#main"]');
    expect(skip, route).not.toBeNull();
    expect(dom.querySelector('#main'), route).not.toBeNull();
  });

  it.each(pages)('$route names every navigation landmark', ({ dom, route }) => {
    const navs = dom.querySelectorAll('nav');
    for (const nav of navs) {
      const named = nav.getAttribute('aria-label') || nav.getAttribute('aria-labelledby');
      expect(named, `${route} has an unnamed <nav>`).toBeTruthy();
    }
  });

  it('marks the current page in the primary navigation', () => {
    for (const page of pages.filter((p) => p.route !== '/404')) {
      const current = page.dom.querySelectorAll('[aria-current="page"]');
      expect(current.length, `${page.route} has no current-page marker`).toBeGreaterThan(0);
    }
  });
});

describe('consultation form', () => {
  const contact = pages.find((p) => p.route === '/contact')!;

  it('labels every control', () => {
    const controls = contact.dom.querySelectorAll('input:not([type="hidden"]), select, textarea');
    const ids = controls.map((c) => c.getAttribute('id')).filter(Boolean);
    const labelledIds = new Set(
      contact.dom.querySelectorAll('label[for]').map((l) => l.getAttribute('for')!),
    );

    const unlabelled = ids.filter((id) => {
      if (labelledIds.has(id!)) return false;
      const control = contact.dom.querySelector(`#${id}`);
      // A wrapping <label> or an explicit aria-label is equally acceptable.
      return !control?.closest('label') && !control?.getAttribute('aria-label');
    });

    expect(unlabelled).toEqual([]);
  });

  it('wires an error region to every field', () => {
    for (const field of contact.dom.querySelectorAll('[data-field]')) {
      expect(field.querySelector('[data-error]'), field.getAttribute('data-field')).not.toBeNull();
    }
  });

  it('announces submission results politely', () => {
    const result = contact.dom.querySelector('[data-result]');
    expect(result?.getAttribute('role')).toBe('status');
    expect(result?.getAttribute('aria-live')).toBe('polite');
  });

  it('ships no pre-rendered confirmation message', () => {
    // A success message must only ever be produced by a real delivery.
    const result = contact.dom.querySelector('[data-result]');
    expect(result?.structuredText.trim()).toBe('');
    expect(visibleText(contact)).not.toMatch(/your (inquiry|enquiry) (has been|was) (received|sent)/i);
  });

  it('keeps the honeypot out of the accessibility tree', () => {
    const honeypot = contact.dom.querySelector('#company');
    expect(honeypot).not.toBeNull();
    expect(honeypot?.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(honeypot?.getAttribute('tabindex')).toBe('-1');
  });
});

describe('client-side JavaScript', () => {
  it('stays small, because the site must work as static documents', () => {
    const inlineBytes = pages.reduce(
      (total, page) =>
        total +
        page.dom
          .querySelectorAll('script:not([src])')
          .reduce((sum, s) => sum + s.rawText.length, 0),
      0,
    );
    const perPage = inlineBytes / pages.length;
    expect(perPage, 'inline script per page').toBeLessThan(12_000);
  });

  it('renders every page usefully without JavaScript', () => {
    // No page may depend on a script to show its content.
    for (const page of pages) {
      expect(visibleText(page).length, page.route).toBeGreaterThan(800);
    }
  });
});
