/* Upstash Redis, over its REST interface.
 *
 * Plain fetch rather than @upstash/redis: the only caller is the kiosk scan
 * counter, which needs INCR, MGET and SMEMBERS and nothing else, and every
 * other service in api/ is talked to the same way.
 *
 * Nothing here is required for the site to run. With no credentials set, or
 * with Upstash slow or down, every call resolves to null and the caller
 * carries on. A missing count is a gap in a chart. A kiosk page that will not
 * load is a dead machine standing in a clinic.
 *
 * Set up as the "kiosk-counts" store on the Vercel Marketplace (2026-10-23),
 * which writes KV_REST_API_URL and KV_REST_API_TOKEN into the project itself. */

const BASE = (process.env.KV_REST_API_URL || "").replace(/\/+$/, "");
const TOKEN = process.env.KV_REST_API_TOKEN || "";

/* Short on purpose. This sits in front of a page a patient is waiting on, so
   a slow store has to give up long before they notice it. */
const TIMEOUT_MS = 2000;

export const kvConfigured = () => Boolean(BASE && TOKEN);

async function send(body, timeoutMs = TIMEOUT_MS) {
  if (!kvConfigured()) return null;

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);
  try {
    const r = await fetch(`${BASE}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: abort.signal,
    });
    const data = await r.json().catch(() => null);
    if (!r.ok) {
      console.error(`Upstash failed: ${r.status}`, data?.error || "");
      return null;
    }
    return data;
  } catch (e) {
    console.error("Upstash failed:", e.name === "AbortError" ? "timed out" : e.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Several commands in one round trip, results in the order given. A command
 *  that errored on its own comes back as null rather than failing the rest.
 *  `timeoutMs` overrides the default for a caller that cannot wait, such as the
 *  session check sitting in front of a payment. */
export async function kvPipeline(commands, { timeoutMs } = {}) {
  if (!commands.length) return [];
  const out = await send(commands, timeoutMs);
  if (!Array.isArray(out)) return null;
  return out.map((x) => (x && x.error ? null : (x?.result ?? null)));
}

/** One command. Returns its result, or null when the call did not land. */
export async function kvCommand(...command) {
  const out = await kvPipeline([command]);
  return out ? out[0] : null;
}
