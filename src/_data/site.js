// Site-wide settings. Build with SITE_ENV=production for www.assetas.com.
const production = process.env.SITE_ENV === "production";

export default {
  name: "Assetas",
  production,
  // The preview lives at https://assetas.github.io/Website/.
  url: production ? "https://www.assetas.com/" : "https://assetas.github.io/Website/",
  pathPrefix: production ? "/" : "/Website/",
  // Keep the preview out of search engines so it can't compete with www.assetas.com.
  noindex: !production,
  // G-HJYFX0NXR6 is the www.assetas.com GA4 property. The preview should get its own property;
  // leave it empty to turn analytics off.
  gaId: production ? "G-HJYFX0NXR6" : "",
  appUrl: "https://app.assetas.com/",
  statusUrl: "https://app.assetas.com/SystemHealth",
  year: new Date().getFullYear(),
  // Where the contact form posts: Web3Forms (https://web3forms.com) emails each submission to the
  // address the access key was created for. The key is meant to be public; it only lets people
  // send to that one address. Set formAction to "" to disable the form (it then shows a notice
  // and a disabled Submit button).
  formAction: "https://api.web3forms.com/submit",
  formAccessKey: "c82ea54f-e7bf-4034-9d9c-912587998e52",
  // Trek app packages are published as a GitHub Release (they're too big for the repo).
  trekRelease: "https://github.com/Assetas/Website/releases/download/trek-v4.0.2.0",
};
