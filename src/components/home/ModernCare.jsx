import React from "react";
import { useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { Layers, MonitorSmartphone, Pill, Stethoscope } from "lucide-react";
import Reveal from "../ui/Reveal";
import BlurIn from "../ui/BlurIn";

/**
 * "Bringing modern care closer to home" (client's comp, 2026-10-13).
 *
 * Four points that turn with the page: the band pins under the header and the
 * reader's scroll steps it 01, 02, 03, 04 on the way down and back 04 to 01 on
 * the way up. Pinning is plain `position: sticky` inside a taller wrapper, so
 * the browser still owns the scroll; only which point is in front is worked
 * out from it. The points sit on a wheel: the one in front is large, its
 * neighbours small and faint above and below it, as the comp draws them.
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

/* Distance between the wheel's stations, in rem. */
const ROW = 8.5;

function Wheel({ active }) {
  return (
    <div className="relative h-[24rem] md:h-[26rem]">
      {POINTS.map((p, i) => {
        const off = i - active;
        const front = off === 0;
        return (
          <div
            key={p.title}
            aria-hidden="true"
            className="absolute inset-x-0 top-1/2 flex items-center gap-5 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:gap-7"
            style={{
              transform: `translateY(calc(-50% + ${off * ROW}rem)) scale(${front ? 1 : 0.78})`,
              transformOrigin: "left center",
              opacity: front ? 1 : Math.abs(off) === 1 ? 0.32 : 0,
            }}
          >
            <span
              className="nv-weight-keep w-[2.2ch] shrink-0 font-display text-[clamp(3.4rem,6vw,5.4rem)] font-light leading-none tracking-[-0.04em]"
              style={{ color: SAND }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2.5 text-[clamp(1.25rem,2vw,1.7rem)] font-normal leading-tight tracking-[-0.02em] text-ink">
                <p.Icon size={22} strokeWidth={1.5} className="shrink-0 text-[#a3854f]" />
                {p.title}
              </span>
              <span className="mt-1.5 block max-w-[40ch] text-[0.98rem] leading-snug text-muted md:text-[1.05rem]">
                {p.body}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* A bar per point under the heading, the one in front filled. */
function Ticks({ active }) {
  return (
    <div className="mt-8 flex items-center gap-2" aria-hidden="true">
      {POINTS.map((p, i) => (
        <span
          key={p.title}
          className={`h-1 rounded-full transition-all duration-500 ${i === active ? "w-10 bg-[#b08d57]" : "w-5 bg-[#e3d5bd]"}`}
        />
      ))}
    </div>
  );
}

function Heading({ children }) {
  return (
    <BlurIn
      as="h2"
      className="nv-weight-keep font-display text-[clamp(2rem,4vw,3.4rem)] font-normal leading-[1.06] tracking-[-0.035em] text-ink"
    >
      {children}
    </BlurIn>
  );
}

export default function ModernCare() {
  const ref = React.useRef(null);
  const still = useReducedMotion();
  const [active, setActive] = React.useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.min(POINTS.length - 1, Math.max(0, Math.floor(v * POINTS.length)));
    setActive((cur) => (cur === next ? cur : next));
  });

  /* Nothing turns for anyone who has asked for less motion: the four points
     are simply listed. */
  if (still) {
    return (
      <section style={{ background: GROUND }}>
        <div className="mx-auto grid max-w-[1340px] gap-10 px-5 py-16 md:px-10 lg:grid-cols-2">
          <Heading>Bringing modern care closer to home</Heading>
          <ol className="grid gap-7">
            {POINTS.map((p, i) => (
              <li key={p.title} className="flex gap-5">
                <span className="font-display text-[2.6rem] font-light leading-none" style={{ color: SAND }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="block text-[1.3rem] text-ink">{p.title}</span>
                  <span className="mt-1 block text-muted">{p.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  return (
    /* About a screen of scroll per point. */
    <section ref={ref} className="relative h-[300svh] md:h-[340svh]" style={{ background: GROUND }}>
      <div className="sticky top-[69px] flex h-[calc(100svh-69px)] items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1340px] items-center gap-6 px-5 md:px-10 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
          <Reveal as="div">
            <Heading>
              Bringing modern care
              <br />
              closer to home
            </Heading>
            <Ticks active={active} />
          </Reveal>
          <Wheel active={active} />
          {/* The wheel shows one point at a time; this keeps all four in the
              reading order for a screen reader. */}
          <ul className="sr-only">
            {POINTS.map((p) => (
              <li key={p.title}>
                {p.title}. {p.body}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
