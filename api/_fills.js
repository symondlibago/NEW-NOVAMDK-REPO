import { PRICES } from "./_prices.js";
import { mdi, listOf } from "./_mdi.js";
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
 * portal session cookie, the plan from GoHighLevel, and the questionnaire from
 * the generated catalogue.
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

const entries = Object.entries(PRICES);

/* The questionnaire a patient on `questionnaireId` answers for their NEXT
 * month.
 *
 * Keyed on the questionnaire rather than the product id on purpose. Two rungs
 * of the tirzepatide ladder share one questionnaire, so "which product" has no
 * single answer there while "which form do they fill in" always does, and the
 * form is the only thing that actually differs.
 *
 * The last rung of a ladder has no nextRung and therefore repeats itself, which
 * is what months 2 and 3 of a three month plan should do. */
export function nextQuestionnaire(questionnaireId) {
  const qid = typeof questionnaireId === "string" ? questionnaireId.trim() : "";
  if (!qid) return null;
  /* A product with a nextRung wins, so the ladder is climbed rather than
     repeated while there are rungs left. */
  const climbing = entries.find(([, p]) => p.questionnaireId === qid && p.nextRung);
  if (climbing) {
    const next = PRICES[String(climbing[1].nextRung)];
    return next?.questionnaireId ? { pid: Number(climbing[1].nextRung), questionnaireId: next.questionnaireId } : null;
  }
  const staying = entries.find(([, p]) => p.questionnaireId === qid);
  return staying ? { pid: Number(staying[0]), questionnaireId: qid } : null;
}

/* Cases that are neither cancelled nor denied, plus intakes still sitting
   half-finished. Both are a month the patient has already begun, so both have
   to count against what they are owed, or an abandoned intake would mint a
   fresh voucher every time the page was opened. */
const DEAD = new Set(["closed", "cancelled", "canceled", "rejected", "denied"]);

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

  const enc = encodeURIComponent(id);
  const [c, v] = await Promise.all([
    mdi(`/patients/${enc}/cases`),
    mdi(`/patients/${enc}/vouchers`),
  ]);
  /* Unreadable rather than empty. Treating a failed read as "no visits" would
     say the patient has started nothing and hand them a free month. */
  if (!c.ok || !v.ok) {
    console.error(`Fill check: MDI read failed for ${id} (cases ${c.status}, vouchers ${v.status})`);
    return null;
  }

  const cases = listOf(c.data);
  const vouchers = listOf(v.data);
  const live = cases.filter((x) => !DEAD.has(String(x.case_status?.name || "").toLowerCase()));
  const drafts = vouchers.filter(
    (x) => !x.case_id && String(x.status || "").toLowerCase() === "pending" && !x.is_expired
  );
  const inFlight = live.length + drafts.length;

  /* Which rung they are on: the newest case, falling back to the newest
     half-finished intake for someone who has not completed one yet. */
  const questionnaireOf = (caseId) =>
    vouchers.find((x) => x.case_id === caseId)?.partner_questionnaire_id || null;
  const newest = [...cases].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  )[0];
  const current =
    (newest && questionnaireOf(newest.case_id || newest.id)) ||
    [...drafts].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0]
      ?.partner_questionnaire_id ||
    null;
  const next = nextQuestionnaire(current);

  /* The two thresholds differ by exactly one, and the difference is when they
   * are asked.
   *
   * canStart is read in the portal BEFORE a case exists, so the patient may
   * only begin another month when everything they have begun so far has
   * already shipped. canSettle is read at the payment step, by which point MDI
   * has created the case for the month they are doing right now, so one more
   * than shipped is correct and expected.
   *
   * Getting this the other way round would either refuse a legitimate prepaid
   * month at the last step, or let someone open case after case for free while
   * the first was still being reviewed. */
  return {
    contactId: contact.id,
    plan,
    inFlight,
    pid: next?.pid ?? null,
    questionnaireId: next?.questionnaireId ?? null,
    canStart: plan.remaining > 0 && inFlight <= plan.used,
    canSettle: plan.remaining > 0 && inFlight <= plan.used + 1,
  };
}

/* Whether this exact product may be taken without paying.
 *
 * The questionnaire is compared, not the product id. Mid-Dose and Maintenance
 * on the tirzepatide ladder are one questionnaire under two ids, so the id a
 * voucher was minted against and the id derived a step later are both right and
 * are not the same number. The form is what the patient fills in and what the
 * entitlement is really about. */
export function matchesFill(fill, pid) {
  const want = fill?.questionnaireId;
  const got = PRICES[String(pid)]?.questionnaireId;
  return Boolean(want && got && want === got);
}
