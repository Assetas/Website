// Open every collapsed accordion item on a live page and print the questions and answers.
//
//   node tools/extract-accordion.mjs <slug> "<text of the first question>"
//
// Writes reference/pages/<slug>/accordion.json as [{ question, answer }].
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const [slug, firstQuestion] = process.argv.slice(2);
const url = "https://www.assetas.com/" + (slug === "home" ? "" : slug.replace(/_/g, "/"));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(2500);

const first = page.getByText(firstQuestion, { exact: false }).first();
await first.scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);
// The accordion is the nearest ancestor holding several buttons / expandable items.
const container = await first.evaluateHandle((el) => {
  let n = el;
  while (n && n.parentElement) {
    n = n.parentElement;
    if (n.querySelectorAll("[aria-expanded]").length >= 2) return n;
  }
  return el.closest("section");
});
const toggles = await container.asElement().$$("[aria-expanded]");
const items = [];
for (const t of toggles) {
  const question = (await t.innerText()).trim();
  if ((await t.getAttribute("aria-expanded")) !== "true") { await t.click(); await page.waitForTimeout(500); }
  const controls = await t.getAttribute("aria-controls");
  let answer = "";
  if (controls) answer = await page.evaluate((id) => document.getElementById(id)?.innerText || "", controls);
  items.push({ question, answer: answer.trim() });
}
await browser.close();
await fs.writeFile(path.resolve("reference/pages", slug, "accordion.json"), JSON.stringify(items, null, 2));
for (const i of items) console.log(`Q: ${i.question}\nA: ${i.answer}\n`);
