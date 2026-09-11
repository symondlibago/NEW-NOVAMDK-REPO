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
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now - entry.start > WINDOW_MS) {
    hits.set(ip, { start: now, count: 1 });
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
    console.warn("Rate limited /api call");
    res.status(429).json({ error: "Too many requests" });
    return true;
  }

  return false;
}

/* ---------------------------- release tokens ------------------------------ */
const SIGNING_SECRET = process.env.API_SIGNING_SECRET || null;
const TOKEN_TTL_MS = 45 * 60_000; // long enough to finish a questionnaire

export const releaseTokensEnabled = () => Boolean(SIGNING_SECRET);

export function signReleaseToken(patientId) {
  if (!SIGNING_SECRET) return null;
  const payload = `${patientId ?? "anon"}.${Date.now()}`;
  const sig = createHmac("sha256", SIGNING_SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyReleaseToken(token) {
  if (!SIGNING_SECRET) return true; // not enforcing yet
  if (typeof token !== "string") return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [patientId, issuedAt, sig] = parts;

  const expected = createHmac("sha256", SIGNING_SECRET).update(`${patientId}.${issuedAt}`).digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  return Date.now() - Number(issuedAt) < TOKEN_TTL_MS;
}
