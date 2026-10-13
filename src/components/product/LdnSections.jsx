import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, KeyRound, Microscope, Timer, Waves } from "lucide-react";
import Reveal from "../ui/Reveal";
import { priceLabel } from "../data/products";

/* Low-Dose Naltrexone, rebuilt 2026-10-13 on the NAD+ layout (client: the most
   important page in the batch). All three rungs (Starter, Mid-Dose,
   Maintenance) render it. What LDN is on the gold band, low dose against
   standard naltrexone in words, how it is thought to work, how it is taken, and
   the dark price card. The old dose cards and mg scale are gone: no amounts
   appear anywhere on this page. Low-dose use is called off-label wherever it
   comes up, and nothing says what LDN treats. */

const BAND = "radial-gradient(circle at 30% 40%, #c1a27a, #9a7843)";
/* The price card's ground: a light champagne (client, 2026-10-13, in place
   of the dark brown), with the heading in the page's deep gold. */
const CHAMPAGNE = "linear-gradient(160deg, #f5ead6 0%, #ecdcbf 55%, #e2cda6 100%)";
const GOLD_INK = "#725826";
const CREAM = "#ffe8b1";
const GROUND = "#fbfaf7";
const TITLE = "font-display font-extrabold leading-[1.1]";
const H2 = `${TITLE} text-[clamp(1.7rem,3.4vw,2.5rem)] text-[#725826]`;
const CARD_R = "rounded-[calc(24px*var(--nv-r-scale,1))]";

const SOURCE = "https://doi.org/10.3390/medsci6040082";

