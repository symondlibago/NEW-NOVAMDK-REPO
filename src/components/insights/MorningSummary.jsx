import {
  CircleCheck,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Hourglass,
  Info,
  Minus,
  Percent,
  Repeat,
  TrendingDown,
  TrendingUp,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { productsData } from "../data/products";
import { displayTitle } from "../../lib/catalog";
import { locationById } from "../../lib/kioskLocations";

/* The morning summary on /insights (client, 2026-10-18): the few numbers that
   say how the business is running, each with a plain label and one line on
   what it means. Everything else on the page sits under Details.

   Reads /api/insights?resource=summary, which is counts and sums only. */

const nf = new Intl.NumberFormat("en-US");
const count = (n) => nf.format(Math.round(Number(n || 0)));
const money = (n) => `$${count(n)}`;
const plural = (n, one, many) => `${count(n)} ${n === 1 ? one : many}`;

// "2026-10-16" read as a calendar day, whatever zone the browser is in.
const dayOf = (ymd) => new Date(`${ymd}T12:00:00Z`);
const weekday = (ymd) => dayOf(ymd).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
const longDay = (ymd) =>
  dayOf(ymd).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
const monthName = (ym) => dayOf(`${ym}-01`).toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });

/* Dose steps of one treatment are separate products in the catalogue and one
   treatment to the person reading this, so they are added together. */
const treatmentName = (id) => {
  const p = productsData.find((x) => String(x.id) === String(id));
  return p ? displayTitle(p).replace(/\s+Maintenance$/i, "") : `Product ${id}`;
};

function topTreatments(rows) {
  const byName = new Map();
  for (const r of rows || []) {
    const name = treatmentName(r.product_id);
    const row = byName.get(name) || { name, revenue: 0, sales: 0 };
    row.revenue += r.revenue;
    row.sales += r.sales;
    byName.set(name, row);
  }
  return [...byName.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 3);
}

const card = "rounded-2xl border border-line bg-surface p-4 sm:p-5";

/* Up, down or the same as last week, in words. Up is good for every figure
   this is used on. */
function Change({ now, then, format = count, against }) {
  if (now == null || then == null) return null;
  const diff = now - then;
  const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const tone = diff > 0 ? "text-emerald-700" : diff < 0 ? "text-red-700" : "text-muted";
  const words =
    diff === 0
      ? `Same as ${against}`
      : `${diff > 0 ? "Up" : "Down"} ${format(Math.abs(diff))} from ${against}`;
  return (
    <p className={`mt-2 flex items-center gap-1.5 text-sm font-medium ${tone}`}>
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {words}
    </p>
  );
}

function Stat({ icon, label, value, missing, children, note, className = "" }) {
  const Icon = icon;
  return (
    <div className={`${card} flex flex-col ${className}`}>
      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
        {label}
      </p>
      {missing ? (
        <p className="mt-3 text-base font-medium text-muted">{missing}</p>
      ) : (
        <>
          <p className="mt-3 text-3xl font-semibold tabular-nums leading-none tracking-tight text-ink sm:text-4xl">{value}</p>
          {children}
        </>
      )}
      <p className="mt-auto pt-3 text-xs leading-relaxed text-muted">{note}</p>
    </div>
  );
}

function Task({ icon, number, title, detail }) {
  const Icon = icon;
  return (
    <li className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-muted">{detail}</p>
      </div>
      <span className="text-2xl font-semibold tabular-nums text-ink">{count(number)}</span>
    </li>
  );
}

function SectionTitle({ title, sub }) {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h2>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </div>
  );
}

const SOURCE_NAMES = { stripe: "Stripe", ghl: "GoHighLevel", ga4: "Google Analytics" };
const SOURCE_COVERS = {
  stripe: "money in and top treatments",
  ghl: "patients, visits, checkouts and plans",
  ga4: "the visitor rate and kiosk scans",
};

