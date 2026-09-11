import React, { Suspense, lazy } from "react";
import { Link, useParams, useSearchParams, Navigate } from "react-router-dom";
import {
  Truck, Lock, FlaskConical, ShieldCheck, ArrowRight,
} from "lucide-react";
import Seo from "../components/Seo";
import Navbar from "../components/Nav/Navbar";
import Footer from "../components/Nav/Footer";
import CategoryGrid from "../components/shop/CategoryGrid";
import TreatmentShop from "../components/shop/TreatmentShop";
import Reveal from "../components/ui/Reveal";
import { CONSULTS, CONSULT_ORDER } from "../components/data/consultations";
import { visibleProducts, categoriesOf } from "../components/data/products";
import { CATEGORY_META } from "../lib/categoryMeta";
import { GOAL_ART } from "../lib/goalArt";
import { track, EVENTS } from "../lib/analytics";

const FAQ = lazy(() => import("../components/FAQ"));
// Weight-loss only: the tool qualifies you for these treatments specifically.
const BmiCalculator = lazy(() => import("../components/tools/BmiCalculator"));

// Mirror the homepage funnels — each tile browses that goal's shoppable catalog.
// The sixth cell closes the 2×3 grid and is the catch-all for anyone who doesn't
// see their goal: it replaces the quiz / BMI links that used to sit in the header.
const TREATMENT_CATS = [
  ...CONSULT_ORDER.map((k) => ({
    name: CONSULTS[k].name,
    tag: CONSULTS[k].tag,
    blurb: CONSULTS[k].blurb,
    cta: "Browse treatments",
    goal: CONSULTS[k].goalSlug,
    link: `/treatments/${CONSULTS[k].goalSlug}`,
    ...(GOAL_ART[CONSULTS[k].goalSlug] || {}),
  })),
  {
    kind: "goal-cta",
    name: "Not Sure Where To Start?",
    cta: "Take Quick Assessment",
    goal: "quick-assessment",
    link: "/start",
    bg: "bg-linear-to-br from-[#f4eddd] to-[#fceed2]",
  },
];

// Valid product categories a quiz can land on (everything but pure supplements).
// Driven by visibility: a category with nothing shoppable is commented out of the
// nav, footer and carousel, so its URL should redirect here rather than render an
// empty shelf.
const VALID_GOALS = new Set(
  visibleProducts
    .flatMap(categoriesOf)
    .filter((slug) => slug !== "supplements")
);

const TRUST = [
  { icon: ShieldCheck, label: "Doctor-guided care", sub: "Always backed by medical experts." },
  { icon: Lock, label: "Discreet & confidential", sub: "Private care, delivered discreetly." },
  { icon: FlaskConical, label: "Provider-reviewed treatment options", sub: "Treatment decisions based on each patient's clinical evaluation." },
  { icon: Truck, label: "Home delivery, if prescribed", sub: "Shipped discreetly by a licensed pharmacy." },
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
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST.map((t) => (
          <div key={t.label} className="flex items-start gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[calc(9px*var(--nv-r-scale,1))] bg-surface-2 text-primary">
              <t.icon size={15} strokeWidth={1.9} />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[0.82rem] font-bold leading-tight text-ink">{t.label}</span>
              <span className="mt-0.5 text-[0.76rem] leading-snug text-muted">{t.sub}</span>
            </span>
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
        title={catMeta ? catMeta.title : "Treatments — Physician-Prescribed Telehealth Care"}
        description={catMeta ? catMeta.description : "Explore Nova MDK treatments for weight loss, longevity, skin health, sexual wellness and recovery — prescribed online by licensed physicians and shipped to your door."}
        path={validGoal ? `/treatments/${validGoal}` : "/treatments"}
      />
      <Navbar />

      {validGoal ? (
        /* Came from a consultation → only that category's products (their own header) */
        <>
          <TreatmentShop category={validGoal} showBack />
          {validGoal === "weight-loss" && (
            /* Wider than the 1180 the rest of the page runs at, with a thinner
               gutter: the calculator is a two-column instrument and the extra
               width is what keeps the dial and the scale from squashing. */
            <section className="mx-auto max-w-[1440px] px-4 pb-[clamp(1rem,3vw,2rem)] md:px-6">
              <Reveal className="mb-8 max-w-[52ch]">
                <span className="nv-eyebrow">Free tool</span>
                <h2 className="mt-2 text-[clamp(1.6rem,3.4vw,2.4rem)] font-extrabold leading-tight">
                  See where you stand
                </h2>
                <p className="mt-3 text-[1.02rem] leading-relaxed text-muted">
                  Use the sliders to estimate your BMI and see which category it falls into.
                </p>
                <p className="mt-3 text-[0.9rem] leading-relaxed text-muted">
                  This tool is a screening aid only, and does not predict individual outcomes.
                </p>
                <p className="mt-3 text-[0.9rem] font-semibold text-ink">No sign-up required.</p>
              </Reveal>
              <Suspense fallback={<div className="grid h-[320px] place-items-center text-muted">Loading calculator…</div>}>
                <Reveal><BmiCalculator /></Reveal>
              </Suspense>
              <p className="mt-6 max-w-[90ch] text-[0.8rem] leading-relaxed text-muted">
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
          <section className="mx-auto max-w-[1060px] px-5 pb-[clamp(2.6rem,5vw,4rem)] pt-[clamp(3.2rem,7vw,5.5rem)] md:px-10">
            <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="max-w-[19ch] text-[clamp(1.9rem,4vw,2.9rem)] font-extrabold leading-[1.1] text-primary">
                  Explore treatments for your goals
                </h1>
                <p className="mt-4 max-w-[56ch] text-[1rem] leading-relaxed text-muted">
                  Explore prescription treatment options for a range of health and wellness goals.
                  Learn what each treatment is, how it works, and what to expect before starting
                  your assessment
                </p>
              </div>
              {/* Same destination as the sixth grid cell — /start is the existing
                  consultation quiz, which opens on its category picker when no
                  goal is chosen. */}
              <Link
                to="/start"
                onClick={() => track(EVENTS.QUIZ_STARTED, { source: "treatments-header" })}
                className="group shrink-0 sm:pt-3"
              >
                <span className="block text-[0.98rem] font-bold text-ink">Not sure where to start?</span>
                <span className="mt-1.5 inline-flex items-center gap-2.5 text-[0.94rem] text-muted transition-colors duration-300 group-hover:text-primary">
                  Take a quick assessment
                  <ArrowRight
                    size={16}
                    strokeWidth={2}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </span>
              </Link>
            </div>
            {/* No `featured` here: the sixth cell squares the grid off at 2×3, and a
                double-width first tile would break that back into three ragged rows. */}
            <CategoryGrid
              items={TREATMENT_CATS}
              onItemClick={(it) => track(EVENTS.CATEGORY_SELECTED, { category: it.goal, source: "treatments" })}
            />
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
