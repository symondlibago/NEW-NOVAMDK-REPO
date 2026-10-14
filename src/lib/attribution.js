/* Where a patient came from, kept from their first visit to their first payment.
 *
 * GA4 already reports traffic source, but only in aggregate: it cannot say
 * which CHANNEL produced a given paying patient, and that is the question the
 * dashboard exists to answer (John, 2026-10-14). Per-person attribution has to
 * live on the GoHighLevel contact, so the marketing tags are read off the
 * landing URL here and travel with the intake.
 *
 * FIRST TOUCH, deliberately. Someone clicks an ad on Monday, reads for a week
 * and buys on Sunday: the ad earned that patient, and a last-touch rule would
 * credit the direct visit on Sunday and make every campaign look worthless. So
 * the first set of tags wins and is never overwritten. GoHighLevel keeps both
 * readings anyway (First and Latest Attribution), and ours is the first.
 *
 * localStorage, not sessionStorage, for the same reason: a week is many
 * sessions. Everything here survives a tab being closed and fails quiet in
 * private mode.
 *
 * NOTHING CLINICAL. These are campaign names and click ids, never a treatment,
 * a questionnaire answer or a diagnosis. The channel is marketing's to know;
 * what was bought stays in MD Integrations.
 */

const KEY = "nv_attribution";

/* The five UTM parameters, plus the click ids the ad platforms add themselves.
   fbclid is what makes a Meta click attributable when the UTMs are stripped by
   a redirect, and gclid does the same for Google. */
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
const CLICK_KEYS = ["fbclid", "gclid"];

/* Long enough that a value is clearly a tag rather than a payload. GHL's own
   fields are short text, and an overlong value is more likely to be junk from a
   mangled redirect than a campaign name. */
const MAX = 120;

const isBrowser = typeof window !== "undefined";

const clean = (v) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s && s.length <= MAX ? s : "";
};

function read() {
  if (!isBrowser) return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // private mode, or something else wrote nonsense here
  }
}

/**
 * Records where this visitor came from, once.
 *
 * Call it as early as the app starts, on every route: a patient can land on any
 * page, and a campaign often points at a product rather than the home page.
 * Returns what is stored, which after the first call is the first touch.
 */
export function captureAttribution() {
  if (!isBrowser) return null;

  const already = read();
  if (already) return already;

  const params = new URLSearchParams(window.location.search);
  const tags = {};
  for (const key of [...UTM_KEYS, ...CLICK_KEYS]) {
    const value = clean(params.get(key));
    if (value) tags[key] = value;
  }

  /* An untagged visit is not recorded at all.
   *
   * So the next visit, which may carry an ad's tags, is still the first touch
   * rather than being locked out by a bare direct hit. The referrer alone is
   * not worth claiming someone: GA4 reports that better, and storing it would
   * make every organic visitor permanently "direct" the moment they browsed
   * once before clicking an ad. */
  if (!Object.keys(tags).length) return null;

  /* The page the campaign actually pointed at, which is what tells one ad's
     creative from another when the campaign name is shared. Path only: a query
     string can carry a voucher token, and that is nobody's business here. */
  const record = {
    ...tags,
    landing_path: window.location.pathname,
    first_seen: new Date().toISOString(),
  };

  try {
    localStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    /* Private mode. The tags are lost on this visit, which costs attribution
       and nothing else, so there is nothing to report to the patient. */
  }
  return record;
}

/** What was recorded, or null. Safe to call anywhere. */
export const attribution = () => read();

/**
 * The attribution to send with a CRM write, or undefined.
 *
 * undefined rather than an empty object, so a caller can spread it into a
 * payload and have an untagged visit add nothing at all.
 */
export function attributionPayload() {
  const record = read();
  return record && Object.keys(record).length ? record : undefined;
}
