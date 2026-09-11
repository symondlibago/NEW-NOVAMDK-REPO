import React from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import Reveal from "../ui/Reveal";
import useRunOnceInView from "../../lib/useRunOnceInView";

/* Same dwell as the Semaglutide rail and the PT-141 features, so every
   cycling highlight on the site reads as one system. */
const HOLD_MS = 3000;

const INK = "#745922";
const BODY = "#7a6d58";
const CREAM = "#f8e8c5";
const CREAM_SOFT = "rgba(248,232,197,0.82)";
const CREAM_RULE = "rgba(248,232,197,0.45)";
const BRASS = "radial-gradient(circle at 50% 50%, #c1a27a, #9a7843)";
const BRASS_FLAT = "#ad8a55";
const PALE = "#f3e5ca";
/* The warm ground the comp's closing band sits on. */
const SAND = "#f2e9d7";
const CARD_R = "rounded-[calc(26px*var(--nv-r-scale,1))]";
const TITLE = "nv-weight-keep font-display font-extrabold leading-[1.08]";
const TITLE_SIZE = "text-[clamp(1.8rem,4vw,2.9rem)]";
const SECTION_X = "px-3 sm:px-5 md:px-6";
const EASE = [0.2, 0.7, 0.3, 1];

const VIAL = "/site/weight-loss/lipo-c-vial-tall.avif";

/* Two panels of two actives each, positioned as the comp places them either
   side of the vial. */
const PANELS = [
  {
    key: "transport",
    pos: "left-[14%] top-[14.5%] w-[26%]",
    items: [
      ["Choline", "Plays a role in how the body transports and processes fats"],
      ["Dexpanthenol", "A form related to vitamin B5, a nutrient involved in energy metabolism"],
    ],
  },
  {
    key: "energy",
    pos: "left-[58%] top-0 w-[26%]",
    items: [
      ["Methionine", "An amino acid involved in normal metabolic processes"],
      ["L-Carnitine", "Helps transport fatty acids so they can be used in energy production"],
    ],
  },
];

const PLAN = [
  ["Your health", "Reviewed before treatment"],
  ["Your goals", "Considered as part of your treatment plan"],
  ["Your care", "Guided by a licensed provider"],
];
/* The rule draws across in RAIL_S seconds and each stop's dot lights as the
   line reaches it, exactly as on the Semaglutide mechanism rail. */
const RAIL_S = 1.6;

function ActivePanel({ items, className = "" }) {
  return (
    <div
      className={`rounded-[calc(18px*var(--nv-r-scale,1))] px-5 py-5 sm:px-6 sm:py-6 ${className}`}
      style={{ background: "rgba(248,232,197,0.18)" }}
    >
      {items.map(([name, body], i) => (
        <div
          key={name}
          className={i > 0 ? "mt-4 border-t pt-4 sm:mt-5 sm:pt-5" : ""}
          style={i > 0 ? { borderColor: CREAM_RULE } : undefined}
        >
          <h3
            className="font-display text-[0.82rem] font-bold uppercase tracking-[0.04em]"
            style={{ color: CREAM }}
          >
            {name}
          </h3>
          <p className="mt-2 text-[0.84rem] leading-[1.42]" style={{ color: CREAM_SOFT }}>
            {body}
          </p>
        </div>
      ))}
    </div>
  );
}

/* An L: the riser sits under the panel's own end and the run heads toward the
   vial, so the border pair flips with the side the panel is on. */
