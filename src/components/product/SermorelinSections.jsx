import React from "react";
import { Link } from "react-router-dom";
import { motion as Motion, useInView } from "framer-motion";

import { Check } from "lucide-react";

import Reveal from "../ui/Reveal";

/* COLORS / GLOBAL SECTION STYLES */

const INK = "#6b511e";
const BODY = "#7a6d58";

const CREAM_SOFT = "rgba(244,227,193,0.86)";

const BRASS_CARD =
  "radial-gradient(circle at 50% 50%, #c1a27a, #9a7843)";

const HEADING = "#ffe8b1";

/* Off the comp's colour picker: "Gray orange". */
const CHIP = "rgba(162,132,93,0.66)";
const TAN_DEEP = "#9c8452";
const TAN_PALE = "#d0bd99";

const CARD_R = "rounded-[calc(26px*var(--nv-r-scale,1))]";

const TITLE =
  "nv-weight-keep font-display font-extrabold leading-[1.14]";

const TITLE_SIZE =
  "text-[clamp(1.5rem,3.4vw,2.5rem)]";

const BODY_SIZE =
  "text-[clamp(0.82rem,1.02vw,0.95rem)]";

/* SMALL GOLD TITLE WORD */

function Tail({ children }) {
  return (
    <span
      className="bg-clip-text text-transparent"
      style={{
        backgroundImage: `linear-gradient(
          90deg,
          ${TAN_DEEP} 0%,
          ${TAN_PALE} 100%
        )`,
      }}
    >
      {children}
    </span>
  );
}

/* ANIMATION SETTINGS */

const CURVE_EASE = [0.22, 0.61, 0.18, 1];

const IN_VIEW = {
  once: true,
  margin: "-60px 0px -60px 0px",
};

/* 1. SUPPORT THE SIGNAL */

