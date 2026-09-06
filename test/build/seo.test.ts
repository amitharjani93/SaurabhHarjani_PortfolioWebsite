import { describe, expect, it } from 'vitest';
import { base, metaContent, pages, publicPages, siteOrigin } from '../support/dist';

/**
 * Metadata and structured data.
 *
 * Every page has to be individually addressable in search results, and nothing
 * in the structured data may state a fact the advocate has not supplied.
 */

describe('page metadata', () => {
  it.each(publicPages)('$route has a non-empty, distinct title', ({ dom }) => {
    const title = dom.querySelector('title')?.structuredText.trim() ?? '';
    expect(title.length).toBeGreaterThan(10);
    // Beyond ~70 characters search results truncate the title.
    expect(title.length).toBeLessThanOrEqual(70);
  });

  it('gives every page a different title', () => {
    const titles = publicPages.map((p) => p.dom.querySelector('title')?.structuredText.trim());
    expect(new Set(titles).size).toBe(titles.length);
  });

  it.each(publicPages)('$route has a usable meta description', ({ dom, route }) => {
    const description = dom.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
    expect(description.length, route).toBeGreaterThan(50);
    expect(description.length, route).toBeLessThanOrEqual(200);
  });

  it('gives every page a different meta description', () => {
    const descriptions = publicPages.map((p) => metaContent(p, 'meta[name="description"]'));
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it.each(publicPages)('$route declares an absolute canonical URL matching its own route', ({ dom, route }) => {
    const canonical = dom.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '';
    expect(canonical.startsWith('https://'), route).toBe(true);

    const expected = `${siteOrigin}${base}${route === '/' ? '/' : route}`;
    expect(canonical.replace(/\/$/, ''), route).toBe(expected.replace(/\/$/, ''));
  });

  it.each(publicPages)('$route is indexable', ({ dom }) => {
    expect(dom.querySelector('meta[name="robots"]')?.getAttribute('content')).toContain('index');
  });

  it('keeps the 404 page out of the index', () => {
    const notFound = pages.find((p) => p.route === '/404')!;
    expect(metaContent(notFound, 'meta[name="robots"]')).toContain('noindex');
  });

  it.each(publicPages)('$route has complete Open Graph tags', ({ dom, route }) => {
    for (const property of ['og:type', 'og:title', 'og:description', 'og:url', 'og:image', 'og:site_name']) {
      const value = dom.querySelector(`meta[property="${property}"]`)?.getAttribute('content') ?? '';
      expect(value.trim(), `${route} is missing ${property}`).not.toBe('');
    }
  });

  it.each(publicPages)('$route has an absolute Open Graph image', ({ dom }) => {
    expect(dom.querySelector('meta[property="og:image"]')?.getAttribute('content')).toMatch(/^https?:\/\//);
  });

  it.each(publicPages)('$route has Twitter card tags', ({ dom, route }) => {
    for (const name of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
      const value = dom.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ?? '';
      expect(value.trim(), `${route} is missing ${name}`).not.toBe('');
    }
  });

  it.each(pages)('$route declares its language and viewport', ({ dom, route }) => {
    expect(dom.querySelector('html')?.getAttribute('lang'), route).toBeTruthy();
    expect(dom.querySelector('meta[name="viewport"]')?.getAttribute('content')).toContain('width=device-width');
  });

  it.each(pages)('$route does not disable pinch zoom', ({ dom }) => {
    const viewport = dom.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? '';
    expect(viewport).not.toMatch(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/);
  });
});

describe('heading structure', () => {
  it.each(pages)('$route has exactly one h1', ({ dom, route }) => {
    expect(dom.querySelectorAll('h1').length, route).toBe(1);
  });

  it.each(pages)('$route never skips a heading level', ({ dom, route }) => {
    const levels = dom
      .querySelectorAll('h1, h2, h3, h4, h5, h6')
      .map((h) => Number(h.tagName.slice(1)));

    for (let i = 1; i < levels.length; i += 1) {
      const jump = levels[i]! - levels[i - 1]!;
      expect(jump, `${route}: h${levels[i - 1]} → h${levels[i]}`).toBeLessThanOrEqual(1);
    }
  });

  it.each(pages)('$route has no empty headings', ({ dom, route }) => {
    const empty = dom
      .querySelectorAll('h1, h2, h3, h4, h5, h6')
      .filter((h) => h.structuredText.trim() === '');
    expect(empty.length, route).toBe(0);
  });
});

describe('structured data', () => {
  const blocks = pages.flatMap((page) =>
    page.dom
      .querySelectorAll('script[type="application/ld+json"]')
      .map((script) => ({ route: page.route, raw: script.rawText })),
  );

  it('emits structured data', () => {
    expect(blocks.length).toBeGreaterThan(0);
  });

  it('emits only valid JSON', () => {
    for (const { route, raw } of blocks) {
      expect(() => JSON.parse(raw), `${route} has malformed JSON-LD`).not.toThrow();
    }
  });

  it('declares a schema context on every block', () => {
    for (const { route, raw } of blocks) {
      expect(JSON.parse(raw)['@context'], route).toBe('https://schema.org');
    }
  });

  it('describes the advocate and the practice on every page', () => {
    for (const page of publicPages) {
      const graph = page.dom
        .querySelectorAll('script[type="application/ld+json"]')
        .flatMap((s) => JSON.parse(s.rawText)['@graph'] ?? []);
      const types = graph.map((node: { '@type': string }) => node['@type']);
      expect(types, page.route).toContain('Person');
      expect(types, page.route).toContain('LegalService');
    }
  });

  it('never states a credential that has not been configured', () => {
    // Unsupplied contact, address and bar details must be absent from the
    // graph entirely rather than emitted as null or an empty string.
    for (const { route, raw } of blocks) {
      const serialised = JSON.stringify(JSON.parse(raw));
      expect(serialised, route).not.toMatch(/:\s*(null|"")/);
      expect(serialised, route).not.toMatch(/undefined/);
    }
  });

  it('marks up articles and breadcrumbs where they apply', () => {
    const article = pages.find((p) => p.route.startsWith('/insights/'))!;
    const raw = article.dom.querySelectorAll('script[type="application/ld+json"]').map((s) => s.rawText).join('');
    expect(raw).toContain('"Article"');
    expect(raw).toContain('"BreadcrumbList"');
  });

  it('marks up FAQs on the pages that carry them', () => {
    for (const route of ['/faq', '/practice-areas/civil-matters']) {
      const page = pages.find((p) => p.route === route)!;
      const raw = page.dom.querySelectorAll('script[type="application/ld+json"]').map((s) => s.rawText).join('');
      expect(raw, route).toContain('"FAQPage"');
    }
  });
});
