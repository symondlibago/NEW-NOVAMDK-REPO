import React from "react";
import Reveal from "../ui/Reveal";
import useRunOnceInView from "../../lib/useRunOnceInView";
import { CoenzymeBand } from "./NadDirected";

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

/* The plot, in viewBox units. The axes are drawn on these bounds and every
   point below is placed inside them, so the curve, its dots and the age labels
   can never drift apart the way they did while the labels lived in a separate
   grid under the SVG. */
/* The band, straight off the Canva artboard: a circular gradient c1a27a to
   9a7843, with the whole figure drawn in cream on top of it. */
const BAND = "radial-gradient(circle at 50% 50%, #c1a27a 0%, #9a7843 100%)";
const CREAM = "#f7ebd2";
const CREAM_SOFT = "rgba(247,235,210,0.86)";
const AXIS_LINE = "rgba(247,235,210,0.45)";
const DOT = "#f4e6c6";

const PLOT = { left: 44, right: 502, top: 14, bottom: 186 };
const LABEL_Y = 212;

/* Read off the Canva artboard (2026-09-19). The five ages sit at even steps
   from 4.3% to 95.6% of the plot width, and their levels are the comp's own:
   a steep fall from 30 to 50 that flattens toward 70+, not the wave the old
   path drew. y is measured down from the top of the plot. */
const POINTS = [
  { age: "30", x: 63.7, y: 50.8 },
  { age: "40", x: 168.1, y: 91.4 },
  { age: "50", x: 272.6, y: 118.4 },
  { age: "60", x: 377.4, y: 132 },
  { age: "70+", x: 481.8, y: 139.4 },
];

/* Catmull-Rom through those five points, converted to cubics, so the line is
   smooth and passes exactly through every dot. */
const SEGMENTS = `
  C 81.1 57.6, 133.3 80.1, 168.1 91.4
  C 202.9 102.7, 237.7 111.6, 272.6 118.4
  C 307.5 125.2, 342.5 128.5, 377.4 132
  C 412.3 135.5, 464.4 138.2, 481.8 139.4
`;

const CURVE = `M 63.7 50.8 ${SEGMENTS}`;

/* Closed against the axes, as the comp shades it: square to the y-axis on the
   left and down to the x-axis at both ends. */
const CURVE_AREA = `
  M ${PLOT.left} ${PLOT.bottom}
  L ${PLOT.left} 50.8
  L 63.7 50.8
  ${SEGMENTS}
  L 481.8 ${PLOT.bottom}
  Z
`;

const HEAD = POINTS[0];

