import { blocked, cleanGhlId, readReleaseToken, releaseTokensEnabled, verifyReleaseToken } from './_guard.js';
import { mdi, mdiConfigured, listOf } from './_mdi.js';
import { PRICES } from './_prices.js';
import { stripe, stripeEnabled, findHoldWhere } from './_stripe.js';
import { ghlConfigured, opportunityById, ownsVisit, stageIdNamed } from './_ghl.js';

const PAID_STAGE_NAME = process.env.GHL_PAID_STAGE_NAME || 'Paid';

/* Takes the hold off a submitted case so it reaches a provider.
 *
 * Security fix, 2026-10-24. This used to release any case id for anyone with a
 * release token, and anyone could get one, so a case could reach a provider and
 * the pharmacy without being paid for. The only payment check was in the
 * browser. Now, before releasing, the server confirms:
 *
 * 1. The case is this patient's: it is one of their own vouchers' cases, which
 *    also says which questionnaire it was.
 * 2. Something pays for THAT questionnaire. A Stripe hold placed for this
 *    patient, for a product with the same questionnaire, and not already
 *    spent on another case; or a prepaid or renewing plan month the portal
 *    claimed when it minted this token; or, only while Stripe is switched off,
 *    the patient's own card already moved to Paid by Kurv or NMI.
 *
 * A case MDI has not linked to its voucher yet, or a hold the CRM has not
 * caught up with, answers 409 and the intake page tries again. */

// Null for the few products sold without a questionnaire, which then match only a case that has none.
function questionnaireOf(pid) {
  return PRICES[pid]?.questionnaireId || null;
}

async function caseQuestionnaire(patientId, caseId) {
  const v = await mdi(`/patients/${encodeURIComponent(patientId)}/vouchers`);
  if (!v.ok) {
    console.error('mdi-release voucher lookup failed:', v.status);
    return null;
  }
  const voucher = listOf(v.data).find((x) => String(x.case_id || '') === caseId);
  return voucher ? { questionnaireId: voucher.partner_questionnaire_id || null } : null;
}

/** The Stripe hold paying for this case, `true` for a plan month or a Kurv or
 *  NMI payment, or null when nothing does. */
async function paymentFor(visit, caseId, questionnaireId, opportunityId) {
  if (visit.kind === 'plan') {
    return questionnaireOf(visit.productId) === questionnaireId ? true : null;
  }

  if (stripeEnabled()) {
    const fits = (p) =>
      questionnaireOf(p.metadata?.product_id) === questionnaireId &&
      (!p.metadata?.case_id || p.metadata.case_id === caseId);
    const hold = await findHoldWhere(
      (p) =>
        fits(p) &&
        (p.metadata?.patient_id === visit.patientId ||
          // Placed before holds carried the patient: matched by its card, then checked below.
          (!p.metadata?.patient_id && opportunityId && p.metadata?.opportunity_id === opportunityId)),
      `case ${caseId}`
    );
    if (!hold) return null;
    if (hold.metadata?.patient_id) return hold;
    const theirs = await ownsVisit(visit.patientId, {
      contactId: hold.metadata?.contact_id,
      opportunityId: hold.metadata?.opportunity_id,
    });
    return theirs ? hold : null;
  }

  if (!ghlConfigured() || !opportunityId) return null;
  const opp = await opportunityById(opportunityId);
  const contactId = opp?.contactId || opp?.contact?.id;
  if (!opp || !(await ownsVisit(visit.patientId, { contactId, opportunityId }))) return null;
  const paidStage = await stageIdNamed(PAID_STAGE_NAME);
  return opp.status === 'won' || (paidStage && opp.pipelineStageId === paidStage) ? true : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!mdiConfigured()) {
    console.error('MDI credentials missing — set MDI_CLIENT_ID and MDI_CLIENT_SECRET.');
    return res.status(500).json({ error: 'MDI not configured' });
  }

  if (blocked(req, res)) return;

  if (!verifyReleaseToken(req.body?.release_token)) {
    console.warn('Rejected /api/mdi-release: missing or expired release token');
    return res.status(403).json({ error: 'Forbidden' });
  }

  const caseId = typeof req.body?.case_id === 'string' ? req.body.case_id.trim() : '';
  if (!/^[A-Za-z0-9-]{8,64}$/.test(caseId)) {
    return res.status(400).json({ error: 'case_id is required' });
  }

  try {
    let hold = null;
    /* A local dev server without API_SIGNING_SECRET mints no tokens, so there
       the old release-on-request behaviour stands. */
    if (releaseTokensEnabled()) {
      const visit = readReleaseToken(req.body.release_token);
      if (!visit?.patientId) {
        console.warn('Rejected /api/mdi-release: the token names no patient');
        return res.status(403).json({ error: 'Forbidden' });
      }

      const found = await caseQuestionnaire(visit.patientId, caseId);
      if (!found) {
        console.warn(`mdi-release: case ${caseId} is not among patient ${visit.patientId}'s vouchers yet`);
        return res.status(409).json({ error: 'not_ready' });
      }

      const paid = await paymentFor(visit, caseId, found.questionnaireId, cleanGhlId(req.body?.opportunity_id));
      if (!paid) {
        console.warn(`mdi-release: nothing pays for case ${caseId} (patient ${visit.patientId}); left on hold`);
        return res.status(409).json({ error: 'not_paid' });
      }
      if (paid !== true) hold = paid;
    }

    const released = await mdi(`/cases/${encodeURIComponent(caseId)}/status`, {
      method: 'PATCH',
      body: { hold_status: false },
    });
    if (!released.ok) {
      console.error('MDI Release Rejected:', released.status);
      return res.status(502).json({ error: 'Release failed' });
    }

    /* The hold is spent on this case, so it can't release a second one. Best
       effort: the case is already with a provider either way. */
    if (hold) {
      const tied = await stripe(`/payment_intents/${hold.id}`, { body: { metadata: { case_id: caseId } } });
      if (!tied.ok) console.warn(`mdi-release could not tie hold ${hold.id} to case ${caseId}: ${tied.status}`);
    }

    return res.status(200).json({ released: true, case_id: caseId });
  } catch (error) {
    console.error('Internal API Error:', error.message);
    return res.status(500).json({ error: 'Internal error' });
  }
}
