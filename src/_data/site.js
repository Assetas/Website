// Site-wide settings. Build with SITE_ENV=production at cutover to switch to the real domain.
const production = process.env.SITE_ENV === "production";

export default {
  name: "Assetas",
  production,
  // The preview lives at https://assetas.github.io/Website/ until cutover.
  url: production ? "https://www.assetas.com/" : "https://assetas.github.io/Website/",
  pathPrefix: production ? "/" : "/Website/",
  // Keep the preview out of search engines so it can't compete with the live site.
  noindex: !production,
  // The live site's GA4 property is G-HJYFX0NXR6. The preview should get its own property;
  // leave it empty to turn analytics off.
  gaId: production ? "G-HJYFX0NXR6" : "",
  appUrl: "https://app.assetas.com/",
  statusUrl: "https://app.assetas.com/SystemHealth",
  year: new Date().getFullYear(),
  // Where the contact form posts. FormSubmit emails each submission to sales@assetas.com.
  // The first submission sends FormSubmit's one-time activation email to that address; after
  // activating, FormSubmit offers a random alias you can use here instead of the plain address.
  // Set to "" to disable the form (it then shows a notice and a disabled Submit button).
  formAction: "https://formsubmit.co/sales@assetas.com",
  // Trek app packages are published as a GitHub Release (they're too big for the repo).
  trekRelease: "https://github.com/Assetas/Website/releases/download/trek-v4.0.2.0",
};
