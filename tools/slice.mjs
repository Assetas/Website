// Cut a tall full-page screenshot into viewport-sized slices that are easier to look at.
//
//   node tools/slice.mjs <page-slug> [desktop|tablet|mobile] [sliceHeight]
//
// Writes reference/pages/<slug>/slices/<width>-NN.png
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [slug, size = "desktop", h = "1100"] = process.argv.slice(2);
if (!slug) throw new Error("usage: node tools/slice.mjs <page-slug> [desktop|tablet|mobile] [sliceHeight]");
const dir = path.resolve("reference/pages", slug);
const src = path.join(dir, `${size}.png`);
const outDir = path.join(dir, "slices");
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(src).href);
const { width, height } = await page.evaluate(() => {
  const img = document.querySelector("img");
  return { width: img.naturalWidth, height: img.naturalHeight };
});
await page.setViewportSize({ width, height: Math.min(height, 16000) });
await page.addStyleTag({ content: "body{margin:0} img{display:block}" });
const step = Number(h);
let n = 0;
for (let y = 0; y < height; y += step) {
  const file = path.join(outDir, `${size}-${String(n).padStart(2, "0")}.png`);
  await page.screenshot({ path: file, clip: { x: 0, y, width, height: Math.min(step, height - y) }, fullPage: true });
  n++;
}
await browser.close();
console.log(`${n} slices -> ${outDir}`);
