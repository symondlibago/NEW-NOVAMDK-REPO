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
 * these are states we serve where only part of the catalogue can be dispensed.
 *
 * California is the first, and the cause is the pharmacy rather than the
 * medicine. Two pharmacies fill our orders, and as of 2026-09-26 MediVera is
 * not licensed to operate in California, so nothing they fill can go there.
 * Strive can, but only the formulations on their California list. Everywhere
 * else MediVera covers all 49 remaining states, which is why no other state
 * needs an entry. More states are expected, hence a map rather than a
 * California-shaped special case.
 *
 * The list follows Strive's California list by TREATMENT, not by the exact
 * formulation a card happens to name. Strive fills Semaglutide, Tirzepatide and
 * Sermorelin for California in their own formulations (Glycine/B12 for the
 * first two), so those treatments stay available there even though the cards
 * currently describe MediVera's versions; John is updating the catalogue to
 * match. What stays out is anything Strive does not list for California at all,
 * such as the NAD+ injections, Lipo-C and Glutathione.
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
    45, 46, // Semaglutide + Glycine + B12, initial and refill
    47, 48, // Tirzepatide + Glycine + B12, initial and refill
    13, 14, 15, // Semaglutide sublingual drops (SubMagna), all three doses: Strive ships them here (client, 2026-10-14)
    11, // Sermorelin
    24, 25, // Sermorelin injection and mini troche (Strive, 2026-10-16)
    23, // NAD+ Sublingual Tablet — the sublingual only, not the injections
    26, 27, 28, // Low-Dose Naltrexone, all three doses
    29, // Luminance Brightening Cream
    30, 31, 32, 33, 34, // Olympus, Olympus +, Olympus Peak, Olympus Max, Olympus Max Peak
    38, 39, // Bremelanotide mini troche and nasal spray; the injection can't ship here (table below)
    44, 35, 36, // Euphoria Cream O (44 is the live one, 35 the older card) and Euphoria Cream S
  ],
};

/* States a product can't ship to, by product id (client's pharmacy table,
 * 2026-10-13, and Strive's confirmed list via Erin, 2026-10-16, which leaves
 * NAD+ tablets, LDN, the Olympus line and Luminance open in all 50 states). The other way round from STATE_PRODUCTS: the table names a
 * few states per product, so this lists what is ruled out. California repeats
 * where STATE_PRODUCTS already leaves the product out, so each row reads as the
 * table does. A product with no row is limited only by the rules above.
 */
const NO_AR_IN_SC = ["Arkansas", "Indiana", "South Carolina"];
const NO_AR_CA_IN_SC = ["Arkansas", "California", "Indiana", "South Carolina"];
export const PRODUCT_NO_SHIP = {
  1: NO_AR_IN_SC, 2: NO_AR_IN_SC, 3: NO_AR_IN_SC, 4: NO_AR_IN_SC, // Semaglutide injection
  45: NO_AR_IN_SC, 46: NO_AR_IN_SC,
  5: NO_AR_IN_SC, 6: NO_AR_IN_SC, 7: NO_AR_IN_SC, // Tirzepatide injection
  8: NO_AR_IN_SC, 9: NO_AR_IN_SC, 10: NO_AR_IN_SC, 47: NO_AR_IN_SC, 48: NO_AR_IN_SC,
  13: NO_AR_IN_SC, 14: NO_AR_IN_SC, 15: NO_AR_IN_SC, // Semaglutide sublingual drops (Strive, 2026-10-14)
  24: NO_AR_IN_SC, 25: NO_AR_IN_SC, // Sermorelin injection and mini troche
  16: NO_AR_CA_IN_SC, 18: NO_AR_CA_IN_SC, 19: NO_AR_CA_IN_SC, 20: NO_AR_CA_IN_SC, // NAD+ injection (503A)
  17: NO_AR_CA_IN_SC, // Glutathione injection (503A)
  37: NO_AR_CA_IN_SC, // Bremelanotide injection
  38: NO_AR_IN_SC, 39: NO_AR_IN_SC, // Bremelanotide mini troche and nasal spray (Strive, 2026-10-16)
  44: NO_AR_IN_SC, 35: NO_AR_IN_SC, 36: NO_AR_IN_SC, // Euphoria Cream O and S (Strive, 2026-10-16)
  12: ["California"], // Lipo-C (MediVera)
};

/** Whether a product can be dispensed to a state. Unknown state means yes. */
export function availableInState(state, productId) {
  const name = String(state || "").trim();
  if ((PRODUCT_NO_SHIP[Number(productId)] || []).includes(name)) return false;
  const allowed = STATE_PRODUCTS[name];
  if (!allowed) return true;
  return allowed.includes(Number(productId));
}

const ABBR = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA", Colorado: "CO", Connecticut: "CT",
  Delaware: "DE", "District of Columbia": "DC", Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID",
  Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME",
  Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO",
  Montana: "MT", Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM",
  "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR",
  Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN",
  Texas: "TX", Utah: "UT", Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV",
  Wisconsin: "WI", Wyoming: "WY",
};

/** Every state by name, A to Z, for pickers (the /start quiz). */
export const STATE_NAMES = Object.keys(ABBR);

/** The states a product can't be sent to, as postal codes in A to Z order,
 *  for the line under a product's description. Leaves out BLOCKED_STATES,
 *  which no treatment reaches. */
export function unavailableStates(productId) {
  const id = Number(productId);
  const out = new Set(PRODUCT_NO_SHIP[id] || []);
  for (const [name, allowed] of Object.entries(STATE_PRODUCTS)) if (!allowed.includes(id)) out.add(name);
  return [...out].map((n) => ABBR[n] || n).sort();
}
