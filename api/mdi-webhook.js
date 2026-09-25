import { createHmac, timingSafeEqual } from "node:crypto";
import {
  ghlConfigured,
  findContactByCustomField,
  opportunitiesForContact,
  updateContactFields,
  moveOpportunityForward,
  markOpportunityLost,
  tagContact,
  clinicStamp,
  fieldValueOf,
  contactById,
  opportunityForEncounter,
  SEARCH_FIELD_ID,
  FIELD,
} from "./_ghl.js";
import { mdi } from "./_mdi.js";

/* Receives MDI's webhooks and mirrors the nonclinical status into GHL.

   This is the piece that finally makes Provider Review, Approved, Pharmacy and
   Shipped true rather than inferred: a clinician approves days after the visit,
   so there is no moment during the intake when we could have written it.

   Nothing clinical crosses over. MDI's payloads carry ids and a status label
   and nothing else, and only the label is copied, which keeps this inside the
   client's rule that questionnaire answers, diagnoses and prescriptions stay in
   MDI. */

const SECRET = process.env.MDI_WEBHOOK_SECRET || null;
const AUTH = process.env.MDI_WEBHOOK_AUTH || null;

/* Board columns. Names, resolved against the live pipeline by
   moveOpportunityForward, which is forward-only and never drags a won card
   backwards.

   `lost` is the exception to that rule: a cancelled case closes the card through
   markOpportunityLost instead, which ignores direction and sets the status as
   well as the column. MDI has no "denied" event, so `case_cancelled` is the only
   signal that a visit ended without treatment, and it covers both a provider
   turning someone down and a patient pulling out. Enabled on the client's
   instruction (2026-09-19) to stop denied visits sitting in Paid and counting as
   won revenue; if the two need telling apart, that has to come from MDI.

   Support still moves nothing: it's a detour, not an exit.

   `case_processing` moves nothing either, and that is deliberate. It looks like
   a pharmacy event but it isn't: MDI fires it seconds after the approval, while
   it transmits the prescription, and the case then reaches `case_completed`
   minutes later, before the pharmacy has touched the order (first live case,
   2026-09-22: processing, then completed four minutes on, then the order
   created as a draft). So the clinical chain ends at Completed and the pharmacy
   columns are driven by the order events below. */
const CASE_EVENTS = {
  case_created: { status: "created" },
  case_waiting: { status: "waiting", tag: "mdi-waiting" },
  case_assigned_to_clinician: { status: "assigned", stage: "Provider Review", tag: "mdi-in-review" },
  case_processing: { status: "processing", tag: "mdi-processing" },
  case_approved: { status: "approved", stage: "Approved", tag: "mdi-approved" },
  case_completed: { status: "completed", stage: "Completed", tag: "mdi-completed" },
  case_cancelled: { status: "cancelled", tag: "mdi-cancelled", lost: true },
  case_transferred_to_support: { status: "support", tag: "mdi-support" },
};

const ORDER_EVENTS = new Set([
  "case_order_created",
  "case_order_updated",
  "order_status_changed",
  "order_tracking_number_changed",
]);

/* The pharmacy half of the board, keyed on the real `order_status` values rather
   than the words MDI's Rx Orders screen shows, which are not the same:
   "Upcoming" is `draft`, "At Pharmacy" is `received`.

   `draft` deliberately moves nothing. An order is created in draft the moment
   the case completes, but it still has to be approved by hand in MDI before it
   reaches the pharmacy at all (observed live 2026-09-22: draft at 17:14,
   received an hour later), so a card in Pharmacy Processing at that point would
   be claiming work nobody had started. It waits in Completed.

   What's left collapses into the three columns a patient would recognise:
   someone is making it, it's on its way, it arrived. */
const ORDER_STAGE = {
  received: "Pharmacy Processing",
  ready: "Pharmacy Processing",
  fulfilled: "Shipped",
  shipped: "Shipped",
  completed: "Delivered",
  delivered: "Delivered",
};

const ORDER_TAG = {
  "Pharmacy Processing": "mdi-pharmacy",
  Shipped: "mdi-shipped",
  Delivered: "mdi-delivered",
};

