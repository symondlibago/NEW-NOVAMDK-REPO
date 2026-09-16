import { createHmac, createHash, timingSafeEqual } from "node:crypto";

/* The staff dashboard's own session, deliberately separate from the patient
   portal's `nv_portal`: one is a patient looking at their own case, the other is
   staff looking at every visitor's behaviour. Sharing a cookie would mean any
   patient session could read the dashboard's API.

   Same construction as _session.js though — HMAC over "admin.<issued>", HttpOnly
   so script on the page can't read it, and a signature checked in constant time. */
const SECRET = process.env.ADMIN_SESSION_SECRET || process.env.API_SIGNING_SECRET || null;
const PASSWORD = process.env.ADMIN_PASSWORD || null;
const COOKIE = "nv_admin";
const TTL_MS = 12 * 60 * 60 * 1000;

/* Both halves are required. Without them the endpoints fail closed rather than
   serving analytics to anyone who finds the URL — a missing env var must never
   be the thing that opens the door. */
export const adminAuthConfigured = () => Boolean(SECRET && PASSWORD);

const sign = (payload) => createHmac("sha256", SECRET).update(payload).digest("hex");

const sameBytes = (a, b) => {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && timingSafeEqual(x, y);
};

/** Constant-time password check. Hashed first so the compare is fixed-length
 *  whatever was typed, which keeps the length of the real password private. */
export function passwordMatches(candidate) {
  if (!PASSWORD || typeof candidate !== "string" || !candidate) return false;
  const digest = (s) => createHash("sha256").update(s).digest("hex");
  return sameBytes(digest(candidate), digest(PASSWORD));
}

/** Set-Cookie value establishing the staff session. */
export function adminCookie() {
  const payload = `admin.${Date.now()}`;
  // Secure is safe on http://localhost: browsers treat it as a trustworthy origin.
  return `${COOKIE}=${payload}.${sign(payload)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${TTL_MS / 1000}`;
}

/** Set-Cookie value that ends it. */
export const clearedAdminCookie = () =>
  `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;

/** @returns {boolean} whether this request carries a valid, unexpired session. */
export function readAdminSession(req) {
  if (!SECRET) return false;

  // req.cookies exists on Vercel but not under the vite dev shim.
  const raw = req.headers?.cookie || "";
  const hit = raw
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`));
  if (!hit) return false;

  const parts = hit.slice(COOKIE.length + 1).split(".");
  if (parts.length !== 3) return false;
  const [who, issuedAt, sig] = parts;
  if (who !== "admin") return false;

  if (!sameBytes(sig, sign(`${who}.${issuedAt}`))) return false;
  return Date.now() - Number(issuedAt) < TTL_MS;
}
