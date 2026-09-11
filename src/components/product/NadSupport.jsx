import React, { useEffect, useRef, useState } from "react";
import Reveal from "../ui/Reveal";

const INK = "#3f3a33";
const MUTED = "#6b5e4b";

/* Updated text colors from new reference */
const TITLE_LIGHT = "#a18858";
const TITLE_DARK = "#705529";
const BODY_GOLD = "#a17f50";
const QUOTE_GOLD = "#a27d4e";
const QUOTE_LINE = "#d7c9af";

const GOLD_DOT = "#c69b42";

const LINE = "#e1d2b3";
const CARD = "#fdfbf7";

const CARD_R = "rounded-[calc(20px*var(--nv-r-scale,1))]";

/* Five plain age points per the approved reference (2026-09-08). The descriptive
   line each one used to carry was a life-stage claim, not axis data. */
const AGES = [
  { age: "30" },
  { age: "40" },
  { age: "50" },
  { age: "60" },
  { age: "70+" },
];

const CURVE = `
  M 58 8
  C 65 34, 81 59, 102 73
  C 121 86, 139 89, 157 84
  C 175 79, 187 90, 200 115
  C 214 141, 226 151, 241 150
  C 258 149, 270 134, 286 132
  C 305 130, 324 141, 343 152
  C 372 168, 403 177, 438 181
`;

const CURVE_AREA = `
  M -55 42

  C -15 27, 20 26, 58 8

  C 65 34, 81 59, 102 73
  C 121 86, 139 89, 157 84
  C 175 79, 187 90, 200 115
  C 214 141, 226 151, 241 150
  C 258 149, 270 134, 286 132
  C 305 130, 324 141, 343 152
  C 372 168, 403 177, 438 181

  L 470 215
  L -55 215
  Z
`;

const HEAD = {
  x: 58,
  y: 8,
};

