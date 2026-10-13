import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Atom, Check, Droplets, Leaf, Zap } from "lucide-react";
import Reveal from "../ui/Reveal";
import { priceLabel } from "../data/products";

/* Lipo-C, rebuilt 2026-10-13 on the NAD+ layout (client: one layout for every
   product page): what it is on the gold band, then the old page's second block
   kept in its own format (copy beside the photo of the woman), now carrying the
   "complement your plan" message the brass rail held, then the four
   ingredients and the dark price card. The brass field with the vial and its
   callout panels is gone; its ingredients became the rows below. Nothing here
   promises weight loss or fat burning: each ingredient is described by what it
   is and where it takes part in metabolism, never by an amount. */

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

/* 1. WHAT IS LIPO-C: the gold band, with the vial. */

function WhatIs({ startTo }) {
  return (
    <section className="relative overflow-hidden" style={{ background: BAND }}>
      <img
        src="/site/weight-loss/lipo-c-gallery-pedestal.avif"
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
                A lipotropic injection
              </span>
              <h2 className={`${TITLE} mt-3 text-[clamp(1.8rem,3.6vw,2.7rem)]`} style={{ color: CREAM }}>
                What is Lipo-C?
              </h2>
              <p className="mt-5 max-w-[50ch] text-[1rem] leading-relaxed" style={{ color: CREAM }}>
                Lipo-C is a compounded injection that combines four nutrients: methionine, choline, L-carnitine and
                dexpanthenol. Each one takes part in how the body processes fats and makes energy.
              </p>
              <StartLink to={startTo} light className="mt-7" />
            </div>

            <div>
              <div className="mx-auto w-[min(100%,24rem)]">
                {/* The tilt has its own wrapper: the float animates the image's
                    transform and would wipe a rotate set on it. */}
                <span className="block rotate-6">
                  <img
                    src="/products/lipo-c-vial.avif"
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="nv-float pointer-events-none block w-full drop-shadow-[0_18px_34px_rgba(70,50,20,0.34)]"
                  />
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* 2. WHERE IT FITS: the old page's second block, kept in its format at the
   client's request (2026-10-13): copy and a Start link beside the photo. */

function Fits({ startTo }) {
  return (
    <section className="py-[clamp(2.75rem,6vw,5.5rem)]">
      <div className="mx-auto grid max-w-[1180px] gap-9 px-5 md:px-10 lg:grid-cols-[0.9fr_1fr] lg:items-center lg:gap-16">
        <Reveal as="div">
          <span className="nv-eyebrow">Where it fits</span>
          <h2 className={`${H2} mt-3 max-w-[16ch]`}>Built to Complement Your Plan</h2>
          <p className="mt-4 max-w-[44ch] text-[1rem] leading-relaxed text-muted">
            Lipo-C does not replace nutrition, movement or the rest of your care. A licensed provider reviews your
            health history and goals, then decides if it is appropriate for you.
          </p>
          <StartLink to={startTo} className="mt-7" />
        </Reveal>

        <Reveal as="div" delay={0.08} className={`overflow-hidden ${CARD_R}`}>
          <img
            src="/site/weight-loss/lipo-c-woman.avif"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="aspect-5/4 w-full object-cover object-[42%_center] lg:aspect-square"
          />
        </Reveal>
      </div>
    </section>
  );
}

/* 3. INSIDE THE FORMULA: the four ingredients, held heading beside a column of
   rows as NAD+ has it. What each one is and where it takes part, no amounts.
   No Start link here: the block above has one a scroll away. */

const INGREDIENTS = [
  {
    icon: Atom,
    title: "Methionine",
    text: "An essential amino acid. The body uses it in normal metabolism, including in the liver.",
  },
  {
    icon: Droplets,
    title: "Choline",
    text: "A nutrient the liver uses to package fats and move them out to the rest of the body.",
  },
  {
    icon: Zap,
    title: "L-Carnitine",
    text: "Carries fatty acids into the mitochondria, the part of the cell that turns them into energy.",
  },
  {
    icon: Leaf,
    title: "Dexpanthenol",
    text: "A form of vitamin B5, which cells use to make coenzyme A, a molecule central to energy metabolism.",
  },
];

function Formula() {
  return (
    <section className="pb-[clamp(2.75rem,6vw,5.5rem)]">
      <div className="mx-auto grid max-w-[1180px] gap-8 px-5 md:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal as="div">
            <span className="nv-eyebrow">Inside the formula</span>
            <h2 className={`${H2} mt-3 max-w-[14ch]`}>Four Nutrients in One Injection</h2>
            <p className="mt-4 max-w-[40ch] text-[1rem] leading-relaxed text-muted">
              Each ingredient plays its own part in normal metabolism.
            </p>
          </Reveal>
        </div>

        <div>
          <ul>
            {INGREDIENTS.map((r, i) => (
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
                    src="/site/sports-medicine/ldn-rebound.avif"
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-soft-light"
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
            How each ingredient works in the body, not an expected result of treatment. Individual response varies.
          </p>
        </div>
      </div>
    </section>
  );
}

/* 4. WHAT'S INCLUDED: the dark price card, with the record's own price. */

const INCLUDED = [
  "An online intake reviewed by a licensed provider",
  "Lipo-C Injection, if prescribed",
  "Compounded by a licensed U.S. pharmacy",
  "Discreet home delivery",
  "Follow-up care and guidance throughout your plan",
];

function Included({ product, startTo }) {
  return (
    <section className="mx-auto max-w-[1180px] px-5 pb-[clamp(2.75rem,6vw,5.5rem)] md:px-10">
      <Reveal as="div">
        <div className={`relative grid overflow-hidden lg:grid-cols-2 ${CARD_R}`} style={{ background: CHAMPAGNE }}>
          {/* The warm glow behind her, laid on the whole card so it fades out
              before the price card instead of ending at the column's edge.
              Desktop only: stacked, it would sit under the price card. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden lg:block"
            style={{ background: "radial-gradient(circle at 22% 92%, rgba(193,162,122,0.36), transparent 42%)" }}
          />
          <div className="relative px-6 pt-9 sm:px-10 sm:pt-12">
            <span className="relative flex items-center gap-2 text-[0.9rem] font-semibold" style={{ color: GOLD_INK }}>
              <span className="h-2 w-2 rounded-full bg-[#977e43]" />
              Provider-guided care
            </span>
            <h2 className={`${TITLE} relative z-10 mt-4 max-w-[20ch] text-[clamp(1.5rem,2.8vw,2.1rem)]`} style={{ color: GOLD_INK }}>
              Lipo-C, prescribed and followed by a licensed provider.
            </h2>
            {/* A woman in the page's audience, 35 to 60. The cut-out is cropped
                at her left hand, so it is set against the card's left edge,
                where the crop meets the edge. Stacked, its cropped bottom fades
                out under the price card. */}
            <img
              src="/site/goals/longevity.avif"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="-ml-6 mt-6 block h-72 w-auto object-contain object-bottom [mask-image:linear-gradient(180deg,#000_70%,transparent)] sm:-ml-10 sm:h-96 lg:absolute lg:bottom-0 lg:left-0 lg:ml-0 lg:mt-0 lg:h-[60%] lg:[mask-image:none]"
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

export default function LipoCSections({ product, startTo = "/start" }) {
  return (
    <>
      <WhatIs startTo={startTo} />
      <div style={{ background: GROUND }}>
        <Fits startTo={startTo} />
        <Formula />
        <Included product={product} startTo={startTo} />
      </div>
    </>
  );
}
