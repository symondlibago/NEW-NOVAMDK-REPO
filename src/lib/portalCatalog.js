import { productsData, isHidden } from "../components/data/products";
import { PROGRAMS, programsFor } from "../components/data/subscriptions";
import { baseName, displayTitle } from "./catalog";
import { productPath } from "./slug";

/* Matching MDI's records to our catalogue, so the portal can show a real
 * treatment name and photo instead of "Visit #2".
 *
 * Two signals, in order of trust:
 *
 *   1. The prescription name ("SEMAGLUTIDE/CYANOCOBALAMIN") — what was actually
 *      dispensed. Exact for this visit.
 *   2. The questionnaire the visit came from — the intake they filled in. Only
 *      as precise as the intake, and several products share one.
 *
 * Hidden products are skipped throughout. Ozempic, Wegovy, Mounjaro and Zepbound
 * are branded entries we don't sell; they share the semaglutide/tirzepatide
 * questionnaires with the compounded products we DO sell, and being first in the
 * catalogue file they used to win the lookup — a patient on compounded
 * semaglutide saw an Ozempic pen. */

const sellable = productsData.filter((p) => !isHidden(p));

/* Products that roll up into a subscription program are shown on the shop as one
 * card — "Semaglutide", not "Semaglutide/Cyanocobalamin (B12) - 1 mL vial". The
 * portal follows the same rule so a treatment looks identical in both places,
 * and it reuses programsFor() rather than re-deriving, which is what keeps the
 * two from drifting. That helper takes the image from the program's Starter
 * rung, which is the one the client asked to represent each treatment. */
const programByProductId = new Map();
for (const category of new Set(PROGRAMS.map((p) => p.category))) {
  for (const program of programsFor(category)) {
    for (const blend of program.blends) {
      for (const p of blend.products) {
        if (!programByProductId.has(p.id)) programByProductId.set(p.id, program);
      }
    }
  }
}

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

/* Which product a later rung climbed from.
 *
 * A ladder points forwards through nextRung, and this is the way back. Built
 * over the WHOLE catalogue rather than `sellable`, because the rungs in the
 * middle of a ladder are exactly the ones hidden from the shop. */
const climbedFrom = new Map();
for (const p of productsData) {
  if (p.nextRung) climbedFrom.set(Number(p.nextRung), p);
}
function ladderBase(product) {
  let at = product;
  /* Bounded, so a nextRung loop introduced by mistake cannot spin here. */
  for (let step = 0; step < 20; step++) {
    const below = climbedFrom.get(Number(at.id));
    if (!below) break;
    at = below;
  }
  return at;
}

const byQuestionnaire = new Map();
for (const p of sellable) {
  if (p.questionnaireId && !byQuestionnaire.has(p.questionnaireId)) {
    byQuestionnaire.set(p.questionnaireId, p);
  }
}
/* Then the hidden rungs, each resolved to the product it climbed from.
 *
 * Month 2 and month 3 of a plan are answered on the Maintenance questionnaire,
 * which belongs only to a hidden product, so until 2026-10-06 those visits
 * matched nothing at all: the portal showed "Visit #4" with the generic vial
 * beside month 1's "Semaglutide" with its own photo, for one treatment. The
 * client's rule is that every month of a treatment looks the same, and the
 * Starter rung is what represents it, so the rung borrows its base.
 *
 * Sellable products are loaded first and win, so this only ever fills a gap. */
for (const p of productsData) {
  if (!p.questionnaireId || byQuestionnaire.has(p.questionnaireId)) continue;
  const base = ladderBase(p);
  if (base !== p && !isHidden(base)) byQuestionnaire.set(p.questionnaireId, base);
}

/* Catalogue names carry dose and pack detail the prescription doesn't
 * ("Semaglutide/Cyanocobalamin (B12) - 1 mL vial (2 mg)" vs
 * "SEMAGLUTIDE/CYANOCOBALAMIN"), so this is a prefix match, not equality. The
 * shortest match wins: it's the least dose-specific, and MDI doesn't tell us
 * which rung was dispensed anyway. */
function matchByName(name) {
  const needle = norm(name);
  if (needle.length < 4) return null;

  let best = null;
  for (const p of sellable) {
    const hay = norm(baseName(p));
    if (!hay.startsWith(needle) && !needle.startsWith(hay)) continue;
    if (!best || hay.length < norm(baseName(best)).length) best = p;
  }
  return best;
}

/* Used when a visit predates the current catalogue, or came from a questionnaire
 * we never listed — real for older sandbox cases, and possible in production
 * whenever MDI retires an intake. */
export const FALLBACK_IMAGE = "/products/peptides.avif";

export function treatmentFor(questionnaireId, treatmentName = null) {
  const product = matchByName(treatmentName) || (questionnaireId ? byQuestionnaire.get(questionnaireId) : null);

  if (!product) {
    // Falls back to MDI's own wording rather than nothing, so an unmatched
    // treatment is still named — just not linked or illustrated.
    return {
      name: treatmentName || null,
      category: null,
      image: FALLBACK_IMAGE,
      path: "/treatments",
      known: false,
    };
  }

  const program = programByProductId.get(product.id) || null;
  return {
    name: program ? program.name : displayTitle(product),
    category: product.categoryName || null,
    image: program?.image || product.img || FALLBACK_IMAGE,
    path: productPath(product),
    known: true,
  };
}

/* Every product an intake could have been started for. Several share one
 * questionnaire at different prices (the NAD+ Injection rungs, for instance),
 * which is why a resumed intake can't always be priced without asking. */
export const productsForQuestionnaire = (questionnaireId) =>
  questionnaireId ? sellable.filter((p) => p.questionnaireId === questionnaireId) : [];
