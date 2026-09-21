import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/* Kurv, the primary card processor, with PayTechTrust (NMI) as the backup.
 *
 * Kurv takes the payment on its own hosted page: the server creates a payment
 * request, the patient pays inside an iframe (or a small window) pointed at
 * Kurv, and the server confirms the result with Kurv's API before anything is
 * marked Paid. No card data ever touches NovaMDK, same as with Collect.js.
 *
 * Why not Kurv's NMI gateway, which would have reused the Collect.js form? The
 * merchant account lives on kurv.app, and no gateway login for it was ever
 * issued, so the kurv.app API is the route that account actually supports.
 *
 * The account carries a monthly cap ($25k at signup). Checkout routes to Kurv
 * while this month's approved sales plus the new order stay under the cap less
 * a margin, and to PayTechTrust after that. It flips back on the 1st by itself,
 * since the total is simply re-read for the new month.
 *
 * Off unless KURV_ENABLED=1 and a key is present. Until then every checkout
 * goes to PayTechTrust exactly as before. */

const KEY = process.env.KURV_API_KEY || null;
const TEST_KEY = Boolean(KEY?.startsWith("kp_test_"));

/* The key decides the environment, with KURV_API_URL as an override. Defaulting
   by key rather than to production means a test key can never be pointed at the
   live API by omission. */
const BASE = (
  process.env.KURV_API_URL || (TEST_KEY ? "https://api-sandbox.kurv.app" : "https://api.kurv.app")
).replace(/\/+$/, "");

if (KEY && TEST_KEY !== BASE.includes("sandbox")) {
  console.warn(`Kurv key and URL disagree: a ${TEST_KEY ? "test" : "live"} key against ${BASE}.`);
}

const num = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

const CAP = num(process.env.KURV_MONTHLY_CAP, 25000);
/* Switched over this far short of the cap, not at it: $24,800 on a $25k cap, the
   client's number (2026-09-22). Several checkouts can be open at once, each
   routed by a total that doesn't count the others yet, and the total itself is
   cached for a few minutes, so a small margin absorbs that. An order that would
   cross the switch point goes to PayTechTrust whole, never split. */
const HEADROOM = num(process.env.KURV_CAP_HEADROOM, 200);

export const kurvEnabled = () => process.env.KURV_ENABLED === "1" && Boolean(KEY);

/* Reads answer in under a second, and creating a payment link took about 3s on
   the live API. Creates still get a longer leash, because a slow Kurv should
   cost the patient a short wait rather than a switch to the backup processor.
   The checkout starts the create as soon as the popup opens, so most of any
   wait passes while the patient is still reading the order summary. */
const READ_TIMEOUT_MS = 15_000;
const CREATE_TIMEOUT_MS = 45_000;

