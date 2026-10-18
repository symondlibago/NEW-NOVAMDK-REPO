/* The morning summary as an email (client, 2026-10-18: "have it send me by
   email every morning"). Built from the same payload the /insights page opens
   on, so the email and the page can never disagree.

   It goes out through GoHighLevel, the only mail sender the site has, so it
   carries no treatment names: CLAUDE.md keeps medication names out of
   GoHighLevel even as totals. Top treatments stay on the page, behind the
   button. Counts and sums only, nobody named.

   Kept apart from _ghl.js on purpose: that file carries checkout and renewal
   writes, and a staff email has no business sharing a change with them. */

const BASE = process.env.GHL_API_BASE || "https://services.leadconnectorhq.com";
const TOKEN = process.env.GHL_API_TOKEN;
const LOCATION_ID = process.env.GHL_LOCATION_ID;

const SITE = "https://www.novamdk.com";
const DASHBOARD = `${SITE}/insights`;

/* Who it goes to. A contact made for this address carries the tag, so the
   dashboards can leave it out of their people counts. */
export const DIGEST_TO = process.env.INSIGHTS_EMAIL_TO || "john@novamdk.com";
export const DIGEST_TAG = "insights-email";

/* ------------------------------- wording --------------------------------- */

const nf = new Intl.NumberFormat("en-US");
const count = (n) => nf.format(Math.round(Number(n || 0)));
const money = (n) => `$${count(n)}`;
const plural = (n, one, many) => `${count(n)} ${n === 1 ? one : many}`;

// "2026-10-16" read as a calendar day, whatever zone the server is in.
const dayOf = (ymd) => new Date(`${ymd}T12:00:00Z`);
const weekday = (ymd) => dayOf(ymd).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
const longDay = (ymd) =>
  dayOf(ymd).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
const monthName = (ym) => dayOf(`${ym}-01`).toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* The site's own palette (src/index.css), written out because mail clients
   ignore stylesheets and variables. */
const INK = "#233039";
const MUTED = "#65727F";
const LINE = "#E2E6E6";
const PRIMARY = "#3F5268";
const SAND = "#F4F4EE";
const UP = "#047857";
const DOWN = "#B91C1C";
const FONT = "Inter,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";

function change(now, then, against, format = count) {
  if (now == null || then == null) return null;
  const diff = now - then;
  if (diff === 0) return { words: `Same as ${against}`, tone: MUTED };
  return {
    words: `${diff > 0 ? "Up" : "Down"} ${format(Math.abs(diff))} from ${against}`,
    tone: diff > 0 ? UP : DOWN,
  };
}

/* ------------------------------- layout ---------------------------------- */

/* One figure per row, stacked: label, then the number with its change beside
   it, then one line on what it means. A single column needs no media queries,
   which half the mail apps on a phone ignore anyway. */
function stat({ label, value, missing, delta, note }) {
  const figure = missing
    ? `<span style="font-size:16px;font-weight:500;color:${MUTED};">${esc(missing)}</span>`
    : `<span style="font-size:26px;font-weight:600;color:${INK};letter-spacing:-0.3px;">${esc(value)}</span>` +
      (delta
        ? `<span style="font-size:13px;font-weight:600;color:${delta.tone};padding-left:10px;white-space:nowrap;">${esc(delta.words)}</span>`
        : "");
  return `<tr><td style="padding:16px 0;border-top:1px solid ${LINE};">
<div style="font-size:14px;font-weight:600;color:${INK};">${esc(label)}</div>
<div style="padding-top:6px;line-height:1.3;">${figure}</div>
<div style="padding-top:6px;font-size:13px;line-height:1.5;color:${MUTED};">${esc(note)}</div>
</td></tr>`;
}

function task({ title, detail }) {
  return `<tr><td style="padding:14px 0;border-top:1px solid ${LINE};">
<div style="font-size:15px;font-weight:600;color:${INK};line-height:1.4;">${esc(title)}</div>
<div style="padding-top:4px;font-size:13px;line-height:1.5;color:${MUTED};">${esc(detail)}</div>
</td></tr>`;
}

