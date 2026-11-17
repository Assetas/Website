# Phase 3 sign-off: replica review (2026-11-17)

The static rebuild at https://assetas.github.io/Website/ was checked against the live Wix site (www.assetas.com) page by page.

## Result

**All 26 pages are replicated and pass the checks below.** Three items remain open; see the end of this report.

## What was checked

| Check | How | Result |
|---|---|---|
| Visual match | `npm run compare -- <slug> desktop\|mobile` for all 26 pages, at 1440 px and 390 px. The review gallery is `reference/compare/index.html` (local only, not committed). | Same sections, order, text and images on every page. Spacing differs slightly, which is the intended "close enough" level. |
| Text and meta | Titles and descriptions compared against the capture. Legal pages compared by word count. | Titles and descriptions match the live site exactly, including known live-site bugs that are kept for now. /terms has 6,189 words against 6,187 live; /privacy matches. |
| Internal links | `npm run check`: every page, every internal href and src | 176 URLs, no broken links, no missing files |
| Phone layout | `npm run check` at 390 px | No sideways scrolling on any page |
| External links | `node tools/audit.mjs` | 9 of 11 return 200, including the Trek release downloads. 2 links inside /privacy fail an automated check: the NAI opt-out site blocks bots (403), and the app's GDPR data-request link returns 404 when signed out. Both are the same on the live site. |
| Structure | `node tools/audit.mjs` | Every page has exactly one `<h1>`, no skipped heading levels, and alt text on every image. The exception is `/inquiry-services-page`, which has no heading on the live site either. |
| Contact form | Local test with the request intercepted, then one real test submission from the preview | Fields post correctly. FormSubmit has sent its activation email to sales@assetas.com; see the open items. |
| Lighthouse | Lighthouse 13.6 in headless Edge, 6 pages × mobile and desktop, plus the live site for comparison | Scores below |

## Lighthouse: preview vs live

| Page (mobile) | Performance | Accessibility | Best practices | Page weight | Largest paint |
|---|---|---|---|---|---|
| **Preview** Home | 99 | 96 | 96 | 0.25 MB | 1.8 s |
| **Preview** Platform | 96 | 96 | 96 | — | 2.6 s |
| **Preview** Pricing, Contact, Emissions, Trek | 99 | 96 | 92–96 | — | 1.7 s |
| **Live** Home | 84 | 94 | 100 | 16.4 MB | 2.5 s |
| **Live** Platform | 61 | 90 | 100 | 16.3 MB | 9.2 s |

On desktop, every preview page scores 98–100 for performance.

SEO scores on the preview are 58–66 because it's deliberately set to `noindex`. They'll rise when the production build turns that off at cutover.

### What Lighthouse flags on the preview

- **Color contrast:** the brand orange `#cc7722` is too light for the small orange labels on white, and for white text on the orange "Book a demo" buttons. The live site has the same issue. → Phase 4 design decision: a darker orange for text, or bolder or larger type.
- **"Learn more" links:** several links share the same vague text. → Phase 4: make link text say where it goes.
- **Blocked from indexing:** intentional on the preview.
- **Missing favicon:** fixed during this review. The live site's favicon is now in `src/static/favicon.ico`.

## Open items

1. **Contact form activation.** Someone with the sales@assetas.com inbox needs to click FormSubmit's "Activate Form" email. Then send one more test to confirm delivery.
2. **Preview analytics.** `site.gaId` is empty, so the preview has no GA4. Create a separate GA4 property for the preview if you want visitor data before cutover.
3. ~~**Tag the replica.**~~ Done: `v1-replica` was tagged and pushed on 2026-11-17.

## Phase 4 backlog collected during the rebuild

Live-site issues kept in the replica so it matches the live site, to fix during cleanup. The details are in PLAN.md, Phase 2.

- **Titles and descriptions:**
  - ~~`/platform/about` reuses the Emissions page's title and description.~~ Fixed in Phase 4 step 2: the page moved to `/about` with its own title and description.
  - ~~The Home title is 90 characters and `/telemetry`'s is 70.~~ Shortened in Phase 4 step 3.
  - ~~`/platform`'s description has a typo, "complaince".~~ Fixed in Phase 4 step 3.
  - ~~`/trek-app-downloads` has no description.~~ Added in Phase 4 step 3.
- **Links that go to the wrong place or nowhere:**
  - ~~"Get Trek" (`/trek`) and "See it on your assets" (`/workflows`) go to `/oilandgas#operational-excellence`, which doesn't exist.~~ Fixed in Phase 4 step 2.
  - ~~"See how it works" (`/ai`) goes to `/spcc`.~~ Fixed in Phase 4 step 2.
  - Buttons with no target on the live site now point to /contact or the case study PDF: "Download brief" (`/defense`), "Read the full story" (`/oilandgas`), and "Talk to our engineer" (`/telemetry`, `/reporting`, `/ai`).
- **Numbers to confirm:** the Air Force stats on `/defense` are swapped on the live site.
- ~~**Copy:** "the same record.." (`/compliance`), "Stale documentation turn…" and "…SPCC Plans standardized calcs…" (`/spcc`).~~ Fixed in Phase 4 step 3.
- **Content:**
  - The Pricing FAQ is empty.
  - `/privacy` is dated 2017 and needs legal review.
  - ~~`/inquiry-services-page` is an empty booking page; remove it and redirect.~~ Done in Phase 4 step 2: it forwards to `/contact`.
- **Design:** the color-contrast fix above, descriptive link text, and the full Phase 4 design-system work.
