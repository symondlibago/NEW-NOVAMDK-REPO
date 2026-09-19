import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Reveal from "../ui/Reveal";
import useRunOnceInView from "../../lib/useRunOnceInView";

/* Same dwell the Semaglutide rail uses, so the two highlights read as one
   system. */
const FEATURE_HOLD_MS = 3000;

/* PT-141 editorial from the supplied product comp. Consultation links return
   through this product page so they use its existing intake entry point. */
const INK = "#745922";
const BODY = "#625a4d";
const CREAM = "#f8e8c5";
const CREAM_SOFT = "rgba(248,232,197,0.82)";
/* The resting pair for the cycling features. 0.82/0.64 sat too close to full
   cream to read as "not lit" — the highlight was invisible. */
const CREAM_DIM = "rgba(248,232,197,0.44)";
const CREAM_DIMMER = "rgba(248,232,197,0.34)";
const BRASS = "radial-gradient(circle at 50% 50%, #c1a27a, #9a7843)";
const BRASS_FLAT = "#ad8a55";
const PALE = "#f3e5ca";
const CARD_R = "rounded-[calc(26px*var(--nv-r-scale,1))]";
const TITLE = "nv-weight-keep font-display font-extrabold leading-[1.08]";
const TITLE_SIZE = "text-[clamp(1.7rem,4vw,2.75rem)]";
/* Tighter than the site default so this page's bands use more of their width. */
const SECTION_X = "px-3 sm:px-5 md:px-6";

const FEATURES = [
  ["Melanocortin receptor agonist", "Bremelanotide acts on melanocortin receptors in the central nervous system"],
  ["Compounded prescription", "Prepared by a licensed compounding pharmacy when prescribed"],
  ["Injectable format", "Prescribed as a subcutaneous injection under provider guidance"],
  ["Provider-guided use", "Use only as directed by your healthcare provider and prescription label"],
];