async function kurv(path, { method = "GET", body, timeout = READ_TIMEOUT_MS } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Authorization: `Bearer ${KEY}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeout),
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

/* ------------------------------ monthly total ----------------------------- */

/* The cap's month, taken in the clinics' own time zone. A UTC month would roll
   over at 5pm Pacific on the last day and start routing to Kurv hours early. */
function monthRange(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  );
  return {
    key: `${parts.year}-${parts.month}`,
    start: `${parts.year}-${parts.month}-01`,
    end: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

const TOTAL_TTL_MS = 5 * 60_000;
const TOTAL_PAGE = 100;
const TOTAL_PAGE_CAP = 30;
let cachedTotal = null; // { month, at, total }

/* Approved sales this month. Only `ACK` debits count: declines (`NOK`) never
   moved money, and whether refunds give room back under the cap is Kurv's
   rule to confirm, so they're left out, which only ever makes us switch early. */
async function monthToDate() {
  const range = monthRange();
  if (cachedTotal && cachedTotal.month === range.key && Date.now() - cachedTotal.at < TOTAL_TTL_MS) {
    return cachedTotal.total;
  }

  /* The sandbox is shared with other Kurv developers and its payment history is
     theirs, not ours, so a test key reads a simulated total instead. */
  if (TEST_KEY) {
    const total = num(process.env.KURV_TEST_MONTH_TOTAL, 0);
    cachedTotal = { month: range.key, at: Date.now(), total };
    return total;
  }

  let total = 0;
  for (let page = 1; page <= TOTAL_PAGE_CAP; page++) {
    const r = await kurv(
      `/payments?start_date=${range.start}&end_date=${range.end}&limit=${TOTAL_PAGE}&page=${page}`
    );
    if (!r.ok) throw new Error(`Kurv payments ${r.status}`);
    const rows = r.data?.payments || [];
    for (const p of rows) {
      if (p.status === "ACK" && String(p.payment_type).endsWith("DB")) total += Number(p.amount) || 0;
    }
    if (page >= Number(r.data?.page_count || 1) || rows.length < TOTAL_PAGE) {
      cachedTotal = { month: range.key, at: Date.now(), total };
      return total;
    }
  }
  // More pages than the cap allows: too busy to count safely, so treat as full.
  throw new Error("Kurv payment history past the page cap");
}

/* Counted into the cached total at once rather than waiting out the cache, so
   a run of checkouts inside those five minutes can't all fit under the cap on
   the same stale number. */
export function addToMonth(amount) {
  if (cachedTotal && cachedTotal.month === monthRange().key) cachedTotal.total += Number(amount) || 0;
}

/**
 * Which processor this order should go to.
 * Falls to PayTechTrust on any doubt, including Kurv's history being
 * unreadable: charging the backup is recoverable, going over the cap may not be.
 * @returns {Promise<"kurv"|"nmi">}
 */
export async function routeFor(amount) {
  if (!kurvEnabled()) return "nmi";
  try {
    const sold = await monthToDate();
    const room = CAP - HEADROOM - sold;
    if (amount > room) {
      console.info(`Kurv near its monthly cap ($${sold.toFixed(2)} of $${CAP}); routing to PayTechTrust.`);
      return "nmi";
    }
    return "kurv";
  } catch (e) {
    console.error("Kurv monthly total unreadable; routing to PayTechTrust:", e.message);
    return "nmi";
  }
}

/* --------------------------------- tickets -------------------------------- */

/* What the confirm step needs to know about a payment it didn't start: which
   Kurv request, which GHL card, the amount, and whether the questionnaire was
   already submitted. Signed, so the browser can carry it without being able to
   point a confirmation at a different card or amount. Signed with the Kurv key
   because it's the one secret guaranteed to exist whenever Kurv is on. */
const TICKET_TTL_MS = 3 * 60 * 60_000;
const sign = (body) => createHmac("sha256", KEY).update(body).digest("base64url");

export function issueTicket(fields) {
  const body = Buffer.from(JSON.stringify({ ...fields, at: Date.now() })).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function readTicket(ticket) {
  if (typeof ticket !== "string" || !KEY) return null;
  const [body, sig] = ticket.split(".");
  if (!body || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(body));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const t = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return Date.now() - t.at < TICKET_TTL_MS ? t : null;
  } catch {
    return null;
  }
}

/* --------------------------------- payments ------------------------------- */

/* Payments go through Kurv's POS links, not its payment requests. The request
   API is filed under Kurv's "Invoicing" feature, which the NOVA MDK plan
   doesn't include: the live account refuses it with "Your tier does not give
   you permission to access this resource 'Invoicing'", though the sandbox
   allows it. POS links are the plan's "Payment Link" feature and work on it.

   A POS link carries no transaction id of its own, so the reference is what
   identifies the payment afterwards: it's looked up in Kurv's payment history.
   It carries the GHL ids, `opportunity:contact:nonce`, so that Kurv's
   notification alone can move the right card to Paid even if the patient
   closes the tab the moment they've paid. The nonce makes every attempt's
   reference unique and unguessable, so a history search can only ever match
   the payment this checkout opened. */
const idPart = (v) => String(v || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 40);
export const referenceFor = (opportunityId, contactId) =>
  `${idPart(opportunityId) || "NV"}:${idPart(contactId)}:${randomBytes(6).toString("hex")}`;
export function parseReference(ref) {
  const [opportunityId = "", contactId = ""] = String(ref || "").split(":");
  return { opportunityId: opportunityId === "NV" ? "" : opportunityId, contactId };
}
const REFERENCE_RE = /^[A-Za-z0-9]{1,40}:[A-Za-z0-9]{0,40}:[a-f0-9]{12}$/;

/**
 * Opens a Kurv payment link for one order.
 * @returns {Promise<{ok: true, url: string, reference: string} | {ok: false}>}
 */
export async function createPayment({ amount, reference, returnPage, notifyUrl }) {
  const r = await kurv("/pos/generate-link", {
    method: "POST",
    body: {
      // Numbers, not strings: the live API rejects "0.50" as not a number,
      // though the docs show strings.
      amount: Number(amount.toFixed(2)),
      tip_amount: 0,
      currency: "USD",
      payment_type: "DB",
      reference,
      redirect_url: `${returnPage}?s=done`,
      cancel_url: `${returnPage}?s=cancel`,
      // Kurv can't reach a localhost callback, and an unreachable one only
      // costs retries, so it's sent only for a real https site.
      ...(notifyUrl ? { response_url: notifyUrl } : {}),
      /* Deliberately no cart items: Kurv's page and receipt show whatever is
         sent, and a medication name doesn't belong on either. Apple Pay and
         Google Pay come from the merchant's payment page settings in kurv.app. */
    },
    timeout: CREATE_TIMEOUT_MS,
  });

  const url = r.data?.long_url || r.data?.short_url;
  if (!r.ok || r.data?.result !== "success" || !url) {
    console.error(
      `Kurv payment link refused (HTTP ${r.status}):`,
      r.data?.error_message ||
        r.data?.message ||
        (r.data?.errors || []).map((e) => `${e.field}: ${e.message}`).join("; ") ||
        "no detail"
    );
    return { ok: false };
  }
  return { ok: true, url, reference };
}

/**
 * Where the payment for one reference stands, from Kurv's own history. The
 * only source of truth for whether money moved: the browser's word and Kurv's
 * unsigned notification are both just prompts to come and ask.
 *
 * "failed" means only declined attempts so far. Kurv's page allows several
 * tries, so it isn't final, and a later approved attempt still wins.
 * @returns {Promise<{state: "paid"|"pending"|"failed"|"unknown", amount?: number}>}
 */
export async function paymentState(reference) {
  if (!REFERENCE_RE.test(String(reference || ""))) return { state: "unknown" };
  const r = await kurv(`/payments?keywords=${encodeURIComponent(reference)}&limit=20`);
  if (!r.ok) return { state: "unknown" };

  // The search also matches emails and phone numbers, so only an exact
  // reference counts.
  const rows = (r.data?.payments || []).filter((p) => p.reference_number === reference);
  const paid = rows.find((p) => p.status === "ACK" && String(p.payment_type).endsWith("DB"));
  if (paid) return { state: "paid", amount: Number(paid.amount) };
  return { state: rows.some((p) => p.status === "NOK") ? "failed" : "pending" };
}
