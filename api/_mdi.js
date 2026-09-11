const CLIENT_ID = process.env.MDI_CLIENT_ID;
const CLIENT_SECRET = process.env.MDI_CLIENT_SECRET;
const BASE = 'https://api.mdintegrations.com/v1/partner';

export const mdiConfigured = () => Boolean(CLIENT_ID && CLIENT_SECRET);
let cached = null;

async function accessToken() {
  if (cached && Date.now() < cached.expiresAt) return cached.value;

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

/**
 * Calls the partner API. Never throws on a non-2xx — returns the status so the
 * caller decides what to surface, which keeps upstream error bodies (which can
 * carry PHI) from leaking into our own responses by accident.
 *
 * @returns {Promise<{ok: boolean, status: number, data: any}>}
 */
export async function mdi(path, { method = 'GET', body } = {}) {
  const token = await accessToken();
  const res = await fetch(`${BASE}${path}`, {
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
