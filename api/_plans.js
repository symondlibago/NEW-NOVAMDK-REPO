/* Multi-month plans: how a term is priced, and nothing else.
 *
 * John's design, agreed 2026-10-02. A patient buys 1, 2 or 3 months and pays
 * for the whole term at checkout. The pharmacy still dispenses one month at a
 * time, because every GLP-1 offering MDI exposes is `days_supply: 28,
 * refills: 0`: one fill per prescription, no exceptions. So each month of a
 * plan is a NEW intake, producing a new case and a new prescription, and the
 * plan is only the record of how many of those have been paid for.
 *
 * Deliberately not Stripe Subscriptions. Subscriptions bill on a schedule,
 * which is the opposite of taking the money upfront, and they bring dunning,
 * saved cards, proration and mid-term cancellation with them. A term is one
 * payment, so it is one PaymentIntent, which is the flow already live. If the
 * client later wants the plan to renew by itself, that is the point at which
 * Subscriptions becomes the right tool and this module is not enough.
 *
 * THE ONLY PLACE TERM PRICING LIVES. Changing a number here changes the
 * chooser, the quote, the charge and the receipt together, because all four
 * read it from here through /api/pay.
 */

/* Straight multiples of the catalogue price: 2 months is twice, 3 months is
 * three times. Client's decision, 2026-10-02, and the right placeholder while
 * final prices are still unset, since any discount invented here would be a
 * number nobody agreed to.
 *
 * `off` is a fraction taken off the monthly price on that term. All zero today.
 * When the client does want the longer terms to cost less, which is what hims,
 * IvyRx and ReadyRx all do, this is the one place to put it: everything else,
 * the chooser, the quote, the charge and the receipt, reads it from here. */
export const PLAN_TERMS = [
  { months: 1, off: 0 },
  { months: 2, off: 0 },
  { months: 3, off: 0 },
];

export const DEFAULT_MONTHS = 1;

/* Above this a month, a plan is single month only.
 *
 * Not a pricing rule, a safety one. The card is held rather than charged, so a
 * 3 month term asks the issuer to reserve three months of money at once, and
 * three months of a branded GLP-1 at $1,150 is a $3,105 hold on someone's
 * debit card. The cheapest way for a patient to end up unable to buy groceries
 * is for us to offer them that in a dropdown. The compounded range this plan
 * was designed around is all well under the cap. */
export const PLAN_MAX_PER_MONTH = Number(process.env.PLAN_MAX_PER_MONTH || 500);

/** Whether a product at this monthly price may be bought as a multi-month plan. */
export const planAllowed = (base) => {
  const n = Number(base);
  return Number.isFinite(n) && n > 0 && n <= PLAN_MAX_PER_MONTH;
};

/* One fill is 28 days, not 30. The reminder is timed off this in mdi-webhook,
   counted from the day the pharmacy ships rather than the day of the intake,
   because approval and fulfilment take days and a patient who intakes on the
   1st may not hold the vial until the 6th. */
export const DAYS_PER_FILL = 28;

/* How much warning the patient gets. Seven days, which is the client's figure
   and enough for a review, an approval and the post. */
export const REMINDER_DAYS = 7;

/** When the next intake should be due, given the day a fill shipped. */
export function nextIntakeDue(shippedAt = new Date()) {
  const at = new Date(shippedAt);
  if (Number.isNaN(at.getTime())) return null;
  at.setDate(at.getDate() + DAYS_PER_FILL - REMINDER_DAYS);
  return at;
}

/** The term for a month count, or null if it isn't one we sell. */
export const termFor = (months) =>
  PLAN_TERMS.find((t) => t.months === Number(months)) || null;

/* Whatever the browser sent, reduced to a term we actually sell.
 *
 * The month count reaches the server the same way the product id does, in the
 * request body, so it gets the same treatment: an allowlist, not a number.
 * Without this, `months: 0` prices a free treatment and `months: 99` asks the
 * patient's bank to authorise five figures. Anything unrecognised falls back to
 * a single month, which is the old behaviour and the safe one. */
export function monthsFrom(value) {
  const n = Number(value);
  return Number.isInteger(n) && termFor(n) ? n : DEFAULT_MONTHS;
}

/* What one month costs on a given term.
 *
 * Rounded to the dollar on the discounted terms so the chooser reads "$152 a
 * month" rather than "$152.10 a month", which is how every site selling these
 * quotes them. The single month is returned untouched: it is the catalogue
 * price the patient has already seen on the product page, and rounding it would
 * silently reprice the whole shop by up to 50 cents. */
export const perMonthOf = (base, term) =>
  term.off === 0 ? base : Math.max(1, Math.round(base * (1 - term.off)));

/** Priced term: what one month costs, what the whole term costs, what they save. */
export function priceTerm(base, term) {
  const perMonth = perMonthOf(base, term);
  const amount = Math.round(perMonth * term.months * 100) / 100;
  return {
    months: term.months,
    perMonth,
    amount,
    saving: Math.round((base * term.months - amount) * 100) / 100,
  };
}
