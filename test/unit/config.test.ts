import { describe, expect, it } from 'vitest';
import { primaryNav, primaryCta, utilityNav } from '../../src/config/navigation';
import { processSteps } from '../../src/config/process';
import { site, formattedAddress, hasContactDetails } from '../../src/config/site';

/**
 * Configuration invariants.
 *
 * src/config/site.ts is edited by hand by someone filling in real details. The
 * site is designed so that a missing value is omitted rather than rendered as a
 * gap, and these tests hold that design in place.
 */

describe('navigation', () => {
  it('uses app-relative hrefs, so the base-path helper can prefix them', () => {
    for (const item of [...primaryNav, ...utilityNav, primaryCta]) {
      expect(item.href.startsWith('/'), item.href).toBe(true);
    }
  });

  it('has no duplicate destinations', () => {
    const hrefs = primaryNav.map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('labels every item', () => {
    for (const item of [...primaryNav, ...utilityNav]) expect(item.label.trim()).not.toBe('');
  });

  it('leads with Home and ends with the contact route', () => {
    expect(primaryNav[0]?.href).toBe('/');
    expect(primaryNav.at(-1)?.href).toBe(primaryCta.href);
  });

  it('prefix-matches only the sections that have child pages', () => {
    const withChildren = primaryNav.filter((i) => i.matchPrefix).map((i) => i.href);
    expect(withChildren).toEqual(['/practice-areas', '/insights']);
  });

  it('keeps the disclaimer and privacy routes reachable from the footer', () => {
    const hrefs = utilityNav.map((i) => i.href);
    expect(hrefs).toContain('/privacy-policy');
    expect(hrefs).toContain('/legal-disclaimer');
  });
});

describe('site identity', () => {
  it('has a name, title and positioning line', () => {
    expect(site.name.trim()).not.toBe('');
    expect(site.title.trim()).not.toBe('');
    expect(site.positioning.trim()).not.toBe('');
  });

  it('keeps the default meta description within what search engines display', () => {
    expect(site.meta.defaultDescription.length).toBeGreaterThan(70);
    expect(site.meta.defaultDescription.length).toBeLessThanOrEqual(180);
  });

  it('provides a title template that leaves room for the page name', () => {
    expect(site.meta.titleTemplate).toContain('%s');
  });

  it('points the logo and social image at files under public/', () => {
    expect(site.assets.logo.startsWith('/')).toBe(true);
    expect(site.assets.ogImage.startsWith('/')).toBe(true);
  });
});

describe('placeholder handling', () => {
  it('leaves no unfilled marker text in a field that gets rendered', () => {
    // Missing information must be `null`, never a visible "[TO BE PROVIDED]".
    const rendered = JSON.stringify({
      name: site.name,
      practiceName: site.practiceName,
      tagline: site.tagline,
      title: site.title,
      positioning: site.positioning,
      profile: site.profile,
      compliance: site.compliance,
      contact: site.contact,
      bar: site.bar,
      meta: site.meta,
    });
    expect(rendered).not.toMatch(/\[TO BE PROVIDED\]|TODO|FIXME|lorem ipsum|XXX/i);
  });

  it('reports no contact details rather than inventing them while unset', () => {
    const anySet = Boolean(site.contact.email || site.contact.phone || site.contact.address.line1);
    expect(hasContactDetails).toBe(anySet);
  });

  it('omits missing address lines instead of rendering empty ones', () => {
    for (const line of formattedAddress()) expect(line.trim()).not.toBe('');
  });

  it('prints no address at all until there is a street or a locality', () => {
    // The country is always set, so a naive filter would render "Chambers:
    // India" on the contact page and in the footer.
    const a = site.contact.address;
    const hasPlace = Boolean(a.line1 || a.line2 || a.city || a.state || a.postalCode);
    expect(formattedAddress().length > 0).toBe(hasPlace);
  });

  it('includes the country once a real address is supplied', () => {
    if (!site.contact.address.line1 && !site.contact.address.city) return;
    expect(formattedAddress().at(-1)).toBe(site.contact.address.country);
  });

  it('keeps every credential list an array, so the profile page can hide empty sections', () => {
    for (const list of [
      site.profile.experience,
      site.profile.education,
      site.profile.qualifications,
      site.profile.memberships,
      site.profile.jurisdictions,
      site.profile.languages,
    ]) {
      expect(Array.isArray(list)).toBe(true);
    }
  });

  it('gives every supplied credential both a label and a detail', () => {
    for (const entry of [
      ...site.profile.experience,
      ...site.profile.education,
      ...site.profile.qualifications,
      ...site.profile.memberships,
    ]) {
      expect(entry.label.trim()).not.toBe('');
      expect(entry.detail.trim()).not.toBe('');
    }
  });
});

describe('compliance configuration', () => {
  it('warns against sending confidential material through the form', () => {
    expect(site.compliance.formNotice).toMatch(/confidential/i);
  });

  it('states that an inquiry does not create an advocate-client relationship', () => {
    expect(site.compliance.formNotice).toMatch(/advocate-client relationship/i);
  });

  it('disclaims advertising in the footer', () => {
    expect(site.compliance.footerDisclaimer).toMatch(/not an advertisement|solicitation/i);
  });

  it('says the page disclaimer is not legal advice', () => {
    expect(site.compliance.pageDisclaimer).toMatch(/not legal advice/i);
  });

  it('has entry-disclaimer wording ready even while the gate is switched off', () => {
    expect(site.compliance.entryDisclaimer.body.length).toBeGreaterThan(0);
    expect(site.compliance.entryDisclaimer.acceptLabel.trim()).not.toBe('');
  });
});

describe('privacy defaults', () => {
  it('ships with analytics disabled', () => {
    expect(site.analytics.provider).toBe('none');
  });
});

describe('publication state', () => {
  it('stays out of search results until the launch checklist is complete', () => {
    // Flipping this to true is a deliberate launch step, not a default.
    // If this fails, confirm the advocate has approved the legal copy.
    expect(site.indexable).toBe(false);
  });
});

describe('contact details', () => {
  it('gives the phone number in a form the tel: link can use', () => {
    if (!site.contact.phone) return;
    const dialled = site.contact.phone.replace(/\s/g, '');
    expect(dialled, 'include the country code, e.g. +91 75037 82318').toMatch(/^\+\d{7,15}$/);
  });

  it('gives a complete email address', () => {
    if (!site.contact.email) return;
    expect(site.contact.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/);
  });

  it('stores the WhatsApp number as bare digits with a country code', () => {
    if (!site.contact.whatsapp) return;
    // wa.me rejects spaces, plus signs and punctuation.
    expect(site.contact.whatsapp).toMatch(/^\d{11,15}$/);
  });

  it('does not advertise WhatsApp without a number to route it to', () => {
    if (site.contact.whatsappEnabled) expect(site.contact.whatsapp).toBeTruthy();
  });
});

describe('engagement process', () => {
  it('describes an ordered sequence', () => {
    expect(processSteps.length).toBeGreaterThanOrEqual(3);
    expect(processSteps.map((s) => s.numeral)).toEqual(
      processSteps.map((_, i) => String(i + 1).padStart(2, '0')),
    );
  });

  it('promises no outcome', () => {
    const text = processSteps.map((s) => `${s.title} ${s.body}`).join(' ');
    expect(text).not.toMatch(/\b(guarantee|assure|ensure a (win|favourable|favorable)|will win)\b/i);
  });
});
