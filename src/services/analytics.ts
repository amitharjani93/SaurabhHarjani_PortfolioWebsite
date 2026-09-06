/**
 * Analytics abstraction.
 *
 * Nothing is loaded unless a provider is configured in src/config/site.ts.
 * The two supported providers are cookieless and do not require a consent
 * banner in most jurisdictions — which is why no banner is implemented.
 * If a cookie-setting provider is added later, consent must be added with it.
 */

import { site } from '../config/site';

export interface AnalyticsScript {
  src: string;
  attributes: Record<string, string>;
}

export function getAnalyticsScript(): AnalyticsScript | null {
  const { provider, domain, scriptUrl, websiteId } = site.analytics;

  if (provider === 'plausible' && domain) {
    return {
      src: scriptUrl ?? 'https://plausible.io/js/script.js',
      attributes: { 'data-domain': domain, defer: '' },
    };
  }

  if (provider === 'umami' && websiteId && scriptUrl) {
    return {
      src: scriptUrl,
      attributes: { 'data-website-id': websiteId, defer: '' },
    };
  }

  return null;
}
