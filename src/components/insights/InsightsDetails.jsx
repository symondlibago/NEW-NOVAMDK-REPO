import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CircleDollarSign, Eye, Megaphone, MousePointerClick, UserPlus, Users } from "lucide-react";
import { locationById } from "../../lib/kioskLocations";
import { SectionTitle, Stat } from "./MorningSummary";

/* Details on /insights, cut down to four parts at the client's request
   (2026-10-24): the page had too many numbers and it wasn't clear where they
   came from. Each part says its source and the period it covers.

   1 New people and 2 the funnel and 3 the channels read GoHighLevel through
   ?resource=channels, every record since the start. 4 reads Google Analytics
   and our own kiosk count over the 7, 28 or 90 day window. */

const ACCENT = "#A97D24";
const card = "rounded-2xl border border-line bg-surface p-4 sm:p-5";

const nf = new Intl.NumberFormat("en-US");
const count = (n) => nf.format(Math.round(Number(n || 0)));
const money = (n) => `$${count(n)}`;
const share = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);
// "2026-10" read as a calendar month, whatever zone the browser is in.
const monthName = (ym) =>
  new Date(`${ym}-01T12:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

const WINDOWS = [7, 28, 90];

const CHANNEL_NAME = {
  unknown: "Not identified",
  fb_ad: "Meta ads",
  instagram: "Instagram",
  email: "Email",
  ghl: "Text messages",
  kiosk: "Kiosks",
};
const channelName = (source) =>
  CHANNEL_NAME[source] || String(source).replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

const STAGE_LABEL = {
  paid: "Paid",
  submitted: "Finished questions",
  started: "Started a visit",
  lead: "Signed up",
};

const STAGE_TONE = {
  paid: "border-primary/45 bg-primary text-on-primary",
  submitted: "border-primary/35 bg-primary/10 text-primary-deep",
  started: "border-line-strong/50 bg-surface-2 text-ink",
  lead: "border-line bg-surface-2 text-muted",
};

/* "40 min ago" rather than a clock time: the question here is whether anybody
   has turned up, and a timestamp makes the reader do the subtraction. */
function ago(iso) {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "";
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/* A record that was here well before its latest activity is somebody coming
   back. A day's grace, since an intake that straddles midnight is one visit. */
const DAY_MS = 24 * 60 * 60 * 1000;
function returning(row) {
  const first = Date.parse(row.first_seen);
  const last = Date.parse(row.at);
  return Number.isFinite(first) && Number.isFinite(last) && last - first > DAY_MS;
}

/* One row per channel. The API splits a channel by medium, and every split
   carries the channel's whole ad spend, so they are added up here with the
   spend taken once. */
function bySource(rows) {
  const out = new Map();
  for (const r of rows) {
    const row = out.get(r.source) || { source: r.source, contacts: 0, paid: 0, revenue: 0, spend: 0 };
    row.contacts += r.contacts;
    row.paid += r.paid;
    row.revenue += r.revenue;
    row.spend = Math.max(row.spend, r.spend);
    out.set(r.source, row);
  }
  return [...out.values()]
    .map((r) => ({ ...r, cac: r.spend > 0 && r.paid > 0 ? Math.round(r.spend / r.paid) : null }))
    .sort((a, b) => b.revenue - a.revenue || b.contacts - a.contacts);
}

const costCell = (r) => (r.cac != null ? money(r.cac) : r.spend ? "No patients" : "No spend");

/* GA4 names a source like "m.facebook.com / referral" or "(direct) / (none)".
   Read as plain words, and the ones that come out the same added together. */
const SITE_NAME = {
  facebook: "Facebook",
  "m.facebook.com": "Facebook",
  "l.facebook.com": "Facebook",
  "lm.facebook.com": "Facebook",
  fb: "Facebook",
  instagram: "Instagram",
  ig: "Instagram",
  "l.instagram.com": "Instagram",
  kiosk: "Kiosk code",
  email: "Email",
  ghl: "Text messages",
};
const AD_MEDIUM = new Set(["paid", "cpc", "paid_social", "paidsocial", "ppc"]);
const cap = (w) => w.replace(/^./, (c) => c.toUpperCase());

function visitSource(raw) {
  const [source = "", medium = ""] = String(raw).toLowerCase().split(" / ");
  if (source === "(direct)") return "Typed in or bookmarked";
  const name = SITE_NAME[source] || source;
  if (medium === "organic") return `${cap(name)} search`;
  if (AD_MEDIUM.has(medium)) return `${cap(name)} ads`;
  return SITE_NAME[source] || raw;
}

function visitSources(rows) {
  const out = new Map();
  for (const r of rows) {
    const name = visitSource(r.name);
    out.set(name, (out.get(name) || 0) + r.users);
  }
  return [...out].map(([name, users]) => ({ name, users })).sort((a, b) => b.users - a.users);
}

const shortDate = (iso) => (iso || "").slice(5).replace("-", "/");

const table = "w-full whitespace-nowrap text-sm";
const head = "text-left text-muted";
const th = "pb-2 pr-3 font-medium last:pr-0 sm:pr-4";
const row = "border-t border-line";
const tdc = "py-3 pr-3 last:pr-0 sm:pr-4";

function NewPeople({ rows, today }) {
  return (
    <section className="space-y-4">
      <SectionTitle
        title="New people"
        sub="The last 20 people to sign up or do something, newest first. From GoHighLevel."
      />
      <div className={card}>
        <p className="text-sm font-semibold text-ink">
          {today === 1 ? "1 person" : `${count(today)} people`} in the last 24 hours
        </p>
        {rows?.length ? (
          <>
            {/* A list on phones, where five columns would need a sideways scroll. */}
            <ul className="mt-3 divide-y divide-line sm:hidden">
              {rows.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{r.name}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {ago(r.at)}, {channelName(r.source)}
                      {returning(r) && `, first came ${ago(r.first_seen)}`}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STAGE_TONE[r.stage]}`}
                    >
                      {STAGE_LABEL[r.stage]}
                    </span>
                    {r.value > 0 && <p className="mt-1 text-sm font-semibold tabular-nums text-ink">{money(r.value)}</p>}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 hidden overflow-x-auto sm:block">
              <table className={table}>
                <thead>
                  <tr className={head}>
                    <th className={th}>Person</th>
                    <th className={th}>Last activity</th>
                    <th className={th}>Came from</th>
                    <th className={th}>Got as far as</th>
                    <th className={`${th} text-right`}>Paid</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {rows.map((r) => (
                    <tr key={r.id} className={row}>
                      <td className={`${tdc} font-medium text-ink`}>
                        {r.name}
                        {returning(r) && (
                          <span className="ml-2 text-xs font-normal text-muted">first came {ago(r.first_seen)}</span>
                        )}
                      </td>
                      <td className={`${tdc} text-muted`}>{ago(r.at)}</td>
                      <td className={`${tdc} text-muted`}>{channelName(r.source)}</td>
                      <td className={tdc}>
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STAGE_TONE[r.stage]}`}
                        >
                          {STAGE_LABEL[r.stage]}
                        </span>
                      </td>
                      <td className={`${tdc} text-right font-semibold text-ink`}>
                        {r.value > 0 ? money(r.value) : <span className="font-normal text-muted">Not yet</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted">Nobody yet.</p>
        )}
      </div>
    </section>
  );
}

/* Each step as a share of the one before it, which is where people are lost.
   A share over 100% only happens when older records miss a tag, so it is left
   off rather than shown as nonsense. */
function Funnel({ totals, repeat }) {
  const steps = [
    { label: "Signed up", note: "Left their details on the site or at a kiosk", value: totals.contacts },
    { label: "Started a visit", note: "Opened the medical questions", value: totals.started },
    { label: "Finished the questions", note: "Sent to a provider for review", value: totals.submitted },
    { label: "Paid", note: "Their card payment went through", value: totals.paid },
    { label: "Bought again", note: "Paid for more than one order", value: repeat },
  ];
  const max = Math.max(1, ...steps.map((s) => s.value));

  return (
    <section className="space-y-4">
      <SectionTitle title="Your funnel" sub="Everyone since the start, and how far they got. From GoHighLevel." />
      <ol className={`${card} space-y-5`}>
        {steps.map((s, i) => {
          const before = steps[i - 1]?.value;
          const showShare = i > 0 && before > 0 && s.value <= before;
          return (
            <li key={s.label}>
              <div className="flex items-baseline justify-between gap-4">
                <p className="min-w-0">
                  <span className="block font-semibold text-ink">{s.label}</span>
                  <span className="block text-xs text-muted">{s.note}</span>
                </p>
                <p className="shrink-0 text-right">
                  <span className="block text-2xl font-semibold tabular-nums leading-none text-ink">
                    {count(s.value)}
                  </span>
                  {showShare && (
                    <span className="mt-1 block text-xs text-muted">{share(s.value, before)}% of the step before</span>
                  )}
                </p>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full" style={{ width: `${(s.value / max) * 100}%`, background: ACCENT }} />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Channels({ data }) {
  const { channels, campaigns, totals, coverage, spend } = data;
  const rows = bySource(channels);
  const known = coverage.utm + coverage.tag;

  return (
    <section className="space-y-4">
      <SectionTitle
        title="Where patients come from"
        sub="Everyone since the start. From GoHighLevel, with ad spend as entered each month."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <Stat icon={CircleDollarSign} label="Revenue" value={money(totals.revenue)} note="Paid orders in GoHighLevel." />
        <Stat
          icon={Megaphone}
          label="Ad spend"
          value={spend.recorded ? money(totals.spend) : "None entered"}
          note={spend.months.length ? `Entered for ${spend.months.map(monthName).join(", ")}.` : "Typed in by hand each month."}
        />
        <Stat
          icon={UserPlus}
          label="Cost per patient"
          className="col-span-2 lg:col-span-1"
          value={totals.cac != null ? money(totals.cac) : spend.recorded ? "No patients yet" : "No ad spend"}
          note="Ad spend divided by paying patients."
        />
      </div>

      <div className={card}>
        <p className="text-base font-semibold text-ink">By channel</p>
        <div className="mt-3 overflow-x-auto">
          <table className={table}>
            <thead>
              <tr className={head}>
                <th className={th}>Channel</th>
                <th className={`${th} text-right`}>People</th>
                <th className={`${th} text-right`}>Paid</th>
                <th className={`${th} text-right`}>Revenue</th>
                <th className={`${th} text-right`}>Per patient</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {rows.map((r) => (
                <tr key={r.source} className={row}>
                  <td className={`${tdc} whitespace-normal font-medium text-ink`}>{channelName(r.source)}</td>
                  <td className={`${tdc} text-right text-ink`}>{count(r.contacts)}</td>
                  <td className={`${tdc} text-right font-semibold text-ink`}>{count(r.paid)}</td>
                  <td className={`${tdc} text-right font-semibold text-ink`}>{money(r.revenue)}</td>
                  <td className={`${tdc} text-right text-muted`}>{costCell(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          {`We know the channel for sure for ${count(known)} of ${count(totals.contacts)} people (${share(known, totals.contacts)}%), from a tagged ad link or a kiosk. For the rest it is GoHighLevel's best guess, or not known.`}
        </p>
      </div>

      {campaigns.length > 0 && (
        <div className={card}>
          <p className="text-base font-semibold text-ink">By campaign</p>
          <p className="mt-1 text-sm text-muted">Each ad campaign or kiosk named on an incoming link.</p>
          <div className="mt-3 overflow-x-auto">
            <table className={table}>
              <thead>
                <tr className={head}>
                  <th className={th}>Campaign</th>
                  <th className={`${th} hidden sm:table-cell`}>Channel</th>
                  <th className={`${th} text-right`}>People</th>
                  <th className={`${th} text-right`}>Paid</th>
                  <th className={`${th} text-right`}>Revenue</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {campaigns.map((c) => (
                  <tr key={`${c.source}-${c.name}`} className={row}>
                    <td className={`${tdc} whitespace-normal font-medium text-ink`}>
                      {(c.source === "kiosk" && locationById(c.name)?.label) || c.name}
                    </td>
                    <td className={`${tdc} hidden text-muted sm:table-cell`}>{channelName(c.source)}</td>
                    <td className={`${tdc} text-right text-ink`}>{count(c.contacts)}</td>
                    <td className={`${tdc} text-right font-semibold text-ink`}>{count(c.paid)}</td>
                    <td className={`${tdc} text-right font-semibold text-ink`}>{money(c.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function Traffic({ data, days, onDays, note }) {
  const f = data?.funnel;
  const kiosks = data?.kiosks_counted;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle
          title="Website and kiosks"
          sub={`Last ${days} days. From Google Analytics, a few hours behind. Kiosk scans are our own count.`}
        />
        {/* Only once Google has answered: without the key these would be
            three buttons that visibly do nothing. */}
        {data && (
          <div className="flex gap-1 rounded-full border border-line bg-surface p-1">
            {WINDOWS.map((d) => (
              <button
                key={d}
                onClick={() => onDays(d)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  d === days ? "bg-primary text-on-primary" : "text-muted hover:text-ink"
                }`}
              >
                {d} days
              </button>
            ))}
          </div>
        )}
      </div>

      {note && <p className={`${card} text-sm text-muted`}>{note}</p>}

      {!data ? (
        !note && <p className={`${card} text-sm text-muted`}>Loading the website numbers…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            <Stat icon={Users} label="Visitors" value={count(data.totals.users)} note="People who opened the website." />
            <Stat
              icon={Eye}
              label="Treatment views"
              value={count(f.product_viewed)}
              note="Times someone opened a treatment page."
            />
            <Stat
              icon={MousePointerClick}
              label="Clicked Start"
              className="col-span-2 lg:col-span-1"
              value={count(f.start_visit)}
              note={
                f.product_viewed
                  ? `${share(f.start_visit, f.product_viewed)}% of treatment views. Pressed a Start button.`
                  : "Pressed a Start button."
              }
            />
          </div>

          <div className={card}>
            <p className="text-base font-semibold text-ink">Visitors per day</p>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trend} margin={{ left: 0, right: 12, top: 6 }}>
                  <CartesianGrid vertical={false} stroke="rgba(128,128,128,0.18)" />
                  <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} width={34} tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v) => [count(v), "Visitors"]} labelFormatter={shortDate} />
                  <Line type="monotone" dataKey="users" stroke={ACCENT} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className={card}>
              <p className="text-base font-semibold text-ink">Where visitors came from</p>
              {data.sources.length ? (
                <table className={`${table} mt-3`}>
                  <tbody className="tabular-nums">
                    {visitSources(data.sources).map((s) => (
                      <tr key={s.name} className={`${row} first:border-0`}>
                        <td className={`${tdc} truncate text-ink`}>{s.name}</td>
                        <td className={`${tdc} text-right font-semibold text-ink`}>{count(s.users)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="mt-3 text-sm text-muted">No visitors in this window.</p>
              )}
            </div>

            <div className={card}>
              <p className="text-base font-semibold text-ink">Most viewed treatments</p>
              {data.products.length ? (
                <ol className="mt-3 space-y-3">
                  {data.products.slice(0, 8).map((p, i) => (
                    <li key={p.name} className="flex items-center gap-3 text-sm">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-ink">{p.name}</span>
                      <span className="font-semibold tabular-nums text-ink">{count(p.count)}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-sm text-muted">No treatment views in this window.</p>
              )}
            </div>

            <div className={card}>
              <p className="text-base font-semibold text-ink">Kiosk scans</p>
              {kiosks?.length ? (
                <table className={`${table} mt-3`}>
                  <tbody className="tabular-nums">
                    {kiosks.map((k) => (
                      <tr key={k.name} className={`${row} first:border-0`}>
                        <td className={`${tdc} truncate text-ink`}>{locationById(k.name)?.label || k.name}</td>
                        <td className={`${tdc} text-right font-semibold text-ink`}>{count(k.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  {kiosks ? "No kiosk scans in this window." : "The scan counter isn't reachable right now."}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default function InsightsDetails({ channels, channelsFailed, traffic, trafficNote, days, onDays }) {
  const repeat = channels ? channels.channels.reduce((n, r) => n + r.repeat, 0) : 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 py-8">
      {channels ? (
        <>
          <NewPeople rows={channels.recent} today={channels.recent_24h} />
          <Funnel totals={channels.totals} repeat={repeat} />
          <Channels data={channels} />
        </>
      ) : (
        <p className="text-sm text-muted">
          {channelsFailed
            ? "GoHighLevel didn't answer, so people and channels aren't available right now. Press Refresh to try again."
            : "Loading the GoHighLevel numbers…"}
        </p>
      )}

      <Traffic data={traffic} days={days} onDays={onDays} note={trafficNote} />

      <footer className="border-t border-line pt-5 text-xs leading-relaxed text-muted">
        People, the funnel and channels come from GoHighLevel and are live. Website numbers come from Google
        Analytics, which runs a few hours behind, so today is usually incomplete. Kiosk scans are counted on our own
        server. What anyone came for stays in the clinical system and is not shown here.
      </footer>
    </div>
  );
}