function SignalPill({ children, className = "" }) {
  return (
    <span
      /* Smaller on a phone, where three of these are pinned around the vial
         with only the width left over to sit in (2026-09-19). */
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 font-display text-[0.56rem] font-bold uppercase leading-[1.25] sm:gap-2 sm:px-5 sm:py-2.5 sm:text-[0.78rem] ${className}`}
      style={{ background: "rgba(248,232,197,0.28)", color: CREAM }}
    >
      <span
        aria-hidden="true"
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: "#d7a23f", boxShadow: "0 0 12px 4px rgba(215,162,63,0.46)" }}
      />
      {children}
    </span>
  );
}

/* An L: the riser sits under the pill's own end and the run heads toward the
   vial, so the border pair flips with the side the pill is on. */
function Elbow({ side, className = "" }) {
  const rule = "1px solid rgba(255,255,255,0.22)";
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
      style={{
        borderBottom: rule,
        ...(side === "left" ? { borderLeft: rule } : { borderRight: rule }),
      }}
    />
  );
}

function SignalDiagram() {
  return (
    <>
      {/* The phone gets the stage's own arrangement rather than a row of pills
          under the vial (2026-09-19): same three labels, same elbows, drawn to
          the width there is. The vial is sized off the box so the pair of
          columns beside it always has room. */}
      <div className="relative mx-auto mt-6 h-72 w-full max-w-[26rem] md:hidden">
        <Elbow side="left" className="left-[27%] top-[46%] h-[5%] w-[12%]" />
        <Elbow side="right" className="right-[25%] top-[25%] h-[5%] w-[13%]" />
        <Elbow side="right" className="right-[27%] top-[62%] h-[5%] w-[12%]" />
        <SignalPill className="absolute left-0 top-[36%] max-w-[26%] text-center">
          Melanocortin pathways
        </SignalPill>
        <SignalPill className="absolute right-0 top-[16%] max-w-[26%] text-center">
          Central signaling
        </SignalPill>
        <SignalPill className="absolute right-0 top-[53%] max-w-[24%] text-center">
          As-needed use
        </SignalPill>
        <span className="absolute left-1/2 top-1/2 h-[92%] -translate-x-1/2 -translate-y-1/2">
          <img
            src="/site/sexual-health/pt141-vial-tall.avif"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="nv-drift h-full w-auto drop-shadow-2xl"
          />
        </span>
      </div>

      <div className="relative mx-auto mt-5 hidden h-[24rem] max-w-[52rem] md:block lg:h-[27rem]">
        <Elbow side="left" className="left-[16%] top-[42%] h-[7%] w-[21%]" />
        <Elbow side="right" className="right-[16%] top-[20%] h-[7%] w-[21%]" />
        <Elbow side="right" className="right-[16%] top-[59%] h-[7%] w-[21%]" />
        <SignalPill className="absolute left-[3%] top-[32%] max-w-[13.5rem] text-center">
          Melanocortin pathways
        </SignalPill>
        <SignalPill className="absolute right-[1%] top-[11%]">Central signaling</SignalPill>
        <SignalPill className="absolute right-[4%] top-[50%]">As-needed use</SignalPill>
        <span className="absolute left-1/2 top-1/2 h-[96%] -translate-x-1/2 -translate-y-1/2">
          <img
            src="/site/sexual-health/pt141-vial-tall.avif"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="nv-drift h-full w-auto drop-shadow-2xl"
          />
        </span>
      </div>
    </>
  );
}

/* The lit one moves on every 3s instead of the first being lit for good. Only
   colour changes, so the entry reveal keeps ownership of opacity. */
function FeatureGrid() {
  const [ref, running] = useRunOnceInView();
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    if (!running) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const t = setInterval(() => setActive((v) => (v + 1) % FEATURES.length), FEATURE_HOLD_MS);
    return () => clearInterval(t);
  }, [running]);

  return (
    <div ref={ref} className="mt-9 border-t border-white/25 pt-8 sm:mt-10 sm:pt-10">
      {/* Left-aligned copy, but the pair of columns is centred in the band
          rather than stretched across it. */}
      <div className="mx-auto grid max-w-[50rem] gap-x-12 gap-y-8 sm:grid-cols-2 sm:gap-y-11">
        {FEATURES.map(([title, body], index) => {
          const on = index === active;
          return (
            <Reveal as="div" key={title} delay={(index % 2) * 0.08} y={12}>
              <h3
                className="font-display text-[0.92rem] font-bold uppercase tracking-[0.02em] transition-colors duration-500 sm:text-[1rem]"
                style={{ color: on ? CREAM : CREAM_DIM }}
              >
                {title}
              </h3>
              <p
                className="mt-2.5 max-w-[38ch] text-[0.98rem] leading-[1.45] transition-colors duration-500 sm:text-[1.05rem]"
                style={{ color: on ? CREAM : CREAM_DIMMER }}
              >
                {body}
              </p>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

function ResponseStartsEarlier({ startTo }) {
  return (
    <>
      <section className="overflow-hidden" style={{ background: BRASS }}>
        <div className={`mx-auto max-w-[1180px] py-9 sm:py-12 lg:py-16 ${SECTION_X}`}>
          {/* The copy column carries more of the row than the comp's 0.95/0.75
              split gave it: at that width the second line of the heading could
              not hold and it broke to three. */}
          <div className="grid gap-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.72fr)] md:gap-12">
            <Reveal as="div">
              <h2 className={`${TITLE} ${TITLE_SIZE} max-w-[30ch]`} style={{ color: CREAM }}>
                Melanocortin
                <span className="block">receptor activity</span>
              </h2>
              <Link
                to={startTo}
                className="mt-6 inline-flex rounded-full px-8 py-3 text-[0.88rem] font-semibold transition-all duration-300 hover:-translate-y-0.5 sm:mt-7 sm:px-10"
                style={{ background: PALE, color: INK }}
              >
                Get Started
              </Link>
            </Reveal>
            <Reveal
              as="p"
              delay={0.08}
              className="max-w-[48ch] text-[clamp(0.92rem,1.05vw,1.02rem)] leading-[1.6] md:pt-1"
              style={{ color: CREAM }}
            >
              Bremelanotide acts on melanocortin receptors in the central nervous system.
            </Reveal>
          </div>

          <SignalDiagram />

          <FeatureGrid />

          {/* Inside the band, on the brass (2026-09-19). Sitting outside the
              section it put a white strip between two brass bands. */}
          <p className="pt-7 text-[0.73rem] italic sm:pt-9" style={{ color: CREAM_DIM }}>
            Prescription required. Eligibility determined by a licensed provider
          </p>
        </div>
      </section>
    </>
  );
}

/* All three read as the same translucent cream in the comp; only the lit one
   steps up in fill and text. The old dark-brown fill on Confidence was a
   different chip entirely. */
const MOOD_PILLS = [
  { label: "Desire", pos: "left-[34%] top-[7%] px-7", z: "z-10" },
  { label: "Confidence", pos: "right-[3%] top-[31%] px-5", z: "z-30" },
  /* On a phone the timing card takes the foot of the band, so Response moves
     up the left side rather than sitting behind it. */
  { label: "Response", pos: "left-[6%] top-[20%] px-5 sm:left-[42%] sm:top-auto sm:bottom-[7%]", z: "z-30" },
];

function ReadinessCard() {
  const [ref, running] = useRunOnceInView();
  const [active, setActive] = React.useState(1);

  React.useEffect(() => {
    if (!running) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const t = setInterval(() => setActive((v) => (v + 1) % MOOD_PILLS.length), FEATURE_HOLD_MS);
    return () => clearInterval(t);
  }, [running]);

  return (
    <Reveal as="div" className="order-2 lg:relative lg:order-1">
      {/* No fill and no radius of its own: the band behind it is the brass, so
          the figure and the pills sit straight on the section (2026-09-19). */}
      <div
        ref={ref}
        className="relative min-h-120 overflow-hidden sm:min-h-128 lg:min-h-136"
      >
        {MOOD_PILLS.map((p, i) => (
          <span
            key={p.label}
            className={`absolute rounded-full py-2.5 font-display text-[1.02rem] font-bold transition-all duration-500 sm:py-3 sm:text-[1.15rem] ${p.pos} ${p.z}`}
            style={{
              background: i === active ? "rgba(248,232,197,0.5)" : "rgba(248,232,197,0.24)",
              color: i === active ? "#fffaf0" : CREAM_SOFT,
            }}
          >
            {p.label}
          </span>
        ))}
        <img
          src="/site/sexual-health/pt141-timing-card.avif"
          alt="As-Needed Use. Provider-guided timing for PT-141: 45 minutes. Often administered at least 45 minutes before anticipated intimacy, as directed by your provider."
          loading="lazy"
          className="absolute bottom-[5%] left-[4%] z-30 w-[92%] max-w-none sm:bottom-auto sm:left-[4%] sm:top-[22%] sm:w-[74%] lg:z-10 lg:w-[64%]"
        />
        <img
          src="/site/sexual-health/pt141-woman.avif"
          alt=""
          aria-hidden="true"
          loading="lazy"
          /* Flush with the foot of the stage, so the band closes just under
             her rather than leaving a span of empty brass (2026-09-19). */
          className="absolute bottom-0 right-0 z-20 h-[96%] w-auto max-w-none sm:h-full"
        />
      </div>
      {/* Out of flow from lg, so the figure above can stand on the section's
          own bottom edge instead of being lifted by this line (2026-09-19). */}
      <p
        className="mt-5 text-[0.72rem] italic leading-[1.35] lg:absolute lg:bottom-3 lg:left-0 lg:mt-0"
        style={{ color: CREAM_DIM }}
      >
        PT-141 is a compounded prescription medication and is not FDA-approved.
        <span className="block">
          Compounded medications are not reviewed by the FDA for safety, effectiveness, or quality
        </span>
      </p>
    </Reveal>
  );
}

function IsItRight({ startTo }) {
  return (
    /* One full-bleed brass band carrying the stage AND the copy, as the comp
       draws it (2026-09-19). It was a rounded brass card with the copy outside
       it on the cream page: a different layout, not a different card. The copy
       therefore turns cream, and the button inverts to pale on brass. */
    <section className="w-full" style={{ background: BRASS_FLAT }}>
      <div
        className={`mx-auto grid max-w-[1180px] gap-7 pb-6 pt-8 sm:pb-8 sm:pt-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.68fr)] lg:items-end lg:gap-10 lg:pb-0 lg:pt-14 ${SECTION_X}`}
      >
        <ReadinessCard />
        <Reveal as="div" className="order-1 lg:order-2" delay={0.08}>
          <span
            className="font-mono text-[0.65rem] uppercase tracking-[0.08em]"
            style={{ color: CREAM_SOFT }}
          >
            Before you start
          </span>
          <h2
            className={`${TITLE} mt-3 max-w-[13ch] text-[clamp(2rem,4.6vw,3.2rem)]`}
            style={{ color: CREAM }}
          >
            Is PT-141
            <span className="block">right for you?</span>
          </h2>
          <p
            className="mt-5 max-w-[34ch] text-[clamp(1rem,1.2vw,1.15rem)] leading-[1.5]"
            style={{ color: CREAM_SOFT }}
          >
            Our care starts with a medical review to make sure PT-141 fits your health and treatment
            goals.
          </p>
          <Link
            to={startTo}
            className="mt-6 inline-flex rounded-full px-7 py-3 text-center text-[0.86rem] font-semibold transition-transform duration-300 hover:-translate-y-0.5 sm:px-8"
            style={{ background: PALE, color: INK }}
          >
            See If PT-141 Is Right for You
          </Link>
          <p
            className="mt-7 max-w-[64ch] text-[0.72rem] italic leading-[1.45] lg:mt-12"
            style={{ color: CREAM_DIM }}
          >
            Prescription only. Treatment is provided when medically appropriate. Compounded
            medications are not FDA-approved.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Formulation({ startTo }) {
  return (
    /* Full bleed, as the comp has it (2026-09-19): the photograph runs edge to
       edge and the copy on it keeps the page's column. */
    <section className="w-full pb-10 sm:pb-14 lg:pb-20">
      <Reveal>
        <div
          className="relative min-h-164 overflow-hidden sm:min-h-152 lg:min-h-156"
          /* Only ever seen above the photo on narrow screens; it ends on the
             photo's own top-edge colour so the seam disappears. */
          style={{ background: "linear-gradient(#7d6a52, #96826a)" }}
        >
          {/* A phone is far too narrow to hold both the couple and a clear
              column to set the copy in, so below lg the photo takes the lower
              band and the copy sits on the card's own ground above it. Same
              split as the nasal spray page. */}
          <img
            src="/site/sexual-health/pt141-couple.avif"
            alt="Couple relaxing together at home"
            loading="lazy"
            className="absolute inset-x-0 bottom-0 h-[62%] w-full object-cover object-[52%_center] sm:h-[66%] lg:inset-0 lg:h-full lg:object-center"
          />
          {/* No scrim: the comp uses the photograph as shot, and the tint was
              flattening its warmth. */}
          <div className="relative z-10 mx-auto w-full max-w-[1180px] px-6 pt-7 text-white sm:px-9 sm:pt-10 lg:px-12 lg:pt-12">
            <div className="max-w-136">
            <span className="font-display text-[0.72rem] font-bold uppercase tracking-[0.06em]">
              Formulation
            </span>
            <h2 className={`${TITLE} mt-3 whitespace-nowrap text-[clamp(2rem,4.6vw,3.3rem)]`}>
              PT-141 Injection
            </h2>
            <p className="mt-5 max-w-[42ch] text-[clamp(1rem,1.25vw,1.2rem)] font-semibold leading-[1.4]">
              Compounded PT-141 (bremelanotide) in an injectable format, prescribed and guided by
              your provider
            </p>
            <Link
              to={startTo}
              className="mt-7 inline-flex rounded-full px-11 py-3.5 text-[0.98rem] font-semibold transition-transform duration-300 hover:-translate-y-0.5"
              style={{ background: PALE, color: INK }}
            >
              Get Started
            </Link>
            </div>
          </div>

          <img
            src="/site/sexual-health/pt141-vial-tall.avif"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="nv-drift absolute bottom-[27%] left-[3%] z-10 h-44 w-auto sm:bottom-[25%] sm:h-56 lg:bottom-[-6%] lg:left-[4%] lg:h-80"
            style={{ rotate: "9deg" }}
          />

          <div
            /* Pinned to the content column rather than the window: with the
               band full bleed, sm:right-7 left it 28px off the screen edge
               while the copy started at the column (2026-09-19). */
            className="absolute bottom-4 left-4 right-4 z-20 rounded-[calc(20px*var(--nv-r-scale,1))] border-2 px-5 py-5 sm:bottom-7 sm:left-auto sm:right-[max(1.75rem,calc((100%-1180px)/2+2.25rem))] sm:w-84 sm:px-6"
            /* #c5a171, the comp's "Gray orange", rather than the darker brass
               that was here. */
            style={{ background: "rgba(197,161,113,0.58)", borderColor: "rgba(255,241,210,0.35)" }}
          >
            <div className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <p
                  className="font-display text-[0.95rem] font-bold leading-[1.15]"
                  style={{ color: CREAM }}
                >
                  Looking for a
                  <span className="block">needle-free option?</span>
                </p>
                <Link
                  to="/product/bremelanotide-nasal-spray"
                  className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[0.7rem] font-medium transition-transform duration-300 hover:-translate-y-0.5"
                  style={{ background: PALE, color: INK }}
                >
                  See PT-141 Nasal Spray <ArrowUpRight size={13} />
                </Link>
              </div>
              {/* The comp shows the nasal spray itself here, not a glyph. */}
              <img
                src="/site/sexual-health/pt141-nasal-spray.avif"
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="h-32 w-auto shrink-0 drop-shadow-lg sm:h-40"
              />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default function BremelanotideSections({ startTo = "/start" }) {
  return (
    <section style={{ background: "#faf8f4" }}>
      <ResponseStartsEarlier startTo={startTo} />
      <IsItRight startTo={startTo} />
      <Formulation startTo={startTo} />
    </section>
  );
}
