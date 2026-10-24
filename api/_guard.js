import { createHmac, timingSafeEqual } from "node:crypto";
const DISABLED = process.env.API_GUARD_DISABLED === "1";

const ALLOWED_HOSTS = [
  "novamdk.com",
  "www.novamdk.com",
  ...(process.env.VERCEL_URL ? [process.env.VERCEL_URL] : []),
  ...(process.env.API_ALLOWED_HOSTS || "").split(",").map((h) => h.trim()).filter(Boolean),
];

function hostAllowed(host) {
  if (!host) return false;
  const bare = host.toLowerCase().replace(/:\d+$/, "");
  if (ALLOWED_HOSTS.includes(bare)) return true;
  if (bare === "localhost" || bare === "127.0.0.1") return true;
  if (bare.endsWith(".vercel.app")) return true;
  return false;
}

function originHost(req) {
  const origin = req.headers?.origin;
  const raw = origin || req.headers?.referer;
  if (!raw) return null;
  try {
    return new URL(raw).host;
  } catch {
    return null;
  }
}

/* ------------------------------ rate limiting ----------------------------- */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30; // a genuine visit to a marketing page makes 2-3 calls
const hits = new Map();

function rateLimited(req, max = MAX_PER_WINDOW) {
  const ip =
    (req.headers?.["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  /* Counted per endpoint, not per visitor.
   *
   * One bucket per IP with a DIFFERENT ceiling per endpoint is a trap: the
   * portal is allowed 240 a minute because an open portal legitimately makes
   * dozens, and /api/pay is allowed 30, but they shared a counter. So a patient
   * who used their portal and then went to pay arrived at the checkout with the
   * count already past 30 and had the payment refused, which showed as "We
   * couldn't load the secure card form" with nothing wrong with the card
   * (2026-10-15, resuming an unpaid visit straight after loading the portal).
   *
   * Each endpoint now counts its own. The ceilings mean what they say and heavy
   * use of one cannot spend another's budget. */
  const route = String(req.url || "").split("?")[0] || "/";
  const key = `${ip}|${route}`;
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now - entry.start > WINDOW_MS) {
    hits.set(key, { start: now, count: 1 });
    // Opportunistic sweep so the Map can't grow without bound on a warm instance.
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (now - v.start > WINDOW_MS) hits.delete(k);
    }
    return false;
  }

  entry.count += 1;
  return entry.count > max;
}

/* --------------------------------- guard ---------------------------------- */
export function blocked(req, res, { max } = {}) {
  if (DISABLED) return false;

  const host = originHost(req);
  if (!hostAllowed(host)) {
    console.warn(`Blocked /api call from origin "${host ?? "(none)"}"`);
    res.status(403).json({ error: "Forbidden" });
    return true;
  }

  if (rateLimited(req, max)) {
    // Named, because "rate limited" on its own never said which endpoint ran
    // out of budget or what its ceiling was.
    console.warn(
      `Rate limited ${String(req.url || "").split("?")[0] || "/api"} (ceiling ${max ?? MAX_PER_WINDOW}/min)`
    );
    res.status(429).json({ error: "Too many requests" });
    return true;
  }

  return false;
}

/* ---------------------------- release tokens ------------------------------ */
const SIGNING_SECRET = process.env.API_SIGNING_SECRET || null;
/* Long enough to finish a questionnaire and pay. Was 45 minutes, which left a
   paid case on hold when someone took longer than that; safe to widen since the
   token stopped working as a portal login (2026-10-24, below). */
const TOKEN_TTL_MS = 2 * 60 * 60_000;

export const releaseTokensEnabled = () => Boolean(SIGNING_SECRET);

/* Security fix, 2026-10-24. A release token used to be `patient.time.sig`,
   signed with the same secret and in the same shape as the portal's session
   cookie, so one handed out at sign-up also opened that patient's portal. It
   is now signed under its own "release:" label, which a session never is, and
   names the visit it was minted for: the product, and whether it is a prepaid
   or renewing month of a plan ("plan", minted by the portal after the month
   was claimed) or an ordinary visit ("visit"). */
const releaseSig = (payload) =>
  createHmac("sha256", SIGNING_SECRET).update(`release:${payload}`).digest("hex");

export function signReleaseToken(patientId, { productId = null, kind = "visit" } = {}) {
  if (!SIGNING_SECRET) return null;
  const payload = `${patientId ?? "anon"}.${productId ?? "any"}.${kind === "plan" ? "plan" : "visit"}.${Date.now()}`;
  return `${payload}.${releaseSig(payload)}`;
}

/** The visit a token was minted for, or null when it is missing, forged or
 *  expired. patientId and productId are null where the token named none. */
export function readReleaseToken(token) {
  if (!SIGNING_SECRET || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 5) return null;
  const [patientId, productId, kind, issuedAt, sig] = parts;

  const expected = releaseSig(`${patientId}.${productId}.${kind}.${issuedAt}`);
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (!(Date.now() - Number(issuedAt) < TOKEN_TTL_MS)) return null;

  return {
    patientId: patientId === "anon" ? null : patientId,
    productId: productId === "any" ? null : productId,
    kind,
  };
}

export function verifyReleaseToken(token) {
  if (!SIGNING_SECRET) return true; // not enforcing yet
  return Boolean(readReleaseToken(token));
}

/* Ids the browser hands back, checked for shape before they go anywhere near
   an upstream URL. GoHighLevel's are 20 or so letters and digits. */
export const cleanGhlId = (v) => (typeof v === "string" && /^[A-Za-z0-9]{6,40}$/.test(v.trim()) ? v.trim() : null);
