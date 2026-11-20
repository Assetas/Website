# CLAUDE.md

The www.assetas.com marketing site: Eleventy v3 + Nunjucks on GitHub Pages, from the public repo `Assetas/Website`. Until it goes live on the domain, the preview is https://assetas.github.io/Website/.

**Open items** (end of file) is the backlog: check it before starting, add anything you leave unresolved, and remove items once done. Git history is the change log.

## Repo rules

- The repo is public. Never commit drafts, internal notes or secrets.
- Commit straight to `main`; only Dependabot opens PRs. Others push too, so `git pull --rebase` before starting and again before pushing. Never force-push (a ruleset blocks it anyway).
- Tags: `v1-replica` (replica of the old site) is the fallback; `v1-beta` is the Blueprint beta pre-release; `trek-v*` hold Trek releases. A ruleset stops them being moved or deleted.
- Workflows can only use GitHub-owned Actions (`actions/*`, `github/*`); anything else fails until allowed in Settings → Actions.

## Commands

Node 20+ (CI uses 22).

```bash
npm run dev       # http://localhost:8080/Website/
npm run build     # preview build into _site/: /Website/ prefix, noindex, no GA
SITE_ENV=production npm run build   # www.assetas.com: no prefix, indexable, GA4 on
npm run check     # the gate; needs a running server
node tools/audit.mjs [--base URL]   # titles, descriptions, headings, alt text, external links
node tools/import-media.mjs <source> <dest> [--width 1600] [--quality 80] [--audio]
```

- **`check`** finds broken internal links and assets, pages wider than 390px, and a broken 404 page (loads `/spc`, expects a 404 and at least one suggestion). No unit tests; this is the gate. CI (`.github/workflows/deploy.yml`) builds and checks every push to `main` and blocks the deploy on failure; PRs into `main` get the same run without deploying, so wait for green before merging.
- **Ports:** `check` and `audit` default to `http://localhost:8080/Website/`. The `site` server in `.claude/launch.json` runs on 8090: use `npm run check -- --base http://localhost:8090/Website/`.
- Both crawl `sitemap.xml`, so `sitemap: false` pages (except 404) go unchecked.
- **`import-media`** writes to `src/static/<dest>`: images → resized WebP; videos → H.264 mp4 (max 1280 wide, muted unless `--audio`) + jpg poster, via `ffmpeg` on PATH; anything else copied as is.

## Architecture

