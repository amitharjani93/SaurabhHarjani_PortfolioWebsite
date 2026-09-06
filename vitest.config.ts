import { defineConfig } from 'vitest/config';
import astroConfig from './astro.config.mjs';

/**
 * Unit and contract tests.
 *
 * These deliberately do NOT boot Astro. Everything under test is either a pure
 * module (src/lib, src/services) or authored content read from disk, so the
 * suite runs in a second or two and is cheap enough to sit in a pre-push hook.
 *
 * `import.meta.env.BASE_URL` is taken from astro.config.mjs rather than being
 * hard-coded, so the base-path tests keep testing the real deployment target
 * if it ever changes.
 */
export default defineConfig({
  define: {
    'import.meta.env.BASE_URL': JSON.stringify(astroConfig.base ?? '/'),
  },
  test: {
    environment: 'node',
    include: ['test/unit/**/*.test.ts'],
    globals: false,
    reporters: process.env.CI ? ['default', 'github-actions'] : ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      include: ['src/lib/**/*.ts', 'src/services/**/*.ts'],
      // The pure logic is the part that can silently go wrong, so it is held
      // to a real bar. Components and pages are covered by the e2e suite.
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
  },
});
