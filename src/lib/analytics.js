import { readScanSource, readKioskLocation } from "./kioskLocations";

const isBrowser = typeof window !== "undefined";
const DEBUG = !!(import.meta && import.meta.env && import.meta.env.DEV);

/** The complete catalogue of events we record. Add to this list intentionally. */
export const EVENTS = {
  PAGE_VIEW: "page_view",
  CATEGORY_SELECTED: "category_selected", // chose a treatment goal/category
  BROWSE_TREATMENTS: "browse_treatments", // opened the treatments catalog
  PRODUCT_VIEWED: "product_viewed",       // viewed a product detail page
  START_VISIT: "start_visit",             // launched the MDIntegrations intake (key conversion)
  QUIZ_STARTED: "quiz_started",           // began the guided assessment
  QUIZ_COMPLETED: "quiz_completed",       // finished the guided assessment
  CONTACT_SUBMITTED: "contact_submitted", // submitted the contact form
  CALCULATOR_USED: "calculator_used",     // completed a BMI / goal-weight calculation
  KIOSK_QR_SHOWN: "kiosk_qr_shown",       // a kiosk put a QR on screen for a treatment
  KIOSK_SCAN: "kiosk_scan",               // a phone opened one of those QRs
};

export const GA_MEASUREMENT_ID = "G-4X11DW5WNW";

/* Routes GA4 is not allowed to run on, per the client's Phase 1 instruction:
   intake, patient portal, payment, ID verification and provider review. Those
   last three have no routes of their own — they happen inside the MDI iframe on
   /intake and inside /portal — so gating the two parents covers all five.

   Prefix match rather than equality: /portal and anything beneath it counts.

   /insights is ours rather than a patient's, but it has no business inflating
   the client's traffic numbers with staff reading the dashboard. */
const PRIVATE_PREFIXES = ["/intake", "/portal", "/insights"];

export function isPrivatePath(path) {
  const p = typeof path === "string" && path ? path : isBrowser ? window.location.pathname : "/";
  return PRIVATE_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

/* GA4's own kill switch. The library is one script for the whole tab, so an SPA
   hop from a product page into /intake would otherwise carry a loaded, live
   tracker into the intake. This flag makes it drop everything, including its own
   internal timing pings, for as long as the patient is on those pages. */
function setDisabled(off) {
  if (!isBrowser) return;
  window[`ga-disable-${GA_MEASUREMENT_ID}`] = off;
}

/* Loaded on demand rather than from index.html, so a visit that starts on
   /intake or /portal never fetches the tag at all. */
let loading = false;
function ensureLoaded() {
  if (!isBrowser || loading) return;
  loading = true;

  window.dataLayer = window.dataLayer || [];
  /* Defined before the library arrives: calls queue into dataLayer and are
     replayed once it loads, so nothing fired on a fast first click is lost. */
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }

  const tag = document.createElement("script");
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(tag);

  window.gtag("js", new Date());
  // Page views are sent by hand on route changes, never automatically.
  window.gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });
}

/** Called on every route change. Arms GA4 on public pages, silences it on the
 *  private ones. */
export function applyRouteConsent(path) {
  if (!isBrowser) return false;
  const priv = isPrivatePath(path);
  setDisabled(priv);
  if (!priv) ensureLoaded();
  return !priv;
}

/**
 * Forward to Google Analytics 4 (G-4X11DW5WNW, loaded by ensureLoaded above),
 * and keep the in-memory queue for local debugging.
 *
 * Nothing identifying goes out. Callers pass slugs, ids and category names; no
 * email, name, date of birth or free text from an intake ever reaches here, and
 * page views are sent as pathname only. That matters more than usual on a
 * telehealth site: the page someone views is itself health-adjacent, and the
 * Consumer Health Data Privacy Notice is what discloses that collection.
 */
function send(event, props) {
  if (!isBrowser) return;
  (window.nvAnalytics = window.nvAnalytics || []).push({ event, props, t: Date.now() });
  if (typeof window.gtag === "function") window.gtag("event", event, props);
}

// Don't record anything inside the Design Studio's `?preview` iframe.
function isPreview() {
  return isBrowser && new URLSearchParams(window.location.search).has("preview");
}

/* Attached to every event rather than to the kiosk ones alone. Scans were
   already countable per kiosk; what the client actually asked to see is where
   those people then drop out, and that only works if the location travels with
   the product view and the start_visit too.

   The phone's banked scan comes first: on a patient's own device that is the
   kiosk that sent them. readKioskLocation is the tablet's own placement, which
   is what makes an on-screen QR attributable. */
function kioskParams() {
  if (!isBrowser) return {};
  const id = readScanSource() || readKioskLocation();
  return id ? { kiosk_location_id: id } : {};
}

/* GA4 reads these parameter names as traffic attribution, whatever we mean by
   them. A button label passed as `source` becomes a fake acquisition source and
   lands in the client's "visitors by source" report next to google/organic:
   that is where "hero-shelf" and "treatments" came from. Dropped here rather
   than only at the call sites, so the next person to write `source:` gets a dev
   warning instead of polluted attribution a month later. Use click_source. */
const RESERVED = new Set(["source", "medium", "campaign", "term", "content", "gclid", "page_referrer"]);
function strip(props) {
  const out = {};
  for (const [key, value] of Object.entries(props)) {
    if (RESERVED.has(key)) {
      if (DEBUG) console.warn(`[analytics] dropped reserved param "${key}" — rename it, e.g. click_source`);
      continue;
    }
    out[key] = value;
  }
  return out;
}

/** Record a curated event. Unknown event names are allowed but discouraged. */
export function track(event, props = {}) {
  if (isPreview()) return;
  /* Checked against the live location, not a passed-in path: an event fired
     from a component that happens to be mounted on /intake must stay silent
     even though the caller knows nothing about routes. */
  if (isPrivatePath()) {
    if (DEBUG) console.debug("[analytics] suppressed on private route:", event);
    return;
  }
  const payload = strip({ ...kioskParams(), ...props });
  if (DEBUG) console.debug("[analytics]", event, payload);
  try {
    send(event, payload);
  } catch {
    /* analytics must never break the app */
  }
}

/**
 * Convenience helper for route changes.
 *
 * `page_location` is pinned to origin + pathname rather than left to default.
 * GA4 otherwise reads document.location, which on /intake includes the voucher
 * token, and on the portal can include whatever state a redirect appended.
 */
export function trackPageView(path) {
  if (isPreview()) return;
  if (isPrivatePath(path)) return;
  const clean = isBrowser ? `${window.location.origin}${path}` : path;
  if (isBrowser && typeof window.gtag === "function") {
    window.gtag("event", "page_view", {
      page_path: path,
      page_location: clean,
      page_title: typeof document !== "undefined" ? document.title : undefined,
    });
  }
  if (DEBUG) console.debug("[analytics]", EVENTS.PAGE_VIEW, { path });
  try {
    (window.nvAnalytics = window.nvAnalytics || []).push({
      event: EVENTS.PAGE_VIEW, props: { path }, t: Date.now(),
    });
  } catch {
    /* analytics must never break the app */
  }
}
