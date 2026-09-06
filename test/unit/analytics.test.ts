import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * The site's privacy promise is that nothing third-party loads unless a
 * provider has been deliberately configured. That promise is asserted here and
 * again against the built HTML in test/dist/privacy.test.ts.
 */

type AnalyticsConfig = {
  provider: string;
  domain: string | null;
  scriptUrl: string | null;
  websiteId: string | null;
};

async function loadWith(analytics: AnalyticsConfig) {
  vi.resetModules();
  vi.doMock('../../src/config/site', () => ({ site: { analytics } }));
  return (await import('../../src/services/analytics')).getAnalyticsScript();
}

afterEach(() => {
  vi.doUnmock('../../src/config/site');
  vi.resetModules();
});

describe('getAnalyticsScript()', () => {
  it('loads nothing when no provider is configured', async () => {
    expect(await loadWith({ provider: 'none', domain: null, scriptUrl: null, websiteId: null })).toBeNull();
  });

  it('loads nothing when a provider is named but not configured', async () => {
    expect(await loadWith({ provider: 'plausible', domain: null, scriptUrl: null, websiteId: null })).toBeNull();
    expect(await loadWith({ provider: 'umami', domain: null, scriptUrl: null, websiteId: 'x' })).toBeNull();
  });

  it('returns the hosted Plausible script once a domain is set', async () => {
    const script = await loadWith({
      provider: 'plausible',
      domain: 'example.com',
      scriptUrl: null,
      websiteId: null,
    });
    expect(script?.src).toBe('https://plausible.io/js/script.js');
    expect(script?.attributes['data-domain']).toBe('example.com');
    expect(script?.attributes).toHaveProperty('defer');
  });

  it('honours a self-hosted script URL', async () => {
    const script = await loadWith({
      provider: 'plausible',
      domain: 'example.com',
      scriptUrl: 'https://stats.example.com/js/script.js',
      websiteId: null,
    });
    expect(script?.src).toBe('https://stats.example.com/js/script.js');
  });

  it('configures Umami only when both the script URL and website id are present', async () => {
    const script = await loadWith({
      provider: 'umami',
      domain: null,
      scriptUrl: 'https://stats.example.com/script.js',
      websiteId: 'abc-123',
    });
    expect(script?.attributes['data-website-id']).toBe('abc-123');
  });

  it('rejects an unrecognised provider rather than guessing', async () => {
    expect(
      await loadWith({ provider: 'google-analytics', domain: 'example.com', scriptUrl: null, websiteId: null }),
    ).toBeNull();
  });
});
