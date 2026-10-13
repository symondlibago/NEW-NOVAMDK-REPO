import React, { useState } from "react";
import Seo from "../components/Seo";
import Navbar from "../components/Nav/Navbar";
import Footer from "../components/Nav/Footer";
import Reveal from "../components/ui/Reveal";
import { track, EVENTS } from "../lib/analytics";

/* The client's BMI calculator layout (2026-10-12): typed height and weight in
   US or metric units, a Calculate button, and the reading beside the adult
   ranges. The slider widget in components/tools/BmiCalculator still runs on
   the weight loss category page. */

const RANGES = [
  { key: "under", label: "Underweight", range: "Below 18.5", max: 18.5 },
  { key: "healthy", label: "Healthy weight", range: "18.5 – 24.9", max: 25 },
  { key: "over", label: "Overweight", range: "25 – 29.9", max: 30 },
  { key: "obese", label: "Obesity", range: "30 or above", max: Infinity },
];

const bandFor = (bmi) => RANGES.find((r) => bmi < r.max);
const EMPTY = { ft: "", inch: "", lb: "", cm: "", kg: "" };

function bmiOf(unit, v) {
  if (unit === "us") {
    const inches = Number(v.ft || 0) * 12 + Number(v.inch || 0);
    const lb = Number(v.lb);
    if (!inches || !lb) return null;
    return (703 * lb) / (inches * inches);
  }
  const m = Number(v.cm) / 100;
  const kg = Number(v.kg);
  if (!m || !kg) return null;
  return kg / (m * m);
}

function Field({ id, label, value, onChange, placeholder }) {
  return (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="block text-[0.9rem] font-semibold text-ink">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min="0"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-[1rem] text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-primary"
      />
    </div>
  );
}

export default function WeightLossCalculatorPage() {
  const [unit, setUnit] = useState("us");
  const [v, setV] = useState(EMPTY);
  const [bmi, setBmi] = useState(null);
  const set = (k) => (val) => setV((o) => ({ ...o, [k]: val }));

  const calculate = (e) => {
    e.preventDefault();
    const raw = bmiOf(unit, v);
    if (!raw || !Number.isFinite(raw)) {
      setBmi(null);
      return;
    }
    const rounded = Math.round(raw * 10) / 10;
    setBmi(rounded);
    /* That it was used, and nothing about the result: a BMI band is health
       information and stays out of analytics, as do the height and weight. */
    track(EVENTS.CALCULATOR_USED, { tool: "weight-loss" });
  };

  const reset = () => {
    setV(EMPTY);
    setBmi(null);
  };

  const band = bmi ? bandFor(bmi) : null;

  return (
    <main className="min-h-screen w-full bg-bg text-ink">
      <Seo
        title="Weight Loss Calculator: Check Your BMI"
        description="Free weight loss calculator: check your BMI, see which category it falls into, and find out whether treatment may be an option to discuss with a licensed provider."
        path="/weight-loss-calculator"
      />
      <Navbar />

      <section className="mx-auto max-w-[1040px] px-5 py-[clamp(2rem,5vw,4rem)] md:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
          <Reveal as="div">
            <h1 className="nv-weight-keep font-display text-[clamp(2rem,4.4vw,3rem)] font-normal leading-[1.08] tracking-tight">
              BMI Calculator
            </h1>
            <p className="mt-3 max-w-[48ch] text-[0.98rem] leading-relaxed text-muted">
              Body mass index (BMI) compares your weight with your height. Use this calculator for a general
              starting point when discussing your weight with a provider.
            </p>

            <form onSubmit={calculate} className="mt-6">
              <div role="group" aria-label="Units" className="grid grid-cols-2 rounded-full border border-line bg-surface-2 p-1">
                {[
                  ["us", "US"],
                  ["metric", "Metric"],
                ].map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={unit === k}
                    onClick={() => {
                      setUnit(k);
                      setBmi(null);
                    }}
                    className={`rounded-full py-2.5 text-[0.92rem] font-semibold transition-colors ${
                      unit === k ? "bg-primary text-on-primary nv-shadow" : "text-muted hover:text-ink"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-5 grid gap-4">
                {unit === "us" ? (
                  <>
                    <div className="flex gap-3">
                      <Field id="bmi-ft" label="Height (ft)" value={v.ft} onChange={set("ft")} placeholder="5" />
                      <Field id="bmi-in" label="Height (in)" value={v.inch} onChange={set("inch")} placeholder="7" />
                    </div>
                    <Field id="bmi-lb" label="Weight (lb)" value={v.lb} onChange={set("lb")} placeholder="165" />
                  </>
                ) : (
                  <>
                    <Field id="bmi-cm" label="Height (cm)" value={v.cm} onChange={set("cm")} placeholder="170" />
                    <Field id="bmi-kg" label="Weight (kg)" value={v.kg} onChange={set("kg")} placeholder="75" />
                  </>
                )}
              </div>

              <button
                type="submit"
                className="mt-6 w-full rounded-full bg-primary py-3.5 text-[1rem] font-semibold text-on-primary nv-shadow transition-colors hover:bg-primary-deep"
              >
                Calculate BMI
              </button>
              <button
                type="button"
                onClick={reset}
                className="mx-auto mt-3 block text-[0.9rem] font-semibold text-primary underline underline-offset-4"
              >
                Reset
              </button>
            </form>
          </Reveal>

          <Reveal as="div" delay={0.06}>
            <div
              aria-live="polite"
              className="rounded-[calc(22px*var(--nv-r-scale,1))] border border-line bg-surface-2/50 p-6 nv-shadow sm:p-8"
            >
              <div className="text-center">
                <span className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted">Your BMI</span>
                <p className="mt-2 font-display text-[clamp(3rem,7vw,4.25rem)] font-extrabold leading-none tracking-tight text-primary tabular-nums">
                  {bmi ? bmi.toFixed(1) : "--"}
                </p>
                <p className="mt-2 text-[0.92rem] text-muted">
                  {bmi ? "Based on your height and weight." : "Enter your height and weight."}
                </p>
              </div>

              <h2 className="mt-6 border-t border-line pt-5 font-display text-[1.05rem] font-bold text-ink">Adult BMI ranges</h2>
              <ul className="mt-3 grid gap-1">
                {RANGES.map((r) => {
                  const on = band?.key === r.key;
                  return (
                    <li
                      key={r.key}
                      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-[0.92rem] ${
                        on ? "bg-primary/12 font-semibold text-ink" : "text-ink"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        {on && <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-primary" />}
                        {r.label}
                      </span>
                      <span className="tabular-nums text-muted">{r.range}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Reveal>
        </div>

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