function card(title, sub, rows) {
  return `<tr><td style="padding-top:16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid ${LINE};border-radius:16px;">
<tr><td style="padding:22px 22px 6px;">
<div style="font-size:19px;font-weight:600;color:${INK};">${esc(title)}</div>
${sub ? `<div style="padding-top:4px;font-size:13px;color:${MUTED};">${esc(sub)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">${rows}</table>
</td></tr>
</table>
</td></tr>`;
}

const SOURCE_NAMES = { stripe: "Stripe", ghl: "GoHighLevel", ga4: "Google Analytics" };
const SOURCE_COVERS = {
  stripe: "money in",
  ghl: "patients, visits, checkouts and plans",
  ga4: "the visitor rate",
};

/* -------------------------------- email ---------------------------------- */

export function digestEmail(data) {
  const { dates, money: m, crm, conversion, visitors, sources } = data;
  const against = `last ${weekday(dates.last_week)}`;
  const month = monthName(dates.month);

  const yesterdayRows = [
    stat({
      label: "Money in",
      value: m && money(m.yesterday),
      missing: !m && "Not available",
      delta: m && change(m.yesterday, m.last_week, against, money),
      note: "Card payments collected, minus refunds.",
    }),
    stat({
      label: "New paying patients",
      value: crm && count(crm.patients.yesterday),
      missing: !crm && "Not available",
      delta: crm && change(crm.patients.yesterday, crm.patients.last_week, against),
      note: "First-time patients whose payment went through.",
    }),
    stat({
      label: "Visits started",
      value: crm && count(crm.visits.yesterday),
      missing: !crm && "Not available",
      delta: crm && change(crm.visits.yesterday, crm.visits.last_week, against),
      note: "People who signed up to start a visit.",
    }),
    stat({
      label: "Visitors who paid",
      value: conversion?.last7 != null && `${conversion.last7}%`,
      missing: conversion?.last7 == null && (visitors ? "No visitors yet" : "Not available"),
      delta:
        conversion?.prev7 != null &&
        change(conversion.last7, conversion.prev7, "the week before", (n) => `${Math.round(n * 10) / 10} points`),
      note:
        visitors && crm
          ? `Last 7 days: ${plural(crm.patients.last7, "patient", "patients")} from ${plural(visitors.last7, "visitor", "visitors")}.`
          : "Last 7 days, new paying patients out of website visitors.",
    }),
    stat({
      label: "Money waiting",
      value: crm && money(crm.unpaid.value),
      missing: !crm && "Not available",
      note: !crm
        ? "Finished the questionnaire but haven't paid yet."
        : crm.unpaid.count === 0
          ? "Nobody is waiting to pay right now."
          : crm.unpaid.count === 1
            ? "1 person finished the questionnaire but hasn't paid yet."
            : `${count(crm.unpaid.count)} people finished the questionnaire but haven't paid yet.`,
    }),
  ].join("");

  const tasks = crm
    ? [
        crm.unpaid.count > 0 && {
          title: `${plural(crm.unpaid.count, "person", "people")} finished the questionnaire but didn't pay`,
          detail: `${money(crm.unpaid.value)} waiting. Follow up from the Intake Submitted column in GoHighLevel.`,
        },
        crm.failed.count > 0 && {
          title: `${plural(crm.failed.count, "card payment", "card payments")} didn't go through`,
          detail: `${money(crm.failed.value)} not collected. They're in the Payment Failed column in GoHighLevel.`,
        },
        crm.renewals_due.count > 0 && {
          title: `${plural(crm.renewals_due.count, "plan renews", "plans renew")} in the next 7 days`,
          detail: `${money(crm.renewals_due.value)} due. Nothing to do unless a card is declined.`,
        },
        crm.cancelled > 0 && {
          title: `${plural(crm.cancelled, "patient", "patients")} turned off renewal this week`,
          detail: "The months they already paid for continue. A quick check-in may help.",
        },
      ].filter(Boolean)
    : [];
  const attentionRows = !crm
    ? `<tr><td style="padding:14px 0;border-top:1px solid ${LINE};font-size:14px;color:${MUTED};">GoHighLevel didn't answer, so this list isn't available this morning.</td></tr>`
    : tasks.length
      ? tasks.map(task).join("")
      : `<tr><td style="padding:14px 0;border-top:1px solid ${LINE};font-size:15px;font-weight:600;color:${UP};">All clear. Nothing needs you today.</td></tr>`;

  const ads = crm?.channels?.find((c) => c.key === "ads");
  const monthRows = [
    stat({
      label: "Active subscribers",
      value: crm && count(crm.subscribers),
      missing: !crm && "Not available",
      note: "Patients on a plan that renews automatically.",
    }),
    stat({
      label: "Monthly recurring revenue",
      value: crm && money(crm.mrr),
      missing: !crm && "Not available",
      note: "What those plans bring in each month.",
    }),
    stat({
      label: "Cost per new patient from ads",
      value: ads?.cac != null && money(ads.cac),
      missing: !crm ? "Not available" : !ads?.spend ? "No ad spend entered" : ads.cac == null && "No patients from ads yet",
      note: ads?.spend
        ? `${money(ads.spend)} ad spend this month, ${plural(ads.patients, "new patient", "new patients")} from ads.`
        : "Ad spend divided by the new patients it brought in.",
    }),
  ].join("");

  const down = Object.entries(sources || {}).filter(([, s]) => s !== "ok");
  const notes = [
    m?.mode === "test" && "Stripe is in test mode, so money figures are test payments, not real ones.",
    ...down.map(
      ([k, s]) =>
        `${SOURCE_NAMES[k]} ${s === "off" ? "isn't connected yet" : "didn't answer this morning"}, so ${SOURCE_COVERS[k]} ${s === "off" ? "isn't" : "wasn't"} included.`
    ),
  ].filter(Boolean);

  const subject =
    m && crm
      ? `${weekday(dates.yesterday)} at NovaMDK: ${money(m.yesterday)} in, ${plural(crm.patients.yesterday, "new patient", "new patients")}`
      : `Your NovaMDK morning summary for ${longDay(dates.yesterday)}`;
  const preheader = !crm
    ? "Yesterday's numbers and the month so far."
    : tasks.length
      ? `${plural(tasks.length, "thing needs", "things need")} you today.`
      : "Nothing needs you today.";

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${SAND};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SAND};font-family:${FONT};">
<tr><td align="center" style="padding:24px 12px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="padding:0 4px;">
<img src="${SITE}/logo-2026.png" width="120" alt="NOVA MDK" style="display:block;border:0;height:auto;">
<div style="padding-top:18px;font-size:24px;font-weight:600;color:${INK};line-height:1.3;">Good morning. Here's how yesterday went.</div>
<div style="padding-top:6px;font-size:14px;color:${MUTED};">${esc(longDay(dates.yesterday))}, compared with ${esc(against)}.</div>
</td></tr>
${notes.length ? `<tr><td style="padding-top:16px;"><div style="background:#FFFFFF;border:1px solid ${LINE};border-radius:12px;padding:12px 16px;font-size:13px;line-height:1.5;color:${INK};">${notes.map(esc).join("<br>")}</div></td></tr>` : ""}
${card("How yesterday went", null, yesterdayRows)}
${card("Needs your attention", "Only shows what needs a person today.", attentionRows)}
${card(`${month} so far`, `From ${month} 1 to today.`, monthRows)}
<tr><td align="center" style="padding-top:24px;">
<a href="${DASHBOARD}" style="display:inline-block;background:${PRIMARY};color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;padding:13px 28px;border-radius:999px;">Open the dashboard</a>
</td></tr>
<tr><td align="center" style="padding:20px 8px 0;font-size:12px;line-height:1.6;color:${MUTED};">
Top treatments, kiosks and the full details are on the dashboard.<br>Days run midnight to midnight, Pacific time.
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  return { subject, html };
}

