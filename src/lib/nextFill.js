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
export async function nextFillUrl() {
  const { token, pid, release_token: releaseToken } = await portalData({
    resource: "next_fill",
  });

  try {
    if (releaseToken) sessionStorage.setItem("mdi_release_token", releaseToken);
    else sessionStorage.removeItem("mdi_release_token");
    /* Anything left from an earlier visit in this tab belongs to a different
       opportunity. No CRM write is better than one against the wrong visit. */
    for (const key of ["ghl_contact", "ghl_opportunity", "mdi_encounter"]) {
      sessionStorage.removeItem(key);
    }
  } catch { /* private mode */ }

  const params = new URLSearchParams({ token });
  if (pid) {
    params.set("pid", String(pid));
    const product = productsData.find((p) => String(p.id) === String(pid));
    if (product?.name) params.set("product", product.name);
  }
  return `/intake?${params.toString()}`;
}
