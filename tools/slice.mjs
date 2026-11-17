// Cut a tall full-page screenshot into viewport-sized slices that are easier to look at.
//
//   node tools/slice.mjs <page-slug> [desktop|tablet|mobile] [sliceHeight] [--scale 0.6]
//
// Writes reference/pages/<slug>/slices/<width>-NN.png
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const argv = process.argv.slice(2);
const si = argv.indexOf("--scale");
const scale = si === -1 ? 1 : Number(argv[si + 1]);
const [slug, size = "desktop", h = "1100"] = argv.filter((a, i) => a !== "--scale" && argv[i - 1] !== "--scale");
if (!slug) throw new Error("usage: node tools/slice.mjs <page-slug> [desktop|tablet|mobile] [sliceHeight]");
const dir = path.resolve("reference/pages", slug);
const src = path.join(dir, `${size}.png`);
const outDir = path.join(dir, "slices");
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(src).href);
const natural = await page.evaluate(() => {
  const img = document.querySelector("img");
  return { width: img.naturalWidth, height: img.naturalHeight };
});
const width = Math.round(natural.width * scale);
const height = Math.round(natural.height * scale);
await page.setViewportSize({ width, height: Math.min(height, 16000) });
await page.addStyleTag({ content: `body{margin:0} img{display:block;width:${width}px;height:${height}px}` });
const step = Number(h);
let n = 0;
for (let y = 0; y < height; y += step) {
  const file = path.join(outDir, `${size}-${String(n).padStart(2, "0")}.png`);
  await page.screenshot({ path: file, clip: { x: 0, y, width, height: Math.min(step, height - y) }, fullPage: true });
  n++;
}
await browser.close();
console.log(`${n} slices -> ${outDir}`);