/* The column the order sits in is the honest status, not the pharmacy's word for
   it: "fulfilled" and "completed" both read like the end of the line, and only
   one of them is. */
const STAGE_STATUS = { Shipped: "shipped", Delivered: "delivered" };

/* How far along the pharmacy columns run, so a tracking number can be compared
   against whatever the order status claims instead of losing to it. */
const STAGE_RANK = { "Pharmacy Processing": 1, Shipped: 2, Delivered: 3 };
const furthest = (a, b) => ((STAGE_RANK[b] || 0) > (STAGE_RANK[a] || 0) ? b : a);

/* An order that went wrong rather than forward. Kept loose because this is the
   one part of the pharmacy vocabulary we have not seen the whole of. */
const ORDER_PROBLEM = /cancel|void|reject|fail|error|declin/;

/** The column, status and tag an order event implies. */
function fromOrder(payload) {
  const raw = safeStatus(payload.order_status);
  const key = (raw || "").toLowerCase();
  const tracked = Boolean(safeStatus(payload.tracking_number));

  /* A cancelled or failed order is a pharmacy problem on a case a provider
     already approved, not a denied visit: the patient has paid and been
     prescribed, and someone has to sort the order out. So it moves nothing and
     is left for a human to pick up from the tag. `failed` is real, not
     defensive: MDI sent one on 2026-09-22. */
  if (ORDER_PROBLEM.test(key)) {
    const label = /cancel|void|reject/.test(key) ? "cancelled" : "failed";
    return { status: `order-${label}`, stage: null, tag: `mdi-order-${label}` };
  }

  /* A tracking number means the parcel has left, and it outranks whatever the
     order status says rather than merely filling in for a missing one.

     MDI does not promote an order to `fulfilled` when the carrier picks it up:
     it leaves the status on `received` and adds the number. Observed live on
     2026-09-23, `case_order_updated` with status=received and
     tracking=1Z1YV0901398822992, which the previous version read as Pharmacy
     Processing because the status map was consulted first. The card then sat in
     Pharmacy Processing with a tracking number against it.

     Compared rather than overridden, so an order that is already `completed`
     keeps Delivered instead of being pulled back to Shipped. */
  const byStatus = ORDER_STAGE[key] || null;
  const stage = tracked ? furthest("Shipped", byStatus) : byStatus;
  if (!stage) return { status: raw, stage: null, tag: null };

  return { status: STAGE_STATUS[stage] || raw, stage, tag: ORDER_TAG[stage] };
}

/* Orders arrive in `draft`, which the Rx Orders screen calls "Upcoming", and
   sit there until someone opens the row and clicks Approve. On the first live
   case that was an hour. MDI exposes the same action on the partner API, so the
   click happens here the moment the order appears.

   This does NOT approve a visit. By this point a clinician has reviewed the
   patient and written the prescription; the only step automated is pushing an
   order they already approved to the pharmacy. What it does remove is the last
   human look at the order, so a bad address now surfaces as MDI's own Error row
   ("the ship-to and bill-to addresses are invalid") plus the mdi-order-failed
   tag, and is fixed and resubmitted by hand in MDI. That is the client's
   decision, taken 2026-09-23.

   Set MDI_AUTO_SUBMIT_ORDERS=0 to hand the click back to staff. */
const AUTO_SUBMIT = process.env.MDI_AUTO_SUBMIT_ORDERS !== "0";

/* Proof, within one warm instance, that this order already went. MDI repeats
   events, and an order must not be submitted twice. It is a cheap guard, not
   the real one: the `draft` check is, since a submitted order is no longer in
   draft by the time any repeat arrives. */
const submitted = new Set();

/** Pushes a draft order to the pharmacy. Never throws. @returns {Promise<string|null>} */
async function submitDraftOrder(payload) {
  const caseId = payload.case_id;
  const orderId = payload.case_order_id;
  const status = String(safeStatus(payload.order_status) || "").toLowerCase();

  if (!AUTO_SUBMIT || status !== "draft" || !caseId || !orderId) return null;
  if (submitted.has(orderId)) return "already_sent";

  submitted.add(orderId);
  try {
    const r = await mdi(
      `/cases/${encodeURIComponent(caseId)}/orders/${encodeURIComponent(orderId)}/submit`,
      { method: "POST" }
    );
    if (!r.ok) {
      // Let a later event try again; this one may simply have been too early.
      submitted.delete(orderId);
      console.error(`MDI order submit ${orderId} returned ${r.status}`);
      return `submit_failed_${r.status}`;
    }
    console.info(`MDI order ${orderId} sent to the pharmacy`);
    return "sent";
  } catch (e) {
    submitted.delete(orderId);
    console.error(`MDI order submit ${orderId} failed:`, e.message);
    return "submit_error";
  }
}

