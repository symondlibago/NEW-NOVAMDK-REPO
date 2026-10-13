import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Brain, Check, Droplet, Waves } from "lucide-react";
import Reveal from "../ui/Reveal";
import { priceLabel } from "../data/products";

/* Olympus Peak, rebuilt 2026-10-13 on the NAD+ layout (client: one layout for
   every product page): what it is on the gold band, the three ingredients and
   how each works in the body, how the tablet is taken, and the dark price
   card. Facts (form, ingredients, who it is for) checked against the
   compounding pharmacy's own listing; none of its claims are used. The old
   desire / performance / arousal tiles read as outcomes, so they are gone. The
   compounded notice lives in Important Safety Information, not here. */

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

/* 1. WHAT IS OLYMPUS PEAK: the gold band, with the light glass bottle. */

function WhatIs({ startTo }) {
  return (
    <section className="relative overflow-hidden" style={{ background: BAND }}>
      <img
        src="/products/detail/olympus-peak-hero.avif"
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
                A compounded sublingual tablet
              </span>
              <h2 className={`${TITLE} mt-3 text-[clamp(1.8rem,3.6vw,2.7rem)]`} style={{ color: CREAM }}>
                What is Olympus Peak?
              </h2>
              <p className="mt-5 max-w-[50ch] text-[1rem] leading-relaxed" style={{ color: CREAM }}>
                Olympus Peak is a compounded prescription tablet for men. It combines tadalafil, bremelanotide and
                oxytocin in one formula, and it dissolves under the tongue.
              </p>
              <StartLink to={startTo} light className="mt-7" />
            </div>

            {/* The cut-out is a square with the bottle in its middle third, so
                the box runs wider than the bottle it shows. */}
            <div className="mx-auto w-[min(78%,19rem)] lg:w-[min(96%,24rem)]">
              {/* The tilt has its own wrapper: the float animates the image's
                  transform and would wipe a rotate set on it. */}
              <span className="block rotate-6">
                <img
                  src="/products/olympus-peak.avif"
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

/* 2. INSIDE THE FORMULA: the three ingredients, held heading beside a column
   of rows as NAD+ has it. Drug class and how each acts in the body, never
   what the tablet will do for you. */

const INGREDIENTS = [
  {
    icon: Waves,
    name: "Tadalafil",
    kind: "PDE5 inhibitor",
    text: "Blocks PDE5, an enzyme in blood vessel walls, which lets the smooth muscle there relax.",
  },
  {
    icon: Brain,
    name: "Bremelanotide (PT-141)",
    kind: "Melanocortin receptor agonist",
    text: "Acts on melanocortin receptors in the brain.",
  },
  {
    icon: Droplet,
    name: "Oxytocin",
    kind: "Peptide hormone",
    text: "A hormone the body also makes. It acts on oxytocin receptors in the brain and other tissues.",
  },
];

function Formula({ startTo }) {
  return (
    <section className="py-[clamp(2.75rem,6vw,5.5rem)]">
      <div className="mx-auto grid max-w-[1180px] gap-8 px-5 md:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal as="div">
            <span className="nv-eyebrow">Inside the formula</span>
            <h2 className={`${H2} mt-3 max-w-[14ch]`}>Three Ingredients in One Tablet</h2>
            <p className="mt-4 max-w-[40ch] text-[1rem] leading-relaxed text-muted">
              Each ingredient comes from a different drug class and acts in its own way.
            </p>
            <StartLink to={startTo} className="mt-7 hidden lg:inline-flex" />
          </Reveal>
        </div>

        <div>
          <ul>
            {INGREDIENTS.map((r, i) => (
              <Reveal
                as="li"
                key={r.name}
                delay={(i % 2) * 0.05}
                className="flex items-center gap-5 border-t border-line py-5 first:border-t-0 first:pt-0 sm:gap-8 sm:py-7"
              >
                <span
                  className="relative grid aspect-3/2 w-28 shrink-0 place-items-center overflow-hidden rounded-[18px] sm:w-48"
                  style={{ background: BAND }}
                >
                  <img
                    src="/site/sports-medicine/ldn-cells.avif"
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover opacity-70 mix-blend-soft-light"
                  />
                  <r.icon size={36} strokeWidth={1.4} className="relative h-7 w-7 sm:h-10 sm:w-10" style={{ color: CREAM }} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-[1.1rem] font-bold leading-snug text-ink sm:text-[1.3rem]">{r.name}</h3>
                  <span className="mt-2 inline-block rounded-full border border-[#e3d3b0] bg-[#f6efe0] px-2.5 py-0.5 text-[0.76rem] font-semibold text-[#6b511e]">
                    {r.kind}
                  </span>
                  <p className="mt-2 max-w-[46ch] text-[0.9rem] leading-relaxed text-muted sm:text-[0.98rem]">{r.text}</p>
                </div>
              </Reveal>
            ))}
          </ul>
          <p className="mt-6 border-t border-line pt-5 text-[0.76rem] italic leading-relaxed text-muted">
            How each ingredient works in the body, not an expected result of treatment. Individual response varies.
            Prescribing these ingredients together in one tablet is off-label.
          </p>
        </div>
      </div>
    </section>
  );
}

/* 3. HOW IT'S TAKEN: plain terms only. The amount and timing are the
   provider's call and stay on the prescription label, never on the page. */

const TAKEN = [
  { title: "Under the tongue", text: "The tablet is placed under the tongue and left to dissolve. There is no needle." },
  { title: "As your provider directs", text: "Your provider sets the amount and timing on your prescription label." },
  { title: "10 tablets per prescription", text: "Shipped to your door in discreet packaging." },
];

function Taken() {
  return (
    <section className="pb-[clamp(2.75rem,6vw,5.5rem)]">
      <div className="mx-auto grid max-w-[1180px] gap-9 px-5 md:px-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-14">
        <Reveal as="div">
          <span className="nv-eyebrow">Sublingual</span>
          <h2 className={`${H2} mt-3 max-w-[18ch]`}>How It's Taken</h2>
          <ul className="mt-7">
            {TAKEN.map((t) => (
              <li key={t.title} className="flex items-start gap-4 border-t border-line py-4 first:border-t-0 first:pt-0">
                <Check size={18} strokeWidth={2.4} className="mt-1 shrink-0 text-[#977e43]" />
                <div>
                  <h3 className="font-display text-[1.1rem] font-bold leading-snug text-ink">{t.title}</h3>
                  <p className="mt-1 text-[0.94rem] leading-relaxed text-muted">{t.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* A single tablet on the gold, in place of a photo. */}
        <Reveal
          as="div"
          delay={0.08}
          className={`relative grid aspect-4/3 place-items-center overflow-hidden lg:aspect-square ${CARD_R}`}
          style={{ background: BAND }}
        >
          <img
            src="/products/detail/olympus-peak-2.avif"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 mix-blend-soft-light blur-2xl"
          />
          <span className="relative -mt-8 block w-[40%] -rotate-12 sm:w-[44%] lg:mt-0">
            <img
              src="/site/pill.avif"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="nv-float pointer-events-none block w-full drop-shadow-[0_22px_30px_rgba(70,50,20,0.36)]"
            />
          </span>
          <span
            className="absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-[0.8rem] font-semibold backdrop-blur-md"
            style={{ color: CREAM }}
          >
            Dissolves under the tongue
          </span>
        </Reveal>
      </div>
    </section>
  );
}

/* 4. WHAT'S INCLUDED: the dark price card, with the record's own price. One
   fill, not a plan, so there is nothing to cancel. */

const INCLUDED = [
  "An online intake reviewed by a licensed provider",
  "Olympus Peak, 10 sublingual tablets, if prescribed",
  "Compounded by a licensed U.S. pharmacy",
  "Discreet home delivery",
  "Follow-up care and guidance from your provider",
];

function Included({ product, startTo }) {
  return (
    <section className="mx-auto max-w-[1180px] px-5 pb-[clamp(2.75rem,6vw,5.5rem)] md:px-10">
      <Reveal as="div">
        <div className={`relative grid overflow-hidden lg:grid-cols-2 ${CARD_R}`} style={{ background: CHAMPAGNE }}>
          {/* The warm glow behind them, laid over the whole card so it cannot
              stop in a hard line at the column edge. Desktop only: stacked, it
              would end at the price card the same way. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden lg:block"
            style={{ background: "radial-gradient(circle at 27% 92%, rgba(193,162,122,0.36), transparent 42%)" }}
          />
          <div className="relative px-6 pt-9 sm:px-10 sm:pt-12">
            <span className="relative flex items-center gap-2 text-[0.9rem] font-semibold" style={{ color: GOLD_INK }}>
              <span className="h-2 w-2 rounded-full bg-[#977e43]" />
              Provider-guided care
            </span>
            <h2 className={`${TITLE} relative z-10 mt-4 max-w-[20ch] text-[clamp(1.5rem,2.8vw,2.1rem)]`} style={{ color: GOLD_INK }}>
              Olympus Peak, prescribed and followed by a licensed provider.
            </h2>
            {/* A couple, dressed and close, kept discreet. The cut-out is
                cropped at the hips, so it stands on the card's bottom edge;
                stacked, that crop fades out under the price card. */}
            <img
              src="/site/sexual-health/hero-couple.avif"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="mx-auto mt-6 block h-72 w-auto object-contain object-bottom [mask-image:linear-gradient(180deg,#000_70%,transparent)] sm:h-96 lg:absolute lg:bottom-0 lg:left-[54%] lg:mt-0 lg:h-[62%] lg:-translate-x-1/2 lg:[mask-image:none]"
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

export default function OlympusSections({ product, startTo = "/start" }) {
  return (
    <>
      <WhatIs startTo={startTo} />
      <div style={{ background: GROUND }}>
        <Formula startTo={startTo} />
        <Taken />
        <Included product={product} startTo={startTo} />
      </div>
    </>
  );
}
