import { createSign } from "node:crypto";
import { blocked } from "./_guard.js";
import {
  adminAuthConfigured,
  passwordMatches,
  adminCookie,
  clearedAdminCookie,
  readAdminSession,
} from "./_admin.js";
import { ghlConfigured, pipelineBoard, listOpportunities } from "./_ghl.js";
import { mdi, mdiConfigured } from "./_mdi.js";

/* Everything the staff dashboard needs, in one function.

   Deliberately one endpoint rather than three (insights, insights-auth,
   insights-ops): Vercel's Hobby plan allows 12 serverless functions per
   deployment and api/ was at 13, which failed the build. These three were the
   obvious merge — same page, same session, same access rules.

     POST                    login / logout / session check
     GET  ?resource=ops      pipeline and intake funnel, from GHL and MDI
     GET  (default)          website traffic, from the GA4 Data API

   Every read is aggregate counts. No patient is identifiable in any response,
   and nothing clinical is in either source to begin with. */

/* ------------------------------- GA4 ------------------------------------- */

/* Reads GA4 through the Data API with a service account, so the credentials
   stay on the server and the browser only ever sees aggregate counts.

   No Google SDK: the whole auth flow is a signed JWT swapped for an access
   token, which is ~20 lines of node:crypto and avoids adding a dependency tree
   to a project that has none of it today. */
const PROPERTY_ID = process.env.GA4_PROPERTY_ID || "550183747";
const SA_EMAIL = process.env.GA4_SA_EMAIL || null;
/* Vercel stores the key as one line, so the newlines arrive escaped. */
const SA_KEY = (process.env.GA4_SA_PRIVATE_KEY || "").replace(/\\n/g, "\n") || null;

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const DATA_URL = `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:batchRunReports`;

const ga4Configured = () => Boolean(SA_EMAIL && SA_KEY);

/* Only these windows, so a URL can't ask for a five-year report and burn the
   property's API quota. */
const WINDOWS = new Set([1, 7, 28, 90]);
const DEFAULT_DAYS = 28;

const b64url = (input) => Buffer.from(input).toString("base64url");

