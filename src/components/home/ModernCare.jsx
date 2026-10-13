import React from "react";
import { Layers, MonitorSmartphone, Pill, Stethoscope } from "lucide-react";
import Reveal from "../ui/Reveal";
import BlurIn from "../ui/BlurIn";

/**
 * "Bringing modern care closer to home" (client's comp, 2026-10-13).
 *
 * Four cards on one screen. The first round pinned the band and turned the
 * points on a wheel with the scroll; the client found it too slow to get
 * through and asked for it gone (2026-10-13), and for the points as cards
 * stacked down a phone screen. On a desktop the heading sits at the left and
 * the cards in a two by two grid beside it.
 */

const POINTS = [
  { title: "Convenient online access", body: "Start from wherever you are.", Icon: MonitorSmartphone },
  { title: "Licensed provider review", body: "Medical oversight is part of every treatment journey.", Icon: Stethoscope },
  { title: "Trusted pharmacy partners", body: "Prescriptions are fulfilled through U.S.-licensed pharmacies.", Icon: Pill },
  /* "Confidence" left out of this list at the client's request. */
  { title: "Care beyond one category", body: "Explore options for weight, wellness, recovery, skin and longevity.", Icon: Layers },
];

/* Picks up where HealthFit ends and fades back to the page's white. */
const GROUND = "linear-gradient(180deg, #f8eedf 0%, #fbf5ec 55%, #ffffff 100%)";
const SAND = "#c9b48e";

function Card({ point, index }) {
  const { title, body, Icon } = point;
  return (
    <Reveal
      as="li"
      delay={0.08 * index}
      className="flex flex-col rounded-3xl border border-white/80 bg-white/60 p-5 shadow-[0_18px_40px_-28px_rgba(90,70,30,0.45)] backdrop-blur-md md:p-7"
    >
      <div className="flex items-center justify-between">
        <span
          className="nv-weight-keep font-display text-[2rem] font-light leading-none tracking-[-0.04em] md:text-[2.6rem]"
          style={{ color: SAND }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <Icon size={22} strokeWidth={1.5} aria-hidden="true" className="text-[#a3854f]" />
      </div>
      <h3 className="mt-3 text-[1.12rem] leading-tight text-ink md:mt-10 md:text-[1.35rem]">{title}</h3>
      <p className="mt-1.5 text-[0.92rem] leading-snug text-muted md:text-[1rem]">{body}</p>
    </Reveal>
  );
}

export default function ModernCare() {
  return (
    /* One screen under the header, on a phone too, where the four cards stack
       to fill it. */
    <section
      className="flex min-h-[calc(100svh-69px)] items-center [@media(min-width:600px)_and_(orientation:portrait)]:min-h-0"
      style={{ background: GROUND }}
    >
      <div className="mx-auto grid w-full max-w-[1340px] items-center gap-6 px-5 py-10 md:px-10 md:py-16 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <BlurIn
          as="h2"
          className="nv-weight-keep font-display text-[clamp(2rem,4vw,3.4rem)] font-normal leading-[1.06] tracking-[-0.035em] text-ink"
        >
          Bringing modern care
          <br />
          closer to home
        </BlurIn>
        <ol className="grid gap-3 md:grid-cols-2 md:gap-5">
          {POINTS.map((p, i) => (
            <Card key={p.title} point={p} index={i} />
          ))}
        </ol>
      </div>
    </section>
  );
}
