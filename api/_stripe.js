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
