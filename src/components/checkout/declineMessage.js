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