- **Preview vs production:** `SITE_ENV` drives `src/_data/site.js` (`url`, `pathPrefix`, `noindex`, `gaId`), which also holds `formAction`, `formAccessKey` (Web3Forms; public by design) and `trekRelease`.
- **Links:** write root-relative URLs (`/contact`, `/static/...`). `HtmlBasePlugin` adds `/Website/` in HTML attributes but not inside `<script>`; there, use the `url` filter (see `src/redirects.njk`).
- **Pages:** one `src/*.njk` (or `src/platform/*.njk`) each, with an explicit `permalink: /slug.html`; Pages serves it extensionless (`/contact`). Keep URLs stable; if a page moves, add a redirect. `/platform` is built as both `platform.html` and `platform/index.html` because the `platform/` folder (for `emissions`) makes it ambiguous which Pages serves. `cleanUrl` strips `.html` for canonicals and the sitemap.
- **Front matter:** `layout: layouts/base.njk`, `title`, `description`, `permalink`. Optional: `canonicalPath`, `ogImage`, `sitemap: false`, `cta: { heading, text, button, url }`, `rail: true` (loads `rail.js`), `survey: true` (loads `survey.js`), `stepper: true` (loads `stepper.js`), `compare: true` (loads `compare.js`), `pageClass` (a class on `<main>`; `page--spacious` gives fluid section spacing from the `--space-section*`, `--space-band` and `--space-head` tokens, on trial on `/ldar`).
- **Shell:** `layouts/base.njk` (meta, OG/Twitter, Organization JSON-LD on home, GA) + `_includes/partials/`. Menus and footer, social and legal links come from `src/_data/nav.json`.
- **Header:** from 64rem up, Industry, Programs and Platform open a full-width panel on hover/focus in pure CSS; below that, a drawer. `nav.json` holds the panel content: `intro` per menu; `blurb` plus `icon` (in `static/img/icons/`) or `image` per child.
- **Scripts:** `static/js/menu.js` (drawer, accordions, amber bar under the hovered item, footer animation, stat count-up, `data-play-once`) is the only page script besides GA, the 404 page's inline script, the redirect pages and `static/js/rail.js` (arrows for a `.rail` card row; only on pages with `rail: true`; no page uses it since `/ldar` moved to a bento grid) and `static/js/survey.js` (only with `survey: true`, currently `/ldar`): a diagram on `<canvas class="survey-canvas">`, inside a `.survey-panel` under the stat row, in the `--color-survey-*` tokens. One facility record branches to pads, equipment and components; pulses run out to the components, and amber dots are leak findings; when a pulse reaches one, a navy "WO" (work order) tag flashes above it. It loops, so it carries a pause button (WCAG 2.2.2), stops offscreen and in background tabs, and draws one still frame under reduced motion; brand blue only on the record node and the pulses, over a gray radial glow centered on the record; without JS the glow shows empty. `static/js/stepper.js` (only with `stepper: true`, currently `/ldar` "How it works") turns a `.stepper` into steps beside one blue stage: each `.stepper-title` becomes a button that opens its step and shows its `.stepper-media` (same order); without JS every step and screen shows, stacked. (`.steps` is a different component, the numbered list on the home page.) `static/js/compare.js` (only with `compare: true`, currently `/pricing`): in the compare table, check marks draw in row by row as they scroll into view, and hovering or focusing a row tints it and marks the tier where that capability starts (its cell and column head); without JS or with reduced motion every mark shows as is.
- **Headline runs and placeholders (`/ldar`):** `.headline-run` puts a heading and its explanation in one text block (bold statement, then a softer `<span>` at the same size), in place of a separate lead. The hero's `.hero-shots` pairs a record card image, built like the `/assets` hero image, with the Trek home screen in a phone frame over its lower-left corner. `.mock` draws a product screen as a skeleton (one per `.bento` card; no longer tagged "Placeholder"); replace each with a real screenshot before going live. Also from the Stripe-style pass: `.feature-runs` (bold title running into its explanation, under an amber tick; `--stack` for one column), `.stat-row` (numbers split by thin rules, not boxed; `--stack` for a column), `.top-cards` (Stripe's enterprise layout in the `.bento-card` look: light gray cards on a six-column grid; `--wide` spans four and puts its diagram in a white `.top-card-panel` above the text, `--fill` is a solid blue card for a rule or quote; on `/ldar` the wide card holds `.leak-clock`, bars showing how long subpart W counts a found leak as open by survey cadence; bento and top cards both use `--color-section-alt`, so their sections stay white), `.infra-split` + `.hub` (navy section with a diagram of one record feeding several programs) and `.story` (client quote card beside its numbers).
- **Stat count-up:** `menu.js` counts each `.stat` up from zero once (1.6 s) when it scrolls into view: plain figures of 10 or more with an optional `$` or `+` before and `%`, `+`, `k` or `x` after. Anything else, prices (`.price`) and `data-count="off"` stay static; the figure in the HTML is what shows without JS or with reduced motion, and screen readers get a hidden copy.
- **Play once:** `data-play-once` on an element makes `menu.js` add `.is-armed` (first frame) and then `.is-in` when it scrolls into view; the component's CSS defines both. Used by `.fan` on `/platform/emissions` (one reading fanning out to six outputs; hovering an output lights its curve), and on `/spcc` by `.berm-check` (the largest tank drains into its containment; the line is "largest tank plus freeboard", 40 CFR 112's wording, not a 110% rule) and `.plan-stage` (a PE stamp lands on a calc sheet). The emissions hero's `.limit-chart` (total crosses the permit limit, a work order drops in) plays on load in CSS alone.
- **Footer:** inline SVG in `partials/footer-art.njk` (`--color-sketch-*` tokens) that `menu.js` plays once on scroll-in; without JS or with reduced motion it shows finished. Nothing loops: motion over 5 s needs a pause control (WCAG 2.2.2).
- **Contact form:** posts to Web3Forms, which emails the access key's inbox (should be sales@assetas.com) and sends the visitor to `/contact-thanks` (free plan: same-domain redirects only). Each field's `name` is its label in the email, so keep names readable. `email` is required and becomes the reply-to. Spam control: the hidden `botcheck` honeypot; Web3Forms' free hCaptcha is next. `formAction: ""` disables the form.
- **Trek downloads:** zips live on the GitHub Release `trek-v4.0.2.0` (Trek_x64.zip exceeds git's 100 MB limit). New version: publish a new release and update `site.trekRelease`.
- **404 page:** `src/404.njk`, served at any missing URL. Its inline script uses the `pageIndex` filter (`eleventy.config.js`) and `redirects.json` to forward near misses (wrong case, since Pages URLs are case-sensitive; trailing slash; `.htm`; dashes or underscores), else lists up to three closest pages. Works without JS.
- **Redirects:** no server redirects on Pages. Add `{ from, to, note }` to `src/_data/redirects.json`; `src/redirects.njk` makes each a meta-refresh + JS forwarding page (keeps `#hash`, canonical to target, noindex).
- **Static files:** `src/static/` publishes to `/static/` (not `/assets/`, which is a page).
- **LDAR rule map (`/ldar-rule-map`):** a hidden page (not in nav or sitemap), linked from the `/ldar` stat row. Static HTML as of November 19, 2026: rows, statuses, sources, the per-segment counts in its stat row and the date are all written in `src/ldar-rule-map.njk`, in `.rule-table`s. Edit them by hand and recheck every status when you change the date.

## Design rules

- **Tokens:** `src/static/css/tokens.css` defines every color, font, size and spacing value, with contrast notes. `main.css` uses only tokens, with no raw colors, font sizes or spacing; add a token if the scale lacks one. `/design-system` (not in nav or sitemap) is the visual reference.
- **Blueprint look:** brand blue (`--color-brand`, #006dff) is a surface with a drafting grid: every `.hero` and the closing `.cta-band`. Pages are white with light gray alternate sections (`--color-section-alt`, #f4f5f7) and ice panels (`--color-surface`, #edf4ff); navy (`--color-dark`, #021b4e) carries the header, dark bands and the footer. Inter is the only font. Header and footer use `img/brand/assetas-logo-dark-theme.svg` (white wordmark, brand-blue alpha); focus rings on the navy header bar are amber (`--color-focus-on-dark`).
- **Color:** small blue text is `--color-accent-text` (#0058d6). Amber (`--color-amber`, #ffc21a) is the main action on blue and the accent on navy, never text on white. Big numbers on blue: `--color-amber-light` (#ffd352).
- **Closing band:** every page ends with `partials/cta-band.njk`, with its defaults or a sharper industry line via `cta:`.
- **Components:** change layout per component in `main.css`, not per page, so the whole site improves together.
- **Videos:** `<video autoplay muted loop playsinline controls poster="…" width="1280" height="720">`. Keep `controls` (visitors pause or unmute); no `preload="none"` (delays playback). Wrap each one, alone, in `<div class="media media--video">` inside the section's `.container`, which sets the shared width (`--video-width`), centering and rounded 16:9 frame. No per-video size or alignment classes; to resize all videos, change `--video-width`. Import new videos with `import-media.mjs`.

## Voice and tone

Applies to all new or rewritten copy: page text, headings, buttons, `nav.json` intros and blurbs, titles, meta descriptions, alt text. Best examples: `index.njk`, `platform.njk`, `spcc.njk`, `about.njk`.

**Reader:** operations, maintenance and EHS/compliance leads at oil & gas operators, municipalities and utilities, defense installations and infrastructure owners. They know their regulations; don't explain the basics.

**Voice:** an operator who has been through an audit. Confident, plain, specific, a little dry; not a software marketer.
- Name the real thing (berm, wellhead, work order, PE stamp, 40 CFR 98 subpart W, PHMSA, NPDES, DoDI 4151.22), not "solutions", "seamless" or "assets of all kinds".
- Short declarative sentences; fragments are fine ("One data model. Full audit trail.").
- The reader's problem in their terms first, then what Assetas does ("Reports rebuilt by hand in every emissions cycle").
- Back every claim with a sourced number, a named regulation or a named client. No hype words (best-in-class, cutting-edge, revolutionary, unlock, empower, leverage, game-changer), no exclamation marks.
- "You/your" for the reader ("your crews"), "we" for Assetas ("We speak O&G"). Customers are "clients".
- AI is a tool that works on the record: say what each model does and what data it reads. No magic.
- Reuse, don't invent slogans: *Where X meets Y*; one record / one data model / one source of truth; capture once, report from the same record; from the field to the filing; audit-ready by default, not rebuilt when the auditor calls; offline, timestamped, geotagged field capture.

| Element | Pattern |
|---|---|
| H1 | "Where X meets Y." X operational, Y accountability, both concrete ("Where the wellhead meets the regulator.") |
| H2 | Short sentence-case statement with a period ("Three workflows, one record.") |
| H3, card title | Sentence-case noun phrase, no period |
| Eyebrow | 2–4 words, sentence case ("How it works"); platform pages use `Platform/<Name>` |
| Lead | 1–2 sentences, ≤ ~35 words: what it does and for whom |
| Card text | 1–2 sentences, ≤ ~30 words |
| Buttons | Sentence case. Main: "Book a demo" → `/contact`. Second: "See the platform" or a specific "See how it works". Links to documents or other sites end in ↗ |
| Links | Say where they go ("Explore oil & gas"). A kept "Learn more" gets a `visually-hidden` suffix naming the target |
| Title | "<What it is> \| Assetas", under 60 characters |
| Description | 120–160 characters naming the record types or regulations; no call to action |
| Alt text | What the image shows in its operational context, no "image of". Decorative icons: `alt=""` |

**Mechanics:** American English, Oxford comma. Spaced em dash ( — ) for asides, not an en dash. "&" in titles, nav labels and headings ("Oil & Gas"); "and" in sentences. Numerals for stats ("92%"). Write regulations and agencies as they write themselves (EPA, PHMSA, SPCC, LDAR, Title V); don't expand acronyms the sector uses daily. Capitalize product and module names: Assetas, Trek, Unified Asset Intelligence, Smart Forms & Tasks, Workflow Automation, Compliance & Emissions.

**Never invent** customers, stats, quotes, certifications or regulatory claims: put a placeholder in the page and add it to Open items. Don't reword existing copy while working on something else; copy rewrites are separate tasks.

## GitHub Pages limits

Same on every plan; the free plan needs a public repo. As of November 2026 the built site and `.git` were each about 45 MB. Measure current usage with the `github-pages-usage` skill.
- **Hard:** published site ≤ 1 GB; source repo should stay under 1 GB; git warns over 50 MB and rejects files over 100 MB, so large downloads go on a GitHub Release like Trek (2 GB per file, outside Pages bandwidth); a deploy fails after 10 minutes. The 10-builds-an-hour limit doesn't apply to our Actions workflow.
- **Soft:** 100 GB bandwidth a month; GitHub may return `429` in big spikes. Videos use most of it, so compress them with `import-media.mjs`. GitHub doesn't report bandwidth; watch GA4.
- **Usage policy:** a marketing site is fine; no e-commerce, SaaS, or collecting passwords or payments. Forms post to Web3Forms.
- **No server features:** no server redirects (use `redirects.json`), custom headers, access control or server code. One custom domain; the apex redirects to `www`.

## Going live on www.assetas.com

Nothing changes in DNS until we decide to go live. Then:
1. Verify `assetas.com` in the GitHub org settings (Pages → verified domains) to prevent domain takeover.
2. Set the repo's custom domain to `www.assetas.com` (commits a `CNAME` file). In `deploy.yml`, set `SITE_ENV: production` in the `build` job's `env`, not just the build step: the check step's `eleventy --serve` rebuilds `_site`, and that rebuild is what gets uploaded. Change both `http://localhost:8080/Website/` URLs in the check step to `http://localhost:8080/`. Production drops `noindex` and turns on GA4 `G-HJYFX0NXR6`.
3. DNS is at GoDaddy: `www` CNAME → `assetas.github.io`; apex `@` A records → GitHub's four Pages IPs (plus AAAA). Lower TTLs a day ahead. **Email is Microsoft 365: leave MX, SPF, DKIM, autodiscover and other TXT records alone.**
4. Turn on "Enforce HTTPS" once the certificate is issued (up to about an hour).
5. Submit the sitemap in Google Search Console; watch for 404s for two weeks.
6. Keep the current host about 30 days as a fallback; confirm no forms or email still depend on it before cancelling.

The preview's `robots.txt` isn't at a domain root, so crawlers ignore it; the page-level `noindex` keeps the preview out of search.

## Open items

**Waiting on input:**
- `/ldar` product placeholders: real screenshots for five bento cards (follow-up chain, Delay of Repair, hierarchy roll-up, emissions, export). The drawn mocks are no longer tagged "Placeholder", so nothing on the page marks them. The capture card is done: a filled record from a Trek inspection (CC 609-33, Enardo stuck open) beside the field photo `img/ldar/tank-battery-enardo-finding.webp`; its GPS is 39.533247, -108.022802. The hero record card (`img/ldar/hero-leak-record.webp`) is a rendered mock with sample data (LF-2187, Tank battery 3, 2,418 components); swap it for a real screen when one exists.
- `/ldar` (version 6 of the LDAR redesign): confirm the new claims before going live — the subpart W leak-duration point (40 CFR 98.233(q), Equation W-30), the "Every leak costs you three ways" stat row — 25+ (EPA, LDAR Best Practices Guide, EPA-305-D-07-001, 2007, §3.2 and Appendix A: 25 federal standards require a formal Method 21 LDAR program; the "+" counts later rules such as NSPS VVa, GGGa, OOOOa, and OOOOb, so confirm the wording; its source line reads "EPA, See LDAR rule map, 2026" and links to `/ldar-rule-map`, which Assetas compiled, not EPA), $1,500 (Waste Emissions Charge, Clean Air Act §136(c): $900/t for 2024, $1,200 for 2025, $1,500 for 2026 on, for facilities over 25,000 t CO2e a year; the One Big Beautiful Bill Act, July 4, 2025, delayed it to 2034, and the implementing rule (40 CFR 99) was repealed under the CRA and removed May 13, 2025, so nothing is collected now), (company names other than clients stay off the page) and 28x GWP (40 CFR 98 Table A-1) — the EU Methane Regulation FAQ answer, and the "US regulations" section's descriptions of NSPS OOOOB/C, subpart W, and Colorado Regulation 7. The meta description is about 167 characters, over the 160 target.
- `/ldar-rule-map` (as of November 19, 2026): confirm the rows with whoever owns regulatory claims before going live. Pending changes to watch: OOOOb/c reconsideration (Oct 29, 2026 proposal), OOOOc state plans (due Jan 22, 2027), BLM 3179 replacement (June 24, 2026 proposal), the withdrawn PHMSA LDAR rule (S. 2508), and the proposed subpart W suspension to 2034, which would also affect the `/ldar` copy built on subpart W. California, New Mexico and Wyoming details come from secondary sources (ITRC, Stateline, IEA); swap in the rule text. Not yet mapped: OH, WV, ND, OK, LA, and NJ/IL/DE refinery rules.
- `/defense` Air Force stats: 92% is paired with check-in time and 80% with lost-tool search (the Home pairing). Confirm with whoever owns the numbers.
- Real documents for "Download brief" (`/defense`, now → `/contact`) and "Read the full story" (`/oilandgas`, now → the Smart Forms case study PDF).
- A destination for "Talk to our engineer" (`/ai`, `/reporting`, `/spcc`, `/telemetry`): it goes to `/contact`, like the "Book a demo" beside it.
- Legal review of `/privacy` (dated July 24, 2017; keep its wording until then).
- Contact form: send one test from the preview and confirm it reaches sales@assetas.com.
- `/pricing` compare table: confirm the tier values with whoever owns pricing on Bulk-import existing records, Score criticality & lifecycle, Track permit limits & deviations, Submit electronic reports, Run LDAR programs, Keep SPCC plans current, Audit log retention, Export logs to your SIEM, Require multi-factor sign-in, Get security documentation. Their tooltips reuse claims from `/assets`, `/compliance`, `/platform/emissions`, `/ldar`, `/spcc`, `/security`.
- Preview analytics: `site.gaId` is empty on the preview; create a separate GA4 property if visitor data is wanted before going live.

**Copy to review:**
- `nav.json` intros and blurbs; `/programs` page text.
- Off-voice: H1 and description on `/telemetry` (ends "with us!") and `/reporting`; calls to action in the `/reporting` and `/trek` descriptions.
- Titles over 60 characters (`/industry`, `/ldar`, `/spcc`) or not in "<What it is> | Assetas" form (`/about`, `/pricing`, `/trek`).

**Backlog:**
- Spacing: `page--spacious` (fluid section padding up to 128px, 160px for hero, dark and closing bands, 64px under section heads) is on trial on `/ldar`. If it holds up, move those values into `.section`, `.section--dark`, `.cta-band`, the heroes and `.section-head` for every page, then drop `pageClass: page--spacious` and its rules.
- Closing bands: 8 pages end with a white `.section.closing`, 6 hand-write a two-button blue band, and `/municipality` uses a navy `cta-band--dark`. Move them all to `partials/cta-band.njk` (it needs a second-button option first), and remove its `cta.accent` flag and `cta-band--accent` class, which no longer change anything.
- Tokens: replace the ~65 raw spacing values and the raw font sizes in `main.css` with tokens.
- Lighthouse pass after the Blueprint redesign (accessibility was 100 on every page before it).
- Performance: responsive images with `srcset` (`@11ty/eleventy-img`), preloaded fonts, no layout shift. Target 95+ in every Lighthouse category.
- Accessibility: captions or transcripts for any video with narration.
- SEO: SoftwareApplication structured data (Organization is done).
- Pricing is linked only from the header and footer; add contextual links where they fit.

**Decided, don't reopen without asking:** Industry, Programs and Platform stay the menu groups; `/oilandgas`, `/ldar` and `/spcc` stay separate pages; Pricing has no FAQ; Security stays under Platform.
