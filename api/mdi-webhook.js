import { createHmac, timingSafeEqual } from "node:crypto";
import {
  ghlConfigured,
  findContactByCustomField,
  opportunitiesForContact,
  updateContactFields,
  moveOpportunityForward,
  tagContact,
  clinicStamp,
  SEARCH_FIELD_ID,
  FIELD,
} from "./_ghl.js";

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
   backwards. Cancelled and support deliberately move nothing: an exit is not a
   step, and which column it belongs in is the client's call. */
const CASE_EVENTS = {
  case_created: { status: "created" },
  case_waiting: { status: "waiting", tag: "mdi-waiting" },
  case_assigned_to_clinician: { status: "assigned", stage: "Provider Review", tag: "mdi-in-review" },
  case_processing: { status: "processing", stage: "Pharmacy Processing", tag: "mdi-processing" },
  case_approved: { status: "approved", stage: "Approved", tag: "mdi-approved" },
  case_completed: { status: "completed", stage: "Completed", tag: "mdi-completed" },
  case_cancelled: { status: "cancelled", tag: "mdi-cancelled" },
  case_transferred_to_support: { status: "support", tag: "mdi-support" },
};

const ORDER_EVENTS = new Set([
  "case_order_created",
  "case_order_updated",
  "order_status_changed",
  "order_tracking_number_changed",
]);

/* How far along each status is, so the field can't be walked backwards.

   MDI fires events in quick succession and repeats them: approving a case also
   submits the prescription, so `case_approved` and `case_processing` arrive
   three seconds apart, and clicking approve twice more afterwards sent
   `case_approved` again. The last write would otherwise win and the field would
   read "approved" while the card sat in Pharmacy Processing.

   The column was already protected by moveOpportunityForward; this gives the
   text field the same one-way rule. `cancelled` ranks highest because it is
   terminal: nothing should overwrite it. An unranked status (an order status is
   free text from the pharmacy) is written as-is, since we can't place it. */
const STATUS_RANK = {
  created: 1,
  waiting: 2,
  assigned: 3,
  support: 3,
  approved: 4,
  processing: 5,
  shipped: 6,
  completed: 7,
  cancelled: 8,
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
async function findContact(payload) {
  const caseId = payload.case_id || payload.encounter_id;
  if (caseId) {
    const byCase = await findContactByCustomField(
      SEARCH_FIELD_ID.LATEST_MDI_ENCOUNTER_ID,
      caseId
    );
    if (byCase) return byCase;
  }
  if (payload.patient_id) {
    return findContactByCustomField(SEARCH_FIELD_ID.MDI_PATIENT_ID, payload.patient_id);
  }
  return null;
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

  const orderStatus = safeStatus(payload.order_status);
  const status = known.status || orderStatus;
  /* Shipped is the only order status worth a column of its own; the rest are
     pharmacy progress and stay in Pharmacy Processing. */
  const shipped = Boolean(orderStatus && /ship|fulfil/i.test(orderStatus));
  const stage = known.stage || (shipped ? "Shipped" : null);
  /* Every status also lands as a tag. The column can only ever show one thing,
     and on this board payment and the clinical decision sit in the same line, so
     a paid card parked past Approved would otherwise hide whether a provider
     had approved it. The tag makes it filterable whatever column it sits in. */
  const tag = known.tag || (shipped ? "mdi-shipped" : null);

  try {
    const contact = await findContact(payload);
    if (!contact?.id) {
      /* Still a 200: a case we have no contact for is usually a patient created
         directly in MDI rather than through the website, which is not an error
         and must not trigger retries. */
      console.warn(`MDI webhook ${event}: no matching GHL contact`);
      return res.status(200).json({ ok: false, skipped: "no_contact" });
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
        [FIELD.LAST_MDI_UPDATE_DATE]: clinicStamp(),
      }),
      tag ? tagContact(contact.id, [tag]) : Promise.resolve(null),
    ];

    if (stage) {
      /* The newest opportunity is this visit's. moveOpportunityForward refuses
         to go backwards or to touch a won card, so a repeat patient's older
         visits can't be disturbed by a late event on a newer one. */
      writes.push(
        opportunitiesForContact(contact.id).then((opps) =>
          opps[0]?.id ? moveOpportunityForward(opps[0].id, stage) : null
        )
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
      ...(stage && { moved_to: stage }),
    });
  } catch (e) {
    /* Deliberately 200. A failure on our side shouldn't cost MDI 6 retries over
       24 hours; the log is where we find out, and the next event will correct
       the record anyway since these statuses only move forward. */
    console.error(`MDI webhook ${event} failed:`, e.message, e.details ?? "");
    return res.status(200).json({ ok: false, error: "handled" });
  }
}
