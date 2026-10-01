import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CreditCard,
  Loader2,
  Lock,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { declineMessage } from "./declineMessage";

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

/* focus-within, because the input itself lives inside Stripe's iframe and never
   receives our focus styles. The left padding leaves room for the icon sitting
   over the field: it cannot go inside the iframe, so it is positioned on top. */
const FIELD =
  "rounded-xl border border-line bg-bg py-3.5 pl-11 pr-3.5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15";
const LABEL =
  "mb-1.5 block font-mono text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-muted";
const ICON = "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/70";

/* What the patient is agreeing to, as four short assurances rather than the
   numbered three-step list this replaced (John, 2026-10-01: the steps under the
   product "don't look good"). Numbered steps read as a process the patient has
   to work through and took three stacked paragraphs to do it; the large
   telehealth checkouts all use a tight grid of short claims instead, which says
   the same things in half the height.

   Still written as what happens rather than what they will get. Whether
   treatment is appropriate is the provider's call, hence "only filled if", and
   there is no refund or delivery promise because neither is something the code
   knows. */
const ASSURANCES = [
  "Reviewed by a licensed provider",
  "Charged once, no subscription",
  "Shipped discreetly to your door",
  "Only filled if a provider approves",
];

export default function StripeCheckout({
  product,
  productName,
  pid,
  quote,
  treatment,
  submitted,
  onPaid,
  /* The intake sheet already supplies the cream surface and the rounding, so a
     second bordered box inside it drew a seam down the card and stranded the
     scrollbar on the gap between the two. Standalone, in the dev harness, the
     panel is still the component's own. */
  flush = false,
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
        /* Cleared the moment the field becomes valid again, hence the ternary
           rather than a default: no error means no message, not a decline. */
        setMessage(e.error ? declineMessage(e.error) : "");
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
      /* The code pair is what identifies a decline in the Stripe dashboard and
         carries nothing about the patient, so it's worth having in the console
         when someone reports "my card didn't work". Anything that isn't a card
         problem is ours to debug and gets logged whole. */
      if (error.type === "card_error") {
        console.warn(`Stripe declined: ${error.code || "?"} / ${error.decline_code || "none"}`);
      } else if (error.type !== "validation_error") {
        console.error("Stripe confirm failed:", error);
      }
      setMessage(declineMessage(error));
      setStatus("ready");
      /* Record a decline the same way a success is recorded: from here as well
         as from the webhook, so the Payment Failed column doesn't rest on one
         subscribed event. Not awaited, because the patient already has their
         message and can be retyping a card while this runs.

         card_error only. That is the issuer saying no. A validation_error is
         just a half-filled form, and the intent is left in exactly the same
         status by both, so the server cannot tell them apart afterwards:
         sending those too would tag patients who mistyped a card number. */
      if (error.type === "card_error") void settle(intentId.current);
      return;
    }

    if (paymentIntent?.status !== "succeeded") {
      console.warn("Stripe payment ended as", paymentIntent?.status);
      setMessage("That payment didn't complete. Please try again.");
      setStatus("ready");
      void settle(paymentIntent?.id || intentId.current);
      return;
    }

    await settle(paymentIntent.id || intentId.current);
    if (!alive.current) return;
    finish();
  };

  const SHELL = flush
    ? "p-6 sm:p-8"
    : "rounded-3xl border border-primary/25 bg-surface-2/30 p-6 sm:p-8";
  /* The same panel the form uses, so a failure or a success doesn't look like
     it belongs to a different screen. m-auto because both states are short:
     in the full-height sheet they centre instead of clinging to the top. */
  const PANEL = `m-auto w-full ${SHELL}`;

  if (status === "dead") {
    return (
      <div className={`${PANEL} text-center`}>
        <img src="/logo.png" alt="NovaMDK" className="mx-auto h-12 w-auto sm:h-14" />
        <p className="mt-5 text-[0.92rem] font-semibold text-red-600">
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
      <div className={`${PANEL} text-center`}>
        <img src="/logo.png" alt="NovaMDK" className="mx-auto h-12 w-auto sm:h-14" />
        <ShieldCheck size={34} className="mx-auto mt-6 text-primary" />
        <p className="mt-3 font-journal text-[1.4rem] font-semibold">Payment received</p>
        <p className="mt-1.5 text-[0.88rem] text-muted">Taking you back to your visit…</p>
      </div>
    );
  }

  /* A breakdown earns its space only when there is something to break down.
     With no consultation fee the item price and the total are the same number,
     and printing it twice read as a mistake rather than a summary. */
  const hasFee = Number(quote?.shipping) > 0;

  /* The product page's own highlights, not copy written for the checkout. They
     are already cleared for public use and already what the patient read on the
     way here, so the last screen cannot end up claiming something different. */
  const highlights = (product?.highlights || [])
    .map((h) => h?.text)
    .filter(Boolean)
    .slice(0, 3);

  return (
    /* The panel is the component's own, not the container's, so it looks the
       same in the intake popup and in the dev harness. Two tints of the house
       cream rather than white: the tinted total has to read as deeper than the
       panel around it. */
    <form onSubmit={pay} className={`flex-1 ${SHELL}`}>
      <img src="/logo.png" alt="NovaMDK" className="mx-auto h-9 w-auto sm:h-10" />

      {/* The order, as a line in a basket rather than a hero.
          The big centred photo and headline name were the thing John called out
          (2026-10-01): hims, AgelessRx and Ready RX all put a small thumbnail,
          the name and the price on one row and give the space to the receipt and
          the card instead. The dosage form stays directly under the name because
          it is what patients check twice: a spray and an injection of the same
          drug are easy to confuse on the last screen. */}
      <div className="mt-6 flex items-center gap-3.5">
        {image ? (
          <img
            src={image}
            alt=""
            className="h-16 w-16 flex-none rounded-xl bg-surface-2 object-contain p-1"
            loading="eager"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          {/* font-journal, so the name keeps this serif whichever palette the
              Design Studio is set to. */}
          <p className="font-journal text-[1.05rem] font-semibold leading-tight sm:text-[1.15rem]">
            {name}
          </p>
          <p className="mt-0.5 text-[0.8rem] leading-snug text-muted">
            {product?.dosageForm ? `${product.dosageForm} · ` : ""}One-time payment
          </p>
        </div>
        <span className="flex-none text-[0.95rem] font-semibold">{usd(quote?.amount ?? total)}</span>
      </div>

      {highlights.length > 0 && (
        <ul className="mt-3.5 flex flex-wrap gap-1.5">
          {highlights.map((text) => (
            <li
              key={text}
              className="rounded-full border border-line bg-surface-2/70 px-2.5 py-0.5 text-[0.68rem] font-medium text-muted"
            >
              {text}
            </li>
          ))}
        </ul>
      )}

      {/* An itemised receipt, always, not only when there is a second line to
          show: a total with nothing above it reads like a number we picked.

          No shipping row. The quote's second amount is a telehealth
          consultation fee, not postage, so nothing here knows what delivery
          costs or whether it is charged at all, and a "Shipping: Included" line
          was inventing an answer. */}
      <dl className="mt-5 space-y-2 border-t border-line-strong/40 pt-4 text-[0.85rem]">
        <div className="flex justify-between gap-4">
          <dt className="min-w-0 truncate text-muted">Subtotal</dt>
          <dd className="shrink-0 font-medium">{usd(quote?.amount ?? total)}</dd>
        </div>
        {hasFee && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Telehealth consultation fee</dt>
            <dd className="shrink-0 font-medium">{usd(quote.shipping)}</dd>
          </div>
        )}
      </dl>

      {/* The one number they are agreeing to, on its own tinted line. */}
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-surface-2/80 px-4 py-3.5">
        <Receipt size={18} className="flex-none text-primary" />
        {/* min-w-0, or the label refuses to shrink and a four figure total
            pushes the amount off the edge of a 320px screen. */}
        <span className="min-w-0 flex-1 truncate text-[0.92rem] font-semibold">Total due today</span>
        <span className="flex-none font-display text-[1.4rem] font-extrabold leading-none text-primary sm:text-[1.55rem]">
          {usd(total)}
        </span>
      </div>

      {/* Stripe's iframes mount into these. Labelled rather than bare boxes:
          three unlabelled rectangles is a guessing game, and the security code
          in particular gets mistaken for a PIN. */}
      <div className={status === "boot" ? "hidden" : "mt-6 flex flex-col gap-3.5"}>
        {/* A named section, as every one of these checkouts has: it marks where
            the summary stops and the thing being filled in starts. */}
        <p className="font-journal text-[1rem] font-semibold text-ink">Payment</p>
        <div>
          <span className={LABEL}>Card number</span>
          <div className="relative">
            <CreditCard size={17} className={ICON} />
            <div ref={numberRef} className={FIELD} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <span className={LABEL}>Expiry</span>
            <div className="relative">
              <CalendarDays size={17} className={ICON} />
              <div ref={expiryRef} className={FIELD} />
            </div>
          </div>
          <div>
            <span className={LABEL}>Security code</span>
            <div className="relative">
              <Lock size={16} className={ICON} />
              <div ref={cvcRef} className={FIELD} />
            </div>
          </div>
        </div>
      </div>
      {status === "boot" && (
        <div className="flex items-center justify-center gap-2 py-10 text-[0.85rem] text-muted">
          <Loader2 size={15} className="animate-spin" />
          Loading secure payment…
        </div>
      )}

      {message && (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-[0.84rem] font-medium leading-relaxed text-red-700"
        >
          {message}
        </p>
      )}

      {/* The lock sits on the button, where it reassures at the moment of the
          click. The arrow is the only decoration: it says this goes somewhere,
          which matters when the button is also the end of the questionnaire. */}
      <button
        type="submit"
        disabled={status !== "ready"}
        className="mt-6 flex w-full items-center gap-3 rounded-2xl bg-primary px-5 py-4 text-[1rem] font-bold text-on-primary transition-opacity disabled:opacity-45"
      >
        {status === "paying" ? (
          <span className="flex flex-1 items-center justify-center gap-2">
            <Loader2 size={17} className="animate-spin" />
            Processing…
          </span>
        ) : (
          <>
            <span className="flex flex-1 items-center justify-center gap-2.5">
              <Lock size={16} />
              Pay {usd(total)}
            </span>
            <ArrowRight size={18} className="flex-none" />
          </>
        )}
      </button>

      {/* Under the button, not above it. These four are the last thing read
          before the card goes in, and on every one of the sites John named the
          reassurance sits here rather than between the price and the fields,
          where it pushed the card form down the screen. */}
      <ul className="mt-5 grid gap-x-4 gap-y-2 sm:grid-cols-2">
        {ASSURANCES.map((text) => (
          <li key={text} className="flex items-start gap-2">
            <Check size={14} className="mt-0.5 flex-none text-primary" />
            <span className="text-[0.76rem] leading-snug text-muted">{text}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-line-strong/40" />
        <ShieldCheck size={15} className="flex-none text-primary/70" />
        <span className="h-px flex-1 bg-line-strong/40" />
      </div>
      <p className="mt-2.5 text-center text-[0.73rem] leading-relaxed text-muted">
        Payments are processed by Stripe. Your card details are encrypted and never reach NovaMDK.
        A receipt goes to the email address you gave us.
      </p>
      {/* A way out that isn't the back button. A patient who stalls at the card
          field currently has nowhere to go, and abandoning here means losing a
          questionnaire they have already finished. */}
      <p className="mt-2 text-center text-[0.73rem] leading-relaxed text-muted">
        Questions before you pay? Email{" "}
        <a href="mailto:support@novamdk.com" className="font-semibold text-primary underline">
          support@novamdk.com
        </a>
      </p>
    </form>
  );
}
