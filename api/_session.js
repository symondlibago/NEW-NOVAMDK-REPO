import { createHmac, timingSafeEqual } from 'node:crypto';

const SECRET = process.env.API_SIGNING_SECRET || null;
const COOKIE = 'nv_portal';
const TTL_MS = 12 * 60 * 60 * 1000;

export const sessionsEnabled = () => Boolean(SECRET);

const sign = (payload) => createHmac('sha256', SECRET).update(payload).digest('hex');

/** Set-Cookie value establishing the session. */
export function sessionCookie(patientId) {
  const payload = `${patientId}.${Date.now()}`;
  // Secure is safe on http://localhost — browsers treat it as a trustworthy
  // origin, so this needs no dev-only branch.
  return `${COOKIE}=${payload}.${sign(payload)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${TTL_MS / 1000}`;
}

/** Set-Cookie value that ends the session. */
export const clearedCookie = () =>
  `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;

/** @returns {string|null} the patient id, or null if absent/forged/expired. */
export function readSession(req) {
  if (!SECRET) return null;

  // req.cookies exists on Vercel but not under the vite dev shim.
  const raw = req.headers?.cookie || '';
  const hit = raw
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`));
  if (!hit) return null;

  const parts = hit.slice(COOKIE.length + 1).split('.');
  if (parts.length !== 3) return null;
  const [patientId, issuedAt, sig] = parts;

  const expected = sign(`${patientId}.${issuedAt}`);
  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  if (!(Date.now() - Number(issuedAt) < TTL_MS)) return null;
  return patientId;
}
