# Saurabh Harjani — Legal & Business Advisory

The website for an independent advocate practising in intellectual property and
trade marks, real estate and property, and civil matters.

Built with **Astro**, **TypeScript** and **Tailwind CSS v4**. It ships as static
files with almost no client-side JavaScript, and deploys to GitHub Pages.

---

## Contents

1. [Requirements](#requirements)
2. [Development](#development)
3. [Testing](#testing)
4. [Content configuration — what to edit](#content-configuration--what-to-edit)
5. [Adding an Insight article](#adding-an-insight-article)
6. [Adding a practice area](#adding-a-practice-area)
7. [Consultation inquiries and the future backend](#consultation-inquiries-and-the-future-backend)
8. [Analytics](#analytics)
9. [Production build](#production-build)
10. [GitHub Pages deployment](#github-pages-deployment)
11. [Custom domain](#custom-domain)
12. [Before launch — outstanding items](#before-launch--outstanding-items)
13. [Project structure](#project-structure)

---

## Requirements

- **Node.js 20.19+ or 22 LTS** (22 is recommended; CI uses it)
- npm 10+

```bash
node -v   # should print v20.19.x or v22.x
```

---

## Development

```bash
npm install
npm run dev       # http://localhost:4321/SaurabhHarjani_PortfolioWebsite
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reloading |
| `npm run check` | TypeScript and Astro diagnostics |
| `npm run build` | Type-check, then produce the static site in `dist/` |
| `npm run build:fast` | Build without the type-check |
| `npm run preview` | Serve `dist/` exactly as it will be deployed |
| `npm run verify` | **Run before every pull request** — types, unit tests, build, build-output assertions |
| `npm run test:unit` | Unit and content-contract tests |
| `npm run test:build` | Assertions against the built `dist/` |
| `npm run test:e2e` | Browser, accessibility and responsive tests |
| `npm run hooks:install` | Enable the pre-push hook that runs `verify` |

Testing is documented in full in **[TESTING.md](TESTING.md)** — what each tier
covers, how CI is wired, and how to make the checks required before a merge.

> The dev URL includes the repository name because the site is configured for a
> GitHub Pages *project* site. See [Custom domain](#custom-domain) to change it.

---

## Testing

```bash
npm run hooks:install    # once per clone — runs `verify` automatically on push
npm run verify           # before every pull request (~1 minute)
npm run test:e2e:install # once — downloads Chromium
npm run test:e2e         # browser, accessibility and responsive tests
```

Three tiers: pure-logic and content-contract unit tests, assertions against the
built HTML (links, metadata, structured data, advertising-compliance copy), and
a browser suite covering interaction, accessibility and progressive
enhancement. All three run on every pull request and again before anything is
deployed.

**[TESTING.md](TESTING.md)** documents what each tier covers, how to add tests,
and how to make the checks required before a merge.

---

## Content configuration — what to edit

Almost everything about the practice lives in **one file**.

### `src/config/site.ts`

| What you want to change | Field |
| --- | --- |
| Lawyer's name | `name`, `shortName` |
| Practice name / descriptor | `practiceName`, `tagline` |
| Professional title | `title` |
| Positioning line (hero, metadata) | `positioning` |
| Email | `contact.email` |
| Phone | `contact.phone` |
| WhatsApp | `contact.whatsapp`, `contact.whatsappEnabled` |
| Office address & map link | `contact.address` |
| Availability note | `contact.availabilityNote` |
| Bar council, enrolment number, year | `bar.*` |
| Logo file | `assets.logo` |
| Portrait photograph | `assets.portrait` |
| Social sharing image | `assets.ogImage` |
| LinkedIn / X / Instagram | `social.*` |
| Short profile summary (home page) | `profile.summary` |
| Full biography (profile page) | `profile.biography` |
| Practice philosophy | `profile.philosophy` |
| Experience | `profile.experience` |
| Education | `profile.education` |
| Qualifications | `profile.qualifications` |
| Professional memberships | `profile.memberships` |
| Courts and forums | `profile.jurisdictions` |
| Languages | `profile.languages` |
| Consultation endpoint & response note | `consultation.*` |
| Analytics | `analytics.*` |
| Entry disclaimer, form notice, footer disclaimer | `compliance.*` |
| Page titles and default meta description | `meta.*` |

**Empty fields are safe.** Anything set to `null` or left as an empty array is
omitted from the site — no gaps, no placeholder text, and nothing invented in
the structured data. The profile page, footer and contact page each have a
designed state for "not yet supplied".

### Other configuration files

| File | Contains |
| --- | --- |
| `src/config/navigation.ts` | Header, drawer and footer navigation; the primary CTA |
| `src/config/faq.ts` | Every FAQ question and answer, tagged by page |
| `src/config/process.ts` | The Understand → Assess → Advise → Act sequence |
| `src/content/practice-areas/*.md` | Each practice area, in full |
| `src/content/insights/*.mdx` | Articles |

### Where the logo goes

The supplied artwork is at **`public/brand/logo-saurabh-harjani.jpeg`**.

The header, footer and portrait placeholder do **not** use that JPEG. They
render the lockup in live type (`src/components/Logo.astro`) so it stays sharp
at every size, inverts cleanly on dark surfaces, and costs no network request.
The palette in the design system is sampled from the artwork.

If a vector export is produced later, drop the `.svg` into `public/brand/`,
replace the markup inside `Logo.astro`, and set `assets.logoImageIsVector: true`.

The favicon is a hand-built SVG at `public/favicon.svg` using the same monogram
and bronze rule. To add an iOS home-screen icon, drop a 180 × 180
`apple-touch-icon.png` into `public/` and add this line to the `<head>` in
`src/layouts/BaseLayout.astro`:

```astro
<link rel="apple-touch-icon" href={url('/apple-touch-icon.png')} />
```

### Where the photograph goes

Save it as **`public/profile/portrait.jpg`** (4:5 crop, around 1200 × 1500 px),
then set in `src/config/site.ts`:

```ts
portrait: '/profile/portrait.jpg',
```

Until then the profile page shows an intentional typographic panel. No stock
photograph or AI-generated likeness is used anywhere on the site.

### Where the social sharing image goes

`public/brand/og-image.jpg` is currently a copy of the logo artwork. Replace it
with a **1200 × 630** export for better results on LinkedIn and WhatsApp.

---

## Adding an Insight article

1. Create a file in `src/content/insights/`, e.g. `renewing-a-trade-mark.mdx`.
   The filename becomes the URL: `/insights/renewing-a-trade-mark`.

2. Start it with frontmatter:

```mdx
---
title: 'Renewing a trade mark'
description: 'One sentence. Used as the meta description and the list summary.'
category: 'Trade Marks'          # Trade Marks | Intellectual Property | Property | Civil Law | Legal Updates
publishDate: 2026-04-02
updatedDate: 2026-05-10          # optional
relatedPracticeArea: 'intellectual-property-trademarks'   # optional
sample: false                    # true adds a visible "Sample" banner
draft: false                     # true hides it from the built site
---

Write the article here in Markdown. Use `##` for section headings — with three
or more, a contents list appears alongside the article automatically.
```

Reading time, the date, the category, the disclaimer, the `Article` structured
data and the related-practice-area link are all handled for you.

**The three articles currently in the folder are marked `sample: true`.** Delete
them once real articles exist.

---

## Adding a practice area

Create a file in `src/content/practice-areas/`. The filename becomes the URL
(`/practice-areas/<filename>`). Copy an existing file for the frontmatter shape;
`src/content.config.ts` documents every field.

A new file automatically appears in the home page list, the practice areas
index, the footer, the "other areas" navigation, the profile page and the
consultation form's subject list. No code changes are needed.

To attach FAQs to it, add entries to `src/config/faq.ts` with the same `faqKey`.

---

## Consultation inquiries and the future backend

The form is deliberately separated from the way inquiries are delivered. All of
that logic sits in **`src/services/consultation.ts`**, behind one function:

```ts
submitConsultation(inquiry, transport): Promise<SubmissionResult>
```

Three modes, chosen automatically:

| Mode | When | What happens |
| --- | --- | --- |
| **Endpoint** | `PUBLIC_CONSULTATION_ENDPOINT` is set | JSON `POST` to that URL. Success is reported **only** on a 2xx response. |
| **Email** | No endpoint, but `contact.email` is set | The details are composed into a pre-filled email in the visitor's own mail client. The UI states clearly that nothing has been sent yet. |
| **Unavailable** | Neither is set | The form explains that online submission is not available and points to the other contact routes. |

**The form never reports success for a message that was not actually sent.**

### Connecting a real backend later

1. Point `PUBLIC_CONSULTATION_ENDPOINT` at any HTTPS URL that accepts a JSON
   `POST` — a form service, a serverless function, or a full API.
2. Nothing else changes. The payload shape is documented in
   `submitConsultation()`; the UI, validation and result states stay as they are.

For local development, copy `.env.example` to `.env`. For the deployed site, add
a repository **variable** named `PUBLIC_CONSULTATION_ENDPOINT` (Settings →
Secrets and variables → Actions → Variables) — the workflow already passes it
through.

Document uploads are switched off (`consultation.attachmentsEnabled: false`)
because static hosting cannot receive files. Turn it on once an endpoint that
accepts multipart uploads exists.

---

## Analytics

Nothing is loaded by default. No third-party script runs, no cookies are set,
and there is no cookie banner — because there is nothing to consent to.

To enable a cookieless provider, set `analytics` in `src/config/site.ts`:

```ts
analytics: {
  provider: 'plausible',
  domain: 'saurabhharjani.com',
  scriptUrl: null,      // only for self-hosted installs
  websiteId: null,      // Umami only
},
```

If a provider that sets cookies is introduced, the privacy policy must be
updated and a consent mechanism added with it.

---

## Production build

```bash
npm run build     # type-checks, then writes dist/
npm run preview   # serve dist/ exactly as deployed
```

`dist/` is a complete static site and can be hosted anywhere.

---

## GitHub Pages deployment

A workflow is included at `.github/workflows/deploy.yml`. It builds on every
push to `main` and publishes with the official Pages actions.

**One-time setup:**

1. Push this branch and merge it into `main`.
2. Go to **Settings → Pages**.
3. Under **Source**, choose **GitHub Actions**.

That is all. The workflow uses `actions/configure-pages` to resolve the correct
origin and base path, so it is correct for a project site, a user site and a
custom domain without editing anything.

### Configuring the base path manually

`astro.config.mjs` reads two environment variables, both with defaults:

| Deployment | `SITE` | `BASE_PATH` |
| --- | --- | --- |
| Project site (`username.github.io/repo`) | `https://username.github.io` | `/repo` |
| User site (`username.github.io`) | `https://username.github.io` | `/` |
| Custom domain | `https://example.com` | `/` |

The defaults in the file assume a project site named
`SaurabhHarjani_PortfolioWebsite` under the user `saurabhharjani`. **Change those
two defaults to the real account and repository**, or set the variables in
`.env`.

Every internal link goes through the `url()` helper in `src/lib/url.ts`, so no
asset or link breaks when the base path changes.

`public/.nojekyll` is present so GitHub Pages serves Astro's `_astro/` directory
rather than stripping it.

---

## Custom domain

1. Add a `CNAME` file to `public/` containing only the domain:

   ```
   saurabhharjani.com
   ```

2. At the DNS provider, create either:
   - an `ALIAS`/`ANAME` record for the apex domain pointing at
     `username.github.io`, or four `A` records to GitHub's Pages IPs; and
   - a `CNAME` record for `www` pointing at `username.github.io`.

3. In **Settings → Pages**, enter the domain and tick **Enforce HTTPS** once the
   certificate has been issued.

4. Update the defaults in `astro.config.mjs`:

   ```js
   const SITE = process.env.SITE ?? 'https://saurabhharjani.com';
   const BASE_PATH = process.env.BASE_PATH ?? '/';
   ```

Canonical URLs, Open Graph tags, the sitemap and `robots.txt` all follow
automatically.

---

## Before launch — outstanding items

Nothing on this site invents a credential, a statistic, a testimonial or a
client. The following must be supplied and reviewed before it goes live.

**Information needed**

- [ ] Email address, telephone number and chambers address
- [ ] Bar Council of enrolment, enrolment number and year
- [ ] Education, qualifications and any professional memberships
- [ ] Courts and forums before which the practice appears
- [ ] Languages the practice works in
- [ ] Professional photograph
- [ ] LinkedIn or other professional profile URLs, if any
- [ ] Confirmation that every service category listed on the practice area pages
      is actually offered
- [ ] The real GitHub account and repository names, or the custom domain

**Review needed by the advocate**

- [ ] `src/pages/legal-disclaimer.astro` — full text
- [ ] `src/pages/privacy-policy.astro` — full text
- [ ] `src/config/site.ts` → `compliance.*` — form notice, footer disclaimer and
      the optional entry disclaimer
- [ ] Whether the entry disclaimer should be switched on
      (`compliance.entryDisclaimerEnabled`)
- [ ] `src/config/faq.ts` — all answers
- [ ] The biography and philosophy text in `profile`
- [ ] Practice area descriptions in `src/content/practice-areas/`

Every one of these is marked in the source with a `⚖️` comment.

---

## Project structure

```
public/
  brand/              logo artwork and the social sharing image
  profile/            portrait photograph goes here
  favicon.svg
  .nojekyll           required for GitHub Pages

src/
  components/         Header, Footer, Logo, Hero, forms, cards, icons
  config/             site.ts, navigation.ts, faq.ts, process.ts
  content/
    practice-areas/   one Markdown file per area
    insights/         one MDX file per article
  layouts/            BaseLayout.astro
  lib/                base-path-aware URL helpers, date and reading-time
  pages/              routes
  services/           consultation.ts, analytics.ts
  styles/             global.css — the whole design system
  content.config.ts   collection schemas
```

### Routes

| Path | Page |
| --- | --- |
| `/` | Home |
| `/profile` | Profile |
| `/practice-areas` | Practice areas index |
| `/practice-areas/intellectual-property-trademarks` | IP & trade marks |
| `/practice-areas/real-estate-property` | Real estate & property |
| `/practice-areas/civil-matters` | Civil matters & disputes |
| `/insights` | Insights index |
| `/insights/<slug>` | Article |
| `/contact` | Consultation request |
| `/faq` | Frequently asked questions |
| `/legal-disclaimer` | Legal disclaimer |
| `/privacy-policy` | Privacy policy |
| `/404` | Not found |
| `/sitemap-index.xml`, `/robots.txt` | Generated at build time |
