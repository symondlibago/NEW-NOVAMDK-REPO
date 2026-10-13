import React from "react";
import Reveal from "../ui/Reveal";
import BlurIn from "../ui/BlurIn";

/**
 * "Your Health Isn't One-Size-Fits-All", the first band under the hero
 * (client's comp, 2026-10-13). One screen on a desktop, the way Good Life Meds
 * gives each of its cards a screen of its own. It replaces the orbiting goals
 * band there, and the six goal tiles on a phone.
 *
 * The figure stands in a sand box with her head clear of its top edge, and two
 * glass chips float over the box's corners.
 */

/* Cream down from the hero's white. ModernCare picks up from this colour, so
   the two bands read as one panel, as they do in the comp. */
const GROUND = "linear-gradient(180deg, #ffffff 0%, #fbf5ec 45%, #f8eedf 100%)";
const BOX = "linear-gradient(180deg, #efe3cf 0%, #dcc7a3 100%)";
const GOLD = "#b08d57";

/* A woman in the audience's range, 35 to 60 (client, 2026-10-12). The comp's
   own photo was only in the screenshot, too small to use on a desktop. */
const FIGURE = "/site/goals/longevity.avif";

const CHIPS = [
  {
    label: "Everyday wellness",
    img: "/products/nad-plus.avif",
    fit: "object-contain p-1",
    at: "left-2 top-[18%] md:left-0 md:-translate-x-[18%]",
    delay: "0s",
  },
  {
    label: "Made for real life",
    img: "/products/journey/prescription.avif",
    fit: "object-cover",
    at: "right-2 bottom-[16%] md:right-0 md:translate-x-[14%]",
    delay: "1.4s",
  },
];

function Chip({ label, img, fit, at, delay }) {
  return (
    <div className={`absolute z-20 ${at}`}>
      <div
        className="nv-float flex items-center gap-3 rounded-2xl border border-white/70 bg-white/60 py-2.5 pl-2.5 pr-5 shadow-[0_18px_40px_-18px_rgba(90,70,30,0.45)] backdrop-blur-md"
        style={{ animationDelay: delay }}
      >
        <span className="block h-12 w-12 overflow-hidden rounded-xl bg-[#f6efe3] md:h-14 md:w-14">
          <img src={img} alt="" aria-hidden="true" loading="lazy" className={`h-full w-full ${fit}`} />
        </span>
        <span className="whitespace-nowrap text-[0.9rem] font-medium text-ink md:text-[0.98rem]">{label}</span>
      </div>
    </div>
  );
}

function Figure() {
  return (
    <div className="relative mx-auto w-full max-w-[34rem] pt-[12%]">
      <div className="relative aspect-[5/5.2] w-full">
        <div className="absolute inset-0 rounded-[28px]" style={{ background: BOX }} />
        {/* Clipped to the box at the sides and bottom only, so the head stands
            clear of the top edge. */}
        <div
          className="absolute inset-x-0 bottom-0 top-[-14%]"
          style={{ clipPath: "inset(0 0 0 0 round 0 0 28px 28px)" }}
        >
          <img
            src={FIGURE}
            alt="A woman in a sports top"
            loading="lazy"
            /* As wide as the box, so the photo's own cut edges fall outside
               it rather than showing as a hard line down an arm. */
            className="h-full w-full object-cover object-top"
          />
        </div>
        {CHIPS.map((c) => (
          <Chip key={c.label} {...c} />
        ))}
      </div>
    </div>
  );
}

export default function HealthFit() {
  return (
    <section
      className="flex items-center overflow-hidden md:min-h-[calc(100svh-69px)]"
      style={{ background: GROUND }}
    >
      <div className="mx-auto grid w-full max-w-[1340px] items-center gap-10 px-5 py-14 md:px-10 lg:grid-cols-2 lg:gap-16 lg:py-20">
        <Reveal as="div" className="order-2 px-4 lg:order-1 lg:px-6">
          <Figure />
        </Reveal>

        <div className="order-1 lg:order-2">
          <Reveal as="span" className="nv-eyebrow block text-muted">
            Healthcare built around you
          </Reveal>
          <BlurIn
            as="h2"
            className="nv-weight-keep mt-4 font-display text-[clamp(2.3rem,5vw,4.2rem)] font-light leading-[1.04] tracking-[-0.035em]"
          >
            <span className="block text-ink">Your Health Isn&rsquo;t</span>
            <span className="block" style={{ color: GOLD }}>
              One-Size-Fits-All
            </span>
          </BlurIn>
          <Reveal as="div" delay={0.1}>
            <span aria-hidden="true" className="mt-7 block h-px w-28 bg-line-strong" />
            <p className="mt-6 max-w-[40ch] text-[1.05rem] leading-relaxed text-muted md:text-[1.12rem]">
              Personalized treatments for weight, wellness, performance and longevity, reviewed by licensed
              providers and, if prescribed, delivered to your door.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
