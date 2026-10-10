import React, { useEffect, useRef, useState } from "react";
import { Check, HelpCircle, Info, Loader2, Lock } from "lucide-react";
import { declineMessage, HOLD_NOTICE, PAYMENT_DUE, renewalConsent } from "./declineMessage";
import PlanTerms from "./PlanTerms";

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

/* The statuses that mean the card was accepted. requires_capture is a hold,
   which is what checkout places now; succeeded is a straight charge, and also
   what a hold becomes once captured. */
const PAID_STATUS = new Set(["succeeded", "requires_capture"]);

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
   receives our focus styles. */
const FIELD =
  "rounded-xl border border-co-line-2 bg-white px-3.5 py-3.5 transition-shadow focus-within:border-co-gold focus-within:ring-4 focus-within:ring-co-gold-hi/15";
const LABEL = "mb-1.5 block text-sm font-medium text-co-ink-2";

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
  "Only charged once a provider approves",
  "Shipped discreetly to your door",
  "Only filled if a provider approves",
];

export default function StripeCheckout({
  product,
  productName,
  pid,
  quote,
  /* The plan term, owned by the modal above because the quote is fetched there.
     Absent in the dev harness, which simply shows no chooser. */
  months,
  onMonths,
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
  const [explainDue, setExplainDue] = useState(false);
  /* The recurring billing authorisation. Unticked on every mount on purpose:
     a plan that renews on its own needs a deliberate agreement each time, and
     a box that remembers a previous answer is not one. */
  const [agreed, setAgreed] = useState(false);
  /* The open payment, and the term it is actually priced at.
   *
   * State rather than a ref because the render depends on it: while these two
   * disagree, the figure on the screen is not the figure the card would be
   * charged, and the only safe thing to do is refuse to take the payment. That
   * disagreement is exactly the shape of the bug that told every patient with a
   * successful hold that their card had failed, so it is held as an invariant
   * here rather than assumed away. */
  const [openIntent, setOpenIntent] = useState(null);
  const [priced, setPriced] = useState(null);

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

  /* The term at the moment the payment is opened, read through a ref so that
     changing it afterwards does not re-run the effect below. */
  const chosen = useRef(months);
  chosen.current = months;

  useEffect(() => {
    if (!pid) return undefined;
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
            months: chosen.current,
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
      setOpenIntent(intent.paymentIntentId);
      setPriced(intent.months ?? 1);

      const stripe = Stripe(PUBLISHABLE);
      const elements = stripe.elements();
      /* Card elements take `style`, not the Payment Element's `appearance`. */
      const style = {
        base: {
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "15px",
          color: "#1D1B18",
          "::placeholder": { color: "#AFA79A" },
        },
        invalid: { color: "#B4462F", iconColor: "#B4462F" },
      };
      const card = elements.create("cardNumber", { style, showIcon: true });
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
    /* treatment/submitted are captured for this payment and don't re-open it,
       and neither does the term: `quote` and `months` are deliberately absent.
       Re-running this unmounts Stripe's card iframes and mounts fresh ones, so
       a patient who picked 3 months after typing their card number would watch
       it empty itself. The effect below reprices the open payment instead. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  /* The patient changed the term, so the open payment is repriced in place.
   *
   * Updating the PaymentIntent rather than replacing it keeps the card fields
   * mounted and leaves no abandoned intents behind. Only an intent nobody has
   * confirmed yet can be repriced, which is the whole of the window the chooser
   * is usable in.
   *
   * On any failure `priced` is left alone, which is what disables the Pay
   * button: better to tell them to reload than to take an amount that is not
   * the one on their screen. */
  useEffect(() => {
    if (!openIntent || !months || priced === null || priced === months) return undefined;
    let cancelled = false;
    (async () => {
      const r = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "stripe_retotal",
          payment_intent_id: openIntent,
          pid,
          months,
        }),
      })
        .then((res) => res.json())
        .catch(() => null);
      if (cancelled || !alive.current) return;
      if (r?.ok) {
        setPriced(r.months);
        setMessage("");
      } else {
        console.error("Stripe retotal failed:", r?.error || r);
        setMessage("We couldn't update your plan. Please refresh the page and try again.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openIntent, months, priced, pid]);

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
    /* Belt and braces with the disabled button: the amount the patient is
       looking at has to be the amount the issuer is asked for. */
    if (priced !== null && months && priced !== months) return;
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
      /* Already paid for, not a failure.
       *
       * Confirming an intent that is already authorised or captured returns
       * payment_intent_unexpected_state with the unhelpful "A processing error
       * occurred." It is what a second press of Pay produces, so the honest
       * response is to ask the server what it holds rather than to report a
       * problem the patient does not have. */
      if (error.code === "payment_intent_unexpected_state") {
        console.warn("Stripe confirm on an intent that had already gone through; asking the server");
        const verdict = await settle(intentId.current);
        if (!alive.current) return;
        if (verdict?.ok) {
          finish();
          return;
        }
      }

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

    /* requires_capture is a SUCCESS, the same as succeeded.
 */
    if (!PAID_STATUS.has(paymentIntent?.status)) {
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

  /* Cream page, white panel, gold accents, in the checkout's own palette so it
     does not shift with the Design Studio theme. Flush inside the intake sheet,
     which already supplies the rounding; standalone in the dev harness. */
  const SHELL = flush
    ? "bg-co-page px-4 py-5 sm:px-7 sm:py-6"
    : "rounded-3xl border border-co-line bg-co-page px-4 py-5 sm:px-7 sm:py-6";
  /* The same page the form uses, so a failure or a success doesn't look like
     it belongs to a different screen. m-auto because both states are short:
     in the full-height sheet they centre instead of clinging to the top. */
  const STATE = `flex w-full flex-1 flex-col font-checkout text-co-ink ${SHELL}`;
  const CARD = "rounded-2xl border border-co-line bg-white p-6 shadow-xl shadow-co-gold/5";

  if (status === "dead") {
    return (
      <div className={STATE}>
        <img src="/logo-2026.png" alt="NovaMDK" className="h-8 w-auto self-start md:h-11" />
        <div className={`m-auto mt-8 w-full text-center ${CARD}`}>
          <p className="text-base font-semibold text-co-error">
            We couldn&rsquo;t load the secure card form.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-co-ink-2">
            Please refresh the page, or email support@novamdk.com and we&rsquo;ll take your payment
            another way.
          </p>
        </div>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className={STATE}>
        <img src="/logo-2026.png" alt="NovaMDK" className="h-8 w-auto self-start md:h-11" />
        {/* Not "Payment received": the card is held here and only charged once
            a provider approves, so that heading contradicted the line the
            patient agreed to on the screen before.

            max-w-md, because the panel it replaces is now the full width of the
            page: without it this was two short lines adrift in a white band
            1900px across. The spinner is the honest part of "taking you back",
            and the only thing on the screen that says it is still working. */}
        <div
          role="status"
          aria-live="polite"
          className={`m-auto w-full max-w-md text-center ${CARD}`}
        >
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-linear-to-b from-co-gold-hi to-co-gold-deep shadow-lg shadow-co-gold-deep/30 ring-8 ring-co-tint">
            <Check size={36} strokeWidth={3} className="text-white" />
          </span>
          <p className="mt-6 text-2xl font-semibold tracking-tight">Request submitted</p>
          <p className="mt-2.5 text-sm leading-relaxed text-co-ink-2">
            A licensed provider will review your information.
            {total
              ? ` You’ll only be charged ${usd(total)} if your treatment is approved.`
              : ""}
          </p>
          <p className="mt-6 flex items-center justify-center gap-2 border-t border-co-line pt-4 text-xs text-co-muted">
            <Loader2 size={13} className="animate-spin" />
            Taking you back to your visit…
          </p>
        </div>
      </div>
    );
  }

  /* A breakdown earns its space only when there is something to break down.
     With no consultation fee the item price and the total are the same number,
     and printing it twice read as a mistake rather than a summary. */
  const hasFee = Number(quote?.shipping) > 0;

  /* The term the patient has picked has not been priced onto the open payment
     yet, or could not be. Either way the amount on screen and the amount the
     card would be charged disagree, so nothing can be paid until they match. */
  const repricing = priced !== null && months ? priced !== months : false;
  const planMonths = Number(quote?.months) || 1;

  /* The quote's own entry for the term it was priced at, which is where the
     per-month figure and the saving come from. When a quote carries no term
     breakdown there is nothing to read, and the panel shows the one number we
     were given rather than dividing it here: no money arithmetic in the
     browser, same rule the chooser follows. */
  const quoted = (quote?.terms || []).find((t) => t.months === planMonths) || null;
  /* How the renewal reads in the authorisation: a one month plan renews at its
     own price every month, a longer one renews as a whole on its own cycle. */
  const renewalText =
    planMonths === 1 ? `${usd(total)} per month` : `${usd(total)} every ${planMonths} months`;
  const consent = renewalConsent({ charge: usd(total), renewal: renewalText });
  const payable = status === "ready" && !repricing && agreed;

  return (
    <form onSubmit={pay} className={`flex-1 font-checkout text-co-ink ${SHELL}`}>
      {/* One column on phones, two from tablet width up: the treatment and plan
          on the left, the price and card on the right. Even halves until lg,
          where the plan side takes the wider share. */}
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <img src="/logo-2026.png" alt="NovaMDK" className="h-8 w-auto md:h-11" />
          <span className="flex items-center gap-1.5 text-sm text-co-muted">
            <Lock size={14} />
            Secure checkout
          </span>
        </div>

        {/* items-start, or the panel cannot stick: a stretched grid item is as
            tall as the row, which leaves the sticky box nowhere to travel. */}
        <div className="mt-7 grid items-start gap-8 md:grid-cols-2 lg:grid-cols-5 lg:gap-12">
          {/* ---------- What they are buying ---------- */}
          <section className="min-w-0 lg:col-span-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Review your treatment request
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-co-ink-2">
              {/* A product over the plan cap has one term and no chooser, so
                  there is no plan to choose. */}
              {quote?.terms?.length > 1 ? "Choose your plan and add" : "Add"} your payment details. A
              licensed provider will review your information to determine whether treatment is
              appropriate.
            </p>

            {/* The order, as a line in a basket rather than a hero. The product's
                own picture, so it matches the page the patient came from. The
                dosage form stays directly under the name because it is what
                patients check twice: a spray and an injection of the same drug
                are easy to confuse.

                The second half of that line used to read "One-time payment" for
                a one month plan, which was the opposite of true once plans
                started renewing on their own. What it says now is the thing the
                patient cannot infer from the price. */}
            <div className="mt-8 flex items-center gap-4 rounded-2xl border border-co-line bg-white p-4">
              {/* A block box, not a grid cell: the grid's auto row grew to the
                  photo's own height, so h-full never applied and tall bottles
                  were cropped at the top and bottom. */}
              {image ? (
                <span className="block h-16 w-16 flex-none overflow-hidden rounded-xl bg-co-tint sm:h-20 sm:w-20">
                  <img
                    src={image}
                    alt=""
                    className="h-full w-full object-contain p-1.5"
                    loading="eager"
                  />
                </span>
              ) : null}
              {/* wrap-break-word, because a catalogue name is one long token
                  more often than not: "Semaglutide/Cyanocobalamin (B12)" is
                  wider than the column left beside the picture on a 390px
                  screen, and min-w-0 only lets the box shrink, it does not let
                  the word break. Without it the name runs out through the card
                  edge. */}
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold leading-tight tracking-tight wrap-break-word sm:text-lg">
                  {name}
                </p>
                <p className="mt-0.5 text-sm leading-snug text-co-muted">
                  {product?.dosageForm ? `${product.dosageForm} · ` : ""}
                  Requires provider approval
                </p>
              </div>
            </div>

            <PlanTerms
              terms={quote?.terms}
              months={months}
              onChange={onMonths}
              /* Locked once a card has been submitted: the amount is with the
                 issuer by then and the chooser would be writing a cheque it
                 cannot cash. */
              disabled={status !== "ready"}
            />

            {/* Moved out of the payment panel and into the space beside it. Same
                four lines, read before the card rather than under the button,
                and they stop the left column running out halfway down. */}
            <ul className="mt-7 grid gap-x-5 gap-y-2.5 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
              {ASSURANCES.map((text) => (
                <li key={text} className="flex items-start gap-2">
                  <Check size={15} className="mt-0.5 flex-none text-co-gold" />
                  <span className="text-sm leading-snug text-co-ink-2">{text}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* ---------- What it costs, and the card ---------- */}
          <aside className={`min-w-0 md:sticky md:top-6 lg:col-span-2 ${CARD}`}>
            <h2 className="text-lg font-semibold tracking-tight">Order summary</h2>

            {/* The headline figure is the per-month price when the quote gives
                one, because that is the number a patient compares against a
                pharmacy. The cadence line under it says what actually leaves
                the account, so the two can never be read as the same thing. */}
            <div className="mt-3.5 flex items-baseline gap-1.5">
              <strong className="text-5xl font-semibold tracking-tight">
                {usd(quoted?.perMonth ?? total)}
              </strong>
              {quoted ? <span className="text-base text-co-muted">/month</span> : null}
            </div>
            <p className="mt-1.5 text-sm text-co-muted">
              {planMonths === 1
                ? `Billed ${usd(total)} monthly after approval`
                : `Billed ${usd(total)} every ${planMonths} months after approval`}
            </p>

            {/* An itemised receipt, always, not only when there is a second line
                to show: a total with nothing above it reads like a number we
                picked.

                No saving row. The quote's amount is already the discounted
                one, so a line subtracting the saving from it would take the
                discount off twice and under-state what the card is charged.
                The saving is on the plan row instead, where it is a reason to
                pick that term rather than a step in a sum.

                No shipping row. The quote's second amount is a telehealth
                consultation fee, not postage, so nothing here knows what
                delivery costs or whether it is charged at all. */}
            <dl className="mt-5 text-sm text-co-ink-2">
              <div className="flex justify-between gap-3 py-1.5">
                <dt className="min-w-0 truncate">Selected plan</dt>
                <dd className="shrink-0">
                  {planMonths === 1 ? "1 month" : `${planMonths} months`}
                </dd>
              </div>
              <div className="flex justify-between gap-3 py-1.5">
                <dt className="min-w-0 truncate">Plan price</dt>
                <dd className="shrink-0">{usd(quote?.amount ?? total)}</dd>
              </div>
              {hasFee && (
                <div className="flex justify-between gap-3 py-1.5">
                  <dt>Telehealth consultation fee</dt>
                  <dd className="shrink-0">{usd(quote.shipping)}</dd>
                </div>
              )}
            </dl>

            {/* The one number they are agreeing to. min-w-0, or the label
                refuses to shrink and a four figure total pushes the amount off
                the edge of a 320px screen.

                "Charged after approval", not "due today": the card is held at
                this step and the money is only taken when a provider approves,
                so the old label was asking for a payment the code does not
                take. The zero under it is the honest version of the same row. */}
            <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-co-line pt-4">
              <span className="flex min-w-0 items-center gap-1.5 font-medium">
                {/* Wraps rather than truncating: on a phone the amount beside
                    it left room for "Charged after a…" and nothing more. */}
                <span className="min-w-0">Charged after approval</span>
                {/* type=button, or it submits the form it sits in and tries to pay. */}
                <button
                  type="button"
                  onClick={() => setExplainDue(true)}
                  aria-label={PAYMENT_DUE.title}
                  className="grid h-4 w-4 flex-none place-items-center rounded-full text-co-muted transition-colors hover:text-co-gold"
                >
                  <HelpCircle size={15} />
                </button>
              </span>
              <strong className="flex-none text-xl font-semibold tracking-tight lg:text-2xl">
                {usd(total)}
              </strong>
            </div>
            <div className="mt-2 flex justify-between gap-3 text-sm text-co-muted">
              <span>Due today</span>
              <span>{usd(0)}</span>
            </div>

            {/* Directly under the amount, where the question it answers gets asked. */}
            <p className="mt-3.5 flex gap-2.5 rounded-xl border border-co-tint bg-co-wash px-3.5 py-3 text-sm leading-relaxed text-co-ink-2">
              <Info size={16} className="mt-0.5 flex-none text-co-gold" />
              <span>{HOLD_NOTICE}</span>
            </p>

            <div className="my-6 h-px bg-co-line" />

            <h2 className="text-lg font-semibold tracking-tight">Payment details</h2>

            {/* Stripe's iframes mount into these. Labelled rather than bare
                boxes: three unlabelled rectangles is a guessing game, and the
                security code in particular gets mistaken for a PIN. */}
            <div className={status === "boot" ? "hidden" : "mt-3 flex flex-col gap-3"}>
              <div>
                <span className={LABEL}>Card number</span>
                <div ref={numberRef} className={FIELD} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className={LABEL}>Expiration date</span>
                  <div ref={expiryRef} className={FIELD} />
                </div>
                <div>
                  <span className={LABEL}>Security code</span>
                  <div ref={cvcRef} className={FIELD} />
                </div>
              </div>
            </div>
            {status === "boot" && (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-co-muted">
                <Loader2 size={15} className="animate-spin" />
                Loading secure payment…
              </div>
            )}

            {message && (
              <p
                role="alert"
                className="mt-3 rounded-xl border border-co-error/20 bg-co-error/5 px-3.5 py-2.5 text-sm font-medium leading-relaxed text-co-error"
              >
                {message}
              </p>
            )}

            <p className="mt-5 text-sm font-medium text-co-ink">
              You won&rsquo;t be charged unless a licensed provider approves your treatment.
            </p>

            {/* The renewal authorisation, and the gate on the button. A plan
                that charges again on its own needs an agreement to the amount
                and the interval that the patient actually made, which a line in
                the terms is not. Wording lives in declineMessage.js. */}
            <label className="mt-3.5 flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-co-ink-2">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                disabled={status !== "ready"}
                className="peer sr-only"
              />
              <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-md border-2 border-co-line-2 bg-white transition-colors peer-checked:border-co-gold peer-checked:bg-co-gold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-co-gold-hi">
                <Check
                  size={12}
                  strokeWidth={3.2}
                  className={`text-white transition-transform ${agreed ? "scale-100" : "scale-0"}`}
                />
              </span>
              <span>
                {consent.lead}{" "}
                <strong className="font-semibold text-co-ink">{consent.charge}</strong>{" "}
                {consent.mid}{" "}
                <strong className="font-semibold text-co-ink">{consent.renewal}</strong>{" "}
                {consent.tail}
              </span>
            </label>

            {/* repricing: the chosen term has not reached the open payment yet,
                so the total on screen is not what the card would be charged. */}
            <button
              type="submit"
              disabled={!payable}
              className="mt-5 flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-linear-to-b from-co-gold-hi to-co-gold-deep text-base font-semibold tracking-wide text-white shadow-lg shadow-co-gold-deep/25 transition hover:-translate-y-px hover:shadow-xl disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
            >
              {status === "paying" ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span className="opacity-80">Processing…</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Pay now
                </>
              )}
            </button>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-co-muted">
              <Lock size={13} className="flex-none" />
              Secure payment powered by Stripe
            </p>
          </aside>
        </div>

        {/* A way out that isn't the back button. A patient who stalls at the
            card field otherwise has nowhere to go, and abandoning here means
            losing a questionnaire they have already finished.

            The policies open in a new tab on purpose: this usually sits inside
            the intake sheet, and navigating away mid visit throws away answers
            the patient has already given. */}
        <div className="mt-10 flex flex-wrap justify-between gap-x-6 gap-y-3 border-t border-co-line pt-5 text-sm text-co-muted">
          <span>
            Questions before you pay?{" "}
            <a
              href="mailto:support@novamdk.com"
              className="border-b border-co-line-2 text-co-ink-2 transition-colors hover:border-co-gold hover:text-co-gold"
            >
              support@novamdk.com
            </a>
          </span>
          <span className="flex gap-5">
            {[
              ["Terms of Service", "/legal/terms-and-conditions"],
              ["Privacy Policy", "/legal/privacy-policy"],
            ].map(([text, href]) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="border-b border-co-line-2 text-co-ink-2 transition-colors hover:border-co-gold hover:text-co-gold"
              >
                {text}
              </a>
            ))}
          </span>
        </div>
      </div>

      {/* The question mark on the total opens this.
          z-130, because the intake sheet this checkout usually sits inside is
          z-120 and a dialog behind its own trigger is no dialog at all.
          data-lenis-prevent for the same reason everything else scrollable here
          carries it: Lenis swallows wheel and touch otherwise. */}
      {explainDue && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={PAYMENT_DUE.title}
          data-lenis-prevent
          onClick={() => setExplainDue(false)}
          className="fixed inset-0 z-130 flex overflow-y-auto bg-co-ink/60 p-6 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="m-auto w-full max-w-md rounded-2xl border border-co-line bg-white p-6 shadow-xl"
          >
            <p className="text-lg font-semibold tracking-tight">{PAYMENT_DUE.title}</p>
            <div className="mt-3 space-y-2.5">
              {PAYMENT_DUE.paragraphs.map((text) => (
                <p key={text} className="text-sm leading-relaxed text-co-ink-2">
                  {text}
                </p>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setExplainDue(false)}
              className="mt-5 w-full rounded-xl border border-co-line-2 bg-white px-5 py-3 text-sm font-semibold text-co-ink transition-colors hover:border-co-gold hover:text-co-gold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
