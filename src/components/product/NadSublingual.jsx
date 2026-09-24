import React from "react";
import { Link } from "react-router-dom";
import Reveal from "../ui/Reveal";
import useRunOnceInView from "../../lib/useRunOnceInView";

/**
 * "Elevate Your NAD+ Routine" — the sublingual tablet band (2026-09-24 comp).
 *
 * Rebuilt from the client's Canva: the heading and its standfirst, the daily
 * energy meter, the two provider-framed cards, and the tablets beside a rail of
 * three facts. The four-step Place / Dissolve / Absorb / Continue Your Day list
 * the band used to carry is not in the new design and has gone.
 *
 * The meter and the "Support Your Everyday Energy" heading were removed by the
 * 2026-09-08 compliance pass as outcome language; the new comp brings both back
 * and carries a disclaimer naming the meter, which is reproduced verbatim at the
 * foot of the band.
 */

const CREAM = "#f4e3c1";
const CREAM_SOFT = "rgba(244,227,193,0.82)";
const CREAM_DIM = "rgba(244,227,193,0.58)";
const CREAM_FAINT = "rgba(244,227,193,0.44)";
const GROUND = "radial-gradient(circle at 50% 50%, #c1a27a, #9a7843)";

/* Sampled off the comp, pixel by pixel (2026-09-25). The two panels are NOT the
   same fill: the first is cream over the brass and the second is the meter's own
   gray brown over it, so the pair reads light then dark. Both were cream here,
   which is what made the second one wrong. */
const CARD_LIGHT = {
  background: "rgba(244,227,193,0.27)",
  borderColor: "rgba(244,227,193,0.42)",
};
const CARD_DARK = {
  background: "rgba(114,88,38,0.34)",
  borderColor: "rgba(244,227,193,0.30)",
};

/* The fill ends on the bottle's own centre line, which is 63% of the track in
   the comp. Ending it anywhere short of that leaves the rounded cap out in the
   open beside the glass, which is what read as the bar stopping short of the
   product; on the centre line the cap is behind the widest, most opaque part of
   the bottle at every width. The two share a constant so they cannot drift. */
const BOTTLE_AT = "63%";
const METER_FILL = BOTTLE_AT;
/* Gray brown, straight off the comp's colour picker. */
const METER_INK = "#725826";
/* Sampled off the comp's track, a shade under the lighter of the two cards. */
const METER_TRACK = "rgba(244,227,193,0.24)";

const CARDS = [
  {
    label: "What is it used for?",
    body: "Used in provider-directed care focused on cellular energy and healthy aging",
    skin: CARD_LIGHT,
  },
  {
    label: "How is it taken?",
    body: "Dissolved under the tongue or inside the cheek as directed by your provider",
    skin: CARD_DARK,
  },
];

const FACTS = [
  { label: "Cellular coenzyme", body: "Involved in energy production and metabolism" },
  { label: "Cellular energy", body: "Used in care focused on energy and healthy aging" },
  { label: "Sublingual form", body: "Dissolves under the tongue or inside the cheek" },
];

/* Long enough to read the line under the lit stop before it moves on, matching
   the rails on the mechanism sections. */
const FACT_HOLD_MS = 3000;

function EnergyMeter() {
  const [ref, running] = useRunOnceInView("-80px");

  return (
    <div ref={ref} className={`nv-meter mt-[clamp(2rem,5vw,3.25rem)] ${running ? "is-in" : ""}`}>
      <span
        className="block text-[0.68rem] font-bold uppercase tracking-[0.2em] sm:text-[0.74rem]"
        style={{ color: CREAM_SOFT }}
      >
        Daily energy
      </span>

      {/* The bottle stands on the bar and breaks both its edges, so the track
          and the art share one positioning context. */}
      <div className="relative mt-3 sm:mt-4">
        {/* Track and rim are the cards' own fill and border, so the meter and
            the two cards under it read as one set of parts (2026-09-24). */}
        <div
          className="relative h-12 w-full overflow-hidden rounded-full border sm:h-14 lg:h-16"
          style={{
            background: METER_TRACK,
            borderColor: CARD_LIGHT.borderColor,
            boxShadow: "inset 0 1px 2px rgba(78,58,26,0.16)",
          }}
        >
          <span
            aria-hidden="true"
            className="nv-meter__fill absolute inset-y-0 left-0 rounded-full"
            style={{ "--nv-fill": METER_FILL, background: METER_INK }}
          />
        </div>

        <img
          src="/products/nad-sublingual.avif"
          alt=""
          aria-hidden="true"
          loading="lazy"
          /* Sized off the bar rather than the viewport: the comp stands the
             bottle at about 2.9x the track's height, which is also what keeps
             it wide enough to hide the end of the fill. */
          className="nv-float pointer-events-none absolute top-1/2 h-28 w-auto max-w-none -translate-x-1/2 -translate-y-1/2 rotate-[8deg] object-contain drop-shadow-[0_14px_26px_rgba(70,50,20,0.42)] sm:h-40 lg:h-46"
          style={{ left: BOTTLE_AT }}
        />
      </div>

      {/* Three stops under the track, at its ends and its middle. */}
      <div className="mt-2.5 flex items-center justify-between text-[0.76rem] font-medium sm:text-[0.92rem]">
        <span style={{ color: CREAM }}>Low</span>
        <span style={{ color: CREAM }}>Steady</span>
        <span style={{ color: CREAM }}>High</span>
      </div>
    </div>
  );
}

