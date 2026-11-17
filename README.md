# Assetas website

This is a static rebuild of www.assetas.com, made with [Eleventy](https://www.11ty.dev/) and deployed to GitHub Pages. See [PLAN.md](PLAN.md) for the migration plan.

## Run locally

Requires Node 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:8080/Website/. The preview build serves everything under `/Website/`, the same as GitHub Pages does.

## Build

```bash
npm run build                      # preview build: /Website/ prefix, noindex
SITE_ENV=production npm run build  # production build: www.assetas.com, indexable, live GA4
```

The output goes to `_site/`. A push to `main` builds and deploys automatically through `.github/workflows/deploy.yml`.

## Where things are

| Path | What |
|---|---|
| `src/*.njk`, `src/platform/*.njk` | One file per page. Each file's `permalink` keeps the live site's URL. |
| `src/_includes/layouts/base.njk` | The page shell: `<head>`, header, footer |
| `src/_includes/partials/` | Header, footer, and reusable sections |
| `src/_data/site.js` | Site URL, path prefix, noindex flag, GA4 ID |
| `src/_data/nav.json` | Header menus and footer links |
| `src/static/` | CSS, JS, images, video and files, published at `/static/`. It isn't called `assets/` because the live site already has an `/assets` page. |

Write internal links as root-relative paths (`/contact`, `/static/...`). Eleventy's HTML base plugin adds the `/Website/` prefix on the preview build.
