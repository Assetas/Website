// Pull the main text of a live page as clean, simple HTML (headings, paragraphs, lists, links, bold/italic).
// Used for long text pages such as /privacy and /terms.
//
//   node tools/extract-richtext.mjs <slug>
//
// Writes reference/pages/<slug>/richtext.html
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const slug = process.argv[2];
const url = "https://www.assetas.com/" + slug.replace(/_/g, "/");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(2500);

const html = await page.evaluate(() => {
  const root = document.querySelector("#PAGES_CONTAINER") || document.querySelector("main");
  const ALLOWED = new Set(["H1", "H2", "H3", "H4", "H5", "H6", "P", "UL", "OL", "LI", "A", "STRONG", "B", "EM", "I", "BR", "U"]);
  const clean = (node) => {
    if (node.nodeType === 3) return node.textContent.replace(/​/g, "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]);
    if (node.nodeType !== 1) return "";
    const inner = [...node.childNodes].map(clean).join("");
    const tag = node.tagName;
    // Wix marks bold with font-weight spans rather than <strong>.
    const weight = parseInt(getComputedStyle(node).fontWeight, 10);
    if (!ALLOWED.has(tag)) {
      if (tag === "SPAN" && weight >= 600 && inner.trim() && !node.closest("h1,h2,h3,h4,h5,h6")) return `<strong>${inner}</strong>`;
      return inner;
    }
    const t = tag === "B" ? "strong" : tag === "I" ? "em" : tag.toLowerCase();
    if (t === "br") return "<br>";
    if (t === "a") {
      const href = node.getAttribute("href") || "";
      return `<a href="${href.replace("https://www.assetas.com", "")}">${inner}</a>`;
    }
    return `<${t}>${inner}</${t}>`;
  };
  // Top-level text blocks only (Wix rich text components), in document order.
  const blocks = [...root.querySelectorAll('[data-testid="richTextElement"]')].filter((b) => !b.parentElement.closest('[data-testid="richTextElement"]'));
  return blocks.map((b) => [...b.children].map(clean).join("\n")).join("\n");
});
await browser.close();

const tidy = html
  .replace(/<(p|h\d|li)>\s*<\/\1>/g, "")
  .replace(/<\/strong>\s*<strong>/g, " ")
  .replace(/\n{2,}/g, "\n");
const out = path.resolve("reference/pages", slug, "richtext.html");
await fs.writeFile(out, tidy);
console.log(`${tidy.length} chars, ${(tidy.match(/<h\d/g) || []).length} headings, ${(tidy.match(/<p>/g) || []).length} paragraphs, ${(tidy.match(/<li>/g) || []).length} list items -> ${out}`);
