import React from "react";
import Seo from "../components/Seo";
import Navbar from "../components/Nav/Navbar";
import Footer from "../components/Nav/Footer";
import Reveal from "../components/ui/Reveal";
import BmiForm from "../components/tools/BmiForm";

/* The BMI Calculator page: the client's calculator (components/tools/BmiForm,
   2026-10-12) under the page heading, and what the reading does and doesn't
   mean. */

export default function WeightLossCalculatorPage() {
  return (
    <main className="min-h-screen w-full bg-bg text-ink">
      <Seo
        title="Weight Loss Calculator: Check Your BMI"
        description="Free weight loss calculator: check your BMI, see which category it falls into, and find out whether treatment may be an option to discuss with a licensed provider."
        path="/weight-loss-calculator"
      />
      <Navbar />

      <section className="mx-auto max-w-[1040px] px-5 py-[clamp(2rem,5vw,4rem)] md:px-10">
        <BmiForm>
          <h1 className="nv-weight-keep font-display text-[clamp(2rem,4.4vw,3rem)] font-normal leading-[1.08] tracking-tight">
            BMI Calculator
          </h1>
          <p className="mt-3 max-w-[48ch] text-[0.98rem] leading-relaxed text-muted">
            Body mass index (BMI) compares your weight with your height. Use this calculator for a general
            starting point when discussing your weight with a provider.
          </p>
        </BmiForm>

        <Reveal as="div" className="mt-10 border-t border-line pt-7">
          <h2 className="font-display text-[1.15rem] font-bold text-ink">About your result</h2>
          <p className="mt-2 max-w-[80ch] text-[0.92rem] leading-relaxed text-muted">
            For adults 20 and older. BMI is a screening measure, not a diagnosis. It does not distinguish body fat
            from muscle or bone and should be considered alongside your medical history and other health information.
          </p>
          <p className="mt-3 max-w-[80ch] text-[0.92rem] leading-relaxed text-muted">
            Your BMI result does not determine eligibility for NovaMDK treatment. A licensed provider must review your
            health information to determine whether treatment is appropriate.
          </p>
          <p className="mt-3 max-w-[80ch] text-[0.8rem] leading-relaxed text-muted">
            This calculator is for general information only and is not medical advice. Your entries stay in your
            browser.
          </p>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
