import React, { useEffect, useRef, useState } from "react";
import { Loader2, Lock } from "lucide-react";

/* The whole checkout, on one screen.
 *
 * Replaces a layout that stacked a plan block, an order summary, a payment
 * section, three card iframes and three text inputs, which is why it scrolled,
 * and Kurv's hosted page, which was the second screen. The brief (John,
 * 2026-09-30) was: logo, product image, product name, what they're paying, card
 * field, done. No phone number, no address.
 *
 * Uses Stripe's split card elements (cardNumber / cardExpiry / cardCvc) rather
 * than the newer Payment Element. The Payment Element always offers Link
 * alongside the card, and Link adds a "save my information" panel asking for
 * email, mobile number and full name, which is exactly what the brief said to
 * remove. `payment_method_types: ["card"]` does not suppress it, and turning it
 * off is a dashboard setting we would be relying on rather than controlling.
 * Worse, on 2026-10-01 a Link signup with a non-US mobile number was what kept
 * a test payment from settling at all. The split elements can only ever collect
 * a card, which is all this checkout wants.
 *
 * Stripe.js is loaded from its CDN rather than bundled, which is Stripe's only
 * supported arrangement: the fields are iframes served by Stripe, so a card
 * number never enters our page and NovaMDK stays out of PCI scope. Same
 * reasoning as the Collect.js integration this replaces.
 */

const STRIPE_JS = "https://js.stripe.com/v3/";
const PUBLISHABLE = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
/* Generous enough for a bank's 3D Secure prompt, short enough that a blocked
   CDN doesn't leave "Processing…" up indefinitely. On expiry the server is
   asked what Stripe actually holds, so a slow success still completes. */
const CONFIRM_TIMEOUT_MS = 90_000;
/* Stripe.js is the only script that can mount the fields, so if it can't load
   there is nothing to fall back to. */
const LOAD_TIMEOUT_MS = 15_000;

let loader = null;
/** Loads Stripe.js once per page, however many times this mounts. */
function loadStripeJs() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.Stripe) return Promise.resolve(window.Stripe);
  if (loader) return loader;
  loader = new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${STRIPE_JS}"]`);
    const script =
      existing || Object.assign(document.createElement("script"), { src: STRIPE_JS, async: true });
    /* Resolves null rather than rejecting: an ad blocker taking out Stripe.js
       is a message to the patient, not an unhandled rejection. The timeout is
       there because a filtered network can leave the request hanging without
       ever firing `error`, which showed as a checkout stuck on "Loading". */
    const done = (v) => { clearTimeout(timer); resolve(v); };
    const timer = setTimeout(() => { loader = null; done(null); }, LOAD_TIMEOUT_MS);
    script.addEventListener("load", () => done(window.Stripe || null));
    script.addEventListener("error", () => { loader = null; done(null); });
    if (!existing) document.head.appendChild(script);
  });
  return loader;
}

const usd = (n) =>
  typeof n === "number" ? n.toLocaleString("en-US", { style: "currency", currency: "USD" }) : "";

const FIELD =
  "rounded-xl border border-line bg-bg px-3.5 py-3.5 transition-colors focus-within:border-primary";

