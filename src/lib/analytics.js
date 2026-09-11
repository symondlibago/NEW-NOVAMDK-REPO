
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

/**
 * Forward to Google Analytics 4 (G-4X11DW5WNW, loaded in index.html), and keep
 * the in-memory queue for local debugging.
 *
 * gtag is loaded async, so it may not exist yet on a fast first interaction.
 * `window.gtag` is defined synchronously by the inline snippet though — it just
 * buffers into dataLayer until the library arrives — so a guarded call is enough
 * and nothing is lost.
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

/** Record a curated event. Unknown event names are allowed but discouraged. */
export function track(event, props = {}) {
  if (isPreview()) return;
  if (DEBUG) console.debug("[analytics]", event, props);
  try {
    send(event, props);
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
