# Assetas website: Wix → static site on GitHub Pages

The goal is to rebuild www.assetas.com as a static site in this repo (`Assetas/Website`) and host it on GitHub Pages. We start by carrying over all the content and the general layout in simple HTML and CSS. It doesn't have to match pixel for pixel. Then we clean up the content and redesign the layout. Last, and only once we decide to, we move the domain over.

---

## What we're starting from (surveyed 2026-11-17)

| Item | Finding | What it means for us |
|---|---|---|
| Platform | Wix (responsive editor). Each page is about 2.7 MB of Wix runtime and absolutely positioned elements. | Don't "Save As" the Wix HTML. **Rebuild each page as clean HTML/CSS**, using the live site as the visual reference. |
| Pages | 26 in `pages-sitemap.xml`; see the inventory below | Keep **the same URL paths** so links and SEO carry over and no redirects are needed. |
| Repo | `Assetas/Website` is **public**, and the org is on the GitHub **Free** plan | Pages works for free on a public repo. Everything we commit is public, so never commit drafts, internal notes or secrets. |
| DNS | Nameservers are GoDaddy (`domaincontrol.com`). Email is Microsoft 365 (MX → `outlook.com`). | The cutover only changes the `www` CNAME and the apex A records. **Leave MX, SPF, DKIM and other TXT records alone.** |
| Forms | The Wix Form on `/contact` has these fields: first name, last name, email, company, industry, "How can we help?", and "What would you like the demo to cover?" | We need a third-party form backend, because GitHub Pages can't process submissions. |
| Video | 10 videos on Wix's video CDN, used on 9 pages (home, platform, assets, forms, compliance, telemetry, reporting, oilandgas, trek) | Self-host the MP4/WebM files (compressed) in the repo, or move them to YouTube or Vimeo. |
| Downloads | Trek_iOS.zip (36 MB), Trek_Android.zip (39 MB), **Trek_x64.zip (117 MB)**, and a 230 KB PDF | Trek_x64.zip is over git's 100 MB per-file limit. Put all the Trek zips on **GitHub Releases**. The PDF can go in the repo. |
| Fonts | Wix Madefor Text, Epilogue, "Crave Fine", Helvetica Neue | Wix Madefor and Epilogue are on Google Fonts (OFL). **Crave Fine and Helvetica Neue are licensed through Wix.** We need to buy a license or pick a substitute. |
| Analytics | GA4 `G-HJYFX0NXR6` | Use a **separate GA4 property** while we experiment, and switch to this one at cutover. |
| External links | `app.assetas.com` (Log in) and `app.assetas.com/SystemHealth` | Keep them as they are. |
| Motion | Wix motion presets (scroll and entrance animations) | Drop them for the copy. If we want motion, add simple CSS during the redesign and respect `prefers-reduced-motion`. |

### Page inventory

| Group | URL | Notes |
|---|---|---|
| Home | `/` | Hero, video, links into every section |
| Industries | `/industry`, `/oilandgas`, `/municipality`, `/defense`, `/infrastructure` | Industry dropdown in the nav |
| Platform | `/platform`, `/assets`, `/forms`, `/compliance`, `/telemetry`, `/platform/emissions`, `/ai`, `/reporting`, `/workflows` | Platform dropdown. Most of these pages have video. |
| Programs | `/ldar`, `/spcc`, `/security` | |
| Trek (mobile) | `/trek`, `/trek-app-downloads` | The downloads page links to the zips |
| Company | `/pricing`, `/contact`, `/platform/about` | `/platform/about` has the **same `<title>` as `/platform/emissions`** (bug) |
| Legal | `/privacy`, `/terms` | The privacy policy says "Last updated July 24, 2017" |
| Orphan | `/inquiry-services-page` | It's in the sitemap but has no H1 and isn't in the nav. Is it still used? |

---

## Proposed tech stack

- **Eleventy (11ty) v3 with Nunjucks templates.** Each page stays close to plain HTML, which makes matching the old site easy. The header, footer and repeated sections are written once and shared, so we aren't copying them into 26 pages. It ships no JavaScript framework.
  - Other options: plain HTML (we'd copy the header and footer into 26 files and they'd drift apart), Jekyll (built into Pages, but Ruby on Windows is painful), Astro (also good; better if we expect interactive parts later).
