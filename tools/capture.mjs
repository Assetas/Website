// Phase 1: capture a reference copy of the live Wix site into reference/ (gitignored).
//
//   npm run capture                 # all pages from the live sitemap
//   npm run capture -- contact ai   # only these slugs ("home" = the home page)
//   npm run capture -- --no-shots   # skip screenshots (text, outline, styles, media list only)
//
// For each page this writes reference/pages/<slug>/:
//   desktop.png, tablet.png, mobile.png   full-page screenshots at 1440 / 768 / 390 px
//   page.json                             meta tags, heading outline, sections, links, images, videos, styles
//   text.txt                              visible text, in reading order
// and reference/media.json, a list of every image, video and file across the site.
// Run tools/download-media.mjs afterwards to fetch the originals.

import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const SITE = "https://www.assetas.com";
const OUT = path.resolve("reference");
const WIDTHS = { desktop: 1440, tablet: 768, mobile: 390 };

const args = process.argv.slice(2);
const noShots = args.includes("--no-shots");
const only = args.filter((a) => !a.startsWith("--"));

function slugFor(url) {
  const p = new URL(url).pathname.replace(/^\/|\/$/g, "");
  return p === "" ? "home" : p.replace(/\//g, "_");
}

async function sitemapUrls() {
  const xml = await (await fetch(`${SITE}/pages-sitemap.xml`)).text();
  return [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

// Wix lazy-loads images and video as you scroll, so walk down the page before capturing.
async function scrollThrough(page) {
  await page.evaluate(async () => {
    const step = Math.max(300, Math.floor(window.innerHeight * 0.7));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 150));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });
}

// Runs in the page: pull out everything we need to rebuild it.
function extract() {
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0";
  };
  const meta = (sel) => document.querySelector(sel)?.getAttribute("content") || "";

  const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")]
    .filter(visible)
    .map((h) => ({ level: +h.tagName[1], text: clean(h.innerText) }))
    .filter((h) => h.text);

  // Top-level sections of the page body (Wix wraps each "strip" in a <section>).
  const sections = [...document.querySelectorAll("main section, #PAGES_CONTAINER section")]
    .filter((s) => !s.parentElement.closest("section") && visible(s))
    .map((s) => {
      const cs = getComputedStyle(s);
      return {
        id: s.id,
        top: Math.round(s.getBoundingClientRect().top + scrollY),
        height: Math.round(s.getBoundingClientRect().height),
        background: cs.backgroundColor,
        headings: [...s.querySelectorAll("h1,h2,h3,h4")].map((h) => clean(h.innerText)).filter(Boolean),
        text: clean(s.innerText).slice(0, 2000),
      };
    });

  const links = [...document.querySelectorAll("a[href]")]
    .filter(visible)
    .map((a) => ({
      text: clean(a.innerText) || a.getAttribute("aria-label") || "",
      href: a.href,
      inHeader: !!a.closest("header"),
      inFooter: !!a.closest("footer"),
    }));

  const images = [];
  for (const img of document.querySelectorAll("img")) {
    const src = img.currentSrc || img.src;
    if (!src || src.startsWith("data:")) continue;
    const r = img.getBoundingClientRect();
    images.push({ src, alt: img.alt || "", width: Math.round(r.width), height: Math.round(r.height), inHeader: !!img.closest("header"), inFooter: !!img.closest("footer") });
  }
  for (const el of document.querySelectorAll("*")) {
    const bg = getComputedStyle(el).backgroundImage;
    const m = bg && bg.match(/url\("?(https?:[^")]+)"?\)/);
    if (m) images.push({ src: m[1], alt: "", background: true });
  }
  // Inline SVG shapes / vector art (often the logo).
  const svgs = [...document.querySelectorAll("header svg, footer svg")].slice(0, 10).map((s) => s.outerHTML);

  const videos = [...document.querySelectorAll("video")].map((v) => ({
    src: v.currentSrc || v.src || v.querySelector("source")?.src || "",
    poster: v.poster || "",
    autoplay: v.autoplay,
    loop: v.loop,
    muted: v.muted,
  }));
  const iframes = [...document.querySelectorAll("iframe")].map((f) => f.src).filter(Boolean);

  // Style census: which colors, fonts and sizes are actually used for visible text and backgrounds.
  const tally = (map, key, n = 1) => key && map.set(key, (map.get(key) || 0) + n);
  const color = new Map(), bg = new Map(), font = new Map(), sizes = new Map();
  for (const el of document.querySelectorAll("body *")) {
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (ownText) {
      tally(color, cs.color);
      tally(font, `${cs.fontFamily} | ${cs.fontWeight}`);
      tally(sizes, `${el.tagName.toLowerCase()} ${cs.fontSize}/${cs.lineHeight} ${cs.fontWeight} ${cs.fontFamily.split(",")[0]}`);
    }
    if (cs.backgroundColor !== "rgba(0, 0, 0, 0)") {
      const r = el.getBoundingClientRect();
      tally(bg, cs.backgroundColor, Math.round((r.width * r.height) / 1000));
    }
  }
  const top = (map, n = 25) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);

  return {
    url: location.href,
    title: document.title,
    description: meta('meta[name="description"]'),
    canonical: document.querySelector('link[rel="canonical"]')?.href || "",
    og: {
      title: meta('meta[property="og:title"]'),
      description: meta('meta[property="og:description"]'),
      image: meta('meta[property="og:image"]'),
    },
    pageHeight: document.documentElement.scrollHeight,
    headings,
    sections,
    links,
    images,
    svgs,
    videos,
    iframes,
    styles: { textColors: top(color), backgrounds: top(bg), fonts: top(font), textSizes: top(sizes, 40) },
    text: document.body.innerText,
  };
}

