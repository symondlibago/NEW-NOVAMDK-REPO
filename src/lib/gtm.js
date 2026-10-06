import { isPrivatePath } from "./analytics";

/* Google Tag Manager.
 *
 * John supplied the standard container snippet from GTM's Install dialog, whose
 * instructions say "paste it onto every page of your website". That instruction
 * is written for ordinary sites and is wrong for this one, in the same two ways
 * Meta's was (see metaPixel.js):
 *
 *   1. index.html is every route, including /intake and /portal. GA4 is held
 *      off those "per the client's Phase 1 instruction" and the Meta pixel with
 *      it. A container that can load any tag at all has less claim to be there
 *      than either, not more: whatever John adds to it later would start
 *      running on a questionnaire page without anyone deciding that it should.
 *   2. A container loaded in the head fires its own page view once, on first
 *      load. This is a single page app, so every route after that would go
 *      unrecorded.
 *
 * So it is loaded the same way: on demand, never fetched at all on a visit that
 * stays on the private routes, and a page view pushed by hand on each route
 * change. The container is told the route in `page_path`, so a GTM trigger can
 * be built on it without reading location.href.
 *
 * The <noscript> iframe from the snippet is deliberately left out, for the same
 * reason the pixel's <noscript> image is: with JavaScript off this React app
 * renders nothing, so it could only ever record a visit that never happened,
 * and markup in index.html cannot know which route it is on.
 *
 * WHAT GOES IN THE CONTAINER IS NOT CONTROLLED HERE. Anything John adds in
 * GTM's own UI runs on the public pages with no further code change, which is
 * the point of a container, and is also the risk: a tag added there is a tag
 * nobody reviewed. Two rules for him, both already written into the Privacy
 * Policy's Section 6 undertaking on Consumer Health Data:
 *   - no questionnaire answer, diagnosis, prescription or medication name ever
 *     reaches a tag, which this module enforces by not loading on those routes
 *   - a second copy of the Meta pixel must not be added as a GTM tag. It is
 *     already in the code, in metaPixel.js, and two copies double-count every
 *     PageView and every purchase.
 */

export const GTM_ID = "GTM-MXK78QFB";

const isBrowser = typeof window !== "undefined";

/* Global Privacy Control, honoured here for the same reason metaPixel.js
   honours it: the Privacy Policy promises it in two separate sections, and a
   container whose purpose is marketing tags is squarely what the signal is
   about. Chrome does not send it, Firefox and Brave do. */
function gpcDeclined() {
  if (!isBrowser) return false;
  const gpc = navigator.globalPrivacyControl;
  return gpc === true || gpc === "1" || gpc === 1;
}

/** Whether the container is allowed to run for this path. */
export function gtmAllowed(path) {
  if (!isBrowser) return false;
  if (!GTM_ID) return false;
  if (gpcDeclined()) return false;
  /* The same private routes GA4 and the pixel are held off: intake, patient
     portal and the staff dashboard. */
  return !isPrivatePath(path);
}

/* dataLayer exists before the library arrives, so pushes made during the load
   are replayed rather than lost. That is what makes loading on demand safe. */
function installQueue() {
  if (!Array.isArray(window.dataLayer)) window.dataLayer = [];
}

let loading = false;
function ensureLoaded() {
  if (!isBrowser || loading) return;
  loading = true;

  installQueue();
  /* gtm.start and the gtm.js event are what the snippet's IIFE pushes, written
     out rather than pasted in minified. The container reads both. */
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });

  const tag = document.createElement("script");
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
  document.head.appendChild(tag);
}

/**
 * Called on every route change. Loads the container the first time it is
 * allowed, then pushes one page view. Returns whether anything was pushed.
 *
 * `page_path` is the pathname only, with no query string, matching what GA4 is
 * sent in analytics.js: a token in a URL is not something to hand to a tag, and
 * /intake carries one.
 */
export function trackGtmPageView(path) {
  if (!gtmAllowed(path)) return false;
  ensureLoaded();
  const raw = typeof path === "string" && path ? path : window.location.pathname;
  /* Pathname only. Stripped here rather than trusted from the caller: /intake
     carries a voucher token in its query and a thank-you page carries whatever
     an ad network appended, and a token pushed into the dataLayer is a token
     handed to every tag in the container. */
  window.dataLayer.push({ event: "page_view", page_path: raw.split(/[?#]/)[0] || "/" });
  return true;
}
