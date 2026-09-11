import React from "react";
import Seo from "../components/Seo";
import Navbar from "../components/Nav/Navbar";
import Footer from "../components/Nav/Footer";
import Reveal from "../components/ui/Reveal";
import BmiCalculator from "../components/tools/BmiCalculator";

/* The standalone, indexable version of the calculator. The widget itself lives
   in components/tools/BmiCalculator so the landing page can embed the exact same
   thing inline; this page adds the SEO shell and the reference material that
   would be too heavy above the FAQ on the homepage. */

const BMI_TABLE = [
  ["Under 18.5", "Underweight"],
  ["18.5 to 24.9", "Healthy weight"],
  ["25.0 to 29.9", "Overweight"],
  ["30.0 and above", "Obesity"],
];

export default function WeightLossCalculatorPage() {
  return (
    <main className="min-h-screen w-full bg-bg text-ink">
      <Seo
        title="Weight Loss Calculator: Check Your BMI"
        description="Free weight loss calculator: check your BMI, see which category it falls into, and find out whether treatment may be an option to discuss with a licensed provider."
        path="/weight-loss-calculator"
      />
      <Navbar />

      <section className="mx-auto max-w-[1180px] px-5 py-[clamp(2.4rem,5vw,4rem)] md:px-10">
        {/* The comp sets this header inline above the card rather than as a full
            PageHero: no back link, no chips, and the two-line standfirst does the
            job the chips used to. */}
        <Reveal>
          <span className="nv-eyebrow">Free tool</span>
          <h1 className="nv-weight-keep mt-2 font-display text-[clamp(1.9rem,4.4vw,3rem)] font-extrabold leading-[1.1] tracking-tight">
            See where you stand
          </h1>
          <p className="mt-3 max-w-[62ch] text-[0.92rem] leading-relaxed text-muted">
            Use the sliders to estimate your BMI and see where it falls.
            <br />
            A screening tool only, not a predictor of individual outcomes.
          </p>
        </Reveal>

        <Reveal>
          <div className="mt-[clamp(1.5rem,3vw,2.25rem)]">
            <BmiCalculator />
          </div>
        </Reveal>

        {/* Reference table, so the page answers the query even for visitors who
            never touch the sliders. */}
        <Reveal>
          <div className="mt-[clamp(2rem,4vw,3rem)] overflow-hidden rounded-[calc(22px*var(--nv-r-scale,1))] border border-line bg-surface px-6 py-7 md:px-10">
            <h2 className="font-display text-[1.15rem] font-bold leading-tight">How BMI is categorised</h2>
            <p className="mt-2 max-w-[62ch] text-[0.9rem] leading-relaxed text-muted">
              BMI is a screening measure, not a diagnosis. It doesn't distinguish muscle from fat, so
              it can misread very muscular or older adults. Providers use it alongside your history,
              not on its own.
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
              {BMI_TABLE.map(([range, label]) => (
                <div key={label}>
                  <dt className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">{range}</dt>
                  <dd className="mt-1 text-[0.92rem] font-semibold text-ink">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>

        <p className="mt-8 text-[0.8rem] leading-relaxed text-muted">
          This calculator is provided for general information only. It is not medical advice, does
          not create a patient-provider relationship, and is not a determination that you will be
          prescribed anything. Talk to a licensed provider about your own circumstances.
        </p>
      </section>

      <Footer />
    </main>
  );
}
