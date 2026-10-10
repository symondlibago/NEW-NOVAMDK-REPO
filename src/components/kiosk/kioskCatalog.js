import { visibleProducts, inCategory } from "../data/products";
import { programsFor, programProductIds, priceValue } from "../data/subscriptions";
import { CONSULTS, CONSULT_ORDER } from "../data/consultations";
import { programItem, productItem } from "../../lib/programCard";
import { stageOf, baseName } from "../../lib/catalog";
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

/* One card per treatment, the same cards /treatments/<goal> shows: programs
   collapse to one card, dose ladders to their starter, and cross-listed products
   follow the category's own. Mirrors TreatmentShop, so keep the two in step. */
export function shelf(category) {
  const products = visibleProducts
    .filter((p) => inCategory(p, category))
    .sort((a, b) => (a.categorySlug === category ? 0 : 1) - (b.categorySlug === category ? 0 : 1));
  const inProgram = programProductIds(category);
  const standalone = new Set(products.filter((p) => !stageOf(p)).map((p) => baseName(p)));
  return [
    ...programsFor(category).map((program) => ({ ...programItem(program), program })),
    ...products
      .filter((p) => !inProgram.has(p.id))
      .filter((p) => !stageOf(p) || (stageOf(p) === "Starter" && !standalone.has(baseName(p))))
      .map(productItem),
  ].map((card) => ({
    ...card,
    needleFree: isNeedleFree(card.product),
    from: card.program?.fromPrice ?? priceValue(card.product),
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
