import React, { useEffect, useState } from "react";
import Reveal from "../ui/Reveal";
import useRunOnceInView from "../../lib/useRunOnceInView";

const barWidth = (i, n) => `${34 + (i * 22) / Math.max(1, n - 1)}%`;
const BAR_FILL = 0.75;
const LABEL_LEAD = 0.55;
const WIRES = [
  { label: "left-[4%] top-[12%] text-left", points: "4,20 26,20 33,32" },
  { label: "left-[14%] top-[66%] text-left", points: "14,74 32,74 39,62" },
  { label: "right-[4%] top-[32%] text-right", points: "96,40 71,40 62,46" },
];

const LABEL = "text-[0.78rem] font-bold uppercase leading-tight tracking-[0.12em] text-[#ffe8b1]";

function Vial({ src, className = "" }) {
  return (
    <span className={`pointer-events-none block aspect-721/1656 ${className}`}>
      <span className="nv-float relative block h-full w-full">
        <img
          src={src}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="absolute left-1/2 top-1/2 h-[121%] w-auto max-w-none -translate-x-1/2 -translate-y-1/2 drop-shadow-2xl"
        />
      </span>
    </span>
  );
}

function CalloutDiagram({ m, product }) {
  const [ref, running] = useRunOnceInView();
  const wires = m.callouts.slice(0, WIRES.length);

  return (
    <>
      <Reveal as="div" className="mx-auto max-w-[46ch] text-center">
        <h2 className="font-display text-[clamp(1.7rem,3.4vw,2.5rem)] font-extrabold leading-[1.1] text-[#ffe8b1]">
          {m.title}
        </h2>
        {m.description && (
          <p className="mx-auto mt-4 max-w-[52ch] text-[0.82rem] leading-relaxed text-[#ffe8b1]/90">
            {m.description}
          </p>
        )}
      </Reveal>
      <div
        ref={ref}
        className={`nv-diagram relative mx-auto mt-[clamp(1.5rem,3vw,2.5rem)] hidden aspect-82/25 w-full max-w-205 md:block ${
          running ? "is-in" : ""
        }`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          {wires.map((c, i) => (
            <polyline
              key={c.name}
              className="nv-wire"
              points={WIRES[i].points}
              pathLength="1"
              fill="none"
              stroke="rgba(255,232,177,0.55)"
              strokeWidth="0.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animationDelay: `${i * 0.3 + 0.15}s` }}
            />
          ))}
        </svg>

        {wires.map((c, i) => (
          <span
            key={c.name}
            className={`nv-wire__label absolute max-w-[30%] ${LABEL} ${WIRES[i].label}`}
            style={{ animationDelay: `${i * 0.3}s` }}
          >
            {c.name}
          </span>
        ))}

        {/* Drawn after the wires so it covers where they land. */}
        <Vial
          src={product.img}
          /* Nearly the full height of the box, as the comp sets it: against a
             label spread this wide a smaller bottle strands itself in brass. */
          className="absolute left-1/2 top-1/2 h-[96%] -translate-x-1/2 -translate-y-1/2"
        />
      </div>

      <div className="mt-8 md:hidden">
        <Vial src={product.img} className="mx-auto h-56" />
        <ul className="mt-6 flex flex-col items-center gap-2.5">
          {m.callouts.map((c) => (
            <li key={c.name} className={`rounded-full border border-white/25 px-5 py-2 text-[1rem] ${LABEL}`}>
            {c.name}
          </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/* The rule draws across in RAIL_S seconds; each stop sits at its own fraction of
   the width, so its delay is that same fraction of the run and the dot lights as
   the line arrives. */
const RAIL_S = 1.6;
/* Dwell on each stop before moving to the next, per the comp's note. Long
   enough to read the sentence under it, which is the point of the highlight. */
const RAIL_HOLD_MS = 3000;

function TimelineRail({ m }) {
  const [ref, running] = useRunOnceInView();
  const n = m.timeline.length;
  const [active, setActive] = useState(0);

  /* Starts only once the rail has drawn itself in — lighting stops on a section
     nobody has reached yet would mean the cycle is mid-lap by the time it is. */
  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => setActive((v) => (v + 1) % n), RAIL_HOLD_MS);
    return () => clearInterval(t);
  }, [running, n]);

  return (
    <div className="mt-[clamp(2.5rem,5vw,4rem)]">
      <Reveal as="div">
        <h2 className="max-w-[15ch] font-display text-[clamp(1.6rem,3.2vw,2.3rem)] font-extrabold leading-[1.1] text-[#ffe8b1]">
          {m.timelineTitle}
        </h2>
      </Reveal>

      <div ref={ref} className={`nv-rail relative mt-9 ${running ? "is-in" : ""}`}>
        {/* Only from lg, where the stops actually sit in one row for it to join. */}
        <span
          aria-hidden="true"
          className="nv-rail__line absolute left-0 top-1.5 hidden h-px w-full bg-white/25 lg:block"
        />
        <ol className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {m.timeline.map((t, i) => {
            const on = i === active;
            return (
              <li key={t.label} className="relative lg:pt-9">
                {/* Two spans: the entry keyframes end on `transform: none` with a
                    `both` fill, so a scale on this element would be wiped the
                    moment the dot has arrived. Outer one arrives, inner one
                    carries the highlight. */}
                <span
                  aria-hidden="true"
                  className="nv-rail__dot absolute left-0 top-0 hidden h-3 w-3 lg:block"
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
                  {/* Dimmed by colour rather than opacity: the entry animation
                      owns opacity and its `both` fill would win. */}
                  <span
                    className={`block transition-colors duration-500 ${LABEL}`}
                    style={{ color: on ? "#fff6dd" : "rgba(255,232,177,0.55)" }}
                  >
                    {t.label}
                  </span>
                  <span
                    className="mt-2 block max-w-[28ch] text-[0.9rem] leading-snug transition-colors duration-500"
                    style={{ color: on ? "rgba(255,232,177,0.95)" : "rgba(255,232,177,0.55)" }}
                  >
                    {t.text}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

export default function ProductMechanism({ product }) {
  const m = product.mechanism;
  const [listRef, running] = useRunOnceInView();
  if (!m) return null;

  const callouts = m.layout === "callouts";

  return (
    <section
      className="overflow-hidden"
      style={{ background: "radial-gradient(circle at 50% 50%, #c1a27a, #9a7843)" }}
    >
      <div className="mx-auto max-w-[1180px] px-5 py-[clamp(2.75rem,6vw,5rem)] md:px-10">
        {callouts && <CalloutDiagram m={m} product={product} />}
        {!callouts && (
        <div className="grid gap-8 lg:grid-cols-[1fr_auto_0.8fr] lg:items-center lg:gap-x-4">
          <Reveal as="div">
            <h2 className="max-w-[13ch] font-display text-[clamp(1.6rem,3.2vw,2.3rem)] font-extrabold leading-[1.1] text-[#ffe8b1]">
              {m.title}
            </h2>
            {m.description && (
              <p className="mt-4 max-w-[36ch] text-[0.82rem] leading-relaxed text-[#ffe8b1]">{m.description}</p>
            )}
          </Reveal>
          <Reveal as="div" delay={0.06} className="relative z-10 hidden lg:block lg:-mr-7 lg:justify-self-end">
            <span className="nv-float pointer-events-none relative block aspect-138/297 w-44">
              <img
                src={product.img}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="absolute left-1/2 top-1/2 w-[244%] max-w-none -translate-x-1/2 -translate-y-1/2 drop-shadow-2xl"
              />
            </span>
          </Reveal>

          <Reveal as="div" delay={0.12}>
            <ul className="divide-y divide-white/15 rounded-[calc(20px*var(--nv-r-scale,1))] bg-white/10 px-7 py-1 backdrop-blur-[2px]">
              {m.pathways.map((p) => (
                <li key={p.name} className="py-5">
                  <h3 className="font-display text-[1.15rem] font-semibold leading-tight text-[#ffe8b1]">{p.name}</h3>
                  <p className="mt-1.5 max-w-[44ch] text-[0.8rem] leading-relaxed text-[#ffe8b1]">{p.text}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        )}

        {m.timeline?.length > 0 && callouts && <TimelineRail m={m} />}

        {m.timeline?.length > 0 && !callouts && (
          <div className="mt-[clamp(2.5rem,5vw,4rem)]">
            <Reveal as="div">
              <h2 className="max-w-[15ch] font-display text-[clamp(1.6rem,3.2vw,2.3rem)] font-extrabold leading-[1.1] text-[#ffe8b1]">
                {m.timelineTitle}
              </h2>
            </Reveal>
            <ul ref={listRef} className={`nv-seq mt-8 flex flex-col gap-4 ${running ? "is-in" : ""}`}>
              {m.timeline.map((t, i) => (
                <li key={t.label} className="flex items-center gap-5">
                  <span
                    aria-hidden="true"
                    className="nv-seq__bar hidden h-12 shrink-0 rounded-[14px] sm:block"
                    style={{
                      width: barWidth(i, m.timeline.length),
                      animationDelay: `${i * BAR_FILL}s`,
                      background:
                        "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.04) 38%, rgba(255,255,255,0.13) 72%, rgba(255,255,255,0.3) 100%)",
                    }}
                  />
                  <span
                    className="nv-seq__label min-w-0"
                    style={{ animationDelay: `${i * BAR_FILL + BAR_FILL * LABEL_LEAD}s` }}
                  >
                    {/* One line per bar, label and description joined by the
                      dash the compliance script writes them with: the four are
                      a semicolon-separated list of "Label - Description" pairs,
                      not eight separate statements. */}
                    <span className="flex flex-wrap items-baseline gap-x-2 text-[#ffe8b1]">
                      <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em]">
                        {t.label}
                      </span>
                      <span aria-hidden="true" className="opacity-60">-</span>
                      <span className="text-[1rem] font-medium leading-snug">{t.text}</span>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
