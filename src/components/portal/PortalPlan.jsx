import React, { useState } from "react";
import { format } from "date-fns";
import { AlertCircle, CalendarCheck, CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { portalData } from "../../lib/portal";

/* A patient's plans and their renewals, each with its own switch.
 *
 * The six things the client asked this to show (2026-10-05): the current plan,
 * the next renewal date, the renewal amount, the payment method, a cancel
 * button, and a confirmation once it is cancelled. All six are here because
 * each is part of the same decision: nobody should have to guess what they are
 * about to be charged, on which card, or when, before they can stop it.
 *
 * ONE BLOCK PER PLAN, since 2026-10-06. A patient can hold a plan per
 * treatment, so renewal is turned off per treatment rather than all at once:
 * someone on semaglutide and tirzepatide can keep one and stop the other.
 *
 * Cancelling stops future billing and nothing else. The term already paid for
 * continues, which the copy says plainly so that pressing the button is not a
 * leap of faith.
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
  /* Midday, so a plain date is not pulled back a day by the viewer's zone. */
  const at = new Date(`${iso}T12:00:00`);
  return Number.isNaN(at.getTime()) ? null : format(at, "MMMM d, yyyy");
};

/* Two shapes, because the grammar differs. "3 month plan" is a thing you own;
   "every 3 months" is how often it bills. One helper for both produced "The 3
   month you have already paid for", which is how this was spotted. */
const planLabel = (months) => `${months} month plan`;
const everyLabel = (months) => (months === 1 ? "every month" : `every ${months} months`);

function Row({ label, icon, children }) {
  const Icon = icon;
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="flex items-center gap-1.5 text-muted">
        {Icon ? <Icon size={14} className="flex-none text-primary" /> : null}
        {label}
      </dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

function Plan({ plan, onChanged, onUnauthorized }) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const { opportunityId, months, autoRenew, renewsOn, amount, treatment, card } = plan;
  const renewsLabel = day(renewsOn);

  const cancel = async () => {
    setBusy(true);
    setError(null);
    try {
      /* The plan is named, so a patient on two treatments cancels the one they
         meant. The server checks the id belongs to them. */
      await portalData({ resource: "cancel_renewal", opportunity_id: opportunityId });
      setDone(true);
      setConfirming(false);
      onChanged?.();
    } catch (err) {
      if (err.status === 401 && onUnauthorized) return onUnauthorized();
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  /* Confirmed, and said so in the patient's own terms: what stopped, and what
     did not. The second half matters more than the first. */
  if (done || !autoRenew) {
    return (
      <section className="rounded-2xl border border-line bg-surface-1 p-5 sm:p-6">
        <p className="flex items-center gap-2 text-[1rem] font-semibold text-ink">
          <CheckCircle2 size={17} className="flex-none text-primary" />
          Automatic renewal is off
        </p>
        <p className="mt-2 text-[0.88rem] leading-relaxed text-muted">
          {treatment ? `${treatment}. ` : ""}You will not be charged again for this one. The{" "}
          {planLabel(months)} you have already paid for carries on as normal, and you can start a
          new plan any time.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-surface-1 p-5 sm:p-6">
      <p className="text-[1rem] font-semibold text-ink">
        {treatment || "Your plan"}
      </p>

      <dl className="mt-4 space-y-3 text-[0.88rem]">
        <Row label="Current plan">{planLabel(months)}</Row>

        {renewsLabel && (
          <Row label="Next renewal" icon={CalendarCheck}>
            {renewsLabel}
          </Row>
        )}

        {typeof amount === "number" && (
          <Row label="Renewal amount">
            {usd(amount)}
            {/* Says WHEN, not just how often. Nothing is billed on the renewal
                date itself: that date asks them for their next check-in, the
                card is held when they start it, and the money is taken only if
                a provider approves. Client's decision, 2026-10-06. */}
            <span className="block text-[0.8rem] text-muted">
              {everyLabel(months)}, held when you start your check-in and taken once a provider
              approves it
            </span>
          </Row>
        )}

        {card && (
          /* Brand and last four only, which is all anyone needs to know which
             card is about to be used. */
          <Row label="Payment method" icon={CreditCard}>
            <span className="capitalize">
              {card.brand} ending {card.last4}
            </span>
          </Row>
        )}
      </dl>

      {error && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-[0.84rem] font-medium leading-relaxed text-red-700"
        >
          <AlertCircle size={15} className="mt-0.5 flex-none" />
          {error}
        </p>
      )}

      {confirming ? (
        <div className="mt-5 rounded-2xl border border-line-strong/40 bg-surface-2/60 p-4">
          <p className="text-[0.88rem] font-semibold text-ink">Turn off automatic renewal?</p>
          <p className="mt-1.5 text-[0.84rem] leading-relaxed text-muted">
            You keep the {planLabel(months)} you have already paid for. We just will not charge you
            again{renewsLabel ? ` on ${renewsLabel}` : ""}
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
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-5 text-[0.86rem] font-semibold text-primary underline-offset-4 transition-opacity hover:underline hover:opacity-80"
        >
          Turn off automatic renewal
        </button>
      )}
    </section>
  );
}

export default function PortalPlan({ plans, onChanged, onUnauthorized }) {
  /* Nothing at all for a patient who holds no plan, which is most of them. */
  if (!Array.isArray(plans) || plans.length === 0) return null;

  return (
    <div className="space-y-4">
      {plans.length > 1 && (
        <p className="text-[0.82rem] text-muted">
          You have {plans.length} plans. Each renews on its own, so turning one off leaves the
          others running.
        </p>
      )}
      {plans.map((plan) => (
        <Plan
          key={plan.opportunityId}
          plan={plan}
          onChanged={onChanged}
          onUnauthorized={onUnauthorized}
        />
      ))}
    </div>
  );
}
