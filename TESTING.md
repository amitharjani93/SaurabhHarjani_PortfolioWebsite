# Testing

How this site is tested, why it is tested that way, and what to do before
raising a pull request.

---

## The short version

```bash
npm run verify        # required before every PR — about a minute
npm run test:e2e      # browser suite — run it when you touch UI or navigation
```

Enable the pre-push hook once per clone so `verify` runs automatically:

```bash
npm run hooks:install
```

---

## Strategy

### A note on the original plan

The starting request was "unit tests before a PR, system and regression tests
on `main` after merging". The first half is right. The second half is worth
changing, for one reason: **a regression suite that only runs after merging
tells you `main` is already broken.** By then the change is in the shared
history, the author has moved on, and someone has to revert or hot-fix under
pressure.

This site builds in under a minute and the whole suite finishes in about three.
There is no cost argument for holding tests back. So:

| Original | What is set up instead |
| --- | --- |
| Unit tests before a PR | ✅ kept, and enforced by a pre-push hook and a required check |
| System tests after merge to `main` | Moved **before** the merge — the full suite runs on every PR |
| — | `main` still re-runs everything before deploying, as a safety net |
| — | The deployed URL is smoke-tested after it goes live |
| — | A nightly run catches failures nobody caused |

The post-merge run is kept, but it is no longer the first time the regression
suite sees the change. It exists to catch merge-order problems — two PRs that
each pass alone and fail together — and to gate the deployment itself.

### The three tiers

| Tier | What it covers | Where it runs | Tests | Time |
| --- | --- | --- | --- | --- |
| **1. Static** | Types, pure logic, content contracts | pre-push hook, every PR | 137 | ~20s |
| **2. Build output** | The generated HTML: links, metadata, structured data, compliance copy | pre-push hook, every PR, before every deploy | 294 | ~40s |
| **3. Browser** | Real interaction, accessibility, responsiveness, progressive enhancement | every PR, before every deploy, nightly | 123 | ~3m on CI |

Tiers 1 and 2 together are `npm run verify` (about two minutes including the
build). All three are `npm run verify:full`.

### What is deliberately not tested

- **No snapshot tests of rendered markup.** They break on every design tweak and
  catch almost nothing. The build-output tier asserts specific properties
  instead — that a link resolves, that a heading level does not skip.
- **No component unit tests.** Astro components are templates with no logic worth
  isolating. Their behaviour is covered where it is observable: in the built HTML
  and in the browser.
- **No visual regression baselines.** They are noisy on a site whose design is
  still settling. Worth revisiting once the design is fixed.
- **No linter beyond `astro check`.** Strict TypeScript plus Astro's template
  diagnostics cover what ESLint would catch here, without another config to keep
  current.

---

## Tier 1 — static checks

```bash
npm run check          # TypeScript and Astro template diagnostics
npm run test:unit      # Vitest, 137 tests, no browser, no Astro runtime
npm run test:unit:watch
npm run test:coverage  # enforces thresholds on src/lib and src/services
```

Lives in `test/unit/`.

| File | Covers | Why it matters |
| --- | --- | --- |
| `url.test.ts` | `url()`, `absoluteUrl()`, `normalisePath()`, `isActive()` | The GitHub Pages base path is the single most likely production-only failure. Tests read the base from `astro.config.mjs`, so they keep working if the site moves to a custom domain. |
| `consultation.test.ts` | Validation and all three delivery transports | **The most important file here.** A bug could tell someone their inquiry was sent when it was not. Every non-delivering path is asserted never to produce a confirmation. |
| `analytics.test.ts` | Provider resolution | Holds the privacy promise: nothing loads unless deliberately configured. |
| `format.test.ts` | Reading time, date formatting | Timezone-stable dates, sane reading estimates. |
| `content.test.ts` | Cross-references between content and config | Astro's schemas catch a malformed field. These catch a `faqKey` matching nothing, an article pointing at a renamed practice area, two areas claiming the same order. |
| `config.test.ts` | `site.ts`, navigation, process steps | Holds the "missing information is omitted, never invented" design in place. |

Coverage thresholds (90% lines/functions/statements, 85% branches) apply to
`src/lib/` and `src/services/` only — the code where a silent bug is possible.

---

## Tier 2 — build output

```bash
npm run build:fast
npm run test:build
```

Lives in `test/build/`, runs against `dist/`, uses no browser. 294 assertions.

