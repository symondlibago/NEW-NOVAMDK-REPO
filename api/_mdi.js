const CLIENT_ID = process.env.MDI_CLIENT_ID;
const CLIENT_SECRET = process.env.MDI_CLIENT_SECRET;
const BASE = 'https://api.mdintegrations.com/v1/partner';

/* Patient sign-in does not live under /partner. The portal's one-time code is
 * issued and checked at /v1/patient/auth/2fa, with "patient" singular, and that
 * tree answers to the same partner token.
 *
 * Worth knowing because the mistake is invisible from the response: called
 * under /partner it returns a 404 reading "route could not be found", and
 * portal-auth.js treated only 5xx as a failure, so every sign-in said a code
 * had been sent and none ever was. Wrong since the 2026-09-11 import, found
 * 2026-10-14; api/portal-auth.js had not been edited once in between.
 */
export const PATIENT_BASE = 'https://api.mdintegrations.com/v1/patient';

export const mdiConfigured = () => Boolean(CLIENT_ID && CLIENT_SECRET);
let cached = null;
/* The token request in flight, so the four reads an opening portal fires at
   once wait on ONE of them instead of each authenticating for itself. They all
   start with an empty cache, so without this a cold instance paid for four. */
let authenticating = null;

async function accessToken() {
  if (cached && Date.now() < cached.expiresAt) return cached.value;
  if (authenticating) return authenticating;
  authenticating = requestToken().finally(() => {
    authenticating = null;
  });
  return authenticating;
}

async function requestToken() {
  const res = await fetch(`${BASE}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: '*',
    }),
  });

  if (!res.ok) {
    cached = null;
    throw new Error(`MDI auth ${res.status}`);
  }

  const data = await res.json();
  const ttl = Math.max(60, (Number(data.expires_in) || 3600) - 60);
  cached = { value: data.access_token, expiresAt: Date.now() + ttl * 1000 };
  return cached.value;
}

/* GETs answered within the last few seconds, for the callers that ask to share.
 *
 * Measured 2026-10-14: /patients/:id/cases takes 2.4 to 3.2s and
 * /patients/:id/vouchers 2.9 to 3.3s, consistently, whatever we pass. Opening
 * the portal asks for the case list TWICE in the same moment, once for the
 * visit list and once to work out the notifications, so the slowest call we
 * make was being made twice side by side for one screen.
 *
 * Opt-in per call, never on by default: a read that decides an entitlement, or
 * one taken right after a write, has to see the real thing. Only the plain
 * screen reads in portal.js ask for it. The promise is shared rather than the
 * result, so two callers a millisecond apart still make one request.
 */
const shared = new Map(); // url -> { at, promise }

/**
 * Calls the partner API. Never throws on a non-2xx — returns the status so the
 * caller decides what to surface, which keeps upstream error bodies (which can
 * carry PHI) from leaking into our own responses by accident.
 *
 * @param {object} [options]
 * @param {number} [options.share] ms within which an identical GET may reuse
 *   another caller's answer. Omit unless the read is a plain screen read.
 * @returns {Promise<{ok: boolean, status: number, data: any}>}
 */
export async function mdi(path, { method = 'GET', body, base = BASE, share = 0 } = {}) {
  if (!share || method !== 'GET') return request(path, { method, body, base });

  const url = `${base}${path}`;
  const hit = shared.get(url);
  if (hit && Date.now() - hit.at < share) return hit.promise;

  const promise = request(path, { method, body, base });
  shared.set(url, { at: Date.now(), promise });
  /* A failure is never shared: the next caller should get its own answer rather
     than a 502 that outlives whatever caused it. */
  promise.then(
    (r) => { if (!r.ok) shared.delete(url); },
    () => shared.delete(url)
  );
  if (shared.size > 200) {
    const now = Date.now();
    for (const [k, v] of shared) if (now - v.at > share) shared.delete(k);
  }
  return promise;
}

async function request(path, { method, body, base }) {
  const token = await accessToken();
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  // A revoked or rotated secret shows up as a 401 on a token we thought was
  // good — drop it so the next call re-authenticates rather than looping.
  if (res.status === 401) cached = null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* 204s and empty bodies are normal here */
  }

  return { ok: res.ok, status: res.status, data };
}

/**
 * Multipart variant for POST /files. Content-Type is deliberately unset so
 * fetch writes its own multipart boundary.
 *
 * @returns {Promise<{ok: boolean, status: number, data: any}>}
 */
export async function mdiUpload(path, form) {
  const token = await accessToken();
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (res.status === 401) cached = null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }

  return { ok: res.ok, status: res.status, data };
}

/** Unwraps MDI's two list shapes: a bare array, or `{ data: [...] }`. */
export const listOf = (payload) =>
  Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
