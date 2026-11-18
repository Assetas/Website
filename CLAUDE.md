# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The www.assetas.com website, built with Eleventy v3 + Nunjucks and deployed to GitHub Pages from the public repo `Assetas/Website`. Until it goes live on the domain, the preview is at https://assetas.github.io/Website/. The **Open items** section at the end of this file is the backlog: check it before starting new work, add anything left unresolved, and strike items when they're done. Git history is the change log.

The repo is public: never commit drafts, internal notes or secrets. Changes go straight to `main` (no PRs); the `v1-replica` tag is the fallback.

## Commands

```bash
npm run dev      # eleventy --serve → http://localhost:8080/Website/
npm run build    # preview build into _site/ (/Website/ prefix, noindex, no GA)
SITE_ENV=production npm run build   # www.assetas.com, indexable, live GA4
npm run check    # needs dev server running; broken internal links/assets + horizontal overflow at 390px
node tools/audit.mjs [--base URL]   # headings/titles/descriptions/images per page + external link check
```

There are no unit tests. `npm run check` is the gate: CI (`.github/workflows/deploy.yml`) builds, serves `_site`, runs it against `http://localhost:8080/Website/`, and blocks the deploy on failure. Both `check` and `audit` crawl pages from `sitemap.xml`, so pages excluded from the sitemap aren't checked.

## Architecture