function StartLink({ to, light = false, className = "" }) {
  return (
    <Link
      to={to}
      className={`group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[0.95rem] font-semibold transition-all hover:-translate-y-0.5 ${
        light ? "bg-[#f6efe0] text-[#6b511e]" : "bg-[#977e43] text-white hover:bg-[#836c39] nv-shadow"
      } ${className}`}
    >
      Start your consultation
      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

/* 1. WHAT IS LDN: the gold band, with the bottle and a tablet. */

function WhatIs({ startTo }) {
  return (
    <section className="relative overflow-hidden" style={{ background: BAND }}>
      <img
        src="/products/detail/ldn.avif"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 mix-blend-soft-light blur-2xl"
      />
      <div className="relative mx-auto max-w-[1180px] px-5 py-[clamp(2.5rem,6vw,5.5rem)] md:px-10">
        <Reveal as="div">
          <div
            className={`grid gap-8 border border-white/25 bg-white/10 p-6 backdrop-blur-md sm:p-10 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-12 lg:p-14 ${CARD_R}`}
          >
            <div>
              <span className="text-[0.75rem] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(255,232,177,0.8)" }}>
                Prescribed off-label
              </span>
              <h2 className={`${TITLE} mt-3 text-[clamp(1.8rem,3.6vw,2.7rem)]`} style={{ color: CREAM }}>
                What is LDN?
              </h2>
              <p className="mt-2 text-[0.9rem]" style={{ color: "rgba(255,232,177,0.75)" }}>
                (low-dose naltrexone)
              </p>
              <p className="mt-5 max-w-[50ch] text-[1rem] leading-relaxed" style={{ color: CREAM }}>
                LDN is naltrexone prescribed at a much lower dose than its standard,{" "}
                <span className="whitespace-nowrap">FDA-approved</span> use. Low-dose use is{" "}
                <span className="whitespace-nowrap">off-label</span>, and a licensed provider decides if it is
                appropriate for you.
              </p>
              <StartLink to={startTo} light className="mt-7" />
            </div>

            <div className="relative mx-auto w-[min(100%,27rem)] lg:-my-10">
              <img
                src="/site/sports-medicine/tablet-star.avif"
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="nv-drift pointer-events-none absolute bottom-[16%] left-[6%] z-10 w-[22%] drop-shadow-[0_10px_18px_rgba(70,50,20,0.3)]"
              />
              {/* The tilt has its own wrapper: the float animates the image's
                  transform and would wipe a rotate set on it. */}
              <span className="block rotate-6">
                <img
                  src="/products/ldn.avif"
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="nv-float pointer-events-none block w-full drop-shadow-[0_18px_34px_rgba(70,50,20,0.34)]"
                />
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* 2. LOW DOSE, EXPLAINED: standard naltrexone against LDN in words, as a table.
   This replaces the old dose cards; the difference is described, never
   measured. */

const COMPARE = [
  { label: "Amount", ours: "A much lower dose, set by your provider", theirs: "The standard dose" },
  { label: "FDA status", ours: "Low-dose use is off-label", theirs: "FDA-approved" },
  { label: "Receptor block", ours: "Brief, a few hours", theirs: "Long-lasting" },
  { label: "Made by", ours: "A licensed compounding pharmacy", theirs: "A drug manufacturer" },
];

function LowDose() {
  return (
    <section className="py-[clamp(2.75rem,6vw,5.5rem)]">
      <div className="mx-auto grid max-w-[1180px] gap-9 px-5 md:px-10 lg:grid-cols-2 lg:items-center lg:gap-14">
        <Reveal as="div">
          <span className="nv-eyebrow">Low dose, explained</span>
          <h2 className={`${H2} mt-3 max-w-[18ch]`}>Same Active Ingredient, a Much Lower Dose</h2>
          <p className="mt-4 max-w-[48ch] text-[1rem] leading-relaxed text-muted">
            LDN uses the same active ingredient as standard naltrexone, in a much smaller amount. Prescribing it at a
            low dose is <span className="whitespace-nowrap">off-label</span>, meaning outside its{" "}
            <span className="whitespace-nowrap">FDA-approved</span> use.
          </p>

          <div className={`mt-7 overflow-hidden border border-line bg-surface ${CARD_R}`}>
            <div className="grid grid-cols-[0.8fr_1fr_1fr] gap-3 bg-surface-2 px-4 py-3 text-[0.78rem] font-bold text-ink sm:px-5">
              <span />
              <span>LDN</span>
              <span className="text-muted">Standard naltrexone</span>
            </div>
            {COMPARE.map((r) => (
              <div key={r.label} className="grid grid-cols-[0.8fr_1fr_1fr] gap-3 border-t border-line px-4 py-3.5 text-[0.86rem] leading-snug sm:px-5">
                <span className="font-semibold text-ink">{r.label}</span>
                <span className="text-ink">{r.ours}</span>
                <span className="text-muted">{r.theirs}</span>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal as="div" delay={0.08} className={`relative hidden overflow-hidden sm:block ${CARD_R}`}>
          <img
            src="/site/sports-medicine/ldn-pathways.avif"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="aspect-4/3 w-full object-cover object-center lg:aspect-5/6"
          />
        </Reveal>
      </div>
    </section>
  );
}

/* 3. HOW IT IS THOUGHT TO WORK: the old mechanism carousel as NAD+'s held
   heading beside a column of rows. Every row describes the body, hedged where
   the research is, and the fine print says it is not an expected result. */

const MECHANISM = [
  {
    icon: KeyRound,
    title: "Opioid receptors",
    text: "LDN attaches to opioid receptors, the same receptors the body's own endorphins use.",
  },
  {
    icon: Timer,
    title: "A brief block",
    text: "At a low dose, that block lasts only a few hours before it clears.",
  },
  {
    icon: Waves,
    title: "Endorphin signaling",
    text: "Researchers think the body may respond to the short block by increasing its own endorphin signaling.",
  },
  {
    icon: Microscope,
    title: "Immune cells",
    text: "LDN is also being studied for how it acts on immune cells involved in inflammation.",
  },
];

function Mechanism({ startTo }) {
  return (
    <section className="pb-[clamp(2.75rem,6vw,5.5rem)]">
      <div className="mx-auto grid max-w-[1180px] gap-8 px-5 md:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal as="div">
            <span className="nv-eyebrow">In the body</span>
            <h2 className={`${H2} mt-3 max-w-[14ch]`}>How LDN Is Thought to Work</h2>
            <p className="mt-4 max-w-[40ch] text-[1rem] leading-relaxed text-muted">
              LDN acts on the same receptors as standard naltrexone, but only for a short time.
            </p>
            <StartLink to={startTo} className="mt-7 hidden lg:inline-flex" />
          </Reveal>
        </div>

        <div>
          <ul>
            {MECHANISM.map((r, i) => (
              <Reveal
                as="li"
                key={r.title}
                delay={(i % 2) * 0.05}
                className="flex items-center gap-5 border-t border-line py-5 first:border-t-0 first:pt-0 sm:gap-8 sm:py-7"
              >
                <span
                  className="relative grid aspect-3/2 w-28 shrink-0 place-items-center overflow-hidden rounded-[18px] sm:w-48"
                  style={{ background: BAND }}
                >
                  <img
                    src="/site/ldn/ldn-rings.avif"
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover opacity-70 mix-blend-soft-light"
                  />
                  <r.icon size={36} strokeWidth={1.4} className="relative h-7 w-7 sm:h-10 sm:w-10" style={{ color: CREAM }} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-[1.1rem] font-bold leading-snug text-ink sm:text-[1.3rem]">{r.title}</h3>
                  <p className="mt-1.5 max-w-[46ch] text-[0.9rem] leading-relaxed text-muted sm:text-[0.98rem]">{r.text}</p>
                </div>
              </Reveal>
            ))}
          </ul>
          <p className="mt-6 border-t border-line pt-5 text-[0.76rem] italic leading-relaxed text-muted">
            How LDN is thought to work in the body, not an expected result of treatment. Research on low-dose use is
            ongoing and individual response varies. Source:{" "}
            <a
              href={SOURCE}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-line-strong underline-offset-2 hover:text-[#725826]"
            >
              Med Sci (Basel), 2018
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}

/* 4. HOW IT IS TAKEN: plain steps with no amounts or timings. The third step is
   the Starter, Mid-Dose and Maintenance ladder, told without its numbers. */

const STEPS = [
  { title: "A tablet, no needles", text: "LDN is a tablet you swallow. There are no injections." },
  {
    title: "On the plan your provider sets",
    text: "Your provider decides how much to take and when. Your prescription label says the same.",
  },
  {
    title: "Reviewed at follow-ups",
    text: "Plans often begin with a starter supply, and your provider may adjust your plan over time.",
  },
];

function Taken() {
  return (
    <section className="pb-[clamp(2.75rem,6vw,5.5rem)]">
      <div className="mx-auto grid max-w-[1180px] gap-9 px-5 md:px-10 lg:grid-cols-2 lg:items-center lg:gap-14">
        <Reveal
          as="div"
          className={`relative hidden aspect-4/3 overflow-hidden sm:block ${CARD_R}`}
          style={{ background: BAND }}
        >
          <img
            src="/site/ldn/ldn-rings.avif"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-soft-light"
          />
          <div className="absolute inset-0 grid place-items-center">
            <div className="relative w-[38%]">
              <img
                src="/site/sports-medicine/tablet-facet.avif"
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="nv-drift pointer-events-none absolute -right-[42%] -top-[30%] w-[58%] drop-shadow-[0_14px_22px_rgba(70,50,20,0.3)]"
              />
              <img
                src="/site/sports-medicine/tablet-star.avif"
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="nv-float pointer-events-none block w-full drop-shadow-[0_18px_34px_rgba(70,50,20,0.34)]"
              />
            </div>
          </div>
        </Reveal>

        <Reveal as="div" delay={0.08}>
          <span className="nv-eyebrow">How it's taken</span>
          <h2 className={`${H2} mt-3 text-balance`}>Taken by Mouth, at Home</h2>
          <ol className="mt-7">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex items-start gap-3 border-t border-line py-5 first:border-t-0 first:pt-0">
                <span className="w-10 shrink-0 font-display text-[1.6rem] font-extrabold leading-none text-[#b39258]">0{i + 1}</span>
                <div>
                  <h3 className="font-display text-[1.1rem] font-bold leading-snug text-ink sm:text-[1.2rem]">{s.title}</h3>
                  <p className="mt-1.5 max-w-[46ch] text-[0.94rem] leading-relaxed text-muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}

/* 5. WHAT'S INCLUDED: the dark price card, with the rung's own price and supply
   note, so the Starter, Mid-Dose and Maintenance pages each show their own. */

const INCLUDED = [
  "An online intake reviewed by a licensed provider",
  "Low-dose naltrexone tablets, if prescribed",
  "Compounded by a licensed U.S. pharmacy",
  "Discreet home delivery",
  "Follow-up care and guidance throughout your plan",
];

function Included({ product, startTo }) {
  return (
    <section className="mx-auto max-w-[1180px] px-5 pb-[clamp(2.75rem,6vw,5.5rem)] md:px-10">
      <Reveal as="div">
        <div className={`relative grid overflow-hidden lg:grid-cols-2 ${CARD_R}`} style={{ background: CHAMPAGNE }}>
          <div className="relative px-6 pt-9 sm:px-10 sm:pt-12">
            {/* The warm glow behind her. Desktop only: stacked, the column ends
                at the price card and would cut the glow off in a hard line. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 hidden lg:block"
              style={{ background: "radial-gradient(circle at 50% 88%, rgba(255,255,255,0.7), transparent 48%)" }}
            />
            <span className="relative flex items-center gap-2 text-[0.9rem] font-semibold" style={{ color: GOLD_INK }}>
              <span className="h-2 w-2 rounded-full bg-[#977e43]" />
              Provider-guided care
            </span>
            <h2 className={`${TITLE} relative z-10 mt-4 max-w-[20ch] text-[clamp(1.5rem,2.8vw,2.1rem)]`} style={{ color: GOLD_INK }}>
              LDN, prescribed and followed by a licensed provider.
            </h2>
            {/* Cropped at the waist, so she stands on the card's bottom edge.
                Stacked, that cropped edge fades out under the price card. */}
            <img
              src="/site/sports-medicine/ldn-endorphins.avif"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="mx-auto mt-6 block h-72 w-auto object-contain object-bottom [mask-image:linear-gradient(180deg,#000_70%,transparent)] sm:h-80 lg:absolute lg:bottom-0 lg:left-1/2 lg:mt-0 lg:h-[70%] lg:-translate-x-1/2 lg:[mask-image:none]"
            />
          </div>

          {/* Stacked, the card rides up over the photo's cropped bottom edge. */}
          <div className="relative -mt-12 p-4 sm:p-8 lg:mt-0">
            <div className={`bg-white px-6 py-7 sm:px-9 sm:py-9 ${CARD_R}`}>
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="font-display text-[clamp(2.4rem,4vw,3rem)] font-extrabold leading-none text-ink">
                  {priceLabel(product)}
                </span>
                {product.priceNote && <span className="text-[1rem] text-muted">{product.priceNote}</span>}
              </div>
              <p className="mt-2 text-[0.88rem] text-muted">
                You pay only if a provider determines that a prescription is appropriate.
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

export default function LdnSections({ product, startTo = "/start" }) {
  return (
    <>
      <WhatIs startTo={startTo} />
      <div style={{ background: GROUND }}>
        <LowDose />
        <Mechanism startTo={startTo} />
        <Taken />
        <Included product={product} startTo={startTo} />
      </div>
    </>
  );
}