export default function MorningSummary({ data }) {
  const { dates, money: m, crm, conversion, visitors, kiosks, sources } = data;
  const against = `last ${weekday(dates.last_week)}`;
  const month = monthName(dates.month);
  const top = topTreatments(m?.by_product);
  const down = Object.entries(sources || {}).filter(([, s]) => s !== "ok");

  const tasks = crm
    ? [
        crm.unpaid.count > 0 && {
          key: "unpaid",
          icon: Hourglass,
          number: crm.unpaid.count,
          title: `${plural(crm.unpaid.count, "person", "people")} finished the questionnaire but didn't pay`,
          detail: `${money(crm.unpaid.value)} waiting. Follow up from the Intake Submitted column in GoHighLevel.`,
        },
        crm.failed.count > 0 && {
          key: "failed",
          icon: CreditCard,
          number: crm.failed.count,
          title: `${plural(crm.failed.count, "card payment", "card payments")} didn't go through`,
          detail: `${money(crm.failed.value)} not collected. They're in the Payment Failed column in GoHighLevel.`,
        },
        crm.renewals_due.count > 0 && {
          key: "renewals",
          icon: Repeat,
          number: crm.renewals_due.count,
          title: `${plural(crm.renewals_due.count, "plan renews", "plans renew")} in the next 7 days`,
          detail: `${money(crm.renewals_due.value)} due. Nothing to do unless a card is declined.`,
        },
        crm.cancelled > 0 && {
          key: "cancelled",
          icon: UserMinus,
          number: crm.cancelled,
          title: `${plural(crm.cancelled, "patient", "patients")} turned off renewal this week`,
          detail: "The months they already paid for continue. A quick check-in may help.",
        },
      ].filter(Boolean)
    : [];

  const channelRows = crm
    ? [
        { ...crm.channels.find((c) => c.key === "ads"), label: "Ads" },
        { ...crm.channels.find((c) => c.key === "kiosk"), label: "Kiosks" },
        { ...crm.channels.find((c) => c.key === "other"), label: "Everything else", hint: "Website, search, word of mouth" },
      ]
    : [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 py-8">
      {m?.mode === "test" && (
        <p className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm font-medium text-ink">
          <Info className="size-4 shrink-0 text-primary" aria-hidden="true" />
          Stripe is in test mode here, so money figures are test payments, not real ones.
        </p>
      )}

      {/* 1. Yesterday */}
      <section className="space-y-4">
        <SectionTitle title="How yesterday went" sub={`${longDay(dates.yesterday)}, compared with ${against}.`} />
        {/* Two across on a phone, so yesterday fits on about one screen. */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <Stat
            icon={CircleDollarSign}
            label="Money in"
            value={m && money(m.yesterday)}
            missing={!m && "Not available"}
            note="Card payments collected, minus refunds."
          >
            {m && <Change now={m.yesterday} then={m.last_week} format={money} against={against} />}
          </Stat>
          <Stat
            icon={UserPlus}
            label="New paying patients"
            value={crm && count(crm.patients.yesterday)}
            missing={!crm && "Not available"}
            note="First-time patients whose payment went through."
          >
            {crm && <Change now={crm.patients.yesterday} then={crm.patients.last_week} against={against} />}
          </Stat>
          <Stat
            icon={ClipboardList}
            label="Visits started"
            value={crm && count(crm.visits.yesterday)}
            missing={!crm && "Not available"}
            note="People who signed up to start a visit."
          >
            {crm && <Change now={crm.visits.yesterday} then={crm.visits.last_week} against={against} />}
          </Stat>
          <Stat
            icon={Percent}
            label="Visitors who paid"
            value={conversion?.last7 != null && `${conversion.last7}%`}
            missing={conversion?.last7 == null && (visitors ? "No visitors yet" : "Not available")}
            note={
              visitors && crm
                ? `Last 7 days: ${plural(crm.patients.last7, "patient", "patients")} from ${plural(visitors.last7, "visitor", "visitors")}.`
                : "Last 7 days, new paying patients out of website visitors."
            }
          >
            {conversion?.prev7 != null && (
              <Change
                now={conversion.last7}
                then={conversion.prev7}
                format={(n) => `${Math.round(n * 10) / 10} points`}
                against="the week before"
              />
            )}
          </Stat>
          <Stat
            icon={Hourglass}
            label="Money waiting"
            className="col-span-2 lg:col-span-1"
            value={crm && money(crm.unpaid.value)}
            missing={!crm && "Not available"}
            note="Finished the questionnaire but haven't paid yet."
          >
            {crm && (
              <p className="mt-2 text-sm font-medium text-muted">
                {plural(crm.unpaid.count, "checkout", "checkouts")} right now
              </p>
            )}
          </Stat>
        </div>
      </section>

      {/* 2. Needs attention */}
      <section className="space-y-4">
        <SectionTitle title="Needs your attention" sub="Only shows what needs a person today." />
        <div className={card}>
          {!crm ? (
            <p className="text-sm text-muted">GoHighLevel didn't answer, so this list isn't available right now.</p>
          ) : tasks.length ? (
            <ul className="divide-y divide-line">
              {tasks.map(({ key, ...t }) => (
                <Task key={key} {...t} />
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-3 text-base font-semibold text-ink">
              <CircleCheck className="size-6 text-emerald-700" aria-hidden="true" />
              All clear. Nothing needs you today.
            </p>
          )}
        </div>
      </section>

      {/* 3. The month */}
      <section className="space-y-4">
        <SectionTitle title={`${month} so far`} sub={`From ${month} 1 to today.`} />

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Stat
            icon={Users}
            label="Active subscribers"
            value={crm && count(crm.subscribers)}
            missing={!crm && "Not available"}
            note="Patients on a plan that renews automatically."
          />
          <Stat
            icon={Repeat}
            label="Monthly recurring revenue"
            value={crm && money(crm.mrr)}
            missing={!crm && "Not available"}
            note="What those plans bring in each month."
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className={card}>
            <p className="text-base font-semibold text-ink">Cost per new patient</p>
            <p className="mt-1 text-sm text-muted">Ad spend divided by the new patients it brought in.</p>
            {crm ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted">
                      <th className="pb-2 font-medium">Where they came from</th>
                      <th className="pb-2 text-right font-medium">New patients</th>
                      <th className="pb-2 text-right font-medium">Ad spend</th>
                      <th className="pb-2 text-right font-medium">Per patient</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {channelRows.map((r) => (
                      <tr key={r.key} className="border-t border-line">
                        <td className="py-3 pr-3">
                          <span className="font-medium text-ink">{r.label}</span>
                          {r.hint && <span className="block text-xs text-muted">{r.hint}</span>}
                        </td>
                        <td className="py-3 text-right font-medium text-ink">{count(r.patients)}</td>
                        <td className="py-3 text-right text-ink">{r.spend ? money(r.spend) : "None"}</td>
                        <td className="py-3 text-right font-semibold text-ink">
                          {r.cac != null ? money(r.cac) : r.spend ? "No patients yet" : "No ad spend"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">Not available right now.</p>
            )}
          </div>

          <div className={card}>
            <p className="text-base font-semibold text-ink">Top treatments by sales</p>
            <p className="mt-1 text-sm text-muted">Money collected this month, after refunds.</p>
            {!m ? (
              <p className="mt-4 text-sm text-muted">Not available right now.</p>
            ) : top.length ? (
              <ol className="mt-4 space-y-3">
                {top.map((t, i) => (
                  <li key={t.name} className="flex items-center gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-ink">{t.name}</span>
                      <span className="block text-xs text-muted">{plural(t.sales, "sale", "sales")}</span>
                    </span>
                    <span className="font-semibold tabular-nums text-ink">{money(t.revenue)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-muted">No sales yet this month.</p>
            )}
          </div>
        </div>

        <div className={card}>
          <p className="text-base font-semibold text-ink">Kiosks</p>
          <p className="mt-1 text-sm text-muted">QR scans and the new paying patients each kiosk brought in.</p>
          {kiosks.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted">
                    <th className="pb-2 font-medium">Location</th>
                    <th className="pb-2 text-right font-medium">Scans</th>
                    <th className="pb-2 text-right font-medium">Paying patients</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {kiosks.map((k) => (
                    <tr key={k.id} className="border-t border-line">
                      <td className="py-3 pr-3 font-medium text-ink">{locationById(k.id)?.label || k.id}</td>
                      <td className="py-3 text-right text-ink">{count(k.scans)}</td>
                      <td className="py-3 text-right font-semibold text-ink">{count(k.patients)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">No kiosk scans yet this month.</p>
          )}
        </div>
      </section>

      <footer className="space-y-2 border-t border-line pt-5 text-xs leading-relaxed text-muted">
        {down.map(([key, state]) => (
          <p key={key} className="font-medium text-ink">
            {SOURCE_NAMES[key]} {state === "off" ? "isn't connected yet" : "didn't answer this time"}, so{" "}
            {SOURCE_COVERS[key]} {state === "off" ? "will show once it is." : "may be missing. Press Refresh to try again."}
          </p>
        ))}
        <p>
          Money comes from Stripe, before Stripe&rsquo;s fees. Patients, visits, checkouts and plans come from
          GoHighLevel. Visitors and kiosk scans come from Google Analytics. Days run midnight to midnight,
          Pacific time.
        </p>
      </footer>
    </div>
  );
}
