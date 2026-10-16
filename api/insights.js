import { createSign } from "node:crypto";
import { blocked } from "./_guard.js";
import {
  adminAuthConfigured,
  passwordMatches,
  adminCookie,
  clearedAdminCookie,
  readAdminSession,
} from "./_admin.js";
import {
  ghlConfigured,
  pipelineBoard,
  listOpportunities,
  listContacts,
  fieldValueOf,
  SEARCH_FIELD_ID,
} from "./_ghl.js";
import { mdi, mdiConfigured } from "./_mdi.js";
import { spendBySource, spendMonths, spendTotal } from "./_spend.js";

/* Everything the staff dashboard needs, in one function.

   Deliberately one endpoint rather than three (insights, insights-auth,
   insights-ops): Vercel's Hobby plan allows 12 serverless functions per
   deployment and api/ was at 13, which failed the build. These three were the
   obvious merge — same page, same session, same access rules.

     POST                      login / logout / session check
     GET  ?resource=ops        pipeline and intake funnel, from GHL and MDI
     GET  ?resource=channels   where customers came from and what each channel
                               earned, from GHL joined to the spend on file
     GET  (default)            website traffic, from the GA4 Data API

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

/* Expired vouchers split by whether the patient ever opened one.

   Needed because `status` alone can't answer it. A voucher that was in progress
   flips to `expired` after its 31 days and drops out of any count built from
   status, so someone who genuinely opened the questionnaire stops being counted
   as having started it. The client asked for that corrected (2026-09-19).

   MDI has no filter for it, so the rows have to be read. Two rules follow from
   that, and both matter:

     privacy  every row carries the full patient object and
              `questionnaire_progress`, which holds their own answers. Only
              `.length` is looked at. Nothing from these rows is logged, cached
              or returned: the two numbers below leave this function and the
              rows are dropped.

     cost     a page of 25 takes 7-13s, and the pages are asked for at once
              because that costs the slowest page rather than the sum: 13s for
              all 84 instead of 32s one after another. Four concurrent requests
              draw no 429, which twelve rapid ones do, so PAGE_CAP is the guard
              that keeps this from ever becoming twelve. Past the cap the split
              is reported as incomplete rather than half-counted. */
const EXPIRED_PAGE = 25;
const EXPIRED_PAGE_CAP = 8;
const EXPIRED_BUDGET_MS = 45_000;

async function expiredPage(page) {
  const r = await mdi(`/vouchers?status=expired&per_page=${EXPIRED_PAGE}&page=${page}`);
  if (!r.ok) throw new Error(`MDI vouchers ${r.status}`);
  let opened = 0;
  let untouched = 0;
  for (const v of r.data?.data ?? []) {
    // Length only. The answers themselves are never read.
    if ((v.questionnaire_progress?.length ?? 0) > 0) opened += 1;
    else untouched += 1;
  }
  return { opened, untouched, rows: opened + untouched };
}

async function expiredBreakdown() {
  const nothing = { opened: 0, untouched: 0, complete: false };

  // Cheap first: the total decides how many pages, and warms the access token
  // so its round trip isn't charged to one of the parallel reads.
  const total = await countVouchers("status=expired&per_page=1");
  if (!total) return { opened: 0, untouched: 0, complete: true };

  const pages = Math.ceil(total / EXPIRED_PAGE);
  if (pages > EXPIRED_PAGE_CAP) {
    console.warn(`${total} expired vouchers is past the read cap; the split was skipped.`);
    return nothing;
  }

  const work = Promise.all(
    Array.from({ length: pages }, (_, i) => expiredPage(i + 1))
  ).then((parts) => ({
    opened: parts.reduce((n, p) => n + p.opened, 0),
    untouched: parts.reduce((n, p) => n + p.untouched, 0),
    rows: parts.reduce((n, p) => n + p.rows, 0),
  }));

  /* Abandoned rather than waited on. The rows are lifetime totals behind a
     half-hour cache, so an unusually slow MDI should cost the correction and
     not the dashboard. */
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), EXPIRED_BUDGET_MS));
  const got = await Promise.race([work, timeout]);

  if (!got) {
    console.warn("Expired voucher breakdown ran past its budget; reporting without it.");
    return nothing;
  }
  // A short read means MDI paged differently than the total implied; don't guess.
  if (got.rows < total) {
    console.warn(`Expired voucher breakdown read ${got.rows} of ${total}; reporting without it.`);
    return nothing;
  }
  return { opened: got.opened, untouched: got.untouched, complete: true };
}

