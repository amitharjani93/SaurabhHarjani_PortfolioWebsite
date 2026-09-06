/**
 * ============================================================================
 *  SITE CONFIGURATION — EDIT THIS FILE FIRST
 * ============================================================================
 *
 *  Every piece of information about the practice lives here. Nothing in this
 *  file is duplicated anywhere else in the codebase, so changing a value here
 *  updates it everywhere: header, footer, contact page, structured data,
 *  metadata and the consultation flow.
 *
 *  Fields marked `null` or containing the text `[TO BE PROVIDED]` are
 *  DELIBERATE PLACEHOLDERS. No credential, qualification, enrolment number,
 *  membership or statistic has been invented. Every page is designed to look
 *  complete whether or not these values are filled in — unfilled optional
 *  fields are simply omitted from the rendered site rather than showing gaps.
 *
 *  ⚖️  All professional, legal and compliance wording in this file should be
 *      reviewed and approved by the advocate before the site is published.
 * ============================================================================
 */

/** A value that has not been supplied yet. Renders as nothing on the site. */
export type Pending = null;

export interface Credential {
  label: string;
  detail: string;
  /** Optional secondary line, e.g. year or institution. */
  meta?: string;
}

export const site = {
  // --------------------------------------------------------------------------
  // 1. IDENTITY
  // --------------------------------------------------------------------------
  /** Full name as it should appear across the site. */
  name: 'Saurabh Harjani',
  /** Short name used in tight spaces (mobile header, breadcrumbs). */
  shortName: 'S. Harjani',
  /** Practice name, taken from the logo lockup. */
  practiceName: 'Saurabh Harjani — Legal & Business Advisory',
  /** The descriptor beneath the wordmark. Keep this short. */
  tagline: 'Legal & Business Advisory',
  /**
   * Professional title. In India, "Advocate" is the correct designation for
   * a practitioner enrolled with a State Bar Council. Confirm before publishing.
   */
  title: 'Advocate',
  /** One-line positioning statement. Used in the hero and metadata. */
  positioning: 'Considered counsel in intellectual property, property and civil matters.',

  // --------------------------------------------------------------------------
  // 2. CONTACT
  //    Leave a field as `null` and it will be hidden everywhere automatically.
  // --------------------------------------------------------------------------
  contact: {
    /** e.g. 'contact@saurabhharjani.com' */
    email: null as string | null,
    /** Display form, e.g. '+91 98XXX XXXXX' */
    phone: null as string | null,
    /** Digits only with country code, e.g. '9198XXXXXXXX'. Used for wa.me links. */
    whatsapp: null as string | null,
    /** Set to false if the advocate prefers not to advertise a WhatsApp channel. */
    whatsappEnabled: false,
    address: {
      line1: null as string | null,
      line2: null as string | null,
      city: null as string | null,
      state: null as string | null,
      postalCode: null as string | null,
      country: 'India',
      /** Google Maps URL for the chambers. */
      mapUrl: null as string | null,
    },
    /** Free-text note shown near the contact details, e.g. consulting hours. */
    availabilityNote: 'Consultations are arranged by appointment.',
  },

  // --------------------------------------------------------------------------
  // 3. BAR ENROLMENT & PROFESSIONAL STANDING
  //    Do not fill these in with approximations. Use the exact record.
  // --------------------------------------------------------------------------
  bar: {
    /** e.g. 'Bar Council of Maharashtra & Goa' */
    council: null as string | null,
    /** e.g. 'MAH/XXXX/20XX' */
    enrolmentNumber: null as string | null,
    /** e.g. '2015' */
    enrolmentYear: null as string | null,
  },

  // --------------------------------------------------------------------------
  // 4. ASSETS
  // --------------------------------------------------------------------------
  assets: {
    /**
     * The supplied logo artwork, kept in /public/brand/.
     * The header and footer render a live typographic version of this lockup
     * (see src/components/Logo.astro) so the mark stays crisp at every size and
     * adapts to light and dark surfaces. Replace the file below with an SVG
     * export when one is available and update `logoImageIsVector`.
     */
    logo: '/brand/logo-saurabh-harjani.jpeg',
    logoImageIsVector: false,
    /**
     * Professional portrait. Drop a file at public/profile/portrait.jpg and set
     * this to '/profile/portrait.jpg'. While null, the profile page renders an
     * intentional typographic panel instead — no placeholder person, no
     * AI-generated likeness.
     */
    portrait: null as string | null,
    portraitAlt: 'Portrait of Saurabh Harjani, Advocate.',
    /** Social sharing image. Replace with a 1200×630 export when available. */
    ogImage: '/brand/og-image.jpg',
  },

  // --------------------------------------------------------------------------
  // 5. SOCIAL / PROFESSIONAL LINKS
  //    Any entry left null is omitted from the footer.
  // --------------------------------------------------------------------------
  social: {
    linkedin: null as string | null,
    x: null as string | null,
    instagram: null as string | null,
  },

  // --------------------------------------------------------------------------
  // 6. PROFILE CONTENT
  // --------------------------------------------------------------------------
  profile: {
    /** Two or three sentences. Appears on the home page profile section. */
    summary:
      'Saurabh Harjani is an independent advocate advising individuals and businesses on intellectual property, property and civil matters. The practice is built around direct access — the person who assesses a matter is the person who advises on it.',

    /**
     * The longer biography for the Profile page. Written as paragraphs.
     * ⚖️ Replace with the advocate’s own account of the practice before launch.
     */
    biography: [
      'The practice was established to give individuals and owner-managed businesses the kind of attention that is often reserved for larger institutional clients. Matters are handled personally, from the first assessment through to resolution.',
      'Work spans two connected strands. The first is intellectual property, with a focus on trade marks — clearance, filing, responses to objections, opposition proceedings and the ongoing protection of a brand once it is registered. The second is property and civil work, where the questions are usually about title, documentation, obligations under an agreement, and what a person can realistically expect from a dispute.',
      'The common thread is preparation. Most matters are decided long before they are argued, on the strength of documents, timelines and the accuracy of the record. That is where the majority of the effort goes.',
    ],

    /** Practice philosophy — shown on the Profile page. */
    philosophy: [
      {
        heading: 'Plain assessment before advice',
        body: 'A matter is worth pursuing only when the likely outcome justifies the cost and the time. That view is given at the outset, including when the answer is that no legal step is warranted.',
      },
      {
        heading: 'The record decides the matter',
        body: 'Documents, dates and correspondence carry more weight than argument. Establishing them accurately is the first task in every engagement.',
      },
      {
        heading: 'One point of contact',
        body: 'Instructions are taken, advised on and acted upon by the same person. Nothing is passed down a chain.',
      },
      {
        heading: 'Proportionate steps',
        body: 'Litigation is one option among several. Where a notice, a negotiation or a corrected document resolves the issue, that route is put forward first.',
      },
    ],

    /**
     * EXPERIENCE — each entry is optional and the section hides when empty.
     * ⚖️ Add real roles only. Do not approximate dates.
     */
    experience: [] as Credential[],
    /*  Example shape — uncomment and complete:
    experience: [
      { label: '[Role]', detail: '[Organisation]', meta: '[Years]' },
    ],
    */

    /** EDUCATION — e.g. { label: 'LL.B.', detail: '[University]', meta: '[Year]' } */
    education: [] as Credential[],

    /** QUALIFICATIONS & CERTIFICATIONS — e.g. Trade Marks Agent registration. */
    qualifications: [] as Credential[],

    /** PROFESSIONAL MEMBERSHIPS — bar associations, IP associations, etc. */
    memberships: [] as Credential[],

    /** COURTS & FORUMS OF PRACTICE — e.g. 'Bombay High Court'. */
    jurisdictions: [] as string[],

    /** Languages the practice can work in. */
    languages: [] as string[],
  },

  // --------------------------------------------------------------------------
  // 7. CONSULTATION HANDLING
  //    See src/services/consultation.ts for how these are used.
  // --------------------------------------------------------------------------
  consultation: {
    /**
     * Optional POST endpoint for inquiries (Formspree, a Cloudflare Worker, an
     * API route on a future server, etc). Set PUBLIC_CONSULTATION_ENDPOINT in
     * the environment to enable real submission. While it is empty the form
     * falls back to composing a pre-filled email — and it never claims that a
     * message was sent when it was not.
     */
    endpoint: import.meta.env.PUBLIC_CONSULTATION_ENDPOINT ?? '',
    /** Response expectation. Keep this conservative and truthful. */
    responseNote: 'Inquiries are reviewed personally. A reply usually follows within two working days.',
    /** Options offered in the "preferred consultation time" field. */
    preferredTimes: ['Morning (10:00–13:00)', 'Afternoon (14:00–17:00)', 'Evening (17:00–19:00)', 'No preference'],
    /** Enables the attachment field. Off by default — static hosting cannot receive files. */
    attachmentsEnabled: false,
  },

  // --------------------------------------------------------------------------
  // 8. ANALYTICS
  //    Nothing is loaded unless a provider is configured here. No cookie banner
  //    is shown because no cookies are set by default.
  // --------------------------------------------------------------------------
  analytics: {
    /** 'none' | 'plausible' | 'umami' */
    provider: 'none' as 'none' | 'plausible' | 'umami',
    /** Domain registered with the analytics provider. */
    domain: null as string | null,
    /** Self-hosted script URL, if applicable. */
    scriptUrl: null as string | null,
    /** Website ID, for providers that require one (Umami). */
    websiteId: null as string | null,
  },

  // --------------------------------------------------------------------------
  // 9. COMPLIANCE
  //    Bar Council of India rules restrict advocate advertising and
  //    solicitation. This site carries no testimonials, rankings, client names,
  //    success rates, fee offers or comparative claims by design.
  // --------------------------------------------------------------------------
  compliance: {
    /**
     * Set to true to require visitors to acknowledge a disclaimer before
     * entering the site. Off by default; enable only if advised to do so.
     * ⚖️ The advocate should decide this, not the developer.
     */
    entryDisclaimerEnabled: false,
    entryDisclaimer: {
      heading: 'Before you continue',
      body: [
        'The Bar Council of India does not permit advocates to solicit work or advertise. By continuing, you confirm that you are seeking information about Saurabh Harjani of your own accord and that there has been no advertisement, personal communication, solicitation, invitation or inducement of any kind.',
        'The information on this website is provided for general understanding only. It is not legal advice, and reading it does not create an advocate-client relationship.',
      ],
      acceptLabel: 'I agree and wish to continue',
      declineLabel: 'Leave this site',
    },
    /** Short disclaimer shown at the foot of substantive pages. */
    pageDisclaimer:
      'The material on this page is general information about areas of practice. It is not legal advice and should not be relied upon in place of advice on your own facts.',
    /** Shown on and around the consultation form. Wording is deliberately plain. */
    formNotice:
      'Please do not send confidential or time-sensitive information through this form. Submitting an inquiry does not by itself create an advocate-client relationship, and it does not mean the matter has been accepted.',
    /** Footer line. */
    footerDisclaimer:
      'This website is intended to provide information only. It is not an advertisement or solicitation of work.',
  },

  // --------------------------------------------------------------------------
  // 10. METADATA DEFAULTS
  // --------------------------------------------------------------------------
  meta: {
    defaultTitle: 'Saurabh Harjani — Advocate | Trade Marks, Property & Civil Matters',
    titleTemplate: '%s — Saurabh Harjani',
    defaultDescription:
      'Independent advocate advising on trade marks and intellectual property, property and real estate matters, and civil disputes. Consultations by appointment.',
    locale: 'en_IN',
    /** Handle without the @, or null. */
    twitterHandle: null as string | null,
  },

  /** Year the practice site went live — used for the copyright line. */
  foundingYear: 2026,
} as const;

export type Site = typeof site;

/** True when at least one contact channel has been configured. */
export const hasContactDetails =
  Boolean(site.contact.email) || Boolean(site.contact.phone) || Boolean(site.contact.address.line1);

/** Address formatted for display, skipping any missing parts. */
export function formattedAddress(): string[] {
  const a = site.contact.address;
  const cityLine = [a.city, a.state, a.postalCode].filter(Boolean).join(', ');
  return [a.line1, a.line2, cityLine || null, a.country].filter((v): v is string => Boolean(v));
}
