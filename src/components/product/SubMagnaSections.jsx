import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Clock, Droplets, Leaf, Zap } from "lucide-react";
import Reveal from "../ui/Reveal";
import { priceLabel } from "../data/products";

/* Semaglutide Sublingual Drops (SubMagna), built 2026-10-14 on the Lipo-C and
 * NAD+ layout, which is the one layout every product page uses now.
 *
 * The page has one job the injection pages do not: explain that this is the
 * same molecule by a different route. So it runs what it is, then how the
 * sublingual route works, then the two routes side by side, then the three
 * dose stages, then the price card.
 *
 * Deliberately absent: any mg or mg/mL figure, any refrigeration claim, and
 * any comparison that says one route works better than the other. The records
 * disagree with each other on refrigeration (the Starter's safety text says
 * store refrigerated, the Mid-Dose subtitle says no refrigeration), so neither
 * statement belongs on a public page until the pharmacy settles it. The specs
 * accordion further down the page carries the exact figures.
 */

const BAND = "radial-gradient(circle at 30% 40%, #c1a27a, #9a7843)";
/* The light champagne the client set on 2026-10-13 for every price card. */
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

/* 1. WHAT IT IS: the gold band, with the bottle. */

function WhatIs({ startTo }) {
  return (
    <section className="relative overflow-hidden" style={{ background: BAND }}>
      <div className="relative mx-auto max-w-[1180px] px-5 py-[clamp(2.5rem,6vw,5.5rem)] md:px-10">
        <Reveal as="div">
          <div
            className={`grid gap-8 border border-white/25 bg-white/10 p-6 backdrop-blur-md sm:p-10 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-12 lg:p-14 ${CARD_R}`}
          >
            <div>
              <span
                className="text-[0.75rem] font-bold uppercase tracking-[0.16em]"
                style={{ color: "rgba(255,232,177,0.8)" }}
              >
                A needle-free GLP-1
              </span>
              <h2 className={`${TITLE} mt-3 text-[clamp(1.8rem,3.6vw,2.7rem)]`} style={{ color: CREAM }}>
                Semaglutide, without the needle.
              </h2>
              <p className="mt-5 max-w-[50ch] text-[1rem] leading-relaxed" style={{ color: CREAM }}>
                These are drops, not an injection. Semaglutide is compounded into a SubMagna® sublingual base, held
                under the tongue and taken in through the lining of the mouth. It is the same molecule the injections
                use, by a different route.
              </p>
              <StartLink to={startTo} light className="mt-7" />
            </div>

            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(circle at 50% 55%, rgba(255,232,177,0.3), transparent 62%)" }}
              />
              <img
                src="/products/detail/semaglutide-sublingual-drops.avif"
                alt="Semaglutide sublingual drops bottle"
                loading="lazy"
                className="relative mx-auto block h-56 w-auto object-contain drop-shadow-2xl sm:h-72 lg:h-80"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* 2. THE ROUTE: three steps, on a rail that draws itself in. */

const STEPS = [
  {
    icon: Droplets,
    title: "The drops go under your tongue",
    text: "You measure the amount your prescription label sets, straight from the bottle.",
  },
  {
    icon: Clock,
    title: "You hold them there",
    text: "They stay under the tongue for a short moment rather than being swallowed straight away.",
  },
  {
    icon: Zap,
    title: "They absorb through the lining",
    text: "The tissue under the tongue takes the semaglutide in, so it does not pass through the stomach first.",
  },
];

function HowItWorks() {
  return (
    <section className="mx-auto max-w-[1180px] px-5 py-[clamp(2.75rem,6vw,5.5rem)] md:px-10">
      <Reveal as="div">
        <span className="text-[0.75rem] font-bold uppercase tracking-[0.16em] text-[#977e43]">
          How sublingual works
        </span>
        <h2 className={`${H2} mt-3 max-w-[24ch]`}>Three steps, once a day.</h2>
      </Reveal>

      <div className="relative mt-9 grid gap-6 md:mt-12 md:grid-cols-3 md:gap-7">
        {/* The rail behind the discs. Desktop only: stacked, the cards sit
            flush and a horizontal line would cut across them. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-[#d8c49a] to-transparent md:block"
        />
        {STEPS.map(({ icon, title, text }, i) => {
          // Assigned rather than destructured as `icon: Icon` — the repo's
          // no-unused-vars only exempts capitalised variables, not params.
          const Icon = icon;
          return (
          <Reveal key={title} as="div" delay={i * 0.08}>
            <div className="relative flex gap-4 md:block">
              <span
                className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#e3d3b2] bg-white text-[#977e43] nv-shadow"
                aria-hidden="true"
              >
                <Icon size={22} strokeWidth={1.9} />
              </span>
              <div className="md:mt-5">
                <span className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#a8906a]">
                  Step {i + 1}
                </span>
                <h3 className="mt-1.5 font-display text-[1.1rem] font-extrabold leading-snug text-ink">{title}</h3>
                <p className="mt-2 max-w-[34ch] text-[0.94rem] leading-relaxed text-muted">{text}</p>
              </div>
            </div>
          </Reveal>
          );
        })}
      </div>

      <Reveal as="div">
        <p className="mt-9 border-t border-line pt-5 text-[0.78rem] leading-relaxed text-muted">
          How the route works, not an expected result of treatment. Follow your prescription label and your provider's
          instructions, which set the amount and the timing for you.
        </p>
      </Reveal>
    </section>
  );
}

/* 3. THE TWO ROUTES, side by side. Differences only, no better or worse. */

const ROUTES = [
  {
    label: "Sublingual drops",
    note: "This product",
    dark: true,
    rows: [
      ["How you take it", "Drops held under the tongue"],
      ["How often", "Once a day"],
      ["What you handle", "A bottle and a dropper"],
    ],
  },
  {
    label: "Subcutaneous injection",
    note: "The vial options",
    dark: false,
    rows: [
      ["How you take it", "A small injection under the skin"],
      ["How often", "Once a week"],
      ["What you handle", "A vial and a syringe"],
    ],
  },
];

function Routes({ startTo }) {
  return (
    <section className="mx-auto max-w-[1180px] px-5 pb-[clamp(2.75rem,6vw,5.5rem)] md:px-10">
      <Reveal as="div">
        <span className="text-[0.75rem] font-bold uppercase tracking-[0.16em] text-[#977e43]">
          Two ways to take it
        </span>
        <h2 className={`${H2} mt-3 max-w-[26ch]`}>The same molecule, two routes.</h2>
        <p className="mt-4 max-w-[58ch] text-[1rem] leading-relaxed text-muted">
          Neither route is the right one for everybody. Your provider reviews your intake and decides which, if either,
          suits you.
        </p>
      </Reveal>

      <div className="mt-8 grid gap-5 md:grid-cols-2 md:gap-6">
        {ROUTES.map(({ label, note, dark, rows }, i) => (
          <Reveal key={label} as="div" delay={i * 0.08}>
            <div
              className={`h-full overflow-hidden border p-6 sm:p-8 ${CARD_R} ${
                dark ? "border-[#b79a63] bg-[#f6efe0]" : "border-line bg-white"
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-[1.15rem] font-extrabold leading-snug text-ink">{label}</h3>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-[0.66rem] font-bold uppercase tracking-[0.1em]"
                  style={
                    dark
                      ? { backgroundColor: "#977e43", color: "#fff" }
                      : { backgroundColor: "var(--color-surface-2, #f4f2ee)", color: "#8a7a5e" }
                  }
                >
                  {note}
                </span>
              </div>
              <dl className="mt-5 grid gap-3.5">
                {rows.map(([k, v]) => (
                  <div key={k} className="border-t border-line/70 pt-3.5">
                    <dt className="text-[0.74rem] font-bold uppercase tracking-[0.12em] text-[#a8906a]">{k}</dt>
                    <dd className="mt-1 text-[0.96rem] leading-snug text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal as="div">
        <StartLink to={startTo} className="mt-8" />
      </Reveal>
    </section>
  );
}

/* 4. THE STAGES. The windows come from the three records' Days Supply; the
      bottle figures stay in the specs accordion rather than being repeated
      here, since they carry concentrations. */

const STAGES = [
  { when: "Month 1", title: "Starting out", text: "The first bottle covers your opening month on the drops." },
  { when: "Months 2 and 3", title: "Settling in", text: "Your provider reviews how you are doing before the next step." },
  { when: "Month 4 onward", title: "Ongoing care", text: "Refills continue month by month while the plan is right for you." },
];

function Stages() {
  return (
    <section className="mx-auto max-w-[1180px] px-5 pb-[clamp(2.75rem,6vw,5.5rem)] md:px-10">
      <Reveal as="div">
        <span className="text-[0.75rem] font-bold uppercase tracking-[0.16em] text-[#977e43]">Your plan</span>
        <h2 className={`${H2} mt-3 max-w-[24ch]`}>A provider-guided schedule.</h2>
      </Reveal>

      <div className="mt-8 grid gap-5 sm:grid-cols-3 sm:gap-6">
        {STAGES.map(({ when, title, text }, i) => (
          <Reveal key={when} as="div" delay={i * 0.08}>
            <div className={`h-full border border-line bg-white p-6 ${CARD_R}`}>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#f6efe0] px-3 py-1 text-[0.74rem] font-bold uppercase tracking-[0.1em] text-[#8a6f33]">
                <Leaf size={13} strokeWidth={2.2} />
                {when}
              </span>
              <h3 className="mt-4 font-display text-[1.08rem] font-extrabold leading-snug text-ink">{title}</h3>
              <p className="mt-2 text-[0.94rem] leading-relaxed text-muted">{text}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal as="div">
        <p className="mt-7 text-[0.78rem] leading-relaxed text-muted">
          Your provider sets the amount and the schedule, and may change them. The exact bottle sizes for each stage are
          in the details below.
        </p>
      </Reveal>
    </section>
  );
}

/* 5. WHAT'S INCLUDED: the champagne price card, with the record's own price. */

const INCLUDED = [
  "An online intake reviewed by a licensed provider",
  "Semaglutide Sublingual Drops, if prescribed",
  "Compounded by a licensed U.S. pharmacy",
  "Discreet home delivery",
  "Follow-up care and guidance throughout your plan",
];

function Included({ product, startTo }) {
  return (
    <section className="mx-auto max-w-[1180px] px-5 pb-[clamp(2.75rem,6vw,5.5rem)] md:px-10">
      <Reveal as="div">
        <div className={`relative grid overflow-hidden lg:grid-cols-2 ${CARD_R}`} style={{ background: CHAMPAGNE }}>
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
            <h2
              className={`${TITLE} relative z-10 mt-4 max-w-[20ch] text-[clamp(1.5rem,2.8vw,2.1rem)]`}
              style={{ color: GOLD_INK }}
            >
              Reviewed, prescribed and followed by a licensed provider.
            </h2>
            <img
              src="/site/goals/weightlossnobg.avif"
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

export default function SubMagnaSections({ product, startTo = "/start" }) {
  return (
    <>
      <WhatIs startTo={startTo} />
      <div style={{ background: GROUND }}>
        <HowItWorks />
        <Routes startTo={startTo} />
        <Stages />
        <Included product={product} startTo={startTo} />
      </div>
    </>
  );
}
