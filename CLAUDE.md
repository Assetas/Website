# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static rebuild of www.assetas.com (formerly Wix) with Eleventy v3 + Nunjucks, deployed to GitHub Pages from the public repo `Assetas/Website`. `PLAN.md` is the source of truth for migration status, decisions and the remaining backlog (phases 0–5); `docs/phase-3-signoff.md` holds the content/SEO backlog and `docs/brand.md` the captured brand values. Read `PLAN.md` before starting new work and record progress there.

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

- **Preview vs production** is driven entirely by `SITE_ENV` in `src/_data/site.js` (URL, `pathPrefix`, `noindex`, `gaId`). It also holds `formAction` (FormSubmit → sales@assetas.com) and `trekRelease` (Trek zips live on a GitHub Release, too large for the repo).
- **Links:** always write root-relative URLs (`/contact`, `/static/...`). `HtmlBasePlugin` in `eleventy.config.js` adds the `/Website/` prefix in HTML attributes — but not inside `<script>`, where you must use the `url` filter (see `src/redirects.njk`).
- **Pages:** one `src/*.njk` (or `src/platform/*.njk`) per page, each with an explicit `permalink: /slug.html` to keep the live Wix URLs; GitHub Pages serves them extensionless. The `cleanUrl` filter strips `.html` for canonicals/sitemap. Front matter: `layout: layouts/base.njk`, `title`, `description`, optional `canonicalPath`, `ogImage`, `sitemap: false`, and `status` (`replica` or `phase4`, informational only).
- **Shell:** `src/_includes/layouts/base.njk` (meta, OG/Twitter tags, Organization JSON-LD on home, GA) + `partials/` (header, footer, CTA band, pricing table). Menus and footer links come from `src/_data/nav.json`.
- **Header menu ("Mega panel"):** on desktop, Industry and Platform open a full-width panel on hover/focus in pure CSS; under 64rem the nav becomes a drawer. The panel content is in `nav.json` too: `intro` on each menu, and `blurb` plus `icon` (a file in `static/img/icons/`) or `image` on each child. `static/js/menu.js` runs the drawer, its accordions and the amber bar that follows the hovered item; it's the only page script besides analytics.
- **Redirects:** GitHub Pages can't do server redirects. Add `{ from, to, note }` to `src/_data/redirects.json`; `src/redirects.njk` paginates it into meta-refresh + JS forwarding pages (keeps `#hash`, canonical to target, noindex).
- **Styling:** `src/static/css/tokens.css` defines every color/font/size/spacing token (with contrast notes); `main.css` must use only those tokens. The `/design-system` page (not in nav or sitemap) is the visual reference. The look is "Blueprint": brand blue `#006dff` is a surface (header, every `.hero`, the closing `.cta-band`) with a drafting grid, pages are white with ice (`#edf4ff`) sections, and navy `#021b4e` carries dark bands and the footer. Color rules: small blue text uses `#0058d6`; safety amber `#ffc21a` is the main action on blue and the accent on navy, never text on white; big numbers on blue use `#ffd352`. Inter is the only font. The header and footer use `img/brand/assetas-logo-white.png`.
- **Videos:** every `<video>` uses `autoplay muted loop playsinline controls` plus a `poster` and `width`/`height` (no `preload="none"`, which delays playback). Keep `controls` so visitors can pause or unmute. Import new videos with `tools/import-media.mjs` to get the mp4 + jpg poster.
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

**Never invent** customers, stats, quotes, certifications or regulatory claims. Put a placeholder in the page and note it in `PLAN.md`. Don't reword existing page copy while working on something else; copy rewrites are separate tasks.

## Reference capture tooling (`tools/`)

Playwright/sharp scripts used to replicate the Wix site. They read/write `reference/` (gitignored, local only):
- `npm run capture [-- slug ...]` / `npm run download-media` — snapshot live pages (screenshots, text, outline) and original media.
- `node tools/page-brief.mjs <slug>` — summary of a captured page for rebuilding.
- `node tools/compare.mjs <slug> [desktop|tablet|mobile]` — side-by-side live vs local screenshots (dev server running).
- `node tools/import-media.mjs <source> <dest>` — resize/compress a captured original into `src/static/` (images → webp, videos → H.264 mp4 + jpg poster).
- `extract-richtext`, `extract-accordion`, `extract-svgs`, `slice` — one-off extraction helpers; usage is in each file's header comment.