- **Plain CSS** with custom properties (design tokens). No Tailwind or framework at first, which keeps the later cleanup easy to read.
- **A GitHub Actions workflow** builds the site and deploys it to Pages on every push to `main`.
- **Playwright** for screenshots and visual comparison. **lychee** or **linkinator** for broken-link checks. **Lighthouse CI** for performance and accessibility.

### Proposed repo layout

```
src/
  _data/site.json          # site name, GA ID, base URL, noindex flag
  _data/nav.json           # header menus + footer links (single source)
  _includes/layouts/base.njk
  _includes/partials/      # header, footer, cta-band, video-block, hero...
  assets/css/  assets/img/  assets/video/  assets/fonts/  assets/files/
  index.njk  industry.njk  oilandgas.njk ...  platform/emissions.njk
  404.njk  robots.txt.njk  sitemap.xml.njk
tools/
  capture.mjs              # pulls text, image originals, screenshots from live site
  compare.mjs              # screenshots live vs. local at 3 widths, side by side
reference/                 # (gitignored) captured screenshots + text per page
.github/workflows/deploy.yml
PLAN.md
```

URLs: we'll output `contact.html`, `platform/emissions.html` and so on. GitHub Pages serves `/contact` from `contact.html`, which gives the same extensionless URLs Wix uses today.

---

## Phase 0: Set up the foundation (about 1 day)

**Status (2026-11-17): done. Live at https://assetas.github.io/Website/.** What's done:
- Eleventy 3.1.8 is scaffolded with a shared layout, a header with dropdowns and a mobile menu (`nav.json`), and a footer.
- All 26 pages exist as placeholders, using the live site's titles and descriptions.
- `robots.txt`, `sitemap.xml`, a 404 page and the deploy workflow are in place.
- Setup decisions:
  - Static files live in `src/static/` and are served at `/static/`, because the live site already has an `/assets` page.
  - `/platform` is built as both `platform.html` and `platform/index.html`, since the `platform/` folder also holds `about` and `emissions`.
  - Crawlers ignore `robots.txt` at `/Website/robots.txt`, because it isn't at the domain root. The page-level `noindex` tag is what actually keeps the preview out of search results.
- Checked on the live preview: `/Website/platform`, `/Website/platform/`, `/Website/contact`, `/Website/assets` and the other pages all return 200 with no redirects. Unknown URLs get the custom 404 page.


1. Scaffold Eleventy, add `.gitignore` and `package.json` scripts (`dev`, `build`, `capture`, `compare`), and the deploy workflow.
2. Turn on Pages in the repo settings, with "GitHub Actions" as the source.
3. **Preview URL:** `https://assetas.github.io/Website/`. Eleventy's `pathPrefix: "/Website/"` plus the bundled HTML base plugin rewrite root-relative links automatically, so templates use plain `/contact` links.
4. **Keep the experiment out of search results.** Add `<meta name="robots" content="noindex">` and `Disallow: /` in robots.txt on the preview, controlled by one flag in `site.json`. Otherwise Google may see duplicate content and rank it against the live site.

## Phase 1: Capture the current site (about 1 day)

**Status (2026-11-17): done.**
- `npm run capture` (`tools/capture.mjs`, Playwright) saved all 26 pages to `reference/pages/<slug>/`. Each folder has screenshots at 1440, 768 and 390 px, `text.txt`, and `page.json` (meta tags, heading outline, sections, links, images, videos, and a census of colors and fonts).
- `npm run download-media` (`tools/download-media.mjs`) saved 101 original images (59 MB), all 10 videos as 1080p MP4s (9–21 MB each, 140 MB total), and the PDF to `reference/media/`, with a `manifest.json` mapping each file to the pages that use it. The Trek zips are skipped unless you pass `--with-archives`; they'll go straight to GitHub Releases.
- `reference/` is gitignored. Re-run both scripts on any machine to rebuild it.
- Brand values, font substitutes and layout patterns are recorded in [docs/brand.md](docs/brand.md) and applied in `main.css`.
  - Crave Fine → Playfair Display.
  - Helvetica Neue is dropped; no visible text on the live site uses it.
