import { HtmlBasePlugin } from "@11ty/eleventy";
import site from "./src/_data/site.js";

// "/contact.html" -> "/contact". GitHub Pages serves extensionless URLs from .html files.
const cleanUrl = (url) => String(url).replace(/index\.html$/, "").replace(/\.html$/, "");

export default function (eleventyConfig) {
  // Rewrites root-relative URLs (href="/contact") to include the pathPrefix
  // (e.g. /Website/contact), so the same templates work on the preview and at the root.
  eleventyConfig.addPlugin(HtmlBasePlugin);

  eleventyConfig.addPassthroughCopy({ "src/static": "static" });

  // Absolute URL for canonical tags and the sitemap.
  eleventyConfig.addFilter("absoluteUrl", (path) =>
    new URL(String(path).replace(/^\//, ""), site.url).href
  );

  eleventyConfig.addFilter("cleanUrl", cleanUrl);

  // The pages in the sitemap as JSON, [{ url, label, title, text }], for the 404 page's script: it forwards
  // near-miss URLs and suggests the closest pages. The label is the page's name in nav.json when it
  // has one; URLs are root-relative, without the path prefix.
  eleventyConfig.addFilter("pageIndex", (pages, nav) => {
    const labels = new Map();
    const name = (item) => { if (item.url && !labels.has(item.url)) labels.set(item.url, item.label); };
    nav.header.forEach((item) => { name(item); (item.children || []).forEach(name); });
    nav.footer.forEach((group) => group.links.forEach(name));
    nav.legal.forEach(name);
    const index = pages
      .filter((p) => p.data.sitemap !== false && /(\.html|\/)$/.test(p.url) && p.url !== "/platform/")
      .map((p) => {
        const url = cleanUrl(p.url);
        const title = String(p.data.title || "").replace(/\s*\|\s*Assetas$/, "");
        return { url, label: labels.get(url) || title, title, text: p.data.description || "" };
      });
    return JSON.stringify(index).replace(/</g, "\\u003c");
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    pathPrefix: site.pathPrefix,
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
