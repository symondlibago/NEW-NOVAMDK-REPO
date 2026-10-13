import React from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ArrowRight, Brain, Check, KeyRound, Link2 } from "lucide-react";
import Reveal from "../ui/Reveal";
import { priceLabel, productsData } from "../data/products";
import { productPath } from "../../lib/slug";

/* Both PT-141 pages, rebuilt 2026-10-13 on the NAD+ layout (client: one layout
   for every product page). The client kept one idea from the old pages: the
   product with three things around it and the three steps under it, done best
   on the nasal page. Those are restyled to the new look; the rest is the gold
   band, a format comparison and the dark price card. The old timing card was a
   dosing schedule and the mood pills read as promised outcomes, so both are
   gone. The nasal page renders this file with format="nasal". */

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
const EASE = [0.2, 0.7, 0.3, 1];

/* What differs between the two pages: the product art, the first two steps,
   the comparison's point of view and the couple photo. Everything else is
   shared. */
const FORMATS = {
  injection: {
    record: "Bremelanotide Injection",
    name: "PT-141 Injection",
    noun: "injection",
    blur: "/site/sexual-health/pt141-gallery-hero.avif",
    art: "/products/pt-141.avif",
    artSize: "w-[min(80%,19rem)]",
    /* Art width against the disc. The spray bottle is narrow, so its square
       is set larger to stand about as tall as the vial. */
    stageArt: "w-[112%]",
    firstStep: { title: "Injection", text: "A small injection under the skin, as your provider directs." },
    absorb: "Bremelanotide passes from under the skin into the bloodstream.",
    given: "A small injection under the skin",
    needles: "A small needle",
    ships: "A vial",
    compareTitle: "PT-141 Injection, or a Needle-Free Spray",
    compareText: "Both contain bremelanotide. They differ in how it is given and in price.",
    img: "/site/sexual-health/pt141-couple.avif",
    imgPos: "object-[60%_center]",
  },
  nasal: {
    record: "Bremelanotide Nasal Spray",
    name: "PT-141 Nasal Spray",
    noun: "nasal spray",
    blur: "/site/sexual-health/pt141-spray-gallery-hero.avif",
    art: "/products/pt-141-nasal.avif",
    artSize: "w-[min(92%,22rem)]",
    stageArt: "w-[130%]",
    firstStep: { title: "Nasal use", text: "A spray into the nose, as your provider directs." },
    absorb: "Bremelanotide passes through the lining of the nose into the bloodstream.",
    given: "A spray into the nose",
    needles: "None",
    ships: "A nasal spray bottle",
    compareTitle: "Needle-Free PT-141",
    compareText: "The spray contains bremelanotide, like the injection, and is used in the nose instead of under the skin.",
    img: "/site/sexual-health/pt141-nasal-couple.avif",
    imgPos: "object-[70%_center]",
  },
};

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

/* 1. WHAT IS BREMELANOTIDE: the gold band, with the format's own product. */