- The header, footer (now three columns on light gray, matching the live site) and logo are updated in the site shell.
- **Largest pages to rebuild:** `/platform/emissions` (17 sections), `/ldar`, `/security` and `/spcc` (13 each). `/terms` and `/privacy` are long, but they're plain text.

Wix may change or go away later, so we save a complete reference copy first.

1. For each of the 26 URLs, use Playwright to save full-page screenshots at **1440 px, 768 px and 390 px** wide (`reference/<page>/`).
2. Save the visible text of each page, plus its `<title>`, meta description, Open Graph tags and H1/H2 outline. This becomes the content checklist.
3. Download every image from `static.wixstatic.com/media/...` at **original resolution** (remove Wix's `/v1/fill/...` resize suffix), along with the 10 videos, the PDF and the Trek zips.
4. Note the nav structure (dropdown labels and order), the footer, button styles, the color palette and the type scale (sizes, weights, line heights) at each breakpoint.
5. Pick free substitutes for Crave Fine and Helvetica Neue by comparing them against the screenshots. Record the mapping in `tokens.css`.

## Phase 2: Replicate every page (about 1–2 weeks)

**Status (2026-11-17): Batches A and B done.**
- Batch A: Home, Platform, Pricing, Contact.
- Batch B: /assets, /forms, /compliance, /telemetry, /platform/emissions, /ai, /reporting, /workflows.
- Batch C: /industry, /oilandgas, /municipality, /infrastructure, /defense, /ldar, /spcc, /security.
- Batch D: /trek, /trek-app-downloads, /platform/about, /privacy, /terms, /inquiry-services-page.
- **All 26 pages are rebuilt.** Static files total 42 MB, including 10 videos.

**Contact form (decided 2026-11-17):** FormSubmit, delivering to sales@assetas.com (`site.formAction`).
- Submissions go to `https://formsubmit.co/sales@assetas.com`, then the visitor lands on `/contact-thanks`.
- Each field has a readable name, so the email reads "Company or organization: …", "Industry: Defense: Yes", and so on.
- There's a hidden `_honey` spam trap and FormSubmit's own captcha step.
- Email is now required, so sales can reply. It was optional on the live site.
- Tested locally with the request intercepted: empty forms are blocked and every field posts correctly.
- **2026-11-17:** I sent a test submission from the preview, labeled "TEST - new website preview (please ignore)". FormSubmit replied "This form needs Activation" and emailed an 'Activate Form' link to sales@assetas.com. **Waiting on someone with that inbox to click it,** then send one more test to confirm delivery.
- **To activate:** the first real submission makes FormSubmit send a one-time activation email to sales@assetas.com. Someone with access to that inbox must click it, or later submissions are held. FormSubmit then offers a random alias that can replace the plain address in `site.formAction`, so the address isn't visible in the page source.

**Done:** The Trek downloads are published as the GitHub Release [trek-v4.0.2.0](https://github.com/Assetas/Website/releases/tag/trek-v4.0.2.0) (published 2026-11-17). All three links on `/trek-app-downloads` return 200, and the file sizes match the originals. For a new Trek version, publish a new release and update `site.trekRelease` in `src/_data/site.js`.

**Found while building Batch D** (candidates for the Phase 4 list):
- `/platform/about` uses the Emissions page's title and description. The copy keeps it for now; this is the known duplicate-title bug.
- On `/trek`, the app-store QR codes are hidden behind the video on the live site. They're shown below it in the copy. The live page also repeats the hero text in a gray band, which is left out.
- On `/trek`, "Get Trek" links to `/oilandgas#operational-excellence`. It probably should go to the QR codes or the downloads page.
- `/terms` marks almost every line as an `<h1>` on the live site, and `/privacy` uses plain paragraphs for its section titles. Both now have a proper heading structure (`tools/extract-richtext.mjs`), with the wording unchanged. The "Version 2.0 / Last Updated" block moved to the top of `/terms`, where it appears visually on the live site.
- `/privacy` is dated July 24, 2017 and should be reviewed by legal.
- `/inquiry-services-page` is an empty Wix booking page ("Nothing to book right now"). It isn't linked from anywhere, so it's a candidate to remove (with a redirect) in Phase 4.
- `/about`, `/platform/about`, `/ldar`, `/spcc`, `/telemetry` and `/reporting` all contain the same hidden Wix template text ("Describe the service… Book Now"). It's left out everywhere.

**Found while building Batch C** (candidates for the Phase 4 list):
- On the live `/defense` page, the two Air Force stat captions are visually swapped: 80% is shown with "check-in time" and 92% with "lost tool search". The copy uses the pairing from the Home page and from the page's own text order: 92% check-in, 80% lost-tool search. Worth confirming with whoever owns the numbers.
- The live `/defense` "Download brief" button and the `/oilandgas` "Read the full story" button don't link anywhere. In the copy they point to /contact and the forms case study PDF; replace them with the right documents.
- The Home "Read the full story" link went to `/defense#Section%208`, an auto-generated Wix anchor. It now goes to `/defense#air-force-testimonial`.
- `/oilandgas` has no `#operational-excellence` section, so the "See it on your assets" link on `/workflows` just lands at the top of `/oilandgas`.
- `/ldar` and `/spcc` contain hidden leftover template text from Wix ("Our Services / Service 1 / Book Now"). It's left out.
- On `/ldar`, the "Track leaks…" image panel is blank on the live site (it probably fails to load). The copy shows the AI assistant screenshot that the page references there.
- Copy typos: "Stale documentation turn a site visit into findings" (`/spcc`), "Auto-generate draft SPCC Plans standardized calcs on company template" (`/spcc`).

**Found while building Batch B** (candidates for the Phase 4 list):
- `/telemetry`, `/reporting` and `/ai` have "Book a demo" and "Talk to our engineer" buttons that don't link anywhere on the live site. Both point to /contact in the copy.
- `/telemetry` and `/reporting` contain hidden leftover template text from Wix ("Describe the service…", "Book Now" three times). It's left out.
- On `/ai`, "See how it works" goes to `/spcc#how-it-works`, not to this page's own "How it works" section. It's kept as on the live site; probably a mistake.
- On `/workflows`, "See it on your assets" goes to `/oilandgas#operational-excellence`. Check that this anchor exists when `/oilandgas` is built.
- The `/forms` case study link points to a PDF, now at `/static/files/smart-forms-case-study.pdf`.
- The FAQ on `/platform/emissions` was collapsed accordions on the live site. The answers were pulled with `tools/extract-accordion.mjs` and are now `<details>` elements that work without JavaScript.
- Copy typo on `/compliance`: "the same record.." has a double period.
- Tools added: `node tools/page-brief.mjs <slug>` prints a page's text, links, images and icons in one go, and `slice` and `compare` now take `--scale`.

**Tools for each new page:**
- `node tools/slice.mjs <slug>` cuts the live screenshot into readable slices.
- `node tools/extract-svgs.mjs <slug>` saves the inline icons and logos.
- `node tools/import-media.mjs <file> <dest>` resizes images to WebP and compresses videos.
- `npm run compare -- <slug> [desktop|mobile]` puts the live and new versions side by side.
- `npm run check` finds broken links, missing files and sideways scrolling.

**Shared section styles** in `main.css`: hero, section-head, logo strip, cards and grid, features, tiles, testimonial, steps, panel and panel-row, capability with label-rows, tags, stats-band, icon-list, plans, dark-band with ruled-grid, comparison table, contact form, and the closing call-to-action band (`partials/cta-band.njk`; set `cta:` in front matter, with `accent: true` for the orange version).

**Found while building Batch A:**
- The Home and Platform videos are the same footage uploaded to Wix twice, so the site uses one copy (`static/video/platform-features.mp4`, 3.7 MB, compressed from 12 MB).
- The live Pricing page has an empty FAQ: the "Questions / Clear answers on terms, security, and features." heading has no questions under it. It's left out of the copy, with a comment in `pricing.njk` marking where it goes.
- The live Pricing comparison table is a Wix HTML embed (an iframe). It's now part of the page itself (`partials/pricing-compare.html`), and its tooltips work without JavaScript.
- At phone width, the live Pricing page shows the Standard plan's "$0 forever" inside the Professional card. The copy doesn't have this bug.
- The live description for `/platform` has a typo ("complaince"). It's kept for now and goes on the Phase 4 list.
- **Contact form:** it's built with all the live fields, but `site.formAction` is empty. Until a backend is chosen, the form shows a notice pointing to sales@assetas.com and its Submit button is disabled.

**How close should the copy be: close enough, and simple first.** The theme and page layouts will change later anyway, so we don't try to match the Wix site exactly. When an exact match and simple code pull in different directions, **choose simple HTML and CSS.**

- **Must carry over:** all the text, the page order and section order, the images and videos, links and URLs, titles and meta tags, and the general look (brand colors, light or dark sections, roughly the same layout).
- **Fine to approximate or drop:** exact spacing, font sizes and pixel positions, overlapping or absolutely positioned decorations, scroll and entrance animations, hover effects, and Wix-specific layout quirks.
- **How to write the code:** semantic HTML (`header`, `nav`, `main`, `section`, `footer`), one small shared stylesheet, flexbox and grid with only a few breakpoints, and a handful of reusable section patterns instead of custom CSS for each page. Use no JavaScript except the mobile menu toggle and the analytics snippet.

Build order:

1. **Shared shell.** Base layout, fonts, color and spacing tokens, the header with the Industry and Platform dropdowns, the mobile menu, "Log in" linking to `app.assetas.com`, and the footer (About, Privacy, Terms, System Health).
2. **Component kit.** Build the patterns that repeat across pages once: the "Where X meets Y" hero, the video block, feature or card grids, the CTA band ("Contact us"), and the section heading with eyebrow text.
3. **Pages in batches.** Each batch is reviewed side by side against the reference screenshots before the next one starts:
   - Batch A: Home, Platform, Contact, Pricing (the shell and most component types)
   - Batch B: the 8 Platform child pages
   - Batch C: the 5 Industry pages, plus LDAR, SPCC and Security
   - Batch D: Trek, Trek downloads, About, Privacy, Terms, the inquiry page, and a 404 page
4. **What replaces the Wix features:**
   - **Contact form:** first find out where Wix submissions go today (inbox or email). Then move the form to a hosted backend: Formspree, Web3Forms or Basin are quickest. Since you're already on M365, Power Automate with an HTTP trigger is another option. Add a honeypot field and the provider's spam filtering.
   - **Videos (self-hosted):** compress to H.264 MP4 under 10 MB each (ffmpeg, CRF about 28, 1080p at most) with a poster image, and use `<video playsinline muted loop>` for background clips. Ten clips at about 10 MB each fits easily within the Pages limits (1 GB site, 100 MB per file).
   - **Trek downloads:** create a GitHub Release (for example, `trek-v<version>`) and link its assets. Moving the files in with the site also takes the large downloads off Wix.
   - **Analytics:** add a GA4 snippet whose ID comes from `site.json`.

**Each page is done when:**
- [ ] All the text from the captured reference is present, with no typos introduced
- [ ] Title, meta description, OG tags and canonical URL match the original (we fix the known bugs in Phase 4, not here)
- [ ] Side by side with the original at 1440, 768 and 390 px: same sections, same order, same images. Spacing and type that are close enough are fine.
- [ ] Uses the shared section patterns and adds little or no page-specific CSS
- [ ] No broken internal links; external links open the same targets
- [ ] Images have `alt` text and lazy-load below the fold

## Phase 3: Sign off on the copy (2–3 days)

**Status (2026-11-17): review done.** All 26 pages pass the visual, link, structure and Lighthouse checks; the full report is in [docs/phase-3-signoff.md](docs/phase-3-signoff.md).
- The preview scores 96–100 for mobile performance, against 61–84 on the live Wix site.
- The Home page weighs 0.25 MB, against 16.4 MB on the live site.
- Tagged `v1-replica` on 2026-11-17 (commit abe5d9d). To get back to the replica: `git checkout v1-replica`.
- Still open: Contact form activation, and a GA4 property for the preview (optional).

- Run `tools/compare.mjs` across all 26 pages and review a gallery of the live and new versions side by side.
- Run a full link check, submit a test form end to end, check that GA4 receives page views on the preview property, and run Lighthouse as a baseline.
- **Tag the commit `v1-replica`.** This snapshot is our fallback if the redesign drifts.

## Phase 4: Clean up and redesign (iterative)

**Decided 2026-11-17:**
- **Two oranges:** brand `#cc7722` for large and decorative uses; `#a65c12` for small text and for orange fills behind white text; `#eb9f55` for small orange text on dark bands.
- **Playfair Display** stays as the display serif.
- **Changes go straight to main** (no pull requests). The `v1-replica` tag is the fallback.

**Step 1, design system: done (2026-11-17).**
- `src/static/css/tokens.css` holds every color, font, size and spacing value, with contrast ratios noted. `main.css` uses only those tokens.
- The `/design-system` page (not in the nav or sitemap) is the visual reference.
- Small orange text and the orange buttons and bands now use the darker orange. The orange call-to-action bands are visibly darker as a result.
- There's a visible keyboard focus outline on every control.
- Fixed a Batch C bug: the dark call-to-action band on `/municipality` rendered light gray, so its white heading was invisible.
- **Lighthouse accessibility is 100 on all 26 pages and the thank-you page** (it was 95–96).
- Next in Phase 4: the information architecture (step 2), then the content and SEO fixes in the backlog in `docs/phase-3-signoff.md`.

Work through this **one page group at a time** on branches, with a PR for each. Each PR gets a preview (a PR-preview action, or a staging branch).

1. **Design system:** consolidate fonts (drop the licensed Wix fonts), set a type scale, a spacing scale, a color palette with contrast checks, and button and link states. Write it down in `src/assets/css/tokens.css`.
2. **Information architecture:** check the overlap between `/oilandgas`, `/ldar` and `/spcc`, and between `/industry` and the separate industry pages. Decide what `/platform/about` should be: it's really "About us", so it may belong at `/about` with a redirect. Retire or rebuild `/inquiry-services-page`.
3. **Content:** tighten the copy, pick a consistent hero formula, and update the privacy policy, which is dated 2017 and should be reviewed by legal.
4. **SEO:** give every page a unique title and description (fixes the duplicate `/platform/about` title), generate the sitemap, add Organization and SoftwareApplication schema.org data, and a default OG image.
5. **Accessibility:** semantic landmarks, keyboard-usable dropdowns, focus states, captions or transcripts for videos with narration, and WCAG 2.2 AA contrast.
6. **Performance:** AVIF/WebP images with `srcset` (`@11ty/eleventy-img`), preloaded fonts, and no layout shift. Target Lighthouse 95+ in every category.
7. **Layout changes:** do these per component, so the whole site improves together instead of 26 one-off pages.

## Phase 5: Cutover (when we decide to replace Wix)

1. Freeze content on Wix and compare against the reference capture one last time.
2. **Verify `assetas.com` in the GitHub org settings** (Pages → verified domains). This prevents domain takeover.
3. In the repo, set the custom domain to `www.assetas.com`. This commits a `CNAME` file. Remove the `pathPrefix`, turn off `noindex`, and switch to the production GA4 ID.
4. At GoDaddy, set `www` as a CNAME to `assetas.github.io`, and set the apex `@` A records to GitHub's four Pages IPs (plus AAAA if you want IPv6). **Leave MX, SPF, DKIM and autodiscover alone.** Lower the TTLs a day ahead.
5. Turn on "Enforce HTTPS" once the certificate is issued, which can take up to about an hour.
6. Submit the new sitemap in Google Search Console and watch for 404s for two weeks.
7. Keep the Wix plan active for about 30 days as a fallback, then cancel it. Check that no Wix forms, emails or bookings are still in use first.

---

## Decisions

Decided (2026-11-17):

1. **Static site generator:** Eleventy v3 with Nunjucks templates.
2. **Preview URL:** `https://assetas.github.io/Website/`, using `pathPrefix: "/Website/"` and `noindex`. No DNS changes until cutover.
3. **Fonts:** use free substitutes during replication. Wix Madefor Text and Epilogue come from Google Fonts. Crave Fine and Helvetica Neue get the closest free match, which we pick in Phase 1. The final fonts are settled in Phase 4.
4. **Video hosting:** self-hosted, compressed H.264 MP4 with poster images, in `src/assets/video/`.

Still open:

5. ~~**Form backend**~~ Decided: FormSubmit, delivering to sales@assetas.com.
6. ~~**Trek downloads**~~ Decided: GitHub Releases on this repo (release `trek-v4.0.2.0`).
