import { describe, expect, it } from 'vitest';
import { pages, visibleText } from '../support/dist';
import { bannedFiller, findViolations, prohibitedCopy } from '../support/compliance';

/**
 * Advertising-compliance regression suite.
 *
 * This is the check that matters most over the life of the site. Copy will be
 * edited long after launch, by people who are not thinking about Bar Council
 * restrictions at the time. These tests read the rendered text of every built
 * page and fail the build if a prohibited claim appears.
 *
 * ⚖️ A safety net, not legal advice — final wording remains the advocate's
 *    responsibility. Extend the vocabulary in test/support/compliance.ts.
 */

describe('advertising restrictions', () => {
  it.each(pages)('$route makes no prohibited claim', (page) => {
    const violations = findViolations(visibleText(page), page.route, prohibitedCopy);
    expect(
      violations.map((v) => `${v.reason}: ${v.excerpt}`),
      `prohibited copy on ${page.route}`,
    ).toEqual([]);
  });

  it('publishes no testimonial or review markup', () => {
    for (const page of pages) {
      const raw = page.dom
        .querySelectorAll('script[type="application/ld+json"]')
        .map((s) => s.rawText)
        .join('');
      expect(raw, page.route).not.toMatch(/"(Review|AggregateRating|Rating)"/);
    }
  });

  it('carries the non-solicitation disclaimer in the footer of every page', () => {
    for (const page of pages) {
      expect(visibleText(page), page.route).toMatch(/not an advertisement or solicitation/i);
    }
  });

  it('states on the contact page that an inquiry creates no relationship', () => {
    const contact = pages.find((p) => p.route === '/contact')!;
    const text = visibleText(contact);
    expect(text).toMatch(/does not by itself create an advocate-client relationship/i);
    expect(text).toMatch(/do not (send|submit) confidential/i);
  });

  it('reaches the legal disclaimer and privacy policy from every page', () => {
    for (const page of pages) {
      const hrefs = page.dom.querySelectorAll('a[href]').map((a) => a.getAttribute('href')!);
      expect(hrefs.some((h) => h.endsWith('/legal-disclaimer')), page.route).toBe(true);
      expect(hrefs.some((h) => h.endsWith('/privacy-policy')), page.route).toBe(true);
    }
  });

  it('disclaims every substantive practice and insight page', () => {
    const substantive = pages.filter(
      (p) => p.route.startsWith('/practice-areas') || p.route.startsWith('/insights') || p.route === '/faq',
    );
    expect(substantive.length).toBeGreaterThan(5);

    for (const page of substantive) {
      expect(visibleText(page), page.route).toMatch(/not legal advice|not advice on/i);
    }
  });
});

describe('copy quality', () => {
  it.each(pages)('$route avoids generic filler phrasing', (page) => {
    const violations = findViolations(visibleText(page), page.route, bannedFiller);
    expect(violations.map((v) => `${v.reason}: ${v.excerpt}`)).toEqual([]);
  });

  it('renders no unresolved template values', () => {
    for (const page of pages) {
      const text = visibleText(page);
      expect(text, page.route).not.toMatch(/\bundefined\b|\bNaN\b|\[object Object\]/);
      expect(text, page.route).not.toMatch(/\{\{|\}\}|\$\{/);
    }
  });

  it('renders no leftover authoring markers', () => {
    for (const page of pages) {
      expect(visibleText(page), page.route).not.toMatch(/TODO|FIXME|TBD|lorem ipsum|\[TO BE PROVIDED\]/i);
    }
  });

  it('labels sample articles visibly, so they cannot be read as real commentary', () => {
    const samples = pages.filter((p) => p.route.startsWith('/insights/'));
    for (const page of samples) {
      const text = visibleText(page);
      if (/Sample article\./i.test(text)) {
        expect(text, page.route).toMatch(/not published commentary|should not be relied upon/i);
      }
    }
  });
});
