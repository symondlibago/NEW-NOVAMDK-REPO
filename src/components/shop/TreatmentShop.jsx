import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { productsData, visibleProducts, inCategory } from "../data/products";
import { programsFor, programProductIds } from "../data/subscriptions";
import { programItem, productItem } from "../../lib/programCard";
import { stageOf, baseName } from "../../lib/catalog";
import { CompoundedDisclaimer } from "../Compliance";
import ShelfCard from "./ShelfCard";
import WeightLossSections from "./WeightLossSections";
import AntiAgingSections from "./AntiAgingSections";
import SexualHealthSections from "./SexualHealthSections";
import SportsMedicineSections from "./SportsMedicineSections";
import SkinHealthSections from "./SkinHealthSections";

/* The shelf's columns from sm up, by how many cards there are, and the width
   of the page around them. One or two cards get a narrower page so they stay a
   sensible size and the heading still lines up with them; one card is laid out
   wide instead (see ShelfCard). On a phone it is always two across. */
const GRID = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
  5: "sm:grid-cols-3 lg:grid-cols-5",
};
const WIDTH = { 1: "max-w-3xl", 2: "max-w-4xl" };

// The other four goals, in the nav's order, as a row of links under the shelf.
const GOALS = [
  { slug: "weight-loss", label: "Weight Loss" },
  { slug: "longevity", label: "Longevity" },
  { slug: "skin-health", label: "Skin Health" },
  { slug: "sexual-health", label: "Sexual Health" },
  { slug: "recovery-wellness", label: "Recovery & Wellness" },
];

// Product ids pinned to the front of a category's listing (marketing priority).
// Empty since the final-offerings catalog swap — repopulate with new ids as needed.
const PINNED_FIRST = {};

