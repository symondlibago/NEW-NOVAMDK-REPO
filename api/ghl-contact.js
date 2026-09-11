import { ghlConfigured, upsertContact, addContactNote, createVisitOpportunity, INTAKE_STAGE } from "./_ghl.js";
import { blocked } from "./_guard.js";
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (blocked(req, res)) return;

  if (!ghlConfigured()) {
    console.warn("GHL env vars missing (GHL_API_TOKEN / GHL_LOCATION_ID) — skipping contact sync.");
    return res.status(200).json({ ok: false, skipped: "not_configured" });
  }

  try {
    const { patient, treatment, tags, source, note, value, kioskLocation, mdiPatientId, productLine } = req.body || {};
    /* This call is the hand-off: the contact and its opportunity are created a
       beat before the questionnaire opens, so the intake genuinely has not
       started yet. Anyone who never gets further stays parked here, which is
       the drop-off the funnel is meant to show. */
    const stage = INTAKE_STAGE.NOT_STARTED;
    const contact = await upsertContact({ patient, treatment, tags, source, mdiPatientId, productLine, intakeStage: stage });
    // Returned to the client so the payment step can move this exact
    // opportunity to Paid, rather than guessing at it by contact later.
    let opportunityId = null;
    if (contact?.id && treatment) {
      try {
        const { opportunity, created } = await createVisitOpportunity({ contactId: contact.id, treatment, value, source, kioskLocation, productLine, intakeStage: stage });
        opportunityId = opportunity?.id || null;
        if (!created) {
          console.warn(
            `GHL blocked a second opportunity for contact ${contact.id}, so the existing one was updated to "${treatment}" instead. Enable duplicate opportunities on the location to record each visit separately.`
          );
        }
      } catch (e) {
        console.error("GHL opportunity failed:", e.message, e.status === 401 ? "(token missing opportunities.write?)" : "");
      }
    }

    if (contact?.id && note) {
      try {
        await addContactNote(contact.id, note);
      } catch (e) {
        console.error("GHL note failed:", e.message);
      }
    }

    return res.status(200).json({ ok: true, contactId: contact?.id || null, opportunityId });
  } catch (e) {
    console.error("GHL contact sync failed:", e.message, e.details ?? "");
    return res.status(200).json({ ok: false, error: e.message });
  }
}