function Elbow({ side, className = "", delay = 0 }) {
  const rule = "1px solid rgba(255,255,255,0.24)";
  return (
    <Motion.span
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
      style={{
        borderBottom: rule,
        ...(side === "left" ? { borderLeft: rule } : { borderRight: rule }),
      }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-80px 0px -80px 0px" }}
      transition={{ duration: 0.5, ease: EASE, delay }}
    />
  );
}

function ActivesStage() {
  return (
    <>
      {/* Below lg the panels have nowhere to sit beside the vial, so it leads
          and they follow in flow. */}
      <div className="mt-8 lg:hidden">
        <Reveal className="flex justify-center">
          <img
            src={VIAL}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="nv-drift h-64 w-auto drop-shadow-2xl sm:h-80"
          />
        </Reveal>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {PANELS.map((panel, i) => (
            <Reveal key={panel.key} delay={0.08 + i * 0.1} y={14}>
              <ActivePanel items={panel.items} className="h-full" />
            </Reveal>
          ))}
        </div>
      </div>

      <div className="relative mt-4 hidden h-100 lg:block xl:h-112">
        <span className="absolute left-[49.6%] top-0 h-[98%] -translate-x-1/2">
          <img
            src={VIAL}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="nv-drift h-full w-auto drop-shadow-2xl"
          />
        </span>
        <Elbow side="left" className="left-[26%] top-[68%] h-[7.5%] w-[16.5%]" delay={0.46} />
        <Elbow side="right" className="right-[27%] top-[51%] h-[10%] w-[16.5%]" delay={0.58} />
        {PANELS.map((panel, i) => (
          <Reveal key={panel.key} delay={0.14 + i * 0.12} y={14} className={`absolute z-10 ${panel.pos}`}>
            <ActivePanel items={panel.items} />
          </Reveal>
        ))}
      </div>
    </>
  );
}

function MetabolicFunction({ startTo }) {
  return (
    <div className={`mx-auto max-w-[1180px] py-9 sm:py-12 lg:py-16 ${SECTION_X}`}>
      <div className="grid gap-5 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.85fr)] md:gap-12">
        <Reveal as="div">
          <h2 className={`${TITLE} ${TITLE_SIZE} max-w-[16ch]`} style={{ color: CREAM }}>
            Built Around
            <span className="block">Metabolic Function</span>
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
          Lipo-C combines ingredients involved in fat metabolism, nutrient processing, and cellular
          energy
        </Reveal>
      </div>

      <ActivesStage />
    </div>
  );
}

/* The Semaglutide timeline rail, verbatim: the same nv-rail keyframes, the same
   1.6s draw with each dot lighting as the line reaches it, and the same 3s
   dwell. Each dot sits at its own column's left edge, directly above the label,
   and dimming is done by colour because the entry animation owns opacity. */
function PlanRail() {
  const [ref, running] = useRunOnceInView();
  const [active, setActive] = React.useState(0);
  const n = PLAN.length;

  React.useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => setActive((v) => (v + 1) % n), HOLD_MS);
    return () => clearInterval(t);
  }, [running, n]);

  return (
    <div ref={ref} className={`nv-rail relative mt-8 sm:mt-10 ${running ? "is-in" : ""}`}>
      <span
        aria-hidden="true"
        className="nv-rail__line absolute left-0 top-1.5 hidden h-px w-full bg-white/25 md:block"
      />
      <ol className="grid gap-x-8 gap-y-7 md:grid-cols-3">
        {PLAN.map(([label, body], i) => {
          const on = i === active;
          return (
            <li key={label} className="relative md:pt-9">
              {/* Two spans: the entry keyframes end on `transform: none` with a
                  `both` fill, so a scale on the outer one would be wiped the
                  moment the dot has arrived. */}
              <span
                aria-hidden="true"
                className="nv-rail__dot absolute left-0 top-0 hidden h-3 w-3 md:block"
                style={{ animationDelay: `${(i / n) * RAIL_S}s` }}
              >
                <span
                  className="block h-full w-full rounded-full bg-[#ffe8b1] transition-all duration-500 ease-out"
                  style={{
                    transform: on ? "scale(1.4)" : "scale(1)",
                    boxShadow: on ? "0 0 20px 7px rgba(255,232,177,0.4)" : "none",
                  }}
                />
              </span>
              <span
                className="nv-rail__item block"
                style={{ animationDelay: `${(i / n) * RAIL_S + 0.12}s` }}
              >
                <span
                  className="block font-display text-[0.86rem] font-bold uppercase tracking-[0.04em] transition-colors duration-500 sm:text-[0.92rem]"
                  style={{ color: on ? "#fff6dd" : "rgba(255,232,177,0.55)" }}
                >
                  {label}
                </span>
                <span
                  className="mt-2 block max-w-[30ch] text-[0.92rem] leading-[1.45] transition-colors duration-500 sm:text-[0.98rem]"
                  style={{ color: on ? "rgba(255,232,177,0.95)" : "rgba(255,232,177,0.55)" }}
                >
                  {body}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ComplementPlan() {
  return (
    <div className={`mx-auto max-w-[1180px] pb-9 sm:pb-12 lg:pb-16 ${SECTION_X}`}>
      <Reveal as="h2" className={`${TITLE} ${TITLE_SIZE} max-w-[16ch]`} style={{ color: CREAM }}>
        Built To Complement
        <span className="block">Your Plan</span>
      </Reveal>

      <PlanRail />

      <p
        className="mt-9 max-w-[62ch] text-[0.72rem] italic leading-[1.55] sm:mt-12"
        style={{ color: "rgba(248,232,197,0.72)" }}
      >
        Lipo-C is not meant to replace nutrition, movement, or the rest of your care. Your provider
        considers your health history and goals to determine where it may fit into your overall
        weight-management plan
      </p>
    </div>
  );
}

function MetabolicRole({ startTo }) {
  return (
    <section style={{ background: SAND }}>
      <div className={`mx-auto max-w-[1180px] py-11 sm:py-14 lg:py-20 ${SECTION_X}`}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
          <Reveal as="div">
            <h2
              className={`${TITLE} max-w-[22ch] text-[clamp(1.8rem,3.7vw,2.7rem)]`}
              style={{ color: INK }}
            >
              A formula with a specific metabolic role
            </h2>
            <p
              className="mt-5 max-w-[46ch] text-[clamp(1rem,1.2vw,1.12rem)] leading-[1.5]"
              style={{ color: BODY }}
            >
              Lipo-C brings together choline, methionine, L-carnitine, and dexpanthenol, nutrients
              involved in how the body processes fat and turns it into usable energy
            </p>
            <Link
              to={startTo}
              className="mt-7 inline-flex rounded-full px-10 py-3.5 text-[0.92rem] font-semibold transition-transform duration-300 hover:-translate-y-0.5"
              style={{ background: BRASS_FLAT, color: "#fff8e9" }}
            >
              Get Started
            </Link>
          </Reveal>
          <Reveal as="div" delay={0.1} className={`overflow-hidden ${CARD_R}`}>
            <img
              src="/site/weight-loss/lipo-c-woman.avif"
              alt="Woman standing in warm daylight"
              loading="lazy"
              className="aspect-[5/4] w-full object-cover object-[42%_center] lg:aspect-square"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export default function LipoCSections({ startTo = "/start" }) {
  return (
    <section style={{ background: "#faf8f4" }}>
      {/* One continuous brass field, the way the comp runs the two blocks. */}
      <div className="overflow-hidden" style={{ background: BRASS }}>
        <MetabolicFunction startTo={startTo} />
        <ComplementPlan />
      </div>
      <MetabolicRole startTo={startTo} />
    </section>
  );
}