export default function NadSupport() {
  const graphRef = useRef(null);
  const [graphActive, setGraphActive] = useState(false);

  useEffect(() => {
    const node = graphRef.current;

    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setGraphActive(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.3,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section
      className="py-[clamp(2.5rem,5vw,4.5rem)]"
      style={{
        background: "#faf8f4",
      }}
    >
      {/* GRAPH ANIMATION */}
      <style>{`
        /* ==============================
           STARTING DOT
        ============================== */

        .nv-energy-start-dot {
          opacity: 0;
          transform: translateY(-14px) scale(0.72);
          transform-box: fill-box;
          transform-origin: center;
        }

        .nv-energy-active .nv-energy-start-dot {
          animation: nvEnergyDotIn 0.55s
            cubic-bezier(0.22, 1, 0.36, 1)
            forwards;
        }

        /* ==============================
           DOT GLOW
        ============================== */

        .nv-energy-dot-glow {
          opacity: 0;
          transform: scale(0.6);
          transform-box: fill-box;
          transform-origin: center;
        }

        .nv-energy-active .nv-energy-dot-glow {
          animation: nvEnergyGlowIn 0.75s
            cubic-bezier(0.22, 1, 0.36, 1)
            forwards;
        }

        /* ==============================
           TOP GRAPH TEXT
        ============================== */

        .nv-energy-top-copy {
          opacity: 0;
          transform: translateY(-5px);
        }

        .nv-energy-active .nv-energy-top-copy {
          animation: nvEnergyTopCopy 0.8s ease-out
            0.15s forwards;
        }

        /* ==============================
           GRAPH LINE
        ============================== */

        .nv-energy-draw {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
        }

        .nv-energy-active .nv-energy-main-line {
          animation: nvEnergyDraw 2.4s
            cubic-bezier(0.4, 0, 0.2, 1)
            0.35s forwards;
        }

        .nv-energy-active .nv-energy-line-halo {
          animation: nvEnergyDraw 2.4s
            cubic-bezier(0.4, 0, 0.2, 1)
            0.39s forwards;
        }

        .nv-energy-active .nv-energy-line-shadow {
          animation: nvEnergyDraw 2.4s
            cubic-bezier(0.4, 0, 0.2, 1)
            0.42s forwards;
        }

        /* ==============================
           GOLD AREA
        ============================== */

        .nv-energy-area-soft,
        .nv-energy-area-inner {
          opacity: 0;
        }

        .nv-energy-active .nv-energy-area-soft {
          animation: nvEnergyAreaSoft 1.7s ease-out
            0.65s forwards;
        }

        .nv-energy-active .nv-energy-area-inner {
          animation: nvEnergyAreaInner 1.7s ease-out
            0.7s forwards;
        }

        /* ==============================
           AGE LABELS
        ============================== */

        .nv-energy-age {
          opacity: 0;
          transform: translateY(8px);
        }

        .nv-energy-active .nv-energy-age {
          animation: nvEnergyAgeIn 0.6s ease-out forwards;
        }

        .nv-energy-active .nv-energy-age:nth-child(1) {
          animation-delay: 1.15s;
        }

        .nv-energy-active .nv-energy-age:nth-child(2) {
          animation-delay: 1.4s;
        }

        .nv-energy-active .nv-energy-age:nth-child(3) {
          animation-delay: 1.65s;
        }

        .nv-energy-active .nv-energy-age:nth-child(4) {
          animation-delay: 1.9s;
        }

        .nv-energy-active .nv-energy-age:nth-child(5) {
          animation-delay: 2.15s;
        }

        /* ==============================
           KEYFRAMES
        ============================== */

        @keyframes nvEnergyDotIn {
          0% {
            opacity: 0;
            transform: translateY(-14px) scale(0.72);
          }

          65% {
            opacity: 1;
            transform: translateY(2px) scale(1.08);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes nvEnergyGlowIn {
          0% {
            opacity: 0;
            transform: scale(0.6);
          }

          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes nvEnergyTopCopy {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes nvEnergyDraw {
          from {
            stroke-dashoffset: 1;
          }

          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes nvEnergyAreaSoft {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes nvEnergyAreaInner {
          from {
            opacity: 0;
          }

          to {
            opacity: 0.48;
          }
        }

        @keyframes nvEnergyAgeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ==============================
           REDUCED MOTION
        ============================== */

        @media (prefers-reduced-motion: reduce) {
          .nv-energy-start-dot,
          .nv-energy-dot-glow,
          .nv-energy-age,
          .nv-energy-top-copy {
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
          }

          .nv-energy-draw {
            stroke-dasharray: none !important;
            stroke-dashoffset: 0 !important;
            animation: none !important;
          }

          .nv-energy-area-soft {
            opacity: 1 !important;
            animation: none !important;
          }

          .nv-energy-area-inner {
            opacity: 0.48 !important;
            animation: none !important;
          }
        }
      `}</style>

      <div className="mx-auto grid max-w-[1180px] gap-9 px-5 md:px-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:items-center lg:gap-14">
        {/* =====================================================
            LEFT CONTENT
        ====================================================== */}

        <Reveal as="div">
          {/* UPDATED TITLE */}
          <h2 className="nv-weight-keep font-display text-[clamp(1.8rem,4.8vw,2.8rem)] font-extrabold leading-[1.08]">
            <span
              style={{
                color: TITLE_LIGHT,
              }}
            >
              NAD+ levels tend to
            </span>

            <span
              className="block"
              style={{
                color: TITLE_DARK,
              }}
            >
              decline with age
              {/* The droplet trails the last word in the update, rather than
                  splitting the two lines as it did before. */}
              <img
                src="/site/anti-aging/ways-droplet.avif"
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="nv-float ml-3 inline-block h-[0.9em] w-auto translate-y-[0.04em] align-middle"
              />
            </span>
          </h2>

          {/* The supporting paragraph under this headline was removed on
              2026-09-08 with the compliance pass: the graph is educational
              population data and carries no claim of its own. */}
        </Reveal>

        {/* =====================================================
            RIGHT GRAPH CARD
        ====================================================== */}

        <Reveal as="div" delay={0.08}>
          <div
            ref={graphRef}
            className={`border p-5 sm:p-7 md:p-8 ${CARD_R} ${
              graphActive ? "nv-energy-active" : ""
            }`}
            style={{
              background: CARD,
              borderColor: LINE,
              boxShadow: "0 18px 45px rgba(130, 100, 48, 0.055)",
            }}
          >
            {/* The update titles the card and moves its caption to the left,
                where the old copy sat right-aligned and italic. */}
            <div className="nv-energy-top-copy">
              <h3
                className="nv-weight-keep font-display text-[clamp(1rem,2.4vw,1.35rem)] font-extrabold leading-tight"
                style={{ color: INK }}
              >
                NAD+ levels by age
              </h3>
            </div>

            {/* GRAPH. The y-axis label sits beside the plot rather than over
                it, so the curve keeps its full width. */}
            <div className="relative mt-3 flex items-stretch gap-2 sm:gap-3">
              <span
                className="shrink-0 self-center whitespace-nowrap text-[clamp(0.6rem,1.3vw,0.72rem)] font-semibold [writing-mode:vertical-rl] rotate-180"
                style={{ color: MUTED }}
              >
                Relative NAD+ Level
              </span>

              <svg
                viewBox="0 0 458 198"
                aria-hidden="true"
                className="block h-auto min-w-0 flex-1 overflow-visible"
              >
                <defs>
                  {/* GOLD LINE */}
                  <linearGradient
                    id="nv-energy-line"
                    x1="58"
                    y1="8"
                    x2="438"
                    y2="181"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor="#c3973b" />
                    <stop offset="42%" stopColor="#b98730" />
                    <stop offset="72%" stopColor="#bc8e39" />
                    <stop offset="100%" stopColor="#c39e50" />
                  </linearGradient>

                  {/* GOLD HAZE */}
                  <linearGradient
                    id="nv-energy-area"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="198"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop
                      offset="0%"
                      stopColor="#c99e4f"
                      stopOpacity="0.68"
                    />

                    <stop
                      offset="12%"
                      stopColor="#cea85d"
                      stopOpacity="0.62"
                    />

                    <stop
                      offset="25%"
                      stopColor="#d3b16d"
                      stopOpacity="0.54"
                    />

                    <stop
                      offset="40%"
                      stopColor="#d9bd82"
                      stopOpacity="0.44"
                    />

                    <stop
                      offset="55%"
                      stopColor="#dfc99a"
                      stopOpacity="0.34"
                    />

                    <stop
                      offset="68%"
                      stopColor="#e4d2ae"
                      stopOpacity="0.25"
                    />

                    <stop
                      offset="80%"
                      stopColor="#eadcc3"
                      stopOpacity="0.17"
                    />

                    <stop
                      offset="90%"
                      stopColor="#f0e6d4"
                      stopOpacity="0.09"
                    />

                    <stop
                      offset="100%"
                      stopColor="#f8f2e8"
                      stopOpacity="0.015"
                    />
                  </linearGradient>

                  {/* LEFT FADE */}
                  <linearGradient
                    id="nv-energy-left-fade"
                    x1="-45"
                    y1="0"
                    x2="74"
                    y2="0"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor="black" />
                    <stop offset="28%" stopColor="black" />
                    <stop offset="68%" stopColor="white" />
                    <stop offset="100%" stopColor="white" />
                  </linearGradient>

                  <mask id="nv-energy-area-mask">
                    <rect
                      x="-80"
                      y="-40"
                      width="600"
                      height="300"
                      fill="url(#nv-energy-left-fade)"
                    />
                  </mask>

                  {/* AREA BLUR */}
                  <filter
                    id="nv-energy-area-blur"
                    x="-30%"
                    y="-30%"
                    width="170%"
                    height="180%"
                  >
                    <feGaussianBlur stdDeviation="5.2" />
                  </filter>

                  {/* STARTING DOT GLOW */}
                  <radialGradient
                    id="nv-energy-head-glow"
                    cx="50%"
                    cy="50%"
                    r="50%"
                  >
                    <stop
                      offset="0%"
                      stopColor="#bd8f35"
                      stopOpacity="0.6"
                    />

                    <stop
                      offset="22%"
                      stopColor="#c99f4c"
                      stopOpacity="0.43"
                    />

                    <stop
                      offset="48%"
                      stopColor="#d6b874"
                      stopOpacity="0.27"
                    />

                    <stop
                      offset="72%"
                      stopColor="#e3cfaa"
                      stopOpacity="0.13"
                    />

                    <stop
                      offset="100%"
                      stopColor="#fdfbf7"
                      stopOpacity="0"
                    />
                  </radialGradient>

                  {/* CURVE BLUR */}
                  <filter
                    id="nv-energy-curve-blur"
                    x="-30%"
                    y="-50%"
                    width="170%"
                    height="220%"
                  >
                    <feGaussianBlur stdDeviation="6" />
                  </filter>
                </defs>

                {/* GOLD SHADE */}
                <path
                  d={CURVE_AREA}
                  fill="url(#nv-energy-area)"
                  mask="url(#nv-energy-area-mask)"
                  filter="url(#nv-energy-area-blur)"
                  className="nv-energy-area-soft"
                />

                {/* SECOND GOLD LAYER */}
                <path
                  d={CURVE_AREA}
                  fill="url(#nv-energy-area)"
                  mask="url(#nv-energy-area-mask)"
                  className="nv-energy-area-inner"
                />

                {/* CURVE SHADOW */}
                <path
                  d={CURVE}
                  pathLength="1"
                  fill="none"
                  stroke="#c39a4c"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.17"
                  transform="translate(0 3)"
                  filter="url(#nv-energy-curve-blur)"
                  vectorEffect="non-scaling-stroke"
                  className="nv-energy-draw nv-energy-line-shadow"
                />

                {/* SMALL GOLD HALO */}
                <path
                  d={CURVE}
                  pathLength="1"
                  fill="none"
                  stroke="#d0aa60"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.16"
                  transform="translate(0 1.5)"
                  vectorEffect="non-scaling-stroke"
                  className="nv-energy-draw nv-energy-line-halo"
                />

                {/* MAIN CURVE */}
                <path
                  d={CURVE}
                  pathLength="1"
                  fill="none"
                  stroke="url(#nv-energy-line)"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  className="nv-energy-draw nv-energy-main-line"
                />

                {/* DOT GLOW */}
                <circle
                  cx={HEAD.x}
                  cy={HEAD.y}
                  r="30"
                  fill="url(#nv-energy-head-glow)"
                  className="nv-energy-dot-glow"
                />

                {/* STARTING DOT */}
                <circle
                  cx={HEAD.x}
                  cy={HEAD.y}
                  r="7"
                  fill={GOLD_DOT}
                  stroke="#e3c77f"
                  strokeWidth="1"
                  className="nv-energy-start-dot"
                />
              </svg>
            </div>

            {/* AGE LABELS */}
            <ul className="mt-3 grid grid-cols-5 gap-1 text-center sm:gap-3">
              {AGES.map((item) => (
                <li
                  key={item.age}
                  className="nv-energy-age min-w-0"
                >
                  <span
                    aria-hidden="true"
                    className="mx-auto mb-3 block h-[5px] w-[5px] rounded-full"
                    style={{
                      background: "#c5a052",
                    }}
                  />

                  <span
                    className="block font-display text-[clamp(0.95rem,2.6vw,1.25rem)] font-extrabold leading-none"
                    style={{
                      color: INK,
                    }}
                  >
                    {item.age}
                  </span>

                </li>
              ))}
            </ul>

            {/* Closing note from the update, under a hairline. */}
            <span
              aria-hidden="true"
              className="mt-6 block h-px w-full"
              style={{ background: LINE }}
            />
            <p
              className="mt-4 text-[clamp(0.66rem,1.4vw,0.78rem)] italic leading-snug"
              style={{ color: MUTED }}
            >
              Illustrative trend. Individual NAD+ levels vary. Educational information only, not an
              expected treatment result.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}