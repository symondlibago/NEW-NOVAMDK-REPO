import { createHmac, timingSafeEqual } from "node:crypto";

/* Stripe, over plain fetch.
 *
 * No SDK, for the same reason MDI, Kurv and the NMI gateway don't have one:
 * every integration here is a handful of calls, the Hobby plan counts bundle
 * size, and the one thing an SDK really buys you (webhook signature checking)
 * is nine lines of node:crypto that this file already needed for Kurv.
 *
 * Stripe's API is form-encoded, not JSON, including nested keys written as
 * `automatic_payment_methods[enabled]`.
 */

const BASE = "https://api.stripe.com/v1";
const SECRET = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/** Live keys start sk_live_, test keys sk_test_. Worth being able to say which. */
export const stripeMode = () =>
  !SECRET ? null : SECRET.startsWith("sk_live_") ? "live" : "test";

export const stripeEnabled = () => Boolean(SECRET);

/* Stripe wants the smallest currency unit, so dollars become cents. Rounded
   rather than truncated: 129.995 must not become $129.99. */
export const toCents = (dollars) => Math.round(Number(dollars) * 100);

/** Flattens `{ a: { b: 1 } }` to `a[b]=1`, which is how Stripe reads nesting. */
function encode(obj, prefix = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj || {})) {
    if (v === undefined || v === null || v === "") continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object" && !Array.isArray(v)) encode(v, key, out);
    else if (Array.isArray(v)) v.forEach((item, i) => encode({ [i]: item }, key, out));
    else out.set(key, String(v));
  }
  return out;
}

/**
 * Calls Stripe. Mirrors `mdi()`: never throws on a non-2xx, so the caller
 * decides what to surface. Stripe's error bodies name the field at fault, which
 * belongs in our logs and not in a patient-facing response.
 *
 * @returns {Promise<{ok: boolean, status: number, data: any}>}
 */
export async function stripe(path, { method = "POST", body, idempotencyKey } = {}) {
  if (!SECRET) return { ok: false, status: 503, data: { error: { message: "stripe_not_configured" } } };
  const headers = {
    Authorization: `Bearer ${SECRET}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  /* Stripe replays an identical request rather than charging twice, which is
     what stops a double-clicked Pay button becoming two charges. */
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: method === "GET" ? undefined : encode(body).toString(),
    });
  } catch (e) {
    return { ok: false, status: 502, data: { error: { message: e.message } } };
  }
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

/* How far back to look for an uncaptured hold. A card authorisation is good
   for 7 days and then dies, so a day either side of that is the whole window in
   which one can possibly exist. */
const HOLD_WINDOW_DAYS = 8;
const HOLD_PAGES = 5;

/**
 * The uncaptured hold placed for a given GoHighLevel opportunity, or null.
 *
 * Deliberately /payment_intents (list) rather than /payment_intents/search.
 * Search is eventually consistent and, measured on 2026-10-02, did NOT return
 * an intent created seconds earlier. Providers here have approved a case four
 * minutes after intake, so a search-based lookup would have quietly captured
 * nothing on exactly the fastest, most normal cases. List is immediate: it
 * found the same hold in about two seconds.
 *
 * @returns {Promise<object|null>} the PaymentIntent awaiting capture
 */
export async function findHold(opportunityId) {
  const id = typeof opportunityId === "string" ? opportunityId.trim() : "";
  if (!id) return null;
  const since = Math.floor(Date.now() / 1000) - HOLD_WINDOW_DAYS * 86400;
  let after = null;
  for (let page = 0; page < HOLD_PAGES; page++) {
    /* latest_charge expanded, so a capture failure can log the deadline the
       hold was up against. That is the line that explains the failure. */
    const qs =
      `limit=100&created[gte]=${since}&expand[]=data.latest_charge` +
      (after ? `&starting_after=${after}` : "");
    const r = await stripe(`/payment_intents?${qs}`, { method: "GET" });
    if (!r.ok) {
      console.error(`Stripe hold lookup failed for ${id}: ${r.status}`);
      return null;
    }
    const list = r.data?.data || [];
    const hit = list.find(
      (p) => p.status === "requires_capture" && p.metadata?.opportunity_id === id
    );
    if (hit) return hit;
    if (!r.data?.has_more || list.length === 0) return null;
    after = list[list.length - 1].id;
  }
  /* Only reachable at a volume this practice is nowhere near, but silence here
     would be money quietly never collected. */
  console.error(
    `Stripe hold lookup gave up after ${HOLD_PAGES} pages for opportunity ${id}. ` +
      `Raise HOLD_PAGES: a hold may exist and will expire uncaptured.`
  );
  return null;
}

/**
 * When a hold expires, as a Date, or null if Stripe didn't say.
 *
 * The deadline lives on the CHARGE, not the intent, and current API versions
 * return `latest_charge` as a bare id rather than the old expanded `charges`
 * array. So this only has an answer where the caller asked for the charge to be
 * expanded, which is why every read that wants the deadline passes
 * `expand[]=latest_charge`. Both shapes are handled: the legacy array still
 * turns up on older stored objects.
 */
export function holdExpiresAt(intent) {
  const charge =
    (intent?.latest_charge && typeof intent.latest_charge === "object" ? intent.latest_charge : null) ||
    intent?.charges?.data?.[0] ||
    null;
  const at = charge?.payment_method_details?.card?.capture_before;
  return typeof at === "number" ? new Date(at * 1000) : null;
}

/**
 * Checks a webhook really came from Stripe.
 *
 * The header looks like `t=1700000000,v1=<hex>,v0=<hex>`, and the signed string
 * is the timestamp and the RAW body joined by a dot. Re-serialising a parsed
 * body changes the bytes and the signature will never match, so the caller has
 * to hand over exactly what arrived on the wire.
 *
 * @returns {object|null} the parsed event, or null if it isn't genuine
 */
export function verifyWebhook(rawBody, signatureHeader, { toleranceSeconds = 300 } = {}) {
  if (!WEBHOOK_SECRET || !rawBody || !signatureHeader) return null;

  const parts = String(signatureHeader)
    .split(",")
    .map((p) => p.split("=", 2));
  const timestamp = parts.find(([k]) => k === "t")?.[1];
  const signatures = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!timestamp || signatures.length === 0) return null;

  /* An attacker who captures one valid delivery could otherwise replay it
     forever. Stripe's own libraries default to five minutes. */
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > toleranceSeconds) return null;

  const expected = createHmac("sha256", WEBHOOK_SECRET)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const matches = signatures.some((sig) => {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(String(sig), "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  });
  if (!matches) return null;

  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}