function SignalBand({ startTo }) {
  const graphRef = React.useRef(null);

  const graphIsInView = useInView(
    graphRef,
    IN_VIEW
  );

  return (
    <div className="mx-auto max-w-[1180px] px-5 pt-[clamp(2rem,5vw,3.5rem)] md:px-10">
      <Reveal>
        <div
          className={`relative overflow-hidden px-6 py-9 sm:px-10 sm:py-12 ${CARD_R}`}
          style={{ background: BRASS_CARD }}
        >
          {/* TOP SECTION */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-12">
            {/* LEFT */}
            <div>
              <h2
                className={`${TITLE} ${TITLE_SIZE} max-w-[20ch]`}
                style={{ color: HEADING }}
              >
                How Sermorelin Acts on the{" "}
                <span className="sm:block">
                  Growth-Hormone Pathway
                </span>
              </h2>

              <Link
                to={startTo}
                className="mt-6 inline-flex rounded-full bg-[#f6efe0] px-7 py-3 text-[0.9rem] font-medium text-[#6b511e] transition-all duration-300 hover:-translate-y-0.5"
              >
                Explore Sermorelin
              </Link>
            </div>

            {/* RIGHT */}
            <p
            className="text-[clamp(0.95rem,1.25vw,1.15rem)] max-w-[46ch] leading-relaxed lg:pt-2"
            style={{ color: CREAM_SOFT }}
          >
            Sermorelin acts on the pituitary growth
            hormone pathway. If prescribed, it is intended
            to stimulate release of growth hormone
          </p>
          </div>

          {/* GRAPH / STATISTIC SECTION */}
          <div className="relative mt-[clamp(2rem,5vw,3.5rem)]">
            {/* TEXT ABOVE GRAPH */}
            <p
              className="mx-auto max-w-[34ch] text-center text-[clamp(0.95rem,1.35vw,1.15rem)] font-semibold leading-snug"
              style={{ color: CREAM_SOFT }}
            >
              Growth-hormone secretion declines by approximately 15% per decade after age 30
            </p>

            <div className="mt-3 flex items-stretch gap-2 sm:gap-3">
              <span
                className="shrink-0 self-center whitespace-nowrap text-[clamp(0.66rem,0.9vw,0.8rem)] font-semibold [writing-mode:vertical-rl] rotate-180"
                style={{ color: CREAM_SOFT }}
              >
                Natural GH production
              </span>

              <div
                ref={graphRef}
                /* 39/14 is the SVG's own ratio now that its canvas carries 12
                   units of bleed on every side (624x224). Leaving this at 3/1
                   would letterbox the artwork inside the box instead. */
                className="relative aspect-[39/14] min-w-0 flex-1"
              >
                {/* ANIMATED EXTERNAL SVG */}
                {graphIsInView && (
                  <img
                    src="/site/anti-aging/sermorelin-canva-graph-animated.svg"
                    alt=""
                    aria-hidden="true"
                    draggable="false"
                    className="absolute inset-0 z-10 block h-full w-full select-none object-contain"
                  />
                )}

                {/* LARGE 14% */}
                <Motion.div
                  className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
                  initial={{
                    opacity: 0,
                    scale: 0.92,
                  }}
                  whileInView={{
                    opacity: 1,
                    scale: 1,
                  }}
                  viewport={IN_VIEW}
                  transition={{
                    duration: 0.8,
                    ease: CURVE_EASE,
                    delay: 0.15,
                  }}
                >
                  <span
                    className="font-display text-[clamp(4.5rem,17vw,11rem)] font-extrabold leading-none tracking-tight"
                    style={{
                      color: "rgba(246,239,224,0.42)",
                    }}
                  >
                    15%
                  </span>
                </Motion.div>
              </div>
            </div>

            <p
              className="mt-2 text-center text-[clamp(0.66rem,0.9vw,0.8rem)] font-semibold"
              style={{ color: CREAM_SOFT }}
            >
              Age
            </p>

            {/* Required attribution and framing: the figure is population data,
                not a result anyone should expect from treatment. */}
            <p
              className="mx-auto mt-4 max-w-[62ch] text-center text-[0.72rem] italic leading-relaxed"
              style={{ color: "rgba(244,227,193,0.7)" }}
            >
              Source: Endotext. Educational information only, not an expected treatment result
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

/* =========================================================
   2. HOW SERMORELIN WORKS
   ========================================================= */

const WORKS_NODES = {
  signal: [350, 100],
  pituitary: [727, 184],
  growthHormone: [343, 400],
  body: [728, 528],
};

const WORKS_NODE_LIST =
  Object.values(WORKS_NODES);

/* The approved narrative (2026-09-08 compliance pass) is three beats — Signal,
   Growth Hormone Release, IGF-1 Response — but the illustration behind these
   chips is a four-node diagram whose connectors are drawn between fixed
   anchors, so the pituitary keeps its own chip as the anatomical node the three
   beats run through. Every description is held to normal metabolic and tissue
   processes; none of them promises an outcome. */
const STEPS = [
  {
    title: "Signal",
    body:
      "Sermorelin acts on the pituitary growth hormone pathway",
    pos: "left-[5%] top-[4.8%]",
  },
  {
    title: "Pituitary gland",
    body:
      "The gland the growth hormone pathway runs through",
    pos: "right-[2.5%] top-[16.4%]",
  },
  {
    title: "Growth hormone release",
    body:
      "If prescribed, it is intended to stimulate release of growth hormone",
    pos: "left-[5%] top-[47.3%]",
  },
  {
    title: "IGF-1 response",
    body:
      "Growth hormone signals the production of IGF-1, which is involved in normal metabolic and tissue processes",
    pos: "right-[2.5%] top-[66.6%]",
  },
];

const CONNECTOR_STROKE = "#f7ead0";

/*
 * TIMELINE
 *
 * Adjust these if you want the whole sequence
 * faster or slower.
 */
const CHIP_LEAD = 0.15;

const CHIP_DURATION = 0.42;

const CONNECTOR_DURATION = 0.62;

const SEQUENCE_GAP = 0.06;

const SEQUENCE_STEP =
  CHIP_DURATION +
  SEQUENCE_GAP +
  CONNECTOR_DURATION;

function getChipDelay(index) {
  return (
    CHIP_LEAD +
    index * SEQUENCE_STEP
  );
}

/*
 * Connector starts only AFTER its previous card
 * has finished revealing.
 */
function getConnectorDelay(index) {
  return (
    getChipDelay(index) +
    CHIP_DURATION +
    SEQUENCE_GAP
  );
}

/* CARD */

function GlassChip({
  title,
  body,
  className = "",
  delay = 0,
}) {
  return (
    <Motion.div
      className={`z-40 w-[26.2%] rounded-[calc(28px*var(--nv-r-scale,1))] border border-white/15 px-[clamp(1rem,1.35vw,1.45rem)] py-[clamp(0.85rem,1.15vw,1.2rem)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_28px_rgba(75,55,28,0.06)] backdrop-blur-[10px] ${className}`}
      style={{
        background: CHIP,
      }}
      initial={{
        opacity: 0,
        scale: 0.9,
      }}
      whileInView={{
        opacity: 1,
        scale: 1,
      }}
      viewport={IN_VIEW}
      transition={{
        duration: CHIP_DURATION,
        ease: CURVE_EASE,
        delay,
      }}
    >
      <p className="text-[clamp(0.72rem,0.78vw,0.92rem)] font-bold leading-[1.15] text-white">
        {title}
      </p>

      <p className="mt-2 text-[clamp(0.68rem,0.72vw,0.86rem)] leading-[1.35] text-white/85">
        {body}
      </p>
    </Motion.div>
  );
}

function WorksBackConnectors() {
  const {
    signal,
    pituitary,
    growthHormone,
  } = WORKS_NODES;

  const svgRef = React.useRef(null);

  const isInView = useInView(
    svgRef,
    IN_VIEW
  );

  const signalToPituitary = `
    M${signal[0]} ${signal[1]}
    L${pituitary[0]} ${pituitary[1]}
  `;

  const pituitaryToGrowth = `
    M${pituitary[0]} ${pituitary[1]}
    L${growthHormone[0]} ${growthHormone[1]}
  `;

  return (
    <Motion.svg
      ref={svgRef}
      viewBox="0 0 1040 693"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 hidden h-full w-full lg:block"
      initial={{ opacity: 0 }}
      animate={{
        opacity: isInView
          ? 1
          : 0,
      }}
      transition={{
        duration: 0.25,
        ease: CURVE_EASE,
      }}
    >
      <defs>
        {/*
          MASK 1

          This solid path grows from the first
          checkpoint to the second checkpoint.

          The broken line underneath stays still.
        */}
        <mask
          id="nvWorksMaskSignalPituitary"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="1040"
          height="693"
        >
          <Motion.path
            d={signalToPituitary}
            fill="none"
            stroke="white"
            strokeWidth="14"
            strokeLinecap="round"
            initial={{
              pathLength: 0,
            }}
            animate={{
              pathLength:
                isInView
                  ? 1
                  : 0,
            }}
            transition={{
              duration:
                CONNECTOR_DURATION,
              ease:
                CURVE_EASE,
              delay:
                getConnectorDelay(0),
            }}
          />
        </mask>

        {/*
          MASK 2

          This one runs from:
          pituitary → growth hormone
        */}
        <mask
          id="nvWorksMaskPituitaryGrowth"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="1040"
          height="693"
        >
          <Motion.path
            d={pituitaryToGrowth}
            fill="none"
            stroke="white"
            strokeWidth="14"
            strokeLinecap="round"
            initial={{
              pathLength: 0,
            }}
            animate={{
              pathLength:
                isInView
                  ? 1
                  : 0,
            }}
            transition={{
              duration:
                CONNECTOR_DURATION,
              ease:
                CURVE_EASE,
              delay:
                getConnectorDelay(1),
            }}
          />
        </mask>
      </defs>

      {/* DASHED LINE 1 */}
      <path
        d={signalToPituitary}
        fill="none"
        stroke={CONNECTOR_STROKE}
        strokeOpacity="0.9"
        strokeWidth="3.25"
        strokeDasharray="12 9"
        strokeLinecap="butt"
        vectorEffect="non-scaling-stroke"
        mask="url(#nvWorksMaskSignalPituitary)"
      />

      {/* DASHED LINE 2 */}
      <path
        d={pituitaryToGrowth}
        fill="none"
        stroke={CONNECTOR_STROKE}
        strokeOpacity="0.9"
        strokeWidth="3.25"
        strokeDasharray="12 9"
        strokeLinecap="butt"
        vectorEffect="non-scaling-stroke"
        mask="url(#nvWorksMaskPituitaryGrowth)"
      />
    </Motion.svg>
  );
}

function WorksFrontConnectors() {
  const {
    growthHormone,
    body,
  } = WORKS_NODES;

  const svgRef = React.useRef(null);

  const isInView = useInView(
    svgRef,
    IN_VIEW
  );

  const growthToBody = `
    M${growthHormone[0]} ${growthHormone[1]}
    L${body[0]} ${body[1]}
  `;

  return (
    <Motion.svg
      ref={svgRef}
      viewBox="0 0 1040 693"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30 hidden h-full w-full lg:block"
      initial={{ opacity: 0 }}
      animate={{
        opacity: isInView
          ? 1
          : 0,
      }}
      transition={{
        duration: 0.25,
        ease: CURVE_EASE,
      }}
    >
      <defs>
        <radialGradient
          id="nvWorksNodeGlow"
          cx="50%"
          cy="50%"
          r="50%"
        >
          <stop
            offset="0%"
            stopColor="#fffdf5"
            stopOpacity="1"
          />

          <stop
            offset="23%"
            stopColor="#fff5d9"
            stopOpacity="0.95"
          />

          <stop
            offset="48%"
            stopColor="#f3d69b"
            stopOpacity="0.42"
          />

          <stop
            offset="100%"
            stopColor="#f3d69b"
            stopOpacity="0"
          />
        </radialGradient>

        {/*
          MASK 3

          Growth hormone → body
        */}
        <mask
          id="nvWorksMaskGrowthBody"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="1040"
          height="693"
        >
          <Motion.path
            d={growthToBody}
            fill="none"
            stroke="white"
            strokeWidth="14"
            strokeLinecap="round"
            initial={{
              pathLength: 0,
            }}
            animate={{
              pathLength:
                isInView
                  ? 1
                  : 0,
            }}
            transition={{
              duration:
                CONNECTOR_DURATION,
              ease:
                CURVE_EASE,
              delay:
                getConnectorDelay(2),
            }}
          />
        </mask>
      </defs>

      {/* DASHED LINE 3 */}
      <path
        d={growthToBody}
        fill="none"
        stroke={CONNECTOR_STROKE}
        strokeOpacity="0.9"
        strokeWidth="3.25"
        strokeDasharray="12 9"
        strokeLinecap="butt"
        vectorEffect="non-scaling-stroke"
        mask="url(#nvWorksMaskGrowthBody)"
      />

      {/* Four shared glowing nodes */}
      {WORKS_NODE_LIST.map(
        ([cx, cy]) => (
          <g
            key={`node-${cx}-${cy}`}
          >
            <circle
              cx={cx}
              cy={cy}
              r="28"
              fill="url(#nvWorksNodeGlow)"
            />

            <circle
              cx={cx}
              cy={cy}
              r="8"
              fill="#fff9e8"
              fillOpacity="0.98"
            />
          </g>
        )
      )}
    </Motion.svg>
  );
}

/* HOW IT WORKS SECTION */

function HowItWorks({ startTo }) {
  return (
    <div className="mx-auto max-w-[1540px] px-5 pt-[clamp(2.5rem,6vw,4.5rem)] md:px-10 xl:px-12">
      {/* DISCLAIMER */}
      <p
        className="max-w-[52ch] text-[0.78rem] italic leading-relaxed"
        style={{ color: BODY }}
      >
        Prescription required. Eligibility is determined
        by a licensed healthcare provider. Individual
        results may vary.
      </p>

      {/* MAIN GRID */}
      <div className="mt-7 grid items-center gap-10 lg:grid-cols-[minmax(340px,0.58fr)_minmax(0,1fr)] lg:gap-14 xl:gap-[4.5rem]">
        {/* LEFT CONTENT */}
        <Reveal as="div">
          <h2
            className={`${TITLE} max-w-[16ch] text-[clamp(1.9rem,3.2vw,3rem)] leading-[1.06]`}
            style={{ color: INK }}
          >
            How Sermorelin{" "}
            <Tail>
              works
            </Tail>
          </h2>

          <p
            className="mt-7 max-w-[39ch] text-[clamp(1rem,1.25vw,1.22rem)] leading-[1.42]"
            style={{ color: BODY }}
          >
            Sermorelin acts on the pituitary growth
            hormone pathway, which is involved in normal
            metabolic and tissue processes
          </p>

          <Link
            to={startTo}
            className="mt-10 inline-flex min-w-[15.5rem] items-center justify-center rounded-full bg-[#a98955] px-10 py-4 text-[clamp(1rem,1.05vw,1.18rem)] font-medium text-[#f6efe0] transition-all duration-300 hover:-translate-y-0.5 nv-shadow"
          >
            Get Started
          </Link>
        </Reveal>

        {/* RIGHT IMAGE / DIAGRAM */}
        <Reveal
          as="div"
          delay={0.08}
        >
          <div
            className={`relative isolate overflow-hidden ${CARD_R}`}
          >
            {/* Base photo */}
            <img
              src="/site/anti-aging/sermorelin-works.png"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="relative z-0 block aspect-[3/2] w-full object-cover object-center"
            />

            {/* Lines 1 and 2 live behind the runner */}
            <WorksBackConnectors />

            {/* Transparent runner cutout */}
            <img
              src="/site/anti-aging/sermorelin-works-man.png"
              alt=""
              aria-hidden="true"
              loading="lazy"
              draggable="false"
              className="pointer-events-none absolute inset-0 z-20 hidden h-full w-full select-none object-cover object-center lg:block"
            />

            {/* Line 3 + glowing nodes */}
            <WorksFrontConnectors />

            {/* DESKTOP GLASS CHIPS */}
            {STEPS.map(
              (step, i) => (
                <GlassChip
                  key={step.title}
                  title={step.title}
                  body={step.body}
                  delay={
                    getChipDelay(i)
                  }
                  className={`absolute hidden lg:block ${step.pos}`}
                />
              )
            )}
          </div>

          {/* MOBILE / TABLET LIST */}
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:hidden">
            {STEPS.map(
              (step) => (
                <li
                  key={step.title}
                  className="rounded-[calc(14px*var(--nv-r-scale,1))] bg-[#f1e8d8] px-4 py-3"
                >
                  <p
                    className="text-[0.8rem] font-bold leading-tight"
                    style={{
                      color: INK,
                    }}
                  >
                    {step.title}
                  </p>

                  <p
                    className="mt-1 text-[0.76rem] leading-snug"
                    style={{
                      color: BODY,
                    }}
                  >
                    {step.body}
                  </p>
                </li>
              )
            )}
          </ul>
        </Reveal>
      </div>
    </div>
  );
}

/* =========================================================
   3. GH PATHWAY
   ========================================================= */

const SLOT_MS = 5000;

const SLOTS = [
  // top: smallest + quietest
  {
    left: "50%",
    top: "16%",
    width: "24%",
    iconSize: "2.3rem",
    titleSize: "0.82rem",
    bodySize: "0.74rem",
    gap: "0.75rem",
    padding: "0.82rem 1.05rem",
    opacity: 0.5,
    background: "rgba(196,168,124,0.22)",
    borderColor: "rgba(255,255,255,0.14)",
    boxShadow: "none",
    transform: "translateX(-50%)",
  },

  // right: secondary
  {
    left: "89%",
    top: "50%",
    width: "28.5%",
    iconSize: "2.8rem",
    titleSize: "0.88rem",
    bodySize: "0.79rem",
    gap: "0.85rem",
    padding: "0.92rem 1.15rem",
    opacity: 0.66,
    background: "rgba(196,168,124,0.26)",
    borderColor: "rgba(255,255,255,0.18)",
    boxShadow: "none",
    transform: "translate(-100%, -50%)",
  },

  // bottom: HERO / highlighted state
  {
    left: "50%",
    top: "84%",
    width: "50%",
    iconSize: "5.1rem",
    titleSize: "1.05rem",
    bodySize: "0.92rem",
    gap: "1.1rem",
    padding: "1.15rem 1.5rem",
    opacity: 1,
    background: "rgba(188,153,99,0.58)",
    borderColor: "rgba(255,255,255,0.36)",
    boxShadow:
      "0 16px 38px rgba(77,55,26,0.16), inset 0 1px 0 rgba(255,255,255,0.16)",
    transform: "translate(-50%, -100%)",
  },

  // left: secondary
  {
    left: "11%",
    top: "50%",
    width: "28.5%",
    iconSize: "2.8rem",
    titleSize: "0.88rem",
    bodySize: "0.79rem",
    gap: "0.85rem",
    padding: "0.92rem 1.15rem",
    opacity: 0.66,
    background: "rgba(196,168,124,0.26)",
    borderColor: "rgba(255,255,255,0.18)",
    boxShadow: "none",
    transform: "translateY(-50%)",
  },
];

const PATHWAY = [
  {
    icon:
      "/site/anti-aging/gh-metabolism.avif",

    title:
      "Metabolism",

    body:
      "Growth hormone influences how the body handles fats, proteins, and carbohydrates as part of normal metabolic function",
  },

  {
    icon:
      "/site/anti-aging/gh-sleep.avif",

    title:
      "Sleep and overnight recovery",

    body:
      "Natural GH release is closely tied to nighttime and deep sleep. Supporting this pathway may be part of a broader approach to sleep and recovery",
  },

  {
    icon:
      "/site/anti-aging/gh-composition.avif",

    title:
      "Body composition",

    body:
      "Growth hormone and IGF-1 are involved in the processes that help maintain lean tissue and regulate how the body stores and uses fat",
  },

  {
    icon:
      "/site/anti-aging/gh-recovery.avif",

    title:
      "Recovery",

    body:
      "The GH pathway plays a role in tissue maintenance, protein metabolism, and normal repair processes",
  },
];

/* GH PATHWAY SECTION */

function GhPathway() {
  const [step, setStep] =
    React.useState(0);

  React.useEffect(() => {
    if (
      window
        .matchMedia(
          "(prefers-reduced-motion: reduce)"
        )
        .matches
    ) {
      return undefined;
    }

    const t = setInterval(
      () =>
        setStep(
          (v) => v + 1
        ),
      SLOT_MS
    );

    return () =>
      clearInterval(t);
  }, []);

  return (
    <div className="mx-auto max-w-[1180px] px-5 pt-[clamp(3rem,7vw,5rem)] md:px-10">
      <Reveal>
        <span className="nv-eyebrow">
          The GH pathway
        </span>

        <h2
          className={`${TITLE} mt-3 max-w-[22ch] text-[clamp(2rem,3.8vw,3.35rem)] leading-[1.03]`}
          aria-label="What growth hormone does in the body"
        >
          <span
            className="block w-fit bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #6b511e 0%, #8b7039 52%, #cbb98e 100%)",
            }}
          >
            What growth hormone
          </span>

          <span
            className="block w-fit bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #6b511e 0%, #8b7039 52%, #cbb98e 100%)",
            }}
          >
            does in the body
          </span>
        </h2>
      </Reveal>

      <Reveal
        as="div"
        delay={0.06}
      >
        {/* IMAGE */}
        <div className="relative mt-8">
          <img
            src="/site/anti-aging/sermorelin-pathway.png"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className={`block aspect-[16/10] w-full object-cover object-center ${CARD_R}`}
          />

          {/* DESKTOP PATHWAY CARDS */}
          {PATHWAY.map(
            (item, i) => {
              const slot =
                SLOTS[
                  (i + step) %
                    SLOTS.length
                ];

              return (
                <div
                  key={item.title}
                  className="absolute hidden items-center rounded-[calc(20px*var(--nv-r-scale,1))] border backdrop-blur-md md:flex"
                  style={{
                    background:
                      slot.background,

                    borderColor:
                      slot.borderColor,

                    boxShadow:
                      slot.boxShadow,

                    left:
                      slot.left,

                    top:
                      slot.top,

                    width:
                      slot.width,

                    gap:
                      slot.gap,

                    padding:
                      slot.padding,

                    transform:
                      slot.transform,

                    opacity:
                      slot.opacity,

                    transition:
                      "left 900ms cubic-bezier(0.22,1,0.36,1), top 900ms cubic-bezier(0.22,1,0.36,1), width 900ms cubic-bezier(0.22,1,0.36,1), transform 900ms cubic-bezier(0.22,1,0.36,1), opacity 900ms ease, background-color 900ms ease, border-color 900ms ease, box-shadow 900ms ease, padding 900ms cubic-bezier(0.22,1,0.36,1), gap 900ms cubic-bezier(0.22,1,0.36,1)",
                  }}
                >
                  <img
                    src={item.icon}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="block shrink-0 object-contain"
                    style={{
                      width:
                        slot.iconSize,

                      height:
                        slot.iconSize,

                      transition:
                        "width 900ms cubic-bezier(0.22,1,0.36,1), height 900ms cubic-bezier(0.22,1,0.36,1)",
                    }}
                  />

                  <span className="min-w-0">
                    <span
                      className="block font-bold leading-tight text-white"
                      style={{
                        fontSize:
                          slot.titleSize,

                        transition:
                          "font-size 900ms cubic-bezier(0.22,1,0.36,1)",
                      }}
                    >
                      {item.title}
                    </span>

                    <span
                      className="mt-1 block leading-snug text-white/90"
                      style={{
                        fontSize:
                          slot.bodySize,

                        transition:
                          "font-size 900ms cubic-bezier(0.22,1,0.36,1)",
                      }}
                    >
                      {item.body}
                    </span>
                  </span>
                </div>
              );
            }
          )}
        </div>

        {/* MOBILE PATHWAY */}
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 md:hidden">
          {PATHWAY.map(
            (item, i) => (
              <li
                key={item.title}
                className="rounded-[calc(14px*var(--nv-r-scale,1))] bg-[#f1e8d8] px-4 py-3"
              >
                <img
                  src={item.icon}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="block h-[17px] w-[17px] object-contain"
                  style={{
                    animationDelay:
                      `${i * -3}s`,

                    filter:
                      "brightness(0.42) sepia(1) saturate(2.2) hue-rotate(5deg)",
                  }}
                />

                <p
                  className="mt-1.5 text-[0.8rem] font-bold leading-tight"
                  style={{ color: INK }}
                >
                  {item.title}
                </p>

                <p
                  className="mt-1 text-[0.76rem] leading-snug"
                  style={{ color: BODY }}
                >
                  {item.body}
                </p>
              </li>
            )
          )}
        </ul>
      </Reveal>
    </div>
  );
}

