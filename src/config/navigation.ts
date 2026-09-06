/**
 * Site navigation. Adding an entry here adds it to the desktop header, the
 * mobile drawer and the footer — there is no second list to keep in sync.
 */

export interface NavItem {
  label: string;
  href: string;
  /** Marks the item active for any URL beneath it. */
  matchPrefix?: boolean;
}

export const primaryNav: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Profile', href: '/profile' },
  { label: 'Practice Areas', href: '/practice-areas', matchPrefix: true },
  { label: 'Insights', href: '/insights', matchPrefix: true },
  { label: 'Contact', href: '/contact' },
];

export const primaryCta = {
  label: 'Request a Consultation',
  shortLabel: 'Consultation',
  href: '/contact',
};

export const utilityNav: NavItem[] = [
  { label: 'Frequently Asked Questions', href: '/faq' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Legal Disclaimer', href: '/legal-disclaimer' },
];
