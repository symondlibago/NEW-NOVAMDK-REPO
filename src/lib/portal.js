async function call(url, body) {
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong. Please try again.");
    err.status = res.status;
    throw err;
  }
  return data;
}

/* ---- the read cache ----
 *
 * MDI's own latency is the portal's wait, and it is not payload bound: measured
 * on 2026-10-07, /patients/:id/cases takes 2 to 4.4 seconds and
 * /patients/:id/vouchers 3.8 to 5.1, and passing per_page changes neither. The
 * `cases` resource needs both, so it cannot come back in under about four
 * seconds no matter what we do to it.
 *
 * So the fix is to ask fewer times rather than to ask faster. Two things here:
 *
 *   1. IN FLIGHT SHARING. Home asks for `notifications` at the same moment the
 *      header's bell does, and both the Visits tab and Treatments ask for
 *      `cases`. Identical requests already in the air share one answer instead
 *      of each paying the four seconds.
 *   2. A SHORT TTL. Moving between Home, Visits and Treatments re-asked for the
 *      same visit list every time, so every tab switch cost another four
 *      seconds for data that had not changed.
 *
 * Only read resources are cached, listed explicitly rather than guessed at: a
 * cached write would be a cancelled renewal that did not cancel. Anything not
 * on the list goes straight through AND clears the cache, because a write is
 * exactly the moment the reads stop being true.
 */
const CACHE_MS = 60_000;
const CACHEABLE = new Set(["cases", "plan", "profile", "notifications", "messages"]);

const fresh = new Map(); // key -> { at, data }
const inFlight = new Map(); // key -> Promise

/** Throws the cache away. The portal's Refresh control, and every write. */
export function clearPortalCache() {
  fresh.clear();
  inFlight.clear();
}

function cachedCall(body) {
  const resource = body?.resource;
  if (!CACHEABLE.has(resource)) {
    /* A write invalidates everything rather than guessing which reads it
       touched: cancelling a renewal changes the plan, the visit list and the
       notifications, and getting that map wrong shows a patient stale money. */
    const out = call("/api/portal", body);
    out.then(clearPortalCache, clearPortalCache);
    return out;
  }

  const key = JSON.stringify(body);
  const hit = fresh.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return Promise.resolve(hit.data);

  const already = inFlight.get(key);
  if (already) return already;

  const run = call("/api/portal", body)
    .then((data) => {
      fresh.set(key, { at: Date.now(), data });
      inFlight.delete(key);
      return data;
    })
    .catch((err) => {
      /* Not cached. A failure must not stick for a minute, and a 401 has to
         reach the caller every time so the session can be ended. */
      inFlight.delete(key);
      throw err;
    });
  inFlight.set(key, run);
  return run;
}

export const portalAuth = (body) => {
  /* Signing in or out changes whose data this is, so nothing from before it can
     be trusted afterwards. */
  clearPortalCache();
  return call("/api/portal-auth", body);
};
export const portalData = (body) => cachedCall(body);
