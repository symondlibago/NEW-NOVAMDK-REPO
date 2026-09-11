import React from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, Search, Send } from "lucide-react";
import Reveal from "../ui/Reveal";

/**
 * "Care In Three Simple Steps" — the how-it-works band (2026-09-11).
 *
 * Replaces the three photo tiles this section used to be. One wide glass panel
 * over a single full-bleed photo, split into three columns by hairline rules.
 */

/*
|--------------------------------------------------------------------------
| GLASS
|--------------------------------------------------------------------------
| Off the Figma layers:
|
|   Panel   fill CAB08D 20%, radius 17, no stroke, effect: glass
|   Button  fill BC9461 0% (nothing), stroke FFFFFF 69%, radius 100,
|           glass: light -45 / 80%, refraction 80, depth 20,
|           dispersion 50, frost 4, splay 0
|
| Frost 4 is almost no blur, which is why the figure stays legible through the
| panel rather than dissolving behind it. The blur here is deliberately much
| lighter than the dashboard band's, where the frost was 54.
*/
const PANEL = {
  background: "rgba(202,176,141,0.20)",
  backdropFilter: "blur(7px)",
  WebkitBackdropFilter: "blur(7px)",
  boxShadow:
    "inset 0 1.5px 3px rgba(255,255,255,0.34), inset 0 -1.5px 3px rgba(0,0,0,0.10)",
};

/* The panel carries no stroke of its own: the edge in the comp is the glass
   effect's refraction. This is that edge, brightest where the light falls. */
const RIM = {
  padding: "1px",
  background:
    "linear-gradient(145deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.20) 40%, rgba(255,255,255,0.14) 66%, rgba(255,255,255,0.46) 100%)",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  maskComposite: "exclude",
};

/* Fades out at both ends rather than butting into the panel's padding. */
const DIVIDER =
  "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.32) 22%, rgba(255,255,255,0.32) 78%, rgba(255,255,255,0) 100%)";

/* Titles break over two lines in the comp, so the breaks are explicit rather
   than left to the column width. */
const STEPS = [
  {
    icon: Search,
    top: "Explore",
    bottom: "Your Options",
    body: "Browse treatment options for your health goals",
  },
  {
    icon: ClipboardCheck,
    top: "Complete Your",
    bottom: "Assessment",
    body: "Answer a few questions and a licensed provider reviews your information to determine the right next step",
  },
  {
    icon: Send,
    top: "Delivered",
    bottom: "Discreetly",
    body: "Your prescribed treatment ships in discreet packaging, right to your door",
  },
];

function Step({ step, index }) {
  return (
    <div
      className={`relative flex flex-col ${index > 0 ? "sm:pl-8 lg:pl-12" : ""} ${
        index < STEPS.length - 1 ? "sm:pr-8 lg:pr-12" : ""
      }`}
    >
      {index > 0 && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 hidden w-px sm:block"
          style={{ background: DIVIDER }}
        />
      )}

      <step.icon
        size={58}
        strokeWidth={1.5}
        aria-hidden="true"
        className="shrink-0 text-white"
      />

      <h3 className="mt-10 font-display text-[clamp(1.35rem,2vw,1.85rem)] font-extrabold leading-[1.15] text-white">
        {step.top}
        <br />
        {step.bottom}
      </h3>

      <p className="mt-3.5 max-w-[28ch] text-[clamp(0.9rem,1.1vw,1rem)] leading-relaxed text-white/85">
        {step.body}
      </p>

      {/* mt-auto, so all three buttons sit on one line however many lines the
          copy above them runs to. */}
      {/* Same glass as the panel it sits in, just at pill radius. The hover
          tint rides on its own layer because PANEL sets an inline background,
          which a utility class cannot override. */}
      <Link
        to="/start"
        className="group relative mt-8 inline-flex h-10 w-43 items-center justify-center rounded-full text-[1.05rem] text-white/70 transition-colors duration-300 hover:text-white sm:mt-auto"
        style={PANEL}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full transition-colors duration-300 group-hover:bg-white/15"
        />
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full" style={RIM} />
        <span className="relative">Get Started</span>
      </Link>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section id="how" className="relative isolate w-full scroll-mt-24 overflow-hidden">
      <img
        src="/site/steps-hero.avif"
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 -z-10 h-full w-full object-cover object-[50%_32%]"
      />

      <div className="relative mx-auto max-w-330 px-5 py-[clamp(3rem,7vw,5.25rem)] md:px-10">
        <Reveal className="text-center">
          <span className="text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-white/85">
            How it works
          </span>
          <h2 className="nv-weight-keep mt-4 font-display text-[clamp(2rem,4.4vw,3.6rem)] font-extrabold leading-[1.08] tracking-tight text-white">
            <span className="block">Care In Three</span>
            <span className="block">Simple Steps</span>
          </h2>
        </Reveal>

        <Reveal delay={0.08}>
          <div
            className="relative mx-auto mt-[clamp(2rem,4vw,4.25rem)] w-full max-w-302 rounded-2xl p-7 sm:p-10 lg:p-16"
            style={PANEL}
          >
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl" style={RIM} />

            {/* min-h so the panel lands on the comp's 497: the copy alone only
                fills about 310 and the panel came out squat, with the buttons
                sitting too close under the text. */}
            <div className="relative grid gap-10 sm:min-h-92 sm:grid-cols-3 sm:gap-0">
              {STEPS.map((step, i) => (
                <Step key={step.top} step={step} index={i} />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
