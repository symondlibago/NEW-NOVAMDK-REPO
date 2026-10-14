import { portalData } from "./portal";
import { productsForQuestionnaire } from "./portalCatalog";

/* Sends a half-finished intake back through /intake, which is where the
 * checkout lives. MDI's onboarding_url resumes the questionnaire on its own
 * page, with no payment step and no way to release the case afterwards. */
export async function resumeIntakeUrl(draftId) {
  const {
    token,
    questionnaire_id: qid,
    release_token: releaseToken,
    case_id: caseId,
    opportunity_id: opportunityId,
    contact_id: contactId,
    product_id: productId,
  } = await portalData({ resource: "resume", voucher_id: draftId });

  try {
    if (releaseToken) sessionStorage.setItem("mdi_release_token", releaseToken);
    else sessionStorage.removeItem("mdi_release_token");

    /* Whatever this tab was carrying belongs to a different visit, so it all
       goes, and then THIS visit's ids are written back where /intake expects
       to read them.
     *
       The clearing on its own was the right half of the rule and the wrong
       whole: a resumed visit already has a card, and without its id the
       payment released the MDI case and left the card in Intake Submitted with
       its checkout link still set, as if nobody had paid (found 2026-10-14 on
       the first live resume). The server looks the id up from the encounter the
       card was stamped with, so what lands here is this visit's own card or
       nothing at all, never a guess at a neighbouring one. */
    for (const key of ["ghl_contact", "ghl_opportunity", "mdi_encounter"]) sessionStorage.removeItem(key);
    if (contactId) sessionStorage.setItem("ghl_contact", contactId);
    if (opportunityId) sessionStorage.setItem("ghl_opportunity", opportunityId);
  } catch { /* private mode */ }

  const params = new URLSearchParams({ token });

  /* A case means the questionnaire is already finished and only the money is
     outstanding, so /intake opens on the checkout rather than on a
     questionnaire that will just say "you already completed this". The case id
     travels because the release needs it and the iframe, which normally
     announces it, is not being shown. */
  if (caseId) {
    params.set("pay", "1");
    params.set("case", caseId);
  }

  /* The product this visit was actually for, recovered from its CRM card.
   *
   * First, because it is the only one of the three that KNOWS. The catalogue
   * lookup below can only narrow by questionnaire, and a questionnaire is
   * shared by every rung of a ladder, so for a ladder it fell through to the
   * chooser and asked the patient which of their own visits they meant. */
  const products = productsForQuestionnaire(qid);
  const known = productId ? products.find((p) => String(p.id) === String(productId)) : null;

  if (known) {
    params.set("pid", String(known.id));
    params.set("product", known.name);
  } else if (products.length === 1) {
    params.set("pid", String(products[0].id));
    params.set("product", products[0].name);
  } else if (products.length > 1) {
    /* Nothing said which, so the checkout asks. Reached when the card could not
       be found or its name no longer matches the catalogue, which is a renamed
       product rather than a routine case. */
    params.set("qid", qid);
  }
  return `/intake?${params.toString()}`;
}
