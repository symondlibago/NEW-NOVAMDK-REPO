import { Truck } from "lucide-react";

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

  /* The one-month term's own monthly price, struck through beside the longer
     terms. Read from the quote like every other figure here, not worked out. */
  const base = terms.find((t) => t.months === 1)?.perMonth;

  return (
    <div className="mt-8">
      <p className="mb-3.5 text-xs font-semibold uppercase tracking-widest text-co-muted">
        Choose your plan
      </p>

      <div role="radiogroup" aria-label="Choose your plan" className="grid gap-3">
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
              className={`flex w-full items-center gap-4 rounded-2xl border-2 px-4 py-4 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-gold-hi disabled:opacity-60 sm:px-5 sm:py-5 ${
                on
                  ? "border-co-gold bg-co-wash ring-4 ring-co-gold-hi/15"
                  : "border-co-line bg-white hover:border-co-line-2"
              }`}
            >
              {/* The dot carries the choice on its own, so the selected row is
                  still legible to anyone who cannot see the tint. */}
              <span
                className={`grid h-5.5 w-5.5 flex-none place-items-center rounded-full border-2 transition-colors ${
                  on ? "border-co-gold bg-co-gold" : "border-co-line-2"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full bg-white transition-transform ${
                    on ? "scale-100" : "scale-0"
                  }`}
                />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2.5 text-base font-semibold text-co-ink">
                  {label(t.months)}
                  {t.saving > 0 ? (
                    <span className="rounded-full bg-co-tint px-2.5 py-0.5 text-xs font-semibold text-co-gold">
                      Save {usd(t.saving)}
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-sm text-co-muted">{usd(t.total)} total</span>
              </span>

              <span className="shrink-0 text-right">
                {t.saving > 0 && typeof base === "number" ? (
                  <s className="block text-xs text-co-muted">{usd(base)}/mo</s>
                ) : null}
                <strong className="block text-lg font-semibold text-co-ink">
                  {usd(t.perMonth)}/mo
                </strong>
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 flex gap-2.5 text-sm leading-relaxed text-co-ink-2">
        <Truck size={16} className="mt-0.5 flex-none text-co-gold" />
        <span>
          Your treatment ships one month at a time. You answer a short check-in before each
          refill, and pay for the whole plan once, today.
        </span>
      </p>
    </div>
  );
}
