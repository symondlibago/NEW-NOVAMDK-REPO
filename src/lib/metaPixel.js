import { isPrivatePath } from "./analytics";

/* The Meta (Facebook) advertising pixel.
 *
 * John supplied the standard base code from Events Manager, which goes in the
 * document head and fires one PageView on load. It is not pasted into
 * index.html, for two reasons:
 *
 *   1. Head placement loads it on every route, including /intake and /portal.
 *      analytics.js already blocks GA4 on those "per the client's Phase 1
 *      instruction", and an advertising pixel has no better claim to be there
 *      than analytics does.
 *   2. One PageView on load is all the base code sends. This is a single page
 *      app, so every route change afterwards would go unrecorded.
 *
 * So it follows the same shape as GA4 in analytics.js: loaded on demand, never
 * fetched at all on a visit that stays on the private routes, and page views
 * sent by hand on route change.
 *
 * The <noscript> image from Meta's snippet is deliberately left out. Without
 * JavaScript this React app renders nothing at all, so that pixel could only
 * ever record a visit that never happened, and it would fire on the private
 * routes because markup in index.html cannot know the route.
 */

export const PIXEL_ID = "1598274301289115";

/* The only pages the pixel may run on.
 *
 * An allowlist, not a list of exceptions. On 2026-10-13 Meta blocked all
 * website data from www.novamdk.com, reporting that it "may be associated with
 * medical conditions, specific health statuses, or provider/patient
 * relationships". Meta attaches the page URL to every event and there is no
 * supported way to withhold it, so the URLs were the disclosure:
 * /product/semaglutide-glycine-b12-initial names the drug, and
 * /treatments/sexual-health names the condition outright. 27 of the site's 46
 * public routes read like one or the other.
 *
 * It is an allowlist because the blocklist that came before it could not hold.
 * A new treatment, a new category or a renamed slug would have started sending
 * health data again with nobody deciding that it should, which is how this
 * happened once already. Adding a page here is a deliberate act.
 *
 * Home, contact and the blog, agreed with John on 2026-10-14. He also named
 * "about", which has no route yet; add it here when it exists. /legal/* and
 * /sitemap are just as neutral if anyone wants them later, but nothing
 * optimises an ad towards a privacy policy, so they are left out.
 *
 * What this costs: the product page is what the ad spend was optimising
 * towards, and the pixel no longer fires there. That is a real loss, taken
 * knowingly, because Meta was already discarding the data.
 */
const PIXEL_PATHS = ["/", "/contact", "/blog"];

/* "/" matches only itself. Prefix matching it would allow every page there is,
   which is the one mistake this list exists to prevent. */
const pathAllowed = (p) =>
  PIXEL_PATHS.some((base) => p === base || (base !== "/" && p.startsWith(`${base}/`)));

const isBrowser = typeof window !== "undefined";

/* Global Privacy Control, which the Privacy Policy promises to honour in two
   separate sections and which nothing in the codebase read until now. It is a
   signal about sharing for advertising specifically, so an ad pixel is the
   first thing that genuinely has to obey it. Chrome does not send it, Firefox
   and Brave do, and it is a browser level setting rather than a banner. */
function gpcDeclined() {
  if (!isBrowser) return false;
  const gpc = navigator.globalPrivacyControl;
  return gpc === true || gpc === "1" || gpc === 1;
}

/** Whether the pixel is allowed to fire for this path. */
export function pixelAllowed(path) {
  if (!isBrowser) return false;
  if (gpcDeclined()) return false;
  /* The same private routes GA4 is held off: intake, patient portal and the
     staff dashboard. Redundant now that the list above has to say yes, and kept
     anyway: it is the one rule that must never depend on a list being right. */
  if (isPrivatePath(path)) return false;

  const raw = typeof path === "string" && path ? path : window.location.pathname;
  /* Query, hash and a trailing slash come off before matching, so none of them
     can turn an allowed page into an unlisted one or the reverse. */
  const trimmed = (raw.split(/[?#]/)[0] || "/").replace(/\/+$/, "");
  return pathAllowed(trimmed || "/");
}

/* Meta's queue shim, written out rather than pasted in as a minified IIFE.
   Calls made before fbevents.js arrives are pushed onto fbq.queue and replayed
   by the library on load, which is what makes loading on demand safe: the first
   PageView is not lost to the race. */
function installQueue() {
  if (window.fbq) return;
  const fbq = function queued(...args) {
    if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
    else fbq.queue.push(args);
  };
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;
  if (!window._fbq) window._fbq = fbq;
}

let loading = false;
function ensureLoaded() {
  if (!isBrowser || loading) return;
  loading = true;

  installQueue();

  /* autoConfig off, and it has to be set before init or it does nothing.
     Left on, Meta collects automatically: button click text, form field names
     and values it believes are contact details, and page microdata. On a
     telehealth site that is the one behaviour there is no defending, and it is
     the reason a pixel loaded on a product page must not go on to scrape an
     intake form after a client side hop into /intake. Every event this sends
     is one asked for by name below. */
  window.fbq("set", "autoConfig", false, PIXEL_ID);
  window.fbq("init", PIXEL_ID);

  const tag = document.createElement("script");
  tag.async = true;
  tag.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(tag);
}

/**
 * Called on every route change. Loads the pixel the first time it is allowed,
 * then sends one PageView. Returns whether anything was sent.
 *
 * Nothing is passed to Meta beyond the event name. Meta attaches the page URL
 * and referrer itself and there is no supported way to withhold them, which is
 * exactly why the decision this module makes is whether to fire at all rather
 * than what to put in the payload.
 */
export function trackPixelPageView(path) {
  if (!pixelAllowed(path)) return false;
  ensureLoaded();
  window.fbq("track", "PageView");
  return true;
}
