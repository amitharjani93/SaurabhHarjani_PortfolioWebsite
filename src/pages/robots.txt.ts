import type { APIRoute } from 'astro';
import { absoluteUrl } from '../lib/url';
import { site as config } from '../config/site';

/**
 * Generated at build time so the sitemap URL always matches the deploy target.
 *
 * While `config.indexable` is false the whole site is disallowed, because a
 * GitHub Pages URL is public as soon as it exists and the legal copy is still
 * in draft.
 *
 * Crawlers only read robots.txt from the origin root. Under a GitHub Pages
 * *project* path (…github.io/repo/) this file is emitted at /repo/robots.txt
 * and will be ignored — which is why the noindex meta tag in SEO.astro, not
 * this file, is what actually keeps a review copy out of search results.
 */
export const GET: APIRoute = ({ site }) => {
  const body = config.indexable
    ? `User-agent: *
Allow: /

Sitemap: ${absoluteUrl('/sitemap-index.xml', site)}
`
    : `# Review copy — not yet published. See src/config/site.ts › indexable.
User-agent: *
Disallow: /
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
