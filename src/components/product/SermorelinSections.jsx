import React from "react";
import { Link } from "react-router-dom";
import { useInView } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Reveal from "../ui/Reveal";
import { priceLabel } from "../data/products";

/* Rebuilt 2026-10-12 with agelessrx.com's Sermorelin Nasal Spray page as the
   client's reference, kept in Nova's theme: what it is, how it works, where
   growth hormone acts, the science, what is included and the sources. Their
   survey results, outcome timeline and research claims are left out; the
   pathway copy is the site's own from the 2026-09-08 compliance pass. */

const BAND = "radial-gradient(circle at 30% 40%, #c1a27a, #9a7843)";
const DARK = "linear-gradient(160deg, #3a2f1f 0%, #2a2217 55%, #1f1a12 100%)";
const CREAM = "#ffe8b1";
const GROUND = "#fbfaf7";
const TITLE = "font-display font-extrabold leading-[1.1]";
const H2 = `${TITLE} text-[clamp(1.7rem,3.4vw,2.5rem)] text-[#725826]`;
const CARD_R = "rounded-[calc(24px*var(--nv-r-scale,1))]";

/* Footnote marker: jumps to the numbered card in Sources. */
function Ref({ n }) {
  return (
    <sup className="ml-0.5 text-[0.65em] font-semibold">
      <a href="#sermorelin-sources" className="no-underline opacity-80 hover:opacity-100">
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

/* 1. WHAT IS IT: the page's gold band, a frosted panel over a blurred photo. */

function WhatIs({ startTo }) {
  const graph = React.useRef(null);
  const seen = useInView(graph, { once: true, margin: "-60px 0px -60px 0px" });

  return (
    <section className="relative overflow-hidden" style={{ background: BAND }}>
      <img
        src="/products/detail/sermorelin-nasal.avif"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 mix-blend-soft-light blur-2xl"
      />
      <div className="relative mx-auto max-w-[1180px] px-5 py-[clamp(2.5rem,6vw,5.5rem)] md:px-10">
        <Reveal as="div">
          <div
            className={`grid gap-9 border border-white/25 bg-white/10 p-6 backdrop-blur-md sm:p-10 lg:grid-cols-[1.3fr_1fr] lg:gap-14 lg:p-14 ${CARD_R}`}
          >
            <div>
              <h2 className={`${TITLE} max-w-[16ch] text-[clamp(1.8rem,3.6vw,2.7rem)]`} style={{ color: CREAM }}>
                What is Sermorelin Nasal Spray?
              </h2>
              <p className="mt-2 text-[0.9rem]" style={{ color: "rgba(255,232,177,0.75)" }}>
                (ser-MOR-eh-lin)
              </p>
              <p className="mt-5 max-w-[50ch] text-[1rem] leading-relaxed" style={{ color: CREAM }}>
                Growth hormone plays a role in sleep, recovery, metabolism and body composition, and the body
                releases less of it with age.
                <Ref n={1} />
              </p>
              <p className="mt-4 max-w-[50ch] text-[1rem] leading-relaxed" style={{ color: CREAM }}>
                Rather than supplying growth hormone directly, Sermorelin resembles GHRH, the signal the brain uses
                to prompt the pituitary gland. If prescribed, it is intended to stimulate release of the body's own
                growth hormone, in its natural pulses.
                <Ref n={2} />
              </p>
              <StartLink to={startTo} light className="mt-7" />
            </div>

            <div className="lg:border-l lg:border-white/20 lg:pl-12">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-[clamp(3rem,6vw,4.25rem)] font-extrabold leading-none" style={{ color: CREAM }}>
                  15%
                </span>
                <span className="text-[0.78rem] font-bold uppercase tracking-[0.12em]" style={{ color: CREAM }}>
                  per decade
                </span>
              </div>
              <p className="mt-3 max-w-[32ch] text-[0.98rem] font-medium leading-snug" style={{ color: CREAM }}>
                After the third decade of life, growth hormone secretion declines about 15% per decade.
                <Ref n={1} />
              </p>
              <div className="mt-6 flex items-stretch gap-2">
                <span
                  className="shrink-0 rotate-180 self-center whitespace-nowrap text-[0.7rem] font-semibold [writing-mode:vertical-rl]"
                  style={{ color: "rgba(255,232,177,0.8)" }}
                >
                  Natural GH release
                </span>
                <div ref={graph} className="relative aspect-39/14 min-w-0 flex-1">
                  {seen && (
                    <img
                      src="/site/anti-aging/sermorelin-canva-graph-animated.svg"
                      alt=""
                      aria-hidden="true"
                      draggable="false"
                      className="absolute inset-0 block h-full w-full select-none object-contain"
                    />
                  )}
                </div>
              </div>
              <p className="mt-1 text-center text-[0.7rem] font-semibold" style={{ color: "rgba(255,232,177,0.8)" }}>
                Age
              </p>
              {/* Population data, not a result anyone should expect from treatment. */}
              <p className="mt-4 text-[0.74rem] italic leading-relaxed" style={{ color: "rgba(255,232,177,0.72)" }}>
                Educational information about aging, not an expected treatment result.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* 2. HOW IT WORKS: the reference's image strip. On a desktop the chosen photo
   widens and its step reads underneath; on a phone the cards swipe. The
   reference runs a timeline of expected effects here; this follows the
   pathway instead. */

const STEPS = [
  {
    title: "A needle-free nasal spray",
    text: "Sermorelin is sprayed into the nose and absorbed through its lining, so there are no needles or syringes to prepare.",
    img: "/products/detail/sermorelin-nasal-2.avif",
  },
  {
    title: "A signal to the pituitary",
    text: "Because it resembles GHRH, Sermorelin acts on the pituitary gland, the small gland at the base of the brain that releases growth hormone.",
    img: "/site/anti-aging/benefit-cellular.avif",
    cutout: true,
  },
  {
    title: "Released in natural pulses",
    text: "The pituitary releases growth hormone in pulses, and the body's own feedback keeps regulating how much is released.",
    img: "/site/anti-aging/sermorelin-pathway.png",
  },
  {
    title: "The IGF-1 response",
    text: "Growth hormone signals the production of IGF-1, which is involved in normal metabolic and tissue processes.",
    img: "/site/anti-aging/sermorelin-understand.png",
  },
];

const STEP_MS = 6000;

function StepImage({ step, className = "" }) {
  return step.cutout ? (
    <div className={`bg-linear-to-b from-[#f1e7d4] to-[#c9a97c] ${className}`}>
      <img src={step.img} alt="" aria-hidden="true" loading="lazy" className="h-full w-full object-contain object-bottom" />
    </div>
  ) : (
    <img src={step.img} alt="" aria-hidden="true" loading="lazy" className={`object-cover ${className}`} />
  );
}

function HowItWorks() {
  const [on, setOn] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const rail = React.useRef(null);
  const [slide, setSlide] = React.useState(0);

  React.useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const t = setInterval(() => setOn((v) => (v + 1) % STEPS.length), STEP_MS);
    return () => clearInterval(t);
  }, [paused]);

  const onRailScroll = () => {
    const el = rail.current;
    if (!el) return;
    const card = el.firstElementChild;
    if (!card) return;
    setSlide(Math.round(el.scrollLeft / (card.offsetWidth + 16)));
  };
  const nudge = (dir) => {
    const el = rail.current;
    const card = el?.firstElementChild;
    if (card) el.scrollBy({ left: dir * (card.offsetWidth + 16), behavior: "smooth" });
  };

  return (
    <section className="py-[clamp(2.75rem,6vw,5.5rem)]">
      <div className="mx-auto max-w-[1180px] px-5 md:px-10">
        <Reveal as="div" className="text-center">
          <span className="nv-eyebrow">How it works</span>
          <h2 className={`${H2} mx-auto mt-3 max-w-[22ch]`}>How Sermorelin Nasal Spray works</h2>
        </Reveal>

        {/* Desktop: the strip. */}
        <div
          className="mt-12 hidden lg:block"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="flex h-96 items-end gap-3">
            {STEPS.map((s, i) => (
              <button
                key={s.title}
                type="button"
                onClick={() => setOn(i)}
                aria-pressed={on === i}
                aria-label={`Step ${i + 1}: ${s.title}`}
                className={`relative overflow-hidden transition-all duration-700 ease-out ${CARD_R} ${
                  on === i ? "h-full flex-[2.4]" : "h-72 flex-1 opacity-80 hover:opacity-100"
                }`}
              >
                <StepImage step={s} className="absolute inset-0 h-full w-full" />
                <span className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/85 text-[0.8rem] font-bold text-[#6b511e]">
                  {i + 1}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-[1fr_1.4fr] gap-10 border-t border-line pt-7">
            <div>
              <span className="text-[0.78rem] font-bold uppercase tracking-[0.12em] text-accent">
                Step {on + 1} of {STEPS.length}
              </span>
              <h3 className="mt-2 font-display text-[1.5rem] font-bold leading-snug text-ink">{STEPS[on].title}</h3>
            </div>
            <div>
              <p className="max-w-[52ch] text-[1.02rem] leading-relaxed text-muted">{STEPS[on].text}</p>
              <div className="mt-6 flex gap-2" aria-hidden="true">
                {STEPS.map((s, i) => (
                  <span key={s.title} className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                    <span
                      className={`block h-full rounded-full bg-[#b39258] transition-all duration-500 ${i <= on ? "w-full" : "w-0"}`}
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Phone and tablet: swipe cards. */}
        <div className="mt-9 lg:hidden">
          <ol
            ref={rail}
            onScroll={onRailScroll}
            className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 [scrollbar-width:none]"
          >
            {STEPS.map((s, i) => (
              <li key={s.title} className="w-4/5 shrink-0 snap-start sm:w-2/5">
                <StepImage step={s} className={`aspect-4/3 w-full ${CARD_R}`} />
                <span className="mt-4 block text-[0.75rem] font-bold uppercase tracking-[0.12em] text-accent">
                  Step {i + 1}
                </span>
                <h3 className="mt-1 font-display text-[1.15rem] font-bold leading-snug text-ink">{s.title}</h3>
                <p className="mt-2 text-[0.94rem] leading-relaxed text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => nudge(-1)}
              aria-label="Previous step"
              className="grid h-10 w-10 place-items-center rounded-full border border-line-strong text-ink disabled:opacity-35"
              disabled={slide <= 0}
            >
              <ArrowLeft size={17} />
            </button>
            <button
              type="button"
              onClick={() => nudge(1)}
              aria-label="Next step"
              className="grid h-10 w-10 place-items-center rounded-full border border-line-strong text-ink disabled:opacity-35"
              disabled={slide >= STEPS.length - 1}
            >
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 3. WHERE GROWTH HORMONE ACTS: the reference's dark "results" card. Their
   survey percentages become the four parts of the body growth hormone is
   involved in, in the site's existing wording. */

const PATHWAY = [
  {
    icon: "/site/anti-aging/gh-sleep.avif",
    title: "Sleep",
    text: "Natural growth hormone release is closely tied to nighttime and deep sleep.",
  },
  {
    icon: "/site/anti-aging/gh-metabolism.avif",
    title: "Metabolism",
    text: "Growth hormone influences how the body handles fats, proteins and carbohydrates.",
  },
  {
    icon: "/site/anti-aging/gh-composition.avif",
    title: "Body composition",
    text: "Growth hormone and IGF-1 help maintain lean tissue and regulate how the body stores and uses fat.",
  },
  {
    icon: "/site/anti-aging/gh-recovery.avif",
    title: "Recovery",
    text: "The growth hormone pathway plays a role in tissue maintenance and normal repair processes.",
  },
];

const CHIP = "rounded-full border border-[#ffe8b1]/45 bg-[#2a2217]/55 px-4 py-2 text-[0.85rem] font-semibold backdrop-blur-sm";

function Pathway() {
  return (
    <section className="mx-auto max-w-[1180px] px-5 md:px-10">
      <Reveal as="div">
        <div className={`relative overflow-hidden ${CARD_R}`} style={{ background: DARK }}>
          <div className="relative mx-auto flex h-[clamp(22rem,42vw,30rem)] max-w-[30rem] items-end justify-center px-5 pt-8">
            {/* The frame the figure stands in, with its label inside the top. */}
            <div className="absolute inset-x-5 bottom-0 top-8 rounded-t-[20px] border border-b-0 border-[#ffe8b1]/40">
              <span className="absolute left-5 top-4 flex items-center gap-2 text-[0.9rem] font-semibold" style={{ color: CREAM }}>
                <span className="h-2 w-2 rounded-full bg-[#ffe8b1]" />
                Where growth hormone is involved
              </span>
            </div>
            <img
              src="/site/anti-aging/benefit-aging.avif"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="relative h-[88%] w-auto object-contain object-bottom"
            />
            <span className={`absolute bottom-[38%] left-2 sm:left-0 ${CHIP}`} style={{ color: CREAM }}>
              Sleep
            </span>
            <span className={`absolute bottom-[22%] right-2 sm:right-0 ${CHIP}`} style={{ color: CREAM }}>
              Recovery
            </span>
          </div>

          {/* The reference's stats bar, carrying the four areas instead. */}
          <div className="relative px-4 pb-4 sm:px-8 sm:pb-8">
            <ul className="-mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[18px] border border-white/10 bg-white/10 backdrop-blur-md lg:grid-cols-4">
              {PATHWAY.map((p) => (
                <li key={p.title} className="bg-[#2a2217]/70 p-4 sm:p-6">
                  <img src={p.icon} alt="" aria-hidden="true" loading="lazy" className="h-8 w-8 object-contain sm:h-10 sm:w-10" />
                  <h3 className="mt-3 font-display text-[1rem] font-bold sm:text-[1.1rem]" style={{ color: CREAM }}>
                    {p.title}
                  </h3>
                  <p className="mt-1.5 text-[0.8rem] leading-relaxed sm:text-[0.86rem]" style={{ color: "rgba(255,232,177,0.78)" }}>
                    {p.text}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[0.74rem] italic leading-relaxed" style={{ color: "rgba(255,232,177,0.6)" }}>
              What growth hormone does in the body, not an expected treatment result. Individual response varies.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* 4. THE SCIENCE: signalling growth hormone against supplying it. Kept to what
   each one is and where it acts; nothing here says one is better. */

const COMPARE = [
  { label: "What it is", ours: "A peptide that resembles GHRH", theirs: "The growth hormone itself" },
  { label: "Where it acts", ours: "The pituitary gland", theirs: "Directly on the body" },
  { label: "How it's released", ours: "In the body's own pulses", theirs: "A set amount with each dose" },
  { label: "How it's given", ours: "Nasal spray, no needles", theirs: "Injection" },
];

function Science({ startTo }) {
  return (
    <section className="py-[clamp(2.75rem,6vw,5.5rem)]">
      <div className="mx-auto grid max-w-[1180px] gap-9 px-5 md:px-10 lg:grid-cols-2 lg:items-center lg:gap-14">
        <Reveal as="div">
          <span className="nv-eyebrow">The science of Sermorelin</span>
          <h2 className={`${H2} mt-3 max-w-[18ch]`}>Signals growth hormone, rather than replacing it</h2>
          <p className="mt-4 max-w-[48ch] text-[1rem] leading-relaxed text-muted">
            Growth hormone therapy supplies the hormone directly. Sermorelin acts one step earlier, at the
            pituitary, which then releases growth hormone on its own rhythm.
            <Ref n={2} />
          </p>

          <div className={`mt-7 overflow-hidden border border-line bg-surface ${CARD_R}`}>
            <div className="grid grid-cols-[0.8fr_1fr_1fr] gap-3 bg-surface-2 px-4 py-3 text-[0.78rem] font-bold text-ink sm:px-5">
              <span />
              <span>Sermorelin</span>
              <span className="text-muted">Growth hormone (HGH)</span>
            </div>
            {COMPARE.map((r) => (
              <div key={r.label} className="grid grid-cols-[0.8fr_1fr_1fr] gap-3 border-t border-line px-4 py-3.5 text-[0.86rem] leading-snug sm:px-5">
                <span className="font-semibold text-ink">{r.label}</span>
                <span className="text-ink">{r.ours}</span>
                <span className="text-muted">{r.theirs}</span>
              </div>
            ))}
          </div>
          <StartLink to={startTo} className="mt-7" />
        </Reveal>

        <Reveal as="div" delay={0.08} className={`relative overflow-hidden ${CARD_R}`}>
          <img
            src="/site/anti-aging/sermorelin-works.png"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="aspect-4/3 w-full object-cover lg:aspect-5/6"
          />
        </Reveal>
      </div>
    </section>
  );
}

/* 5. WHAT'S INCLUDED: the reference's dark price card, with the record's own
   price and supply. */

const INCLUDED = [
  "An online intake reviewed by a licensed provider",
  "A needle-free nasal spray, if prescribed",
  "Compounded by a licensed U.S. pharmacy",
  "Discreet home delivery",
  "Follow-up care and guidance throughout your plan",
  "Cancel anytime",
];

function Included({ product, startTo }) {
  return (
    <section className="mx-auto max-w-[1180px] px-5 md:px-10">
      <Reveal as="div">
        <div className={`relative grid overflow-hidden lg:grid-cols-2 ${CARD_R}`} style={{ background: DARK }}>
          {/* The photo fills the left half, shaded from the top so the heading
              stays readable on it. Behind the whole card on a phone. */}
          <div aria-hidden="true" className="absolute inset-0 lg:right-1/2">
            <img
              src="/products/detail/sermorelin-nasal-3.avif"
              alt=""
              loading="lazy"
              className="h-full w-full object-cover object-bottom opacity-45 lg:opacity-100"
            />
            <div className="absolute inset-0 bg-linear-to-b from-[#2a2217] via-[#2a2217]/60 to-[#2a2217]/10" />
          </div>
          <div className="relative px-6 pb-2 pt-9 sm:px-10 sm:pt-12">
            <span className="flex items-center gap-2 text-[0.9rem] font-semibold" style={{ color: CREAM }}>
              <span className="h-2 w-2 rounded-full bg-[#ffe8b1]" />
              Provider-guided care
            </span>
            <h2 className={`${TITLE} mt-4 max-w-[20ch] text-[clamp(1.5rem,2.8vw,2.1rem)]`} style={{ color: CREAM }}>
              Sermorelin Nasal Spray, prescribed and followed by a licensed provider.
            </h2>
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

/* 6. SOURCES: the reference's "Show me the science" cards, cut to the ones
   this page leans on. Numbered to match the markers above. */

const SOURCES = [
  {
    text: "A clinical review of how growth hormone secretion changes with age, including the decline of about 15% per decade after the third decade of life.",
    cite: "Endotext, Growth Hormone and Aging",
    href: "https://www.ncbi.nlm.nih.gov/books/NBK279163/",
  },
  {
    text: "A review of Sermorelin as a GHRH analog for adults with low growth hormone, and how it differs from giving growth hormone directly.",
    cite: "Clin Interv Aging, 2006",
    href: "https://doi.org/10.2147/ciia.2006.1.4.307",
  },
  {
    text: "A study of healthy men relating age-related changes in deep sleep to lower growth hormone secretion.",
    cite: "JAMA, 2000",
    href: "https://doi.org/10.1001/jama.284.7.861",
  },
];

function Sources() {
  return (
    <section id="sermorelin-sources" className="scroll-mt-24 py-[clamp(2.75rem,6vw,5rem)]">
      <div className="mx-auto max-w-[1180px] px-5 md:px-10">
        <Reveal as="div" className="text-center">
          <span className="nv-eyebrow">Sources</span>
          <h2 className={`${H2} mx-auto mt-3`}>Show me the science</h2>
          <p className="mx-auto mt-3 max-w-[48ch] text-[1rem] leading-relaxed text-muted">
            The research this page draws on, so you can read it for yourself.
          </p>
        </Reveal>
        <ol className="-mx-5 mt-9 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
          {SOURCES.map((s, i) => (
            <Reveal
              as="li"
              key={s.href}
              delay={i * 0.06}
              className={`flex w-4/5 shrink-0 snap-start flex-col border border-line bg-surface p-6 nv-shadow md:w-auto ${CARD_R}`}
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

export default function SermorelinSections({ product, startTo = "/start" }) {
  return (
    <>
      <WhatIs startTo={startTo} />
      <div style={{ background: GROUND }}>
        <HowItWorks />
        <Pathway />
        <Science startTo={startTo} />
        <Included product={product} startTo={startTo} />
        <Sources />
      </div>
    </>
  );
}
