import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import Reveal from "../ui/Reveal";
import { priceLabel, productsData } from "../data/products";
import BmiCalculator from "../tools/BmiCalculator";

/* Tirzepatide's own sections, built 2026-10-12 with goodlifemeds.com's
   tirzepatide page as the client's reference and in the same format as the
   NAD+ pages: a comparison, the reference's BMI calculator and the price card.
   Their benefit claims, testimonials and lab-results panel are left out. */

const BAND = "radial-gradient(circle at 30% 40%, #c1a27a, #9a7843)";
const DARK = "linear-gradient(160deg, #3a2f1f 0%, #2a2217 55%, #1f1a12 100%)";
const CREAM = "#ffe8b1";
const GROUND = "#fbfaf7";
const SAND = "linear-gradient(160deg, #f6eee1 0%, #efe3cf 100%)";
const TITLE = "font-display font-extrabold leading-[1.1]";
const H2 = `${TITLE} text-[clamp(1.7rem,3.4vw,2.5rem)] text-[#725826]`;
const CARD_R = "rounded-[calc(24px*var(--nv-r-scale,1))]";

const semaglutide = () => productsData.find((p) => p.id === 1);

function StartLink({ to, className = "" }) {
  return (
    <Link
      to={to}
      className={`group inline-flex items-center gap-2 rounded-full bg-[#977e43] px-7 py-3.5 text-[0.95rem] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#836c39] nv-shadow ${className}`}
    >
      Start your consultation
      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

/* 1. TIRZEPATIDE OR SEMAGLUTIDE: the reference sets the two side by side in
   its related products. Here it is a table of what each acts on, what else is
   in the vial and what it costs. Nothing says one works better. */

function Compare({ product, startTo }) {
  const sema = semaglutide();
  const rows = [
    { label: "Acts on", ours: "GIP and GLP-1 receptor pathways", theirs: "The GLP-1 receptor pathway" },
    { label: "Also contains", ours: "Niacinamide", theirs: "Vitamin B12" },
    { label: "Monthly price", ours: priceLabel(product), theirs: priceLabel(sema) },
    { label: "3-month plan", ours: product.price3, theirs: sema.price3 },
  ];

  return (
    <section className="py-[clamp(2.75rem,6vw,5.5rem)]">
      <div className="mx-auto grid max-w-[1180px] gap-9 px-5 md:px-10 lg:grid-cols-2 lg:items-center lg:gap-14">
        <Reveal as="div">
          <span className="nv-eyebrow">Two weekly options</span>
          <h2 className={`${H2} mt-3 max-w-[18ch]`}>Tirzepatide or Semaglutide?</h2>
          <p className="mt-4 max-w-[48ch] text-[1rem] leading-relaxed text-muted">
            Both are weekly injections. Your provider helps you decide which one fits.
          </p>

          <div className={`mt-7 overflow-hidden border border-line bg-surface ${CARD_R}`}>
            <div className="grid grid-cols-[0.8fr_1fr_1fr] gap-3 bg-surface-2 px-4 py-3 text-[0.78rem] font-bold text-ink sm:px-5">
              <span />
              <span>Tirzepatide</span>
              <span className="text-muted">Semaglutide</span>
            </div>
            {rows.map((r) => (
              <div
                key={r.label}
                className="grid grid-cols-[0.8fr_1fr_1fr] gap-3 border-t border-line px-4 py-3.5 text-[0.86rem] leading-snug sm:px-5"
              >
                <span className="font-semibold text-ink">{r.label}</span>
                <span className="text-ink">{r.ours}</span>
                <span className="text-muted">{r.theirs}</span>
              </div>
            ))}
          </div>
          <StartLink to={startTo} className="mt-7" />
        </Reveal>

        {/* The two vials on the brass, the way the reference shows its products.
            Left off phones, as on the NAD+ comparison, to keep the page short. */}
        <Reveal as="div" delay={0.08} className="hidden sm:block">
          <div
            className={`relative grid grid-cols-2 items-end gap-2 overflow-hidden px-4 pb-7 pt-6 sm:px-10 ${CARD_R}`}
            style={{ background: BAND }}
          >
            {[
              { img: product.img, name: "Tirzepatide", tilt: "-rotate-3" },
              { img: sema.img, name: "Semaglutide", tilt: "rotate-3" },
            ].map((v, i) => (
              <figure key={v.name} className="flex flex-col items-center">
                {/* The vial fills about a third of its square, so the square runs large. */}
                <span className={`-my-2 block w-40 sm:w-60 ${v.tilt}`}>
                  <img
                    src={v.img}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="nv-float block w-full drop-shadow-[0_18px_34px_rgba(70,50,20,0.34)]"
                    style={{ animationDelay: `${i * 0.8}s` }}
                  />
                </span>
                <figcaption className="mt-4 text-[0.78rem] font-bold uppercase tracking-[0.12em]" style={{ color: CREAM }}>
                  {v.name}
                </figcaption>
              </figure>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* 2. BMI: the reference carries a calculator on the product page, set in one
   clean card of its own. The site's widget in its frameless layout, in a card
   as wide as the price card below (client, 2026-10-12). */

function Bmi() {
  return (
    <section className="mx-auto max-w-[1180px] px-5 pb-[clamp(2.75rem,6vw,5.5rem)] md:px-10">
      <Reveal as="div">
        <div className={`px-6 py-9 sm:px-10 sm:py-12 lg:px-14 ${CARD_R}`} style={{ background: SAND }}>
          <BmiCalculator variant="panel">
            <span className="nv-eyebrow">Weight loss calculator</span>
            <h2 className={`${H2} mt-3`}>Check Your BMI</h2>
            <p className="mt-4 max-w-[44ch] text-[1rem] leading-relaxed text-muted">
              BMI uses your height and weight. It is one of the things a provider looks at, not the whole picture.
            </p>
          </BmiCalculator>
        </div>
      </Reveal>
    </section>
  );
}

/* 3. WHAT'S INCLUDED: the dark price card the NAD+ pages carry, with the
   record's own prices. */

const INCLUDED = [
  "An online intake reviewed by a licensed provider",
  "Tirzepatide, if prescribed",
  "Compounded by a licensed U.S. pharmacy",
  "Insulin syringes included",
  "Discreet home delivery",
  "Follow-up care and guidance throughout your plan",
  "Cancel anytime",
];

function Included({ product, startTo }) {
  return (
    <section className="mx-auto max-w-[1180px] px-5 pb-[clamp(2.75rem,6vw,5.5rem)] md:px-10">
      <Reveal as="div">
        <div className={`relative grid overflow-hidden lg:grid-cols-2 ${CARD_R}`} style={{ background: DARK }}>
          {/* A woman in the page's audience, 35 to 60 (client, 2026-10-12). */}
          <div
            className="relative px-6 pt-9 sm:px-10 sm:pt-12"
            style={{ background: "radial-gradient(circle at 50% 88%, rgba(193,162,122,0.38), transparent 62%)" }}
          >
            <span className="flex items-center gap-2 text-[0.9rem] font-semibold" style={{ color: CREAM }}>
              <span className="h-2 w-2 rounded-full bg-[#ffe8b1]" />
              Provider-guided care
            </span>
            <h2 className={`${TITLE} relative z-10 mt-4 max-w-[20ch] text-[clamp(1.5rem,2.8vw,2.1rem)]`} style={{ color: CREAM }}>
              Tirzepatide, prescribed and followed by a licensed provider.
            </h2>
            <img
              src="/site/goals/longevity.avif"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="mx-auto mt-6 block h-72 w-auto object-contain object-bottom sm:h-96 lg:absolute lg:bottom-0 lg:left-1/2 lg:mt-0 lg:h-[72%] lg:-translate-x-1/2"
            />
          </div>

          <div className="relative p-4 sm:p-8">
            <div className={`bg-white px-6 py-7 sm:px-9 sm:py-9 ${CARD_R}`}>
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="font-display text-[clamp(2.4rem,4vw,3rem)] font-extrabold leading-none text-ink">
                  {priceLabel(product)}
                </span>
                <span className="text-[1rem] text-muted">at every dose</span>
              </div>
              <p className="mt-2 text-[0.88rem] text-muted">
                Or {product.price3} for 3 months. You pay only if a provider determines that a prescription is
                appropriate.
              </p>
              <h3 className="mt-7 text-[0.95rem] font-bold text-ink">What's included</h3>
              <ul className="mt-3 grid gap-3">
                {INCLUDED.map((t) => (
                  <li key={t} className="flex items-start gap-3 text-[0.94rem] leading-snug text-ink">
                    <Check size={17} strokeWidth={2.4} className="mt-0.5 shrink-0 text-[#977e43]" />
                    {t}
                  </li>
                ))}
              </ul>
              <StartLink to={startTo} className="mt-8 w-full justify-center" />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default function TirzepatideSections({ product, startTo = "/start" }) {
  return (
    <div style={{ background: GROUND }}>
      <Compare product={product} startTo={startTo} />
      <Bmi />
      <Included product={product} startTo={startTo} />
    </div>
  );
}
