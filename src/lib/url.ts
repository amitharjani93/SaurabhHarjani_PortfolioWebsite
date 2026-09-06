/**
 * Base-path aware URL helpers.
 *
 * GitHub Pages project sites are served from `/<repo>/`, so no internal link
 * may be written as a bare absolute path. Every internal href in the codebase
 * goes through `url()`, which means switching to a custom domain (base `/`)
 * requires no changes beyond astro.config.mjs.
 */

const BASE = import.meta.env.BASE_URL;

/** Resolve an app-relative path (e.g. '/profile') against the configured base. */
export function url(path: string): string {
  if (!path) return BASE;
  if (/^(https?:)?\/\//.test(path) || path.startsWith('mailto:') || path.startsWith('tel:')) {
    return path;
  }
  if (path.startsWith('#')) return path;

  const base = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
  const rest = path.startsWith('/') ? path : `/${path}`;
  const joined = `${base}${rest}`;
  return joined === '' ? '/' : joined;
}

/** Absolute URL, for canonical links, Open Graph tags and structured data. */
export function absoluteUrl(path: string, siteUrl: URL | undefined): string {
  const relative = url(path);
  if (!siteUrl) return relative;
  return new URL(relative, siteUrl).href;
}

/**
 * Strips the base prefix from a runtime pathname so navigation-active checks
 * work identically in development and under a project-site base path.
 */
export function normalisePath(pathname: string): string {
  const base = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
  let path = pathname;
  if (base && path.startsWith(base)) path = path.slice(base.length);
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return path || '/';
}

/** True when `href` is the current page, or an ancestor of it when prefix matching. */
export function isActive(href: string, pathname: string, matchPrefix = false): boolean {
  const current = normalisePath(pathname);
  const target = href.length > 1 && href.endsWith('/') ? href.slice(0, -1) : href;
  if (target === '/') return current === '/';
  return matchPrefix ? current === target || current.startsWith(`${target}/`) : current === target;
}
