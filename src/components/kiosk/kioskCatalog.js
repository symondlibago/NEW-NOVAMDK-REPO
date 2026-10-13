import { visibleProducts, inCategory } from "../data/products";
import { priceValue } from "../data/subscriptions";
import { CONSULTS, CONSULT_ORDER } from "../data/consultations";
import { productItem } from "../../lib/programCard";
import { stageOf, displayTitle } from "../../lib/catalog";
import { GOAL_ART } from "../../lib/goalArt";

/* The five goals in the order the site's nav lists them, with the approved
   blurbs and the goal-card art the treatments page already uses. */
const NAV_ORDER = ["weight-loss", "longevity", "skin-health", "sexual-health", "recovery-wellness"];

export const GOALS = NAV_ORDER.map((slug) => {
  const c = CONSULTS[CONSULT_ORDER.find((k) => CONSULTS[k].goalSlug === slug)];
  return { slug, name: c.short || c.name, tag: c.tag, blurb: c.blurb, art: GOAL_ART[slug] || {} };
});

export const goalBySlug = (slug) => GOALS.find((g) => g.slug === slug);

/* Answers for the quiz's first question, one per goal. */
export const GOAL_ANSWERS = {
  "weight-loss": "Managing my weight",
  "longevity": "Healthy aging and longevity",
  "skin-health": "Healthier-looking skin",
  "sexual-health": "Intimacy and confidence",
  "recovery-wellness": "Recovery and everyday wellness",
};

const isNeedleFree = (product) => !/inject/i.test(product?.dosageForm || "");

/* One card per treatment, the same list the site's nav panel shows.
 *
 * It used to mirror TreatmentShop, which collapses a program into one card for
 * its molecule. On a touchscreen that read as two choices for the whole of
 * weight loss, Semaglutide and Tirzepatide, and the formulations behind them,
 * the sublingual drops among them, could only be found by tapping in. A patient
 * standing at a kiosk should be able to see what they can actually ask for
 * (client, 2026-10-14), so this follows Navbar's TREATMENTS instead: dose rungs
 * collapse to their starter, a repeated name shows once, and nothing collapses
 * into a program. Keep it in step with that list, not with TreatmentShop.
 *
 * Only weight loss changes. It is the one category with programs, so every
 * other shelf already listed its treatments one by one.
 */
export function shelf(category) {
  const seen = new Set();
  return visibleProducts
    .filter((p) => inCategory(p, category))
    // The category's own treatments lead, cross-listed ones follow. Stable, so
    // equals keep catalogue order.
    .sort((a, b) => (a.categorySlug === category ? 0 : 1) - (b.categorySlug === category ? 0 : 1))
    .filter((p) => !stageOf(p) || stageOf(p) === "Starter")
    .filter((p) => {
      const t = displayTitle(p);
      if (seen.has(t)) return false;
      seen.add(t);
      return true;
    })
    .map(productItem)
    .map((card) => ({
      ...card,
      /* The same pill the nav card carries, read off the record rather than
         assumed: it marks the ones sold as a plan. */
      ribbon: card.product.audience || "",
      /* The row prints the dosage form on its own line, so drop it from the
         chips and leave the price there alone. */
      chips: card.chips.filter((c) => c && c !== card.product.dosageForm),
      needleFree: isNeedleFree(card.product),
      from: priceValue(card.product),
    }));
}

/* The quiz only asks about needles where the answer changes something. */
export const hasFormChoice = (category) => new Set(shelf(category).map((c) => c.needleFree)).size > 1;

export const matchesForm = (card, form) =>
  form === "needle-free" ? card.needleFree : form === "injection" ? !card.needleFree : false;

/* The cheapest card's own price chip, so the goal card quotes exactly what the
   category screen does. */
export function startingPrice(category) {
  const priced = shelf(category).filter((c) => c.from);
  if (!priced.length) return "";
  return priced.reduce((a, b) => (b.from < a.from ? b : a)).chips[0];
}
