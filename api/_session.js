import { createHmac, timingSafeEqual } from 'node:crypto';
import { kvConfigured, kvPipeline } from './_kv.js';

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

/* Signing out used to clear the cookie in that one browser and nothing else, so
   a copy taken beforehand kept working for the rest of its 12 hours (security
   review, 2026-10-24). One key per patient now records the moment they signed
   out: a cookie minted before it is dead, and a sign-in afterwards is not.

   Held for the life of a session, by which point every cookie it could refuse
   has expired on its own and the key is only litter.

   Both halves fail open. An unreachable store leaves sessions working rather
   than signing out every patient at once, and the cookie is cleared in the
   browser either way, so a patient always sees themselves logged out. Read on a
   short leash because this sits in front of payments: a slow store must never
   be what holds up a checkout. */
const REVOKE_TIMEOUT_MS = 500;
const revokeKey = (patientId) => `logout:${patientId}`;

/** Ends every session this patient already holds. */
export async function revokeSessions(patientId) {
  if (!kvConfigured() || !patientId) return false;
  const out = await kvPipeline(
    [['SET', revokeKey(patientId), String(Date.now()), 'EX', String(TTL_MS / 1000)]],
    { timeoutMs: REVOKE_TIMEOUT_MS }
  );
  return Boolean(out && out[0] !== null);
}

/** @returns {Promise<string|null>} the patient id, or null if absent, forged,
 *  expired or signed out. */
export async function readSession(req) {
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

  if (kvConfigured()) {
    const out = await kvPipeline([['GET', revokeKey(patientId)]], { timeoutMs: REVOKE_TIMEOUT_MS });
    const signedOutAt = out ? Number(out[0]) : 0;
    if (signedOutAt && Number(issuedAt) <= signedOutAt) return null;
  }

  return patientId;
}
