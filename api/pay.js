import { PRICES } from "./_prices.js";
import { blocked } from "./_guard.js";
import {
  ghlConfigured,
  tagContact,
  untagContact,
  markOpportunityPaid,
  updateContactFields,
  updateOpportunityFields,
  INTAKE_STAGE,
  FIELD,
} from "./_ghl.js";

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
 * NMI_TEST_PID names the one product affected, so leaving these behind by
 * accident can misprice one product rather than the whole catalogue. The quote
 * the modal displays always uses real prices; only the charge is overridden.
 * Unset NMI_TEST_PID to turn every override off. */
const TEST_PID = process.env.NMI_TEST_PID || null;
const TEST_AMOUNT = money(process.env.NMI_TEST_AMOUNT);
const TEST_SHIPPING = money(process.env.NMI_TEST_SHIPPING);

/* What the patient is shown. Real prices only, whatever test overrides exist. */
function quoteFor(pid) {
  const item = PRICES[String(pid)];
  if (!item) return null;
  return { amount: item.amount, shipping: SHIPPING_FEE, total: cents(item.amount + SHIPPING_FEE) };
}

/* What the card is actually charged. */
function chargeFor(pid) {
  const quote = quoteFor(pid);
  if (!quote) return null;
  if (!TEST_PID || String(pid) !== String(TEST_PID)) return quote;

  const amount = TEST_AMOUNT > 0 ? TEST_AMOUNT : quote.amount;
  const shipping = TEST_SHIPPING ?? quote.shipping;
  const charge = { amount, shipping, total: cents(amount + shipping) };
  console.warn(
    `NMI TEST PRICING ACTIVE: product ${pid} charged $${charge.total.toFixed(2)} ` +
      `($${amount.toFixed(2)} + $${shipping.toFixed(2)} shipping) instead of $${quote.total.toFixed(2)}. ` +
      `Unset NMI_TEST_PID once testing is done.`
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

/* Moving the card to Paid belongs here, not in the browser.
 *
 * It used to be a follow-up call the intake page made after the charge cleared,
 * reading the opportunity id out of sessionStorage. Anything that emptied that
 * storage — a link opened in a fresh tab, private browsing, a cleared session —
 * meant the patient paid successfully while GHL never heard about it. Money
 * taken, no card moved, no conversion counted, and nothing in the CRM to show
 * a paying patient was waiting. The server already knows the charge cleared, so
 * the server owns the write. */
async function markPaid(opportunityId, transactionId) {
  if (!ghlConfigured()) return;
  if (!opportunityId) {
    console.error(
      `NMI sale ${transactionId} carried no opportunity id, so the Paid move was skipped. ` +
        `The charge went through — this card needs moving by hand.`
    );
    return;
  }
  try {
    await markOpportunityPaid(opportunityId);
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

export default async function handler(req, res) {
  /* The modal's order summary is rendered from this rather than from the
     catalogue in the bundle, so the shipping line it shows is always the one
     POST will charge. Answered on the same function to stay clear of the Hobby
     plan's function limit. */
  if (req.method === "GET") {
    if (blocked(req, res)) return;
    // Vercel fills req.query; the local vite shim (vite.config.js) only passes
    // the raw URL, which left every local checkout reading "Total unavailable".
    const pid = req.query?.pid ?? new URL(req.url || "/", "http://localhost").searchParams.get("pid");
    const quote = quoteFor(pid);
    if (!quote) return res.status(400).json({ ok: false, error: "unknown_product" });
    return res.status(200).json({ ok: true, ...quote });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

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
  const charge = chargeFor(pid);
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

  await syncTag(clean(contact_id, 60), { failed: true });

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
