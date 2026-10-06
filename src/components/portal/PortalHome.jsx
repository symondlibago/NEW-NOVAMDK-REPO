import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, CalendarCheck, ChevronRight, MessageSquare, Stethoscope } from "lucide-react";
import { portalData } from "../../lib/portal";
import { treatmentFor } from "../../lib/portalCatalog";
import { planStatus, currentVisitForPlan } from "../../lib/planStatus";
import ResumeIntakeButton from "./ResumeIntakeButton";
import NextFillButton from "./NextFillButton";

/* The same pill tones the Treatments tab uses, so one status cannot look
   reassuring on one screen and alarming on the next. */
const STATUS_TONE = {
  good: "border-primary/35 bg-primary/10 text-primary-deep",
  action: "border-primary/45 bg-primary text-on-primary",
  wait: "border-line-strong/50 bg-surface-2 text-ink",
  quiet: "border-line bg-surface-2 text-muted",
  bad: "border-red-200 bg-red-50 text-red-700",
};

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

export default function PortalHome({ onUnauthorized, onNavigate, onOpenVisit, onMessageAbout }) {
  /* Cards that name one visit open that visit. `See all` still goes to the
     list, because that is what it says. */
  const openVisit = (c) => () => {
    const id = c.case_id || c.id;
    if (onOpenVisit && id) onOpenVisit(id);
    else onNavigate("visits");
  };

  const [visits, setVisits] = useState(null);
  const [name, setName] = useState(null);
  /* Plural: a patient can hold a plan per treatment. The home page stays a
     summary, one line each, because it has to fit a phone screen in one go.
     Managing them is on the Profile tab. */
  const [plans, setPlans] = useState([]);
  /* Unread messages, which John asked to see on Home. The header bell already
     counts them, and this reads the same resource, so the two cannot disagree. */
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState(null);

  /* Four requests, four independent renders.
   *
   * These used to share one Promise.all, which meant the page showed a skeleton
   * until the SLOWEST of them came back, and they are not remotely equal: the
   * plan walks a GoHighLevel search, then one read per opportunity card, then
   * Stripe for the saved card, while the greeting is a single MDI call. The
   * client reported the portal as slow on 2026-10-07 and this was most of it.
   *
   * Now each one paints the moment it lands. The visits still gate the skeleton,
   * because they are the page, but the greeting, the plans and the unread count
   * arrive whenever they arrive and nothing waits on anything else. */
  useEffect(() => {
    let alive = true;
    const keep = (fn) => (value) => {
      if (alive) fn(value);
    };

    portalData({ resource: "cases" })
      .then(keep(({ visits: all, cases }) => setVisits(all || cases || [])))
      .catch((err) => {
        if (!alive) return;
        if (err.status === 401) return onUnauthorized();
        setError(err.message);
      });

    // The greeting is decoration, so a failed profile must not blank the page.
    portalData({ resource: "profile" })
      .then(keep((p) => setName(p?.profile?.first_name || null)))
      .catch(() => {});

    // Empty for everyone not on a plan, which is most people.
    portalData({ resource: "plan" })
      .then(keep((r) => setPlans(Array.isArray(r?.plans) ? r.plans : [])))
      .catch(() => {});

    portalData({ resource: "notifications" })
      .then(
        keep((r) =>
          setUnread(
            (Array.isArray(r?.items) ? r.items : []).filter((n) => n.kind === "message").length
          )
        )
      )
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [onUnauthorized]);

  /* Tighter vertical padding on phones. John's own account is one unfinished
     intake and one active visit, and that has to land inside a single screen
     with nothing to scroll: desktop keeps the roomier spacing, so every trim
     below is mobile only. */
  const shell = "nv-scroll min-h-0 flex-1 overflow-y-auto px-6 py-6 md:px-10 md:py-10";
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
          {greeting()}{name ? `, ${name}` : ""}
        </h1>

        {/* One line, under the greeting, rather than a section of its own.
            This page has to land inside a single phone screen with an
            unfinished intake and an active visit already on it, so a plan gets
            a sentence and not a card. */}
        {/* Unread messages, named here because John asked for it on Home and
            because the bell in the header is easy to miss on a phone. */}
        {unread > 0 && (
          <button
            type="button"
            onClick={() => onNavigate("messages")}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3.5 py-1.5 text-[0.82rem] font-semibold text-primary-deep transition-colors hover:border-primary"
          >
            <MessageSquare size={14} />
            {unread === 1 ? "1 unread message" : `${unread} unread messages`}
          </button>
        )}

        {/* One card per plan: the treatment, where it stands, when it renews,
            where the parcel is, and one way through to manage it. John's Home
            list of 2026-10-06, in the order he wrote it, kept to a strip rather
            than a section because this page has to land inside a single phone
            screen with an unfinished intake and an active visit already on it.
            Managing a plan is the Treatments tab's job, not this one's. */}
        {plans.length > 0 && (
          <section className="mt-6 space-y-3">
            {plans.map((p) => {
              const status = planStatus(p, currentVisitForPlan(p, visits));
              return (
                <div
                  key={p.opportunityId}
                  className="rounded-2xl border border-line bg-surface-1 p-4 sm:flex sm:items-center sm:gap-5 sm:p-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <p className="truncate text-[0.98rem] font-semibold text-ink">
                        {p.treatment || "Your plan"}
                      </p>
                      {status && (
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[0.72rem] font-semibold ${
                            STATUS_TONE[status.tone] || STATUS_TONE.quiet
                          }`}
                        >
                          {status.label}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.84rem] text-muted">
                      <CalendarCheck size={14} className="flex-none text-primary" />
                      <span>
                        {p.months} month plan
                        {p.months > 1 ? `, month ${p.current} of ${p.months}` : ""}
                      </span>
                      {p.autoRenew && p.renewsOn && (
                        <>
                          <span aria-hidden="true" className="text-line-strong">
                            ·
                          </span>
                          <span>
                            renews {format(new Date(`${p.renewsOn}T12:00:00`), "MMM d")}
                          </span>
                        </>
                      )}
                      {p.nextDue && (
                        <>
                          <span aria-hidden="true" className="text-line-strong">
                            ·
                          </span>
                          <span>
                            next check-in {format(new Date(`${p.nextDue}T12:00:00`), "MMM d")}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  {/* The main CTA John asked for. Everything it leads to lives
                      on one tab, so this is one button and not a menu. */}
                  <button
                    type="button"
                    onClick={() => onNavigate("treatments")}
                    className="mt-4 inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full border border-primary/40 px-5 py-2.5 text-[0.86rem] font-semibold text-primary transition-colors hover:bg-primary hover:text-on-primary sm:mt-0 sm:w-auto"
                  >
                    Manage treatment <ChevronRight size={15} />
                  </button>
                </div>
              );
            })}
          </section>
        )}

        {/* A term that has run out and is due to renew.
            Above the prepaid months, because this is the one that stops their
            treatment if they ignore it: a prepaid month is still theirs
            tomorrow, a lapsed plan means no next prescription at all.
            The amount is on the card and the hold needs a second tap, since
            unlike a prepaid month this one costs money. */}
        {plans.some((p) => p.canRenew) && (
          <section className="mt-6 md:mt-10">
            <Label>Time to renew</Label>
            <ul className="mt-3 space-y-3 md:mt-4">
              {plans
                .filter((p) => p.canRenew)
                .map((p) => (
                  <li
                    key={p.opportunityId}
                    className="rounded-2xl border border-primary/35 bg-primary/[0.03] p-5 sm:flex sm:items-center sm:gap-8 sm:p-6"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[1.05rem] font-semibold leading-snug text-ink">
                        Start your next {p.months === 1 ? "month" : `${p.months} months`}
                      </p>
                      <p className="mt-1 text-[0.88rem] leading-relaxed text-muted">
                        {p.treatment ? `${p.treatment}. ` : ""}
                        {p.amount != null ? `$${p.amount.toFixed(2)} ` : ""}
                        for {p.months === 1 ? "one month" : `${p.months} months`}. Answer a few
                        questions and a provider reviews them. Your card is held, not charged,
                        until they approve.
                      </p>
                    </div>
                    <NextFillButton
                      opportunityId={p.opportunityId}
                      onUnauthorized={onUnauthorized}
                      confirm={
                        p.amount != null
                          ? `$${p.amount.toFixed(2)} will be held on your ${
                              p.card ? `${p.card.brand} ending ${p.card.last4}` : "saved card"
                            }. Nothing is taken until a provider approves.`
                          : "Your card is held, not charged, until a provider approves."
                      }
                      className="mt-5 inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-[0.9rem] font-semibold text-on-primary transition-colors hover:bg-primary-deep disabled:opacity-70 sm:mt-0 sm:w-auto"
                    >
                      Continue <ArrowRight size={15} />
                    </NextFillButton>
                  </li>
                ))}
            </ul>
          </section>
        )}

        {/* The renewal date has arrived but the last month of the term is still
            with the pharmacy. They were emailed on that date, so saying nothing
            here would read as a broken link. */}
        {plans
          .filter((p) => p.renewDue && !p.canRenew)
          .map((p) => (
            <p
              key={`due-${p.opportunityId}`}
              className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.85rem] text-muted"
            >
              <CalendarCheck size={14} className="flex-none text-primary" />
              <span>
                {p.treatment ? `${p.treatment}: ` : ""}your next plan can start once this
                month&apos;s shipment arrives
              </span>
            </p>
          ))}

        {/* The month they have already paid for, waiting to be started. Shown
            above everything else, like an unfinished intake, because it is the
            one thing on this page with a deadline: the supply runs out 28 days
            after the last one shipped. Only offered when nothing of theirs is
            already in flight, which the server decides. */}
        {plans.some((p) => p.canStart) && (
          <section className="mt-6 md:mt-10">
            <Label>Paid for</Label>
            <ul className="mt-3 space-y-3 md:mt-4">
              {plans
                .filter((p) => p.canStart)
                .map((p) => (
                  <li
                    key={p.opportunityId}
                    className="rounded-2xl border border-primary/35 bg-primary/[0.03] p-5 sm:flex sm:items-center sm:gap-8 sm:p-6"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[1.05rem] font-semibold leading-snug text-ink">
                        Start your month {p.current} check-in
                      </p>
                      <p className="mt-1 text-[0.88rem] leading-relaxed text-muted">
                        {p.treatment ? `${p.treatment}. ` : ""}Already paid for as part of your{" "}
                        {p.months} month plan. A provider reviews your answers before the pharmacy
                        sends your next month, so there is nothing to pay now.
                      </p>
                    </div>
                    {/* The plan is named, so a patient on two treatments starts
                        the check-in they meant rather than whichever the server
                        happened to pick. */}
                    <NextFillButton
                      opportunityId={p.opportunityId}
                      onUnauthorized={onUnauthorized}
                      className="mt-5 inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-[0.9rem] font-semibold text-on-primary transition-colors hover:bg-primary-deep disabled:opacity-70 sm:mt-0 sm:w-auto"
                    >
                      Start check-in <ArrowRight size={15} />
                    </NextFillButton>
                  </li>
                ))}
            </ul>
          </section>
        )}

        {/* Unfinished intakes lead. Plain card, no photo: it's a task to clear,
            not something to browse, and a picture would only slow that down. */}
        {unfinished.length > 0 && (
          <section className="mt-6 md:mt-10">
            <Label>Incomplete</Label>
            <ul className="mt-3 space-y-3 md:mt-4">
              {unfinished.map((d) => {
                const t = treatmentFor(d.questionnaire_id);
                return (
                  <li
                    key={d.id}
                    className="rounded-2xl border border-primary/35 bg-primary/[0.03] p-5 sm:flex sm:p-6 sm:items-center sm:gap-8"
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
                    <ResumeIntakeButton
                      draftId={d.id}
                      onUnauthorized={onUnauthorized}
                      className="mt-5 inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-[0.9rem] font-semibold text-on-primary transition-colors hover:bg-primary-deep disabled:opacity-70 sm:mt-0 sm:w-auto"
                    >
                      Finish intake <ArrowRight size={15} />
                    </ResumeIntakeButton>
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
          <section className="mt-6 md:mt-10">
            <div className="flex items-baseline justify-between gap-4">
              <Label>Active</Label>
              <button
                onClick={() => onNavigate("visits")}
                className="text-[0.84rem] font-semibold text-primary underline-offset-4 transition-opacity hover:opacity-70 hover:underline"
              >
                See all
              </button>
            </div>
            <ul className="mt-3 space-y-4 md:mt-4">
              {active.map((c) => {
                const t = treatmentFor(c.questionnaire_id, c.treatments[0]?.name);
                return (
                  <li
                    key={c.id}
                    className="overflow-hidden rounded-2xl border border-line bg-surface nv-shadow"
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="grid shrink-0 place-items-center bg-surface-2 px-6 py-4 md:w-[34%] md:py-6">
                        <img src={t.image} alt="" loading="lazy" className="h-28 w-auto object-contain md:h-44" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-center p-5 md:p-8">
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
                        {/* The provider by name, and the date they were seen.
                            Client's request, 2026-10-07: the physician was only
                            on the Visits tab, and this is the card a patient
                            actually looks at. */}
                        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.85rem] text-muted">
                          <Stethoscope size={14} className="flex-none text-primary" />
                          <span>{c.clinician ? `Dr. ${c.clinician}` : "Awaiting a provider"}</span>
                          <span aria-hidden="true" className="text-line-strong">
                            ·
                          </span>
                          <span>{format(new Date(c.created_at), "MMMM d, yyyy")}</span>
                        </p>
                        {/* Both of the Visits tab's actions, so nothing needs a
                            trip to another tab to reach. */}
                        <div className="mt-5 flex flex-col gap-2.5 md:mt-6 md:flex-row md:items-center md:self-start">
                          <button
                            onClick={openVisit(c)}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-line-strong bg-bg px-7 py-3 text-[0.9rem] font-semibold text-ink transition-colors hover:border-primary hover:text-primary md:w-auto"
                          >
                            View treatment details <ArrowRight size={15} />
                          </button>
                          {/* A filled button, and deliberately the SAME one the
                              visit detail uses, down to the classes: it is the
                              same action in two places, and two different
                              looking buttons read as two different things. */}
                          {onMessageAbout && (
                            <button
                              onClick={() => onMessageAbout(c)}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-[0.9rem] font-semibold text-white transition-opacity hover:opacity-90 md:w-auto"
                            >
                              <MessageSquare size={15} /> Message about this visit
                            </button>
                          )}
                        </div>
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
          <section className="mt-6 md:mt-10">
            <Label>With your care team</Label>
            <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              {pending.map((c) => {
                const t = treatmentFor(c.questionnaire_id, c.treatments[0]?.name);
                return (
                  <li key={c.id}>
                    <button
                      onClick={openVisit(c)}
                      className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-2 sm:px-6"
                    >
                      {/* The treatment's photo, so a row of three reads at a
                          glance. Two Semaglutide rows in a row were otherwise
                          only distinguishable by reading them. Client's
                          request, 2026-10-07. */}
                      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-2">
                        <img
                          src={t.image}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-contain p-1"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.98rem] font-semibold text-ink">
                          {t.name || format(new Date(c.created_at), "MMMM d, yyyy")}
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
