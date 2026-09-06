# Working agreement for this repository

A website for an independent advocate practising in India. Astro + TypeScript +
Tailwind v4, deployed as static files to GitHub Pages.

Read [TESTING.md](../TESTING.md) before changing anything under `test/`.

---

## The rule: tests move with the code

**Every change ships with the test change it merits, in the same commit.** Not a
follow-up, not a TODO. A change that leaves the suite unchanged should be a
deliberate decision, not an oversight.

This is not about coverage percentages. It is about the suite continuing to
describe what the site actually does, so that a green run means something.

### Which tier a change belongs in

| If you change… | Add or update |
| --- | --- |
| A function in `src/lib/` or `src/services/` | `test/unit/` — the pure-logic tiers hold 90% line coverage, so an untested branch fails CI |
| `src/config/site.ts` structure, or an invariant about it | `test/unit/config.test.ts` |
| `src/config/faq.ts`, `process.ts`, or a content collection schema | `test/unit/content.test.ts` — cross-references, uniqueness, required fields |
| A new page or route | `expectedRoutes` in `test/support/dist.ts` **and** `routes` in `test/e2e/routes.ts` (with a `template` name). Metadata, link, a11y and compliance suites then cover it automatically |
| A new layout no other page uses | Give it a distinct `template` in `test/e2e/routes.ts` so the viewport sweep picks it up |
| Rendered markup, headings, metadata, structured data | `test/build/` |
| Anything a visitor clicks, types or navigates | `test/e2e/` |
| Copy that touches advertising claims or disclaimers | `test/support/compliance.ts` and `test/build/compliance.test.ts` |
| A new practice area or insight article | Nothing — `test/unit/content.test.ts` discovers content from disk |
| Colours, type scale, spacing | Usually nothing, but run `npm run test:e2e` — the axe and responsive suites catch contrast and layout regressions |

### When a change genuinely needs no test

Say so explicitly in the commit message. Legitimate cases: prose edits inside an
existing article, dependency bumps, comments, formatting.

### Fixing a bug

Write the failing test first, in the **cheapest tier that can catch it**, then
fix. A bug that reached `main` means a tier was missing a case — add it there
rather than only at the browser level.

---

## Before pushing

```bash
npm run verify      # types, unit, build, build-output assertions (~2 min)
npm run test:e2e    # when you have touched UI, navigation or the form
```

The pre-push hook runs `verify` once `npm run hooks:install` has been run.

---

## Conventions that are easy to get wrong

- **Never write a bare internal link.** Every internal href goes through `url()`
  in `src/lib/url.ts`, because the site is served from `/<repo>/` on GitHub
  Pages. `test/build/links.test.ts` fails the build if one slips through.
- **Astro scoped styles do not reach a child component's root element.** A class
  placed on `<Reveal class="…">` needs `:global(…)` in the parent's style block.
- **Scoped component styles outrank Tailwind utilities.** A component rule
  setting `display` beats `lg:hidden`; put responsive show/hide in the component
  CSS, not in a utility class.
- **Never invent a fact about the advocate.** Unsupplied details are `null` in
  `src/config/site.ts` and are omitted from the page and the structured data.
  `test/unit/config.test.ts` and `test/build/seo.test.ts` enforce this.
- **The consultation form must never claim delivery it cannot prove.** Only a 2xx
  from a configured endpoint may produce a confirmation.
- **Compliance patterns are whole phrases, not keywords.** `/guarantee/` alone
  matches the honest sentence "a search will not guarantee registration".
- **Mark compliance and legal copy with `⚖️`** so the advocate's review list
  stays findable.

## Node and pinned versions

Node 20.19+ or 22. Three dependencies are pinned deliberately — see
[Pinned dependencies](../README.md#pinned-dependencies) in the README before
loosening any of them.
