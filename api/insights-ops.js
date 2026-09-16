import { blocked } from "./_guard.js";
import { readAdminSession } from "./_admin.js";
import { ghlConfigured, pipelineBoard, listOpportunities } from "./_ghl.js";
import { mdi, mdiConfigured } from "./_mdi.js";

/* The half of the dashboard that GA4 can never show: where visits actually sit.
   GHL gives the board (leads through to shipped), MDI gives the intake funnel.

   Everything here is counted server-side and only counts are returned. A staff
   dashboard needs the shape of the funnel, not the people in it. */

const CACHE_MS = 5 * 60_000;
let cache = null;

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

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (blocked(req, res)) return;

  if (!readAdminSession(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (cache && Date.now() - cache.at < CACHE_MS) {
    return res.status(200).json({ ...cache.payload, cached: true });
  }

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

  /* Only a complete answer is cached. Caching a half-answer would hold a
     transient MDI or GHL blip on screen for the full five minutes after the
     source recovered, which looks exactly like a broken panel. A source that
     isn't configured counts as complete: it is never going to answer. */
  const complete = (!ghlConfigured() || payload.board) && (!mdiConfigured() || payload.intake);
  if (complete) cache = { at: Date.now(), payload };

  return res.status(200).json(payload);
}
