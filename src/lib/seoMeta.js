import { SITE_URL } from "./absoluteUrl.js";

/* What Google shows for the homepage and each product (client, 2026-10-14).
   Read by the build (scripts/seo-routes.mjs writes it into each page's HTML)
   and by the pages themselves (<Seo>), so a crawler reads the same title
   before and after the JavaScript runs. Plain JS, no JSX, so the build can
   import it.

   No em dashes, no doses, and the safer wording: a licensed provider
   decides, and treatment ships if prescribed. */

export const SITE_NAME = "Nova MDK";
export const HOME_TITLE = "Nova MDK | Weight Loss, Longevity and Wellness Care Online";
export const HOME_DESCRIPTION =
  "Online care for weight loss, longevity, skin and sexual wellness. A licensed provider reviews your history, and treatment ships to your door if prescribed.";

/* The search name where the catalogue name is the pharmacy's, not a
   patient's: "Semaglutide/Cyanocobalamin (B12) — Starter" is what the intake
   needs, "Compounded Semaglutide with B12" is what a patient types. Keyed by
   product id, which never changes. Anything not listed is cleaned up below. */
const SEO_NAME = {
  1: "Compounded Semaglutide with B12",
  5: "Compounded Tirzepatide with Niacinamide",
  45: "Compounded Semaglutide with Glycine and B12",
  47: "Compounded Tirzepatide with Glycine and B12",
  13: "Semaglutide Sublingual Drops (SubMagna®)",
  37: "PT-141 (Bremelanotide) Injection",
  39: "PT-141 (Bremelanotide) Nasal Spray",
};

const STAGE_RE = /\s*—\s*(Starter|Mid-Dose|Maintenance)\s*$/;
const baseOf = (p) => String(p?.name || "").replace(STAGE_RE, "").trim();

export const productSeoName = (p) =>
  SEO_NAME[p.id] ||
  baseOf(p)
    .replace(/(?:\s+\d{1,2}\.\d{1,2}\.\d{2,4})+\s*$/, "")
    .replace(/\s+(Initial|Refill)\s*$/i, "")
    .replace(/\s*\/\s*/g, " + ")
    .trim();

// Without the brand: the build and <Seo> each add "| Nova MDK".
export const productSeoTitle = (p) => `${productSeoName(p)} Online`;

export const productSeoDescription = (p) =>
  p.subtitle ||
  `${productSeoName(p)} from Nova MDK. A licensed provider reviews your history and decides if it's right for you.`;

/* The page Google should rank for a product. A dose rung (Mid-Dose,
   Maintenance, or a Starter that has a standalone page beside it) shares its
   text with the page on the category shelf, so it points there, the same
   card the shelf shows. `products` is the visible catalogue: a hidden page
   redirects, so it can never be the target. */
export function canonicalProduct(p, products) {
  if (!STAGE_RE.test(p?.name || "")) return p;
  const kin = products.filter((q) => q.categorySlug === p.categorySlug && baseOf(q) === baseOf(p));
  return (
    kin.find((q) => !STAGE_RE.test(q.name)) ||
    kin.find((q) => (q.name.match(STAGE_RE) || [])[1] === "Starter") ||
    p
  );
}

// [["Home", "/"], ["Weight Loss", "/treatments/weight-loss"], ...]
export const breadcrumbs = (trail) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trail.map(([name, path], i) => ({
    "@type": "ListItem",
    position: i + 1,
    name,
    item: `${SITE_URL}${path}`,
  })),
});