/* ------------------------------- sending --------------------------------- */

export const digestConfigured = () => Boolean(TOKEN && LOCATION_ID);

async function ghl(path, body, version = "2021-07-28") {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Version: version,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.message || `GHL POST ${path} failed (${res.status})`);
    err.status = res.status;
    err.details = data;
    throw err;
  }
  return data;
}

/* GoHighLevel only emails contacts, so the address has to be one. An existing
   contact is used exactly as it is. A missing one is made with the email and
   the tag and nothing else: no website-lead tag and no source, so no patient
   workflow picks it up. */
async function contactFor(email) {
  const found = await ghl("/contacts/search", {
    locationId: LOCATION_ID,
    pageLimit: 1,
    filters: [{ field: "email", operator: "eq", value: email }],
  });
  const existing = (found?.contacts || [])[0];
  if (existing?.id) return existing.id;

  const made = await ghl("/contacts/", { locationId: LOCATION_ID, email, tags: [DIGEST_TAG] });
  return made?.contact?.id || null;
}

/* Same endpoint and Version as the kiosk text (sendSms in _ghl.js), sent from
   the location's own email sender. */
export async function sendDigest(data, to = DIGEST_TO) {
  const contactId = await contactFor(to);
  if (!contactId) throw new Error(`No GoHighLevel contact for ${to}`);
  const { subject, html } = digestEmail(data);
  await ghl("/conversations/messages", { type: "Email", contactId, subject, html }, "2021-04-15");
  return { subject };
}