async function voucherFunnel() {
  const [total, counted, expired] = await Promise.all([
    countVouchers("page=1"),
    Promise.all(STATUSES.map((s) => countVouchers(`status=${s}`))),
    /* Settled, not awaited hard: a slow or failed read here should cost the
       correction, never the whole funnel. */
    expiredBreakdown().catch((e) => {
      console.warn("Expired voucher breakdown failed:", e.message);
      return { opened: 0, untouched: 0, complete: false };
    }),
  ]);

  const counts = Object.fromEntries(STATUSES.map((s, i) => [s, counted[i]]));

  return {
    total,
    /* Everyone who has ever opened a questionnaire: the two live statuses plus
       the ones that were opened and later timed out. Without that last term the
       number silently falls as vouchers age, rewriting history. */
    started: counts.in_progress + counts.completed + (expired.complete ? expired.opened : 0),
    started_exact: expired.complete,
    submitted: counts.completed,
    expired: counts.expired,
    /* The split that makes `expired` readable. Nearly all of it is issued and
       never touched, which is a different problem from giving up part way. */
    expired_opened: expired.complete ? expired.opened : null,
    expired_untouched: expired.complete ? expired.untouched : null,
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

/* -------------------------------- channels ------------------------------- */

/* "Where did each customer come from, and what did that channel earn."
   Two of the five questions in the client's brief, and both are the same join:
   the contact carries the campaign that won them, the opportunity carries the
   money, and `contactId` is the key between them.

   Three requests, about two seconds: one page of contacts and two of
   opportunities. Deliberately not a lookup per card, which at 118 cards would
   be 118 requests and a timeout.

   Every row is a channel. No row is ever a person, and nothing clinical is in
   either source to begin with. */

const lower = (v) => (typeof v === "string" ? v.trim().toLowerCase() : "");

const STARTED_TAG = "intake-started";
const SUBMITTED_TAG = "intake-submitted";
const UNATTRIBUTED = "unknown";

/* `kiosk-<id>` is normally the location a machine stands in, and that id is the
   campaign. Two of them are not places at all: api/ghl-contact.js writes
   kiosk-text-sent and kiosk-text-link to record whether the server or the
   fallback workflow sent the text. Both still mean "came from a kiosk", so they
   keep the channel, but reporting either as a placement puts an internal
   plumbing detail in a table of marketing campaigns. Add to this set if another
   operational kiosk- tag is ever introduced. */
const KIOSK_PREFIX = "kiosk-";
const KIOSK_NOT_A_PLACE = new Set(["kiosk-text-sent", "kiosk-text-link"]);

/* How a contact is credited to a channel, best evidence first. `basis` records
   which rule answered, because these are not equally trustworthy and the page
   has to be able to separate what was measured from what was inferred.

     utm   our own first-touch capture. The campaign itself, from the link they
           clicked. This is the only one that can name an ad.
     tag   a kiosk tag we wrote ourselves at intake. Certain about the channel,
           and the kiosk id doubles as the campaign.
     ghl   GoHighLevel's own attribution. Thin in practice: it mostly reports
           the chat widget or "Direct traffic", because it sees the session that
           created the record rather than the click that started the visit.
     none  nobody knows. Honest, and the number that should fall as the tagged
           links go live. */
function channelOf(contact) {
  const source = lower(fieldValueOf(contact, SEARCH_FIELD_ID.UTM_SOURCE));
  if (source) {
    return {
      source,
      medium: lower(fieldValueOf(contact, SEARCH_FIELD_ID.UTM_MEDIUM)),
      campaign: lower(fieldValueOf(contact, SEARCH_FIELD_ID.UTM_CAMPAIGN)),
      basis: "utm",
    };
  }

  const tags = (contact?.tags || []).map(lower);
  const kiosk = tags.find((t) => t.startsWith(KIOSK_PREFIX) && !KIOSK_NOT_A_PLACE.has(t));
  if (kiosk || tags.some((t) => t === "kiosk" || t.startsWith(KIOSK_PREFIX))) {
    return {
      source: "kiosk",
      medium: "offline",
      campaign: kiosk ? kiosk.slice(KIOSK_PREFIX.length) : "",
      basis: "tag",
    };
  }

  const a = contact?.attributionSource || {};
  const native = lower(a.utmSource) || lower(a.sessionSource) || lower(a.referrer);
  if (native) {
    return {
      source: native,
      medium: lower(a.utmMedium) || lower(a.medium),
      campaign: lower(a.campaign),
      basis: "ghl",
    };
  }

  return { source: UNATTRIBUTED, medium: "", campaign: "", basis: "none" };
}

const BASES = ["utm", "tag", "ghl", "none"];

const blankRow = (extra) => ({
  contacts: 0,
  measured: 0,
  by_basis: { utm: 0, tag: 0, ghl: 0, none: 0 },
  started: 0,
  submitted: 0,
  paid: 0,
  repeat: 0,
  revenue: 0,
  open_value: 0,
  ...extra,
});

/* A card counts as paid when its status is won, which is what
   markOpportunityPaid sets alongside moving it to the Paid column. Same rule as
   the board panel above, deliberately: two panels on one page disagreeing about
   who paid is worse than either being slightly narrow. */
const isPaid = (o) => o.status === "won";

/* Enough to see a quiet day and a busy one without turning the panel into a
   second CRM. The whole list is already in memory, so this is about what is
   worth reading, not what is cheap to send. */
const RECENT_LIMIT = 20;

/* GoHighLevel opens a bare contact for any number it texts, the staff number an
 * Internal Notification goes to included. John's own mobile turned up as a
 * "person in the CRM", named after itself, the minute the first Paid
 * notification fired (2026-10-16), which made the dashboard report two people
 * when there was one patient.
 *
 * Left alone in GoHighLevel rather than deleted: that record holds the
 * notification thread, and deleting it only invites it back on the next SMS.
 * It is simply not counted as somebody who arrived.
 *
 * All three have to be empty. Our own intake always writes a website-lead tag
 * and a source, and a kiosk walk-up is phone-only but always carries a kiosk
 * tag, so a record with no email, no tags AND no source is not a lead that
 * came to us by any route we have. */
const isNotificationShell = (c) =>
  !c.email && !(c.tags || []).length && !c.source && !c.attributionSource?.sessionSource;

async function channelsPayload() {
  const { pipelineId } = await pipelineBoard();
  const [everyContact, opportunities] = await Promise.all([
    listContacts(),
    listOpportunities(pipelineId),
  ]);
  const contacts = everyContact.filter((c) => !isNotificationShell(c));

  /* Money first, keyed by contact, so the contact pass below can fold it in
     without searching the opportunity list once per person. */
  const paidByContact = new Map(); // contactId -> { cards, value }
  const openByContact = new Map(); // contactId -> value
  /* The last time anything happened on a patient's record, which is not the
     same as when they first appeared. Ryan signed up on 1 October and paid on
     16 October; dating him by the contact record said "14 days ago" on the day
     he became the first paying patient. */
  const lastTouch = new Map(); // contactId -> ms
  for (const o of opportunities) {
    const id = o.contactId;
    if (!id) continue;
    for (const stamp of [o.updatedAt, o.createdAt]) {
      const ms = Date.parse(stamp);
      if (Number.isFinite(ms) && ms > (lastTouch.get(id) || 0)) lastTouch.set(id, ms);
    }
    const value = Number(o.monetaryValue) || 0;
    if (isPaid(o)) {
      const row = paidByContact.get(id) || { cards: 0, value: 0 };
      row.cards += 1;
      row.value += value;
      paidByContact.set(id, row);
    } else if (o.status === "open") {
      openByContact.set(id, (openByContact.get(id) || 0) + value);
    }
  }

  const channels = new Map(); // "source/medium" -> row
  const campaigns = new Map(); // campaign name -> row
  const coverage = { utm: 0, tag: 0, ghl: 0, none: 0 };
  const counted = new Set();
  /* Who arrived lately, John's question of 2026-10-16 the day the ads went on.
     Built here rather than as its own resource because this pass already holds
     every contact and every card: it costs no extra API call, no extra cache and
     no extra request from the browser. */
  const arrivals = [];

  for (const contact of contacts) {
    const { source, medium, campaign, basis } = channelOf(contact);
    coverage[basis] += 1;

    const key = medium ? `${source}/${medium}` : source;
    const row =
      channels.get(key) || blankRow({ key, source, medium });
    channels.set(key, row);

    const tags = (contact?.tags || []).map(lower);
    const paid = paidByContact.get(contact.id);

    row.contacts += 1;
    row.by_basis[basis] += 1;
    if (basis === "utm") row.measured += 1;
    if (tags.includes(STARTED_TAG)) row.started += 1;
    if (tags.includes(SUBMITTED_TAG)) row.submitted += 1;
    if (paid) {
      row.paid += 1;
      row.revenue += paid.value;
      /* A second paid card is the cheapest honest retention signal we hold: the
         patient came back and bought again. Not the same as "still subscribed",
         which needs the renewal state per plan, one MDI read per patient. */
      if (paid.cards > 1) row.repeat += 1;
    }
    row.open_value += openByContact.get(contact.id) || 0;
    counted.add(contact.id);

    /* NO TREATMENT HERE, deliberately.
     *
     * The obvious thing to show beside a name is what they came for, and the
     * card name carries it: "Weight Loss - Tirzepatide + Glycine + B12". That is
     * a medication, and the rule in CLAUDE.md is that medication names stay
     * inside MD Integrations. How far they got and where they came from answers
     * "did anyone arrive" without putting a prescription on a dashboard. */
    /* Dated by the LATEST thing on the record, not the earliest. A returning
       patient who just paid belongs at the top of this list, and dating them by
       their sign-up buries them under people who have done nothing since. */
    const added = Date.parse(contact.dateAdded);
    const touched = Math.max(Number.isFinite(added) ? added : 0, lastTouch.get(contact.id) || 0);

    arrivals.push({
      id: contact.id,
      name:
        [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
        contact.contactName ||
        contact.phone ||
        "(no name)",
      at: touched ? new Date(touched).toISOString() : null,
      /* Kept so the page can say whether this is somebody new or somebody
         coming back, which reads very differently to whoever is watching. */
      first_seen: contact.dateAdded || null,
      source,
      medium,
      basis,
      stage: paid ? "paid" : tags.includes(SUBMITTED_TAG) ? "submitted" : tags.includes(STARTED_TAG) ? "started" : "lead",
      value: paid ? Math.round(paid.value) : 0,
    });

    /* Campaigns are only listed where one is known. An untagged channel has no
       campaign to report and padding the table with "(none)" rows would bury
       the ads, which are the only rows anyone opens this for. */
    if (campaign) {
      const c = campaigns.get(campaign) || { name: campaign, source, contacts: 0, paid: 0, revenue: 0 };
      campaigns.set(campaign, c);
      c.contacts += 1;
      if (paid) {
        c.paid += 1;
        c.revenue += paid.value;
      }
    }
  }

  /* Money against a contact the list didn't cover: a card whose contact was
     deleted, or one past the page cap. Counted as unattributed rather than
     dropped, so channel revenue always reconciles against the board's total. */
  let orphan = 0;
  for (const [id, paid] of paidByContact) {
    if (counted.has(id)) continue;
    const row = channels.get(UNATTRIBUTED) || blankRow({ key: UNATTRIBUTED, source: UNATTRIBUTED, medium: "" });
    channels.set(UNATTRIBUTED, row);
    row.paid += 1;
    row.revenue += paid.value;
    orphan += 1;
  }

  const spend = spendBySource();

  /* A source with money against it but nobody to show for it still gets a row.
     Without this the spend counts towards the blended CAC while being invisible
     in the table, so the columns stop adding up to the headline, and a source
     misspelled in _spend.js hides instead of standing out as the obvious $0
     revenue row that it is. */
  for (const source of Object.keys(spend)) {
    if (![...channels.values()].some((r) => r.source === source)) {
      channels.set(source, blankRow({ key: source, source, medium: "" }));
    }
  }

  const rows = [...channels.values()].map((row) => {
    const amount = spend[row.source] || 0;
    const { by_basis, ...rest } = row;
    return {
      ...rest,
      /* What most of this row rests on, so the page can mark a row built from
         GoHighLevel's guess differently from one built from tagged links. */
      basis: BASES.reduce((best, b) => (by_basis[b] > by_basis[best] ? b : best), "none"),
      revenue: Math.round(row.revenue),
      open_value: Math.round(row.open_value),
      spend: Math.round(amount),
      /* Null, not zero, when there is nothing to divide. Zero would read as
         "this channel is free", which is the one wrong answer. */
      cac: amount > 0 && row.paid > 0 ? Math.round(amount / row.paid) : null,
    };
  });

  rows.sort((a, b) => b.revenue - a.revenue || b.contacts - a.contacts);

  /* A contact with no dateAdded cannot be placed on a timeline, and guessing a
     position for it would be worse than leaving it out of this one panel. */
  const dated = arrivals.filter((a) => a.at && Number.isFinite(Date.parse(a.at)));

  const sum = (key) => rows.reduce((n, r) => n + r[key], 0);
  const totalSpend = Math.round(spendTotal());
  const paidTotal = sum("paid");

  return {
    channels: rows,
    campaigns: [...campaigns.values()]
      .map((c) => ({ ...c, revenue: Math.round(c.revenue) }))
      .sort((a, b) => b.revenue - a.revenue || b.contacts - a.contacts),
    totals: {
      contacts: contacts.length,
      started: sum("started"),
      submitted: sum("submitted"),
      paid: paidTotal,
      revenue: sum("revenue"),
      spend: totalSpend,
      cac: totalSpend > 0 && paidTotal > 0 ? Math.round(totalSpend / paidTotal) : null,
    },
    /* How much of the table is fact. Shown on the page rather than kept here,
       because a channel split built mostly from "none" rows is worth reading
       very differently from one built from tagged links. */
    coverage,
    /* Newest first, capped. A list is for "has anybody turned up", not for
       browsing the CRM, and the CRM is one click away for that. */
    recent: dated.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, RECENT_LIMIT),
    /* Counted over everyone, not just the twenty shown, so a busy day still
       reports honestly once the list is full. */
    recent_24h: dated.filter((a) => Date.now() - Date.parse(a.at) < 24 * 60 * 60_000).length,
    spend: {
      recorded: totalSpend > 0,
      total: totalSpend,
      months: spendMonths(),
    },
    orphan_paid: orphan,
    updated_at: new Date().toISOString(),
  };
}

/* --------------------------------- cache --------------------------------- */

/* One entry per view, held briefly. The dashboard is a page people leave open
   and refresh; GA4's own data only moves every few hours and the CRM every few
   minutes, so serving a five-minute-old copy costs nothing and keeps us far
   from either API's quota. */
const CACHE_MS = 5 * 60_000;
/* The ops view is held far longer than the traffic one. Reading the expired
   vouchers to split them costs about thirty seconds, and these are lifetime
   totals that move a handful of times a day, so paying that once every half
   hour is right. Refresh is a manual button, not a wait people sit through. */
const OPS_CACHE_MS = 30 * 60_000;
/* The channel join is three fast GHL calls, so this one can be short. It also
   moves on every payment, which is exactly what someone presses Refresh to see.
*/
const CHANNELS_CACHE_MS = 10 * 60_000;
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

  if (resource === "channels") {
    if (!ghlConfigured()) return res.status(503).json({ error: "not_configured" });

    const hit = cache.get("channels");
    if (hit && Date.now() - hit.at < CHANNELS_CACHE_MS) {
      return res.status(200).json({ ...hit.payload, cached: true });
    }
    try {
      const payload = await channelsPayload();
      cache.set("channels", { at: Date.now(), payload });
      return res.status(200).json(payload);
    } catch (e) {
      console.error("Insights channels failed:", e.message, e.details ?? "");
      return res.status(502).json({ error: "upstream_failed" });
    }
  }

  if (resource === "ops") {
    const hit = cache.get("ops");
    if (hit && Date.now() - hit.at < OPS_CACHE_MS) {
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
