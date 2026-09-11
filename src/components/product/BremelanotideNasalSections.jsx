import React from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ArrowUpDown, ArrowUpRight, Check, Split } from "lucide-react";
import Reveal from "../ui/Reveal";

/* The nasal-spray comp reuses the injection page's palette, so the two
   formulations read as one product family. */
const INK = "#745922";
const BODY = "#625a4d";
const CREAM = "#f8e8c5";
const CREAM_SOFT = "rgba(248,232,197,0.82)";
const CREAM_RULE = "rgba(248,232,197,0.45)";
const BRASS = "radial-gradient(circle at 50% 50%, #c1a27a, #9a7843)";
const BRASS_FLAT = "#ad8a55";
const PALE = "#f3e5ca";
const CARD_R = "rounded-[calc(26px*var(--nv-r-scale,1))]";
const TITLE = "nv-weight-keep font-display font-extrabold leading-[1.08]";
/* Matches the sibling page: tighter than the site default so the brass band
   uses more of its width. */
const SECTION_X = "px-3 sm:px-5 md:px-6";
const EASE = [0.2, 0.7, 0.3, 1];

const SPRAY = "/site/sexual-health/pt141-spray-tall.avif";
/* Standalone `rotate` rather than a transform, so the tilt composes with
   nv-drift's float instead of replacing it. */
const BOTTLE_TILT = { rotate: "11deg" };

/* Positions are the comp's own, read off the stage as percentages: the copy
   sits clear of the bottle's glass on both sides at every width from lg up. */
const SIGNALS = [
  {
    icon: Check,
    title: "Needle-free",
    body: ["Nasal delivery,", "no injection required"],
    pos: "left-[25%] top-[13%] w-[22%]",
  },
  {
    icon: ArrowUpDown,
    title: "Melanocortin receptor activity",
    body: ["Bremelanotide is a", "melanocortin receptor agonist"],
    pos: "left-[60%] top-[38%] w-[22%]",
  },
  {
    icon: Split,
    title: "Alternative option",
    body: ["Also available as an", "injection"],
    pos: "left-[23%] top-[59%] w-[22%]",
  },
];

const STEPS = ["Nasal format", "Provider-directed", "Use as prescribed"];
const STEP_GAP = 0.16;

/* The fill fades out at the left so the card dissolves into the brass instead
   of ending on a hard edge, the way the comp draws it. */
const SIGNAL_FILL =
  "linear-gradient(to right, rgba(248,232,197,0) 0%, rgba(248,232,197,0.2) 44%, rgba(248,232,197,0.2) 100%)";