| File | Covers |
| --- | --- |
| `links.test.ts` | Every route builds; every internal link, script, stylesheet and image carries the base path and resolves to a file that exists; every `#anchor` has a target; external links carry `rel="noopener"`; the sitemap and `robots.txt` are correct |
| `seo.test.ts` | Unique titles within display length, unique descriptions, correct canonical per route, complete Open Graph and Twitter tags, exactly one `h1`, no skipped heading levels, valid JSON-LD with no null or invented values |
| `compliance.test.ts` | **The advertising-restriction regression suite** — see below |
| `integrity.test.ts` | No cross-origin scripts, styles, fonts, iframes or remote images; alt text and dimensions on every image; landmarks, skip link and named navigation; the consultation form's labels, error wiring and absence of any pre-rendered confirmation; every page readable without JavaScript |

### The compliance suite

The Bar Council of India restricts advocates from advertising or soliciting
work. The site is designed to comply — no testimonials, rankings, claims or
fee offers — but copy gets edited long after launch by people who are not
thinking about the rules at that moment.

`test/support/compliance.ts` holds a vocabulary of prohibited phrasing:
superlatives, rankings, guarantees of outcome, success rates, case and client
counts, testimonials, star ratings, urgency tactics, fee solicitation and
unsupported experience claims. Every built page's rendered text is checked
against it, along with a second list of generic filler phrasing.

It also asserts positively: that the non-solicitation disclaimer appears on
every page, that the contact page states an inquiry creates no advocate-client
relationship, and that every substantive page carries a "not legal advice" note.

> ⚖️ **This is a developer-side safety net, not legal advice.** It cannot judge
> context and it does not replace review by the advocate. Extend the vocabulary
> in `test/support/compliance.ts` as wording is reviewed.

Patterns are written as **whole affirmative phrases**, not loose keywords —
`/guarantee/` alone would fire on the honest sentence "a search will not
guarantee registration".

---

## Tier 3 — browser tests

```bash
npm run test:e2e:install   # once — downloads Chromium
npm run test:e2e
npm run test:e2e:ui        # interactive runner
npx playwright test --grep @smoke
```

Lives in `test/e2e/`. Runs against the **production build** served by
`astro preview`, not the dev server — so what is tested is what deploys,
including the base path.

Three projects:

| Project | Viewport | Purpose |
| --- | --- | --- |
| `desktop` | 1440 × 900 | Full navigation, hover states, sticky elements, per-route reachability |
| `mobile` | Pixel 7 | Drawer, touch targets, mobile layout |
| `no-js` | Desktop, JavaScript disabled | Progressive enhancement |

The suite runs with a single worker locally, because three browser projects in
parallel saturate a laptop and produce context-startup timeouts that look like
test failures. CI uses two.

| File | Covers |
| --- | --- |
| `navigation.spec.ts` | Desktop nav and active states; the mobile drawer — open, close, Escape, focus return, focus trap, scroll lock, closing on resize; the 404 page |
| `consultation.spec.ts` | Validation messages, `aria-invalid`, focus management, error clearing, the character counter; that no request is ever POSTed when no endpoint is configured; that no path claims delivery |
| `responsive.spec.ts` | No sideways scrolling at 320/375/430/768/1024/1440; the 1024px navigation switch; readable text on a small phone; comfortable line length; touch targets; reduced-motion behaviour |
| `accessibility.spec.ts` | axe-core against WCAG 2.1/2.2 A and AA, plus the open drawer, the form's error state and visible focus rings |
| `no-js.spec.ts` | Every page renders its content, the FAQ still opens (it is built on `<details>`), navigation works, animated sections are visible |
| `content.spec.ts` | FAQ accordion behaviour, article contents list, practice-area cross-links |
| `smoke.spec.ts` | Every route responds, renders an `h1` and logs no console errors; assets load; compliance notices are present; `robots.txt` and the sitemap are served. Tagged `@smoke` so it can also run against a deployed URL |

### Route coverage

`test/e2e/routes.ts` exports two lists. `routes` is every public page; `keyRoutes`
is one page per distinct template. Checks that sweep six viewports use
`keyRoutes`, because the remaining pages reuse those layouts — running all
twelve at six widths costs six times as long and covers nothing new. Per-route
checks that are cheap (reachability, axe on desktop) use the full list.

