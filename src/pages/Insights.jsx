import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ExternalLink, Lock, LogOut, RefreshCw } from "lucide-react";
import Seo from "../components/Seo";
import { insightsAuth, insightsData, insightsOps } from "../lib/insights";

/* Staff analytics, reading GA4 through /api/insights and the CRM through
   /api/insights?resource=ops. Everything on this page is aggregate counts: no patient is
   identifiable here, and nothing clinical is in either source to begin with. */

const WINDOWS = [
  { days: 7, label: "7 days" },
  { days: 28, label: "28 days" },
  { days: 90, label: "90 days" },
];

const ACCENT = "#A97D24";

/* The Looker Studio report, embedded rather than rebuilt. Looker reads GA4 as
   the signed-in Google user, so it needs none of the service-account setup the
   summary panels depend on: this section works the moment embedding is switched
   on in Looker's File menu. Report id from the report's own URL. */
const LOOKER_REPORT_ID =
  import.meta.env.VITE_LOOKER_REPORT_ID || "cbdba9bd-0264-48d9-82ef-ae37bc7f02b0";
const LOOKER_EMBED = LOOKER_REPORT_ID
  ? `https://lookerstudio.google.com/embed/reporting/${LOOKER_REPORT_ID}/page/Hp18F`
  : null;
const LOOKER_FULL = LOOKER_REPORT_ID
  ? `https://lookerstudio.google.com/reporting/${LOOKER_REPORT_ID}`
  : null;

/* Near full width with a small gutter: these panels are tables and funnels, and
   a 1180px column wasted half of a laptop screen on empty margin. */
const shell = "mx-auto w-full max-w-[1760px]";
const card = "rounded-2xl border border-line bg-surface p-5";
const sectionLabel = "font-mono text-[11px] uppercase tracking-[0.14em] text-muted";
const chip =
  "flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-[0.82rem] font-semibold text-muted transition-colors hover:border-primary hover:text-ink";

const nf = new Intl.NumberFormat("en-US");
const count = (n) => nf.format(Number(n || 0));
const money = (n) => `$${nf.format(Math.round(Number(n || 0)))}`;

/* GA4 dates arrive as 2026-09-16; the axis only has room for the day. */
const shortDate = (iso) => (iso || "").slice(5).replace("-", "/");

const clockOf = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

function Metric({ label, value, hint }) {
  return (
    <div className={card}>
      <p className={sectionLabel}>{label}</p>
      <p className="mt-2 text-[1.9rem] font-bold leading-none">{value}</p>
      {hint && <p className="mt-1.5 text-[0.8rem] text-muted">{hint}</p>}
    </div>
  );
}