/* =========================================================
   4. WITHOUT INJECTIONS
   ========================================================= */

const NEEDLE_FREE = [
  "Needle-Free Treatment",
  "Provider-Directed Care",
  "At-Home Routine",
];

/* WITHOUT INJECTIONS SECTION */

function WithoutInjections() {
  return (
    <div className="mx-auto max-w-[1180px] px-5 pt-[clamp(3rem,7vw,5rem)] md:px-10">
      <Reveal>
        <div
          className={`grid gap-8 px-6 py-9 sm:px-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)] lg:items-center lg:gap-12 ${CARD_R}`}
          style={{
            background: "#f2ead9",
          }}
        >
          {/* LEFT */}
          <div>
            <h2
              className={`${TITLE} ${TITLE_SIZE} max-w-[15ch]`}
              style={{ color: INK }}
            >
              Sermorelin, without the{" "}
              <Tail>
                injections
              </Tail>
            </h2>

            <p
              className={`mt-5 max-w-[44ch] leading-relaxed ${BODY_SIZE}`}
              style={{ color: BODY }}
            >
              NovaMDK offers Sermorelin as a compounded
              nasal spray. It provides a needle-free way
              to receive provider-prescribed Sermorelin
              without syringes or injection preparation.
            </p>
          </div>

          {/* RIGHT */}
          <ul className="grid gap-4">
            {NEEDLE_FREE.map(
              (item) => (
                <li
                  key={item}
                  className="flex items-center gap-3"
                >
                  <span
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white"
                    style={{
                      background:
                        "#a98a4e",
                    }}
                  >
                    <Check
                      size={15}
                      strokeWidth={3}
                    />
                  </span>

                  <span
                    className="text-[0.95rem] font-bold"
                    style={{
                      color: INK,
                    }}
                  >
                    {item}
                  </span>
                </li>
              )
            )}
          </ul>
        </div>
      </Reveal>
    </div>
  );
}

