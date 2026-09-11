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
