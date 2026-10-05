import { PRICES } from "./_prices.js";
import { rungFor } from "./_plans.js";
import {
  ghlConfigured,
  findContactByCustomField,
  plansFor,
  oppPlansEnabled,
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
  return {
    ...plan,
    nextMonth: claimed + 1,
    pid: next?.pid ?? null,
    questionnaireId: next?.questionnaireId ?? null,
    inProgressPid: inProgress?.pid ?? null,
    inProgressQuestionnaireId: inProgress?.questionnaireId ?? null,
    canStart: Boolean(plan.productId) && claimed < months && claimed <= used,
    canSettle: Boolean(plan.productId) && claimed <= months && claimed > used,
  };
}

/** Every plan this patient holds, each already decided. @returns {Promise<object[]>} */
export async function fillsFor(patientId) {
  if (!oppPlansEnabled()) return [];
  const contact = await contactForPatient(patientId);
  if (!contact?.id) return [];
  const plans = await plansFor(contact.id);
  return plans.map((p) => decide({ ...p, contactId: contact.id }));
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