function SignalCard({ signal, className = "" }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-[calc(16px*var(--nv-r-scale,1))] px-4 py-4 sm:gap-4 sm:px-5 ${className}`}
      style={{ backgroundImage: SIGNAL_FILL }}
    >
      <signal.icon
        size={32}
        strokeWidth={1.4}
        aria-hidden="true"
        className="shrink-0"
        style={{ color: CREAM_SOFT }}
      />
      <div className="min-w-0">
        <h3
          className="font-display text-[0.8rem] font-bold uppercase tracking-[0.03em] lg:text-[0.86rem]"
          style={{ color: CREAM }}
        >
          {signal.title}
        </h3>
        {/* The comp sets its own line break rather than letting the card width
            decide where the phrase splits. */}
        <p
          className="mt-1 text-[0.8rem] leading-[1.35] lg:text-[0.84rem]"
          style={{ color: CREAM_SOFT }}
        >
          {signal.body[0]}
          <span className="block">{signal.body[1]}</span>
        </p>
      </div>
    </div>
  );
}

function ApproachStage() {
  return (
    <>
      {/* Below lg the stage's percentages leave no room beside the bottle, so
          the same three cards run in flow underneath it. */}
      <div className="mt-8 lg:hidden">
        <Reveal className="flex justify-center">
          <img
            src={SPRAY}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="nv-drift h-60 w-auto drop-shadow-2xl sm:h-80"
            style={BOTTLE_TILT}
          />
        </Reveal>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {SIGNALS.map((signal, i) => (
            <Reveal key={signal.title} delay={0.08 + i * 0.1} y={14}>
              <SignalCard signal={signal} className="h-full" />
            </Reveal>
          ))}
        </div>
      </div>

      <div className="relative mt-4 hidden h-[24rem] lg:block xl:h-[27rem]">
        {/* The centring lives on the wrapper so the img's own transform is the
            tilt alone and the two never compose into a diagonal shift. */}
        <span className="absolute left-[54%] top-0 h-[97%] -translate-x-1/2">
          <img
            src={SPRAY}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="nv-drift h-full w-auto drop-shadow-2xl"
            style={BOTTLE_TILT}
          />
        </span>
        {SIGNALS.map((signal, i) => (
          <Reveal
            key={signal.title}
            delay={0.14 + i * 0.12}
            y={14}
            className={`absolute z-10 ${signal.pos}`}
          >
            <SignalCard signal={signal} />
          </Reveal>
        ))}
      </div>
    </>
  );
}

/* Numbers, then labels, then the rule that carries the eye to the next number,
   so the row reads left to right once rather than all at once. */
function StepRail() {
  return (
    <ol className="mt-9 flex flex-col gap-5 sm:mt-11 sm:flex-row sm:items-center sm:gap-4">
      {STEPS.map((label, i) => (
        <li key={label} className="flex items-center gap-4 sm:flex-1">
          <Reveal
            as="span"
            y={0}
            duration={0.5}
            delay={i * STEP_GAP}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border font-display text-[0.95rem] font-semibold sm:h-12 sm:w-12"
            style={{ borderColor: CREAM_RULE, color: CREAM }}
          >
            {i + 1}
          </Reveal>
          <Reveal
            as="span"
            y={0}
            duration={0.5}
            delay={i * STEP_GAP + 0.1}
            className="font-display text-[0.9rem] font-bold uppercase leading-[1.2] tracking-[0.02em] sm:text-[0.98rem]"
            style={{ color: CREAM }}
          >
            {label}
          </Reveal>
          {i < STEPS.length - 1 && (
            /* Clipped rather than scaled: scaleX on a 1px rule thins it. */
            <Motion.span
              aria-hidden="true"
              className="hidden h-px flex-1 sm:block"
              style={{ background: CREAM_RULE }}
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              whileInView={{ clipPath: "inset(0 0% 0 0)" }}
              viewport={{ once: true, margin: "-80px 0px -80px 0px" }}
              transition={{ duration: 0.5, ease: EASE, delay: i * STEP_GAP + 0.26 }}
            />
          )}
        </li>
      ))}
    </ol>
  );
}

function ApproachToDesire({ startTo }) {
  return (
    <section className="overflow-hidden" style={{ background: BRASS }}>
      <div className={`mx-auto max-w-[1180px] py-9 sm:py-12 lg:py-16 ${SECTION_X}`}>
        <div className="grid gap-5 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.85fr)] md:gap-12">
          <Reveal as="div">
            <h2
              className={`${TITLE} max-w-[18ch] text-[clamp(1.8rem,4vw,2.9rem)]`}
              style={{ color: CREAM }}
            >
              A Needle-Free
              <span className="block">PT-141 Option</span>
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
            className="max-w-[46ch] text-[clamp(0.92rem,1.05vw,1.02rem)] leading-[1.6] md:pt-1"
            style={{ color: CREAM }}
          >
            PT-141 is a compounded prescription nasal spray containing bremelanotide, a
            melanocortin receptor agonist
          </Reveal>
        </div>

        <ApproachStage />
        <StepRail />

        <p
          className="mt-9 max-w-[68ch] text-[0.72rem] italic leading-[1.55] sm:mt-11"
          style={{ color: "rgba(248,232,197,0.72)" }}
        >
          PT-141 Nasal Spray is a compounded prescription medication. Compounded medications are not
          FDA-approved. Use only as directed by a licensed healthcare provider. Individual response
          may vary
        </p>
      </div>
    </section>
  );
}

function CareReview({ startTo }) {
  return (
    <section className={`mx-auto max-w-[1180px] py-10 sm:py-14 lg:py-20 ${SECTION_X}`}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.66fr)_minmax(0,1fr)] lg:items-center lg:gap-14">
        <Reveal as="div">
          <span
            className="font-mono text-[0.65rem] uppercase tracking-[0.08em]"
            style={{ color: INK }}
          >
            Personal to your care
          </span>
          <h2
            className={`${TITLE} mt-3 max-w-[14ch] text-[clamp(1.9rem,3.9vw,2.8rem)]`}
            style={{ color: INK }}
          >
            Treatment starts with what makes sense for you
          </h2>
          <p
            className="mt-5 max-w-[34ch] text-[clamp(1rem,1.2vw,1.15rem)] leading-[1.5]"
            style={{ color: BODY }}
          >
            Our care starts with a medical review to make sure PT-141 fits your health and treatment
            goals
          </p>
          <Link
            to={startTo}
            className="mt-6 inline-flex rounded-full px-7 py-3 text-center text-[0.86rem] font-semibold transition-transform duration-300 hover:-translate-y-0.5 sm:px-8"
            style={{ background: BRASS_FLAT, color: "#fff8e9" }}
          >
            See If PT-141 Is Right for You
          </Link>
          <p className="mt-8 max-w-[38ch] text-[0.72rem] italic leading-[1.45] text-muted lg:mt-14">
            Prescription only. Treatment is provided when medically appropriate. Compounded
            medications are not FDA-approved
          </p>
        </Reveal>
        <Reveal as="div" delay={0.1} className={`overflow-hidden ${CARD_R}`}>
          <img
            src="/site/sexual-health/pt141-care-portrait.avif"
            alt="Woman in warm daylight"
            loading="lazy"
            className="aspect-[29/25] w-full object-cover object-[52%_26%]"
          />
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
          className={`relative min-h-[40rem] overflow-hidden sm:min-h-[36rem] lg:min-h-[38rem] ${CARD_R}`}
          /* Only ever seen above the photo on narrow screens; it ends on the
             photo's own top-edge wall colour so the seam disappears. */
          style={{ background: "linear-gradient(#d8ccbd, #b39984)" }}
        >
          {/* A phone is far too narrow to hold both the couple and a clear
              column of wall, so below lg the photo takes the lower band and
              the copy sits on the card's own ground above it. */}
          <img
            src="/site/sexual-health/pt141-nasal-couple.avif"
            alt="Couple relaxing together at home"
            loading="lazy"
            className="absolute inset-x-0 bottom-0 h-[62%] w-full object-cover object-[68%_center] sm:h-[66%] sm:object-[62%_center] lg:inset-0 lg:h-full lg:object-center"
          />
          {/* The comp keeps the photograph as shot and sets the copy in the
              brand ink over its light left third, not in white. */}
          <div
            className="relative z-10 max-w-[34rem] px-6 pt-7 sm:px-9 sm:pt-10 lg:px-12 lg:pt-12"
            style={{ color: INK }}
          >
            <span className="font-display text-[0.72rem] font-bold uppercase tracking-[0.06em]">
              Formulation
            </span>
            <h2
              className={`${TITLE} mt-3 text-[clamp(1.8rem,4.6vw,3.1rem)] sm:whitespace-nowrap`}
            >
              PT-141 Nasal Spray
            </h2>
            {/* Two lines, so the copy stays on the wall above the console
                table rather than running into the blurred plant below it. */}
            <p className="mt-5 max-w-104 text-[clamp(1rem,1.25vw,1.2rem)] font-semibold leading-[1.4]">
              Compounded PT-141 (bremelanotide) as a nasal spray, prescribed and guided by your
              provider
            </p>
            <Link
              to={startTo}
              className="mt-7 inline-flex rounded-full px-11 py-3.5 text-[0.98rem] font-semibold transition-transform duration-300 hover:-translate-y-0.5"
              style={{ background: BRASS_FLAT, color: "#fff8e9" }}
            >
              Get Started
            </Link>
          </div>

          {/* Standalone `rotate` rather than a transform, so it composes with
              nv-drift instead of replacing it. */}
          <img
            src={SPRAY}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="nv-drift absolute bottom-[27%] left-[3%] z-10 h-44 w-auto drop-shadow-2xl sm:bottom-[25%] sm:h-56 lg:bottom-[2%] lg:left-[4%] lg:h-68"
            style={{ rotate: "-10deg" }}
          />

          <div
            className="absolute bottom-4 left-4 right-4 z-20 rounded-[calc(20px*var(--nv-r-scale,1))] border-2 px-5 py-5 sm:bottom-7 sm:left-auto sm:right-7 sm:w-92 sm:px-6 lg:w-100"
            style={{ background: "rgba(197,161,113,0.58)", borderColor: "rgba(255,241,210,0.35)" }}
          >
            <div className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <p
                  className="font-display text-[0.95rem] font-bold leading-[1.15]"
                  style={{ color: CREAM }}
                >
                  Prefer the
                  <span className="block">injectable format?</span>
                </p>
                <Link
                  to="/product/bremelanotide-injection"
                  className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[0.7rem] font-medium transition-transform duration-300 hover:-translate-y-0.5"
                  style={{ background: PALE, color: INK }}
                >
                  See PT-141 Injection <ArrowUpRight size={13} />
                </Link>
              </div>
              <img
                src="/site/sexual-health/pt141-vial-tall.avif"
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="h-24 w-auto shrink-0 drop-shadow-lg sm:h-32 lg:h-36"
              />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default function BremelanotideNasalSections({ startTo = "/start" }) {
  return (
    <section style={{ background: "#faf8f4" }}>
      <ApproachToDesire startTo={startTo} />
      <CareReview startTo={startTo} />
      <Formulation startTo={startTo} />
    </section>
  );
}
