import { portalData } from "./portal";
import { productsForQuestionnaire } from "./portalCatalog";

/* Sends a half-finished intake back through /intake, which is where the
 * checkout lives. MDI's onboarding_url resumes the questionnaire on its own
 * page, with no payment step and no way to release the case afterwards. */
export async function resumeIntakeUrl(draftId) {
  const { token, questionnaire_id: qid, release_token: releaseToken } = await portalData({
    resource: "resume",
    voucher_id: draftId,
  });

  try {
    if (releaseToken) sessionStorage.setItem("mdi_release_token", releaseToken);
    else sessionStorage.removeItem("mdi_release_token");
    /* Anything left from an earlier visit in this tab belongs to a different
       opportunity. No CRM write is better than one against the wrong visit. */
    for (const key of ["ghl_contact", "ghl_opportunity", "mdi_encounter"]) sessionStorage.removeItem(key);
  } catch { /* private mode */ }

  const params = new URLSearchParams({ token });
  const products = productsForQuestionnaire(qid);
  if (products.length === 1) {
    params.set("pid", String(products[0].id));
    params.set("product", products[0].name);
  } else if (products.length > 1) {
    // Several plans share this intake at different prices, so checkout asks.
    params.set("qid", qid);
  }
  return `/intake?${params.toString()}`;
}
