// Structural audit of the built site: headings, titles, descriptions, images, and external links.
//
//   node tools/audit.mjs [--base https://assetas.github.io/Website/]
//
// Prints one line per page with anything worth a look, then checks every external link once.
import { chromium } from "playwright";

const args = process.argv.slice(2);
const i = args.indexOf("--base");
const base = i === -1 ? "http://localhost:8080/Website/" : args[i + 1];
const origin = new URL(base).origin;

const sitemap = await (await fetch(new URL("sitemap.xml", base))).text();
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname.replace(/^\/Website\//, "").replace(/^\//, ""));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const titles = new Map();
const external = new Map();
let issues = 0;

for (const p of paths) {
  await page.goto(new URL(p, base).href, { waitUntil: "load" });
  const r = await page.evaluate(() => ({
    title: document.title,
    desc: document.querySelector('meta[name="description"]')?.content || "",
    h1: [...document.querySelectorAll("h1")].map((h) => h.innerText.trim()),
    skipped: (() => {
      // A heading level that jumps by more than one (e.g. h2 -> h4) inside main.
      const levels = [...document.querySelectorAll("main h1, main h2, main h3, main h4, main h5, main h6")].map((h) => +h.tagName[1]);
      return levels.some((l, k) => k > 0 && l - levels[k - 1] > 1);
    })(),
    noAlt: [...document.querySelectorAll("img:not([alt])")].map((img) => img.getAttribute("src")),
    links: [...document.querySelectorAll("a[href]")].map((a) => a.href),
    videosNoPoster: document.querySelectorAll("video:not([poster])").length,
  }));
  const notes = [];
  if (r.h1.length !== 1) notes.push(`${r.h1.length} h1`);
  if (r.skipped) notes.push("heading level skipped");
  if (r.noAlt.length) notes.push(`${r.noAlt.length} img without alt`);
  if (!r.desc) notes.push("no description");
  else if (r.desc.length > 160) notes.push(`description ${r.desc.length} chars`);
  if (r.title.length > 65) notes.push(`title ${r.title.length} chars`);
  if (r.videosNoPoster) notes.push(`${r.videosNoPoster} video without poster`);
  (titles.get(r.title) || titles.set(r.title, []).get(r.title)).push(p || "/");
  for (const l of r.links) if (!l.startsWith(origin) && /^https?:/.test(l)) (external.get(l) || external.set(l, new Set()).get(l)).add(p || "/");
  if (notes.length) issues++;
  console.log(`${(p || "/").padEnd(26)} ${notes.length ? notes.join("; ") : "ok"}`);
}
await browser.close();

for (const [t, ps] of titles) if (ps.length > 1) console.log(`DUPLICATE TITLE "${t}" on ${ps.join(", ")}`);

console.log(`\nExternal links (${external.size}):`);
for (const [url, ps] of external) {
  let status;
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow", headers: { "User-Agent": "Mozilla/5.0" } });
    status = res.status;
    res.body?.cancel();
  } catch (e) { status = "ERR " + e.cause?.code; }
  console.log(`  ${String(status).padEnd(4)} ${url}  (${[...ps].length} page${ps.size > 1 ? "s" : ""})`);
}
