import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "../ui/Reveal";
import GOAL_ART from "../../lib/goalArt";

/**
 * "What Are You Looking to Improve?" — the band under the hero (2026-09-11).
 *
 * Five frosted pills orbit the figure, one of them promoted to a larger, more
 * opaque state at the bottom. The rotation is the same mechanism the Sermorelin
 * GH-pathway section uses: the slots are fixed positions, the cards are handed
 * a new slot each tick, and CSS transitions carry each card between them. That
 * way nothing is animated per-card and the cycle can never drift out of order.
 */

const SLOT_MS = 5000;
const GLIDE = "900ms cubic-bezier(0.22,1,0.36,1)";

/* Read off the comp: two pills at mid height, two lower and wider apart, and
   the promoted one centred at the bottom. Percentages so the whole arrangement
   scales with the stage rather than needing a breakpoint of its own. */
/* A ring: five fixed stations around the figure, listed in the order the eye
   should travel. Every station is the SAME width and scale, so a pill only ever
   changes position and opacity as it advances. Letting width and scale differ
   per station was what made this look like five pills scattering rather than
   one ring turning — a pill resized mid-flight and landed somewhere it had
   never appeared to be heading. Width is set for "Recovery & Wellness", the
   longest label, so nothing truncates as it comes round. */
const RING_W = "23%";

const SLOTS = [
  { left: "25%", top: "34%", opacity: 0.62 },
  { left: "75%", top: "34%", opacity: 0.62 },
  { left: "82%", top: "62%", opacity: 0.78 },
  /* Front of the ring. Fully opaque so the eye always has one to read. */
  { left: "50%", top: "86%", opacity: 1 },
  { left: "18%", top: "62%", opacity: 0.78 },
];

/* Art comes from GOAL_ART, the same map the category cards and quiz use, so a
   re-export lands here too. `img` overrides it where the cut-out that map picks
   is not the one this capsule wants. */
const GOALS = [
  { label: "Skin Health", slug: "skin-health" },
  { label: "Longevity", slug: "longevity" },
  { label: "Sexual Wellness", slug: "sexual-health" },
  { label: "Weight Loss", slug: "weight-loss" },
  { label: "Recovery & Wellness", slug: "recovery-wellness", img: "/site/goals/sportsmed-hero.avif" },
].map((g) => ({
  ...g,
  to: `/treatments/${g.slug}`,
  img: g.img || GOAL_ART[g.slug].cutout,
  tint: GOAL_ART[g.slug].heroBg,
}));

/* The comp's fill: white at the top falling to tan, so the band hands off to
   whatever follows without a seam. */
const GROUND = "linear-gradient(180deg, #ffffff 0%, #f3ead9 38%, #c9a97c 74%, #a58453 100%)";

/* Flat 998152, straight off the comp's fill panel. It sets this heading as one
   solid gold, not the ink-to-tan ramp the rest of the site's headings use. */
const HEADING = "#998152";

/* Frosted rather than filled — the figure has to read through the glass, which
   is the whole effect the comp is after. Deliberately light: a heavier fill and
   a brighter rim made the pills read as solid tinted lozenges sitting on the
   picture instead of glass over it. */
const GLASS =
  "rounded-full border border-white/35 bg-white/22 backdrop-blur-md";

/* Per goal, because the cut-outs are not framed alike. Some are trimmed tight
   to the figure and some sit in a wide canvas, so a single size and inset lands
   them at visibly different scales and distances from the capsule edge. Skin
   Health and Recovery run further right; Sexual Wellness is a pair of small
   tablets in a large frame and needs the bigger box to register at all. */
const ART = {
  "skin-health": "ml-4 h-16 w-16 -mb-1.5",
  "longevity": "ml-1 h-16 w-16 -mb-1.5",
  "sexual-health": "ml-0.5 h-21 w-21 -mb-1.5",
  "weight-loss": "ml-1 h-16 w-16 -mb-1.5",
  "recovery-wellness": "ml-4 h-16 w-16 -mb-1.5",
};

