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
 * cached write would be a cancelled renewal that did not cancel.
 */
const CACHE_MS = 60_000;
const CACHEABLE = new Set([
  "cases", "plan", "profile", "notifications", "messages",
  /* Costs an MDI call per unassigned case, so it is worth holding onto for the
     minute. Nothing about it changes except by paying, which clears the cache
     on its way through anyway. */
  "unpaid",
  /* Both keyed by case id, which is part of the body and so part of the key.
     Reopening a visit, or coming back to Treatments, was re-fetching a timeline
     and a parcel that had not moved. */
  "case_detail", "order_status",
]);

/* What each write makes untrue.
 *
 * Everything off the CACHEABLE list used to clear the whole cache, on the
 * reasoning that a write is the moment the reads stop being true. Three of the
 * things off that list are not writes: `order_status`, `case_detail` and `file`
 * are reads, and two of them fire on their own, without the patient doing
 * anything. So opening Treatments threw away the plan and the visit list it had
 * just fetched, as did every attachment the Messages thread loaded, and every
 * read receipt it sent. Nothing survived a tab, and each tab paid MDI's four to
 * five seconds again from cold. That is the ten to fifteen seconds the client
 * reported on 2026-10-14.
 *
 * So each write now names what it invalidates. An empty list is a write that
 * makes no read untrue. Anything NOT listed clears the lot, which keeps the old
 * behaviour as the default for a resource added later.
 */
const INVALIDATES = {
  update_profile: ["profile"],
  cancel_renewal: ["plan", "notifications"],
  send_message: ["messages", "notifications"],
  /* A read receipt changes the unread count and the message's own read_at, and
     nothing else. It used to clear everything, on every unread message, every
     time the thread polled. */
  read_message: ["messages", "notifications"],
  /* A new month opens a visit, spends a plan month and is worth a notification. */
  next_fill: ["plan", "cases", "notifications"],
  // Reads, or writes that no read on this list reflects.
  upload: [],
  file: [],
  resume: [],
};

const fresh = new Map(); // key -> { at, data }
const inFlight = new Map(); // key -> Promise

/** Throws the cache away. The portal's Refresh control, and every sign in. */
export function clearPortalCache() {
  fresh.clear();
  inFlight.clear();
}

/** The resource a cache key was made from. Keys are our own JSON, never input. */
function resourceOf(key) {
  try {
    return JSON.parse(key)?.resource ?? null;
  } catch {
    return null;
  }
}

/** Drops the reads one write made untrue, or all of them if it named none. */
function invalidate(resource) {
  const touched = INVALIDATES[resource];
  if (!touched) return clearPortalCache();
  if (!touched.length) return;
  for (const map of [fresh, inFlight]) {
    for (const key of [...map.keys()]) {
      if (touched.includes(resourceOf(key))) map.delete(key);
    }
  }
}

function cachedCall(body, poll) {
  const resource = body?.resource;
  if (!CACHEABLE.has(resource)) {
    const out = call("/api/portal", body);
    const after = () => invalidate(resource);
    out.then(after, after);
    return out;
  }

  const key = JSON.stringify(body);
  const hit = fresh.get(key);
  /* A poll asks BECAUSE the answer may have changed, so it reads past the cache
     and refills it. Without this the thread polls every twenty seconds against
     a minute of cache and a reply from the clinic can sit unseen for most of
     that minute. It still shares a request already in the air, which is live
     by definition. */
  if (!poll && hit && Date.now() - hit.at < CACHE_MS) return Promise.resolve(hit.data);

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
/**
 * One portal read or write, cached where that is safe.
 *
 * `poll: true` is for a timer asking again on its own: it reads past the cache
 * and refills it, so the cache never holds a background check back from seeing
 * what it is checking for.
 */
export const portalData = (body, { poll = false } = {}) => cachedCall(body, poll);
