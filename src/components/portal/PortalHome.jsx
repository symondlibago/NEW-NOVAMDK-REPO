import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, ChevronRight } from "lucide-react";
import { portalData } from "../../lib/portal";
import { treatmentFor } from "../../lib/portalCatalog";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
};

const Bar = ({ className = "" }) => <span className={`block animate-pulse rounded bg-line ${className}`} />;

const Label = ({ children }) => (
  <h2 className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted">{children}</h2>
);

/* Five discrete steps (Received, In Review, Rx Approved, In Fulfillment,
   Shipped), so a segmented rail rather than a percentage, which would invent
   precision the data doesn't have. */
function ProgressRail({ step }) {
  const total = step?.total || 5;
  const reached = typeof step?.index === "number" ? step.index : -1;
  return (
    <span className="mt-4 flex gap-1.5" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-1 flex-1 rounded-full ${i <= reached ? "bg-primary" : "bg-line-strong"}`} />
      ))}
    </span>
  );
}

export default function PortalHome({ onUnauthorized, onNavigate }) {
  const [visits, setVisits] = useState(null);
  const [name, setName] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      portalData({ resource: "cases" }),
      // The greeting is decoration, so a failed profile shouldn't blank the page.
      portalData({ resource: "profile" }).catch(() => null),
    ])
      .then(([{ visits: all, cases }, profile]) => {
        if (!alive) return;
        setVisits(all || cases || []);
        setName(profile?.profile?.first_name || null);
      })
      .catch((err) => {
        if (!alive) return;
        if (err.status === 401) return onUnauthorized();
        setError(err.message);
      });
    return () => { alive = false; };
  }, [onUnauthorized]);

  const shell = "nv-scroll min-h-0 flex-1 overflow-y-auto px-6 py-10 md:px-10";
  const page = "mx-auto w-full max-w-5xl";

  if (error) {
    return (
      <div className={shell} data-lenis-prevent>
        <p role="alert" className={`${page} flex items-center gap-2 text-[0.9rem] text-ink`}>
          <AlertCircle size={15} className="text-primary" /> {error}
        </p>
      </div>
    );
  }

  if (visits === null) {
    return (
      <div className={shell} data-lenis-prevent aria-busy="true">
        <div className={page}>
          <Bar className="h-2.5 w-32" />
          <Bar className="mt-3 h-7 w-64 max-w-full" />
          <Bar className="mt-10 h-2.5 w-20" />
          <div className="mt-4 h-24 animate-pulse rounded-2xl bg-line/50" />
          <Bar className="mt-8 h-2.5 w-16" />
          <div className="mt-4 h-64 animate-pulse rounded-2xl bg-line/50" />
          <span className="sr-only">Loading your portal</span>
        </div>
      </div>
    );
  }

  const unfinished = visits.filter((v) => v.kind === "draft" && v.resume_url);
  const active = visits.filter((v) => v.kind === "case" && v.bucket === "active");
  const pending = visits.filter((v) => v.kind === "case" && v.bucket === "pending");
  const quiet = !unfinished.length && !active.length && !pending.length;

  return (
    <div className={shell} data-lenis-prevent>
      <div className={page}>
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted">
          {format(new Date(), "EEEE, MMMM d")}
        </p>
        {/* primary-deep rather than a literal: it is the theme's own darker
            gold, so it follows the Design Studio instead of drifting from it. */}
        <h1 className="mt-2 text-[1.8rem] leading-tight tracking-tight text-primary-deep">
          {greeting()}{name ? `, ${name}` : ""}.
        </h1>

        {/* Unfinished intakes lead. Plain card, no photo: it's a task to clear,
            not something to browse, and a picture would only slow that down. */}
        {unfinished.length > 0 && (
          <section className="mt-10">
            <Label>Incomplete</Label>
            <ul className="mt-4 space-y-3">
              {unfinished.map((d) => {
                const t = treatmentFor(d.questionnaire_id);
                return (
                  <li
                    key={d.id}
                    className="rounded-2xl border border-primary/35 bg-primary/[0.03] p-6 sm:flex sm:items-center sm:gap-8"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[1.05rem] font-semibold leading-snug text-ink">
                        {t.name ? `Finish your ${t.name} intake` : "Finish your consultation"}
                      </p>
                      <p className="mt-1 text-[0.88rem] leading-relaxed text-muted">
                        Started {format(new Date(d.created_at), "MMM d")}. A clinician can&rsquo;t
                        review it until it&rsquo;s submitted.
                      </p>
                    </div>
                    <a
                      href={d.resume_url}
                      className="mt-5 inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-[0.9rem] font-semibold text-on-primary transition-colors hover:bg-primary-deep sm:mt-0 sm:w-auto"
                    >
                      Finish intake <ArrowRight size={15} />
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* The one place a photo earns its space. Laid out side by side from md
            up so the card fills the width instead of stacking into a tall
            column with empty gutters either side. */}
        {active.length > 0 && (
          <section className="mt-10">
            <div className="flex items-baseline justify-between gap-4">
              <Label>Active</Label>
              <button
                onClick={() => onNavigate("visits")}
                className="text-[0.84rem] font-semibold text-primary underline-offset-4 transition-opacity hover:opacity-70 hover:underline"
              >
                See all
              </button>
            </div>
            <ul className="mt-4 space-y-4">
              {active.map((c) => {
                const t = treatmentFor(c.questionnaire_id, c.treatments[0]?.name);
                return (
                  <li
                    key={c.id}
                    className="overflow-hidden rounded-2xl border border-line bg-surface nv-shadow"
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="grid shrink-0 place-items-center bg-surface-2 px-6 py-10 md:w-[34%] md:py-6">
                        <img src={t.image} alt="" loading="lazy" className="h-44 w-auto object-contain" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-center p-6 md:p-8">
                        {t.category && (
                          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted">
                            {t.category}
                          </p>
                        )}
                        <p className="mt-1.5 text-[1.35rem] font-semibold leading-snug tracking-tight text-ink">
                          {t.name || `Visit #${c.number}`}
                        </p>
                        <p className="mt-3 text-[0.82rem] font-semibold uppercase tracking-[0.1em] text-primary">
                          {c.step?.label || "In progress"}
                        </p>
                        <ProgressRail step={c.step} />
                        <p className="mt-3 text-[0.9rem] leading-relaxed text-muted">
                          {c.step?.index >= 2
                            ? "Your treatment is being prepared for shipment."
                            : "Your care team is working on this visit."}
                        </p>
                        <button
                          onClick={() => onNavigate("visits")}
                          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-line-strong bg-bg px-7 py-3 text-[0.9rem] font-semibold text-ink transition-colors hover:border-primary hover:text-primary md:w-auto md:self-start"
                        >
                          View treatment details <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Plain rows: the next move here belongs to the clinician, so these
            need acknowledging, not a card each. */}
        {pending.length > 0 && (
          <section className="mt-10">
            <Label>With your care team</Label>
            <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              {pending.map((c) => {
                const t = treatmentFor(c.questionnaire_id, c.treatments[0]?.name);
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => onNavigate("visits")}
                      className="group flex w-full items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-surface-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.98rem] font-semibold text-ink">
                          {t.name || `Visit #${c.number}`}
                        </span>
                        <span className="mt-0.5 block truncate text-[0.86rem] text-muted">
                          {c.step?.label || "Submitted"}
                          {c.clinician ? ` with Dr. ${c.clinician}` : ", waiting for a clinician"}
                        </span>
                      </span>
                      <ChevronRight
                        size={17}
                        className="shrink-0 text-muted transition-colors group-hover:text-primary"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {quiet && (
          <div className="mt-10 rounded-2xl border border-line bg-surface p-12 text-center">
            <p className="text-[1.05rem] font-semibold tracking-tight text-ink">Nothing needs you right now</p>
            <p className="mx-auto mt-2 max-w-xs text-[0.89rem] leading-relaxed text-muted">
              When you start a consultation it&rsquo;ll appear here, with its progress.
            </p>
          </div>
        )}

        <Link
          to="/treatments"
          className="group mt-10 flex items-center gap-4 rounded-2xl border border-line bg-surface px-6 py-5 transition-colors hover:border-primary"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[0.98rem] font-semibold text-ink">Browse treatments</span>
            <span className="mt-0.5 block text-[0.86rem] text-muted">
              Weight loss, anti-aging, sexual health and more.
            </span>
          </span>
          <ChevronRight size={17} className="shrink-0 text-muted transition-colors group-hover:text-primary" />
        </Link>
      </div>
    </div>
  );
}