export default function StripeCheckout({
  product,
  productName,
  pid,
  quote,
  treatment,
  submitted,
  onPaid,
}) {
  // "boot" | "ready" | "paying" | "done" | "dead"
  const [status, setStatus] = useState("boot");
  const [message, setMessage] = useState("");

  const numberRef = useRef(null);
  const expiryRef = useRef(null);
  const cvcRef = useRef(null);

  const sdk = useRef({ stripe: null, card: null });
  const mounted = useRef([]); // the three elements, so they can be unmounted
  const secret = useRef(null);
  const intentId = useRef(null);

  /* Late callbacks from Stripe must not touch a popup that has closed. Set true
     on mount, not just false on cleanup: StrictMode mounts, tears down and
     remounts in development, so a cleanup-only version latched false and the
     real mount then bailed before mounting the fields. */
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const name = product?.name || productName || "Your treatment";
  const image = product?.img || product?.imgDetail || null;
  const total = quote?.total;

  useEffect(() => {
    if (!pid || !quote) return undefined;
    if (!PUBLISHABLE) {
      console.error("VITE_STRIPE_PUBLISHABLE_KEY is not set — the card form cannot load.");
      setStatus("dead");
      return undefined;
    }
    let cancelled = false;
    let watchdog = null;

    (async () => {
      const [Stripe, intent] = await Promise.all([
        loadStripeJs(),
        fetch("/api/pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "stripe_intent",
            pid,
            contact_id: sessionStorage.getItem("ghl_contact") || undefined,
            opportunity_id: sessionStorage.getItem("ghl_opportunity") || undefined,
            /* A hint for Stripe's receipt. The server re-checks it and looks
               the address up from the CRM when this is missing, so a resumed
               intake in a fresh tab still gets a receipt. */
            receipt_email: sessionStorage.getItem("nv_email") || undefined,
            treatment,
            submitted,
          }),
        })
          .then((r) => r.json())
          .catch(() => null),
      ]);
      if (cancelled || !alive.current) return;

      if (!Stripe) {
        console.error("Stripe.js did not load");
        setStatus("dead");
        return;
      }
      if (!intent?.ok || !intent.clientSecret) {
        console.error("Stripe intent not created:", intent?.error || intent);
        setStatus("dead");
        return;
      }

      secret.current = intent.clientSecret;
      intentId.current = intent.paymentIntentId;

      const stripe = Stripe(PUBLISHABLE);
      const elements = stripe.elements();
      /* Card elements take `style`, not the Payment Element's `appearance`. */
      const style = {
        base: {
          fontFamily: "inherit",
          fontSize: "15px",
          color: "#1a1a1a",
          "::placeholder": { color: "#9a9a9a" },
        },
        invalid: { color: "#dc2626", iconColor: "#dc2626" },
      };
      const card = elements.create("cardNumber", { style, placeholder: "Card number" });
      const expiry = elements.create("cardExpiry", { style });
      const cvc = elements.create("cardCvc", { style });
      sdk.current = { stripe, card };
      mounted.current = [card, expiry, cvc];

      /* Clears a stale decline as soon as they start correcting the card, and
         surfaces Stripe's own field-level wording while they type. */
      card.on("change", (e) => {
        if (!alive.current) return;
        setMessage(e.error?.message || "");
      });
      card.on("ready", () => {
        clearTimeout(watchdog);
        if (alive.current) setStatus("ready");
      });
      /* `ready` is the only signal the fields are usable, and a blocked Stripe
         CDN can mean it never arrives. Without this the panel sat on
         "Loading secure payment…" with no way forward and nothing logged. */
      watchdog = setTimeout(() => {
        if (alive.current) {
          console.error("Stripe card element never reported ready");
          setStatus("dead");
        }
      }, LOAD_TIMEOUT_MS);

      if (numberRef.current) card.mount(numberRef.current);
      if (expiryRef.current) expiry.mount(expiryRef.current);
      if (cvcRef.current) cvc.mount(cvcRef.current);
    })();

    return () => {
      cancelled = true;
      clearTimeout(watchdog);
      /* StrictMode replaces the host nodes on remount, so elements left
         mounted on the old ones never become interactive. */
      for (const el of mounted.current) {
        try { el.unmount(); } catch { /* already gone */ }
      }
      mounted.current = [];
    };
    // treatment/submitted are captured for this payment and don't re-open it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid, quote]);

  /* Tells the server the payment landed, so it can tag the contact and move the
     card. Also the source of truth when confirmation times out: it reads the
     intent back from Stripe, so its answer is what Stripe holds rather than
     what this browser believes.
   *
     Never throws. By the time it runs the money is already taken, so a CRM
     hiccup must not read to the patient as a failed payment; the webhook
     repeats the same work and both are safe to run twice. */
  const settle = async (id) => {
    if (!id) return null;
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "stripe_settle",
          payment_intent_id: id,
          treatment,
          submitted,
        }),
      });
      return await res.json();
    } catch (err) {
      console.error("Stripe settle call failed; the webhook will cover it:", err);
      return null;
    }
  };

  const finish = () => {
    setStatus("done");
    setTimeout(() => onPaid?.(), submitted ? 0 : 1800);
  };

  const pay = async (e) => {
    e.preventDefault();
    const { stripe, card } = sdk.current;
    if (!stripe || !card || !secret.current || status !== "ready") return;
    setMessage("");
    setStatus("paying");

    /* Bounded and wrapped: this call has two ways of stranding the patient on
       "Processing…" forever. It can throw rather than return an error (Stripe.js
       does when its CDN is blocked, which an extension or filtered network will
       do), and it can simply never settle. Neither left any way back. */
    let result;
    try {
      result = await Promise.race([
        stripe.confirmCardPayment(secret.current, {
          /* The card element itself, so the number never touches our page. No
             billing_details: the brief said no name, phone or address, and a
             card payment does not need them. */
          payment_method: { card },
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("confirm_timeout")), CONFIRM_TIMEOUT_MS)
        ),
      ]);
    } catch (err) {
      if (!alive.current) return;
      console.error("Stripe confirm did not settle:", err);
      /* The card may well have been charged before the UI gave up, so ask the
         server what Stripe actually holds rather than declaring failure and
         inviting a second payment. */
      const verdict = await settle(intentId.current);
      if (!alive.current) return;
      if (verdict?.ok) { finish(); return; }
      setMessage(
        "We couldn't confirm that payment. Check your connection, turn off any ad blocker for this site, and try again. You have not been charged twice."
      );
      setStatus("ready");
      return;
    }

    if (!alive.current) return;
    const { error, paymentIntent } = result || {};

    if (error) {
      /* card_error and validation_error carry wording meant for the patient.
         Anything else is ours to debug, so it stays in the console. */
      const patientFacing = error.type === "card_error" || error.type === "validation_error";
      if (!patientFacing) console.error("Stripe confirm failed:", error);
      setMessage(
        (patientFacing && error.message) || "We couldn't take that payment. Please try again."
      );
      setStatus("ready");
      return;
    }

    if (paymentIntent?.status !== "succeeded") {
      console.warn("Stripe payment ended as", paymentIntent?.status);
      setMessage("That payment didn't complete. Please try again.");
      setStatus("ready");
      return;
    }

    await settle(paymentIntent.id || intentId.current);
    if (!alive.current) return;
    finish();
  };

  if (status === "dead") {
    return (
      <div className="text-center">
        <p className="text-[0.9rem] font-medium text-red-600">
          We couldn&rsquo;t load the secure card form.
        </p>
        <p className="mt-2 text-[0.85rem] leading-relaxed text-muted">
          Please refresh the page, or email support@novamdk.com and we&rsquo;ll take your payment
          another way.
        </p>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="py-6 text-center">
        <p className="font-display text-[1.2rem] font-extrabold">Payment received</p>
        <p className="mt-1.5 text-[0.88rem] text-muted">Taking you back to your visit…</p>
      </div>
    );
  }

  return (
    <form onSubmit={pay} className="flex flex-col gap-4">
      <img src="/logo.png" alt="NovaMDK" className="mx-auto h-7 w-auto" />

      {/* Product image, name and price: one row, so nothing has to scroll. */}
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2 p-3">
        {image ? (
          <img src={image} alt="" className="h-14 w-14 flex-none rounded-xl object-cover" loading="eager" />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.92rem] font-semibold leading-snug">{name}</p>
          <p className="mt-0.5 text-[0.76rem] text-muted">One-time payment</p>
        </div>
        <span className="flex-none text-[1rem] font-bold">{usd(total)}</span>
      </div>

      <div className="flex items-baseline justify-between border-t border-line pt-3">
        <span className="text-[0.9rem] font-bold">Due today</span>
        <span className="text-[1.15rem] font-bold text-primary">{usd(total)}</span>
      </div>

      {/* Stripe's iframes mount into these. Heights are fixed so the panel
          doesn't jump as they load. */}
      <div className={status === "boot" ? "hidden" : "space-y-3"}>
        <div ref={numberRef} className={FIELD} />
        <div className="grid grid-cols-2 gap-3">
          <div ref={expiryRef} className={FIELD} />
          <div ref={cvcRef} className={FIELD} />
        </div>
      </div>
      {status === "boot" && (
        <div className="flex items-center justify-center gap-2 py-10 text-[0.85rem] text-muted">
          <Loader2 size={15} className="animate-spin" />
          Loading secure payment…
        </div>
      )}

      {message && (
        <p role="alert" className="text-[0.85rem] font-medium text-red-600">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status !== "ready"}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-[0.95rem] font-bold text-on-primary transition-opacity disabled:opacity-50"
      >
        {status === "paying" ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Processing…
          </>
        ) : (
          <>Pay {usd(total)}</>
        )}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-[0.72rem] text-muted">
        <Lock size={11} />
        Secured by Stripe. Your card details never reach NovaMDK.
      </p>
    </form>
  );
}
