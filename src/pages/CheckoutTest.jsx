import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { productsData } from "../components/data/products";
import StripeCheckout from "../components/checkout/StripeCheckout";

/* A checkout harness, so testing a payment doesn't mean sitting through an MDI
 * questionnaire first.
 *
 * Built after the 2026-10-01 Stripe work, where every fix had to be verified by
 * completing a whole intake. Mounts the real StripeCheckout against the real
 * /api/pay, so what passes here is the shipped path, not a mock.
 *
 * Reachable only when the dev server is running: the route is registered behind
 * import.meta.env.DEV, so it is absent from a production build entirely rather
 * than relying on nobody guessing the URL.
 *
 * Use:  /checkout-test           pick a product
 *       /checkout-test?pid=11    go straight to that product's checkout
 */
export default function CheckoutTest() {
  const [params, setParams] = useSearchParams();
  const pid = params.get("pid");
  const [quote, setQuote] = useState(null);
  const [failed, setFailed] = useState(false);
  const [paid, setPaid] = useState(false);

  const visible = productsData.filter((p) => !p.hidden);
  const product = pid ? productsData.find((p) => String(p.id) === String(pid)) : null;

  useEffect(() => {
    if (!pid) return;
    setQuote(null);
    setFailed(false);
    setPaid(false);
    fetch(`/api/pay?pid=${encodeURIComponent(pid)}`)
      .then((r) => r.json())
      .then((q) => (q?.ok ? setQuote(q) : setFailed(true)))
      .catch(() => setFailed(true));
  }, [pid]);

  return (
    <main className="min-h-screen bg-bg px-4 py-10 text-ink">
      <div className="mx-auto max-w-lg">
        <p className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-primary">
          Checkout harness · dev only
        </p>
        <h1 className="mt-1 font-display text-[1.4rem] font-extrabold">Test a payment</h1>
        <p className="mt-1.5 text-[0.85rem] leading-relaxed text-muted">
          Card <code className="rounded bg-surface-2 px-1">4242 4242 4242 4242</code>, any future
          expiry, any CVC. Declines with <code className="rounded bg-surface-2 px-1">4000 0000 0000 0002</code>.
        </p>

        {quote && (
          <p className="mt-3 rounded-xl border border-line bg-surface-2 px-3 py-2 font-mono text-[0.72rem] text-muted">
            processor={quote.processor} · shows ${quote.amount} · shipping ${quote.shipping} ·
            total ${quote.total}
          </p>
        )}

        <div className="mt-5 rounded-3xl border border-line bg-surface p-5">
          {!pid ? (
            <div className="space-y-2">
              {visible.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setParams({ pid: String(p.id) })}
                  className="flex w-full items-center justify-between gap-4 rounded-xl border border-line px-3.5 py-2.5 text-left transition-colors hover:border-primary"
                >
                  <span className="min-w-0 truncate text-[0.88rem] font-medium">
                    <span className="mr-2 font-mono text-[0.72rem] text-muted">{p.id}</span>
                    {p.name}
                  </span>
                  <span className="shrink-0 text-[0.88rem] font-bold">{p.price}</span>
                </button>
              ))}
            </div>
          ) : paid ? (
            <div className="py-8 text-center">
              <p className="font-display text-[1.15rem] font-extrabold">Payment went through</p>
              <p className="mt-1.5 text-[0.85rem] text-muted">
                Check it in the Stripe test dashboard, then pick another product.
              </p>
              <button
                type="button"
                onClick={() => setParams({})}
                className="mt-4 rounded-xl border border-line px-4 py-2 text-[0.85rem] font-semibold"
              >
                Back to the list
              </button>
            </div>
          ) : failed ? (
            <p className="py-8 text-center text-[0.88rem] font-medium text-red-600">
              Couldn&rsquo;t quote product {pid}.
            </p>
          ) : (
            <StripeCheckout
              product={product}
              productName={product?.name}
              pid={pid}
              quote={quote}
              treatment={product?.name}
              submitted={false}
              onPaid={() => setPaid(true)}
            />
          )}
        </div>

        {pid && !paid && (
          <button
            type="button"
            onClick={() => setParams({})}
            className="mt-4 text-[0.82rem] font-semibold text-muted transition-colors hover:text-ink"
          >
            ← Pick a different product
          </button>
        )}
      </div>
    </main>
  );
}
