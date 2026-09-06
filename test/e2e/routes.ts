/**
 * Routes exercised by the end-to-end suite.
 *
 * `routes` is every public page. `keyRoutes` is one page per distinct template,
 * used by the checks that sweep several viewports — running all twelve at six
 * breakpoints multiplies quickly without testing anything new, because the
 * remaining pages reuse these layouts.
 */

export const routes = [
  { path: '', name: 'home', template: 'home' },
  { path: 'profile', name: 'profile', template: 'profile' },
  { path: 'practice-areas', name: 'practice areas', template: 'area-index' },
  { path: 'practice-areas/intellectual-property-trademarks', name: 'IP & trade marks', template: 'area' },
  { path: 'practice-areas/real-estate-property', name: 'real estate & property', template: 'area' },
  { path: 'practice-areas/civil-matters', name: 'civil matters', template: 'area' },
  { path: 'insights', name: 'insights', template: 'insight-index' },
  { path: 'insights/what-a-legal-notice-is-for', name: 'article', template: 'article' },
  { path: 'contact', name: 'contact', template: 'contact' },
  { path: 'faq', name: 'FAQ', template: 'faq' },
  { path: 'legal-disclaimer', name: 'legal disclaimer', template: 'legal' },
  { path: 'privacy-policy', name: 'privacy policy', template: 'legal' },
] as const;

/** One route per template — enough to cover every layout the site renders. */
export const keyRoutes = routes.filter(
  (route, i) => routes.findIndex((r) => r.template === route.template) === i,
);

export const breakpoints = [
  { width: 320, height: 800, name: 'small phone' },
  { width: 375, height: 812, name: 'phone' },
  { width: 430, height: 932, name: 'large phone' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1024, height: 900, name: 'small laptop' },
  { width: 1440, height: 900, name: 'desktop' },
] as const;