function Bars({ title, rows, empty }) {
  return (
    <div className={card}>
      <p className={sectionLabel}>{title}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-[0.85rem] text-muted">{empty}</p>
      ) : (
        <div className="mt-3" style={{ height: Math.max(140, rows.length * 34) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
              />
              <Tooltip formatter={(v) => count(v)} />
              <Bar dataKey="count" fill={ACCENT} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* The board as a funnel rather than a bar chart: the columns are a sequence, so
   what matters is each one's share of the top, and the bar is there to make the
   fall-off readable at a glance rather than to be measured. */
function Funnel({ rows }) {
  const top = rows[0]?.count || 0;
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <ol className="mt-4 space-y-2.5">
      {rows.map((r) => (
        <li key={r.name} className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-[0.87rem] font-medium">{r.name}</span>
              <span className="shrink-0 text-[0.76rem] text-muted">
                {top ? Math.round((r.count / top) * 100) : 0}%
                {r.value > 0 && <span className="ml-2">{money(r.value)}</span>}
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(r.count / max) * 100}%`, background: ACCENT }}
              />
            </div>
          </div>
          <span className="w-10 shrink-0 text-right text-[1rem] font-bold">{count(r.count)}</span>
        </li>
      ))}
    </ol>
  );
}

function Tile({ label, value }) {
  return (
    <div className="rounded-xl border border-line bg-bg p-3.5">
      <p className="text-[0.75rem] text-muted">{label}</p>
      <p className="mt-1 text-[1.35rem] font-bold leading-none">{count(value)}</p>
    </div>
  );
}

/* Brand shades rather than a default chart palette, and one neutral: expired is
   the "nothing happened" slice and shouldn't compete with the gold. Unknown
   statuses fall back so a new MDI status never renders as an invisible slice. */
const STATUS_COLOR = {
  completed: "#A97D24",
  in_progress: "#D2A94E",
  pending: "#E0C88B",
  expired: "#A8A29A",
};
const FALLBACK_COLORS = ["#8C6A2F", "#C2B49A", "#6F6658", "#DDD3BF"];
const prettyStatus = (s) => String(s).replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

function StatusDonut({ rows }) {
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  const colorFor = (name, i) => STATUS_COLOR[name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length];

  return (
    <div className="mt-3 flex flex-wrap items-center gap-5">
      <div className="relative h-[184px] w-[184px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows}
              dataKey="count"
              nameKey="name"
              innerRadius={54}
              outerRadius={88}
              paddingAngle={2}
              stroke="none"
            >
              {rows.map((r, i) => (
                <Cell key={r.name} fill={colorFor(r.name, i)} />
              ))}
            </Pie>
            <Tooltip formatter={(v, n) => [count(v), prettyStatus(n)]} />
          </PieChart>
        </ResponsiveContainer>

        {/* The total belongs in the hole: it's the number every slice is a share
            of, and repeating it as a fifth legend row would read as a category. */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-[1.4rem] font-bold leading-none">{count(total)}</p>
            <p className="mt-1 text-[0.72rem] text-muted">intakes</p>
          </div>
        </div>
      </div>

      <ul className="min-w-[160px] flex-1 space-y-2.5">
        {rows.map((r, i) => (
          <li key={r.name} className="flex items-center gap-2.5 text-[0.85rem]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: colorFor(r.name, i) }}
            />
            <span className="min-w-0 flex-1 truncate">{prettyStatus(r.name)}</span>
            <span className="font-semibold">{count(r.count)}</span>
            <span className="w-10 text-right text-muted">
              {total ? Math.round((r.count / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Login({ onDone }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await insightsAuth({ action: "login", password });
      onDone();
    } catch (e2) {
      setErr(
        e2.status === 401
          ? "That password isn't right."
          : e2.message === "not_configured"
            ? "The dashboard password hasn't been set on the server yet."
            : e2.message
      );
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-5 text-ink">
      <form onSubmit={submit} className={`${card} w-full max-w-[380px]`}>
        <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
          <Lock size={18} />
        </span>
        <h1 className="mt-4 text-[1.3rem] font-bold leading-tight">NovaMDK insights</h1>
        <p className="mt-1.5 text-[0.87rem] text-muted">
          Staff access only. Enter the dashboard password to continue.
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          autoComplete="current-password"
          placeholder="Password"
          className="mt-5 w-full rounded-xl border border-line bg-bg px-4 py-3 text-[0.95rem] outline-none focus:border-primary"
        />

        {err && <p className="mt-3 text-[0.83rem] font-medium text-red-600">{err}</p>}

        <button
          type="submit"
          disabled={busy || !password}
          className="mt-4 w-full rounded-xl bg-primary py-3 text-[0.95rem] font-bold text-on-primary disabled:opacity-60"
        >
          {busy ? "Checking…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function InsightsPage() {
  const [state, setState] = useState("checking"); // checking | out | in
  const [days, setDays] = useState(28);
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  /* Kept apart from `err`: "the key isn't set up" is a state of the plan, not a
     fault, and a red banner over a working report trains people to ignore red. */
  const [notice, setNotice] = useState("");
  const [ops, setOps] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    insightsAuth({ action: "session" })
      .then(({ authenticated }) => setState(authenticated ? "in" : "out"))
      .catch(() => setState("out"));
  }, []);

  const load = useCallback((window) => {
    setLoading(true);
    setErr("");
    setNotice("");
    insightsData(window)
      .then(setData)
      .catch((e) => {
        if (e.status === 401) {
          setState("out");
          return;
        }
        if (e.message === "not_configured") {
          setNotice(
            "Summary panels are switched off until the Google key is added. The report below has the full traffic data."
          );
          return;
        }
        setErr(
          e.message === "upstream_failed"
            ? "Google Analytics didn't answer. Try again in a moment."
            : e.message
        );
      })
      .finally(() => setLoading(false));
  }, []);

  /* Separate from the GA4 load: no date window applies, and a slow CRM call
     shouldn't delay the traffic panels (or the reverse). Failure is silent by
     design — the section just doesn't render. */
  const loadOps = useCallback(() => {
    insightsOps()
      .then(setOps)
      .catch(() => setOps(null));
  }, []);

  useEffect(() => {
    if (state === "in") load(days);
  }, [state, days, load]);

  useEffect(() => {
    if (state === "in") loadOps();
  }, [state, loadOps]);

  const refresh = () => {
    load(days);
    loadOps();
  };

  const signOut = async () => {
    await insightsAuth({ action: "logout" }).catch(() => {});
    setData(null);
    setOps(null);
    setState("out");
  };

  if (state === "checking") return <div className="min-h-dvh bg-bg" />;
  if (state === "out") return <Login onDone={() => setState("in")} />;

  const f = data?.funnel;
  /* Of the people who looked at a treatment, how many opened an intake. Both
     numbers come from the same window, so the ratio is honest even though GA4
     can't follow one person from view to visit. */
  const handoff = f?.product_viewed ? Math.round((f.start_visit / f.product_viewed) * 1000) / 10 : null;
  const updated = clockOf(ops?.updated_at || data?.updated_at);

  return (
    <main className="min-h-dvh bg-bg pb-10 text-ink">
      <Seo title="Insights" noindex />

      {/* Sticky: this page is long, and the refresh and sign out controls
          shouldn't require scrolling back to the top. */}
      <header className="sticky top-0 z-10 border-b border-line bg-bg/90 px-4 py-4 backdrop-blur md:px-6">
        <div className={`${shell} flex flex-wrap items-center justify-between gap-4`}>
          <div>
            <p className={sectionLabel}>NovaMDK</p>
            <h1 className="mt-1 text-[1.5rem] font-bold leading-tight">Patient journey insights</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Only shown when the GA4 panels are live: these buttons drive that
                request alone. The CRM panels have no date window, and the report
                below carries its own date control, so offering them while the
                panels are off would be three buttons that visibly do nothing. */}
            {data &&
              WINDOWS.map((w) => (
                <button
                  key={w.days}
                  onClick={() => setDays(w.days)}
                  className={`rounded-full border px-3.5 py-2 text-[0.82rem] font-semibold transition-colors ${
                    w.days === days
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-line bg-surface text-muted hover:text-ink"
                  }`}
                >
                  {w.label}
                </button>
              ))}

            {updated && <span className="mr-1 hidden text-[0.78rem] text-muted sm:inline">Updated {updated}</span>}

            <button onClick={refresh} className={chip} aria-label="Refresh">
              <RefreshCw size={14} className={loading ? "animate-spin" : undefined} />
              Refresh
            </button>
            <button onClick={signOut} className={chip}>
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6">
        {err && (
          <p
            className={`${shell} mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.87rem] font-medium text-red-700`}
          >
            {err}
          </p>
        )}

        {notice && (
          <p className={`${shell} mt-6 rounded-xl border border-line bg-surface px-4 py-3 text-[0.85rem] text-muted`}>
            {notice}
          </p>
        )}

        {ops?.board && (
          <div className={`${shell} mt-6 space-y-5`}>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Open visits" value={count(ops.board.open)} hint={ops.board.pipeline} />
              <Metric label="Won" value={count(ops.board.won)} />
              <Metric label="Won revenue" value={money(ops.board.won_value)} />
              <Metric label="Open value" value={money(ops.board.open_value)} hint="Not yet paid" />
            </section>

            <section className="grid gap-4 lg:grid-cols-5">
              <div className={`${card} lg:col-span-3`}>
                <p className={sectionLabel}>Where visits sit</p>
                <p className="mt-1.5 text-[0.82rem] text-muted">
                  Every card on the {ops.board.pipeline}, by column. Percentages are of the first
                  column.
                </p>
                <Funnel rows={ops.board.stages} />
              </div>

              {ops.intake && (
                <div className={`${card} lg:col-span-2`}>
                  <p className={sectionLabel}>Intake funnel</p>
                  <p className="mt-1.5 text-[0.82rem] text-muted">
                    From MDI, one per questionnaire handed to a patient. Started means they opened
                    it, submitted means they finished and a case exists.
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Tile label="Handed out" value={ops.intake.total} />
                    <Tile label="Started" value={ops.intake.started} />
                    <Tile label="Submitted" value={ops.intake.submitted} />
                    <Tile label="Expired" value={ops.intake.expired} />
                  </div>

                  {ops.intake.by_status.length > 0 && (
                    <>
                      <p className={`${sectionLabel} mt-6`}>By status</p>
                      <StatusDonut rows={ops.intake.by_status} />
                    </>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {LOOKER_EMBED && (
          <section className={`${shell} mt-5`}>
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                <div>
                  <p className={sectionLabel}>Website traffic</p>
                  <p className="mt-1.5 text-[0.82rem] text-muted">
                    Live from Google Analytics. Use the tabs and the date control inside the report.
                  </p>
                </div>
                {LOOKER_FULL && (
                  <a href={LOOKER_FULL} target="_blank" rel="noreferrer" className={chip}>
                    <ExternalLink size={14} />
                    Open full screen
                  </a>
                )}
              </div>

              {/* White backdrop on purpose: the report renders on white, so
                  without it the frame reads as a pale rectangle floating on the
                  page in dark mode. Tall enough that Looker's own page doesn't
                  sit in a letterbox, since an embedded report doesn't scroll
                  inside its frame. */}
              <div className="bg-white">
                {/* Deliberately not loading="lazy": this frame is the point of
                    the panel, and a deferred frame can stay unrequested when a
                    re-render inserts it off-screen, which shows as a blank box. */}
                <iframe
                  src={LOOKER_EMBED}
                  title="NovaMDK analytics report"
                  className="block w-full border-0"
                  style={{ height: 1500 }}
                  allow="fullscreen"
                />
              </div>
            </div>
          </section>
        )}

        {data && (
          <div className={`${shell} mt-5 space-y-5`}>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Visitors" value={count(data.totals.users)} hint={`Last ${data.days} days`} />
              <Metric label="Sessions" value={count(data.totals.sessions)} />
              <Metric label="Treatment views" value={count(f.product_viewed)} />
              <Metric
                label="Intakes started"
                value={count(f.start_visit)}
                hint={handoff === null ? undefined : `${handoff}% of treatment views`}
              />
            </section>

            <section className={card}>
              <p className={sectionLabel}>Visitors per day</p>
              <div className="mt-3 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trend} margin={{ left: 0, right: 12, top: 6 }}>
                    <CartesianGrid vertical={false} stroke="rgba(128,128,128,0.18)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={shortDate}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis tickLine={false} axisLine={false} width={34} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => count(v)} />
                    <Line type="monotone" dataKey="users" stroke={ACCENT} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <Bars
                title="Most viewed treatments"
                rows={data.products}
                empty="No named treatment views yet in this window."
              />
              <Bars
                title="Most viewed categories"
                rows={data.categories}
                empty="No named categories yet in this window."
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <Bars
                title="Kiosk scans by location"
                rows={data.kiosks}
                empty="No kiosk scans in this window."
              />

              <div className={card}>
                <p className={sectionLabel}>Where visitors came from</p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-[0.87rem]">
                    <thead>
                      <tr className="text-left text-muted">
                        <th className="pb-2 font-medium">Source</th>
                        <th className="pb-2 text-right font-medium">Visitors</th>
                        <th className="pb-2 text-right font-medium">Sessions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sources.map((s) => (
                        <tr key={s.name} className="border-t border-line">
                          <td className="py-2 pr-3">{s.name}</td>
                          <td className="py-2 text-right font-medium">{count(s.users)}</td>
                          <td className="py-2 text-right font-medium">{count(s.sessions)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-3">
              <Metric label="Calculator uses" value={count(f.calculator_used)} />
              <Metric label="Category picks" value={count(f.category_selected)} />
              <Metric
                label="Contact submissions"
                value={count(f.contact_submitted)}
                hint="Not tracked yet"
              />
            </section>
          </div>
        )}

        <p className={`${shell} mt-6 text-[0.78rem] text-muted`}>
          Google Analytics processes events a few hours behind, so today is usually incomplete.
          Pipeline and intake figures are live. Payment, provider and pharmacy figures come from MDI
          and the payment processor in the next phase.
        </p>
      </div>
    </main>
  );
}
