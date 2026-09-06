import { describe, expect, it } from 'vitest';
import { base, distTargetFor, emittedFiles, expectedRoutes, pages } from '../support/dist';

/**
 * Link and routing integrity.
 *
 * A GitHub Pages project deploy serves the site from /<repo>/. The most likely
 * production failure is an internal link that forgot the prefix — it works in
 * development and 404s once deployed. These tests walk every anchor, script,
 * stylesheet and image in every built page and check it resolves to a file
 * that was actually emitted.
 */

describe('routes', () => {
  it('builds every expected route', () => {
    const built = pages.map((p) => p.route).sort();
    expect(built).toEqual([...expectedRoutes].sort());
  });

  it('emits a 404 document for GitHub Pages to serve', () => {
    expect(emittedFiles.has('404.html')).toBe(true);
  });

  it('emits .nojekyll so the _astro directory is published', () => {
    expect(emittedFiles.has('.nojekyll')).toBe(true);
  });
});

describe('internal links', () => {
  const anchors = pages.flatMap((page) =>
    page.dom.querySelectorAll('a[href]').map((a) => ({ page: page.route, href: a.getAttribute('href')! })),
  );

  it('finds links to check', () => {
    expect(anchors.length).toBeGreaterThan(100);
  });

  it('never emits a root-relative link that skips the base path', () => {
    const unprefixed = anchors.filter(
      ({ href }) => href.startsWith('/') && base !== '' && !href.startsWith(`${base}/`) && href !== base,
    );
    expect(unprefixed, 'links missing the deployment base path').toEqual([]);
  });

  it('points every in-site link at a file that was built', () => {
    const broken = anchors
      .filter(({ href }) => href.startsWith('/'))
      .map(({ page, href }) => ({ page, href, target: distTargetFor(href) }))
      .filter(({ target }) => target !== null && !emittedFiles.has(target!))
      .map(({ page, href, target }) => `${page} → ${href} (expected dist/${target})`);

    expect(broken).toEqual([]);
  });

  it('resolves every in-page anchor to an element with that id', () => {
    const broken: string[] = [];

    for (const page of pages) {
      const ids = new Set(page.dom.querySelectorAll('[id]').map((el) => el.getAttribute('id')!));
      for (const a of page.dom.querySelectorAll('a[href^="#"]')) {
        const id = a.getAttribute('href')!.slice(1);
        if (id && !ids.has(id)) broken.push(`${page.route} → #${id}`);
      }
    }

    expect(broken).toEqual([]);
  });

  it('opens every external link safely', () => {
    const unsafe = pages.flatMap((page) =>
      page.dom
        .querySelectorAll('a[target="_blank"]')
        .filter((a) => !(a.getAttribute('rel') ?? '').includes('noopener'))
        .map((a) => `${page.route} → ${a.getAttribute('href')}`),
    );
    expect(unsafe).toEqual([]);
  });

  it('gives every link an accessible name', () => {
    const unnamed = pages.flatMap((page) =>
      page.dom
        .querySelectorAll('a[href]')
        .filter((a) => a.structuredText.trim() === '' && !a.getAttribute('aria-label') && !a.querySelector('img[alt]'))
        .map((a) => `${page.route} → ${a.getAttribute('href')}`),
    );
    // Full-row overlay links are the exception: they are labelled explicitly.
    expect(unnamed).toEqual([]);
  });
});

describe('static assets', () => {
  it('prefixes and resolves every stylesheet, script and image', () => {
    const broken: string[] = [];

    for (const page of pages) {
      const refs = [
        ...page.dom.querySelectorAll('link[rel="stylesheet"][href]').map((el) => el.getAttribute('href')!),
        ...page.dom.querySelectorAll('link[rel="icon"][href]').map((el) => el.getAttribute('href')!),
        ...page.dom.querySelectorAll('script[src]').map((el) => el.getAttribute('src')!),
        ...page.dom.querySelectorAll('img[src]').map((el) => el.getAttribute('src')!),
      ];

      for (const ref of refs) {
        if (!ref.startsWith('/')) continue;
        if (base !== '' && !ref.startsWith(`${base}/`)) {
          broken.push(`${page.route} → ${ref} (missing base path)`);
          continue;
        }
        const target = distTargetFor(ref);
        if (target && !emittedFiles.has(target)) broken.push(`${page.route} → ${ref} (not built)`);
      }
    }

    expect(broken).toEqual([]);
  });
});

describe('sitemap and robots', () => {
  const sitemapFiles = [...emittedFiles].filter((f) => f.startsWith('sitemap'));

  it('emits a sitemap', () => {
    expect(sitemapFiles).toContain('sitemap-index.xml');
    expect(sitemapFiles.length).toBeGreaterThan(1);
  });

  it('lists every public route in the sitemap, with the base path', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { distDir } = await import('../support/dist');

    const xml = sitemapFiles
      .filter((f) => f !== 'sitemap-index.xml')
      .map((f) => readFileSync(join(distDir, f), 'utf8'))
      .join('');

    for (const route of expectedRoutes.filter((r) => r !== '/404')) {
      const expected = `${base}${route === '/' ? '/' : route}`;
      expect(xml, `sitemap is missing ${route}`).toContain(expected);
    }
  });

  it('excludes the 404 page from the sitemap', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { distDir } = await import('../support/dist');

    const xml = sitemapFiles
      .filter((f) => f !== 'sitemap-index.xml')
      .map((f) => readFileSync(join(distDir, f), 'utf8'))
      .join('');

    expect(xml).not.toContain('/404');
  });

  it('serves a robots.txt that matches the publication state', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { distDir, siteOrigin } = await import('../support/dist');
    const { site } = await import('../../src/config/site');

    const robots = readFileSync(join(distDir, 'robots.txt'), 'utf8');

    if (site.indexable) {
      expect(robots).toContain('Sitemap:');
      expect(robots).toContain(`${siteOrigin}${base}/sitemap-index.xml`);
      expect(robots).not.toContain('Disallow: /');
    } else {
      // A review copy must ask crawlers to stay away entirely.
      expect(robots).toContain('Disallow: /');
      expect(robots).not.toContain('Sitemap:');
    }
  });
});
