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
- **Redirects:** GitHub Pages can't do server redirects. Add `{ from, to, note }` to `src/_data/redirects.json`; `src/redirects.njk` paginates it into meta-refresh + JS forwarding pages (keeps `#hash`, canonical to target, noindex).
- **Styling:** `src/static/css/tokens.css` defines every color/font/size/spacing token (with contrast notes); `main.css` must use only those tokens. The `/design-system` page (not in nav or sitemap) is the visual reference. The look is "Blueprint": brand blue `#006dff` is a surface (header, every `.hero`, the closing `.cta-band`) with a drafting grid, pages are white with ice (`#edf4ff`) sections, and navy `#021b4e` carries dark bands and the footer. Color rules: small blue text uses `#0058d6`; safety amber `#ffc21a` is the main action on blue and the accent on navy, never text on white; big numbers on blue use `#ffd352`. Inter is the only font. The header and footer use `img/brand/assetas-logo-white.png`.
- **Videos:** every `<video>` uses `autoplay muted loop playsinline controls` plus a `poster` and `width`/`height` (no `preload="none"`, which delays playback). Keep `controls` so visitors can pause or unmute. Import new videos with `tools/import-media.mjs` to get the mp4 + jpg poster.
- **Static files:** `src/static/` is passed through to `/static/` (not `/assets/`, which is a page URL).

## Reference capture tooling (`tools/`)

Playwright/sharp scripts used to replicate the Wix site. They read/write `reference/` (gitignored, local only):
- `npm run capture [-- slug ...]` / `npm run download-media` — snapshot live pages (screenshots, text, outline) and original media.
- `node tools/page-brief.mjs <slug>` — summary of a captured page for rebuilding.
- `node tools/compare.mjs <slug> [desktop|tablet|mobile]` — side-by-side live vs local screenshots (dev server running).
- `node tools/import-media.mjs <source> <dest>` — resize/compress a captured original into `src/static/` (images → webp, videos → H.264 mp4 + jpg poster).
- `extract-richtext`, `extract-accordion`, `extract-svgs`, `slice` — one-off extraction helpers; usage is in each file's header comment.
