// Phase 1: download original-resolution media listed in reference/media.json (written by capture.mjs).
//
//   npm run download-media                     # images, videos, PDFs
//   npm run download-media -- --with-archives  # also the Trek .zip downloads (~190 MB)
//
// Writes into reference/media/{images,videos,files}/ and reference/media/manifest.json,
// which maps each saved file to its original URL and the pages that use it.
// Files that already exist are skipped, so it's safe to re-run.

import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";

const OUT = path.resolve("reference/media");
const withArchives = process.argv.includes("--with-archives");
const media = JSON.parse(await fs.readFile("reference/media.json", "utf8"));

// static.wixstatic.com/media/<file>/v1/fill/w_..,h_../<name> -> static.wixstatic.com/media/<file>
function originalImage(url) {
  const u = new URL(url);
  if (u.hostname === "static.wixstatic.com" && u.pathname.startsWith("/media/")) {
    const file = u.pathname.split("/")[2];
    return { url: `https://static.wixstatic.com/media/${file}`, name: file };
  }
  if (u.hostname === "static.wixstatic.com" && u.pathname.startsWith("/shapes/")) {
    return { url: `${u.origin}${u.pathname}`, name: path.basename(u.pathname) };
  }
  return null; // ignore tracking pixels, Wix UI sprites, etc.
}

// Wix serves video as HLS; the progressive MP4 lives at video.wixstatic.com/video/<id>/<quality>/mp4/file.mp4.
function videoId(url) {
  return url.match(/video\.wixstatic\.com\/video\/([^/]+)/)?.[1] || null;
}

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
  return (await fs.stat(dest)).size;
}

const manifest = [];
const add = (kind, file, url, pages, size) => manifest.push({ kind, file, url, pages, bytes: size });

// Images: de-duplicate by original file.
const images = new Map();
for (const [url, pages] of Object.entries(media.images)) {
  const o = originalImage(url);
  if (!o) continue;
  const entry = images.get(o.name) || { ...o, pages: new Set() };
  pages.forEach((p) => entry.pages.add(p));
  images.set(o.name, entry);
}

// Videos: de-duplicate by Wix video id.
const videos = new Map();
for (const [url, pages] of Object.entries(media.videos)) {
  const id = videoId(url);
  if (!id) continue;
  const entry = videos.get(id) || { id, pages: new Set() };
  pages.forEach((p) => entry.pages.add(p));
  videos.set(id, entry);
}

let failed = 0;
console.log(`Images: ${images.size}`);
for (const img of images.values()) {
  const dest = path.join(OUT, "images", img.name);
  try {
    const size = (await exists(dest)) ? (await fs.stat(dest)).size : await download(img.url, dest);
    add("image", path.relative("reference", dest), img.url, [...img.pages].sort(), size);
  } catch (e) { failed++; console.log(`  FAIL ${img.url}: ${e.message}`); }
}

console.log(`Videos: ${videos.size}`);
for (const v of videos.values()) {
  const dest = path.join(OUT, "videos", `${v.id}.mp4`);
  let saved = false;
  for (const q of ["1080p", "720p", "480p", "360p"]) {
    const url = `https://video.wixstatic.com/video/${v.id}/${q}/mp4/file.mp4`;
    try {
      const size = (await exists(dest)) ? (await fs.stat(dest)).size : await download(url, dest);
      add("video", path.relative("reference", dest), url, [...v.pages].sort(), size);
      saved = true;
      break;
    } catch {}
  }
  if (!saved) { failed++; console.log(`  FAIL video ${v.id}`); }
}

console.log(`Files: ${Object.keys(media.files).length}`);
for (const [url, pages] of Object.entries(media.files)) {
  const u = new URL(url);
  const name = u.searchParams.get("dn") || path.basename(u.pathname);
  if (/\.zip$/i.test(name) && !withArchives) { console.log(`  skip ${name} (use --with-archives)`); continue; }
  const dest = path.join(OUT, "files", name);
  try {
    const size = (await exists(dest)) ? (await fs.stat(dest)).size : await download(url, dest);
    add("file", path.relative("reference", dest), url, pages, size);
  } catch (e) { failed++; console.log(`  FAIL ${url}: ${e.message}`); }
}

await fs.writeFile(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
const mb = (manifest.reduce((s, m) => s + m.bytes, 0) / 1e6).toFixed(1);
console.log(`Saved ${manifest.length} file(s), ${mb} MB. ${failed} failure(s).`);
if (failed) process.exitCode = 1;
