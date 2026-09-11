import { refillCadence } from "../components/data/subscriptions";
import { priceLabel } from "../components/data/products";
import { displayTitle } from "./catalog";
import { productPath } from "./slug";

/* Shared shape for the treatment card used by both the category listing and the
   product page's cross-sell. Lives here rather than in either component so the
   two can never drift into describing the same program differently. */

/* "every week" -> "Once-Weekly", "every 8 weeks" -> "Every 8 Weeks". Reads off
   the catalogue's Days Supply rather than assuming a monthly rhythm — these
   vials run 28 or 56 days and calling that "monthly" on an Rx page is a claim. */
export const cadenceLabel = (raw) => {
  if (!raw) return "";
  if (raw === "every week") return "Once-Weekly";
  return raw.replace(/^every /, "Every ").replace(/\b\w/g, (c) => c.toUpperCase());
};

/* Programs collapse to a single card at their starting dose — no Starter /
   Mid-Dose / Maintenance ladder. `Get Started` deep-links to that dose's intake
   via ?start=1, which ProductPage picks up and opens the consultation modal on. */
export const programItem = (program) => {
  const cheapest =
    program.blends.find((b) => b.fromPrice === program.fromPrice) || program.blends[0];
  const starter = cheapest.products[0];
  return {
    key: `program-${program.slug}`,
    ribbon: "Subscription",
    title: program.name,
    chips: [
      program.fromPrice ? `From $${program.fromPrice}/mo` : "",
      cadenceLabel(cheapest.cadence),
    ],
    img: program.image || starter.img,
    blurb: program.blurb,
    // The product View Details quick-looks. For a program that's its starting
    // dose — the same one Get Started takes into intake.
    product: starter,
    startTo: `${productPath(starter)}?start=1`,
  };
};

export const productItem = (p) => ({
  key: `product-${p.id}`,
  ribbon: "",
  // displayTitle, not p.name: a listing shows one card per treatment, so the
  // card should read "NAD+ Injection", not "NAD+ Injection — Starter". It also
  // sets combination names with a plus rather than a slash.
  title: displayTitle(p),
  /* The price is a monthly rate; the cadence chip beside it still states the
     actual refill rhythm, which is a different fact and stays as it was. */
  /* cardPrice wins when a ladder's shelf card has to open the range rather than
     quote one fill ("Starts at $39" for the LDN starter). */
  chips: [p.cardPrice || priceLabel(p), cadenceLabel(refillCadence(p)) || p.dosageForm || ""],
  img: p.img,
  blurb: p.blurb || p.description || "",
  product: p,
  startTo: `${productPath(p)}?start=1`,
});
