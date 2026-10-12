import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Dna, Hourglass, SlidersHorizontal, Zap } from "lucide-react";
import Reveal from "../ui/Reveal";
import { priceLabel, productsData } from "../data/products";
import NadDeclineGraph from "./NadDeclineGraph";

/* Both NAD+ pages, rebuilt 2026-10-12 with goodlifemeds.com's NAD+ page as the
   client's reference, in the same format as Sermorelin: what it is on the gold
   band, the decline with age on white, where NAD+ works in the cell, a
   comparison, what is included and the sources. Their benefit claims, reviews
   and promotions are left out. The injection went first; the tablet followed
   the same day on the same layout, losing its daily energy meter, which read as
   a promised outcome. */

const BAND = "radial-gradient(circle at 30% 40%, #c1a27a, #9a7843)";
const DARK = "linear-gradient(160deg, #3a2f1f 0%, #2a2217 55%, #1f1a12 100%)";
const CREAM = "#ffe8b1";
const GROUND = "#fbfaf7";
const TITLE = "font-display font-extrabold leading-[1.1]";
const H2 = `${TITLE} text-[clamp(1.7rem,3.4vw,2.5rem)] text-[#725826]`;
const CARD_R = "rounded-[calc(24px*var(--nv-r-scale,1))]";

/* What differs between the two pages: the product art, the comparison and the
   price card. Everything else is shared. */
const FORMATS = {
  injection: {
    name: "NAD+ Injection",
    blur: "/products/detail/nad-plus-2.avif",
    art: "/products/nad-plus.avif",
    artSize: "w-[min(80%,19rem)]",
    compare: {
      eyebrow: "Injection or IV",
      title: "NAD+ at Home, Without the IV Chair",
      text: "NAD+ is also given as an IV drip at clinics, which means booking a visit and sitting through it.",
      cols: ["NAD+ Injection", "NAD+ IV drip"],
      rows: (product) => [
        { label: "Where", ours: "At home", theirs: "At a clinic or IV lounge" },
        { label: "How it's given", ours: "A short injection, as your provider directs", theirs: "An IV drip into a vein" },
        { label: "Time it takes", ours: "A few minutes", theirs: "Usually a longer, seated visit" },
        { label: "Pricing", ours: `${priceLabel(product)}, one monthly price`, theirs: "Usually priced per visit" },
      ],
      img: "/site/nad/care-injectable.avif",
      imgPos: "object-top",
    },
  },
  sublingual: {
    name: "NAD+ Sublingual Tablets",
    blur: "/products/detail/nad-sublingual-2.avif",
    art: "/products/nad-sublingual.avif",
    artSize: "w-28 lg:w-40",
    compare: {
      eyebrow: "Tablet or injection",
      title: "Needle-Free NAD+, Under the Tongue",
      text: "NAD+ also comes as an injection. The tablet dissolves under the tongue instead, so there is no needle.",
      cols: ["Sublingual tablet", "Injection"],
      rows: (product) => [
        { label: "How it's taken", ours: "Dissolves under the tongue", theirs: "A short injection" },
        { label: "Needles", ours: "None", theirs: "A small needle" },
        { label: "Ships as", ours: "A bottle of 30 tablets", theirs: "A vial" },
        {
          label: "Pricing",
          ours: priceLabel(product),
          theirs: priceLabel(productsData.find((p) => p.name === "NAD+ Injection")),
        },
      ],
      img: "/site/nad/sublingual-taken.avif",
      imgPos: "object-center",
    },
  },
};

/* Footnote marker: jumps to the numbered card in Sources. */
function Ref({ n }) {
  return (
    <sup className="ml-0.5 text-[0.65em] font-semibold">
      <a href="#nad-sources" className="no-underline opacity-80 hover:opacity-100">
        {n}
      </a>
    </sup>
  );
}

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

/* 1. WHAT IS NAD+: the gold band, first, as the client asked. The product and its
   two notes carry over from the old coenzyme panel. */

