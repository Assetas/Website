// Save the inline SVGs on a live page (icons, logos, vector art that Wix inlines rather than serving as images).
//
//   node tools/extract-svgs.mjs <page-slug>      ("home" = the home page)
//
// Writes reference/pages/<slug>/svgs/NN.svg and index.json (size, position, and nearby text for each).
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const slug = process.argv[2];
if (!slug) throw new Error("usage: node tools/extract-svgs.mjs <page-slug>");
const url = "https://www.assetas.com/" + (slug === "home" ? "" : slug.replace(/_/g, "/"));
const outDir = path.resolve("reference/pages", slug, "svgs");
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(2500);
await page.evaluate(async () => {
  for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
});

const svgs = await page.evaluate(() => {
  const out = [];
  for (const svg of document.querySelectorAll("svg")) {
    if (svg.parentElement.closest("svg")) continue;
    const r = svg.getBoundingClientRect();
    if (r.width < 16 || r.height < 16) continue;
    if (svg.closest("header") || svg.closest("footer")) continue;
    // Find the nearest text to help identify the icon.
    let el = svg, near = "";
    while (el && !near) { el = el.parentElement; near = (el?.innerText || "").trim().split("\n")[0]; }
    const clone = svg.cloneNode(true);
    clone.removeAttribute("data-testid");
    if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    out.push({ width: Math.round(r.width), height: Math.round(r.height), top: Math.round(r.top + scrollY), left: Math.round(r.left), near: near.slice(0, 60), markup: clone.outerHTML });
  }
  return out;
});
await browser.close();

const index = [];
for (const [i, s] of svgs.entries()) {
  const file = `${String(i).padStart(2, "0")}.svg`;
  await fs.writeFile(path.join(outDir, file), s.markup);
  index.push({ file, width: s.width, height: s.height, top: s.top, left: s.left, near: s.near, bytes: s.markup.length });
}
await fs.writeFile(path.join(outDir, "index.json"), JSON.stringify(index, null, 2));
console.log(index.map((s) => `${s.file} ${s.width}x${s.height} @${s.top},${s.left} ${s.bytes}b "${s.near}"`).join("\n"));
