import { HtmlBasePlugin } from "@11ty/eleventy";
import site from "./src/_data/site.js";

export default function (eleventyConfig) {
  // Rewrites root-relative URLs (href="/contact") to include the pathPrefix
  // (e.g. /Website/contact), so the same templates work on the preview and at the root.
  eleventyConfig.addPlugin(HtmlBasePlugin);

  eleventyConfig.addPassthroughCopy({ "src/static": "static" });

  // Absolute URL for canonical tags and the sitemap.
  eleventyConfig.addFilter("absoluteUrl", (path) =>
    new URL(String(path).replace(/^\//, ""), site.url).href
  );

  // "/contact.html" -> "/contact". GitHub Pages serves extensionless URLs from .html files,
  // matching the URLs Wix uses today.
  eleventyConfig.addFilter("cleanUrl", (url) =>
    String(url).replace(/index\.html$/, "").replace(/\.html$/, "")
  );

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    pathPrefix: site.pathPrefix,
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