let token = null; // { value, expiresAt }
async function accessToken() {
  if (token && token.expiresAt - 60_000 > Date.now()) return token.value;

  const iat = Math.floor(Date.now() / 1000);
  const unsigned =
    `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.` +
    `${b64url(JSON.stringify({ iss: SA_EMAIL, scope: SCOPE, aud: TOKEN_URL, iat, exp: iat + 3600 }))}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(SA_KEY).toString("base64url");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) {
    const err = new Error(`GA4 token exchange failed: ${res.status}`);
    err.details = body.error_description || body.error || null;
    throw err;
  }

  token = { value: body.access_token, expiresAt: Date.now() + (body.expires_in || 3600) * 1000 };
  return token.value;
}

const eventIs = (name) => ({
  filter: { fieldName: "eventName", stringFilter: { matchType: "EXACT", value: name } },
});
const byCount = [{ metric: { metricName: "eventCount" }, desc: true }];

/* Event-scoped custom dimensions are addressed by the parameter name we send
   from the browser, which is why those names had to match GA4's registration. */
const CUSTOM = {
  product: "customEvent:product_name",
  category: "customEvent:treatment_category",
  kiosk: "customEvent:kiosk_location_id",
};

function reportsFor(days) {
  const dateRanges = [{ startDate: `${days}daysAgo`, endDate: "today" }];
  return [
    // 0: headline totals
    {
      dateRanges,
      metrics: [{ name: "totalUsers" }, { name: "sessions" }, { name: "screenPageViews" }],
    },
    // 1: every event we fire, which is where start_visit and calculator_used come from
    {
      dateRanges,
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      orderBys: byCount,
      limit: 30,
    },
    // 2: most-viewed products
    {
      dateRanges,
      dimensions: [{ name: CUSTOM.product }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: eventIs("product_viewed"),
      orderBys: byCount,
      limit: 10,
    },
    // 3: most-viewed categories
    {
      dateRanges,
      dimensions: [{ name: CUSTOM.category }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: eventIs("product_viewed"),
      orderBys: byCount,
      limit: 10,
    },
    // 4: scans per kiosk
    {
      dateRanges,
      dimensions: [{ name: CUSTOM.kiosk }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: eventIs("kiosk_scan"),
      orderBys: byCount,
      limit: 12,
    },
  ];
}

function trendAndSources(days) {
  const dateRanges = [{ startDate: `${days}daysAgo`, endDate: "today" }];
  return [
    // 0: where visitors came from
    {
      dateRanges,
      dimensions: [{ name: "sessionSourceMedium" }],
      metrics: [{ name: "totalUsers" }, { name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    },
    // 1: day by day, for the chart
    {
      dateRanges,
      dimensions: [{ name: "date" }],
      metrics: [{ name: "totalUsers" }, { name: "sessions" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
      limit: 120,
    },
  ];
}

async function runBatch(requests) {
  const res = await fetch(DATA_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requests }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`GA4 report failed: ${res.status}`);
    err.details = body.error?.message || null;
    throw err;
  }
  return body.reports || [];
}

const num = (row, i = 0) => Number(row?.metricValues?.[i]?.value || 0);
const label = (row) => row?.dimensionValues?.[0]?.value || "(not set)";

/* GA4 returns "(not set)" for events sent before a parameter existed. Those
   rows are real counts but carry no name, so they're dropped from the "top ten"
   lists rather than shown as a nameless bar taller than everything else. */
const named = (rows) =>
  (rows || [])
    .filter((r) => label(r) !== "(not set)")
    .map((r) => ({ name: label(r), count: num(r) }));

const countsByName = (rows) => Object.fromEntries((rows || []).map((r) => [label(r), num(r)]));

async function trafficPayload(days) {
  /* batchRunReports takes at most five reports, so this is two calls rather
     than seven. They don't depend on each other, hence in parallel. */
  const [main, extra] = await Promise.all([
    runBatch(reportsFor(days)),
    runBatch(trendAndSources(days)),
  ]);

  const totals = main[0]?.rows?.[0];
  const events = countsByName(main[1]?.rows);

  return {
    days,
    totals: {
      users: num(totals, 0),
      sessions: num(totals, 1),
      views: num(totals, 2),
    },
    funnel: {
      product_viewed: events.product_viewed || 0,
      start_visit: events.start_visit || 0,
      calculator_used: events.calculator_used || 0,
      kiosk_scan: events.kiosk_scan || 0,
      category_selected: events.category_selected || 0,
      contact_submitted: events.contact_submitted || 0,
    },
    products: named(main[2]?.rows),
    categories: named(main[3]?.rows),
    kiosks: named(main[4]?.rows),
    sources: (extra[0]?.rows || []).map((r) => ({
      name: label(r),
      users: num(r, 0),
      sessions: num(r, 1),
    })),
    trend: (extra[1]?.rows || []).map((r) => ({
      // GA4 hands back "20260916"; the chart wants something sortable and readable.
      date: label(r).replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3"),
      users: num(r, 0),
      sessions: num(r, 1),
    })),
    updated_at: new Date().toISOString(),
  };
}

/* --------------------------- pipeline and intake ------------------------- */

/* MDI has no practice-wide case list (that endpoint 500s), but vouchers are the
   intake itself: one per questionnaire handed to a patient.

   Counted through `meta.total` with a status filter rather than by downloading
   rows, for two reasons:

     speed    per_page=100 times out at 60s and per_page=25 takes ~16s a page,
              so reading all 183 would be over two minutes, well past any
              serverless limit. Five filtered calls take about five seconds.

     privacy  a voucher row carries the patient object and
              `questionnaire_progress`, which is an array of their own answers.
              Asking only for a count means none of that is ever fetched.

   `status=` is the parameter that works. `voucher_status=` and `filter[status]=`
   are accepted and silently ignored, returning the unfiltered total, so don't
   "tidy" this into either of those. */
const STATUSES = ["pending", "in_progress", "completed", "expired"];

async function countVouchers(query) {
  const r = await mdi(`/vouchers?per_page=1&${query}`);
  if (!r.ok) throw new Error(`MDI vouchers ${r.status}`);
  const total = Number(r.data?.meta?.total);
  return Number.isFinite(total) ? total : 0;
}

async function voucherFunnel() {
  const [total, ...counted] = await Promise.all([
    countVouchers("page=1"),
    ...STATUSES.map((s) => countVouchers(`status=${s}`)),
  ]);

  const counts = Object.fromEntries(STATUSES.map((s, i) => [s, counted[i]]));

  return {
    total,
    /* Anyone who opened the questionnaire, finished or not. `pending` is the
       opposite: issued and never opened, which is the first real drop-off. */
    started: counts.in_progress + counts.completed,
    submitted: counts.completed,
    expired: counts.expired,
    by_status: STATUSES.map((name) => ({ name, count: counts[name] }))
      .filter((row) => row.count > 0)
      .sort((a, b) => b.count - a.count),
  };
}

async function board() {
  const { pipelineId, pipelineName, stages } = await pipelineBoard();
  const opportunities = await listOpportunities(pipelineId);

  const byStage = new Map(stages.map((s) => [s.id, { name: s.name, count: 0, value: 0 }]));
  let won = 0;
  let lost = 0;
  let open = 0;
  let wonValue = 0;
  let openValue = 0;

  for (const o of opportunities) {
    const row = byStage.get(o.pipelineStageId);
    const value = Number(o.monetaryValue) || 0;
    if (row) {
      row.count += 1;
      row.value += value;
    }
    if (o.status === "won") {
      won += 1;
      wonValue += value;
    } else if (o.status === "lost" || o.status === "abandoned") {
      lost += 1;
    } else {
      open += 1;
      openValue += value;
    }
  }

  return {
    pipeline: pipelineName,
    total: opportunities.length,
    won,
    lost,
    open,
    won_value: Math.round(wonValue),
    open_value: Math.round(openValue),
    stages: stages.map((s) => byStage.get(s.id)),
  };
}

async function opsPayload() {
  /* Settled independently: MDI being down shouldn't blank the GHL half, and the
     page renders whichever side answered. */
  const [ghl, intake] = await Promise.allSettled([
    ghlConfigured() ? board() : Promise.resolve(null),
    mdiConfigured() ? voucherFunnel() : Promise.resolve(null),
  ]);

  if (ghl.status === "rejected") {
    console.error("Insights board failed:", ghl.reason?.message, ghl.reason?.details ?? "");
  }
  if (intake.status === "rejected") {
    console.error("Insights intake funnel failed:", intake.reason?.message);
  }

  const payload = {
    board: ghl.status === "fulfilled" ? ghl.value : null,
    intake: intake.status === "fulfilled" ? intake.value : null,
    updated_at: new Date().toISOString(),
  };

  /* Only a complete answer is worth caching. Caching a half-answer would hold a
     transient MDI or GHL blip on screen for the full five minutes after the
     source recovered, which looks exactly like a broken panel. A source that
     isn't configured counts as complete: it is never going to answer. */
  payload.complete = Boolean(
    (!ghlConfigured() || payload.board) && (!mdiConfigured() || payload.intake)
  );
  return payload;
}

/* --------------------------------- cache --------------------------------- */

/* One entry per view, held briefly. The dashboard is a page people leave open
   and refresh; GA4's own data only moves every few hours and the CRM every few
   minutes, so serving a five-minute-old copy costs nothing and keeps us far
   from either API's quota. */
const CACHE_MS = 5 * 60_000;
const cache = new Map();

// Said once per instance, not once per request: the page re-asks whenever the
// date window changes, and thirteen identical lines bury real errors.
let warnedMissing = false;

/* -------------------------------- handler -------------------------------- */

async function handleAuth(req, res) {
  /* A tighter rate limit than the default: this is the one path on the site
     where guessing repeatedly is the attack. 12 tries a minute leaves room for
     a typo or two and nothing else. */
  if (blocked(req, res, { max: 12 })) return;

  const action = req.body?.action;

  if (action === "session") {
    return res.status(200).json({ authenticated: readAdminSession(req) });
  }

  if (action === "logout") {
    res.setHeader("Set-Cookie", clearedAdminCookie());
    return res.status(200).json({ authenticated: false });
  }

  if (action !== "login") {
    return res.status(400).json({ error: "Unknown action" });
  }

  if (!adminAuthConfigured()) {
    console.warn("Rejected dashboard login: ADMIN_PASSWORD or signing secret missing");
    return res.status(503).json({ error: "not_configured" });
  }

  if (!passwordMatches(req.body?.password)) {
    console.warn("Failed dashboard login attempt");
    // Deliberately vague: a wrong password and an unknown user look identical.
    return res.status(401).json({ error: "invalid" });
  }

  res.setHeader("Set-Cookie", adminCookie());
  return res.status(200).json({ authenticated: true });
}

export default async function handler(req, res) {
  if (req.method === "POST") return handleAuth(req, res);

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (blocked(req, res)) return;

  /* The page being hidden is not the protection: this check is. Without it the
     whole site's behavioural data is one curl away. */
  if (!readAdminSession(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // req.query is missing under the local vite shim, so fall back to the URL.
  const params = new URL(req.url || "/", "http://localhost").searchParams;
  const resource = req.query?.resource ?? params.get("resource");

  if (resource === "ops") {
    const hit = cache.get("ops");
    if (hit && Date.now() - hit.at < CACHE_MS) {
      return res.status(200).json({ ...hit.payload, cached: true });
    }
    const payload = await opsPayload();
    if (payload.complete) cache.set("ops", { at: Date.now(), payload });
    return res.status(200).json(payload);
  }

  if (!ga4Configured()) {
    if (!warnedMissing) {
      warnedMissing = true;
      console.warn("GA4 service account env vars missing — /api/insights has no traffic data.");
    }
    return res.status(503).json({ error: "not_configured" });
  }

  const rawDays = req.query?.days ?? params.get("days");
  const days = WINDOWS.has(Number(rawDays)) ? Number(rawDays) : DEFAULT_DAYS;

  const hit = cache.get(days);
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return res.status(200).json({ ...hit.payload, cached: true });
  }

  try {
    const payload = await trafficPayload(days);
    cache.set(days, { at: Date.now(), payload });
    return res.status(200).json(payload);
  } catch (e) {
    console.error("GA4 insights failed:", e.message, e.details ?? "");
    return res.status(502).json({ error: "upstream_failed" });
  }
}
