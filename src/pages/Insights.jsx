import { useCallback, useEffect, useState } from "react";
import { Lock, LogOut, RefreshCw } from "lucide-react";
import Seo from "../components/Seo";
import MorningSummary from "../components/insights/MorningSummary";
import InsightsDetails from "../components/insights/InsightsDetails";
import { insightsAuth, insightsChannels, insightsData, insightsSummary } from "../lib/insights";

/* Staff analytics, reading GA4 through /api/insights and the CRM through
   /api/insights?resource=channels. Everything on this page is aggregate counts: no patient is
   identifiable here, and nothing clinical is in either source to begin with. */

/* Near full width with a small gutter: these panels are tables and funnels, and
   a 1180px column wasted half of a laptop screen on empty margin. */
const shell = "mx-auto w-full max-w-[1760px]";
const card = "rounded-2xl border border-line bg-surface p-5";
const sectionLabel = "font-mono text-[11px] uppercase tracking-[0.14em] text-muted";
const chip =
  "flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-[0.82rem] font-semibold text-muted transition-colors hover:border-primary hover:text-ink";

const clockOf = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

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
  const [channels, setChannels] = useState(null);
  const [channelsFailed, setChannelsFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  /* The morning summary is what opens first (client, 2026-10-18); everything
     below it on this page lives under Details. */
  const [view, setView] = useState("summary");
  const [summary, setSummary] = useState(null);
  const [summaryFailed, setSummaryFailed] = useState(false);

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
          /* Reworded at the client's request (2026-09-19): the old line read as
             though something on the page was broken. It only ever concerns the
             traffic tiles, and it stops rendering by itself the moment the
             service account env vars are set, so there is nothing to remove
             later. */
          setNotice(
            "The website numbers need a Google service key, which is not added yet. Everything else on this page is live."
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
     shouldn't delay the traffic panels (or the reverse). */
  const loadChannels = useCallback(() => {
    setChannelsFailed(false);
    insightsChannels()
      .then(setChannels)
      .catch(() => {
        setChannels(null);
        setChannelsFailed(true);
      });
  }, []);

  const loadSummary = useCallback(() => {
    setSummaryFailed(false);
    insightsSummary()
      .then(setSummary)
      .catch((e) => {
        if (e.status === 401) setState("out");
        else setSummaryFailed(true);
      });
  }, []);

  useEffect(() => {
    if (state === "in") load(days);
  }, [state, days, load]);

  useEffect(() => {
    if (state === "in") loadSummary();
  }, [state, loadSummary]);

  useEffect(() => {
    if (state === "in") loadChannels();
  }, [state, loadChannels]);

  const refresh = () => {
    load(days);
    loadChannels();
    loadSummary();
  };

  const signOut = async () => {
    await insightsAuth({ action: "logout" }).catch(() => {});
    setData(null);
    setChannels(null);
    setSummary(null);
    setState("out");
  };

  if (state === "checking") return <div className="min-h-dvh bg-bg" />;
  if (state === "out") return <Login onDone={() => setState("in")} />;

  const updated = clockOf(
    view === "summary" ? summary?.updated_at : channels?.updated_at || data?.updated_at
  );

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
            <div className="mt-3 flex gap-1 rounded-full border border-line bg-surface p-1" role="tablist">
              {[
                ["summary", "Morning summary"],
                ["details", "Details"],
              ].map(([key, text]) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={view === key}
                  onClick={() => setView(key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                    view === key ? "bg-primary text-on-primary" : "text-muted hover:text-ink"
                  }`}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

      {view === "summary" && (
        <div className="px-4 md:px-6">
          {summary ? (
            <MorningSummary data={summary} />
          ) : (
            <p className="mx-auto w-full max-w-6xl py-10 text-sm text-muted">
              {summaryFailed
                ? "The summary didn't load. Press Refresh to try again."
                : "Loading this morning's numbers…"}
            </p>
          )}
        </div>
      )}

      <div className={`px-4 md:px-6 ${view === "details" ? "" : "hidden"}`}>
        <InsightsDetails
          channels={channels}
          channelsFailed={channelsFailed}
          traffic={data}
          trafficNote={notice || err}
          days={days}
          onDays={setDays}
        />
      </div>
    </main>
  );
}