/* How far along each status is, so the field can't be walked backwards.

   MDI fires events in quick succession and repeats them: approving a case also
   submits the prescription, so `case_approved` and `case_processing` arrive
   three seconds apart, and clicking approve twice more afterwards sent
   `case_approved` again. The last write would otherwise win and the field would
   read "approved" while the card had already moved on.

   The column was already protected by moveOpportunityForward; this gives the
   text field the same one-way rule. The order statuses continue the ladder past
   `completed`, so a late case event can't pull the field back off the pharmacy
   half of the board. `cancelled` ranks highest because it is terminal: nothing
   should overwrite it. An unranked status is written as-is, since we can't place
   it. */
const STATUS_RANK = {
  created: 1,
  waiting: 2,
  assigned: 3,
  support: 3,
  approved: 4,
  processing: 5,
  completed: 6,
  draft: 7,
  received: 8,
  ready: 9,
  shipped: 10,
  delivered: 11,
  cancelled: 12,
};

/** Whether `next` is at least as far along as what the contact already holds. */
function advances(next, contact) {
  const nextRank = STATUS_RANK[String(next).toLowerCase()];
  if (!nextRank) return true; // unrankable, so not ours to judge

  const current = (contact?.customFields || []).find(
    (f) => f.id === SEARCH_FIELD_ID.MDI_ENCOUNTER_STATUS
  );
  const currentRank = STATUS_RANK[String(current?.value ?? current?.fieldValue ?? "").toLowerCase()];
  if (!currentRank) return true; // nothing meaningful there yet

  return nextRank >= currentRank;
}

/* Same guard as ghl-encounter: a status is a short workflow label, so anything
   longer isn't one and is dropped rather than risk carrying content across. */
const STATUS_MAX = 60;
const safeStatus = (v) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s && s.length <= STATUS_MAX ? s : null;
};

const sameBytes = (a, b) => {
  try {
    const x = Buffer.from(a, "hex");
    const y = Buffer.from(b, "hex");
    return x.length === y.length && timingSafeEqual(x, y);
  } catch {
    return false;
  }
};

/**
 * Verify MDI's `Signature` header: hash_hmac('sha256', json_encode(payload), secret).
 *
 * The exact bytes MDI signed are the ideal input, but both Vercel and the local
 * vite shim parse the JSON body before this handler sees it, so `raw` is often
 * gone. Re-serialising is a best effort and can legitimately differ: PHP's
 * json_encode escapes forward slashes, so a payload carrying a URL (several
 * events include `access_link`) would not match a plain JSON.stringify. Both
 * spellings are therefore tried.
 *
 * That imprecision is why the Authorization header is the real gate and the
 * signature is the tamper check on top of it.
 */
