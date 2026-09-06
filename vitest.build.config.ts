import { defineConfig } from 'vitest/config';

/**
 * Build-output assertions.
 *
 * Runs against `dist/` after `npm run build`. Everything here is plain Node —
 * no browser — which makes it fast enough to run on every push while still
 * catching the failures that matter most on a static, base-path-sensitive site:
 * broken internal links, missing or duplicated metadata, malformed structured
 * data, and copy that would breach advertising restrictions.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/build/**/*.test.ts'],
    globals: false,
    testTimeout: 30_000,
    reporters: process.env.CI ? ['default', 'github-actions'] : ['default'],
  },
});
