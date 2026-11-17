// Check the local build for broken internal links and assets, and for sideways scrolling on phones.
//
//   npm run dev          # in another terminal
//   node tools/check.mjs [--base http://localhost:8080/Website/]
//
// Visits every page in the sitemap, requests every internal href/src once, and reports
// anything that doesn't return 200, plus pages wider than a 390 px phone screen.
import { chromium } from "playwright";

const args = process.argv.slice(2);
const i = args.indexOf("--base");
const base = i === -1 ? "http://localhost:8080/Website/" : args[i + 1];
const origin = new URL(base).origin;

const sitemap = await (await fetch(new URL("sitemap.xml", base))).text();
// The sitemap holds absolute production/preview URLs; map them onto the local base.
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname.replace(/^\/Website\//, "/").replace(/^\//, ""));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
const seen = new Map();
const problems = [];

async function status(url) {
  if (!seen.has(url)) seen.set(url, fetch(url, { method: "GET" }).then((r) => r.status, () => 0));
  return seen.get(url);
}

for (const p of paths) {
  const url = new URL(p, base).href;
  const res = await page.goto(url, { waitUntil: "load" });
  if (!res || res.status() !== 200) { problems.push(`${p || "/"}: page returned ${res?.status()}`); continue; }
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  if (width > 390) problems.push(`${p || "/"}: ${width}px wide at 390px (sideways scroll)`);
  const refs = await page.evaluate(() => [
    ...[...document.querySelectorAll("a[href]")].map((a) => a.href),
    ...[...document.querySelectorAll("[src]")].map((e) => e.src),
    ...[...document.querySelectorAll("link[rel=stylesheet][href]")].map((l) => l.href),
    ...[...document.querySelectorAll("video[poster]")].map((v) => v.poster),
  ]);
  for (const ref of new Set(refs)) {
    if (!ref.startsWith(origin)) continue;
    const clean = ref.split("#")[0];
    const s = await status(clean);
    if (s !== 200) problems.push(`${p || "/"}: ${clean.replace(origin, "")} -> ${s}`);
  }
}
await browser.close();
console.log(`Checked ${paths.length} pages, ${seen.size} internal URLs.`);
console.log(problems.length ? problems.join("\n") : "No problems found.");
if (problems.length) process.exitCode = 1;