/* =========================================================
   5. CLOSING BAND
   ========================================================= */

function UnderstandBand({
  startTo,
}) {
  return (
    <div className="mx-auto max-w-[1180px] px-5 py-[clamp(3rem,7vw,5rem)] md:px-10">
      <Reveal>
        <div
          className={`relative overflow-hidden md:aspect-[2.85/1] ${CARD_R}`}
        >
          {/* BACKGROUND IMAGE */}
          <img
            src="/site/anti-aging/sermorelin-understand.png"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-right-top"
          />

          {/* CONTENT */}
          <div className="relative z-10 flex h-full max-w-[52ch] flex-col justify-center px-6 py-10 sm:px-10 md:py-0">
            <h2
            className={`${TITLE} max-w-[24ch] text-[clamp(1.5rem,2.8vw,2rem)]`}
            style={{ color: INK }}
          >
            Understand the pathway
          </h2>

            <p
              className={`mt-4 font-semibold ${BODY_SIZE}`}
              style={{ color: INK }}
            >
              Then decide if it fits your goals
            </p>

            <p
              className={`mt-4 max-w-[52ch] leading-relaxed ${BODY_SIZE}`}
              style={{ color: BODY }}
            >
              Start with a licensed provider who can
              review your health and determine whether
              Sermorelin may be appropriate for you
            </p>

            <Link
              to={startTo}
              className="mt-7 inline-flex max-w-[16rem] rounded-full bg-[#725826] px-7 py-3 text-center text-[0.9rem] font-semibold leading-snug text-white transition-all duration-300 hover:-translate-y-0.5 nv-shadow"
            >
              See If Sermorelin Is Right for You
            </Link>

            <p
              className="mt-6 max-w-[40ch] text-[0.76rem] italic leading-relaxed"
              style={{
                color: "#9a8a6d",
              }}
            >
              Individual response may vary. Treatment
              requires evaluation by a licensed healthcare
              provider.
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

/* MAIN EXPORT */

export default function SermorelinSections({
  startTo = "/start",
}) {
  return (
    <section
      style={{
        background: "#faf8f4",
      }}
    >
      <SignalBand
        startTo={startTo}
      />

      <HowItWorks
        startTo={startTo}
      />

      <GhPathway />

      <WithoutInjections />

      <UnderstandBand
        startTo={startTo}
      />
    </section>
  );
}