- **Preview vs production** is driven entirely by `SITE_ENV` in `src/_data/site.js` (URL, `pathPrefix`, `noindex`, `gaId`). It also holds `formAction` and `formAccessKey` (Web3Forms; the key is public by design) and `trekRelease` (Trek zips live on a GitHub Release, too large for the repo).
- **Links:** always write root-relative URLs (`/contact`, `/static/...`). `HtmlBasePlugin` in `eleventy.config.js` adds the `/Website/` prefix in HTML attributes — but not inside `<script>`, where you must use the `url` filter (see `src/redirects.njk`).
- **Pages:** one `src/*.njk` (or `src/platform/*.njk`) per page, each with an explicit `permalink: /slug.html`; GitHub Pages serves them extensionless (`/contact`). Keep existing URLs stable; if a page moves, add a redirect. `/platform` is built twice (`platform.html` and `platform/index.html`) because the `platform/` folder also holds `emissions`. The `cleanUrl` filter strips `.html` for canonicals/sitemap. Front matter: `layout: layouts/base.njk`, `title`, `description`, optional `canonicalPath`, `ogImage`, and `sitemap: false`.
- **Shell:** `src/_includes/layouts/base.njk` (meta, OG/Twitter tags, Organization JSON-LD on home, GA) + `partials/` (header, footer, CTA band, pricing table). Menus and footer links come from `src/_data/nav.json`.
- **Header menu ("Mega panel"):** on desktop, Industry, Programs and Platform open a full-width panel on hover/focus in pure CSS; under 64rem the nav becomes a drawer. The panel content is in `nav.json` too: `intro` on each menu, and `blurb` plus `icon` (a file in `static/img/icons/`) or `image` on each child. `static/js/menu.js` runs the drawer, its accordions and the amber bar that follows the hovered item, plus the footer trigger below; it's the only page script besides analytics.
- **Footer:** navy, with a telemetry trace across the top and a large alpha mark drawn over construction lines, behind the links and bleeding off the lower-right corner (inline SVG in `partials/footer-art.njk`; colors are the `--color-sketch-*` tokens). When the footer scrolls into view, `menu.js` plays it once: the trace runs, an amber pen traces the mark, it inks in and dims to half strength, the columns rise and the headings get their amber ticks (about 4 s). Without the script, or with reduced motion, the footer shows the finished drawing. Nothing loops: anything that moves for more than 5 s would need a pause control (WCAG 2.2.2).
- **Contact form:** posts to Web3Forms (`site.formAction`), which emails the inbox the access key was created for (it should be sales@assetas.com) and sends the visitor to `/contact-thanks` (the free plan only redirects within the site's own domain). Each field has a readable `name` so the email reads well; the visitor's `email` (required) becomes the reply-to. Spam control is the hidden `botcheck` honeypot; Web3Forms' free hCaptcha is the next step if spam gets through. Set `formAction` to `""` to disable the form (it then shows a notice and a disabled Submit button).
- **Trek downloads:** the zips are on the GitHub Release `trek-v4.0.2.0` (Trek_x64.zip is over git's 100 MB limit). For a new Trek version, publish a new release and update `site.trekRelease`.
- **Redirects:** GitHub Pages can't do server redirects. Add `{ from, to, note }` to `src/_data/redirects.json`; `src/redirects.njk` paginates it into meta-refresh + JS forwarding pages (keeps `#hash`, canonical to target, noindex).
- **Styling:** `src/static/css/tokens.css` defines every color/font/size/spacing token (with contrast notes); `main.css` must use only those tokens. The `/design-system` page (not in nav or sitemap) is the visual reference. The look is "Blueprint": brand blue `#006dff` is a surface (header, every `.hero`, the closing `.cta-band`) with a drafting grid, pages are white with ice (`#edf4ff`) sections, and navy `#021b4e` carries dark bands and the footer. Color rules: small blue text uses `#0058d6`; safety amber `#ffc21a` is the main action on blue and the accent on navy, never text on white; big numbers on blue use `#ffd352`. Inter is the only font. The header and footer use `img/brand/assetas-logo-white.png`.
- **Videos:** every `<video>` uses `autoplay muted loop playsinline controls` plus a `poster` and `width="1280" height="720"` (no `preload="none"`, which delays playback). Keep `controls` so visitors can pause or unmute. Import new videos with `tools/import-media.mjs` to get the mp4 + jpg poster; videos are 1280×720 (16:9).
- **Video size and placement:** all videos are the same size and centered horizontally. Wrap each one, alone, in `<div class="media media--video">` inside the section's `.container`: it caps the width at `--video-width` (55rem / 880px, set in `tokens.css`), centers it with `margin-inline: auto`, locks a 16:9 frame and adds the rounded, shadowed frame. Don't add per-video width, alignment or size classes; to change the size of every video, change `--video-width`.
- **Static files:** `src/static/` is passed through to `/static/` (not `/assets/`, which is a page URL).

## Voice and tone

All new or rewritten copy (page text, headings, buttons, `nav.json` intros and blurbs, titles, meta descriptions, alt text) uses this voice. It's taken from the current pages; `index.njk`, `platform.njk`, `spcc.njk` and `about.njk` are the best examples.

**Reader:** operations, maintenance and EHS/compliance leads at oil & gas operators, municipalities and utilities, defense installations and infrastructure owners. They know their regulations, so don't explain the basics.

**Voice: an operator who has been through an audit.** Confident, plain, specific and a little dry. It should sound like someone who has done the field and compliance work, not like a software marketer.
- Be concrete. Name the real thing (berm, wellhead, work order, PE stamp, 40 CFR 98 subpart W, PHMSA, NPDES, DoDI 4151.22) instead of "solutions", "seamless" or "assets of all kinds".
- Write short declarative sentences. Fragments are fine for rhythm ("One data model. Full audit trail.").
- Describe the reader's problem in their own terms first, then what Assetas does about it ("Reports rebuilt by hand in every emissions cycle").
- Back every claim with a sourced number, a named regulation or a named customer. Don't use hype words (best-in-class, cutting-edge, revolutionary, unlock, empower, leverage, game-changer) or exclamation marks.
- Use "you/your" for the reader ("your crews") and "we" for Assetas ("We speak O&G"). Customers are "clients".
- Present AI as a tool that works on the record: say what each model does and what data it reads, with no magic.

**Recurring ideas.** Reuse these and don't invent new slogans: *Where X meets Y*; one record / one data model / one source of truth; capture once, report from the same record; from the field to the filing; audit-ready by default, not rebuilt when the auditor calls; offline, timestamped, geotagged field capture.

**Copy patterns:**
- **H1:** "Where X meets Y." with a period. X is the operational side and Y is the accountability side, both concrete ("Where the wellhead meets the regulator.").
- **H2:** a short statement in sentence case with a period ("Three workflows, one record."). **H3 and card titles:** sentence-case noun phrases with no period.
- **Eyebrow:** 2–4 words in sentence case ("The challenge", "How it works", "Connects to"). Platform pages use `Platform/<Name>`.
- **Lead:** one or two sentences (about 35 words at most) saying what it does and for whom. **Card text:** one or two sentences, up to about 30 words.
- **Buttons:** sentence case ("Talk to sales", not "Talk to Sales"). The main action is "Book a demo" → `/contact`. The second is "See the platform" or a specific "See how it works". Links to documents or other sites end in ↗.
- **Links:** say where they go ("Explore oil & gas"). If you keep "Learn more", add a `visually-hidden` suffix naming the target.
- **Closing band:** the `partials/cta-band.njk` defaults ("See where your operations meet your obligations." / "Thirty minutes. …"), unless the page has a sharper industry-specific line set through `cta:`.
- **Titles:** "<What it is> | Assetas", under 60 characters. **Descriptions:** 120–160 characters that name the record types or regulations, with no call to action.
- **Alt text:** what the image shows in its operational context, without "image of". Decorative icons get `alt=""`.

**Mechanics:** American English with the Oxford comma. Use a spaced em dash ( — ) for asides, not an en dash. Use "&" in titles, nav labels and headings ("Oil & Gas", "Smart Forms & Tasks") and "and" in sentences. Use numerals for stats ("92%"). Write regulations and agencies the way they write themselves (EPA, PHMSA, SPCC, LDAR, Title V), and don't expand acronyms the sector uses every day. Product and module names are capitalized: Assetas, Trek, Unified Asset Intelligence, Smart Forms & Tasks, Workflow Automation, Compliance & Emissions.

**Never invent** customers, stats, quotes, certifications or regulatory claims. Put a placeholder in the page and add it to **Open items** below. Don't reword existing page copy while working on something else; copy rewrites are separate tasks.

## Tools (`tools/`)

- `check.mjs` (`npm run check`) and `audit.mjs` — see Commands. Both use Playwright.
- `node tools/import-media.mjs <source> <dest> [--width 1600] [--quality 80] [--audio]` — copy an original into `src/static/<dest>`: images → resized WebP, videos → H.264 mp4 (max 1280 wide, no audio unless `--audio`) + jpg poster, anything else copied as is.

## Going live on www.assetas.com

Nothing changes in DNS until we decide to go live. When we do:
1. Verify `assetas.com` in the GitHub org settings (Pages → verified domains) to prevent domain takeover.
2. Set the repo's custom domain to `www.assetas.com` (this commits a `CNAME` file). In `deploy.yml`, set `SITE_ENV: production` and change the check's `--base` to `http://localhost:8080/`. Production turns off `noindex` and turns on GA4 `G-HJYFX0NXR6`.
3. DNS is at GoDaddy: point `www` (CNAME) to `assetas.github.io` and the apex `@` A records to GitHub's four Pages IPs (plus AAAA for IPv6). Lower the TTLs a day ahead. **Email is Microsoft 365: leave MX, SPF, DKIM, autodiscover and the other TXT records alone.**
4. Turn on "Enforce HTTPS" once the certificate is issued (up to about an hour).
5. Submit the sitemap in Google Search Console and watch for 404s for two weeks.
6. Keep the current host for about 30 days as a fallback, and make sure no forms or email still depend on it before cancelling.

`robots.txt` is ignored by crawlers on the preview because it isn't at the domain root; the page-level `noindex` is what keeps the preview out of search results.

## Open items

**Waiting on input:**
- `/defense` Air Force stats: the page pairs 92% with check-in time and 80% with lost-tool search (the Home page pairing). Confirm with whoever owns the numbers.
- Real documents for "Download brief" (`/defense`, now → `/contact`) and "Read the full story" (`/oilandgas`, now → the Smart Forms case study PDF). "Book a demo" and "Talk to our engineer" on `/telemetry`, `/reporting` and `/ai` both go to `/contact`.
- Legal review of `/privacy` (dated July 24, 2017; keep its wording until then).
- Contact form: send one test from the preview and confirm it arrives at sales@assetas.com.
- Preview analytics: `site.gaId` is empty on the preview. Create a separate GA4 property if visitor data is wanted before going live.

**Copy to review:** the `nav.json` intros and one-liners, and the `/programs` page text.

**Backlog:**
- Lighthouse pass after the Blueprint redesign (accessibility was 100 on every page before it).
- Performance: responsive images with `srcset` (`@11ty/eleventy-img`), preloaded fonts, no layout shift. Target 95+ in every Lighthouse category.
- Accessibility: captions or transcripts for any video with narration.
- SEO: SoftwareApplication structured data (Organization is done).
- Pricing is reachable only from the header; add contextual links where they fit.
- Layout changes go per component, so the whole site improves together.

**Decided, don't reopen without asking:** Industry, Programs and Platform stay as the menu groups; `/oilandgas`, `/ldar` and `/spcc` stay separate pages; the Pricing page has no FAQ; Security stays under Platform.