async function capturePage(browser, url, media) {
  const slug = slugFor(url);
  const dir = path.join(OUT, "pages", slug);
  await fs.mkdir(dir, { recursive: true });

  const context = await browser.newContext({ viewport: { width: WIDTHS.desktop, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const videoRequests = new Set();
  page.on("request", (req) => {
    const u = req.url();
    if (u.includes("video.wixstatic.com/video/")) videoRequests.add(u);
  });

  for (const [name, width] of Object.entries(WIDTHS)) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(url, { waitUntil: "load", timeout: 90_000 });
    await page.waitForTimeout(2500);
    await scrollThrough(page);
    await page.waitForTimeout(800);

    if (name === "desktop") {
      const data = await page.evaluate(extract);
      data.videoRequests = [...videoRequests];
      await fs.writeFile(path.join(dir, "text.txt"), data.text);
      delete data.text;
      await fs.writeFile(path.join(dir, "page.json"), JSON.stringify(data, null, 2));

      for (const img of data.images) (media.images[img.src] ||= new Set()).add(slug);
      for (const v of data.videos) if (v.src) (media.videos[v.src] ||= new Set()).add(slug);
      for (const v of videoRequests) (media.videos[v] ||= new Set()).add(slug);
      for (const l of data.links) if (/\/_files\//.test(l.href)) (media.files[l.href] ||= new Set()).add(slug);
    }
    if (!noShots) await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true });
  }
  await context.close();
  return slug;
}

const urls = (await sitemapUrls()).filter((u) => !only.length || only.includes(slugFor(u)));
console.log(`Capturing ${urls.length} page(s) into ${OUT}`);

const media = { images: {}, videos: {}, files: {} };
const browser = await chromium.launch();
const failures = [];
for (const url of urls) {
  try {
    const slug = await capturePage(browser, url, media);
    console.log(`  ok   ${slug}`);
  } catch (err) {
    failures.push(url);
    console.log(`  FAIL ${url}: ${err.message.split("\n")[0]}`);
  }
}
await browser.close();

// Merge with any existing media list so partial runs don't lose entries.
const mediaPath = path.join(OUT, "media.json");
let previous = { images: {}, videos: {}, files: {} };
try { previous = JSON.parse(await fs.readFile(mediaPath, "utf8")); } catch {}
for (const kind of Object.keys(media)) {
  for (const [u, pages] of Object.entries(media[kind])) {
    previous[kind][u] = [...new Set([...(previous[kind][u] || []), ...pages])].sort();
  }
}
await fs.writeFile(mediaPath, JSON.stringify(previous, null, 2));
console.log(`Done. ${failures.length} failure(s).`);
if (failures.length) process.exitCode = 1;
