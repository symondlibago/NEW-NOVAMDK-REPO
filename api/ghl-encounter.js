import {
  ghlConfigured,
  updateContactFields,
  updateOpportunityFields,
  clearOpportunityFields,
  createVisitOpportunity,
  moveOpportunityForward,
  STAGE,
  tagContact,
  clinicStamp,
  INTAKE_STAGE,
  FIELD,
  OPP_FIELD,
  CHECKOUT_LINK,
} from "./_ghl.js";
import { blocked, verifyReleaseToken } from "./_guard.js";
import { isPlanMonthCard } from "./_fills.js";

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

/* Set on an unpaid visit, emptied on a paid one.
 *
 * Emptied rather than left alone because most patients pay at the ID screen and
 * arrive here already paid: a card must not keep a "finish paying" link from an
 * earlier attempt on the same visit.
 *
 * Never fatal. This is the one field here that may not exist in the location
 * yet, and GoHighLevel rejects a PUT naming a key it does not know; a failure
 * must not cost this card its stage move. The log line names the field to go
 * and create. */
const writeCheckoutLink = (opportunityId, paid) => {
  if (!opportunityId) return Promise.resolve(null);
  const write = paid
    ? clearOpportunityFields(opportunityId, [OPP_FIELD.CHECKOUT_LINK])
    : updateOpportunityFields(opportunityId, { [OPP_FIELD.CHECKOUT_LINK]: CHECKOUT_LINK });
  return write.catch((e) => {
    console.error(
      `GHL checkout_link ${paid ? "clear" : "write"} failed for opportunity ${opportunityId}:`,
      e.message,
      e.details ?? ""
    );
    return null;
  });
};

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

  // Proof of arrival. Without it, "no log line" can't distinguish an event MDI
  // never sent from one this function silently dropped.
  console.info(`GHL encounter received: ${encounterId} for contact ${contactId}`);

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
  /* "complete" means submitted AND paid. The questionnaire often finishes before
     the checkout opens, so an unpaid submission keeps its current stage and
     /api/pay writes "complete" once the card clears. The intake-submitted tag
     still lands either way, which is what shows the drop-off at payment. */
  /* A later month of a plan is settled whatever the browser reports.
   *
   * The browser sends paid:false for one, and truthfully so from where it
   * stands: no card was charged, because the patient bought the months upfront.
   * But this visit is not waiting on money, so taking that at face value left
   * the card with intake_stage "started" and a "finish paying" link, and the
   * unpaid-intake reminder would then chase someone who owes nothing.
   *
   * It cannot be deferred to the prepaid confirmation either: whichever of this
   * and /api/pay lands second wins, and this one often does. So the rule is
   * applied here too, from the one definition in _fills.js. */
  const paid = req.body?.paid === true || isPlanMonthCard(req.body?.treatment);

  /* Settled independently. The contact mirror and the per-visit record are
     useful on their own, so one failing must not cost us the other. */
  const [contactWrite, opportunityWrite, tagWrite] = await Promise.allSettled([
    updateContactFields(contactId, {
      [FIELD.LATEST_MDI_ENCOUNTER_ID]: encounterId,
      [FIELD.LAST_MDI_UPDATE_DATE]: clinicStamp(),
      ...(paid && { [FIELD.INTAKE_STAGE]: INTAKE_STAGE.COMPLETE }),
      ...(status && { [FIELD.MDI_ENCOUNTER_STATUS]: status }),
    }),
    /* The card moves to Intake Submitted after its field write, forward only,
       so a new patient who already paid at the ID screen stays in Paid. An
       unpaid returning patient lands in Intake Submitted and stays there, which
       is the drop-off at payment the board is meant to show. */
    opportunityId && !additional
      ? updateOpportunityFields(
          opportunityId,
          {
            [FIELD.MDI_ENCOUNTER_ID]: encounterId,
            ...(paid && { [FIELD.INTAKE_STAGE]: INTAKE_STAGE.COMPLETE }),
          },
          { name: treatment }
        )
          .catch((e) => {
            console.error("GHL encounter opportunity fields failed:", e.message, e.details ?? "");
            return null;
          })
          .then(async (r) => {
            /* Before the stage move, deliberately. Intake Submitted is what a
               recovery workflow triggers on, so the link has to be on the card
               by the time it arrives there. */
            await writeCheckoutLink(opportunityId, paid);
            await moveOpportunityForward(opportunityId, STAGE.INTAKE_SUBMITTED);
            return r;
          })
      : createVisitOpportunity({
          contactId,
          treatment,
          value: req.body?.value,
          source: req.body?.source,
          kioskLocation: req.body?.kioskLocation,
          productLine: req.body?.productLine,
          intakeStage: paid ? INTAKE_STAGE.COMPLETE : INTAKE_STAGE.STARTED,
          mdiEncounterId: encounterId,
        }).then(async (r) => {
          await writeCheckoutLink(idOf(r), paid);
          await moveOpportunityForward(idOf(r), STAGE.INTAKE_SUBMITTED);
          return r;
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
