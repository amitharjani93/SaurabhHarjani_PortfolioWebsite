import type { APIRoute } from 'astro';
import { absoluteUrl } from '../lib/url';

/**
 * Generated at build time so the sitemap URL always matches the deploy target.
 *
 * Crawlers only read robots.txt from the origin root. Under a GitHub Pages
 * *project* path (…github.io/repo/) this file is emitted at /repo/robots.txt
 * and will be ignored — harmless, because nothing here is disallowed and the
 * sitemap can be submitted directly. On a custom domain or a user site it sits
 * at the root and behaves normally.
 */
export const GET: APIRoute = ({ site }) => {
  const body = `User-agent: *
Allow: /

Sitemap: ${absoluteUrl('/sitemap-index.xml', site)}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