function FactRail() {
  const [ref, running] = useRunOnceInView("-80px");
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    if (!running) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const t = setInterval(() => setActive((v) => (v + 1) % FACTS.length), FACT_HOLD_MS);
    return () => clearInterval(t);
  }, [running]);

  return (
    <div ref={ref} className={`nv-facts relative ${running ? "is-in" : ""}`}>
      {/* The rule runs between the first and last dot rather than the full
          height, so it does not hang past either end of the list. */}
      <span
        aria-hidden="true"
        className="nv-facts__line absolute bottom-6 left-1.5 top-2 w-px"
        style={{ background: "rgba(244,227,193,0.35)" }}
      />
      <ol className="flex flex-col gap-8 sm:gap-10">
        {FACTS.map((f, i) => {
          const on = i === active;
          return (
            <li
              key={f.label}
              className="nv-facts__item relative pl-8"
              style={{ animationDelay: `${0.12 + i * 0.16}s` }}
            >
              <span
                aria-hidden="true"
                className="absolute left-0 top-1.5 h-3 w-3 rounded-full transition-all duration-500 ease-out"
                style={{
                  background: on ? CREAM : "rgba(244,227,193,0.45)",
                  boxShadow: on ? "0 0 18px 5px rgba(244,227,193,0.35)" : "none",
                  transform: on ? "scale(1.25)" : "scale(1)",
                }}
              />
              {/* Dimmed by colour, never opacity: the entry animation owns
                  opacity and its `both` fill would win. */}
              <h3
                className="font-display text-[0.94rem] font-bold uppercase tracking-[0.06em] transition-colors duration-500 sm:text-[1.02rem]"
                style={{ color: on ? CREAM : CREAM_DIM }}
              >
                {f.label}
              </h3>
              <p
                className="mt-1.5 max-w-[40ch] text-[0.92rem] leading-relaxed transition-colors duration-500 sm:text-[0.98rem]"
                style={{ color: on ? CREAM_SOFT : CREAM_FAINT }}
              >
                {f.body}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function NadSublingual({ startTo = "/start" }) {
  return (
    /* No top padding: the graph band (NadSupport) runs on the same brass
       directly above this one, and the comp has the two as a single panel. The
       cream strip between them was this section's own padding (2026-09-24). */
    <section className="pb-[clamp(2rem,4vw,3.5rem)]" style={{ background: "#faf8f4" }}>
      <style>{`
        /* The fill sweeps out to its resting width the first time the meter is
           reached, then stays there. Animating width rather than a transform so
           the rounded right end travels with it instead of being stretched. */
        .nv-meter__fill { width: 0; }
        .nv-meter.is-in .nv-meter__fill {
          animation: nvMeterFill 1.25s cubic-bezier(0.22, 1, 0.36, 1) 0.15s forwards;
        }
        @keyframes nvMeterFill { to { width: var(--nv-fill); } }

        .nv-facts__line { transform: scaleY(0); transform-origin: top; }
        .nv-facts.is-in .nv-facts__line {
          animation: nvFactsLine 900ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes nvFactsLine { to { transform: scaleY(1); } }

        .nv-facts__item { opacity: 0; transform: translateY(10px); }
        .nv-facts.is-in .nv-facts__item {
          animation: nvFactsItem 560ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes nvFactsItem { to { opacity: 1; transform: none; } }

        @media (prefers-reduced-motion: reduce) {
          .nv-meter__fill { width: var(--nv-fill) !important; animation: none !important; }
          .nv-facts__line { transform: none !important; animation: none !important; }
          .nv-facts__item { opacity: 1 !important; transform: none !important; animation: none !important; }
        }
      `}</style>

      <div className="w-full">
        {/* Lighter on top than underneath: the band above already ends on its
            own bottom padding, so a full pad here would leave a canyon between
            the source line and this heading. */}
        <div
          className="relative overflow-hidden px-6 pb-9 pt-6 sm:px-10 sm:pb-12 sm:pt-8 lg:px-14 lg:pb-16 lg:pt-10"
          style={{ background: GROUND }}
        >
          {/* Both bands paint the same radial, but over boxes of very different
              heights, so the two meet about 3% apart at the centre line where
              the gradient peaks. This lifts the join back level. Radial, not
              flat: the mismatch is only in the middle. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-36"
            style={{
              background:
                "radial-gradient(70% 100% at 50% 0%, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 72%)",
            }}
          />
          {/* The band is full bleed; its contents are not (2026-09-19). */}
          <div className="mx-auto w-full max-w-[1180px]">
            {/* ---------------------- the heading ---------------------- */}
            <Reveal as="div">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-start lg:gap-10">
                {/* The comp breaks after "NAD+", so the break is set rather
                    than left to the measure. */}
                <h2
                  className="nv-weight-keep font-display text-[clamp(1.7rem,5vw,2.75rem)] font-extrabold leading-[1.12]"
                  style={{ color: CREAM }}
                >
                  <span className="block">Elevate Your NAD+</span>
                  <span className="block">Routine</span>
                </h2>
                <p
                  className="max-w-[40ch] text-[0.94rem] font-semibold leading-relaxed lg:pt-3"
                  style={{ color: CREAM_SOFT }}
                >
                  A naturally occurring coenzyme involved in cellular energy and metabolism
                </p>
              </div>
            </Reveal>

            {/* --------------------- the energy meter --------------------- */}
            <EnergyMeter />

            {/* ------------------ what it is and how ------------------ */}
            <Reveal as="div" className="mt-[clamp(2.5rem,6vw,4rem)] text-center">
              <h2
                className="nv-weight-keep font-display text-[clamp(1.5rem,4.4vw,2.35rem)] font-extrabold leading-tight"
                style={{ color: CREAM }}
              >
                Support Your Everyday Energy
              </h2>
            </Reveal>

            <div className="mt-[clamp(1.5rem,3.5vw,2.5rem)] grid gap-4 sm:grid-cols-2 sm:gap-6">
              {CARDS.map((c, i) => (
                <Reveal as="div" key={c.label} delay={i * 0.08}>
                  <div
                    className="h-full rounded-[calc(18px*var(--nv-r-scale,1))] border px-6 py-6 sm:px-7 sm:py-7"
                    style={c.skin}
                  >
                    <h3
                      className="text-[0.8rem] font-bold uppercase tracking-[0.12em] sm:text-[0.86rem]"
                      style={{ color: CREAM }}
                    >
                      {c.label}
                    </h3>
                    <p
                      className="mt-3 max-w-[38ch] text-[0.96rem] font-medium leading-relaxed"
                      style={{ color: CREAM }}
                    >
                      {c.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal as="div" delay={0.12} className="mt-[clamp(1.5rem,3vw,2.25rem)] text-center">
              <Link
                to={startTo}
                /* Darker than the ground, not a cream wash over it: the comp's
                   pill reads as a recess in the panel. */
                className="inline-flex rounded-full px-7 py-3.5 text-[0.82rem] font-semibold transition-all duration-300 hover:-translate-y-0.5"
                style={{ color: CREAM, background: "rgba(92,72,38,0.38)" }}
              >
                See If NAD+ Is Right for You
              </Link>
            </Reveal>

            {/* ------------------ the tablets and the rail ------------------ */}
            <div className="mt-[clamp(2.5rem,6vw,4.5rem)] grid items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:gap-16">
              <Reveal as="div">
                {/* The re-export is trimmed to the tablets already, so the frame
                    just holds the image at its own ratio. */}
                <div className="nv-float relative mx-auto w-full max-w-[15rem] sm:max-w-[22rem]">
                  <img
                    src="/products/detail/nad-tablet-pair.avif"
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="block h-auto w-full"
                  />
                </div>
              </Reveal>
              <FactRail />
            </div>

            {/* Required qualifiers, verbatim from the comp and inside the band
                where it puts them. The second one names the meter. */}
            <div className="mt-[clamp(2rem,5vw,3.5rem)] flex flex-col gap-2.5">
              <p className="text-[0.76rem] leading-relaxed" style={{ color: CREAM_FAINT }}>
                Prescription treatment requires medical evaluation. Individual responses may vary.
              </p>
              <p className="max-w-[86ch] text-[0.76rem] leading-relaxed" style={{ color: CREAM_FAINT }}>
                The energy meter and other graphics shown are for illustrative purposes only and do
                not represent expected or guaranteed results. If prescribed, compounded medications
                are not FDA-approved drug products.
              </p>
            </div>
          </div>
        </div>

        {/* Everything after the gold card keeps the page's own width: only the
            card itself went full bleed (2026-09-19). */}
        <div className="mx-auto max-w-[1180px] px-5 md:px-10">
          {/* Side by side from the start (2026-09-19): stacked, the photo took a
              full screen on a phone and pushed the line it belongs with out of
              sight. It keeps the column it had from lg. */}
          <div className="mt-[clamp(2.5rem,6vw,4rem)] grid grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] items-center gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
            <Reveal as="div">
              <div className="relative aspect-[0.89] w-full max-w-[34rem] overflow-hidden rounded-[calc(20px*var(--nv-r-scale,1))]">
                <img
                  src="/site/nad/sublingual-taken.avif"
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </Reveal>
            <Reveal as="div" delay={0.08}>
              {/* Two flat colours, no ramp: the comp sets the first clause in the
                  soft tan and lands the qualifier in the deeper brass. */}
              <p className="nv-weight-keep max-w-[24ch] font-display text-[clamp(1.35rem,3.6vw,2.15rem)] font-extrabold leading-[1.22]">
                <span className="block" style={{ color: "#c3a67a" }}>
                  A simpler way to keep
                </span>
                <span style={{ color: "#7a5f36" }}>up with your routine</span>
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