const NOTES = [
  { label: "In every cell", text: "A coenzyme the body makes and uses naturally" },
  { label: "Cellular energy", text: "Part of the processes cells use to produce energy" },
];

function Note({ note, className = "" }) {
  return (
    <div className={`rounded-[14px] border border-white/25 bg-[#5a4423]/30 px-4 py-3 backdrop-blur-md ${className}`}>
      <span className="flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.1em]" style={{ color: CREAM }}>
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ffe8b1]" />
        {note.label}
      </span>
      <p className="mt-1.5 text-[0.82rem] leading-snug" style={{ color: "rgba(255,232,177,0.85)" }}>
        {note.text}
      </p>
    </div>
  );
}

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
                A coenzyme your cells naturally use
              </span>
              <h2 className={`${TITLE} mt-3 text-[clamp(1.8rem,3.6vw,2.7rem)]`} style={{ color: CREAM }}>
                What is NAD+?
              </h2>
              <p className="mt-2 text-[0.9rem]" style={{ color: "rgba(255,232,177,0.75)" }}>
                (nicotinamide adenine dinucleotide)
              </p>
              <p className="mt-5 max-w-[50ch] text-[1rem] leading-relaxed" style={{ color: CREAM }}>
                NAD+ is a coenzyme found naturally in every cell of the body. Cells rely on it to turn nutrients
                into energy, and it takes part in processes such as DNA repair.
                <Ref n={1} />
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
              {/* From sm only: on a phone the paragraph beside them already says it. */}
              <div className="mt-5 hidden gap-3 sm:grid sm:grid-cols-2">
                {NOTES.map((n) => (
                  <Note key={n.label} note={n} />
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* 2. THE DECLINE WITH AGE: the old band's graph, now gold on white so it
   matches the rest of the site (client, 2026-10-12). */

function Decline() {
  return (
    <section className="py-[clamp(2.75rem,6vw,5.5rem)]">
      <div className="mx-auto grid max-w-[1180px] gap-9 px-5 md:px-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-14">
        <Reveal as="div">
          <span className="nv-eyebrow">Why NAD+</span>
          <h2 className={`${H2} mt-3 max-w-[16ch]`}>NAD+ Levels Tend to Decline With Age</h2>
          <p className="mt-4 max-w-[46ch] text-[1rem] leading-relaxed text-muted">
            Research shows that NAD+ levels in the body's tissues gradually fall as we get older.
            <Ref n={1} /> In one study of skin samples from people aged 15 to 77, NAD+ was lower at older ages in
            both men and women.
            <Ref n={2} />
          </p>
          <p className="mt-4 max-w-[46ch] text-[1rem] leading-relaxed text-muted">
            Scientists are still studying what lower NAD+ means for how the body works with age.
          </p>
        </Reveal>

        <Reveal as="div" delay={0.08}>
          <div className={`border border-line bg-surface px-4 pb-6 pt-7 nv-shadow sm:px-8 sm:pt-9 ${CARD_R}`}>
            <NadDeclineGraph />
            <p className="mt-4 text-center text-[0.76rem] leading-snug text-muted">
              Source: Massudi et al., PLOS ONE (2012)
            </p>
            <p className="mx-auto mt-1 max-w-[60ch] text-center text-[0.72rem] leading-snug text-muted">
              Educational illustration. Individual levels vary. This study did not evaluate NovaMDK treatment or
              establish treatment outcomes.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* 3. WHERE NAD+ WORKS: the reference's benefits list, a held heading beside a
   column of rows. Their outcome claims become the cell processes the cited
   review names, so nothing here says what treatment will do. */

const AT_WORK = [
  {
    icon: Zap,
    title: "Energy production",
    text: "Cells use NAD+ to turn the nutrients in food into energy they can use.",
  },
  {
    icon: Dna,
    title: "DNA repair",
    text: "Enzymes that help repair DNA, called PARPs, use NAD+ to do their work.",
  },
  {
    icon: SlidersHorizontal,
    title: "Gene activity",
    text: "Sirtuins, a family of enzymes that depend on NAD+, help control how DNA is packed and which genes are active.",
  },
  {
    icon: Hourglass,
    title: "Cell aging",
    text: "NAD+ is involved in senescence, the point at which older or damaged cells stop dividing.",
  },
];

function AtWork({ startTo }) {
  return (
    <section className="pb-[clamp(2.75rem,6vw,5.5rem)]">
      <div className="mx-auto grid max-w-[1180px] gap-8 px-5 md:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal as="div">
            <span className="nv-eyebrow">Inside your cells</span>
            <h2 className={`${H2} mt-3 max-w-[14ch]`}>Where NAD+ Is at Work</h2>
            <p className="mt-4 max-w-[40ch] text-[1rem] leading-relaxed text-muted">
              NAD+ takes part in some of the most basic work your cells do every day.
              <Ref n={1} />
            </p>
            <StartLink to={startTo} className="mt-7 hidden lg:inline-flex" />
          </Reveal>
        </div>

        <div>
          <ul>
            {AT_WORK.map((r, i) => (
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
                    src="/site/sports-medicine/ldn-cells.avif"
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
            How NAD+ works in the body, not an expected result of treatment. Individual response varies.
          </p>
        </div>
      </div>
    </section>
  );
}

/* 4. THE COMPARISON: the reference's injections against IV drips table, kept to
   where, how and what it costs. The tablet compares itself with the injection
   instead. Nothing here says one works better than the other. */

function Compare({ f, product, startTo }) {
  const c = f.compare;
  const rows = c.rows(product);

  return (
    <section className="py-[clamp(2.75rem,6vw,5.5rem)]">
      <div className="mx-auto grid max-w-[1180px] gap-9 px-5 md:px-10 lg:grid-cols-2 lg:items-center lg:gap-14">
        <Reveal as="div">
          <span className="nv-eyebrow">{c.eyebrow}</span>
          <h2 className={`${H2} mt-3 max-w-[18ch]`}>{c.title}</h2>
          <p className="mt-4 max-w-[48ch] text-[1rem] leading-relaxed text-muted">{c.text}</p>

          <div className={`mt-7 overflow-hidden border border-line bg-surface ${CARD_R}`}>
            <div className="grid grid-cols-[0.8fr_1fr_1fr] gap-3 bg-surface-2 px-4 py-3 text-[0.78rem] font-bold text-ink sm:px-5">
              <span />
              <span>{c.cols[0]}</span>
              <span className="text-muted">{c.cols[1]}</span>
            </div>
            {rows.map((r) => (
              <div key={r.label} className="grid grid-cols-[0.8fr_1fr_1fr] gap-3 border-t border-line px-4 py-3.5 text-[0.86rem] leading-snug sm:px-5">
                <span className="font-semibold text-ink">{r.label}</span>
                <span className="text-ink">{r.ours}</span>
                <span className="text-muted">{r.theirs}</span>
              </div>
            ))}
          </div>
          <StartLink to={startTo} className="mt-7" />
        </Reveal>

        <Reveal as="div" delay={0.08} className={`relative hidden overflow-hidden sm:block ${CARD_R}`}>
          <img
            src={c.img}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className={`aspect-4/3 w-full object-cover lg:aspect-5/6 ${c.imgPos}`}
          />
        </Reveal>
      </div>
    </section>
  );
}

/* 5. WHAT'S INCLUDED: the dark price card, with the record's own price. */

const included = (f) => [
  "An online intake reviewed by a licensed provider",
  `${f.name}, if prescribed`,
  "Compounded by a licensed U.S. pharmacy",
  "Discreet home delivery",
  "Follow-up care and guidance throughout your plan",
  "Cancel anytime",
];

function Included({ f, product, startTo }) {
  return (
    <section className="mx-auto max-w-[1180px] px-5 md:px-10">
      <Reveal as="div">
        <div className={`relative grid overflow-hidden lg:grid-cols-2 ${CARD_R}`} style={{ background: DARK }}>
          {/* A woman in the page's audience, 35 to 60 (client, 2026-10-12),
              standing in a warm glow on the left half. Under the heading on a
              phone. */}
          <div
            className="relative px-6 pt-9 sm:px-10 sm:pt-12"
            style={{ background: "radial-gradient(circle at 50% 88%, rgba(193,162,122,0.38), transparent 62%)" }}
          >
            <span className="flex items-center gap-2 text-[0.9rem] font-semibold" style={{ color: CREAM }}>
              <span className="h-2 w-2 rounded-full bg-[#ffe8b1]" />
              Provider-guided care
            </span>
            <h2 className={`${TITLE} relative z-10 mt-4 max-w-[20ch] text-[clamp(1.5rem,2.8vw,2.1rem)]`} style={{ color: CREAM }}>
              {f.name}, prescribed and followed by a licensed provider.
            </h2>
            <img
              src="/site/anti-aging/nad-supported.avif"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="mx-auto mt-6 block h-64 w-auto object-contain object-bottom sm:h-80 lg:absolute lg:bottom-0 lg:left-1/2 lg:mt-0 lg:h-[66%] lg:-translate-x-1/2"
            />
          </div>

          <div className="relative p-4 sm:p-8">
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

/* 6. SOURCES: numbered to match the markers above. */

const SOURCES = [
  {
    text: "A review of what NAD+ does in cells, including energy metabolism and DNA repair, and of the gradual decline in tissue NAD+ levels with age.",
    cite: "Nat Rev Mol Cell Biol, 2021",
    href: "https://doi.org/10.1038/s41580-020-00313-x",
  },
  {
    text: "A study of human skin samples from people aged 15 to 77 that found lower NAD+ levels at older ages, in both men and women.",
    cite: "PLOS ONE, 2012",
    href: "https://doi.org/10.1371/journal.pone.0042357",
  },
];

function Sources() {
  return (
    <section id="nad-sources" className="scroll-mt-24 py-[clamp(2.75rem,6vw,5rem)]">
      <div className="mx-auto max-w-[1180px] px-5 md:px-10">
        <Reveal as="div" className="text-center">
          <span className="nv-eyebrow">Sources</span>
          <h2 className={`${H2} mx-auto mt-3`}>Show me the science</h2>
          <p className="mx-auto mt-3 max-w-[48ch] text-[1rem] leading-relaxed text-muted">
            The research this page draws on, so you can read it for yourself.
          </p>
        </Reveal>
        <ol className="mx-auto mt-9 grid max-w-[52rem] gap-4 md:grid-cols-2">
          {SOURCES.map((s, i) => (
            <Reveal
              as="li"
              key={s.href}
              delay={i * 0.06}
              className={`flex flex-col border border-line bg-surface p-6 nv-shadow ${CARD_R}`}
            >
              <span className="font-display text-[1.6rem] font-extrabold leading-none text-[#b39258]">{i + 1}</span>
              <p className="mt-4 flex-1 text-[0.94rem] leading-relaxed text-ink">{s.text}</p>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 text-[0.9rem] font-semibold text-[#725826] underline decoration-line-strong underline-offset-4 hover:decoration-[#725826]"
              >
                {s.cite}
              </a>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default function NadSections({ product, format = "injection", startTo = "/start" }) {
  const f = FORMATS[format];
  return (
    <>
      <WhatIs f={f} startTo={startTo} />
      <div style={{ background: GROUND }}>
        <Decline />
        <AtWork startTo={startTo} />
        <Compare f={f} product={product} startTo={startTo} />
        <Included f={f} product={product} startTo={startTo} />
        <Sources />
      </div>
    </>
  );
}