> Automated accessibility checks catch roughly a third of real barriers. They
> are a floor, not a certificate. Keyboard behaviour is tested explicitly in
> `navigation.spec.ts`; document structure in `test/build/integrity.test.ts`.

### Running against a deployed site

```bash
SMOKE_BASE_URL=https://username.github.io/repo/ npx playwright test --grep @smoke
```

The `webServer` block is skipped when `SMOKE_BASE_URL` is set.

---

## Continuous integration

Three workflows in `.github/workflows/`:

### `ci.yml` — every pull request, every push outside `main`

Two jobs run in parallel:

- **static** — type check, unit and contract tests, uploads coverage
- **regression** — build, build-output assertions, Playwright across all three
  projects, uploads the HTML report and the built site

Because it triggers on `pull_request`, this covers **old and long-lived
branches too**: the suite runs against the merge result the moment a PR is
opened, whatever the branch's age.

### `deploy.yml` — pushes to `main`

Runs the same full suite against the exact artifact that will be published,
deploys only if it passes, then **smoke-tests the live URL** from the outside.

### `regression.yml` — nightly and on demand

Full suite against a fresh build of `main`, a smoke test of the live site (once
the `PRODUCTION_URL` repository variable is set), and `npm audit` at high
severity. Catches breakage nobody caused: dependency advisories, browser
updates, a deployment that has quietly gone stale.

---

## Making the checks required

CI alone does not stop a merge. Configure the repository once:

**Settings → Branches → Add branch ruleset**, targeting `main`:

- Require a pull request before merging
- Require status checks to pass, selecting:
  - `Types, unit and contract tests`
  - `Build, output assertions and browser tests`
- Require branches to be up to date before merging — this is what catches two
  PRs that pass alone and fail together
- Block force pushes

**Settings → Actions → General → Workflow permissions:** read-only is enough.

Optional repository variables (**Settings → Secrets and variables → Actions**):

| Variable | Effect |
| --- | --- |
| `PUBLIC_CONSULTATION_ENDPOINT` | Enables real form submission in built sites |
| `PRODUCTION_URL` | Enables the nightly live smoke test |

---

## Local workflow

```bash
# while working
npm run dev
npm run test:unit:watch

# before opening a PR
npm run verify

# after changing navigation, the form, or layout
npm run test:e2e
```

The pre-push hook (`.githooks/pre-push`) runs `verify` automatically once
`npm run hooks:install` has been run. It deliberately does **not** run the
browser suite — that would make pushing slow enough that people stop pushing.

To bypass in a genuine emergency: `git push --no-verify`. If you find yourself
doing that regularly, the suite is wrong, not you — fix the test.

---

## Adding tests

Tests move with the code: **every change ships with the test change it merits,
in the same commit.** The full mapping of change → tier lives in
[.github/copilot-instructions.md](.github/copilot-instructions.md), which is
also what guides AI assistants working in this repository. In short:

**New pure function in `src/lib` or `src/services`** → add to `test/unit/`.
Coverage thresholds will fail the build if it is untested.

**New page or route** → add it to `expectedRoutes` in `test/support/dist.ts`
and to `routes` in `test/e2e/routes.ts`, with a `template` name. If it uses a
layout no other page uses, give it a new template name so the viewport sweep
picks it up. The metadata, link, accessibility and compliance suites will then
cover it automatically.

**New practice area or article** → nothing to do. `test/unit/content.test.ts`
discovers content from disk and applies the contract checks to it.

**New compliance concern** → add a pattern to `test/support/compliance.ts`.
Write it as a whole affirmative phrase, and add a fixture to
`test/unit/` if the phrasing is subtle.

**A bug reached production** → write the failing test first, in the cheapest
tier that can catch it, then fix it. That is what keeps this suite honest
rather than decorative.

A pull request that changes source without changing tests gets a warning
annotation from the `Tests moved with the code` CI job, and the PR template asks
you to say why. Neither blocks the merge — a hard failure on every prose edit
would only produce throwaway tests.

To see what that job would say before you push:

```bash
sh scripts/check-test-freshness.sh origin/main
```

---

## Diagnostics

`scripts/contrast-report.mjs` prints every axe colour-contrast violation across
the main routes, with the computed ratio, the two colours and the element — far
more useful than a pass/fail when adjusting the palette.

```bash
npm run preview                     # in one terminal
node scripts/contrast-report.mjs    # in another
```

It disables transitions before measuring, because a scan that catches an entry
animation mid-fade reports the blended colour and invents failures.
