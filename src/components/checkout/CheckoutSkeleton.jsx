import React from "react";
import { Lock } from "lucide-react";

/* The checkout, in outline, while the quote is in flight.
 *
 * Replaces a spinner centred on an empty cream page. The problem with the
 * spinner was not that it looked cheap, it was that it said nothing: a full
 * screen of nothing with a dot in the middle gives no sign that a payment
 * screen is coming, and on a slow connection it reads as a page that failed.
 * This is the shape of what is about to arrive, so the layout does not jump
 * when the real thing replaces it, and the wait reads as loading rather than
 * as empty.
 *
 * The frame is real, not skeleton: the logo and the Secure checkout lock are
 * the two things a patient about to type a card number wants to see, and there
 * is no reason to withhold them. Everything below is a block.
 *
 * Mirrors SubscriptionProductPage / StripeCheckout: same cream page, same
 * max-w-6xl, same 3/2 split from lg.
 */

/* One block. Width and height come from the caller because the point is the
   shape of the real content, not a uniform grey grid. */
function Bar({ className = "" }) {
  return <span aria-hidden="true" className={`nv-skeleton block rounded-md ${className}`} />;
}

export default function CheckoutSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-1 flex-col bg-co-page px-4 py-5 font-checkout sm:px-7 sm:py-6"
    >
      {/* The only text in here. Everything else is aria-hidden, so a screen
          reader hears one sentence instead of forty empty boxes. */}
      <span className="sr-only">Loading secure payment</span>

      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <img src="/logo-2026.png" alt="NovaMDK" className="h-8 w-auto" />
          <span className="flex items-center gap-1.5 text-sm text-co-muted">
            <Lock size={14} />
            Secure checkout
          </span>
        </div>

        <div className="mt-7 grid items-start gap-8 lg:grid-cols-5 lg:gap-12">
          {/* ---------- what they are buying ---------- */}
          <div aria-hidden="true" className="min-w-0 lg:col-span-3">
            {/* The heading, two lines on a phone and one from sm. */}
            <Bar className="h-8 w-4/5 sm:h-10" />
            <Bar className="mt-2.5 h-8 w-2/5 sm:hidden" />

            <Bar className="mt-5 h-4 w-full max-w-xl" />
            <Bar className="mt-2 h-4 w-11/12 max-w-lg" />

            {/* The product card, a real bordered card with blocks inside it:
                the border is what makes this read as a layout rather than as
                a pile of grey bars. */}
            <div className="mt-8 flex items-center gap-4 rounded-2xl border border-co-line bg-white p-4">
              <Bar className="h-14 w-14 flex-none rounded-xl sm:h-18 sm:w-18" />
              <div className="min-w-0 flex-1">
                <Bar className="h-5 w-3/5" />
                <Bar className="mt-2 h-3.5 w-2/5" />
              </div>
            </div>

            <Bar className="mt-8 h-3 w-28" />

            {/* Two plan rows. Taller than the other blocks because the real
                ones are the tallest thing in this column. */}
            <div className="mt-3.5 grid gap-3">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-2xl border-2 border-co-line bg-white px-4 py-4 sm:px-5 sm:py-5"
                >
                  <Bar className="h-5.5 w-5.5 flex-none rounded-full" />
                  <div className="min-w-0 flex-1">
                    <Bar className="h-4.5 w-24" />
                    <Bar className="mt-2 h-3.5 w-40" />
                  </div>
                  <Bar className="h-6 w-20 flex-none" />
                </div>
              ))}
            </div>
          </div>

          {/* ---------- what it costs, and the card ---------- */}
          <div
            aria-hidden="true"
            className="min-w-0 rounded-2xl border border-co-line bg-white p-6 shadow-xl shadow-co-gold/5 lg:col-span-2"
          >
            <Bar className="h-5 w-36" />
            {/* The headline figure. Tall and wide, because that is the one
                number the eye goes to and a thin bar here makes the panel look
                like a list of settings. */}
            <Bar className="mt-4 h-11 w-44" />
            <Bar className="mt-2.5 h-3.5 w-52" />

            <div className="mt-6 space-y-3">
              {[["w-24", "w-16"], ["w-20", "w-20"]].map(([l, r], i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <Bar className={`h-3.5 ${l}`} />
                  <Bar className={`h-3.5 ${r}`} />
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-co-line pt-4">
              <Bar className="h-4 w-40" />
              <Bar className="h-7 w-24" />
            </div>

            <Bar className="mt-4 h-16 w-full rounded-xl" />

            <div className="my-6 h-px bg-co-line" />

            <Bar className="h-5 w-32" />
            <div className="mt-4 space-y-3">
              <div>
                <Bar className="h-3 w-24" />
                <Bar className="mt-1.5 h-12 w-full rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[0, 1].map((i) => (
                  <div key={i}>
                    <Bar className="h-3 w-20" />
                    <Bar className="mt-1.5 h-12 w-full rounded-xl" />
                  </div>
                ))}
              </div>
            </div>

            {/* The button, tinted gold rather than cream: a grey slab where the
                Pay button goes is the one block that makes the whole panel look
                disabled rather than loading. */}
            <span
              aria-hidden="true"
              className="nv-skeleton mt-6 block h-14 w-full rounded-2xl"
              style={{ backgroundColor: "color-mix(in oklab, var(--color-co-gold) 22%, white)" }}
            />
            <Bar className="mx-auto mt-3 h-3 w-52" />
          </div>
        </div>
      </div>
    </div>
  );
}