export default function NadSupport({ withCoenzyme = false }) {
  /* The shared hook rather than an observer of its own (2026-09-19): this one
     asked for 30% of the band to be on screen, and the band is now the graph
     itself, full bleed. On a phone it is taller than the viewport, so 30% of it
     can never be visible at once and the graph simply never drew. */
  const [graphRef, graphActive] = useRunOnceInView("-80px");

  return (
    <section
      className="w-full"
      style={{
        background: BAND,
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
           PHONE
        ==============================
           The SVG scales to the column, so its type scales down with it: at
           390px the ages came out around 9px. These sizes are in user units,
           which the viewBox scales, so they land near 16px on a phone. */

        @media (max-width: 640px) {
          .nv-energy-age {
            font-size: 26px;
          }

          .nv-energy-top-copy {
            font-size: 21px;
          }
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

      {/* The section IS the graph now (2026-09-19): the comp gives the whole
          band to it, headed by the eyebrow and one centred headline, with the
          card, its split layout and the droplet all gone. */}
      <div className="mx-auto max-w-[1320px] px-5 py-[clamp(2.5rem,6vw,4.5rem)] md:px-10">
        <Reveal as="div" className="text-center">
          <span
            className="block text-[clamp(0.66rem,1.5vw,0.78rem)] font-bold uppercase tracking-[0.24em]"
            style={{ color: CREAM_SOFT }}
          >
            Why NAD+
          </span>

          <h2
            className="nv-weight-keep mt-4 font-display text-[clamp(1.6rem,4.4vw,3rem)] font-extrabold leading-[1.12]"
            style={{ color: CREAM }}
          >
            NAD+ Levels Tend to Decline With Age
          </h2>
        </Reveal>

        <Reveal as="div" delay={0.08}>
          <div
            ref={graphRef}
            className={`mt-[clamp(1.5rem,3.5vw,2.5rem)] ${
              graphActive ? "nv-energy-active" : ""
            }`}
          >
            <div className="relative">
              {/* aria-hidden no longer: the ages are inside the SVG now, so it
                  carries the figure's own reading of the trend. The axis label
                  came inside with them — beside the SVG it centred on the whole
                  box, which sat it low against the plot it names. */}
              <svg
                viewBox="0 0 520 224"
                role="img"
                aria-label="Relative NAD+ level by age: highest at 30, falling steeply to 50, then levelling off through 70 and over."
                className="block h-auto w-full overflow-visible"
              >
                <defs>
                  {/* THE LINE. Cream on the brass rather than gold on cream. */}
                  <linearGradient
                    id="nv-energy-line"
                    x1="64"
                    y1="51"
                    x2="482"
                    y2="140"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor="#fdf6e6" />
                    <stop offset="45%" stopColor="#f6e9cd" />
                    <stop offset="100%" stopColor="#eeddb6" />
                  </linearGradient>

                  {/* THE YELLOW SHADE UNDER THE CURVE. Warm cream falling to
                      nothing at the axis, so the light pools right beneath the
                      line and the brass reads through it lower down. The old
                      stops were golds, mixed for a cream card, and vanished
                      against the band. */}
                  <linearGradient
                    id="nv-energy-area"
                    x1="0"
                    y1="14"
                    x2="0"
                    y2="186"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop
                      offset="0%"
                      stopColor="#fff3d4"
                      stopOpacity="0.52"
                    />

                    <stop
                      offset="35%"
                      stopColor="#ffeecb"
                      stopOpacity="0.34"
                    />

                    <stop
                      offset="70%"
                      stopColor="#ffeac2"
                      stopOpacity="0.16"
                    />

                    <stop
                      offset="100%"
                      stopColor="#ffe8bd"
                      stopOpacity="0.04"
                    />
                  </linearGradient>

                  {/* The shading is clipped to the plot rather than faded out
                      on the left: the comp squares it against the y-axis, and
                      the old fade only existed because the curve used to run
                      off the left edge of the card. */}
                  <clipPath id="nv-energy-plot">
                    <rect x="44" y="0" width="458" height="186" />
                  </clipPath>

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
                      stopColor="#fff4d6"
                      stopOpacity="0.5"
                    />

                    <stop
                      offset="30%"
                      stopColor="#fff0cb"
                      stopOpacity="0.3"
                    />

                    <stop
                      offset="62%"
                      stopColor="#ffecc2"
                      stopOpacity="0.14"
                    />

                    <stop
                      offset="100%"
                      stopColor="#ffe9bb"
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
                  clipPath="url(#nv-energy-plot)"
                  filter="url(#nv-energy-area-blur)"
                  className="nv-energy-area-soft"
                />

                {/* SECOND GOLD LAYER */}
                <path
                  d={CURVE_AREA}
                  fill="url(#nv-energy-area)"
                  clipPath="url(#nv-energy-plot)"
                  className="nv-energy-area-inner"
                />

                {/* AXES. The comp draws a plain L: one rule down the left and
                    one along the foot. Over the shading rather than under it,
                    so both stay crisp where the fill is densest. */}
                <path
                  d={`M ${PLOT.left} ${PLOT.top} L ${PLOT.left} ${PLOT.bottom} L ${PLOT.right} ${PLOT.bottom}`}
                  fill="none"
                  stroke={AXIS_LINE}
                  strokeWidth="1.4"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />

                {/* Axis label, rotated up the left of the plot as the comp has
                    it, centred on the plot's own height. The rotation lives on
                    a wrapper because the fade-in class animates `transform`,
                    and a CSS transform beats the attribute: on the text itself
                    the label landed flat across the plot. */}
                <g transform="rotate(-90 20 100)">
                  <text
                    x="20"
                    y="100"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="nv-energy-top-copy"
                    fill={CREAM_SOFT}
                    fontSize="14"
                    fontWeight="700"
                  >
                    Relative NAD+ Level
                  </text>
                </g>

                {/* CURVE SHADOW. Stroke widths are in viewBox units now: with
                    non-scaling-stroke the browser resolves them in screen units
                    and pathLength="1" no longer normalises the dash, which
                    leaves the draw stopping short of the last point. */}
                <path
                  d={CURVE}
                  pathLength="1"
                  fill="none"
                  stroke="#fff0c9"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.17"
                  transform="translate(0 3)"
                  filter="url(#nv-energy-curve-blur)"
                  className="nv-energy-draw nv-energy-line-shadow"
                />

                {/* SMALL GOLD HALO */}
                <path
                  d={CURVE}
                  pathLength="1"
                  fill="none"
                  stroke="#fff4d8"
                  strokeWidth="4.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.16"
                  transform="translate(0 1.5)"
                  className="nv-energy-draw nv-energy-line-halo"
                />

                {/* MAIN CURVE */}
                <path
                  d={CURVE}
                  pathLength="1"
                  fill="none"
                  stroke="url(#nv-energy-line)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="nv-energy-draw nv-energy-main-line"
                />

                {/* DOT GLOW, on the first point only. */}
                <circle
                  cx={HEAD.x}
                  cy={HEAD.y}
                  r="26"
                  fill="url(#nv-energy-head-glow)"
                  className="nv-energy-dot-glow"
                />

                {/* A dot per age, as the comp marks them, each landing as the
                    line reaches it rather than all five at once. */}
                {POINTS.map((p, i) => (
                  <circle
                    key={p.age}
                    cx={p.x}
                    cy={p.y}
                    r="5.5"
                    fill={DOT}
                    stroke="rgba(255,255,255,0.55)"
                    strokeWidth="1.2"
                    className="nv-energy-start-dot"
                    style={{ animationDelay: `${(0.2 + i * 0.54).toFixed(2)}s` }}
                  />
                ))}

                {/* The ages ride inside the plot so each one sits exactly under
                    its dot. As a grid below the SVG they were evenly spaced
                    across the card instead, which put every label off its
                    point. */}
                {POINTS.map((p, i) => (
                  <text
                    key={`${p.age}-label`}
                    x={p.x}
                    y={LABEL_Y}
                    textAnchor="middle"
                    className="nv-energy-age font-display"
                    fill={CREAM}
                    fontSize="14"
                    fontWeight="800"
                    style={{ animationDelay: `${(0.55 + i * 0.54).toFixed(2)}s` }}
                  >
                    {p.age}
                  </text>
                ))}
              </svg>
            </div>

            {/* The age row that used to live here is inside the SVG now, under
                its own dots. */}
            {/* Both lines as the comp sets them, centred under the plot. The
                qualifier stays in full: the curve is drawn to the shape of the
                published trend, not digitised from the paper's figures. */}
            <p
              className="mt-4 text-center text-[clamp(0.68rem,1.4vw,0.8rem)] leading-snug"
              style={{ color: CREAM_SOFT }}
            >
              Source: Massudi et al., PLOS ONE (2012)
            </p>
            <p
              className="mx-auto mt-1.5 max-w-[72ch] text-center text-[clamp(0.64rem,1.3vw,0.74rem)] leading-snug"
              style={{ color: "rgba(247,235,210,0.7)" }}
            >
              Educational illustration. Individual levels vary. This study did not evaluate NovaMDK
              treatment or establish treatment outcomes.
            </p>
          </div>
        </Reveal>
      </div>

      {/* The coenzyme diagram belongs to the same panel in the comp, so it is
          rendered inside this section rather than as a band of its own
          (2026-09-25): one box, one gradient, and no seam to match up. */}
      {withCoenzyme && <CoenzymeBand />}
    </section>
  );
}