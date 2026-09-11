import { ghlConfigured, markOpportunityPaid } from "./_ghl.js";
import { blocked, verifyReleaseToken } from "./_guard.js";

/* Moves a visit's opportunity into the Paid stage after checkout.
 *
 * Guarded by the same release token as /api/mdi-release: payment is still a
 * placeholder decided in the browser, so without this anyone could mark any
 * opportunity Paid by POSTing an id. That guard only bites once
 * API_SIGNING_SECRET is set — see api/_guard.js. */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (blocked(req, res)) return;

  if (!verifyReleaseToken(req.body?.release_token)) {
    console.warn("Rejected /api/ghl-paid: missing or expired release token");
    return res.status(403).json({ error: "Forbidden" });
  }

  const opportunityId = req.body?.opportunity_id;
  if (!opportunityId) {
    return res.status(400).json({ error: "opportunity_id is required" });
  }

  if (!ghlConfigured()) {
    console.warn("GHL env vars missing — skipping Paid stage move.");
    return res.status(200).json({ ok: false, skipped: "not_configured" });
  }

  try {
    const opportunity = await markOpportunityPaid(opportunityId);
    return res.status(200).json({ ok: true, opportunityId: opportunity?.id || opportunityId });
  } catch (e) {
    // Never fail the patient's checkout over a CRM write — log and move on.
    console.error("GHL Paid move failed:", e.message, e.details ?? "");
    return res.status(200).json({ ok: false, error: e.message });
  }
}
