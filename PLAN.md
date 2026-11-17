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

**Status (2026-11-17): built locally, not yet committed or deployed.** What's done:
- Eleventy 3.1.8 is scaffolded with a shared layout, a header with dropdowns and a mobile menu (`nav.json`), and a footer.
- All 26 pages exist as placeholders, using the live site's titles and descriptions.
- `robots.txt`, `sitemap.xml`, a 404 page and the deploy workflow are in place.
- Setup decisions:
  - Static files live in `src/static/` and are served at `/static/`, because the live site already has an `/assets` page.
  - `/platform` is built as both `platform.html` and `platform/index.html`, since the `platform/` folder also holds `about` and `emissions`.
  - Crawlers ignore `robots.txt` at `/Website/robots.txt`, because it isn't at the domain root. The page-level `noindex` tag is what actually keeps the preview out of search results.
- **Check after the first deploy:** confirm that `/Website/platform`, `/Website/contact` and `/Website/assets` all load without a redirect loop or a 404.


1. Scaffold Eleventy, add `.gitignore` and `package.json` scripts (`dev`, `build`, `capture`, `compare`), and the deploy workflow.
2. Turn on Pages in the repo settings, with "GitHub Actions" as the source.
3. **Preview URL:** `https://assetas.github.io/Website/`. Eleventy's `pathPrefix: "/Website/"` plus the bundled HTML base plugin rewrite root-relative links automatically, so templates use plain `/contact` links.
4. **Keep the experiment out of search results.** Add `<meta name="robots" content="noindex">` and `Disallow: /` in robots.txt on the preview, controlled by one flag in `site.json`. Otherwise Google may see duplicate content and rank it against the live site.

## Phase 1: Capture the current site (about 1 day)

Wix may change or go away later, so we save a complete reference copy first.

1. For each of the 26 URLs, use Playwright to save full-page screenshots at **1440 px, 768 px and 390 px** wide (`reference/<page>/`).
2. Save the visible text of each page, plus its `<title>`, meta description, Open Graph tags and H1/H2 outline. This becomes the content checklist.
3. Download every image from `static.wixstatic.com/media/...` at **original resolution** (remove Wix's `/v1/fill/...` resize suffix), along with the 10 videos, the PDF and the Trek zips.
4. Note the nav structure (dropdown labels and order), the footer, button styles, the color palette and the type scale (sizes, weights, line heights) at each breakpoint.
5. Pick free substitutes for Crave Fine and Helvetica Neue by comparing them against the screenshots. Record the mapping in `tokens.css`.

## Phase 2: Replicate every page (about 1–2 weeks)

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

- Run `tools/compare.mjs` across all 26 pages and review a gallery of the live and new versions side by side.
- Run a full link check, submit a test form end to end, check that GA4 receives page views on the preview property, and run Lighthouse as a baseline.
- **Tag the commit `v1-replica`.** This snapshot is our fallback if the redesign drifts.

## Phase 4: Clean up and redesign (iterative)

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

5. **Form backend,** and who receives contact submissions today. This has to be settled before the Contact page is built in Batch A.
6. **Trek downloads:** GitHub Releases on this public repo (the default unless we pick somewhere else), or another location such as Azure Blob.
