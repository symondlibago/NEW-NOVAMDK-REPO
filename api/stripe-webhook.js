import { stripe, verifyWebhook } from "./_stripe.js";
import {
  ghlConfigured,
  tagContact,
  untagContact,
  markOpportunityPaid,
  markOpportunityWon,
  markOpportunityFailed,
  recordPlan,
} from "./_ghl.js";

/* Stripe's own account of what happened to a payment.
 *
 * The browser already tells us when a card clears, and that path does the same
 * work. This exists for the cases the browser can't cover: the tab closed
 * before the confirmation came back, the network dropped at exactly the wrong
 * moment, or a payment settled later than the page was willing to wait. Without
 * it a patient could be charged and their card never leave the Paid column.
 *
 * Every action here is safe to run twice, because in the ordinary case it does
 * run twice: once from the browser and once from here.
 */

/* Stripe signs the exact bytes it sent, so the body must not be parsed before
   this handler sees it. Vercel parses JSON by default, hence the opt-out. */
export const config = { api: { bodyParser: false } };

const FAILED_TAG = "payment-failed";

async function readRaw(req) {
  /* The local vite shim consumes the stream to build req.body and keeps the
     bytes on req.rawBody (see vite.config.js). On Vercel the stream is still
     unread because of the config above. */
  if (typeof req.rawBody === "string") return req.rawBody;
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody.toString("utf8");
  if (typeof req.body === "string") return req.body;
  try {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    return raw;
  } catch {
    return "";
  }
}

const clean = (v, max) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s && s.length <= max ? s : "";
};

/* The same CRM work the browser's settle call does. Split out so the two paths
   cannot drift apart. Never throws: Stripe retries a non-2xx for days, and a
   GHL hiccup is not a reason to be sent the same event again. */
/* The same CRM work the browser's settle call does, for an AUTHORISATION.
 *
 * Fires on amount_capturable_updated, which is Stripe saying the hold is in
 * place. The card moves to Paid so staff can see it, and the status stays open
 * because no money has moved yet. */
async function recordHeld(intent) {
  if (!ghlConfigured()) return;
  const meta = intent.metadata || {};
  const contactId = clean(meta.contact_id, 60);
  const orderId = clean(meta.opportunity_id, 60);

  /* Same write the browser's settle call makes, for the tab that closed before
     the confirmation came back. recordPlan resets fills_used, which is safe
     here and only here: a hold is placed before anything has shipped. */
  const planMonths = Number(meta.plan_months) || 1;

  const jobs = [];
  if (contactId) jobs.push(untagContact(contactId, [FAILED_TAG]));
  if (contactId && planMonths > 1) jobs.push(recordPlan(contactId, planMonths, meta.product_id));
  if (orderId) {
    jobs.push(markOpportunityPaid(orderId, { won: false }));
  } else {
    console.error(
      `Stripe ${intent.id} carried no opportunity id, so the card was not moved. ` +
        `The patient's card is on hold — this one needs moving by hand.`
    );
  }
  await Promise.allSettled(jobs);
}

/* Money actually received.
 *
 * Under the hold-then-capture flow this now fires at CAPTURE, when the provider
 * has approved, rather than at checkout. So it is the first and only moment the
 * practice has really been paid, which is why it is what sets "won" and what
 * revenue reporting counts. The card is left where it is: by now it has moved
 * on to Approved and dragging it back to Paid would undo that.
 *
 * Still clears the failed tag and still moves the card, because the processors
 * that charge outright (Kurv, NMI) and any payment taken before this change
 * reach succeeded without ever having been held. */
async function recordPaid(intent) {
  if (!ghlConfigured()) return;
  const meta = intent.metadata || {};
  const contactId = clean(meta.contact_id, 60);
  const orderId = clean(meta.opportunity_id, 60);
  /* A captured hold has been through recordHeld already, so its card is in the
     right place and only the status is outstanding. */
  const wasHeld = intent.capture_method === "manual";

  const jobs = [];
  if (contactId) jobs.push(untagContact(contactId, [FAILED_TAG]));
  /* Only for a payment that was never held. A captured hold already recorded
     its plan at authorisation, and recordPlan zeroes fills_used, so repeating
     it here would wipe the count if a capture ever landed after a fill. */
  if (contactId && !wasHeld && Number(meta.plan_months) > 1) {
    jobs.push(recordPlan(contactId, Number(meta.plan_months), meta.product_id));
  }
  if (orderId) {
    jobs.push(wasHeld ? markOpportunityWon(orderId) : markOpportunityPaid(orderId));
  } else {
    console.error(
      `Stripe ${intent.id} carried no opportunity id, so the Paid move was skipped. ` +
        `The charge went through — this card needs moving by hand.`
    );
  }
  await Promise.allSettled(jobs);
}

/* A hold that was released without ever being captured: it ran past its 7 days,
   or someone cancelled it. Nothing was taken and nothing can be now, so the
   patient has to pay again and this belongs with the other payment failures.
   Guarded on amount_received, because a cancel after a successful capture is
   not a lost payment. */
