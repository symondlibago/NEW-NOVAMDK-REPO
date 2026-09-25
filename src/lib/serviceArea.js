/* The states Nova MDK isn't licensed in.
 *
 * Single source for both the Terms copy and the intake's state picker. These
 * used to be two independent things — a sentence of prose in the legal page and
 * a full 51-entry dropdown in the modal — so they drifted, and a patient in a
 * blocked state could fill in the whole form and reach checkout before anything
 * stopped them. Anything that names these states should read them from here.
 */

export const BLOCKED_STATES = ["Alaska", "Mississippi", "New Jersey"];

export const isBlockedState = (state) =>
  BLOCKED_STATES.includes(String(state || "").trim());

/** "Alaska, Mississippi, and New Jersey" — for prose, so the Terms stay in step
 *  with the list without anyone remembering to retype the sentence. */
export function blockedStatesPhrase(list = BLOCKED_STATES) {
  if (list.length === 0) return "";
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}`;
}

/* Which treatments a state allows, by product id.
 *
 * Separate from BLOCKED_STATES above: those are states we can't serve at all,
 * these are states we serve where the pharmacy can only dispense part of the
 * catalogue. California is the first, from Strive's availability list
 * (2026-09-26); more states are expected, which is why this is a map rather
 * than a California-shaped special case.
 *
 * A state listed here is limited to EXACTLY these ids. Anything absent counts
 * as unavailable, so adding a product makes it unavailable in a restricted
 * state until someone says otherwise. That is the deliberate direction to fail
 * in: wrongly blocking a product costs a sale, wrongly allowing one means a
 * prescription that can't be filled where the patient lives. A state with no
 * entry is unrestricted.
 */
export const STATE_PRODUCTS = {
  California: [
    1, 2, // Semaglutide, both doses
    5, 6, 7, // Tirzepatide, all three doses
    11, // Sermorelin Nasal Spray
    23, // NAD+ Sublingual Tablet — the sublingual only; the injections are not listed
    26, 27, 28, //  Low-Dose Naltrexone, all three doses
    29, // Luminance Brightening Cream
    32, // Olympus Peak
    37, 39, // Bremelanotide, injection and nasal spray
  ],
};

/** Whether a product can be dispensed to a state. Unknown state means yes. */
export function availableInState(state, productId) {
  const allowed = STATE_PRODUCTS[String(state || "").trim()];
  if (!allowed) return true;
  return allowed.includes(Number(productId));
}
