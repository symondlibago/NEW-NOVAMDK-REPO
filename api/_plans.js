import { PRICES } from "./_prices.js";

/* Multi-month plans: how a term is priced, and which rung each month opens.
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
/* 1 and 3 only. John, 2026-10-03: "there's only 1 month and 3 months, no 2
   months." Adding a term back is a line here and nothing else: the chooser,
   the quote, the charge and the allowlist that validates what the browser
   asked for all read this list. */
export const PLAN_TERMS = [
  { months: 1, off: 0 },
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

/* When a plan's renewal should charge, counted from the day it was approved.
 *
 * A term covers `months` fills of 28 days, and the charge lands REMINDER_DAYS
 * before that runs out so the next batch has time to be reviewed, filled and
 * posted. A 1 month plan renews 21 days in, a 3 month plan 77 days in.
 *
 * Counted from approval rather than from shipping on purpose: it has to be
 * decidable the moment a provider approves, and a renewal that charges a few
 * days early is a patient who does not run out, which is the point. */
export function renewalDate(from = new Date(), months = 1) {
  const at = new Date(from);
  const term = Number(months);
  if (Number.isNaN(at.getTime()) || !Number.isInteger(term) || term < 1) return null;
  at.setDate(at.getDate() + term * DAYS_PER_FILL - REMINDER_DAYS);
  return at;
}

/** When the next intake should be due, given the day a fill shipped. */
export function nextIntakeDue(shippedAt = new Date()) {
  const at = new Date(shippedAt);
  if (Number.isNaN(at.getTime())) return null;
  at.setDate(at.getDate() + DAYS_PER_FILL - REMINDER_DAYS);
  return at;
}

/* ---- the rungs a plan climbs ----
 *
 * Month 1 is the product the patient bought; every month after it is that
 * product's nextRung, and the last rung repeats itself. Walked from the
 * recorded plan product rather than inferred from the patient's case history,
 * which was wrong for anyone with two treatments running: their newest case
 * could belong to the other one entirely.
 *
 * Here rather than in _fills.js because api/_ghl.js needs it too, and _fills.js
 * imports _ghl.js. */

/** The product month `month` of a plan on `planProduct` opens, or null. */
export function rungFor(planProduct, month) {
  let pid = Number(planProduct);
  const want = Number(month);
  if (!PRICES[String(pid)] || !Number.isInteger(want) || want < 1) return null;
  /* Bounded by the catalogue, so a nextRung loop someone introduces by mistake
     cannot spin here. */
  for (let step = 1; step < want && step < 20; step++) {
    const next = Number(PRICES[String(pid)]?.nextRung);
    if (!next || !PRICES[String(next)]) break; // last rung repeats itself
    pid = next;
  }
  return pid;
}

/** Every product a plan on `planProduct` can reach, itself included. */
export function ladderFor(planProduct) {
  const out = [];
  let pid = Number(planProduct);
  for (let step = 0; step < 20 && PRICES[String(pid)]; step++) {
    if (out.includes(pid)) break;
    out.push(pid);
    const next = Number(PRICES[String(pid)]?.nextRung);
    if (!next || !PRICES[String(next)]) break;
    pid = next;
  }
  return out;
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

/* Flat per order. An env var rather than a catalogue field so it can change
   without a rebuild; unset means no fee line and nothing charged for it. */
const SHIPPING_FEE = (() => {
  const n = Number(process.env.SHIPPING_FEE);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
})();

/* What the patient is shown. Real prices only, whatever test overrides exist.
 *
 * `months` is the plan term. The consultation fee is charged once per plan
 * rather than once per month: the reintakes are part of what they bought. It is
 * $0 at the time of writing, so this is a decision waiting to matter rather
 * than one already affecting a total.
 *
 * Lives here rather than in pay.js because the portal shows a renewal amount
 * and the renewal charge computes one, and the two must never disagree about
 * what a term costs. */
export function quoteFor(pid, months = DEFAULT_MONTHS) {
  const item = PRICES[String(pid)];
  if (!item) return null;
  /* A product too expensive to hold three months of can only be bought one
     month at a time, whatever the request asked for. Enforced here rather than
     only in the chooser, since the chooser is in the browser. */
  const asked = planAllowed(item.amount) ? months : DEFAULT_MONTHS;
  const term = termFor(asked) || termFor(DEFAULT_MONTHS);
  const priced = priceTerm(item.amount, term);
  return {
    ...priced,
    shipping: SHIPPING_FEE,
    total: Math.round((priced.amount + SHIPPING_FEE) * 100) / 100,
  };
}

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

/* ---- the test override ---- */

const cents = (n) => Math.round(n * 100) / 100;
const envAny = (...names) => {
  for (const n of names) {
    const v = process.env[n];
    if (v !== undefined && v !== "") return v;
  }
  return undefined;
};
const money = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? cents(n) : null;
};
const TEST_PIDS = new Set(
  String(envAny("TEST_CHARGE_PID", "NMI_TEST_PID") || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
);
const TEST_AMOUNT = money(envAny("TEST_CHARGE_AMOUNT", "NMI_TEST_AMOUNT"));
const TEST_SHIPPING = money(envAny("TEST_CHARGE_SHIPPING", "NMI_TEST_SHIPPING"));

/* What a card is ACTUALLY asked for, as opposed to what the catalogue says.
 *
 * Here rather than in api/pay.js since 2026-10-06, because a plan renewal holds
 * the card from api/portal.js and that hold has to be for the same figure the
 * checkout would have taken. Priced from quoteFor and then overridden, so the
 * live path and the test path cannot drift apart: the renewal that charged
 * $1.50 while the portal displayed $507 was exactly that drift.
 *
 * The override replaces the PER MONTH price and is then multiplied by the term,
 * deliberately skipping the term discount. A 3 month test therefore costs $1.50
 * rather than $1.35, and a 1 month test stays exactly the $0.50 that has
 * already been tested live. Discounting a 50 cent price and rounding it to the
 * dollar, which is what real pricing does, would have moved the test amount
 * around, and Stripe refuses anything under $0.50.
 *
 * Catalogue prices are what GoHighLevel's revenue is reported in, so anything
 * writing a card's value uses quoteFor and not this. */
export function chargeFor(pid, months = DEFAULT_MONTHS) {
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