async function recordHoldLost(intent) {
  if (!ghlConfigured()) return;
  if ((intent.amount_received || 0) > 0) {
    console.info(`Stripe webhook: ${intent.id} canceled after capture, nothing to do`);
    return;
  }
  /* We cancelled it ourselves, so nothing went wrong with the card.
   *
   * Two of our own paths release a hold on purpose and both pass
   * cancellation_reason "abandoned": a denied case giving the patient their
   * money straight back, and checkout clearing a stale hold before placing a
   * fresh one. Neither is a payment failure. Without this check the denied
   * visit would be dragged out of the Denied column into Payment Failed and
   * GoHighLevel would email a refused patient asking them to pay again.
   *
   * Inverted on purpose: anything that is NOT our own "abandoned" is treated as
   * a lost payment, so an expiry, a reversal or a reason Stripe adds later all
   * still get chased. */
  if (intent.cancellation_reason === "abandoned") {
    console.info(`Stripe webhook: ${intent.id} released by us, not a payment failure`);
    return;
  }
  const meta = intent.metadata || {};
  const contactId = clean(meta.contact_id, 60);
  const orderId = clean(meta.opportunity_id, 60);
  const jobs = [];
  if (contactId) jobs.push(tagContact(contactId, [FAILED_TAG]));
  if (orderId) jobs.push(markOpportunityFailed(orderId));
  await Promise.allSettled(jobs);
}

async function recordFailed(intent) {
  if (!ghlConfigured()) return;
  const meta = intent.metadata || {};
  const contactId = clean(meta.contact_id, 60);
  const orderId = clean(meta.opportunity_id, 60);

  /* A failure event describes one attempt, not the payment.
   *
   * A patient whose first card is declined and whose second clears produces
   * both events on the same intent, and Stripe makes no promise about the order
   * it delivers them in. Taken at face value, a late failure would drag a card
   * that is already paid back out of the Paid column. The intent's status now,
   * rather than at the moment the event was queued, is the only thing that
   * settles it. An unreadable intent falls through to recording the failure,
   * which is what the event said and the overwhelmingly likelier case. */
  const current = await stripe(`/payment_intents/${encodeURIComponent(intent.id)}`, {
    method: "GET",
  });
  if (current.ok && current.data?.status === "succeeded") {
    console.info(
      `Stripe webhook: ${intent.id} has since succeeded, so the earlier decline is ignored`
    );
    return;
  }

  const jobs = [];
  if (contactId) jobs.push(tagContact(contactId, [FAILED_TAG]));
  if (orderId) jobs.push(markOpportunityFailed(orderId));
  await Promise.allSettled(jobs);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  /* No blocked() here: Stripe's servers have no browser origin to show, and the
     signature is a far stronger gate than an origin check. */
  const raw = await readRaw(req);
  const event = verifyWebhook(raw, req.headers?.["stripe-signature"]);
  if (!event) {
    /* 400 rather than 401: Stripe reads any non-2xx as "retry", and an event we
       cannot authenticate is one we never want again. */
    console.warn("Stripe webhook rejected: signature did not verify");
    return res.status(400).json({ error: "bad_signature" });
  }

  const intent = event.data?.object || {};
  try {
    switch (event.type) {
      case "payment_intent.amount_capturable_updated":
        console.info(
          `Stripe webhook: ${intent.id} held, ` +
            `$${((intent.amount_capturable || 0) / 100).toFixed(2)} reserved awaiting approval`
        );
        await recordHeld(intent);
        break;
      case "payment_intent.succeeded":
        console.info(`Stripe webhook: ${intent.id} succeeded, $${((intent.amount || 0) / 100).toFixed(2)}`);
        await recordPaid(intent);
        break;
      case "payment_intent.canceled":
        console.warn(
          `Stripe webhook: ${intent.id} canceled, ` +
            `$${((intent.amount_received || 0) / 100).toFixed(2)} received`
        );
        await recordHoldLost(intent);
        break;
      case "payment_intent.payment_failed":
        console.warn(
          `Stripe webhook: ${intent.id} failed — ${intent.last_payment_error?.code || "unknown"}`
        );
        await recordFailed(intent);
        break;
      case "charge.dispute.created":
        /* Logged, deliberately not acted on. A chargeback on a prescription is
           a decision for a human: refunding, cancelling the order and telling
           the pharmacy are not things to automate. */
        console.error(`Stripe webhook: DISPUTE opened on charge ${intent.charge || intent.id}`);
        break;
      default:
        /* Registered events we don't handle are acknowledged rather than
           retried for days. */
        break;
    }
  } catch (e) {
    /* Swallowed on purpose. Everything above is idempotent and repeated by the
       browser path, so a retry storm costs more than a missed side effect. */
    console.error(`Stripe webhook ${event.type} failed:`, e.message);
  }

  return res.status(200).json({ received: true });
}
