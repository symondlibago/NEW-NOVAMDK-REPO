import { productsData, isHidden } from "./products";
export const PROGRAMS = [
  {
    slug: "tirzepatide",
    category: "weight-loss",
    name: "Tirzepatide",
    tagline: "Dual GIP/GLP-1",
    blurb: "Tirzepatide acts on GIP and GLP-1 receptors. Your provider will determine whether it is appropriate.",
    blends: [
      { slug: "niacinamide", name: "With Niacinamide", note: "Supports metabolic function", ids: [5, 6, 7] },
      { slug: "glycine", name: "With Glycine", note: "Helps support muscle retention", ids: [8, 9, 10] },
    ],
  },
  {
    slug: "semaglutide",
    category: "weight-loss",
    name: "Semaglutide",
    tagline: "GLP-1 receptor agonist",
    blurb: "A GLP-1 treatment option available in the formulations shown below.",
    blends: [
      { slug: "b12", name: "With B12", note: "Contains vitamin B12", ids: [1, 2] },
      { slug: "glycine", name: "With Glycine", note: "Helps support muscle retention", ids: [3, 4] },
      { slug: "sublingual", name: "Sublingual Drops", note: "No needles required", ids: [13, 14, 15] },
    ],
  },
];

const byId = (id) => productsData.find((p) => p.id === id);
const spec = (product, label) => product?.specs?.find((s) => s.label === label)?.value || "";

/** "$179" -> 179. Returns null for "$0" / unpriced items so they can't win a min(). */
export const priceValue = (product) => {
  const n = Number(String(product?.price || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** The dose step shown on the ladder, taken from the trailing name suffix. */
export const doseStage = (product) => {
  const m = String(product?.name || "").match(/—\s*(Starter|Mid-Dose|Maintenance)\s*$/);
  return m ? m[1] : "Standard";
};

export const doseSize = (product) => product?.size || "";

export const doseWindow = (product) => {
  const m = spec(product, "Days Supply").match(/\(([^)]+)\)/);
  return m ? m[1].trim() : "";
};

export const refillCadence = (product) => {
  const days = Number((spec(product, "Days Supply").match(/(\d+)\s*days?/i) || [])[1]);
  if (!Number.isFinite(days) || days <= 0) return "";
  if (days % 7 === 0) {
    const weeks = days / 7;
    return weeks === 1 ? "every week" : `every ${weeks} weeks`;
  }
  return `every ${days} days`;
};

/** Resolve a blend's ids into visible products, in ladder order. */
const resolveBlend = (blend) => {
  const products = blend.ids.map(byId).filter((p) => p && !isHidden(p));
  if (!products.length) return null;
  const prices = products.map(priceValue).filter(Boolean);
  return {
    ...blend,
    products,
    fromPrice: prices.length ? Math.min(...prices) : null,
    // The cadence a patient settles into long-term is the last rung, not the starter.
    cadence: refillCadence(products[products.length - 1]),
  };
};

/** Programs for one category, with every derived field resolved. Empty when the
 *  category has no programs — callers then render their normal flat grid. */
export const programsFor = (category) =>
  PROGRAMS.filter((p) => p.category === category)
    .map((program) => {
      const blends = program.blends.map(resolveBlend).filter(Boolean);
      if (!blends.length) return null;
      const prices = blends.map((b) => b.fromPrice).filter(Boolean);
      return {
        ...program,
        blends,
        fromPrice: prices.length ? Math.min(...prices) : null,
        image: blends[0].products[0]?.img,
      };
    })
    .filter(Boolean);

/** Every product id already represented by a program in this category. */
export const programProductIds = (category) =>
  new Set(programsFor(category).flatMap((p) => p.blends.flatMap((b) => b.products.map((x) => x.id))));
