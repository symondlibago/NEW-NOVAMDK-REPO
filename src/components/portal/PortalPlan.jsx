import React, { useState } from "react";
import { format } from "date-fns";
import { AlertCircle, CalendarCheck, CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { portalData } from "../../lib/portal";

/* A patient's plan and its renewal, with the switch to turn renewal off.
 *
 * The six things the client asked this to show (2026-10-05): the current plan,
 * the next renewal date, the renewal amount, the payment method, a cancel
 * button, and a confirmation once it is cancelled. All six are here because
 * each one is part of the same decision: nobody should have to guess what they
 * are about to be charged, on which card, or when, before they can stop it.
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

const term = (months) => (months === 1 ? "1 month" : `${months} month`);

export default function PortalPlan({ billing, onChanged, onUnauthorized }) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  if (!billing) return null;

  const { months, autoRenew, renewsOn, amount, treatment, card } = billing;
  const renewsLabel = day(renewsOn);

  const cancel = async () => {
    setBusy(true);
    setError(null);
    try {
      await portalData({ resource: "cancel_renewal" });
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
          You will not be charged again. The {term(months)} you have already paid for carries on
          as normal, and you can start a new plan any time.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-surface-1 p-5 sm:p-6">
      <p className="text-[1rem] font-semibold text-ink">Your plan</p>

      <dl className="mt-4 space-y-3 text-[0.88rem]">
        <div className="flex items-start justify-between gap-4">
          <dt className="text-muted">Current plan</dt>
          <dd className="text-right font-medium">
            {term(months)}
            {treatment ? <span className="block text-[0.8rem] text-muted">{treatment}</span> : null}
          </dd>
        </div>

        {renewsLabel && (
          <div className="flex items-start justify-between gap-4">
            <dt className="flex items-center gap-1.5 text-muted">
              <CalendarCheck size={14} className="flex-none text-primary" /> Next renewal
            </dt>
            <dd className="text-right font-medium">{renewsLabel}</dd>
          </div>
        )}

        {typeof amount === "number" && (
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted">Renewal amount</dt>
            <dd className="text-right font-medium">
              {usd(amount)}
              <span className="block text-[0.8rem] text-muted">every {term(months)}</span>
            </dd>
          </div>
        )}

        {card && (
          <div className="flex items-start justify-between gap-4">
            <dt className="flex items-center gap-1.5 text-muted">
              <CreditCard size={14} className="flex-none text-primary" /> Payment method
            </dt>
            {/* Brand and last four only, which is all anyone needs to know
                which card is about to be used. */}
            <dd className="text-right font-medium capitalize">
              {card.brand} ending {card.last4}
            </dd>
          </div>
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
          <p className="text-[0.88rem] font-semibold text-ink">
            Turn off automatic renewal?
          </p>
          <p className="mt-1.5 text-[0.84rem] leading-relaxed text-muted">
            You keep the {term(months)} you have already paid for. We just will not charge you
            again{renewsLabel ? ` on ${renewsLabel}` : ""}.
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
