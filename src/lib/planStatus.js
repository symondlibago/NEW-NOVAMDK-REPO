/* The portal's subscription status vocabulary.
 *
 * John's list of 2026-10-06, the eight states a plan can be in. SIX of them are
 * derivable from data the portal already holds and are returned by planStatus
 * below. Paused and Payment Issue need fields that do not exist yet; their keys
 * and labels are declared here anyway, so that when they are built nothing
 * invents a second spelling of the same word and the pill styling already
 * covers them.
 *
 * One function, one place. The same status is shown on Home and on Treatments,
 * and the two drifting apart is exactly the kind of thing a patient reads as a
 * bug: "Active" on one screen and "Processing" on the next.
 */

/* `tone` drives the pill colour and nothing else. Named for what it means to
   the patient rather than for a colour, so a theme change cannot make
   "Payment Issue" look reassuring. */
export const STATUS = {
  REVIEW_REQUIRED: {
    key: "review_required",
    label: "Provider Review Required",
    tone: "action",
    /* What the patient should do, in their own terms. The label is John's
       wording and describes the clinical step; this describes theirs. */
    hint: "Answer your check-in so a provider can review it",
  },
  AWAITING_APPROVAL: {
    key: "awaiting_approval",
    label: "Awaiting Provider Approval",
    tone: "wait",
    hint: "A licensed provider is reviewing your answers",
  },
  PROCESSING: {
    key: "processing",
    label: "Processing",
    tone: "wait",
    hint: "Approved, and being prepared by the pharmacy",
  },
  ACTIVE: {
    key: "active",
    label: "Active",
    tone: "good",
    hint: "Your plan renews on its own",
  },
  AUTO_RENEW_OFF: {
    key: "auto_renew_off",
    label: "Auto-Renew Off",
    tone: "quiet",
    hint: "The months you have paid for carry on, and nothing renews after that",
  },
  CANCELLED: {
    key: "cancelled",
    label: "Cancelled",
    tone: "quiet",
    hint: "This plan has ended. You can start a new one any time",
  },
  /* Not derivable yet. Pause needs a field, and a payment problem needs a state
     a patient can clear rather than the staff-facing tag we keep today. */
  PAUSED: { key: "paused", label: "Paused", tone: "quiet", hint: "Your plan is paused" },
  PAYMENT_ISSUE: {
    key: "payment_issue",
    label: "Payment Issue",
    tone: "bad",
    hint: "We could not take your payment. Please update your card",
  },
};

/* The steps a visit walks, as api/portal.js numbers them:
   0 Received, 1 In Review, 2 Rx Approved, 3 In Fulfillment, 4 Shipped. */
const LAST_REVIEW_STEP = 1;
const FIRST_PHARMACY_STEP = 2;
const LAST_PHARMACY_STEP = 3;

/** The visits that belong to this plan, newest first. */
export function visitsForPlan(plan, visits) {
  const ids = Array.isArray(plan?.questionnaireIds) ? plan.questionnaireIds : [];
  if (!ids.length || !Array.isArray(visits)) return [];
  const wanted = new Set(ids);
  return visits
    .filter((v) => v?.kind === "case" && v.questionnaire_id && wanted.has(v.questionnaire_id))
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

/** The one visit that describes where this plan is right now, or null. */
export const currentVisitForPlan = (plan, visits) => visitsForPlan(plan, visits)[0] || null;

/* Where a plan stands, in one word the patient can act on.
 *
 * Ordered by urgency, not by lifecycle: the first thing a patient needs to know
 * is whether anything is waiting on THEM. A plan can be several of these at
 * once, and showing the most pressing one is the whole point of a single pill.
 *
 * `visit` is the plan's newest visit, from currentVisitForPlan. Null for a plan
 * whose visits we cannot match, in which case the answer falls back to the
 * plan's own fields, which are never missing.
 */
export function planStatus(plan, visit = null) {
  if (!plan) return null;

  /* Theirs to do. A check-in they can start, or a term that is up for renewal.
     Ahead of everything else because nothing moves until they act. */
  if (plan.canStart || plan.canRenew) return STATUS.REVIEW_REQUIRED;

  /* A decided case says nothing about where the plan is: a denial or a
     cancellation is history, and the plan's own fields are the better answer. */
  if (visit && visit.bucket !== "inactive") {
    const at = typeof visit.step?.index === "number" ? visit.step.index : -1;
    if (at >= 0 && at <= LAST_REVIEW_STEP) return STATUS.AWAITING_APPROVAL;
    if (at >= FIRST_PHARMACY_STEP && at <= LAST_PHARMACY_STEP) return STATUS.PROCESSING;
    /* Shipped falls through. The parcel is on its way, which the order row says
       in more useful detail than a status pill could. */
  }

  if (!plan.autoRenew) {
    /* Nothing left to come and nothing will renew, which is an ended plan
       rather than merely one with the switch off. */
    return plan.remaining === 0 ? STATUS.CANCELLED : STATUS.AUTO_RENEW_OFF;
  }

  return STATUS.ACTIVE;
}
