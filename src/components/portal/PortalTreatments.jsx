import React, { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Clock,
  FlaskConical,
  CreditCard,
  PauseCircle,
  Pill,
  RefreshCw,
  XCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Package,
  Truck,
} from "lucide-react";
import { portalData } from "../../lib/portal";
import { STATUS, planStatus, currentVisitForPlan } from "../../lib/planStatus";
import NextFillButton from "./NextFillButton";

/* The Treatments tab. Everything about a patient's plan and its orders.
 *
 * John's direction, 2026-10-06: this is where all subscription and order
 * management lives, and it must NOT be hidden inside Profile, which is where
 * the plan card used to be. Profile is account settings only now.
 *
 * One card per plan, because a patient can hold a plan per treatment and every
 * one of them renews, ships and can be switched off on its own.
 *
 * What it does NOT show, deliberately:
 *   - a next shipment DATE. Every offering MDI exposes is a 28 day supply with
 *     no refills, so each month is a new intake, a new prescription and a new
 *     pharmacy order, and the pharmacy ships when a provider approves rather
 *     than on a date we could set or predict. The row says what is true and
 *     then shows the real carrier and tracking the moment a parcel exists.
 *   - Change next shipment date, Skip next shipment, Pause. All three were in
 *     the spec and all three are waiting on a decision; see the audit.
 */

const usd = (n) =>
  typeof n === "number"
    ? n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
      })
    : null;

const day = (iso) => {
  if (!iso) return null;
  /* Midday, so a plain date is not pulled back a day by the viewer's zone.
     Short month, because this sits in a narrow column now and "December 21,
     2026" was wrapping where "Dec 21, 2026" does not. */
  const at = new Date(`${iso}T12:00:00`);
  return Number.isNaN(at.getTime()) ? null : format(at, "MMM d, yyyy");
};

/* Two shapes, because the grammar differs. "3 month plan" is a thing you own;
   "every 3 months" is how often it bills. */
const planLabel = (months) => `${months} month plan`;
const everyLabel = (months) => (months === 1 ? "every month" : `every ${months} months`);

/* Tone to classes. Kept to the theme's own tokens wherever one exists, so the
   Design Studio still drives the look; only the two states that have to read as
   a warning reach for a literal colour. */
const TONE = {
  good: "border-primary/35 bg-primary/10 text-primary-deep",
  action: "border-primary/45 bg-primary text-on-primary",
  wait: "border-line-strong/50 bg-surface-2 text-ink",
  quiet: "border-line bg-surface-2 text-muted",
  bad: "border-red-200 bg-red-50 text-red-700",
};

/* A face for each state, so the pill is readable before it is read.
 *
 * All static. Processing had a spinner, and the client asked for it gone: a
 * thing that spins forever on a screen reads as the page still loading rather
 * than as the pharmacy working, and this status can sit there for days. A flask
 * says compounding, which is what Processing actually means here. */
const STATUS_ICON = {
  review_required: AlertCircle,
  awaiting_approval: Clock,
  processing: FlaskConical,
  active: CheckCircle2,
  auto_renew_off: PauseCircle,
  cancelled: XCircle,
  paused: PauseCircle,
  payment_issue: AlertCircle,
};

