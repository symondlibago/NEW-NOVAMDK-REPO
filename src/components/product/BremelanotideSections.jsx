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
      className={`flex items-center gap-2 rounded-full px-4 py-2.5 font-display text-[0.72rem] font-bold uppercase leading-none sm:px-5 sm:text-[0.78rem] ${className}`}
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
      <div className="mt-7 flex flex-col items-center md:hidden">
        <img
          src="/site/sexual-health/pt141-vial-square.avif"
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="nv-drift h-60 w-auto drop-shadow-2xl sm:h-72"
        />
        <div className="mt-5 flex flex-wrap justify-center gap-2.5">
          <SignalPill>Melanocortin pathways</SignalPill>
          <SignalPill>Central signaling</SignalPill>
          <SignalPill>As-needed use</SignalPill>
        </div>
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
        </div>
      </section>
      <p className={`mx-auto max-w-[1180px] pt-7 text-[0.73rem] italic text-muted sm:pt-9 ${SECTION_X}`}>
        Prescription required. Eligibility determined by a licensed provider
      </p>
    </>
  );
}

/* All three read as the same translucent cream in the comp; only the lit one
   steps up in fill and text. The old dark-brown fill on Confidence was a
   different chip entirely. */
const MOOD_PILLS = [
  { label: "Desire", pos: "left-[34%] top-[7%] px-7", z: "z-10" },
  { label: "Confidence", pos: "right-[3%] top-[31%] px-5", z: "z-30" },
  { label: "Response", pos: "bottom-[7%] left-[42%] px-5", z: "z-30" },
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
    <Reveal as="div" className="order-2 lg:order-1">
      <div
        ref={ref}
        className={`relative min-h-[27rem] overflow-hidden sm:min-h-[34rem] lg:min-h-[40rem] ${CARD_R}`}
        style={{ background: BRASS_FLAT }}
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
        {/* The 45-minute countdown card that sat here was removed on 2026-09-08
            with the compliance pass: it implied a standard response time. The
            approved statement takes its place and its position. */}
        <div
          className="absolute left-[4%] top-[26%] z-10 w-[74%] rounded-[calc(20px*var(--nv-r-scale,1))] border px-5 py-5 backdrop-blur-[2px] drop-shadow-xl sm:left-[5%] sm:w-[64%] sm:px-6 sm:py-6"
          style={{ background: "rgba(248,232,197,0.5)", borderColor: "rgba(255,241,210,0.4)" }}
        >
          <h3 className={`${TITLE} text-[clamp(1.1rem,2.2vw,1.5rem)]`} style={{ color: "#fffaf0" }}>
            As-Needed Treatment
          </h3>
          <p
            className="mt-2 max-w-[26ch] text-[0.86rem] leading-[1.45] sm:text-[0.92rem]"
            style={{ color: CREAM }}
          >
            Use only as directed by your healthcare provider
          </p>
        </div>
        <img
          src="/site/sexual-health/pt141-woman.avif"
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="absolute bottom-0 right-0 z-20 h-[92%] w-auto max-w-none sm:h-[96%]"
        />
      </div>
      <p className="mt-5 text-[0.72rem] italic leading-[1.35] text-muted">
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
    <section className={`mx-auto max-w-[1180px] py-8 sm:py-12 lg:py-16 ${SECTION_X}`}>
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.68fr)] lg:items-center lg:gap-10">
        <ReadinessCard />
        <Reveal as="div" className="order-1 lg:order-2" delay={0.08}>
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.08em]" style={{ color: INK }}>
            Before you start
          </span>
          <h2
            className={`${TITLE} mt-3 max-w-[13ch] text-[clamp(2rem,4.6vw,3.2rem)]`}
            style={{ color: INK }}
          >
            Is PT-141
            <span className="block">right for you?</span>
          </h2>
          <p
            className="mt-5 max-w-[34ch] text-[clamp(1rem,1.2vw,1.15rem)] leading-[1.5]"
            style={{ color: BODY }}
          >
            Our care starts with a medical review to make sure PT-141 fits your health and treatment
            goals.
          </p>
          <Link
            to={startTo}
            className="mt-6 inline-flex rounded-full px-7 py-3 text-center text-[0.86rem] font-semibold transition-transform duration-300 hover:-translate-y-0.5 sm:px-8"
            style={{ background: BRASS_FLAT, color: "#fff8e9" }}
          >
            See If PT-141 Is Right for You
          </Link>
          <p className="mt-7 max-w-[36ch] text-[0.72rem] italic leading-[1.45] text-muted lg:mt-12">
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
    <section className={`mx-auto max-w-[1180px] pb-10 sm:pb-14 lg:pb-20 ${SECTION_X}`}>
      <Reveal>
        <div
          className={`relative min-h-[41rem] overflow-hidden sm:min-h-[38rem] lg:min-h-[39rem] ${CARD_R}`}
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
          <div className="relative z-10 max-w-[34rem] px-6 pt-7 text-white sm:px-9 sm:pt-10 lg:px-12 lg:pt-12">
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

          <img
            src="/site/sexual-health/pt141-vial-tall.avif"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="nv-drift absolute bottom-[27%] left-[3%] z-10 h-44 w-auto sm:bottom-[25%] sm:h-56 lg:bottom-[-6%] lg:left-[4%] lg:h-80"
            style={{ rotate: "9deg" }}
          />

          <div
            className="absolute bottom-4 left-4 right-4 z-20 rounded-[calc(20px*var(--nv-r-scale,1))] border-2 px-5 py-5 sm:bottom-7 sm:left-auto sm:right-7 sm:w-[21rem] sm:px-6"
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
