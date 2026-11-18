// Copy an original image, video or file into the site, resized and compressed for the web.
//
//   node tools/import-media.mjs <source> <dest> [--width 1600] [--quality 80]
//
// <source>  path to the original file
// <dest>    path under src/static/ without an extension, e.g. img/home/hero-card
//
// Images  -> src/static/<dest>.webp  (resized to --width, never upscaled; transparency kept)
// SVGs    -> src/static/<dest>.svg   (copied as-is)
// Videos  -> src/static/<dest>.mp4   (H.264, max 1280 wide, CRF 28, no audio unless --audio, +faststart)
//            src/static/<dest>.jpg   (poster frame from 1s in)
// Other   -> src/static/<dest>.<ext> (copied as-is)
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? def : args[i + 1];
};
const positional = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
const [source, dest] = positional;
if (!source || !dest) throw new Error("usage: node tools/import-media.mjs <source> <dest> [--width 1600] [--quality 80] [--audio]");

const src = source;
if (!(await fs.stat(src).then(() => true, () => false))) throw new Error(`not found: ${src}`);
const ext = path.extname(src).toLowerCase();
const base = path.join("src/static", dest);
await fs.mkdir(path.dirname(base), { recursive: true });
const kb = async (p) => `${Math.round((await fs.stat(p)).size / 1024)} KB`;

if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"].includes(ext)) {
  const width = Number(opt("width", 1600));
  const quality = Number(opt("quality", 80));
  const out = `${base}.webp`;
  const info = await sharp(src).rotate().resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(out);
  console.log(`${src} (${await kb(src)}) -> ${out} ${info.width}x${info.height} (${await kb(out)})`);
} else if (ext === ".svg") {
  const out = `${base}.svg`;
  await fs.copyFile(src, out);
  console.log(`${src} -> ${out} (${await kb(out)})`);
} else if ([".mp4", ".mov", ".webm"].includes(ext)) {
  const out = `${base}.mp4`;
  const poster = `${base}.jpg`;
  const audio = args.includes("--audio") ? ["-c:a", "aac", "-b:a", "96k"] : ["-an"];
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", src, "-vf", "scale='min(1280,iw)':-2", "-c:v", "libx264", "-preset", "slow", "-crf", opt("crf", "28"), "-pix_fmt", "yuv420p", ...audio, "-movflags", "+faststart", out]);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", "1", "-i", src, "-frames:v", "1", "-vf", "scale='min(1280,iw)':-2", "-q:v", "4", poster]);
  console.log(`${src} (${await kb(src)}) -> ${out} (${await kb(out)}), poster ${poster} (${await kb(poster)})`);
} else {
  const out = `${base}${ext}`;
  await fs.copyFile(src, out);
  console.log(`${src} -> ${out} (${await kb(out)})`);
}
