// Print what's needed to rebuild a page: meta, body text, links, images and inline SVGs.
//
//   node tools/page-brief.mjs <slug>
import fs from "node:fs/promises";
import path from "node:path";

const slug = process.argv[2];
const dir = path.resolve("reference/pages", slug);
const d = JSON.parse(await fs.readFile(path.join(dir, "page.json"), "utf8"));
const text = await fs.readFile(path.join(dir, "text.txt"), "utf8");

// Body text only: drop the header (up to "Sign in") and footer (from the footer tagline on).
const start = text.indexOf("\nSign in\n");
const end = text.indexOf("Where Operational Technology meets compliance");
const body = text.slice(start === -1 ? 0 : start + 9, end === -1 ? undefined : end).replace(/​/g, "").replace(/\n{2,}/g, "\n");

console.log(`TITLE: ${d.title}\nDESC: ${d.description}\n`);
console.log("TEXT:\n" + body.trim() + "\n");
console.log("LINKS:");
for (const l of d.links) if (!l.inHeader && !l.inFooter) console.log(`  ${l.text || "(no text)"} -> ${l.href.replace("https://www.assetas.com", "")}`);
console.log("IMAGES:");
const seen = new Set();
for (const i of d.images) {
  const m = i.src.match(/\/media\/([^/]+)/);
  if (!m || seen.has(m[1]) || i.inHeader || i.inFooter) continue;
  seen.add(m[1]);
  console.log(`  ${m[1]} | ${i.alt} | ${i.width}x${i.height}${i.background ? " bg" : ""}`);
}
console.log("VIDEOS: " + [...new Set((d.videoRequests || []).map((u) => u.match(/video\/([^/]+)/)?.[1]).filter(Boolean))].join(", "));
try {
  const svgs = JSON.parse(await fs.readFile(path.join(dir, "svgs", "index.json"), "utf8"));
  console.log("SVGS:");
  for (const s of svgs) console.log(`  ${s.file} ${s.width}x${s.height} @${s.top} "${s.near}" ${s.bytes}b`);
} catch {}
if (d.iframes.length) console.log("IFRAMES: " + d.iframes.join(", "));
