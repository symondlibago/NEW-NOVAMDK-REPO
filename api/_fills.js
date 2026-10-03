import { PRICES } from "./_prices.js";
import { rungFor } from "./_plans.js";
import {
  ghlConfigured,
  findContactByCustomField,
  planFor,
  SEARCH_FIELD_ID,
} from "./_ghl.js";

/* Whether a patient may take another month of a plan they already paid for,
 * and which questionnaire that month is.
 *
 * Shared by the portal, which offers the next month, and by /api/pay, which has
 * to agree that nothing is owed before letting an intake through without a
 * card. Both answers come from the same numbers so the two cannot drift.
 *
 * Nothing here trusts the browser. A prepaid month costs nothing, so a request
 * that got to name its own product would turn a $105 three month LDN plan into
 * two free months of a $229 tirzepatide. The patient is identified from the
 * portal session cookie and everything else from the plan recorded in
 * GoHighLevel.
 *
 * ALL OF IT COMES FROM THE PLAN, not from the patient's visits.
 *
 * The first version read their MDI cases to work out which rung they were on
 * and how many months were in flight. Both broke on the first patient who had
 * two treatments at once, which was the second live test: a tirzepatide plan
 * counted a semaglutide visit against it, hid the month 2 button, and would
 * have offered the wrong questionnaire if it had not. Visits belong to
 * treatments; a plan knows its own product and its own counts.
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

/** @returns {Promise<object|null>} null unless this patient is on a plan. */
export async function fillFor(patientId) {
  const id = typeof patientId === "string" ? patientId.trim() : "";
  if (!id || !ghlConfigured() || !SEARCH_FIELD_ID.PLAN_MONTHS) return null;

  const contact = await findContactByCustomField(SEARCH_FIELD_ID.MDI_PATIENT_ID, id).catch(
    () => null
  );
  if (!contact?.id) return null;
  const plan = await planFor(contact.id);
  if (!plan) return null;
  /* A plan with no product recorded cannot say which questionnaire comes next,
     and guessing is what this rewrite exists to stop. Plans bought before the
     field existed land here and are handled by staff. */
  if (!plan.productId) {
    console.warn(
      `Fill check: contact ${contact.id} is on a ${plan.months} month plan with no ` +
        `plan_product recorded, so no month can be offered.`
    );
    return null;
  }

  /* claimed is how many months they have been handed, the purchase included.
   * used is how many the pharmacy has shipped.
   *
   * canStart, read in the portal, offers another month only once everything
   * handed out has shipped. So a patient waiting on a review sees no button,
   * and nobody can open month after month for free.
   *
   * canSettle, read at the payment step, asks whether the month they are
   * doing right now was actually handed to them: claimed has to be ahead of
   * shipped. Without that, anyone could walk into /intake on a plan-only
   * product and have it for nothing. */
  const { claimed, used, months } = plan;
  const inProgress = monthOf(plan.productId, claimed);
  const next = monthOf(plan.productId, claimed + 1);

  return {
    contactId: contact.id,
    plan,
    /* The month the portal would start next, and its questionnaire. */
    nextMonth: claimed + 1,
    pid: next?.pid ?? null,
    questionnaireId: next?.questionnaireId ?? null,
    /* The month already underway, which is what the payment step is settling. */
    inProgressPid: inProgress?.pid ?? null,
    inProgressQuestionnaireId: inProgress?.questionnaireId ?? null,
    canStart: claimed < months && claimed <= used,
    canSettle: claimed <= months && claimed > used,
  };
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
