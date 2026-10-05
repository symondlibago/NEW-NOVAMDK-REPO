import { PRICES } from "./_prices.js";
import { blocked } from "./_guard.js";
import {
  ghlConfigured,
  tagContact,
  untagContact,
  markOpportunityPaid,
  markOpportunityFailed,
  updateContactFields,
  updateOpportunityFields,
  contactById,
  fieldValueOf,
  SEARCH_FIELD_ID,
  recordPlan,
  renewalFor,
  setRenewal,
  setOpportunityValue,
  INTAKE_STAGE,
  FIELD,
} from "./_ghl.js";
import {
  kurvEnabled,
  routeFor,
  createPayment,
  paymentState,
  issueTicket,
  readTicket,
  referenceFor,
  parseReference,
  addToMonth,
} from "./_kurv.js";
import { stripe, stripeEnabled, stripeMode, toCents, holdExpiresAt, findHold, customerFor, savedCard } from "./_stripe.js";
import { PLAN_TERMS, DEFAULT_MONTHS, monthsFrom, planAllowed, renewalDate, quoteFor } from "./_plans.js";
import { fillFor, isFollowOnRung, matchesFill } from "./_fills.js";
import { readSession } from "./_session.js";

/* Charges a card through the NMI gateway (PayTechTrust is an NMI white-label),
 * and on GET, quotes what that charge will be.
 *
 * The browser never sees a card number: Collect.js renders the card fields as
 * gateway-hosted iframes and hands back a single-use `payment_token`, which is
 * all that reaches this endpoint. That's what keeps NovaMDK out of PCI scope,
 * so nothing here should ever start accepting a raw `ccnumber`. */

const GATEWAY =
  process.env.NMI_GATEWAY_URL || "https://paytechtrust.transactiongateway.com/api/transact.php";
const SECURITY_KEY = process.env.NMI_SECURITY_KEY;

const FAILED_TAG = "payment-failed";

/* Shared with the GoHighLevel workflow that fires a renewal on its due date.
   Unset means renewals cannot be charged at all, which is the safe default:
   an open endpoint that charges saved cards is not something to ship by
   accident. */
const RENEW_SECRET = process.env.RENEWAL_SECRET || process.env.API_SIGNING_SECRET || null;

/* A statement line and a gateway report shouldn't name someone's medication.
 * The opportunity id travels as `orderid`, so a transaction still reconciles
 * back to the GHL card that does record the treatment. */
const DESCRIPTION = "NovaMDK telehealth treatment";

const clean = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const cents = (n) => Math.round(n * 100) / 100;
const money = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? cents(n) : null;
};

/* Flat per order. An env var rather than a catalogue field so it can change
 * without a rebuild; unset means no shipping line and nothing charged for it. */
const SHIPPING_FEE = money(process.env.SHIPPING_FEE) ?? 0;

/* Live card testing without repricing anything a patient can see.
 *
 * TEST_CHARGE_PID names the products affected, comma separated ("1,11,12"), so
 * leaving these behind by accident misprices a handful of products rather than
 * the whole catalogue. A list rather than one id so a test run can cover one
 * product per category. The quote the modal displays always uses real prices;
 * only the charge is overridden, for every processor alike. Unset
 * TEST_CHARGE_PID to turn every override off.
 *
 * Named NMI_TEST_* until 2026-10-01, which became actively misleading once
 * Stripe started taking the orders: these govern what Stripe charges too. The
 * old names still work so nothing breaks mid-test, but set the new ones.
 *
 * Stripe refuses anything under $0.50 USD, so a total below that fails at the
 * processor rather than here. */