export default function TreatmentShop({ category }) {
  const pinned = PINNED_FIRST[category] || [];
  /* inCategory, not categorySlug: a cross-listed product (NAD+ on both the
     longevity and the recovery shelf) is one record that answers to two slugs. */
  const products = visibleProducts
    .filter((p) => inCategory(p, category))
    .sort((a, b) => {
      const ai = pinned.indexOf(a.id);
      const bi = pinned.indexOf(b.id);
      if (ai !== -1 || bi !== -1) {
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;                          // both pinned â†’ pinned order
      }
      // Unpinned: the category's own treatments lead, cross-listed ones follow.
      // Sort is stable, so equals keep catalogue order.
      return (a.categorySlug === category ? 0 : 1) - (b.categorySlug === category ? 0 : 1);
    });
  /* Read off a product whose HOME category is this slug, not off products[0]:
     a cross-listed product carries its own category's name, so on the recovery
     shelf the first card can be one that calls itself "Longevity". The full
     catalogue is searched, not the visible list, so the safety net below still
     has a heading to show. */
  const name = productsData.find((p) => p.categorySlug === category)?.categoryName || "";

  const programs = programsFor(category);
  const inProgram = programProductIds(category);
  const standalone = new Set(products.filter((p) => !stageOf(p)).map((p) => baseName(p)));
  const cards = [
    ...programs.map(programItem),
    ...products
      .filter((p) => !inProgram.has(p.id))
      .filter((p) => !stageOf(p) || (stageOf(p) === "Starter" && !standalone.has(baseName(p))))
      .map(productItem),
  ];

  if (!products.length) {
    return (
      <section id="shop" className="scroll-mt-24 bg-surface-2 pb-[clamp(2.5rem,5.5vw,5rem)] pt-2">
        <div className="mx-auto max-w-[1320px] px-4 md:px-6">
          <div className="mx-auto max-w-[520px] rounded-[calc(28px*var(--nv-r-scale,1))] border border-line bg-surface px-6 py-[clamp(2.5rem,6vw,4rem)] text-center nv-shadow">
            <span className="nv-eyebrow">{name}</span>
            <h2 className="mt-2 text-[clamp(1.6rem,3.4vw,2.2rem)] font-extrabold leading-tight">Not available right now</h2>
            <p className="mx-auto mt-3 max-w-[38ch] text-[1rem] leading-relaxed text-muted">
              Our care team can talk you through the treatments we do offer.
            </p>
            <Link
              to="/contact"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[0.95rem] font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-deep nv-shadow"
            >
              Talk to our care team <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  /* Phone layout per card: a program with formulas to pick, or the odd card
     out at the end of a two-across grid, takes the full width with its photo
     beside the text, so the row never ends on a half-empty line. */
  const layoutOf = (c, i) => {
    if (cards.length === 1) return "wide";
    if (c.formulations?.length > 1) return "row";
    if (cards.length % 2 === 1 && i === cards.length - 1) return "row";
    return "grid";
  };

  return (
    <section id="shop" className="scroll-mt-24 bg-bg pb-[clamp(2.5rem,5.5vw,5rem)]">
      <div className={`mx-auto px-4 md:px-6 ${WIDTH[cards.length] || "max-w-6xl"}`}>
        {/* The heading and the provider disclosure, nothing else (client,
            2026-10-13: cut the subtext so the treatments are on the first
            screen). The disclosure stays above the prices it qualifies. */}
        <header className="pb-4 pt-5 sm:pb-8 sm:pt-12">
          <h1 className="text-3xl font-light tracking-tight text-ks-heading sm:text-5xl">{name}</h1>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted sm:text-sm">
            Prescription treatments require evaluation by a licensed healthcare provider and are
            prescribed only when medically appropriate.
          </p>
        </header>

        <div className={`grid grid-cols-2 gap-3 sm:gap-5 ${GRID[Math.min(cards.length, 5)]}`}>
          {cards.map((c, i) => {
            const layout = layoutOf(c, i);
            return (
              <div key={c.key} className={layout === "grid" ? "" : "col-span-2 sm:col-span-1"}>
                <ShelfCard item={c} layout={layout} photo={cards.length <= 2 ? "sm:aspect-4/3" : "sm:aspect-square"} />
              </div>
            );
          })}
        </div>

        <nav aria-label="Other goals" className="mt-8 sm:mt-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Other goals</p>
          <ul className="nv-scroll -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {GOALS.filter((g) => g.slug !== category).map((g) => (
              <li key={g.slug} className="shrink-0">
                <Link
                  to={`/treatments/${g.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary-deep"
                >
                  {g.label} <ArrowRight size={13} />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Required compounded-drug + GLP-1 marketing disclaimers, at the foot
            of the shelf. */}
        <CompoundedDisclaimer className="mb-[clamp(2rem,4vw,3.5rem)] mt-8 max-w-4xl opacity-75" />
      </div>

      {/* Weight-loss only — the copy is GLP-1 specific. `startTo` points at the
          same intake the cards' Get Started uses, so every CTA on the page lands
          in the same place. */}
      {category === "weight-loss" && cards[0] && <WeightLossSections startTo={cards[0].startTo} />}

      {/* Anti-aging only — the copy names NAD+. Same startTo contract. */}
      {category === "longevity" && cards[0] && (
        <AntiAgingSections startTo={cards[0].startTo} />
      )}

      {/* Sexual health only — the copy is sexual-health specific. Same contract. */}
      {category === "sexual-health" && cards[0] && (
        <SexualHealthSections startTo={cards[0].startTo} />
      )}

      {/* Sports medicine only — the copy is recovery and mobility specific. */}
      {category === "recovery-wellness" && cards[0] && (
        <SportsMedicineSections startTo={cards[0].startTo} />
      )}

      {/* Skin health only — the copy names skin concerns. Same startTo contract. */}
      {category === "skin-health" && cards[0] && (
        <SkinHealthSections startTo={cards[0].startTo} />
      )}

    </section>
  );
}
