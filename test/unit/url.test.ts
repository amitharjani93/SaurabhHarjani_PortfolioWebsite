import { describe, expect, it } from 'vitest';
import { url, absoluteUrl, normalisePath, isActive } from '../../src/lib/url';

/**
 * Base-path handling is the single most failure-prone part of this site: a
 * GitHub Pages project deploy serves everything under /<repo>/, and a missed
 * prefix produces links that work locally and 404 in production.
 *
 * These tests are written against whatever base the build is configured with,
 * so they keep their value if the site moves to a custom domain (base "/").
 */
const BASE = import.meta.env.BASE_URL;
const trimmedBase = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;

describe('url()', () => {
  it('prefixes an app-relative path with the configured base', () => {
    expect(url('/profile')).toBe(`${trimmedBase}/profile`);
  });

  it('accepts a path without a leading slash', () => {
    expect(url('profile')).toBe(`${trimmedBase}/profile`);
  });

  it('never produces a doubled slash', () => {
    for (const path of ['/', '/profile', 'profile', '/practice-areas/civil-matters']) {
      expect(url(path)).not.toMatch(/(?<!:)\/\//);
    }
  });

  it('always starts with the configured base', () => {
    for (const path of ['/', '/faq', '/insights/a-b-c']) {
      expect(url(path).startsWith(trimmedBase)).toBe(true);
    }
  });

  it('resolves the site root to a usable href', () => {
    expect(url('/')).toBe(trimmedBase === '' ? '/' : `${trimmedBase}/`);
  });

  it('returns the base for an empty path', () => {
    expect(url('')).toBe(BASE);
  });

  it('leaves absolute and protocol-relative URLs untouched', () => {
    expect(url('https://example.com/a')).toBe('https://example.com/a');
    expect(url('http://example.com')).toBe('http://example.com');
    expect(url('//cdn.example.com/x.js')).toBe('//cdn.example.com/x.js');
  });

  it('leaves mailto: and tel: untouched', () => {
    expect(url('mailto:someone@example.com')).toBe('mailto:someone@example.com');
    expect(url('tel:+919812345678')).toBe('tel:+919812345678');
  });

  it('leaves in-page anchors untouched', () => {
    expect(url('#main')).toBe('#main');
  });
});

describe('absoluteUrl()', () => {
  const site = new URL('https://example.com');

  it('combines the origin, the base and the path', () => {
    expect(absoluteUrl('/profile', site)).toBe(`https://example.com${trimmedBase}/profile`);
  });

  it('falls back to a relative href when no site origin is configured', () => {
    expect(absoluteUrl('/profile', undefined)).toBe(`${trimmedBase}/profile`);
  });

  it('produces a parseable URL for every route it is given', () => {
    for (const path of ['/', '/contact', '/insights/x']) {
      expect(() => new URL(absoluteUrl(path, site))).not.toThrow();
    }
  });
});

describe('normalisePath()', () => {
  it('strips the base prefix', () => {
    expect(normalisePath(`${trimmedBase}/profile`)).toBe('/profile');
  });

  it('strips a trailing slash but keeps the root', () => {
    expect(normalisePath(`${trimmedBase}/profile/`)).toBe('/profile');
    expect(normalisePath(`${trimmedBase}/`)).toBe('/');
  });

  it('returns the root for the bare base', () => {
    expect(normalisePath(trimmedBase || '/')).toBe('/');
  });
});

describe('isActive()', () => {
  it('matches the current page exactly', () => {
    expect(isActive('/profile', `${trimmedBase}/profile`)).toBe(true);
    expect(isActive('/profile', `${trimmedBase}/faq`)).toBe(false);
  });

  it('only matches the home link on the home page', () => {
    expect(isActive('/', `${trimmedBase}/`)).toBe(true);
    expect(isActive('/', `${trimmedBase}/profile`)).toBe(false);
  });

  it('matches descendants when prefix matching is requested', () => {
    const pathname = `${trimmedBase}/practice-areas/civil-matters`;
    expect(isActive('/practice-areas', pathname, true)).toBe(true);
    expect(isActive('/practice-areas', pathname, false)).toBe(false);
  });

  it('does not treat a sibling with a shared prefix as a descendant', () => {
    expect(isActive('/insight', `${trimmedBase}/insights`, true)).toBe(false);
  });

  it('tolerates a trailing slash on the href', () => {
    expect(isActive('/profile/', `${trimmedBase}/profile`)).toBe(true);
  });
});
