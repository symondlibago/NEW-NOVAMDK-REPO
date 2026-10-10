/* What the patient reads when a card is refused.
 *
 * Stripe's own error.message is accurate but thin: most declines arrive as the
 * bare "Your card was declined." with no hint of what to do next, and a patient
 * who has just finished a long questionnaire needs to know whether to reach for
 * a second card, check three digits, or ring their bank. Each of these names
 * what happened and what to try.
 *
 * The lost, stolen and fraud codes deliberately fall through to the generic
 * wording. Stripe's own guidance is not to tell whoever is holding the card why
 * a bank flagged it, and a patient whose card really was skimmed learns nothing
 * from us that their bank won't tell them properly.
 *
 * Its own module rather than a second export from StripeCheckout, which costs
 * that file its fast refresh.
 *
 * Every key here was confirmed against the live Stripe sandbox on 2026-10-01
 * rather than copied from the docs: the lookup is by string, so a misremembered
 * code would quietly fall through to the generic message with nothing failing.
 */
/* Shown on the button and under the total. The card is only held at checkout
   and charged when a provider approves, and some bank statements do not
   distinguish the two, so a patient can see a pending line and think they have
   already been billed. Saying it plainly up front is cheaper than answering it
   in support, and it is a good reason to go through with the visit. */
/* Approved by the client on 2026-10-05, and live from the same push that made
   renewals real. The third sentence is also the consent for keeping the card on
   file: nothing may be saved for later without the patient being told, so this
   line and the saved card ship together or not at all. */
export const HOLD_NOTICE =
  "Your card is held, not charged. We only take payment once a licensed provider approves " +
  "your treatment. Your plan then renews automatically, and you can cancel any time in your " +
  "patient portal.";

/* The recurring billing authorisation, beside the checkbox that unlocks the
 * submit button. A plan that renews on its own needs the patient's express
 * agreement to the amount and the interval before the card is taken, not a
 * sentence buried in the terms, which is also what every card scheme asks for.
 *
 * NOT YET REVIEWED BY COUNSEL. Same standing as the rest of the consent copy
 * on this site: the wording is ours, the sign-off is John's lawyer's. It is
 * here rather than inline in the component so there is one place to change.
 *
 * Shortened at the client's request (2026-10-10), but it still names the
 * amount and how often it renews, which is the part that has to be agreed.
 *
 * Returned in pieces so the component can set the amount and the interval in
 * bold without either drifting away from the sentence they belong to. Both are
 * passed in already formatted by the caller, the amount from the server's quote.
 */
export const renewalConsent = ({ charge, renewal }) => ({
  lead: "I authorize a charge of",
  charge,
  mid: "after approval, renewing",
  renewal,
  tail: "until I cancel.",
});

/* The long version, behind the question mark on the total.
 *
 * Our own wording, not Ready RX's. Theirs describes a renewal schedule we do
 * not run, and their copy is their own counsel's to stand behind. Each line
 * here is something this code actually does: the hold at checkout, the capture
 * on approval, the release on a decline, and the 7 day limit Stripe puts on an
 * authorisation. */
export const PAYMENT_DUE = {
  title: "When is payment due?",
  paragraphs: [
    "You only pay if you are prescribed. We place an authorization hold on your card now, and no charge goes through until a licensed provider approves your treatment.",
    "If the provider decides this treatment is not right for you, the hold is released and you are not charged anything.",
    "A hold lasts up to 7 days. If your visit has not been reviewed by then, your bank releases the funds on its own and we will ask you to pay again before anything ships.",
    "Once your first order is approved, your plan renews on its own so your treatment does not lapse. We only ever charge a renewal when your prescription is active and nothing is waiting on a provider. You can turn renewals off at any time in your patient portal, and that never affects a plan you have already paid for.",
  ],
};

export const GENERIC_DECLINE =
  "Your card was declined. Try another card, or call your bank to approve the payment.";

export const DECLINE_COPY = {
  insufficient_funds: "That card doesn't have enough funds for this payment. Try another card.",
  incorrect_cvc: "That security code doesn't match the card. Check it and try again.",
  invalid_cvc: "That security code isn't right. Check it and try again.",
  incorrect_number: "That card number isn't right. Check the digits and try again.",
  invalid_number: "That card number isn't right. Check the digits and try again.",
  expired_card: "That card has expired. Try another card.",
  invalid_expiry_month: "That expiry date isn't right. Check it and try again.",
  invalid_expiry_year: "That expiry date isn't right. Check it and try again.",
  card_not_supported: "That card can't be used for this kind of payment. Try another card.",
  currency_not_supported: "That card can't be charged in US dollars. Try another card.",
  authentication_required:
    "Your bank wants to confirm this payment. Try again, then approve the request from your bank.",
  /* The bank's confirmation step was cancelled or timed out. Checked by code
     before type, so it reads properly whichever type Stripe.js attaches. */
  payment_intent_authentication_failure:
    "Your bank couldn't confirm that payment. Try again, or use another card.",
  processing_error: "Something went wrong at the bank's end. Give it a moment and try again.",
  issuer_not_available: "Your bank couldn't be reached. Give it a moment and try again.",
  try_again_later: "Your bank asked us to try again later. Give it a few minutes, or use another card.",
  call_issuer: "Your bank declined this card. Call them to approve the payment, or try another card.",
  transaction_not_allowed:
    "Your bank doesn't allow this kind of payment on that card. Try another card.",
  card_velocity_exceeded: "That card has reached its limit for now. Try another card, or try later.",
  withdrawal_count_limit_exceeded:
    "That card has reached its limit for now. Try another card, or try later.",
  invalid_account: "Your bank says that account is closed. Try another card.",
  incorrect_zip: "Your bank needs more detail to approve that card. Try another card, or call them.",
  duplicate_transaction:
    "That looks like a payment you have already made. Check your email for a receipt before trying again.",
  /* Only ever seen when a test card number is used against live keys, which is
     easy to do while switching between the two. Saying so saves the guessing. */
  testmode_decline: "That's a test card, so it can't be charged here. Use a real card.",
};

/** The message for a Stripe.js confirm error, or for a card field's own error. */
export function declineMessage(error) {
  if (!error) return GENERIC_DECLINE;
  /* A validation_error never reached the bank: the form is simply incomplete,
     and Stripe names the offending field ("Your card number is incomplete")
     better than anything generic could. */
  if (error.type === "validation_error") {
    return error.message || "Check the card details and try again.";
  }
  const mapped = DECLINE_COPY[error.decline_code] || DECLINE_COPY[error.code];
  if (mapped) return mapped;
  if (error.type === "card_error") return GENERIC_DECLINE;
  /* Not a card problem at all: our key, our request, or Stripe itself. The
     patient gets something honest and the detail goes to the console. */
  return "We couldn't take that payment. Please try again.";
}
