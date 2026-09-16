import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Lock, LogOut, RefreshCw } from "lucide-react";
import Seo from "../components/Seo";
import { insightsAuth, insightsData } from "../lib/insights";

/* Staff analytics, reading GA4 through /api/insights. Everything on this page is
   aggregate counts: no patient is identifiable here, and nothing clinical is in
   GA4 to begin with. */

const WINDOWS = [
  { days: 7, label: "7 days" },
  { days: 28, label: "28 days" },
  { days: 90, label: "90 days" },
];

const ACCENT = "#A97D24";

/* The Looker Studio report, embedded rather than rebuilt. Looker reads GA4 as
   the signed-in Google user, so it needs none of the service-account setup the
   panels below depend on: this section works the moment embedding is switched on
   in Looker's File menu. Report id from the report's own URL. */
const LOOKER_REPORT_ID =
  import.meta.env.VITE_LOOKER_REPORT_ID || "cbdba9bd-0264-48d9-82ef-ae37bc7f02b0";
const LOOKER_EMBED = LOOKER_REPORT_ID
  ? `https://lookerstudio.google.com/embed/reporting/${LOOKER_REPORT_ID}/page/Hp18F`
  : null;
const card = "rounded-2xl border border-line bg-surface p-5";
const sectionLabel = "font-mono text-[11px] uppercase tracking-[0.14em] text-muted";

const nf = new Intl.NumberFormat("en-US");
const count = (n) => nf.format(Number(n || 0));

/* GA4 dates arrive as 2026-09-16; the axis only has room for the day. */
const shortDate = (iso) => (iso || "").slice(5).replace("-", "/");

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    insightsAuth({ action: "session" })
      .then(({ authenticated }) => setState(authenticated ? "in" : "out"))
      .catch(() => setState("out"));
  }, []);

  const load = useCallback(
    (window) => {
      setLoading(true);
      setErr("");
      insightsData(window)
        .then(setData)
        .catch((e) => {
          if (e.status === 401) {
            setState("out");
            return;
          }
          setErr(
            e.message === "not_configured"
              ? "The summary panels aren't connected yet: they need the Google service account key. The report below works without it."
              : e.message === "upstream_failed"
                ? "Google Analytics didn't answer. Try again in a moment."
                : e.message
          );
        })
        .finally(() => setLoading(false));
    },
    []
  );

  useEffect(() => {
    if (state === "in") load(days);
  }, [state, days, load]);

  const signOut = async () => {
    await insightsAuth({ action: "logout" }).catch(() => {});
    setData(null);
    setState("out");
  };

  if (state === "checking") return <div className="min-h-dvh bg-bg" />;
  if (state === "out") return <Login onDone={() => setState("in")} />;

  const f = data?.funnel;
  /* Of the people who looked at a treatment, how many opened an intake. Both
     numbers come from the same window, so the ratio is honest even though GA4
     can't follow one person from view to visit. */
  const handoff = f?.product_viewed ? Math.round((f.start_visit / f.product_viewed) * 1000) / 10 : null;

  return (
    <main className="min-h-dvh bg-bg px-5 py-8 text-ink md:px-10">
      <Seo title="Insights" noindex />

      <header className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4">
        <div>
          <p className={sectionLabel}>NovaMDK</p>
          <h1 className="mt-1 text-[1.5rem] font-bold leading-tight">Patient journey insights</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {WINDOWS.map((w) => (
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
          <button
            onClick={() => load(days)}
            aria-label="Refresh"
            className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted transition-colors hover:text-ink"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : undefined} />
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-[0.82rem] font-semibold text-muted transition-colors hover:text-ink"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </header>

      {err && (
        <p className="mx-auto mt-6 max-w-[1180px] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.87rem] font-medium text-red-700">
          {err}
        </p>
      )}

      {LOOKER_EMBED && (
        <section className="mx-auto mt-6 max-w-[1180px]">
          <div className={card}>
            <p className={sectionLabel}>Website traffic</p>
            <p className="mt-1.5 text-[0.82rem] text-muted">
              Live from Google Analytics. Use the date control inside the report to change the
              period.
            </p>
            {/* Tall enough that the report's own page doesn't scroll inside a letterbox.
                Looker handles its own layout, so no scrolling wrapper here. */}
            <div className="mt-3 overflow-hidden rounded-xl border border-line">
              <iframe
                src={LOOKER_EMBED}
                title="NovaMDK analytics report"
                className="block h-[1100px] w-full border-0"
                loading="lazy"
                allow="fullscreen"
              />
            </div>
          </div>
        </section>
      )}

      {data && (
        <div className="mx-auto mt-6 max-w-[1180px] space-y-5">
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

          <p className="pb-4 text-[0.78rem] text-muted">
            GA4 processes events a few hours behind, so today is usually incomplete. Payment,
            provider and pharmacy figures are not here yet: those come from MDI and the payment
            processor in the next phase.
          </p>
        </div>
      )}
    </main>
  );
}
