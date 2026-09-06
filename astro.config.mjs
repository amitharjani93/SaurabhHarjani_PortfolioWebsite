// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/**
 * Deployment configuration.
 * ------------------------------------------------------------------
 * GitHub Pages supports two shapes of URL and this config handles both:
 *
 *   1. User/organisation site  ->  https://<username>.github.io
 *      SITE = "https://<username>.github.io"      BASE_PATH = "/"
 *
 *   2. Project site (default)  ->  https://<username>.github.io/<repo>
 *      SITE = "https://<username>.github.io"      BASE_PATH = "/<repo>"
 *
 * Both values can be overridden with environment variables at build time,
 * which is what `.github/workflows/deploy.yml` does automatically.
 * When a custom domain is added later, set SITE to that domain and
 * BASE_PATH back to "/". Nothing else in the codebase needs to change.
 */
const SITE = process.env.SITE ?? 'https://saurabhharjani.github.io';
const BASE_PATH = process.env.BASE_PATH ?? '/SaurabhHarjani_PortfolioWebsite';

export default defineConfig({
  site: SITE,
  base: BASE_PATH,
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/404'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