function StatusPill({ status }) {
  if (!status) return null;
  const Icon = STATUS_ICON[status.key] || CheckCircle2;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[0.74rem] font-semibold ${
        TONE[status.tone] || TONE.quiet
      }`}
    >
      <Icon size={13} />
      {status.label}
    </span>
  );
}

/* One fact, label above value.
 *
 * Paired into two columns rather than run as full width label-left rows, which
 * is what this card did first: seven rows plus their explanatory sub-lines ran
 * to most of a laptop screen for one plan, and a patient on two treatments
 * could see neither of them whole. The client asked for less height without it
 * becoming cramped, so the facts share rows and the air moves into the gaps. */
function Fact({ label, icon, children }) {
  const Icon = icon;
  return (
    /* The icon sits beside the pair rather than above it, so the label and the
       value stay on one optical line and the cell keeps its height whether the
       value wraps or not. */
    <div className="flex min-w-0 items-start gap-2.5 px-0 sm:px-5 sm:first:pl-0">
      {Icon ? <Icon size={15} className="mt-0.5 flex-none text-primary" /> : null}
      <div className="min-w-0">
        <dt className="text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-muted">
          {label}
        </dt>
        <dd className="mt-1 text-[0.92rem] font-medium leading-snug text-ink">{children}</dd>
      </div>
    </div>
  );
}

/* The order row, which is the honest answer to "next shipment".
 *
 * A parcel that has left carries a real carrier, number and link, all of which
 * MDI gives us on the order. Before that there is no date to show, so the row
 * says which step it is on instead of inventing one. */
/* The shipment, its own full width strip under the grid.
 *
 * Not a grid cell: a tracking link and a pharmacy rejection are both sentences,
 * and a sentence in a half width column wraps to three lines and pushes the
 * card back to the height this layout exists to save. */
function Shipment({ visit, order }) {
  const tracking = order?.tracking || null;
  const Icon = tracking?.number ? Truck : Package;
  return (
    <div className="flex items-start gap-2.5 border-y border-line bg-primary/[0.04] px-5 py-4 sm:px-6">
      <Icon size={16} className="mt-0.5 flex-none text-primary" />
      <div className="min-w-0">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">
          {tracking?.number ? "Shipment" : "Next shipment"}
        </p>
        <p className="mt-1 text-[0.88rem] leading-relaxed">
          {order?.issue ? (
            <span className="text-red-700">{order.issue}</span>
          ) : tracking?.number ? (
            tracking.link ? (
              <a
                href={tracking.link}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                {tracking.company || "Track"} {tracking.number}
              </a>
            ) : (
              <span className="font-medium text-ink">
                {tracking.company ? `${tracking.company} ` : ""}
                {tracking.number}
              </span>
            )
          ) : (
            <span className="text-muted">{waitingLine(visit, order)}</span>
          )}
        </p>
      </div>
    </div>
  );
}

/* What to say when there is no parcel yet.
 *
 * It has to follow the step, or it contradicts itself: "Rx Approved. Ships once
 * your provider approves" was on screen on 2026-10-06, and a provider plainly
 * had approved. So the sentence is chosen from where the visit actually is. */
function waitingLine(visit, order) {
  const at = typeof visit?.step?.index === "number" ? visit.step.index : -1;
  if (order?.started || at >= 3) {
    return "With the pharmacy now. Tracking appears here once it ships";
  }
  if (at >= 2) return "Approved. The pharmacy is preparing it, and tracking appears here";
  if (at >= 0) return `${visit.step.label}. Ships once a provider approves it`;
  return "Ships once a provider approves it";
}

function Treatment({ plan, visit, order, onChanged, onUnauthorized, onMessage, onOpenVisit }) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);

  const { opportunityId, months, autoRenew, renewsOn, amount, treatment, card } = plan;
  const status = planStatus(plan, visit);
  const renewsLabel = day(renewsOn);
  const ended = status === STATUS.CANCELLED;

  const cancel = async () => {
    setBusy(true);
    setError(null);
    try {
      /* The plan is named, so a patient on two treatments cancels the one they
         meant. The server checks the id belongs to them. */
      await portalData({ resource: "cancel_renewal", opportunity_id: opportunityId });
      setConfirming(false);
      onChanged?.();
    } catch (err) {
      if (err.status === 401 && onUnauthorized) return onUnauthorized();
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface nv-shadow">
      <header className="flex items-start gap-4 border-b border-line px-5 py-5 sm:px-6">
        {/* A tinted disc rather than a product photo: a plan is a treatment
            over time, not one vial, and the photo is already on every visit
            row and on Home. */}
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <Pill size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[1.2rem] font-semibold leading-snug tracking-tight text-ink">
            {treatment || "Your plan"}
          </p>
          {status?.hint && (
            <p className="mt-0.5 text-[0.85rem] leading-relaxed text-muted">{status.hint}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusPill status={status} />
          {/* The chevron means what it looks like: the visit behind this plan.
              Hidden from assistive tech on mobile widths it would crowd, but
              the Order cell below says the same thing in words. */}
          {visit && (
            <button
              type="button"
              onClick={() => onOpenVisit?.(visit.case_id || visit.id)}
              aria-label="Open this visit"
              className="hidden h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-primary sm:grid"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </header>

      <div className="px-5 py-5 sm:px-6">
        {/* ONE band of facts, five across on a wide screen.
            Two columns was still a stack: five sub-lines meant five extra rows
            and the card barely shrank, which is exactly what the client said.
            So every value is a single line, the qualifier sits inline beside it
            in muted text, and the band is one row deep on a laptop. */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 sm:gap-x-0 sm:divide-x sm:divide-line lg:grid-cols-4">
          <Fact label="Plan" icon={CalendarDays}>
            {months} {months === 1 ? "month" : "months"}
            {/* Only a multi-month plan has months to count through. Telling
                someone they are on "month 1 of 1" says nothing. */}
            {months > 1 && (
              <span className="font-normal text-muted"> · {plan.current} of {months}</span>
            )}
          </Fact>

          {autoRenew && renewsLabel && (
            <Fact label="Next renewal" icon={CalendarCheck}>{renewsLabel}</Fact>
          )}

          {autoRenew && typeof amount === "number" && (
            <Fact label="Next charge" icon={CircleDollarSign}>
              {usd(amount)}
              <span className="font-normal text-muted"> {everyLabel(months)}</span>
            </Fact>
          )}

          {card && (
            /* Brand and last four only, which is all anyone needs to know which
               card is about to be used. */
            <Fact label="Payment" icon={CreditCard}>
              <span className="capitalize">{card.brand}</span> {card.last4}
            </Fact>
          )}

          {visit && (
            <Fact label="Order" icon={Pill}>
              <button
                type="button"
                onClick={() => onOpenVisit?.(visit.case_id || visit.id)}
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                {visit.step?.label || "View visit"}
              </button>
            </Fact>
          )}
        </dl>

        {/* Says WHEN, not just how often: nothing is billed on the renewal date
            itself. That date asks for the next check-in, the card is held when
            they start it, and the money is taken only once a provider approves.
            Client's decision, 2026-10-06. One small line, because it is the
            kind of promise that has to be in writing on the screen that shows
            the amount. */}
        {autoRenew && typeof amount === "number" && (
          <p className="mt-3.5 text-[0.76rem] leading-relaxed text-muted">
            Held when you start your check-in, and taken only once a provider approves it.
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-[0.84rem] font-medium leading-relaxed text-red-700"
          >
            <AlertCircle size={15} className="mt-0.5 flex-none" />
            {error}
          </p>
        )}

        {/* The one thing waiting on them, where they are already looking. */}
        {(plan.canStart || plan.canRenew) && (
          <div className="mt-5 rounded-2xl border border-primary/35 bg-primary/[0.03] p-4 sm:flex sm:items-center sm:gap-6">
            <div className="min-w-0 flex-1">
              <p className="text-[0.95rem] font-semibold text-ink">
                {plan.canRenew
                  ? `Start your next ${months === 1 ? "month" : `${months} months`}`
                  : `Start your month ${plan.current} check-in`}
              </p>
              <p className="mt-1 text-[0.84rem] leading-relaxed text-muted">
                {plan.canRenew
                  ? `${amount != null ? `${usd(amount)} ` : ""}for ${
                      months === 1 ? "one month" : `${months} months`
                    }. Your card is held, not charged, until a provider approves.`
                  : `Already paid for as part of your ${planLabel(months)}, so there is nothing to pay now.`}
              </p>
            </div>
            <NextFillButton
              opportunityId={opportunityId}
              onUnauthorized={onUnauthorized}
              confirm={
                plan.canRenew
                  ? `${usd(amount) || "The amount"} will be held on your ${
                      card ? `${card.brand} ending ${card.last4}` : "saved card"
                    }. Nothing is taken until a provider approves.`
                  : undefined
              }
              className="mt-4 inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-[0.88rem] font-semibold text-on-primary transition-colors hover:bg-primary-deep disabled:opacity-70 sm:mt-0 sm:w-auto"
            >
              {plan.canRenew ? "Continue" : "Start check-in"} <ArrowRight size={15} />
            </NextFillButton>
          </div>
        )}
      </div>

      <Shipment visit={visit} order={order} />

      {/* Manage plan. Its own strip at the foot of the card, so the actions
          that change money are never mistaken for the facts above them. */}
      <footer className="border-t border-line bg-surface-2/40 px-5 py-4 sm:px-6">
        {ended ? (
          <p className="flex items-start gap-2 text-[0.86rem] leading-relaxed text-muted">
            <CheckCircle2 size={16} className="mt-0.5 flex-none text-primary" />
            This plan has ended and nothing more will be charged. You can start a new plan any
            time from{" "}
            <Link to="/treatments" className="font-semibold text-primary underline-offset-4 hover:underline">
              our treatments
            </Link>
            .
          </p>
        ) : confirming ? (
          <div>
            <p className="text-[0.88rem] font-semibold text-ink">Turn off automatic renewal?</p>
            <p className="mt-1.5 text-[0.84rem] leading-relaxed text-muted">
              You keep the {planLabel(months)} you have already paid for. We just will not charge
              you again{renewsLabel ? ` on ${renewsLabel}` : ""}
              {treatment ? ` for ${treatment}` : ""}. Any other plan you have carries on.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={cancel}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-[0.88rem] font-semibold text-on-primary transition-colors hover:bg-primary-deep disabled:opacity-70"
              >
                {busy && <Loader2 size={15} className="animate-spin" />}
                Yes, turn it off
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={busy}
                className="inline-flex items-center justify-center rounded-full border border-line px-6 py-2.5 text-[0.88rem] font-semibold text-ink transition-colors hover:border-primary/50 disabled:opacity-70"
              >
                Keep it on
              </button>
            </div>
          </div>
        ) : (
          /* Divided like the facts above it, so the state and the two actions
             read as three things rather than one run-on line. */
          <div className="flex flex-wrap items-center gap-y-3 sm:divide-x sm:divide-line">
            {/* Auto-renew states itself here rather than as another column.
                Next to the switch that changes it, the word and the action read
                as one thing instead of a fact and an unrelated link. */}
            <span className="flex items-center gap-2 pr-5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted">
              Auto-renew
              <span
                className={`rounded-full px-2 py-0.5 text-[0.68rem] ${
                  autoRenew
                    ? "bg-primary/15 text-primary-deep"
                    : "bg-surface-2 text-ink"
                }`}
              >
                {autoRenew ? "ON" : "OFF"}
              </span>
            </span>
            {autoRenew && (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="inline-flex items-center gap-1.5 px-0 text-[0.86rem] font-semibold text-primary underline-offset-4 transition-opacity hover:underline hover:opacity-80 sm:px-5"
              >
                <RefreshCw size={14} /> Turn off automatic renewal
              </button>
            )}
            {/* Linked from Treatments at John's request, so a question about a
                plan does not have to be retyped on another tab. */}
            <button
              type="button"
              onClick={() => onMessage?.(visit || null)}
              className="inline-flex items-center gap-1.5 px-0 text-[0.86rem] font-semibold text-muted underline-offset-4 transition-colors hover:text-ink hover:underline sm:px-5"
            >
              <MessageSquare size={14} /> Message the care team
            </button>
          </div>
        )}
      </footer>
    </section>
  );
}

export default function PortalTreatments({ onUnauthorized, onMessage, onOpenVisit, onNavigate }) {
  const [plans, setPlans] = useState(null);
  const [visits, setVisits] = useState([]);
  /* Parcels, keyed by case id. Fetched after the plans resolve, because which
     visits matter is only knowable once the plans are known, and one lookup per
     plan is a handful rather than one per visit. */
  const [orders, setOrders] = useState({});
  const [error, setError] = useState(null);

  /* Three waves, each painting as it lands.
   *
   * The plan is the page, so it alone gates the skeleton. The visits add the
   * order row, and the parcels add the tracking to it, and both of those are
   * extra MDI round trips that nobody should be made to wait behind: a patient
   * on two plans was waiting on five requests before seeing anything at all.
   * Fixed on 2026-10-07 after the client reported the portal as slow. */
  const load = useCallback(() => {
    let alive = true;

    portalData({ resource: "plan" })
      .then((r) => {
        if (alive) setPlans(Array.isArray(r?.plans) ? r.plans : []);
        return r;
      })
      .catch((err) => {
        if (!alive) return null;
        if (err.status === 401) return onUnauthorized();
        setError(err.message);
        return null;
      })
      /* The visits come second and are chained, because which of them matter
         depends on the plans. A failure here costs the order row and nothing
         else, so it never reaches the error state. */
      .then(async (planned) => {
        const list = Array.isArray(planned?.plans) ? planned.plans : [];
        if (!alive || !list.length) return;

        const cased = await portalData({ resource: "cases" }).catch(() => null);
        if (!alive) return;
        const seen = cased?.visits || cased?.cases || [];
        setVisits(seen);

        /* One per plan, deduplicated: two plans can share a visit only if the
           ladders overlap, but the Set costs nothing and a double fetch would
           be visible in the MDI logs. */
        const ids = [
          ...new Set(
            list
              .map((p) => currentVisitForPlan(p, seen))
              .map((v) => v?.case_id || v?.id)
              .filter(Boolean)
          ),
        ];
        if (!ids.length) return;
        const found = await Promise.all(
          ids.map((id) =>
            portalData({ resource: "order_status", case_id: id })
              .then((r) => [id, r?.order || null])
              /* A parcel nobody can look up is a row that says "ships once a
                 provider approves it", which is true and is not an error. */
              .catch(() => [id, null])
          )
        );
        if (alive) setOrders(Object.fromEntries(found));
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [onUnauthorized]);

  useEffect(load, [load]);

  const shell = "nv-scroll min-h-0 flex-1 overflow-y-auto px-6 py-6 md:px-10 md:py-10";
  /* The same width as Home, so moving between the two tabs does not shift the
   whole page sideways. max-w-3xl left a dead gutter on a laptop and made the
   fact columns too narrow to sit on one row. */
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

  if (plans === null) {
    return (
      <div className={shell} data-lenis-prevent aria-busy="true">
        <div className={page}>
          <span className="block h-7 w-48 animate-pulse rounded bg-line" />
          <div className="mt-8 h-72 animate-pulse rounded-2xl bg-line/50" />
          <span className="sr-only">Loading your treatments</span>
        </div>
      </div>
    );
  }

  return (  
    <div className={shell} data-lenis-prevent>
      <div className={page}>
        <h1 className="text-[1.45rem] leading-tight text-ink">Your Treatments</h1>
        <p className="mt-1 text-[0.9rem] text-muted">
          {plans.length > 1
            ? "Each plan renews, ships and can be switched off on its own."
            : "Your plan, your renewal and your shipments."}
        </p>

        {plans.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-line bg-surface-1 p-6 text-center">
            <p className="text-[1rem] font-semibold text-ink">You are not on a plan yet</p>
            <p className="mx-auto mt-2 max-w-md text-[0.9rem] leading-relaxed text-muted">
              When you start a 1 month or 3 month plan it appears here, with its renewal date, what
              it costs and where your next shipment is.
            </p>
            <Link
              to="/treatments"
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-[0.88rem] font-semibold text-on-primary transition-colors hover:bg-primary-deep"
            >
              Browse treatments <ArrowRight size={15} />
            </Link>
            {/* Their visits still live on the other tab, which is worth saying
                to someone who came here looking for one. */}
            <button
              type="button"
              onClick={() => onNavigate?.("visits")}
              className="mt-4 block w-full text-[0.84rem] font-semibold text-muted underline-offset-4 hover:text-ink hover:underline"
            >
              See my visits instead
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {plans.map((plan) => {
              const visit = currentVisitForPlan(plan, visits);
              return (
              <Treatment
                key={plan.opportunityId}
                plan={plan}
                visit={visit}
                order={orders[visit?.case_id || visit?.id] || null}
                onChanged={load}
                onUnauthorized={onUnauthorized}
                onMessage={onMessage}
                onOpenVisit={onOpenVisit}
              />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