const envAny = (...names) => {
  for (const n of names) {
    const v = process.env[n];
    if (v !== undefined && v !== "") return v;
  }
  return undefined;
};
const TEST_PIDS = new Set(
  String(envAny("TEST_CHARGE_PID", "NMI_TEST_PID") || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
);
const TEST_AMOUNT = money(envAny("TEST_CHARGE_AMOUNT", "NMI_TEST_AMOUNT"));
const TEST_SHIPPING = money(envAny("TEST_CHARGE_SHIPPING", "NMI_TEST_SHIPPING"));


/* Every term priced, so the chooser renders from the server rather than doing
   money arithmetic in the browser. The patient can only pick from this list and
   the charge is priced again from the same function, so there is no figure on
   the page that the server did not produce. */
function termsFor(pid) {
  const item = PRICES[String(pid)];
  if (!item) return [];
  const offered = planAllowed(item.amount) ? PLAN_TERMS : PLAN_TERMS.slice(0, 1);
  return offered.map((term) => {
    const q = quoteFor(pid, term.months);
    return { months: q.months, perMonth: q.perMonth, amount: q.amount, total: q.total, saving: q.saving };
  });
}

/* What the card is actually charged.
 *
 * The test override replaces the PER MONTH price and is then multiplied by the
 * term, deliberately skipping the term discount. A 3 month test therefore costs
 * $1.50 rather than $1.35, and a 1 month test stays exactly the $0.50 that has
 * already been tested live. Discounting a 50 cent price and rounding it to the
 * dollar, which is what real pricing does, would have moved the test amount
 * around and Stripe refuses anything under $0.50. */
function chargeFor(pid, months = DEFAULT_MONTHS) {
  const quote = quoteFor(pid, months);
  if (!quote) return null;
  if (!TEST_PIDS.has(String(pid))) return quote;

  const perMonth = TEST_AMOUNT > 0 ? TEST_AMOUNT : quote.perMonth;
  const amount = cents(perMonth * quote.months);
  const shipping = TEST_SHIPPING ?? quote.shipping;
  const charge = {
    months: quote.months,
    perMonth,
    amount,
    saving: 0,
    shipping,
    total: cents(amount + shipping),
  };
  console.warn(
    `TEST PRICING ACTIVE: product ${pid} x${quote.months} charged $${charge.total.toFixed(2)} ` +
      `($${perMonth.toFixed(2)} a month + $${shipping.toFixed(2)} fee) instead of $${quote.total.toFixed(2)}. ` +
      `Unset TEST_CHARGE_PID once testing is done.`
  );
  return charge;
}

/* GHL writes must never turn a successful charge into a failure the patient
 * sees: the money has already moved by the time these run. */
async function syncTag(contactId, { failed }) {
  if (!contactId || !ghlConfigured()) return;
  try {
    if (failed) await tagContact(contactId, [FAILED_TAG]);
    else await untagContact(contactId, [FAILED_TAG]);
  } catch (e) {
    console.error(`GHL ${failed ? "tag" : "untag"} ${FAILED_TAG} failed:`, e.message);
  }
}

/* A declined card, recorded in both of the places staff look: the tag on the
 * contact and the Payment Failed column on the board.
 *
 * The tag alone was all this did for Kurv and NMI, which meant a declined
 * payment left the card sitting in Intake Submitted looking like a patient who
 * simply hadn't paid yet. Every processor routes its failures through here so
 * the three cannot drift apart.
 *
 * Both halves swallow their own errors, so this never costs the patient the
 * decline message the modal is waiting to show. */
async function markFailed(contactId, opportunityId) {
  if (!ghlConfigured()) return;
  await Promise.allSettled([
    syncTag(contactId, { failed: true }),
    opportunityId ? markOpportunityFailed(opportunityId) : null,
  ]);
}

/* Moving the card to Paid belongs here, not in the browser.
 *
 * It used to be a follow-up call the intake page made after the charge cleared,
 * reading the opportunity id out of sessionStorage. Anything that emptied that
 * storage — a link opened in a fresh tab, private browsing, a cleared session —
 * meant the patient paid successfully while GHL never heard about it. Money
 * taken, no card moved, no conversion counted, and nothing in the CRM to show
 * a paying patient was waiting. The server already knows the charge cleared, so
 * the server owns the write. */
async function markPaid(opportunityId, transactionId, { won = true } = {}) {
  if (!ghlConfigured()) return;
  if (!opportunityId) {
    console.error(
      `Sale ${transactionId} carried no opportunity id, so the Paid move was skipped. ` +
        `The charge went through — this card needs moving by hand.`
    );
    return;
  }
  try {
    await markOpportunityPaid(opportunityId, { won });
  } catch (e) {
    console.error(`GHL Paid move failed for opportunity ${opportunityId}:`, e.message, e.details ?? "");
  }
}

/* The other half of ghl-encounter's rule that "complete" means submitted and
 * paid. When the questionnaire was submitted before the checkout opened, this
 * approval is the second half to arrive, so the stage is written here. */
async function markComplete(contactId, opportunityId, treatment) {
  if (!ghlConfigured()) return;
  const fields = { [FIELD.INTAKE_STAGE]: INTAKE_STAGE.COMPLETE };
  const writes = await Promise.allSettled([
    contactId ? updateContactFields(contactId, fields) : null,
    opportunityId ? updateOpportunityFields(opportunityId, fields, { name: treatment }) : null,
  ]);
  for (const w of writes) {
    if (w.status === "rejected") console.error("GHL intake_stage complete write failed:", w.reason?.message);
  }
}

/* ----------------------------------- Kurv ---------------------------------- */

/* Kurv is the primary processor and PayTechTrust the backup; which one takes a
   given order is decided in _kurv.js. These three routes live on this function,
   not their own, to stay under the Hobby plan's function limit.

   A Kurv payment is identified by its reference throughout (see _kurv.js):
   POS links carry no transaction id until someone pays. */

/* The site the patient is actually on, for Kurv's return page and notification.
   Read off the request (already checked against the allowed hosts by blocked())
   so a preview deployment returns to itself rather than to production. */
function siteOrigin(req) {
  const raw = req.headers?.origin || req.headers?.referer;
  try {
    return new URL(raw).origin;
  } catch {
    return "https://www.novamdk.com";
  }
}

/* Per instance: stops the confirm poll and Kurv's own notification, which
   usually both arrive, from double counting a sale toward the monthly cap. The
   GHL writes are safe to repeat; the running total is what this protects. */
const settledKurv = new Set();

async function settleKurvSale({ reference, amount, contactId, opportunityId, submitted, treatment, via }) {
  const first = !settledKurv.has(reference);
  if (first) {
    settledKurv.add(reference);
    addToMonth(amount);
    console.info(`Kurv sale approved (${via}): ref ${reference}, $${Number(amount).toFixed(2)}`);
  }
  await Promise.allSettled([
    first ? syncTag(contactId, { failed: false }) : null,
    (first ? markPaid(opportunityId, reference) : Promise.resolve()).then(() =>
      /* Only the confirm path knows whether the questionnaire was submitted, so
         it runs this even when the notification got there first. */
      submitted === true ? markComplete(contactId, opportunityId, treatment) : null
    ),
  ]);
}

/* Opens a Kurv payment for this order and returns the page to show. */
/* Which processor takes this order.
 *
 * Stripe is primary from 2026-10-01. Kurv and PayTechTrust stay wired as the
 * fallback rather than being deleted, because Stripe restricts compounded
 * prescription medications and an account review would otherwise take checkout
 * down with it. Keeping the decision here rather than in _kurv.js leaves that
 * module knowing only about its own cap.
 */
async function processorFor(amount) {
  if (stripeEnabled()) return "stripe";
  return routeFor(amount);
}

/* Opens a Stripe payment for the amount WE price, not the amount asked for.
 *
 * Same rule as the NMI path below: the id is priced server side and the
 * request's own figures are ignored, or anyone could pay $1 for a $1,350
 * treatment. Returns only the client secret, which can confirm this one payment
 * and nothing else.
 */
async function stripeIntent(req, res) {
  if (blocked(req, res, { max: 8 })) return;
  if (!stripeEnabled()) {
    return res.status(503).json({ ok: false, error: "not_configured" });
  }

  const { pid, contact_id, opportunity_id, treatment, submitted } = req.body || {};
  const months = monthsFrom(req.body?.months);
  /* A prepaid month of a plan is settled through prepaid_fill, never charged.
     Refused here as well as at the quote so no card can ever be taken for one,
     whatever the browser asks for. */
  if (isFollowOnRung(pid)) {
    console.warn(`Refused a Stripe intent for plan-only product ${pid}`);
    return res.status(403).json({ ok: false, error: "plan_only" });
  }
  const charge = chargeFor(pid, months);
  if (!charge) {
    console.error(`Refused Stripe intent for unpriced product id "${pid}"`);
    return res.status(400).json({ ok: false, error: "unknown_product" });
  }

  const orderId = clean(opportunity_id, 60);

  /* Who gets the receipt. Stripe emails it itself once `receipt_email` is set,
     so nothing has to be asked for on the form, which the brief wanted kept to
     the card alone.
   *
     The browser's value is preferred because it needs no extra call, but it is
     only a hint and is re-checked here. A portal-resumed intake arrives in a
     fresh tab with nothing stashed, so the GHL contact is the fallback. Note
     Stripe only sends receipts with live keys: in test mode the field is
     recorded and no email goes out. */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const hinted = clean(req.body?.receipt_email, 120);
  let receiptEmail = hinted && EMAIL_RE.test(hinted) ? hinted : null;
  const contactId = clean(contact_id, 60);
  let contact = null;
  if (contactId && ghlConfigured()) contact = await contactById(contactId);
  if (!receiptEmail && contact) {
    const found = clean(contact.email, 120);
    if (found && EMAIL_RE.test(found)) receiptEmail = found;
  }

  /* A plan renews, so its card has to outlive this one payment.
   *
   * The card is attached to a Stripe customer and the intent is created with
   * setup_future_usage, which is what lets a renewal be charged later without
   * the patient present.
   *
   * The consent for this is the checkout copy, which says the plan renews
   * automatically and can be cancelled in the portal. Those two have to ship
   * together: saving a card without saying so is not on. */
  /* Every term, not just the multi-month ones. A single month renews monthly
     under the client's spec, so its card has to be kept too. */
  let customerId = null;
  {
    customerId = await customerFor({
      customerId: contact ? fieldValueOf(contact, SEARCH_FIELD_ID.STRIPE_CUSTOMER) : "",
      email: receiptEmail,
      contactId,
    });
    /* Worth recording even when the rest of this call fails: a customer with no
       id written down is one we would make again next time. */
    if (customerId && contactId) {
      updateContactFields(contactId, { [FIELD.STRIPE_CUSTOMER]: customerId }).catch((e) =>
        console.error(`GHL stripe_customer write failed for ${contactId}:`, e.message)
      );
    }
  }

  /* Release any hold already standing for this order before placing another.
   *
   * Every checkout that reaches the card form creates its own PaymentIntent,
   * and every one that authorises reserves its own money. A patient who opens
   * the checkout twice, or who reloads after a decline, therefore ends up with
   * two live holds against the same visit, and on a debit card each one is
   * taken out of their available balance straight away. Two reservations for
   * one $0.50 visit is what this looked like in testing on 2026-10-02.
   *
   * Only one of them could ever be captured, so the other is pure harm: the
   * patient's money sits locked up for up to 7 days for nothing. Cancelling
   * the old one costs nothing, because a hold is not money we have. */
  if (orderId) {
    const stale = await findHold(orderId);
    if (stale) {
      const released = await stripe(`/payment_intents/${stale.id}/cancel`, {
        method: "POST",
        body: { cancellation_reason: "abandoned" },
      });
      console.info(
        released.ok
          ? `Released the previous hold ${stale.id} on opportunity ${orderId} before placing a new one`
          : `Could not release the previous hold ${stale.id}: ${released.data?.error?.message || released.status}`
      );
    }
  }

  const created = await stripe("/payment_intents", {
    body: {
      amount: toCents(charge.total),
      currency: "usd",
      description: DESCRIPTION,
      receipt_email: receiptEmail || undefined,
      /* A plan's card is kept so renewals can be charged off-session. Both
         lines or neither: setup_future_usage without a customer saves nothing
         that can be charged again. */
      ...(customerId ? { customer: customerId, setup_future_usage: "off_session" } : {}),
      /* Hold now, take the money when a provider approves (client decision,
       * 2026-10-02). Nothing is charged at checkout: the issuer reserves the
       * amount and we capture it from the case_approved webhook.
       *
       * Two things this buys. A declined visit costs the patient nothing, so
       * there is no refund to process and no card fee to eat, and a card with
       * no funds is refused here at the hold rather than after a provider has
       * spent time on the case. Verified against Stripe: insufficient_funds,
       * expired_card and generic declines all fail at authorisation.
       *
       * The cost is a deadline. An online card hold is valid 7 days, after
       * which the funds are released and the intent is canceled, so review has
       * to happen inside that. Stripe reports the exact moment on the charge as
       * payment_method_details.card.capture_before. */
      capture_method: "manual",
      /* Card only, deliberately, rather than automatic_payment_methods.
       *
       * Letting Stripe offer everything it could put Bank (ACH), Cash App Pay
       * and Amazon Pay on the panel. Two of those redirect to another page,
       * which is the second screen this checkout exists to remove, and ACH
       * settles over days and can fail afterwards, so a prescription would be
       * on its way to the pharmacy before the money cleared. Restricting the
       * types here also keeps Stripe Link's "save my information" block off the
       * form, which was asking for the phone number and full name the brief
       * said to drop.
       *
       * Apple Pay and Google Pay are the ones worth adding later: they are one
       * tap and never leave the page. They need the domain registered with
       * Stripe first. */
      payment_method_types: ["card"],
      /* Our own ids, so a payment in the dashboard can be traced back to the
         card on the board. Deliberately no treatment name, no patient name and
         no clinical detail: a processor is not a place for any of that. */
      metadata: {
        product_id: String(pid),
        opportunity_id: orderId || "",
        contact_id: contactId || "",
        /* The term, so the entitlement can be rebuilt from Stripe alone.
           The counters live on the GHL contact where staff can hand-edit them,
           so the payment stays the immutable record of how many fills were
           actually bought. */
        plan_months: String(charge.months),
      },
    },
    /* Deliberately NO idempotency key.
     *
     * The instinct is to add one so a double-clicked Pay button can't charge
     * twice, but creating an intent charges nobody: only confirming one does,
     * and the browser holds a single client secret, so a duplicate intent just
     * expires unconfirmed. Meanwhile Stripe rejects a reused key whose request
     * body differs at all, and `contact_id` here comes from sessionStorage and
     * can resolve a moment late. That turned an ordinary retry into a 400 and
     * sent the patient a gateway error. Protection against paying twice belongs
     * at settlement, where markPaid() already refuses to bill an order twice. */
  });

  if (!created.ok || !created.data?.client_secret) {
    console.error("Stripe intent rejected:", created.status, created.data?.error?.message || "");
    return res.status(502).json({ ok: false, error: "gateway_unreachable" });
  }

  console.info(
    `Stripe intent ${created.data.id} (${stripeMode()}): product ${pid} x${charge.months}, ` +
      `$${charge.total.toFixed(2)} incl. $${charge.shipping.toFixed(2)} fee`
  );
  return res.status(200).json({
    ok: true,
    processor: "stripe",
    clientSecret: created.data.client_secret,
    paymentIntentId: created.data.id,
    amount: charge.total,
    shipping: charge.shipping,
    months: charge.months,
    submitted: submitted === true,
    treatment: clean(treatment, 120) || null,
  });
}

/* Reprices an open payment when the patient changes their plan term.
 *
 * The alternative was to throw the PaymentIntent away and create another, which
 * is what changing the term would otherwise do, since the intent is created
 * when the card form mounts. That tears the Stripe card fields down and
 * remounts them, so anything already typed is wiped, and it leaves an abandoned
 * intent behind for every click of the chooser.
 *
 * Only an intent that has not been confirmed can be repriced, which is exactly
 * the window this is for: once a card is submitted the amount is what the
 * issuer authorised and Stripe refuses to move it. Priced from `pid` and
 * `months` here, never from a figure in the request, same rule as creation. */
async function stripeRetotal(req, res) {
  if (blocked(req, res, { max: 20 })) return;
  if (!stripeEnabled()) return res.status(503).json({ ok: false, error: "not_configured" });

  const id = clean(req.body?.payment_intent_id, 80);
  const { pid } = req.body || {};
  const months = monthsFrom(req.body?.months);
  const charge = chargeFor(pid, months);
  if (!id) return res.status(400).json({ ok: false, error: "missing_payment_intent" });
  if (!charge) return res.status(400).json({ ok: false, error: "unknown_product" });

  const found = await stripe(`/payment_intents/${encodeURIComponent(id)}`, { method: "GET" });
  const intent = found.data;
  if (!found.ok || !intent?.id) {
    console.error("Stripe intent unreadable for retotal:", found.status);
    return res.status(502).json({ ok: false, error: "gateway_unreachable" });
  }
  /* Anything further along than this has money attached to it. The browser
     falls back to opening a fresh payment, which is correct rather than a
     failure: a confirmed intent belongs to the amount it authorised. */
  if (intent.status !== "requires_payment_method" && intent.status !== "requires_confirmation") {
    console.info(`Stripe intent ${id} is ${intent.status}, too late to reprice`);
    return res.status(200).json({ ok: false, error: "already_confirmed" });
  }

  const updated = await stripe(`/payment_intents/${encodeURIComponent(id)}`, {
    method: "POST",
    body: {
      amount: toCents(charge.total),
      /* Rewritten, not merged: Stripe replaces the whole metadata object, and
         the entitlement is read back off plan_months after the payment. */
      metadata: { ...(intent.metadata || {}), plan_months: String(charge.months) },
    },
  });
  if (!updated.ok) {
    console.error("Stripe retotal rejected:", updated.status, updated.data?.error?.message || "");
    return res.status(502).json({ ok: false, error: "gateway_unreachable" });
  }

  console.info(`Stripe intent ${id} repriced to ${charge.months} month(s), $${charge.total.toFixed(2)}`);
  return res.status(200).json({
    ok: true,
    amount: charge.total,
    shipping: charge.shipping,
    months: charge.months,
  });
}

/* Confirms what Stripe says about a payment, then runs the same CRM side
   effects the NMI path does. Called by the browser the moment the Payment
   Element reports success; the webhook repeats it later for the cases where the
   patient closes the tab first, and both are safe to run twice. */
async function stripeSettle(req, res) {
  if (blocked(req, res, { max: 12 })) return;
  if (!stripeEnabled()) return res.status(503).json({ ok: false, error: "not_configured" });

  const id = clean(req.body?.payment_intent_id, 80);
  if (!id) return res.status(400).json({ ok: false, error: "missing_payment_intent" });

  /* Read the payment back from Stripe rather than believing the browser: a
     client that says "paid" is not evidence of a payment. */
  /* latest_charge expanded so holdExpiresAt can report the capture deadline:
     on the current API version the intent carries only the charge's id. */
  const found = await stripe(
    `/payment_intents/${encodeURIComponent(id)}?expand[]=latest_charge`,
    { method: "GET" }
  );
  const intent = found.data;
  if (!found.ok || !intent?.id) {
    console.error("Stripe intent unreadable:", found.status, intent?.error?.message || "");
    return res.status(502).json({ ok: false, error: "gateway_unreachable" });
  }

  const meta = intent.metadata || {};
  const contactId = clean(meta.contact_id, 60);
  const orderId = clean(meta.opportunity_id, 60);

  /* `requires_capture` is a SUCCESS here, not a decline.
   *
   * Since the switch to holding the card, a confirmed payment lands on
   * requires_capture rather than succeeded: the issuer has reserved the money
   * and we take it when a provider approves. This check used to be
   * `!== "succeeded"`, which would have read every single successful hold as a
   * declined card, tagged the patient, moved their card to Payment Failed and
   * told them to try another card while their money sat reserved. The one line
   * that absolutely had to change with the flow.
   *
   * succeeded is still accepted, both for the orders captured before this
   * changed and for the moment the capture itself lands. */
  const authorized = intent.status === "requires_capture";
  if (intent.status !== "succeeded" && !authorized) {
    console.warn(`Stripe payment ${intent.id} is ${intent.status}, not settling`);
    await markFailed(contactId, orderId);
    return res.status(200).json({ ok: false, declined: true, error: "declined", message: "" });
  }

  if (authorized) {
    const dies = holdExpiresAt(intent);
    console.info(
      `Stripe hold ${intent.id} placed: $${(intent.amount / 100).toFixed(2)}` +
        (dies ? `, capture by ${dies.toISOString()}` : "")
    );
  }

  /* The term, read off the payment rather than the request: the browser's copy
     is a label by the time we get here, and the intent is what the issuer
     authorised. Absent on every payment taken before plans existed, which reads
     as a single month, exactly right. */
  const planMonths = Number(meta.plan_months) || 1;

  await Promise.allSettled([
    syncTag(contactId, { failed: false }),
    /* Authorised, not paid: the card moves to Paid so staff see it, but the
       status stays open until the capture clears. */
    markPaid(orderId, intent.id, { won: !authorized }).then(() =>
      req.body?.submitted === true
        ? markComplete(contactId, orderId, clean(req.body?.treatment, 120))
        : null
    ),
    /* Recorded at authorisation, not at capture. Staff need to see that this
       patient holds a 3 month plan while the visit is still with a provider,
       and the fills themselves are only counted once the pharmacy ships. */
    /* >= 1, not > 1. A single month purchase is a subscription too once
       renewals exist, so it needs its term and product recorded. planFor still
       ignores it, so the prepaid-fills machinery is untouched. */
    planMonths >= 1 && contactId ? recordPlan(contactId, planMonths, meta.product_id) : null,
    /* The card was opened with a single month's price, before the patient had
       chosen a term. Put the real total on it now, or a 3 month plan reports
       as a third of itself for ever. */
    planMonths > 1 && orderId
      ? setOpportunityValue(orderId, quoteFor(meta.product_id, planMonths)?.total)
      : null,
  ]);
  console.info(
    `Stripe payment ${intent.id} ${authorized ? "authorised" : "settled"}: ` +
      `$${(intent.amount / 100).toFixed(2)}`
  );
  /* `ok` either way: the patient's part is done. They do not need to know
     whether the money has moved or is merely reserved, only that the card was
     accepted and their visit is on its way to a provider. */
  return res.status(200).json({
    ok: true,
    transactionId: intent.id,
    amount: intent.amount / 100,
    held: authorized,
  });
}

/* Lets a month the patient already paid for through the checkout, with no card.
 *
 * Stands in for stripeSettle on months 2 and 3 of a plan: the same CRM work,
 * minus everything to do with money, because the money was taken at month 1.
 * The entitlement is re-established here from the portal session rather than
 * carried from the portal in a token, so there is nothing in the request that
 * granting this depends on.
 *
 * The card moves to Paid and the status is deliberately LEFT OPEN. Only
 * status "won" feeds GoHighLevel's revenue and conversion reporting, and a
 * three month plan creates three cards: marking each of them won would report
 * one payment three times. The plan's money is counted once, on the card that
 * actually took it. */
async function prepaidFill(req, res) {
  if (blocked(req, res, { max: 12 })) return;

  const { pid } = req.body || {};
  const fill = await fillFor(readSession(req));
  if (!fill || !matchesFill(fill, pid)) {
    console.warn(`Refused a prepaid fill for product ${pid}: no matching plan`);
    return res.status(403).json({ ok: false, error: "plan_only" });
  }
  if (!fill.canSettle) {
    /* Either the plan is finished, or this is someone walking into a plan-only
       product that was never handed to them. Both are a real answer, not a
       failure. */
    console.warn(
      `Refused a prepaid fill for ${pid}: ${fill.plan.claimed} of ${fill.plan.months} claimed, ` +
        `${fill.plan.used} shipped`
    );
    return res.status(403).json({ ok: false, error: "no_fills_left" });
  }

  const orderId = clean(req.body?.opportunity_id, 60);
  const contactId = clean(req.body?.contact_id, 60);

  await Promise.allSettled([
    syncTag(contactId, { failed: false }),
    markPaid(orderId, `plan:${fill.plan.current}/${fill.plan.months}`, { won: false }).then(() =>
      req.body?.submitted === true
        ? markComplete(contactId, orderId, clean(req.body?.treatment, 120))
        : null
    ),
  ]);
  console.info(
    `Prepaid fill accepted: month ${fill.plan.current} of ${fill.plan.months} ` +
      `on opportunity ${orderId || "-"}, nothing charged`
  );
  return res.status(200).json({ ok: true, prepaid: true, month: fill.plan.current });
}

/* Charges a plan renewal, off-session, on the day it falls due.
 *
 * Driven by a GoHighLevel workflow on the Renews On date rather than a cron,
 * because this project is at the Vercel Hobby function cap and GHL already
 * runs date-triggered automations for the check-in reminder. The workflow's
 * webhook action posts here with the contact id and a shared secret.
 *
 * DELIBERATELY NOT A STRIPE SUBSCRIPTION. A subscription charges on its own
 * schedule and asks nobody, and the client's rule (2026-10-05) is that a
 * renewal must not charge while a prescription is inactive, a provider review
 * is outstanding, the patient has cancelled, or the account is on hold.
 * Running the charge here is what makes those four checkable at all.
 *
 * Answers 200 for every refusal that is a real answer rather than a fault:
 * GHL retries a non-2xx, and "this patient cancelled" is not worth retrying. */
async function renewPlan(req, res) {
  if (!stripeEnabled()) return res.status(503).json({ ok: false, error: "not_configured" });
  /* The only gate on this route. GHL's servers have no browser origin, so
     blocked() cannot help, and a request that could charge a saved card must
     not be callable by anyone who knows a contact id. */
  if (!RENEW_SECRET || clean(req.body?.secret, 200) !== RENEW_SECRET) {
    console.warn("Rejected a renewal: missing or wrong secret");
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  const contactId = clean(req.body?.contact_id, 60);
  if (!contactId) return res.status(400).json({ ok: false, error: "missing_contact" });

  const r = await renewalFor(contactId);
  if (!r) {
    console.info(`Renewal skipped for ${contactId}: no plan recorded`);
    return res.status(200).json({ ok: false, skipped: "no_plan" });
  }

  /* The client's four conditions, in the order they are cheapest to check. */
  if (!r.on) {
    console.info(`Renewal skipped for ${contactId}: the patient turned it off`);
    return res.status(200).json({ ok: false, skipped: "cancelled" });
  }
  if (!r.customerId) {
    console.error(`Renewal skipped for ${contactId}: no saved card`);
    return res.status(200).json({ ok: false, skipped: "no_card" });
  }
  /* A month already handed out but not yet shipped means something is still
     with a provider or the pharmacy. Charging for the next term on top of one
     that has not arrived is exactly what "do not charge until cleared" is
     there to stop. */
  if (r.claimed > r.used) {
    console.info(
      `Renewal held for ${contactId}: ${r.claimed} claimed, ${r.used} shipped, still in flight`
    );
    return res.status(200).json({ ok: false, skipped: "in_flight" });
  }

  const charge = chargeFor(r.productId, r.months);
  if (!charge) {
    console.error(`Renewal skipped for ${contactId}: product ${r.productId} has no price`);
    return res.status(200).json({ ok: false, skipped: "unpriced" });
  }

  /* Named explicitly. A customer's default_payment_method is only consulted
     when Stripe raises an invoice; a PaymentIntent confirmed off-session with
     no payment_method is simply refused. */
  const card = await savedCard(r.customerId);
  if (!card?.id) {
    console.error(`Renewal skipped for ${contactId}: customer ${r.customerId} has no card on file`);
    return res.status(200).json({ ok: false, skipped: "no_card" });
  }

  /* Off-session and confirmed in one call: nobody is at the keyboard. Charged
     outright rather than held, because there is no visit to approve yet; the
     term they are buying is reviewed month by month as they check in. */
  const paid = await stripe("/payment_intents", {
    body: {
      amount: toCents(charge.total),
      currency: "usd",
      customer: r.customerId,
      payment_method: card.id,
      description: `${DESCRIPTION} (plan renewal)`,
      confirm: true,
      off_session: true,
      payment_method_types: ["card"],
      metadata: {
        product_id: String(r.productId),
        contact_id: contactId,
        plan_months: String(r.months),
        renewal: "1",
      },
    },
    /* The date fires once, but a GHL workflow that retries must not charge
       twice for the same day. */
    idempotencyKey: `renew_${contactId}_${r.renewsOn || "x"}`,
  });

  if (!paid.ok || paid.data?.status !== "succeeded") {
    const why =
      paid.data?.error?.code ||
      paid.data?.error?.message ||
      paid.data?.status ||
      `HTTP ${paid.status}`;
    console.error(`Renewal charge FAILED for ${contactId}: ${why}`);
    await markFailed(contactId, null);
    /* Renewal stays ON. A card that failed today may work tomorrow, and
       switching it off would quietly end a subscription the patient never
       cancelled. The failed tag is what brings a human to it. */
    return res.status(200).json({ ok: false, error: "charge_failed", reason: why });
  }

  /* A new term starts: the counts go back to the beginning and the next
     renewal is set from today. recordPlan resets claimed and used, which is
     exactly right for a fresh term. */
  await recordPlan(contactId, r.months, r.productId);
  await setRenewal(contactId, { on: true, renewsOn: renewalDate(new Date(), r.months) });
  console.info(
    `Renewal charged for ${contactId}: $${charge.total.toFixed(2)}, ` +
      `${r.months} month(s) on product ${r.productId}`
  );
  return res.status(200).json({ ok: true, amount: charge.total, months: r.months });
}

async function kurvStart(req, res) {
  if (blocked(req, res, { max: 8 })) return;
  const { pid, contact_id, opportunity_id, submitted, treatment } = req.body || {};

  // Priced here, never from the request, exactly as the card path does.
  if (isFollowOnRung(pid)) return res.status(403).json({ ok: false, error: "plan_only" });
  const charge = chargeFor(pid, monthsFrom(req.body?.months));
  if (!charge) return res.status(400).json({ ok: false, error: "unknown_product" });

  /* Re-checked rather than trusting the quote the modal loaded: the cap may
     have been reached in between. A "no" sends the modal to the card form. */
  if ((await routeFor(charge.total)) !== "kurv") {
    return res.status(200).json({ ok: false, processor: "nmi" });
  }

  const contactId = clean(contact_id, 60);
  const opportunityId = clean(opportunity_id, 60);
  const origin = siteOrigin(req);

  const created = await createPayment({
    amount: charge.total,
    reference: referenceFor(opportunityId, contactId),
    returnPage: `${origin}/kurv-return.html`,
  }).catch((e) => {
    console.error("Kurv payment link failed:", e.message);
    return { ok: false };
  });

  // Kurv down or refusing: the backup takes the order instead of the patient
  // being stuck at the last step.
  if (!created.ok) return res.status(200).json({ ok: false, processor: "nmi", error: "kurv_unavailable" });

  console.info(`Kurv payment ${created.reference} opened: product ${pid}, $${charge.total.toFixed(2)}`);
  return res.status(200).json({
    ok: true,
    processor: "kurv",
    url: created.url,
    ticket: issueTicket({
      ref: created.reference,
      amt: charge.total,
      o: opportunityId,
      c: contactId,
      sub: submitted === true,
      tr: clean(treatment, 120),
    }),
  });
}

/* Asked by the modal once Kurv's page says it's done, and polled while it's
   open. Answers from Kurv's API, never from the browser's say-so. */
async function kurvConfirm(req, res) {
  if (blocked(req, res, { max: 40 })) return;
  const t = readTicket(req.body?.ticket);
  if (!t) return res.status(400).json({ ok: false, error: "bad_ticket" });

  const s = await paymentState(t.ref).catch(() => ({ state: "unknown" }));
  if (s.state === "paid") {
    if (Math.abs(s.amount - t.amt) > 0.005) {
      console.error(`Kurv ref ${t.ref} paid $${s.amount} against an order of $${t.amt}; not marking Paid.`);
      return res.status(200).json({ ok: false, error: "amount_mismatch" });
    }
    await settleKurvSale({
      reference: t.ref,
      amount: t.amt,
      contactId: t.c,
      opportunityId: t.o,
      submitted: t.sub,
      treatment: t.tr,
      via: "checkout",
    });
    return res.status(200).json({ ok: true, reference: t.ref, amount: t.amt });
  }
  return res.status(200).json({ ok: false, pending: s.state !== "failed", failed: s.state === "failed" });
}

/* Kurv posts `response`, a JSON string, as a form field. Accepted in whatever
   shape the body parser left it. */
function readKurvNotice(body) {
  try {
    let v = body;
    if (typeof v === "string") v = Object.fromEntries(new URLSearchParams(v));
    v = v?.response ?? v;
    return typeof v === "string" ? JSON.parse(v) : v || null;
  } catch {
    return null;
  }
}

/* Kurv's server-to-server notice that a payment attempt finished. It isn't
   signed, so nothing in it is believed: it only names a payment, which is then
   looked up with our own key. What it buys is the Paid move for a patient who
   closes the tab the moment they've paid. Always a 200, so Kurv never retries
   over something that was ours to sort out. */
async function kurvNotice(req, res) {
  if (!kurvEnabled()) return res.status(200).json({ ok: true });
  const notice = readKurvNotice(req.body);
  const reference = String(notice?.reference_number || notice?.reference || "");
  // paymentState refuses anything not shaped like a reference we issued.
  const s = await paymentState(reference).catch(() => ({ state: "unknown" }));
  const { opportunityId, contactId } = parseReference(reference);

  if (s.state === "paid") {
    await settleKurvSale({ reference, amount: s.amount, contactId, opportunityId, via: "notice" });
  } else if (s.state === "failed") {
    console.warn(`Kurv payment attempt declined: ref ${reference}`);
    await markFailed(contactId, opportunityId);
  }
  return res.status(200).json({ ok: true });
}

const queryParam = (req, name) =>
  req.query?.[name] ?? new URL(req.url || "/", "http://localhost").searchParams.get(name);

export default async function handler(req, res) {
  /* The modal's order summary is rendered from this rather than from the
     catalogue in the bundle, so the shipping line it shows is always the one
     POST will charge. Answered on the same function to stay clear of the Hobby
     plan's function limit. */
  if (req.method === "GET") {
    if (blocked(req, res)) return;
    // Vercel fills req.query; the local vite shim (vite.config.js) only passes
    // the raw URL, which left every local checkout reading "Total unavailable".
    const pid = queryParam(req, "pid");
    const months = monthsFrom(queryParam(req, "months"));

    /* A later rung of a plan has no price, because it is never for sale.
     *
     * These products are hidden from the shop, but hidden only means unlinked:
     * the id still reaches here, and without this a $169 maintenance vial could
     * be bought by anyone who typed the number. The only way through is a plan
     * that has already been paid for, which is established from the portal
     * session cookie rather than from anything in the request. */
    if (isFollowOnRung(pid)) {
      const fill = await fillFor(readSession(req));
      if (!fill || !fill.canSettle || !matchesFill(fill, pid)) {
        console.warn(`Refused a quote for plan-only product ${pid}`);
        return res.status(403).json({ ok: false, error: "plan_only" });
      }
      return res.status(200).json({
        ok: true,
        prepaid: true,
        processor: "prepaid",
        months: 1,
        perMonth: 0,
        amount: 0,
        saving: 0,
        shipping: 0,
        total: 0,
        /* No chooser on a month that is already paid for. */
        terms: [],
        month: fill.plan.current,
        planMonths: fill.plan.months,
      });
    }

    const quote = quoteFor(pid, months);
    if (!quote) return res.status(400).json({ ok: false, error: "unknown_product" });
    /* Which form the modal should show. Advisory only: the payment call decides
       again at the moment of payment, since the cap can be reached in between. */
    const processor = await processorFor(quote.total);
    return res.status(200).json({ ok: true, ...quote, terms: termsFor(pid), processor });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Ahead of blocked(): Kurv's servers have no browser origin to show.
  if (queryParam(req, "renew") === "1") return renewPlan(req, res);
  if (queryParam(req, "kurv") === "notify") return kurvNotice(req, res);
  if (req.body?.action === "kurv_start") return kurvStart(req, res);
  if (req.body?.action === "kurv_confirm") return kurvConfirm(req, res);
  if (req.body?.action === "stripe_intent") return stripeIntent(req, res);
  if (req.body?.action === "stripe_retotal") return stripeRetotal(req, res);
  if (req.body?.action === "stripe_settle") return stripeSettle(req, res);
  if (req.body?.action === "prepaid_fill") return prepaidFill(req, res);

  // Tighter than the default: a checkout is not a page view, and card testing
  // is exactly what a loose limit invites.
  if (blocked(req, res, { max: 8 })) return;

  if (!SECURITY_KEY) {
    console.error("NMI_SECURITY_KEY missing — cannot take payment.");
    return res.status(503).json({ ok: false, error: "not_configured" });
  }

  const { payment_token: paymentToken, pid, contact_id, opportunity_id, billing, submitted, treatment } =
    req.body || {};

  const token = clean(paymentToken, 200);
  if (!token) {
    return res.status(400).json({ ok: false, error: "missing_token" });
  }

  /* The price is looked up here and never read off the request. The amount the
     modal displays is decoration; trusting it would let anyone pay $1 for a
     $1,350 treatment. An id we can't price is refused outright. */
  if (isFollowOnRung(pid)) {
    console.warn(`Refused a card payment for plan-only product ${pid}`);
    return res.status(403).json({ ok: false, error: "plan_only" });
  }
  const charge = chargeFor(pid, monthsFrom(req.body?.months));
  if (!charge) {
    console.error(`Refused payment for unpriced product id "${pid}"`);
    return res.status(400).json({ ok: false, error: "unknown_product" });
  }

  const form = new URLSearchParams({
    security_key: SECURITY_KEY,
    type: "sale",
    payment_token: token,
    // NMI's `amount` is the grand total; `shipping` breaks that total down in
    // the gateway's own reports without being added a second time.
    amount: charge.total.toFixed(2),
    shipping: charge.shipping.toFixed(2),
    currency: "USD",
    order_description: DESCRIPTION,
  });

  const orderId = clean(opportunity_id, 60);
  if (orderId) form.set("orderid", orderId);

  /* Collected in the payment form itself rather than carried over from the
     questionnaire: the billing address on a card is often not the patient's,
     and none of MDI's clinical data should travel to a processor. Name and ZIP
     are what AVS actually checks. */
  for (const [key, value] of Object.entries({
    first_name: clean(billing?.first_name, 40),
    last_name: clean(billing?.last_name, 40),
    zip: clean(billing?.zip, 12),
    email: clean(billing?.email, 80),
  })) {
    if (value) form.set(key, value);
  }

  let result;
  try {
    const r = await fetch(GATEWAY, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    // NMI answers with a URL-encoded body, not JSON, on success and failure alike.
    result = new URLSearchParams(await r.text());
  } catch (e) {
    console.error("NMI request failed:", e.message);
    return res.status(502).json({ ok: false, error: "gateway_unreachable" });
  }

  const code = result.get("response"); // 1 approved, 2 declined, 3 error
  const gatewayText = result.get("responsetext") || "";
  const transactionId = result.get("transactionid") || null;

  if (code === "1") {
    // Amounts and id only: the product name stays out of the logs.
    console.info(
      `NMI sale approved: txn ${transactionId}, product ${pid}, $${charge.total.toFixed(2)} ` +
        `(incl. $${charge.shipping.toFixed(2)} shipping)`
    );
    // Independent of each other, and neither may fail the patient's checkout.
    await Promise.allSettled([
      syncTag(clean(contact_id, 60), { failed: false }),
      // Sequenced rather than parallel: both write the same opportunity.
      markPaid(orderId, transactionId).then(() =>
        submitted === true ? markComplete(clean(contact_id, 60), orderId, clean(treatment, 120)) : null
      ),
    ]);
    return res.status(200).json({ ok: true, transactionId, amount: charge.total });
  }

  const declined = code === "2";
  console.warn(
    `NMI sale ${declined ? "declined" : `errored (response=${code})`} for product ${pid}: ${gatewayText}`
  );

  await markFailed(clean(contact_id, 60), orderId);

  /* 200 rather than 4xx: this is a real answer to a well-formed request, and
     the modal needs to render the reason instead of a network error. The
     gateway's own wording is passed through on a decline because it's what
     tells a patient to try another card; a gateway error is ours to debug, so
     the patient gets something generic and the detail stays in the log. */
  return res.status(200).json({
    ok: false,
    declined,
    error: declined ? "declined" : "gateway_error",
    message: declined ? gatewayText.slice(0, 140) : "",
  });
}