function WhatIs({ f, startTo }) {
  return (
    <section className="relative overflow-hidden" style={{ background: BAND }}>
      <img
        src={f.blur}
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
                A prescription peptide
              </span>
              <h2 className={`${TITLE} mt-3 text-[clamp(1.8rem,3.6vw,2.7rem)]`} style={{ color: CREAM }}>
                What is Bremelanotide?
              </h2>
              <p className="mt-2 text-[0.9rem]" style={{ color: "rgba(255,232,177,0.75)" }}>
                (also called PT-141)
              </p>
              <p className="mt-5 max-w-[50ch] text-[1rem] leading-relaxed" style={{ color: CREAM }}>
                Bremelanotide is a synthetic peptide that acts on melanocortin receptors in the brain, part of the
                pathways involved in sexual desire. Prescribed as a compounded {f.noun}, only if a licensed
                provider decides it is appropriate.
              </p>
              <StartLink to={startTo} light className="mt-7" />
            </div>

            <div>
              <div className={`mx-auto ${f.artSize}`}>
                {/* The tilt has its own wrapper: the float animates the image's
                    transform and would wipe a rotate set on it. */}
                <span className="block rotate-6">
                  <img
                    src={f.art}
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

/* 2. HOW IT WORKS: the old pages' product with three things around it, now
   white cards drawn to the product on a gold disc, and the three steps under
   it. How the peptide acts, never what it will do for you. */

const POINTS = [
  { icon: Link2, title: "Peptide-based", text: "Bremelanotide is a synthetic peptide, a short chain of amino acids." },
  { icon: KeyRound, title: "Melanocortin activity", text: "It activates several melanocortin receptors, including MC1R and MC4R." },
  { icon: Brain, title: "Central pathway", text: "It works through pathways in the central nervous system." },
];

/* lg grid places: two cards on the left, held close to the middle so their
   hairlines still meet the disc, and one on the right, the disc between. */
const POINT_AT = [
  "lg:col-start-1 lg:row-start-1 lg:self-end",
  "lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:self-center",
  "lg:col-start-1 lg:row-start-2 lg:self-start",
];

function PointCard({ p }) {
  return (
    <div className="flex w-full items-start gap-4 rounded-[18px] border border-line bg-surface p-5 nv-shadow lg:w-72 lg:shrink-0">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px]" style={{ background: BAND }}>
        <p.icon size={22} strokeWidth={1.5} style={{ color: CREAM }} />
      </span>
      <div className="min-w-0">
        <h3 className="font-display text-[1.05rem] font-bold leading-snug text-ink">{p.title}</h3>
        <p className="mt-1 text-[0.9rem] leading-relaxed text-muted">{p.text}</p>
      </div>
    </div>
  );
}

/* The hairline that carries a card to the product, lg only. It runs on under
   the disc, so wherever a card sits it meets the disc's ring. */
function Lead({ flip = false }) {
  return (
    <span
      aria-hidden="true"
      className={`hidden h-px flex-1 bg-[#c1a27a]/70 lg:block ${flip ? "-ml-36 xl:-ml-44" : "-mr-36 xl:-mr-44"}`}
    />
  );
}

function ProductDisc({ f, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <span
        aria-hidden="true"
        className="block aspect-square w-full rounded-full shadow-[0_0_0_14px_rgba(193,162,122,0.14),0_0_0_30px_rgba(193,162,122,0.07)]"
        style={{ background: BAND }}
      />
      <span className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[52%] ${f.stageArt}`}>
        <img
          src={f.art}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="nv-float pointer-events-none block w-full drop-shadow-[0_22px_30px_rgba(70,50,20,0.38)]"
        />
      </span>
    </div>
  );
}

function StepRail({ f }) {
  const steps = [
    f.firstStep,
    { title: "Absorption", text: f.absorb },
    { title: "Receptor activity", text: "It reaches melanocortin receptors in the central nervous system." },
  ];
  return (
    <ol className="mt-7 grid gap-7 sm:grid-cols-3 sm:gap-6">
      {steps.map((s, i) => (
        <li key={s.title} className="flex items-start gap-4 sm:block">
          <div className="flex items-center gap-4">
            <Reveal
              as="span"
              y={0}
              duration={0.5}
              delay={i * 0.16}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-[0.95rem] font-semibold"
              style={{ background: BAND, color: CREAM }}
            >
              {i + 1}
            </Reveal>
            {i < steps.length - 1 && (
              /* Clipped rather than scaled: scaleX on a 1px rule thins it. */
              <Motion.span
                aria-hidden="true"
                className="hidden h-px flex-1 bg-[#c1a27a]/60 sm:block"
                initial={{ clipPath: "inset(0 100% 0 0)" }}
                whileInView={{ clipPath: "inset(0 0% 0 0)" }}
                viewport={{ once: true, margin: "-80px 0px -80px 0px" }}
                transition={{ duration: 0.5, ease: EASE, delay: i * 0.16 + 0.26 }}
              />
            )}
          </div>
          <div className="min-w-0 sm:mt-4 sm:pr-6">
            <h4 className="font-display text-[1.05rem] font-bold leading-snug text-ink">{s.title}</h4>
            <p className="mt-1 text-[0.92rem] leading-relaxed text-muted">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function HowItWorks({ f }) {
  return (
    <section className="py-[clamp(2.75rem,6vw,5.5rem)]">
      <div className="mx-auto max-w-[1180px] px-5 md:px-10">
        <Reveal as="div" className="text-center">
          <span className="nv-eyebrow">How it works</span>
          <h2 className={`${H2} mx-auto mt-3 max-w-[20ch]`}>A Peptide That Acts Through the Brain</h2>
        </Reveal>

        <div className="mx-auto mt-10 grid max-w-xl gap-3 sm:mt-12 lg:max-w-none lg:grid-cols-[1fr_18rem_1fr] lg:grid-rows-2 lg:gap-x-0 lg:gap-y-10 xl:grid-cols-[1fr_22rem_1fr]">
          <Reveal as="div" className="relative z-10 mx-auto mb-8 w-56 sm:w-64 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mb-0 lg:w-full lg:self-center">
            <ProductDisc f={f} />
          </Reveal>
          {POINTS.map((p, i) => (
            <Reveal
              as="div"
              key={p.title}
              delay={0.1 + i * 0.1}
              y={14}
              className={`flex items-center ${POINT_AT[i]} ${i === 1 ? "lg:flex-row-reverse" : ""}`}
            >
              <PointCard p={p} />
              <Lead flip={i === 1} />
            </Reveal>
          ))}
        </div>

        <div className="mt-14 border-t border-line pt-9 sm:mt-16">
          <h3 className="font-display text-[1.2rem] font-bold text-[#725826]">From {f.noun} to receptor</h3>
          <StepRail f={f} />
          <p className="mt-9 border-t border-line pt-5 text-[0.76rem] italic leading-relaxed text-muted">
            How bremelanotide works in the body, not an expected result of treatment. Individual response varies.
          </p>
        </div>
      </div>
    </section>
  );
}

/* 3. THE COMPARISON: injection against nasal spray, from this page's side.
   Where, how and what it costs; nothing says one works better. */

function Compare({ f, format, product, startTo }) {
  const other = FORMATS[format === "nasal" ? "injection" : "nasal"];
  const otherRecord = productsData.find((p) => p.name === other.record);
  const rows = [
    { label: "How it's given", ours: f.given, theirs: other.given },
    { label: "Needles", ours: f.needles, theirs: other.needles },
    { label: "Ships as", ours: f.ships, theirs: other.ships },
    { label: "Pricing", ours: priceLabel(product), theirs: priceLabel(otherRecord) },
  ];
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <section className="pb-[clamp(2.75rem,6vw,5.5rem)]">
      <div className="mx-auto grid max-w-[1180px] gap-9 px-5 md:px-10 lg:grid-cols-2 lg:items-center lg:gap-14">
        <Reveal as="div">
          <span className="nv-eyebrow">
            {cap(f.noun)} or {other.noun}
          </span>
          <h2 className={`${H2} mt-3 max-w-[18ch]`}>{f.compareTitle}</h2>
          <p className="mt-4 max-w-[48ch] text-[1rem] leading-relaxed text-muted">{f.compareText}</p>

          <div className={`mt-7 overflow-hidden border border-line bg-surface ${CARD_R}`}>
            <div className="grid grid-cols-[0.8fr_1fr_1fr] gap-3 bg-surface-2 px-4 py-3 text-[0.78rem] font-bold text-ink sm:px-5">
              <span />
              <span>{cap(f.noun)}</span>
              <span className="text-muted">{cap(other.noun)}</span>
            </div>
            {rows.map((r) => (
              <div key={r.label} className="grid grid-cols-[0.8fr_1fr_1fr] gap-3 border-t border-line px-4 py-3.5 text-[0.86rem] leading-snug sm:px-5">
                <span className="font-semibold text-ink">{r.label}</span>
                <span className="text-ink">{r.ours}</span>
                <span className="text-muted">{r.theirs}</span>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4">
            <StartLink to={startTo} />
            {otherRecord && (
              <Link
                to={productPath(otherRecord)}
                className="group inline-flex items-center gap-1.5 text-[0.95rem] font-semibold text-[#725826] underline decoration-line-strong underline-offset-4 hover:decoration-[#725826]"
              >
                See {other.name}
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </Reveal>

        <Reveal as="div" delay={0.08} className={`relative hidden overflow-hidden sm:block ${CARD_R}`}>
          <img
            src={f.img}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className={`aspect-4/3 w-full object-cover lg:aspect-5/6 ${f.imgPos}`}
          />
        </Reveal>
      </div>
    </section>
  );
}

/* 4. WHAT'S INCLUDED: the dark price card, with the record's own price. Priced
   per fill, not a plan, so there is no cancel line. */

const included = (f) => [
  "An online intake reviewed by a licensed provider",
  `${f.name}, if prescribed`,
  "Compounded by a licensed U.S. pharmacy",
  "Discreet home delivery",
  "Follow-up care and guidance from your provider",
];

function Included({ f, product, startTo }) {
  return (
    <section className="mx-auto max-w-[1180px] px-5 pb-[clamp(2.75rem,6vw,5.5rem)] md:px-10">
      <Reveal as="div">
        <div className={`relative grid overflow-hidden lg:grid-cols-2 ${CARD_R}`} style={{ background: CHAMPAGNE }}>
          {/* The warm glow behind her, across the whole card so it fades out
              under the price card rather than stopping at the column's edge.
              Desktop only: stacked, the photo sits higher than the glow. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden lg:block"
            style={{ background: "radial-gradient(circle at 25% 88%, rgba(255,255,255,0.7), transparent 36%)" }}
          />
          <div className="relative px-6 pt-9 sm:px-10 sm:pt-12">
            <span className="relative flex items-center gap-2 text-[0.9rem] font-semibold" style={{ color: GOLD_INK }}>
              <span className="h-2 w-2 rounded-full bg-[#977e43]" />
              Provider-guided care
            </span>
            <h2 className={`${TITLE} relative z-10 mt-4 max-w-[20ch] text-[clamp(1.5rem,2.8vw,2.1rem)]`} style={{ color: GOLD_INK }}>
              {f.name}, prescribed and followed by a licensed provider.
            </h2>
            {/* A woman in the page's audience, 35 to 60: anti-aging's
                benefit-vitality with its matte pulled in, as the original
                showed a light halo on the dark card. Stacked, her cropped
                waist fades out under the price card. */}
            <img
              src="/site/bremelanotide/price-woman.avif"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="mx-auto mt-6 block h-64 w-auto object-contain object-bottom [mask-image:linear-gradient(180deg,#000_70%,transparent)] sm:h-80 lg:absolute lg:bottom-0 lg:left-1/2 lg:mt-0 lg:h-[60%] lg:-translate-x-1/2 lg:[mask-image:none]"
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
                {included(f).map((t) => (
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

export default function BremelanotideSections({ product, format = "injection", startTo = "/start" }) {
  const f = FORMATS[format];
  return (
    <>
      <WhatIs f={f} startTo={startTo} />
      <div style={{ background: GROUND }}>
        <HowItWorks f={f} />
        <Compare f={f} format={format} product={product} startTo={startTo} />
        <Included f={f} product={product} startTo={startTo} />
      </div>
    </>
  );
}
