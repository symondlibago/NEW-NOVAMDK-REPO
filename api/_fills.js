import { PRICES } from "./_prices.js";
import { rungFor } from "./_plans.js";
import {
  ghlConfigured,
  findContactByCustomField,
  plansFor,
  oppPlansEnabled,
  dueDate,
  stripeCustomerOn,
  SEARCH_FIELD_ID,
} from "./_ghl.js";

/* Which months of which plans a patient may still take without paying, and
 * which questionnaire each one opens.
 *
 * Shared by the portal, which offers them, and by /api/pay, which has to agree
 * that nothing is owed before letting an intake through without a card. Both
 * answers come from the same numbers so the two cannot drift.
 *
 * Nothing here trusts the browser. A prepaid month costs nothing, so a request
 * that got to name its own product would turn a $105 three month LDN plan into
 * two free months of a $229 tirzepatide. The patient is identified from the
 * portal session cookie and everything else from the plans recorded in
 * GoHighLevel.
 *
 * PLURAL, since 2026-10-06. A patient can hold a plan per treatment, so there
 * is no single "their plan" to speak of. The version that assumed one plan per
 * patient kept it on the contact, which meant a second purchase overwrote the
 * first and the prepaid months of the first were simply lost.
 *
 * And nothing here reads their VISITS. An earlier version inferred which rung
 * they were on from their newest case and counted months in flight the same
 * way; both broke for the first patient with two treatments running, because a
 * visit belongs to a treatment and tells you nothing about which plan paid for
 * it. A plan knows its own product and its own counts.
 */

/* Products that exist only as a later month of a plan, derived rather than
   flagged: a rung is a follow-on exactly when something else points at it.
   These are hidden from the shop and must not be sellable on their own, which
   is the client's decision of 2026-10-03: the maintenance questionnaire is
   only available to someone who subscribed for 2 or 3 months. */
const FOLLOW_ON = new Set(
  Object.values(PRICES)
    .map((p) => p.nextRung)
    .filter(Boolean)
    .map(Number)
);

/** Is this product only reachable as a later month of a plan? */
export const isFollowOnRung = (pid) => FOLLOW_ON.has(Number(pid));

/** The product and questionnaire for a given month of a plan, or null. */
function monthOf(planProduct, month) {
  const pid = rungFor(planProduct, month);
  const q = pid ? PRICES[String(pid)]?.questionnaireId : null;
  return q ? { pid, questionnaireId: q } : null;
}

/** The GHL contact behind a portal session, or null. */
export async function contactForPatient(patientId) {
  const id = typeof patientId === "string" ? patientId.trim() : "";
  if (!id || !ghlConfigured()) return null;
  return findContactByCustomField(SEARCH_FIELD_ID.MDI_PATIENT_ID, id).catch(() => null);
}

/* One plan, decided.
 *
 * claimed is how many months they have been handed, the purchase included.
 * used is how many the pharmacy has shipped.
 *
 * canStart, read in the portal BEFORE a case exists, offers another month only
 * once everything handed out has shipped. So a patient waiting on a review sees
 * no button, and nobody can open month after month for free.
 *
 * canSettle, read at the payment step, asks whether the month they are doing
 * right now was actually handed to them: claimed has to be ahead of shipped.
 * Without that, anyone could walk into /intake on a plan-only product and have
 * it for nothing. */
function decide(plan) {
  const { claimed, used, months } = plan;
  const inProgress = plan.productId ? monthOf(plan.productId, claimed) : null;
  const next = plan.productId ? monthOf(plan.productId, claimed + 1) : null;

  /* The rung a NEW term opens on: one step past where this term finished.
   *
   * Someone on 1 month terms steps up a dose at every renewal, and someone who
   * has just finished a 3 month term is already on the last rung, which repeats
   * itself, so they stay there. Walked with months + 1 so both fall out of the
   * same line instead of being special cased. */
  const renew = plan.productId ? monthOf(plan.productId, months + 1) : null;

  /* The renewal date has arrived and the patient has not turned renewal off.
   *
   * Separate from canRenew on purpose. A 3 month plan renews on day 77, seven
   * days before its last fill runs out, so the date can arrive while month 3 is
   * still with the pharmacy. The portal needs to say "once this month arrives"
   * rather than show the patient nothing at all the day after we emailed them. */
  const renewDue =
    Boolean(plan.productId && renew) &&
    plan.autoRenew === true &&
    Boolean(plan.renewsOn) &&
    /* Both sides are YYYY-MM-DD, so a string compare is the date compare. */
    plan.renewsOn <= dueDate(new Date()) &&
    claimed >= months;

  return {
    ...plan,
    nextMonth: claimed + 1,
    pid: next?.pid ?? null,
    questionnaireId: next?.questionnaireId ?? null,
    inProgressPid: inProgress?.pid ?? null,
    inProgressQuestionnaireId: inProgress?.questionnaireId ?? null,
    canStart: Boolean(plan.productId) && claimed < months && claimed <= used,
    canSettle: Boolean(plan.productId) && claimed <= months && claimed > used,
    renewPid: renew?.pid ?? null,
    renewQuestionnaireId: renew?.questionnaireId ?? null,
    renewDue,
    /* Nothing of this term may still be in flight. The same rule the renewal
       charge used before the client moved it behind provider approval: a month
       handed out but not yet shipped means a new term would be paid for on top
       of one that has not arrived. */
    canRenew: renewDue && used >= claimed,
  };
}

/** Every plan this patient holds, each already decided. @returns {Promise<object[]>} */
export async function fillsFor(patientId) {
  if (!oppPlansEnabled()) return [];
  const contact = await contactForPatient(patientId);
  if (!contact?.id) return [];
  const plans = await plansFor(contact.id);
  /* The Stripe customer travels WITH the fill, read off the contact we already
     fetched. The portal used to ask GoHighLevel for the same contact a second
     time by id just to get this one field, which was a wasted round trip on
     every plan read. */
  const stripeCustomer = stripeCustomerOn(contact);
  return plans.map((p) => decide({ ...p, contactId: contact.id, stripeCustomer }));
}

/* The one plan a product belongs to, decided, or null.
 *
 * Matched on the LADDER rather than the exact product, because a 3 month
 * tirzepatide plan covers the Starter, the Mid-Dose and the Maintenance rungs
 * and a request will name whichever month it is on. */
export async function fillForProduct(patientId, pid) {
  const want = Number(pid);
  if (!want) return null;
  const fills = await fillsFor(patientId);
  return (
    fills.find((f) => {
      const q = PRICES[String(want)]?.questionnaireId;
      return q && (f.questionnaireId === q || f.inProgressQuestionnaireId === q);
    }) || null
  );
}

/* Whether this exact product may be taken without paying.
 *
 * The questionnaire is compared, not the product id. Mid-Dose and Maintenance
 * on the tirzepatide ladder are one questionnaire under two ids, so the id a
 * voucher was minted against and the id the plan expects are both right and are
 * not always the same number. The form is what the patient fills in and what
 * the entitlement is really about.
 *
 * Matched against the month IN PROGRESS, not the next one: by the time the
 * payment step runs, next_fill has already handed this month out. */
export function matchesFill(fill, pid) {
  const want = fill?.inProgressQuestionnaireId;
  const got = PRICES[String(pid)]?.questionnaireId;
  return Boolean(want && got && want === got);
}