function ViewAll() {
  return (
    <Link
      to="/treatments"
      className="group inline-flex items-center gap-3 text-[0.95rem] font-semibold text-[#4a3c22] transition-colors hover:text-[#2f2614]"
    >
      View All Treatments
      <span className="grid h-9 w-9 place-items-center rounded-full border border-[#4a3c22]/45 transition-all duration-300 group-hover:bg-[#4a3c22] group-hover:text-white">
        <ArrowRight size={15} />
      </span>
    </Link>
  );
}

function GoalPill({ goal, style, className = "" }) {
  return (
    <Link
      to={goal.to}
      className={`group flex items-center gap-3 py-1.5 pl-2 pr-5 transition-shadow duration-500 hover:border-white/60 ${GLASS} ${className}`}
      style={style}
    >
      {/* Inside the capsule, and no disc. Bounded on both axes: these files run
          from roughly square to very wide, so sizing by height alone gives each
          a different width and the wide ones escape the pill. object-contain
          lands them all at the same footprint whatever their ratio. */}
      <img
        src={goal.img}
        alt=""
        aria-hidden="true"
        loading="lazy"
        /* self-end with the padding pulled back, so the figure stands on the
           capsule's inner edge instead of floating with a gap beneath it.
           Inset and size come per goal: see ART. */
        className={`shrink-0 self-end object-contain object-bottom ${ART[goal.slug]}`}
      />
      <span className="min-w-0 truncate text-[0.92rem] font-semibold text-[#4a3c22]">
        {goal.label}
      </span>
    </Link>
  );
}

export default function ImproveGoals() {
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const t = setInterval(() => setStep((v) => v + 1), SLOT_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative w-full overflow-hidden" style={{ background: GROUND }}>
      <div className="mx-auto max-w-[1340px] px-5 pt-[clamp(1.75rem,3.5vw,2.75rem)] md:px-10">
        <Reveal>
          <h2
            className="nv-weight-keep font-display text-[clamp(1.9rem,4.4vw,3.1rem)] font-extrabold leading-[1.1] tracking-tight"
            style={{ color: HEADING }}
          >
            <span className="block">What Are You</span>
            <span className="block">Looking to Improve?</span>
          </h2>
        </Reveal>

        {/* ---- the stage. Pills sit in front of the cut-out so the glass has
                something to frost; below md they never overlap it at all.
                The ratio sets the figure's size, so it stays at 1440/720. The
                section was shortened by cutting the padding around this stage,
                not by squeezing the stage itself. ---- */}
        <div className="relative mt-2 hidden aspect-16/9 w-full md:block lg:aspect-1440/720">
          <img
            src="/site/improve-hero.avif"
            alt=""
            aria-hidden="true"
            className="absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2 object-contain object-bottom"
          />

          {GOALS.map((goal, i) => {
            const slot = SLOTS[(i + step) % SLOTS.length];
            return (
              <GoalPill
                key={goal.label}
                goal={goal}
                className="absolute z-10"
                style={{
                  left: slot.left,
                  top: slot.top,
                  width: RING_W,
                  opacity: slot.opacity,
                  transform: "translate(-50%, -50%)",
                  transition: `left ${GLIDE}, top ${GLIDE}, opacity 900ms ease`,
                }}
              />
            );
          })}

          {/* Inside the stage, bottom right, as the comp places it. In flow
              underneath it added a band of empty tan below the figure and was
              the whole reason the section ran long. */}
          <div className="absolute bottom-3 right-0 z-10">
            <ViewAll />
          </div>
        </div>

        {/* ---- the phone stack. No orbit to run: the figure gets the width and
                the five goals sit under it as a plain list. ---- */}
        <div className="mt-6 md:hidden">
          <img
            src="/site/improve-hero.avif"
            alt=""
            aria-hidden="true"
            className="mx-auto block h-64 w-auto object-contain"
          />
          <div className="mt-5 flex flex-col gap-2.5">
            {GOALS.map((goal) => (
              <GoalPill key={goal.label} goal={goal} />
            ))}
          </div>
        </div>

        {/* Phone only — from md this link lives inside the stage. */}
        <div className="flex justify-end pb-6 pt-4 md:hidden">
          <ViewAll />
        </div>
      </div>
    </section>
  );
}
