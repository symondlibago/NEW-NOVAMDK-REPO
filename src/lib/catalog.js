import { visibleProducts } from "../components/data/products";
import { CONSULTS, CONSULT_ORDER } from "../components/data/consultations";

const CATEGORY_LABEL = Object.fromEntries(
  CONSULT_ORDER.map((k) => [CONSULTS[k].goalSlug, CONSULTS[k].short || CONSULTS[k].name])
);

/**
 * Visible products grouped by category, ordered the way the nav orders goals,
 * with any category the consult list doesn't cover appended after those.
 * @returns {{slug: string, label: string, href: string, products: object[]}[]}
 */
/* ---------------------------- dose ladders ---------------------------- */

const STAGE_RE = /\s*—\s*(Starter|Mid-Dose|Maintenance)\s*$/;
const STAGE_ORDER = ["Starter", "Mid-Dose", "Maintenance"];

/** "NAD+ Injection — Starter" -> "Starter". Empty for a standalone product. */
export const stageOf = (product) => (String(product?.name || "").match(STAGE_RE) || [])[1] || "";

/** "NAD+ Injection — Starter" -> "NAD+ Injection". */
export const baseName = (product) => String(product?.name || "").replace(STAGE_RE, "").trim();

/**
 * The patient-facing title: "Tirzepatide/Niacinamide — Starter" ->
 * "Tirzepatide + Niacinamide".
 *
 * Display only, and deliberately not a data change — productSlug, the GHL
 * treatment label, the QR codes and every /product/… URL already in the wild are
 * derived from the stored catalogue name, so the "/" and the stage suffix stay
 * where they are. Callers that list rungs side by side (the category grid) need
 * the suffix to tell them apart and use `product.name` instead.
 */
/* What an MD Integrations offering name carries on the end that a patient must
   not read: the revision and effective dates, and the fill word.
   "Semaglutide + Glycine + B12 Initial 6.2.26 09.28.26" is the offering, and
   the patient is shown "Semaglutide + Glycine + B12".

   Stripped for display only. The stored name has to match the offering exactly,
   because that string travels to the intake in the `product=` parameter, which
   is the same reason the "/" and the stage suffix stay in the data too.
   Dates first, then the fill word they sat behind. */
const VERSION_RE = /(?:\s+\d{1,2}\.\d{1,2}\.\d{2,4})+\s*$/;
const FILL_RE = /\s+(Initial|Refill)\s*$/i;

export const displayTitle = (product) =>
  baseName(product)
    .replace(VERSION_RE, "")
    .replace(FILL_RE, "")
    .replace(/\s*\/\s*/g, " + ")
    .trim();

/**
 * The dose ladder a product belongs to, in Starter -> Maintenance order.
 * Returns [] for anything that isn't a rung, so callers can skip the selector.
 *
 * Membership needs BOTH a matching base name and a stage suffix. "NAD+ Injection"
 * (the once-weekly 10 mL protocol) shares a base name with the three-times-weekly
 * ramp rungs but is a different protocol at a different price, so requiring the
 * suffix is what keeps it out of their ladder.
 */
export function doseLadder(product) {
  if (!product || !stageOf(product)) return [];
  const base = baseName(product);
  return visibleProducts
    .filter((p) => stageOf(p) && baseName(p) === base && p.categorySlug === product.categorySlug)
    .sort((a, b) => STAGE_ORDER.indexOf(stageOf(a)) - STAGE_ORDER.indexOf(stageOf(b)));
}

export function groupedCatalog() {
  const groups = new Map();
  for (const p of visibleProducts) {
    if (!groups.has(p.categorySlug)) groups.set(p.categorySlug, []);
    groups.get(p.categorySlug).push(p);
  }
  const ordered = CONSULT_ORDER.map((k) => CONSULTS[k].goalSlug).filter((s) => groups.has(s));
  const rest = [...groups.keys()].filter((s) => !ordered.includes(s));
  return [...ordered, ...rest].map((slug) => ({
    slug,
    label: CATEGORY_LABEL[slug] || groups.get(slug)[0].categoryName,
    href: `/treatments/${slug}`,
    products: groups.get(slug),
  }));
}
