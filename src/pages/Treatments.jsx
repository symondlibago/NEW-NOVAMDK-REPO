import React, { Suspense, lazy } from "react";
import { Link, useParams, useSearchParams, Navigate } from "react-router-dom";
import {
  Truck, Lock, FlaskConical, ShieldCheck,
} from "lucide-react";
import Seo from "../components/Seo";
import Navbar from "../components/Nav/Navbar";
import Footer from "../components/Nav/Footer";
import GoalGrid from "../components/shop/GoalGrid";
import TreatmentShop from "../components/shop/TreatmentShop";
import { visibleProducts, categoriesOf } from "../components/data/products";
import { CATEGORY_META, TREATMENTS_META } from "../lib/categoryMeta";
import { breadcrumbs } from "../lib/seoMeta";

const FAQ = lazy(() => import("../components/FAQ"));
// Weight-loss only: the same calculator as the BMI Calculator page.
const BmiForm = lazy(() => import("../components/tools/BmiForm"));

// Valid product categories a quiz can land on (everything but pure supplements).
// Driven by visibility: a category with nothing shoppable is commented out of the
// nav, footer and carousel, so its URL should redirect here rather than render an
// empty shelf.
const VALID_GOALS = new Set(
  visibleProducts
    .flatMap(categoriesOf)
    .filter((slug) => slug !== "supplements")
);

// Labels only since 2026-10-13: the client asked for the subtext to go.
const TRUST = [
  { icon: ShieldCheck, label: "Doctor-guided care" },
  { icon: Lock, label: "Discreet & confidential" },
  { icon: FlaskConical, label: "Provider-reviewed options" },
  { icon: Truck, label: "Home delivery, if prescribed" },
];


/* ------------------------------- sections ------------------------------- */
function TrustBand() {
  return (
    /* Set straight onto the page rather than in a card (2026-08-31). The border,
       the fill and the radius together turned four short promises into a
       highlighted panel that read as separate from the shelf it belongs to. Only
       the box is gone — the grid, the icons and the copy are untouched, so the
       row still lands as the closing line of the goal grid above it. */
    <section className="mx-auto max-w-[1180px] px-5 pb-[clamp(2.5rem,5vw,4.5rem)] md:px-10">
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 lg:grid-cols-4">
        {TRUST.map((t) => (
          <div key={t.label} className="flex items-center gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[calc(9px*var(--nv-r-scale,1))] bg-surface-2 text-primary">
              <t.icon size={15} strokeWidth={1.9} />
            </span>
            <span className="text-[0.82rem] font-bold leading-tight text-ink">{t.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function TreatmentsPage() {
  const { goal: goalParam } = useParams();
  const [params] = useSearchParams();
  const legacyGoal = params.get("goal");

  // Legacy ?goal= URLs redirect to the crawlable /treatments/:goal path.
  if (legacyGoal && VALID_GOALS.has(legacyGoal)) {
    return <Navigate to={`/treatments/${legacyGoal}`} replace />;
  }
  if (goalParam && !VALID_GOALS.has(goalParam)) {
    return <Navigate to="/treatments" replace />;
  }
  const validGoal = goalParam || null;
  const catMeta = validGoal ? CATEGORY_META[validGoal] : null;
  const categoryName = visibleProducts.find((p) => p.categorySlug === validGoal)?.categoryName || "";

  return (
    <main
      className="min-h-screen w-full text-ink"
      /* Cream at the top, settling into the warm tint by the time the goal grid
         starts. The stop is a pixel length, not a percentage — main runs the whole
         page, so a percentage would smear the fade across every section below.
         A gradient holds its last colour past the final stop, so everything from
         900px down stays flat. */
      style={{
        background:
          "linear-gradient(180deg, var(--nv-surface) 0px, color-mix(in oklab, var(--nv-accent) 14%, var(--nv-surface)) 900px)",
      }}
    >
      <Seo
        title={(catMeta || TREATMENTS_META).title}
        description={(catMeta || TREATMENTS_META).description}
        path={validGoal ? `/treatments/${validGoal}` : "/treatments"}
        jsonLd={
          catMeta &&
          breadcrumbs([
            ["Home", "/"],
            ["Treatments", "/treatments"],
            [categoryName, `/treatments/${validGoal}`],
          ])
        }
      />
      <Navbar />

      {validGoal ? (
        /* Came from a consultation → only that category's products (their own header) */
        <>
          <TreatmentShop category={validGoal} />
          {validGoal === "weight-loss" && (
            <section className="mx-auto max-w-[1040px] px-5 pb-[clamp(2rem,5vw,4rem)] md:px-10">
              <Suspense fallback={<div className="grid h-[320px] place-items-center text-muted">Loading calculator…</div>}>
                <BmiForm>
                  <span className="nv-eyebrow">Free tool</span>
                  <h2 className="mt-2 text-[clamp(1.6rem,3.4vw,2.4rem)] font-extrabold leading-tight">
                    See where you stand
                  </h2>
                  <p className="mt-3 max-w-[48ch] text-[1.02rem] leading-relaxed text-muted">
                    Enter your height and weight to see which BMI range you fall into.
                  </p>
                  <p className="mt-2 max-w-[48ch] text-[0.9rem] leading-relaxed text-muted">
                    This tool is a screening aid only, and does not predict individual outcomes.
                  </p>
                </BmiForm>
              </Suspense>
              <p className="mt-8 max-w-[90ch] text-[0.8rem] leading-relaxed text-muted">
                For general information only. This is not medical advice, does not create a
                patient-provider relationship, and is not a determination that you will be prescribed
                anything.{" "}
                <Link to="/weight-loss-calculator" className="font-medium text-primary hover:underline">
                  See the full BMI reference
                </Link>
                .
              </p>
            </section>
          )}
        </>
      ) : (
        /* Manual visit → explore by goal (each tile starts a consultation). No
           PageHero here: the comp opens straight on the goal grid, with its own
           left-aligned heading rather than the centered page header the other
           shop pages use. */
        <>
          {/* Narrower than the 1180px the rest of the page runs at: the goal cards
              read better a little taller than wide, and squeezing the track is what
              buys that without touching the 3-up grid. The header narrows with it so
              the copy stays flush with the first card's left edge. */}
          <section className="mx-auto max-w-[1060px] px-5 pb-[clamp(2.6rem,5vw,4rem)] pt-[clamp(2.4rem,4.5vw,3.6rem)] md:px-10">
            {/* Heading and standfirst dropped (2026-10-08) so the goal cards open
                the page. The h1 stays as assistive text: the grid is a set of
                links, so without it the page would have no heading at all for a
                screen reader or for search. */}
            <h1 className="sr-only">Explore treatments for your goals</h1>
            <GoalGrid source="treatments" />
          </section>  
        </>
      )}

      <TrustBand />

      {/* FAQ (reused, re-themed). Testimonials live on the homepage only. */}
      <Suspense fallback={<div className="grid h-[200px] place-items-center bg-bg text-muted">Loading…</div>}>
        <FAQ />
      </Suspense>

      <Footer />
    </main>
  );
}
