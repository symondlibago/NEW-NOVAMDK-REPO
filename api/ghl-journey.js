import {
  ghlConfigured,
  tagContact,
  updateContactFields,
  updateOpportunityFields,
  clinicStamp,
  INTAKE_STAGE,
  FIELD,
} from "./_ghl.js";
import { blocked, verifyReleaseToken } from "./_guard.js";

/* The browser names a milestone; the server decides what that means. `stage`
   lands on both the contact and the visit's opportunity: the contact copy is
   what workflows trigger on, the opportunity copy is what survives a repeat
   visit and so is the only honest basis for counting drop-off. */
const MILESTONES = {
  "intake-started": {
    tags: ["intake-started"],
    stage: INTAKE_STAGE.STARTED,
    // Only meaningful on the contact: an opportunity already carries its own
    // creation timestamp, which is the same moment to within a second or two.
    stampField: FIELD.INTAKE_STARTED_DATE,
  },
  "not-eligible": {
    tags: ["not-eligible"],
    fields: { eligibility_status: "not_eligible" },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (blocked(req, res)) return;

  if (!verifyReleaseToken(req.body?.release_token)) {
    console.warn("Rejected /api/ghl-journey: missing or expired release token");
    return res.status(403).json({ error: "Forbidden" });
  }

  const contactId = req.body?.contact_id;
  const milestone = MILESTONES[req.body?.milestone];
  if (!contactId || !milestone) {
    console.warn(`Rejected /api/ghl-journey: unknown milestone "${req.body?.milestone}"`);
    return res.status(400).json({ error: "contact_id and a known milestone are required" });
  }

  if (!ghlConfigured()) {
    console.warn("GHL env vars missing — skipping journey write.");
    return res.status(200).json({ ok: false, skipped: "not_configured" });
  }

  const opportunityId = req.body?.opportunity_id || null;
  const contactFields = {
    ...(milestone.fields || {}),
    ...(milestone.stage && { [FIELD.INTAKE_STAGE]: milestone.stage }),
    ...(milestone.stampField && { [milestone.stampField]: clinicStamp() }),
  };

  /* Settled independently: a failed field write shouldn't cost us the tag, and
     the tag is what the smart lists filter on. */
  const writes = [
    tagContact(contactId, milestone.tags || []),
    updateContactFields(contactId, contactFields),
    /* The treatment rides along because GHL wants a name on an opportunity
       PUT. It's the same value the record was created with, so it reads as a
       no-op rather than a rename. */
    milestone.stage && opportunityId
      ? updateOpportunityFields(
          opportunityId,
          { [FIELD.INTAKE_STAGE]: milestone.stage },
          { name: req.body?.treatment }
        )
      : Promise.resolve(null),
  ];

  const [tagged, updated, opportunity] = await Promise.allSettled(writes);

  for (const [what, result] of [["tags", tagged], ["fields", updated], ["opportunity", opportunity]]) {
    if (result.status === "rejected") {
      console.error(`GHL journey ${what} failed:`, result.reason?.message, result.reason?.details ?? "");
    }
  }

  // Never fail a patient's intake over a CRM write.
  return res.status(200).json({
    ok: [tagged, updated, opportunity].every((r) => r.status === "fulfilled"),
    milestone: req.body.milestone,
  });
}
