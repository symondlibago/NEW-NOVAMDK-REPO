import {
  ghlConfigured,
  updateContactFields,
  updateOpportunityFields,
  createVisitOpportunity,
  tagContact,
  clinicStamp,
  INTAKE_STAGE,
  FIELD,
} from "./_ghl.js";
import { blocked, verifyReleaseToken } from "./_guard.js";

/* MDI's case statuses are workflow labels ("pending", "approved"), not clinical
   content, which is what makes them safe to mirror into the CRM. Anything
   longer than a short label isn't a status, so it's dropped rather than risk
   carrying a questionnaire answer or a provider note across with it. */
const STATUS_MAX = 60;
const safeStatus = (v) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s && s.length <= STATUS_MAX ? s : null;
};

const idOf = (result) => result?.opportunity?.id || result?.id || null;

/* Distinct from "intake-started", which fires when the questionnaire opens.
   This one means they reached the end and MDI created the encounter, so the
   two together give the drop-off between starting and finishing. */
const SUBMITTED_TAG = "intake-submitted";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (blocked(req, res)) return;

  if (!verifyReleaseToken(req.body?.release_token)) {
    console.warn("Rejected /api/ghl-encounter: missing or expired release token");
    return res.status(403).json({ error: "Forbidden" });
  }

  const contactId = req.body?.contact_id;
  const encounterId = typeof req.body?.encounter_id === "string" ? req.body.encounter_id.trim() : "";
  if (!contactId || !encounterId) {
    return res.status(400).json({ error: "contact_id and encounter_id are required" });
  }

  if (!ghlConfigured()) {
    console.warn("GHL env vars missing — skipping encounter write.");
    return res.status(200).json({ ok: false, skipped: "not_configured" });
  }

  const opportunityId = req.body?.opportunity_id || null;
  const treatment = req.body?.treatment || null;
  const status = safeStatus(req.body?.status);
  /* A second encounter inside one session is a genuinely new visit, so it earns
     its own opportunity rather than displacing the first one's id. The ordinary
     case is the opposite: this session already opened an opportunity at the
     email step, and the encounter belongs to that one. */
  const additional = req.body?.additional === true;

  /* Settled independently. The contact mirror and the per-visit record are
     useful on their own, so one failing must not cost us the other. */
  const [contactWrite, opportunityWrite, tagWrite] = await Promise.allSettled([
    updateContactFields(contactId, {
      [FIELD.LATEST_MDI_ENCOUNTER_ID]: encounterId,
      [FIELD.LAST_MDI_UPDATE_DATE]: clinicStamp(),
      // MDI has the questionnaire, so this visit got all the way through.
      [FIELD.INTAKE_STAGE]: INTAKE_STAGE.COMPLETE,
      ...(status && { [FIELD.MDI_ENCOUNTER_STATUS]: status }),
    }),
    opportunityId && !additional
      ? updateOpportunityFields(
          opportunityId,
          {
            [FIELD.MDI_ENCOUNTER_ID]: encounterId,
            [FIELD.INTAKE_STAGE]: INTAKE_STAGE.COMPLETE,
          },
          { name: treatment }
        )
      : createVisitOpportunity({
          contactId,
          treatment,
          value: req.body?.value,
          source: req.body?.source,
          kioskLocation: req.body?.kioskLocation,
          productLine: req.body?.productLine,
          intakeStage: INTAKE_STAGE.COMPLETE,
          mdiEncounterId: encounterId,
        }),
    // Additive, so it never disturbs the tags the lead arrived with.
    tagContact(contactId, [SUBMITTED_TAG]),
  ]);

  for (const [what, result] of [["contact", contactWrite], ["opportunity", opportunityWrite], ["tag", tagWrite]]) {
    if (result.status === "rejected") {
      console.error(
        `GHL encounter ${what} write failed:`,
        result.reason?.message,
        result.reason?.details ?? ""
      );
    }
  }

  // Never fail a patient's intake over a CRM write.
  return res.status(200).json({
    ok: [contactWrite, opportunityWrite, tagWrite].every((r) => r.status === "fulfilled"),
    encounter_id: encounterId,
    // Where the encounter actually landed, which differs from what was sent
    // when a repeat visit spawned a fresh record.
    opportunity_id: idOf(opportunityWrite.value) || opportunityId,
  });
}
