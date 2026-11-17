// Screenshot the local build next to the captured live page so they can be compared.
//
//   npm run dev                                 # in another terminal
//   node tools/compare.mjs <slug> [desktop|tablet|mobile] [--scale 0.5] [--base http://localhost:8080/Website/]
//
// Writes reference/compare/<slug>/<size>.png, a side-by-side image: live (left) | new (right),
// cut into slices of 1100 px height (<size>-NN.png) so each one is easy to read.
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const baseIdx = args.indexOf("--base");
const base = baseIdx === -1 ? "http://localhost:8080/Website/" : args[baseIdx + 1];
const scaleIdx = args.indexOf("--scale");
const scale = scaleIdx === -1 ? 1 : Number(args[scaleIdx + 1]);
const [slug, size = "desktop"] = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--base" && args[i - 1] !== "--scale");
if (!slug) throw new Error("usage: node tools/compare.mjs <slug> [desktop|tablet|mobile]");

const WIDTHS = { desktop: 1440, tablet: 768, mobile: 390 };
const width = WIDTHS[size];
const livePng = path.resolve("reference/pages", slug, `${size}.png`);
const outDir = path.resolve("reference/compare", slug);
await fs.mkdir(outDir, { recursive: true });
for (const f of await fs.readdir(outDir)) if (f.startsWith(`${size}-`) && /-\d+\.png$/.test(f)) await fs.rm(path.join(outDir, f));
const newPng = path.join(outDir, `${size}-new.png`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 900 } });
const url = base + (slug === "home" ? "" : slug.replace(/_/g, "/"));
await page.goto(url, { waitUntil: "networkidle" });
// Load lazy images before the full-page shot.
await page.evaluate(async () => {
  document.querySelectorAll('img[loading="lazy"]').forEach((img) => (img.loading = "eager"));
  for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
  scrollTo(0, 0);
});
await page.waitForTimeout(500);
await page.screenshot({ path: newPng, fullPage: true });

// Compose live | new side by side, then slice.
// (Loaded from a file:// page, because about:blank can't show file:// images.)
const sheet = path.join(outDir, `${size}.html`);
await fs.writeFile(sheet, `<!doctype html><style>body{margin:0;display:flex;gap:16px;background:#c00;align-items:flex-start}img{display:block;width:${Math.round(width * scale)}px}</style>
  <img src="${pathToFileURL(livePng).href}"><img src="${pathToFileURL(newPng).href}">`);
const view = await browser.newPage();
await view.goto(pathToFileURL(sheet).href, { waitUntil: "load" });
const heights = await view.evaluate(() => [...document.images].map((i) => i.naturalHeight));
const total = Math.round(Math.max(...heights) * scale);
const pairWidth = Math.round(width * scale) * 2 + 16;
await view.setViewportSize({ width: pairWidth, height: Math.min(total, 16000) });
const step = 1100;
let n = 0;
for (let y = 0; y < total; y += step) {
  await view.screenshot({ path: path.join(outDir, `${size}-${String(n).padStart(2, "0")}.png`), clip: { x: 0, y, width: pairWidth, height: Math.min(step, total - y) }, fullPage: true });
  n++;
}
await browser.close();
console.log(`live ${heights[0]}px | new ${heights[1]}px -> ${n} slices in ${outDir}`);
