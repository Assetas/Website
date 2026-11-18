# Assetas website

This is the www.assetas.com website, made with [Eleventy](https://www.11ty.dev/) and deployed to GitHub Pages.

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
| `src/*.njk`, `src/platform/*.njk` | One file per page. Each file's `permalink` sets its URL. |
| `src/_includes/layouts/base.njk` | The page shell: `<head>`, header, footer |
| `src/_includes/partials/` | Header, footer, and reusable sections |
| `src/_data/site.js` | Site URL, path prefix, noindex flag, GA4 ID |
| `src/_data/nav.json` | Header menus and footer links |
| `src/static/` | CSS, JS, images, video and files, published at `/static/`. It isn't called `assets/` because the site already has an `/assets` page. |

Write internal links as root-relative paths (`/contact`, `/static/...`). Eleventy's HTML base plugin adds the `/Website/` prefix on the preview build.

## License

Copyright © Assetas Inc. All rights reserved. The repository is public so that GitHub Pages can host the site; that doesn't grant any license to the code, text, images, video or Trek downloads. See [LICENSE](LICENSE).