function signatureOk(raw, payload, header) {
  if (!SECRET) return true; // not enforcing until a secret is registered
  if (!header) return false;

  const bodies = raw
    ? [raw]
    : [JSON.stringify(payload), JSON.stringify(payload).replace(/\//g, "\\/")];

  return bodies.some((body) =>
    sameBytes(createHmac("sha256", SECRET).update(body).digest("hex"), String(header))
  );
}

/* The contact is found by the case id first, which is the same value MDI calls
   the encounter id and the one we already store per visit. A voucher event
   arrives before any case exists, so it falls back to the patient id. */
/* Case events carry `case_id` and nothing else identifying: no `patient_id`.
   So a case whose id we never stored can't be matched directly, and that is the
   ordinary situation for a returning patient. `latest_mdi_encounter_id` holds
   one value, the encounter we saw at their last intake, so a follow-up
   encounter created afterwards simply isn't in it.

   MDI can close the gap: GET /cases/:id answers in about a second and carries
   the patient. Only called on the miss path, so the common case stays one GHL
   lookup. */
async function patientIdForCase(caseId) {
  const r = await mdi(`/cases/${encodeURIComponent(caseId)}`);
  if (!r.ok) {
    console.warn(`MDI case lookup for ${caseId} returned ${r.status}`);
    return null;
  }
  const c = r.data?.data || r.data;
  return c?.patient_id || c?.patient?.patient_id || c?.patient?.id || null;
}

/** @returns {Promise<{contact: object, stampCaseId: string|null, opportunityId: string|null}|null>} */
async function findContact(payload) {
  const caseId = payload.case_id || payload.encounter_id || null;

  if (caseId) {
    const byCase = await findContactByCustomField(SEARCH_FIELD_ID.LATEST_MDI_ENCOUNTER_ID, caseId);
    if (byCase) return { contact: byCase, stampCaseId: null, opportunityId: null };
  }

  /* Voucher and patient events do carry patient_id; case events don't, so for
     those we ask MDI. */
  const patientId = payload.patient_id || (caseId ? await patientIdForCase(caseId) : null);

  if (patientId) {
    const byPatient = await findContactByCustomField(SEARCH_FIELD_ID.MDI_PATIENT_ID, patientId);
    /* Record the case id we just resolved the hard way, so the next event for
       this same case matches on the first lookup instead of round-tripping to
       MDI again. */
    if (byPatient) return { contact: byPatient, stampCaseId: caseId, opportunityId: null };
  }

  /* Last resort: the card itself. Both lookups above read single-value contact
     fields that a later visit overwrites, and on 2026-09-26 that is exactly
     what happened — a second test reused the contact (GHL upsert matches on
     phone, not only email), replaced both ids, and an approved case could no
     longer be traced to anyone even though its card was sitting in Paid with
     the case id written on it. The encounter on a card is written once and
     never changes, so it outlives the contact's fields. */
  if (!caseId) return null;

  const card = await opportunityForEncounter(caseId);
  if (!card?.contactId) return null;

  const contact = await contactById(card.contactId);
  if (!contact?.id) return null;

  console.info(`MDI webhook: matched case ${caseId} through its card ${card.id}`);
  return { contact, stampCaseId: caseId, opportunityId: card.id };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  /* No blocked() here: this endpoint is called by MDI's servers, not a browser,
     so it has no allowed origin and must not be rate limited per IP. Its own
     secrets are the gate. */
  if (AUTH && !sameBytes(
    createHmac("sha256", "novamdk").update(String(req.headers?.authorization || "")).digest("hex"),
    createHmac("sha256", "novamdk").update(AUTH).digest("hex")
  )) {
    console.warn("Rejected MDI webhook: bad or missing Authorization header");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const raw = typeof req.body === "string"
    ? req.body
    : Buffer.isBuffer(req.body)
      ? req.body.toString("utf8")
      : null;

  let payload = req.body;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      return res.status(400).json({ error: "Malformed JSON" });
    }
  }
  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ error: "Missing payload" });
  }

  if (!signatureOk(raw, payload, req.headers?.signature)) {
    console.warn(`Rejected MDI webhook ${payload.event_type}: signature did not verify`);
    return res.status(401).json({ error: "Bad signature" });
  }

  const event = typeof payload.event_type === "string" ? payload.event_type : "";
  // Proof of arrival, ids only. Without it, "nothing happened" can't distinguish
  // an event MDI never sent from one we silently ignored.
  console.info(`MDI webhook: ${event} case=${payload.case_id || "-"} patient=${payload.patient_id || "-"}`);

  const known = CASE_EVENTS[event] || (ORDER_EVENTS.has(event) ? {} : null);
  if (!known) {
    // A 200 on purpose: an event we don't handle isn't a delivery failure, and
    // a non-200 would put MDI into 24 hours of retries for nothing.
    return res.status(200).json({ ok: true, ignored: event || "unknown" });
  }

  if (!ghlConfigured()) {
    console.warn("GHL env vars missing — MDI webhook not mirrored.");
    return res.status(200).json({ ok: false, skipped: "not_configured" });
  }

  const order = fromOrder(payload);
  const status = known.status || order.status;
  const stage = known.stage || order.stage;
  /* Every status also lands as a tag. The column can only ever show one thing,
     and on this board payment and the clinical decision sit in the same line, so
     a paid card parked past Approved would otherwise hide whether a provider
     had approved it. The tag makes it filterable whatever column it sits in. */
  const tag = known.tag || order.tag;
  // Closes the card rather than advancing it, so it wins over `stage`.
  const lost = Boolean(known.lost);

  /* Ahead of the CRM lookup and independent of it. Getting the order to the
     pharmacy is between us and MDI, and must not be skipped because a patient
     happens to have no GHL contact. */
  const sent = await submitDraftOrder(payload);

  try {
    const found = await findContact(payload);
    const contact = found?.contact || null;
    if (!contact?.id) {
      /* Still a 200: a case we have no contact for is usually a patient created
         directly in MDI rather than through the website, which is not an error
         and must not trigger retries. */
      console.warn(`MDI webhook ${event}: no matching GHL contact`);
      return res.status(200).json({ ok: false, skipped: "no_contact", ...(sent && { order: sent }) });
    }

    /* The tag and the date always land: a repeat or late event is still proof
       the case reached that state, and the date is proof MDI is talking to us.
       Only the single-value status field is held back from regressing. */
    const keepStatus = status && advances(status, contact);
    if (status && !keepStatus) {
      console.info(`MDI webhook ${event}: kept the further-along status, not writing "${status}"`);
    }

    const writes = [
      updateContactFields(contact.id, {
        ...(keepStatus && { [FIELD.MDI_ENCOUNTER_STATUS]: status }),
        ...(found.stampCaseId && { [FIELD.LATEST_MDI_ENCOUNTER_ID]: found.stampCaseId }),
        [FIELD.LAST_MDI_UPDATE_DATE]: clinicStamp(),
      }),
      tag ? tagContact(contact.id, [tag]) : Promise.resolve(null),
    ];

    if (stage || lost) {
      /* The card is matched by the encounter recorded ON it, never by recency.
         "Newest opportunity" was wrong and did real damage: on 2026-09-23 a
         tracking event for a case that has no card at all moved this patient's
         most recent unrelated visit to Shipped. One patient here holds six
         concurrent visits, so guessing is guaranteed to pick the wrong one
         eventually.

         No match means no move. A case we have no card for is usually one
         created inside MDI rather than through the website, and the honest
         response to that is to leave the board alone: the contact still gets
         the status and the tag, so nothing is lost. */
      writes.push(
        (async () => {
          const caseId = payload.case_id || payload.encounter_id || null;

          /* Already identified if the contact was found through its card, which
             saves searching the contact's opportunities for what we just had. */
          let id = found.opportunityId;
          if (!id) {
            const opps = await opportunitiesForContact(contact.id);
            const match = caseId
              ? opps.find((o) => fieldValueOf(o, SEARCH_FIELD_ID.OPPORTUNITY_ENCOUNTER_ID) === caseId)
              : null;
            if (!match?.id) {
              console.warn(
                `MDI webhook ${event}: no opportunity carries case ${caseId || "-"}, board left alone (${opps.length} card(s) on this contact)`
              );
              return null;
            }
            id = match.id;
          }
          return lost ? markOpportunityLost(id) : moveOpportunityForward(id, stage);
        })()
      );
    }

    const results = await Promise.allSettled(writes);
    for (const r of results) {
      if (r.status === "rejected") {
        console.error(`MDI webhook ${event} write failed:`, r.reason?.message, r.reason?.details ?? "");
      }
    }

    return res.status(200).json({
      ok: results.every((r) => r.status === "fulfilled"),
      event,
      contact_id: contact.id,
      ...(sent && { order: sent }),
      ...(lost ? { closed_as: "lost" } : stage && { moved_to: stage }),
    });
  } catch (e) {
    /* Deliberately 200. A failure on our side shouldn't cost MDI 6 retries over
       24 hours; the log is where we find out, and the next event will correct
       the record anyway since these statuses only move forward. */
    console.error(`MDI webhook ${event} failed:`, e.message, e.details ?? "");
    return res.status(200).json({ ok: false, error: "handled" });
  }
}
