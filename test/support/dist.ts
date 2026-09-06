import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, posix, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, type HTMLElement } from 'node-html-parser';
import astroConfig from '../../astro.config.mjs';

/**
 * Loads the built site from dist/ for assertion.
 *
 * The base path is read from astro.config.mjs rather than hard-coded, so these
 * tests keep verifying the real deployment target if the site moves to a
 * custom domain.
 */

export const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
export const distDir = join(repoRoot, 'dist');

export const base = (astroConfig.base ?? '/').replace(/\/$/, '');
export const siteOrigin = astroConfig.site ?? '';

export interface BuiltPage {
  /** Route as served, e.g. "/practice-areas/civil-matters". */
  route: string;
  /** Path on disk, relative to dist/. */
  file: string;
  html: string;
  dom: HTMLElement;
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

if (!existsSync(distDir)) {
  throw new Error('dist/ not found — run `npm run build` before the build-output tests.');
}

const allFiles = walk(distDir).map((f) => relative(distDir, f).split(sep).join(posix.sep));

export const pages: BuiltPage[] = allFiles
  .filter((f) => f.endsWith('.html'))
  .map((file) => {
    const html = readFileSync(join(distDir, file), 'utf8');
    const route = '/' + file.replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '');
    return { route: route === '/' ? '/' : route, file, html, dom: parse(html) };
  })
  .sort((a, b) => a.route.localeCompare(b.route));

/** Every file emitted into dist/, as posix-style paths relative to dist/. */
export const emittedFiles = new Set(allFiles);

/** Pages that are part of the public site (excludes the 404 document). */
export const publicPages = pages.filter((p) => p.route !== '/404');

/** Routes the site is expected to publish. Adding a page means adding it here. */
export const expectedRoutes = [
  '/',
  '/profile',
  '/practice-areas',
  '/practice-areas/intellectual-property-trademarks',
  '/practice-areas/real-estate-property',
  '/practice-areas/civil-matters',
  '/insights',
  '/insights/trade-mark-search-what-it-does',
  '/insights/reading-a-property-document',
  '/insights/what-a-legal-notice-is-for',
  '/contact',
  '/faq',
  '/legal-disclaimer',
  '/privacy-policy',
  '/404',
];

/** Resolves an in-site href to the dist file it should be served from. */
export function distTargetFor(href: string): string | null {
  const withoutHash = href.split('#')[0]!.split('?')[0]!;
  if (withoutHash === '') return null;

  if (!withoutHash.startsWith(base + '/') && withoutHash !== base && withoutHash !== base + '/') {
    return null;
  }

  let path = withoutHash.slice(base.length);
  if (path === '' || path === '/') return 'index.html';

  path = path.replace(/^\//, '');
  if (path.endsWith('/')) return `${path}index.html`;
  if (/\.[a-z0-9]+$/i.test(path)) return path;
  return `${path}/index.html`;
}

/** Visible text of a page, with scripts, styles and markup removed. */
export function visibleText(page: BuiltPage): string {
  const clone = parse(page.html);
  clone.querySelectorAll('script, style, noscript').forEach((el) => el.remove());
  return clone.structuredText.replace(/\s+/g, ' ').trim();
}

export function metaContent(page: BuiltPage, selector: string): string | undefined {
  return page.dom.querySelector(selector)?.getAttribute('content');
}
