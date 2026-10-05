import { portalData } from "./portal";
import { productsData } from "../components/data/products";

/* Opens the next month of a plan the patient has already paid for.
 *
 * The server decides which product that is and hands back a fresh voucher; this
 * only carries the answer to /intake. The pid in the URL is a label, exactly as
 * it is everywhere else: /api/pay works out the entitlement from the portal
 * session again at the payment step, so editing it in the address bar buys
 * nothing.
 *
 * Routed through /intake rather than MDI's own page for the same reason
 * resumeIntake is: that page has no checkout, and the checkout is what records
 * the month against the plan.
 */
export async function nextFillUrl(planId) {
  const {
    token,
    pid,
    release_token: releaseToken,
    contact_id: contactId,
    /* The card the server opened for THIS month, not the plan's own card. */
    opportunity_id: opportunityId,
  } = await portalData({ resource: "next_fill", opportunity_id: planId });

  try {
    if (releaseToken) sessionStorage.setItem("mdi_release_token", releaseToken);
    else sessionStorage.removeItem("mdi_release_token");

    /* Anything left from an earlier visit in this tab belongs to a different
       opportunity, so the old encounter goes. The contact and the card do NOT:
       /intake only ever reads these two back out of session storage, and a
       first visit gets them from the product page, which a later month of a
       plan never sees. Clearing them, which is what this did at first, meant
       the whole month ran with no card on the board and nothing to mark Paid. */
    sessionStorage.removeItem("mdi_encounter");
    if (contactId) sessionStorage.setItem("ghl_contact", contactId);
    else sessionStorage.removeItem("ghl_contact");
    if (opportunityId) sessionStorage.setItem("ghl_opportunity", opportunityId);
    else sessionStorage.removeItem("ghl_opportunity");
  } catch { /* private mode */ }

  const params = new URLSearchParams({ token });
  if (pid) {
    params.set("pid", String(pid));
    const product = productsData.find((p) => String(p.id) === String(pid));
    if (product?.name) params.set("product", product.name);
  }
  return `/intake?${params.toString()}`;
}
