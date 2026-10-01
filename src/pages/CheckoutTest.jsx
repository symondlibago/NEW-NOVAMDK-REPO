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
/* Stripe's own test numbers. Each one makes the gateway answer with a specific
   decline code, which is the only way to see the wording a patient would get
   short of a real card being refused. */
const TEST_CARDS = [
  ["4242 4242 4242 4242", "succeeds"],
  ["4000 0000 0000 0002", "generic decline"],
  ["4000 0000 0000 9995", "insufficient funds"],
  ["4000 0000 0000 0069", "expired card"],
  ["4000 0000 0000 0127", "wrong security code"],
  ["4000 0000 0000 0119", "processing error at the bank"],
  ["4000 0000 0000 9987", "lost card, shows the generic wording on purpose"],
  ["4000 0025 0000 3155", "bank asks to confirm the payment"],
];

export default function CheckoutTest() {
  const [params, setParams] = useSearchParams();
  const pid = params.get("pid");
  const [quote, setQuote] = useState(null);
  const [failed, setFailed] = useState(false);
  const [paid, setPaid] = useState(false);

  const visible = productsData.filter((p) => !p.hidden);
  const product = pid ? productsData.find((p) => String(p.id) === String(pid)) : null;

  /* Without these the harness can only show the decline message: the GHL ids
     ride along in the Stripe intent's metadata, StripeCheckout reads them from
     sessionStorage where the intake put them, and the settle path moves the card
     named there. An empty session means nothing to move.
     ?con=<contact id>&opp=<opportunity id> stands in for the questionnaire.

     Written during render rather than in an effect on purpose: a parent's
     effects run after its children's, so StripeCheckout would already have
     created its intent, with empty metadata, by the time an effect here fired. */
  const con = params.get("con");
  const opp = params.get("opp");
  if (con) sessionStorage.setItem("ghl_contact", con);
  if (opp) sessionStorage.setItem("ghl_opportunity", opp);
  const linked = {
    contact: sessionStorage.getItem("ghl_contact"),
    opportunity: sessionStorage.getItem("ghl_opportunity"),
  };
  const unlink = () => {
    sessionStorage.removeItem("ghl_contact");
    sessionStorage.removeItem("ghl_opportunity");
    setParams(pid ? { pid } : {});
  };

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
          Any future expiry, any CVC. Each card below triggers a different decline, so the message
          the patient reads can be checked without waiting for a real one.
        </p>

        <div className="mt-3 space-y-1 rounded-xl border border-line bg-surface-2 p-3">
          {TEST_CARDS.map(([number, what]) => (
            <p key={number} className="flex items-baseline gap-2 font-mono text-[0.72rem]">
              <code className="shrink-0">{number}</code>
              <span className="text-muted">{what}</span>
            </p>
          ))}
        </div>

        {/* The CRM half of the test, which is the half that can't be faked:
            these writes land on the real GoHighLevel location, so use a test
            contact's card and not a patient's. */}
        <div className="mt-3 rounded-xl border border-line bg-surface-2 px-3 py-2.5 font-mono text-[0.72rem] leading-relaxed">
          {linked.opportunity ? (
            <>
              <p className="text-ink">
                moves GHL card <span className="font-bold">{linked.opportunity}</span>
              </p>
              <p className="text-muted">contact {linked.contact || "(none, so no tag)"}</p>
              <button type="button" onClick={unlink} className="mt-1 font-semibold text-primary">
                unlink
              </button>
            </>
          ) : (
            <p className="text-muted">
              No GHL card linked, so a decline shows the message but moves nothing. Add{" "}
              <code className="text-ink">?con=…&amp;opp=…</code> to test the Payment Failed move.
            </p>
          )}
        </div>

        {quote && (
          <p className="mt-3 rounded-xl border border-line bg-surface-2 px-3 py-2 font-mono text-[0.72rem] text-muted">
            processor={quote.processor} · shows ${quote.amount} · shipping ${quote.shipping} ·
            total ${quote.total}
          </p>
        )}

        {/* No panel of its own: StripeCheckout brings one, and the two other
            states below add their own. */}
        <div className="mt-5">
          {!pid ? (
            <div className="space-y-2 rounded-3xl border border-line bg-surface p-5">
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
            <div className="rounded-3xl border border-line bg-surface p-5 py-8 text-center">
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
            <p className="rounded-3xl border border-line bg-surface p-5 py-8 text-center text-[0.88rem] font-medium text-red-600">
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
