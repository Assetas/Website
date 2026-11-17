# Brand values (captured from www.assetas.com, 2026-11-17)

These values come from the Phase 1 capture (`npm run capture`), which counts the colors, fonts and sizes used across all 26 pages at 1440 px. They're the starting point for the replica. Phase 4 can change them.

## Colors

| Token | Value | Where it's used on the live site |
|---|---|---|
| `--color-text` | `#000000` | Headings, nav, most text |
| `--color-body` | `#3b3b3b` | Body copy, secondary text |
| `--color-surface` | `#f4f4f4` | Page background behind the header and footer, alternate sections |
| `--color-bg` | `#ffffff` | Main content panel (rounded top corners), cards |
| `--color-button` | `#3b3b3b` | Primary buttons ("Book a demo") |
| `--color-accent` | `#cc7722` | Eyebrow labels ("THE OT + COMPLIANCE PLATFORM"), big stat numbers |
| `--color-dark` | `#2c2c2c` | Dark sections and panels |
| `--color-link` | `#006dff` | The dropdown border, and the blue in the logo. Rarely used for text. |
| `--color-border` | `#dadada` | Dividers, outline buttons |

## Fonts

| Role | Live site | Replica | Notes |
|---|---|---|---|
| Body | Wix Madefor Text 400/500/600/700 | **Wix Madefor Text** (Google Fonts) | Same font |
| Headings | Epilogue 600/700 | **Epilogue** (Google Fonts) | Same font |
| Display: quotes, stat numbers, some hero words | Crave Fine 400/700 (licensed through Wix) | **Playfair Display** (Google Fonts) | Free substitute; classes `.display` and `.stat` |
| None visible | Helvetica Neue (licensed through Wix) | Dropped | It's loaded on the live site but no visible text uses it |

## Type scale at 1440 px (live site)

| Element | Size / line height | Weight |
|---|---|---|
| h1 | 67.5px / 1.0 | Epilogue 600 |
| h2 | 47–54px / 1.1–1.25 | Epilogue 600–700 |
| h3, section titles | 36px / 1.25 | Epilogue 600 |
| h4/h5, card titles | 24.75px / 1.5 | Epilogue 600–700 |
| Eyebrow | 15.75px, uppercase | Epilogue 600, accent color |
| Lead paragraph | 20.25px / 1.4 | Madefor 400 |
| Body | 18px / 1.35 | Madefor 400 |
| Small, links, nav | 15.75px / 1.4 | Madefor 400 |
| Stat numbers | 68–91px | Crave Fine 700, accent color |

## Layout patterns seen across pages

- **Header:** logo on the left; Industry and Platform dropdowns, Pricing and Contact in the middle; Sign in and a dark "Book a demo" button on the right. It sits on `#f4f4f4`.
- **Content panel:** white, with large rounded top corners, sitting on the gray page.
- **Hero:** orange eyebrow, a large "Where X meets Y." headline (often with one underlined word), a lead paragraph, two buttons (dark filled and white outline), and a visual or card on the right.
- **Feature list:** icon, card title, short paragraph, "Learn more ↗" link.
- **Testimonial:** a quote in the display serif, with orange stat numbers and their captions.
- **CTA band:** "See where your operations meet your obligations." with a "Book a demo" button.
- **Footer:** on `#f4f4f4`. The logo and tagline are on the left; Industries, Product and Company columns are on the right. Below them are the copyright, Privacy Policy, Terms of Use and System Status.

## Logo

`src/static/img/assetas-logo.png` (1000×242, from the footer). The header uses a larger copy of the same artwork (3257×728) on the live site. It would be worth asking whether an SVG version exists.
