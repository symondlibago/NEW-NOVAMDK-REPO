import { Check } from "lucide-react";

/* How many months the patient is buying, chosen at checkout.
 *
 * Every figure here comes from the server's quote, including the per-month
 * price and the saving: the browser does no money arithmetic, so there is
 * nothing on this screen the server did not produce. The chosen term is sent
 * back as a month count and priced again, so a tampered one buys nothing.
 *
 * Rendered by both the Stripe panel and the PayTechTrust fallback, hence its
 * own file rather than living inside either.
 */

const usd = (n) =>
  typeof n === "number"
    ? n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        /* Whole dollars when it is whole: "$456" rather than "$456.00". The
           discounted months are rounded to the dollar by design, so the cents
           are almost always noise, and the column of numbers reads better
           without them. */
        minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
      })
    : "";

const label = (months) => (months === 1 ? "1 month" : `${months} months`);

export default function PlanTerms({ terms = [], months, onChange, disabled = false }) {
  /* Nothing to choose from is not a chooser. A single term means this product
     is sold one month at a time, and an expensive one deliberately is. */
  if (!Array.isArray(terms) || terms.length < 2) return null;

  return (
    <div className="mt-5">
      <p className="font-journal text-[1rem] font-semibold text-ink">How many months?</p>
      <p className="mt-1 text-[0.78rem] leading-relaxed text-muted">
        Your treatment ships one month at a time. You answer a short check-in before each
        refill, and pay for the whole plan once, today.
      </p>

      <div role="radiogroup" aria-label="How many months?" className="mt-3 space-y-2">
        {terms.map((t) => {
          const on = t.months === months;
          return (
            <button
              key={t.months}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={disabled}
              onClick={() => onChange?.(t.months)}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors disabled:opacity-60 ${
                on
                  ? "border-primary bg-primary/[0.06]"
                  : "border-line bg-bg hover:border-primary/50"
              }`}
            >
              {/* The dot carries the choice on its own, so the selected row is
                  still legible to anyone who cannot see the tint. */}
              <span
                className={`grid h-5 w-5 flex-none place-items-center rounded-full border-2 transition-colors ${
                  on ? "border-primary bg-primary text-white" : "border-line-strong/50"
                }`}
              >
                {on ? <Check size={12} strokeWidth={3} /> : null}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[0.95rem] font-semibold leading-snug">
                  {label(t.months)}
                </span>
                <span className="mt-0.5 block text-[0.76rem] text-muted">
                  {usd(t.perMonth)} a month
                  {t.saving > 0 ? ` · save ${usd(t.saving)}` : ""}
                </span>
              </span>

              <span className="shrink-0 text-[1rem] font-bold">{usd(t.total)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
