import { priceLabel, isOtc } from "../components/data/products";
import { displayTitle } from "./catalog";
import { productPath } from "./slug";

/* Shared shape for the treatment card used by both the category listing and the
   product page's cross-sell. Lives here rather than in either component so the
   two can never drift into describing the same program differently. */

/* The refill cadence chip ("Every 8 Weeks") is gone from both cards at the
   client's request, 2026-10-13. It was read off the catalogue's Days Supply, so
   nothing was wrong with it; the client simply does not want the shelf stating
   a refill rhythm next to the price. The fact is still on the product page, in
   the Days Supply spec, which is where a patient can read it in context.

   cadenceLabel went with it. refillCadence in data/subscriptions.js is still
   used by the program blends, so that stays. */

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
    chips: [program.fromPrice ? `From $${program.fromPrice}/mo` : ""],
    /* The prescription marker, on the card rather than only on the product
       page (client, 2026-10-13). Read off the catalogue, not assumed: the
       supplement line is not a prescription and must not claim to be. */
    rx: !isOtc(starter),
    img: program.image || starter.img,
    blurb: program.blurb,
    /* The formulations behind the card.
     *
     * A program collapses several blends into one tile, which left a new blend
     * invisible on the listing: adding "With Glycine and B12" changed nothing
     * a visitor could see, because the card only ever showed the molecule and
     * the cheapest price. Named here so the card can list what the molecule is
     * actually available as. Only the blends that resolved, so a set of rungs
     * that is entirely hidden still shows nothing. */
    formulations: program.blends
      .filter((b) => b.name && b.products[0])
      .map((b) => ({ name: b.name, to: productPath(b.products[0]) })),
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
  /* cardPrice wins when a ladder's shelf card has to open the range rather than
     quote one fill ("Starts at $39" for the LDN starter). The dosage form sits
     beside it now that the refill cadence has gone: it is what the patient is
     choosing between, a spray or an injection. */
  chips: [p.cardPrice || priceLabel(p), p.dosageForm || ""],
  rx: !isOtc(p),
  img: p.img,
  blurb: p.blurb || p.description || "",
  product: p,
  startTo: `${productPath(p)}?start=1`,
});
