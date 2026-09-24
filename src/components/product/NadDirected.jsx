import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "../ui/Reveal";
import useRunOnceInView from "../../lib/useRunOnceInView";
const INK = "#5c4a2a";
const CREAM = "#f7efe2";
const CARD_R = "rounded-[calc(24px*var(--nv-r-scale,1))]";
const VEIL = "rgba(104,80,44,0.34)";
/* The 2021-2026 progress plot that used to fill the second card was removed on
   2026-09-08 with the compliance pass: a rising curve over five years reads as
   a promised outcome. The card now states what ongoing care actually is. */
/* The pair below runs the full width of the wide card above, so the two rows
   share one left and right edge as the comp sets them. That makes each card
   roughly half the block wide, hence a landscape aspect: at the old portrait
   0.85 a full-width card would be taller than the viewport. */
const CARD_ASPECT = "sm:aspect-[1.18] lg:aspect-[1.5]";

function PhotoCard({ img, title, children, className = "", delay = 0, glass = false, veil = true }) {
  const shadow = veil
    ? "drop-shadow-[0_2px_14px_rgba(60,44,20,0.55)]"
    : "drop-shadow-[0_2px_10px_rgba(58,42,18,0.9)]";

  return (
    <Reveal as="div" delay={delay} className={`h-full ${className}`}>
      <div
        className={`relative flex h-full min-h-[22rem] flex-col overflow-hidden p-6 sm:min-h-0 sm:p-7 ${CARD_ASPECT} ${CARD_R}`}
        style={{ background: "linear-gradient(120deg, #c9ac86 0%, #bb9c71 55%, #b39468 100%)" }}
      >
        <img
          src={img}
          alt=""
          aria-hidden="true"
          loading="lazy"
          /* The un-veiled art is a cut-out on transparency, so it is contained
             rather than cropped — and anchored right once the card goes
             landscape, which is the side the comp stands her on. */
          /* Anchored bottom-right at every width now (2026-09-19): on a phone
             the cut-out sat centred over the copy instead of standing beside
             it, which is the alignment the client marked. */
          className={`absolute inset-0 h-full w-full ${veil ? "object-cover object-right" : "object-contain object-bottom-right"}`}
        />
        {veil && <span className="pointer-events-none absolute inset-0" style={{ background: VEIL }} />}
        {glass && (
          <span className="pointer-events-none absolute inset-x-[5%] bottom-[7%] top-[4%] rounded-[calc(20px*var(--nv-r-scale,1))] border border-white/25 bg-white/10 backdrop-blur-[2px] backdrop-saturate-125" />
        )}
        <h3
          className={`nv-weight-keep relative z-10 max-w-[9ch] font-display text-[clamp(1.5rem,4.4vw,2.05rem)] font-extrabold leading-[1.1] ${shadow}`}
          style={{ color: CREAM }}
        >
          {title}
        </h3>
        <div className={`relative z-10 flex min-h-0 flex-1 flex-col ${veil ? "" : shadow}`}>{children}</div>
      </div>
    </Reveal>
  );
}

/* ------------------------- the coenzyme diagram -------------------------
   The comp runs this straight on from the graph band above (NadSupport), on the
   same brass and with no seam, so it is rendered here with no top padding of
   its own: heading and its note on one rule, a drop to the row below, then the
   two nodes either side of the vial with a rule running from each into it. */

const COENZYME_NOTE =
  "NAD+ (nicotinamide adenine dinucleotide) is naturally present in every cell and plays an important role in cellular energy production and other biological processes";

const NODES = [
  {
    label: "Injectable form",
    body: "Administered subcutaneously or intramuscularly as directed by your provider",
  },
  {
    label: "Cellular energy",
    body: "Plays a key role in processes your cells use to produce energy",
  },
];

const BRASS = "radial-gradient(circle at 50% 50%, #c1a27a, #9a7843)";
/* White at a low opacity rather than cream, per the client and per the comp:
   the rule there measures as pure white at 37% over the brass, and the panels
   are the same white held right back (2026-09-25). */
const NODE_CARD = {
  background: "rgba(255,255,255,0.16)",
  borderColor: "rgba(255,255,255,0.28)",
};
const RULE = "rgba(255,255,255,0.45)";

function NodeCard({ node, delay }) {
  return (
    <div
      className="nv-coen__card rounded-[calc(14px*var(--nv-r-scale,1))] border px-5 py-4"
      style={{ ...NODE_CARD, animationDelay: `${delay}s` }}
    >
      <span className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: "#e8c179", boxShadow: "0 0 10px 3px rgba(232,193,121,0.4)" }}
        />
        <span
          className="text-[0.76rem] font-bold uppercase tracking-[0.1em]"
          style={{ color: CREAM }}
        >
          {node.label}
        </span>
      </span>
      <p className="mt-2 text-[0.8rem] leading-relaxed" style={{ color: "rgba(247,239,226,0.86)" }}>
        {node.body}
      </p>
    </div>
  );
}

/* The connector from a node into the vial is an elbow, not a straight rule: it
   drops from under its own card and then runs in toward the vial, which is how
   the comp draws it (2026-09-25). It lives in the card's own column so it hangs
   directly off the card rather than off the row, which is much taller than the
   cards are. Riser first, then the run, so it reads as travelling inward. */
function Elbow({ side }) {
  const left = side === "left";
  return (
    <span
      aria-hidden="true"
      className="relative mt-0 hidden h-[clamp(1.5rem,3vw,2.5rem)] lg:block"
    >
      <span
        className={`nv-coen__drop absolute top-0 h-full w-px ${left ? "left-[18%]" : "right-[18%]"}`}
        style={{ background: RULE, animationDelay: "1.15s" }}
      />
      {/* The run carries on past its own column and into the gap, so it stops
          just short of the vial rather than at the column's edge. */}
      <span
        className={`nv-coen__rule absolute bottom-0 h-px ${
          left ? "-right-8 left-[18%]" : "nv-coen__rule--rtl -left-8 right-[18%]"
        }`}
        style={{ background: RULE, animationDelay: "1.4s" }}
      />
    </span>
  );
}

function CoenzymeBand() {
  const [ref, running] = useRunOnceInView("-80px");

  return (
    <div
      ref={ref}
      className={`nv-coen relative overflow-hidden px-5 pb-[clamp(2rem,5vw,3.5rem)] pt-[clamp(1.5rem,3vw,2.5rem)] md:px-10 ${
        running ? "is-in" : ""
      }`}
      style={{ background: BRASS }}
    >
      {/* The band above paints the same radial over a much shorter box, so the
          two meet a few percent apart down the centre line. This lifts the join
          level, as on the sublingual page. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-36"
        style={{
          background:
            "radial-gradient(70% 100% at 50% 0%, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 72%)",
        }}
      />

      <div className="relative mx-auto max-w-[1180px]">
        {/* ---- heading, its rule, and the note ---- */}
        {/* The heading column is content-sized and the rule takes the slack, so
            the rule starts just off the end of the heading and runs to the note
            rather than waiting at the end of a wide column (2026-09-25). */}
        <div className="grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,0.78fr)] lg:items-center lg:gap-0">
          <h2
            className="nv-coen__card nv-weight-keep font-display text-[clamp(1.6rem,4vw,2.5rem)] font-extrabold leading-[1.14]"
            style={{ color: CREAM, animationDelay: "0.05s" }}
          >
            <span className="block">A coenzyme your</span>
            <span className="block">cells naturally use</span>
          </h2>

          <span
            aria-hidden="true"
            className="nv-coen__rule mx-5 hidden h-px w-auto lg:block"
            style={{ background: RULE, animationDelay: "0.35s" }}
          />

          <p
            className="nv-coen__card rounded-[calc(14px*var(--nv-r-scale,1))] border px-5 py-4 text-[0.8rem] leading-relaxed"
            style={{ ...NODE_CARD, color: "rgba(247,239,226,0.9)", animationDelay: "0.5s" }}
          >
            {COENZYME_NOTE}
          </p>
        </div>

        {/* The drop from the note down to the row below. Right-hand column
            only, under the note, which is where the comp hangs it. */}
        <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)]">
          <span />
          <span
            aria-hidden="true"
            className="nv-coen__drop mx-auto block h-[clamp(2rem,5vw,4rem)] w-px"
            style={{ background: RULE, animationDelay: "0.7s" }}
          />
        </div>

        {/* ---- the two nodes either side of the vial ---- */}
        <div className="mt-6 grid items-center gap-5 sm:grid-cols-2 lg:mt-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,1fr)] lg:gap-8">
          <div className="flex flex-col">
            <NodeCard node={NODES[0]} delay={0.85} />
            <Elbow side="left" />
          </div>

          {/* Three layers, because three different things want the transform:
              the outer one centres a box that is deliberately wider than its
              column (auto margins cannot centre an overflowing block, they
              resolve to zero and it drifts right), the middle one carries the
              entry animation, and the float is on the image itself.
              It runs wide because the art sits in a square canvas with the vial
              filling only 36% of its width, so the element has to be much wider
              than the glass for the glass to read at the comp's size. */}
          <div className="relative order-first mx-auto w-[min(72%,15rem)] sm:order-none sm:col-span-2 lg:left-1/2 lg:col-span-1 lg:w-[170%] lg:-translate-x-1/2">
            <div className="nv-coen__vial">
              {/* The tilt gets a wrapper of its own: the float animates the
                  image's transform, and would wipe a rotate set on it. */}
              <span className="block rotate-6">
                <img
                  src="/products/nad-plus.avif"
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="nv-float pointer-events-none block w-full drop-shadow-[0_18px_34px_rgba(70,50,20,0.34)]"
                />
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <NodeCard node={NODES[1]} delay={1} />
            <Elbow side="right" />
          </div>
        </div>

      </div>
    </div>
  );
}

export default function NadDirected() {
  return (
    <section className="pb-[clamp(2.5rem,5vw,4.5rem)]" style={{ background: "#faf8f4" }}>
      <style>{`
        .nv-coen__card { opacity: 0; transform: translateY(14px); }
        .nv-coen.is-in .nv-coen__card {
          animation: nvCoenCard 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes nvCoenCard { to { opacity: 1; transform: none; } }

        .nv-coen__rule { transform: scaleX(0); transform-origin: left; }
        .nv-coen__rule--rtl { transform-origin: right; }
        .nv-coen.is-in .nv-coen__rule {
          animation: nvCoenRule 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes nvCoenRule { to { transform: scaleX(1); } }

        .nv-coen__drop { transform: scaleY(0); transform-origin: top; }
        .nv-coen.is-in .nv-coen__drop {
          animation: nvCoenDrop 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes nvCoenDrop { to { transform: scaleY(1); } }

        .nv-coen__vial { opacity: 0; transform: scale(0.92); }
        .nv-coen.is-in .nv-coen__vial {
          animation: nvCoenVial 900ms cubic-bezier(0.22, 1, 0.36, 1) 0.6s both;
        }
        @keyframes nvCoenVial { to { opacity: 1; transform: none; } }

        @media (prefers-reduced-motion: reduce) {
          .nv-coen__card, .nv-coen__vial { opacity: 1 !important; transform: none !important; animation: none !important; }
          .nv-coen__rule, .nv-coen__drop { transform: none !important; animation: none !important; }
        }
      `}</style>

      <CoenzymeBand />

      <div className="mx-auto max-w-[1180px] px-5 pt-[clamp(2.5rem,5vw,4.5rem)] md:px-10">
        <Reveal className="text-center">
          <span className="nv-eyebrow">Provider-guided treatment</span>
          <h2
            className="mx-auto mt-2 max-w-[14ch] font-display text-[clamp(1.6rem,5vw,2.6rem)] font-extrabold leading-[1.12]"
            style={{ color: INK }}
          >
            NAD+ Treatment at a Glance
          </h2>
          <Link
            to="/start"
            className="group mt-6 inline-flex items-center gap-3 rounded-full py-2 pl-6 pr-2 text-[0.95rem] font-medium transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(120deg, #b39468 0%, #a3835a 100%)", color: CREAM }}
          >
            Start Your Consultation
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f7efe2]/25 transition-transform duration-300 group-hover:translate-x-0.5">
              <ArrowRight size={17} strokeWidth={2.2} />
            </span>
          </Link>
        </Reveal>

        {/* ---- wide card: copy left, phone breaking the top edge on the right ---- */}
        <Reveal as="div" className="mt-[clamp(1.75rem,4vw,3rem)]">
          <div
            /* Clipped below lg, where the phone stands in the card's corner. Not
               at lg: there it deliberately breaks the card's top edge. */
            className={`relative overflow-hidden px-6 py-8 sm:px-9 sm:py-10 lg:min-h-[25rem] lg:overflow-visible lg:px-11 lg:py-14 lg:pr-[42%] ${CARD_R}`}
            style={{ background: "linear-gradient(120deg, #c9ac86 0%, #bb9c71 55%, #b39468 100%)" }}
          >
            <h3
              className="nv-weight-keep max-w-[11ch] font-display text-[clamp(1.6rem,5vw,2.35rem)] font-extrabold leading-[1.1]"
              style={{ color: CREAM }}
            >
              At-Home Injection, If Prescribed
            </h3>
            <p className="mt-4 max-w-[44ch] text-[0.9rem] leading-relaxed" style={{ color: "rgba(247,239,226,0.86)" }}>
              Once prescribed, treatment can fit into a structured at-home routine with guidance from
              your provider
            </p>
            <Link
              to="/start"
              className="mt-7 inline-flex rounded-full bg-[#f7efe2]/22 px-6 py-3 text-[0.88rem] font-medium transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#f7efe2]/32"
              style={{ color: CREAM }}
            >
              See If NAD+ Is Right for You
            </Link>

            {/* Under the copy on a phone, standing in the card's bottom-right
                corner the way the lg one does (2026-09-19): centred, it floated
                with brass under it and its own square crop on show. The negative
                margins cancel the card's padding, so it lands on both edges. */}
            <img
              src="/site/nad/care-athome.avif"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="-mb-8 -mr-6 ml-auto mt-8 block w-[72%] max-w-[17rem] object-contain sm:-mb-10 sm:-mr-9 sm:w-[54%] lg:hidden"
            />
            <span className="pointer-events-none absolute -top-[13%] bottom-0 right-0 hidden w-[36%] overflow-hidden lg:block">
              <img
                src="/site/nad/care-athome.avif"
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="absolute bottom-0 right-0 h-full w-auto max-w-none object-contain object-bottom"
              />
            </span>
          </div>
        </Reveal>

        {/* Flush with the wide card above: same container, no cap of its own. */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:gap-6">
          {/* No veil: the scrim was shifting this photograph's colour, and the
              comp's warmth is the shot's own. */}
          <PhotoCard img="/site/nad/care-injectable.avif" title="Personalized Dosing" veil={false}>
            <p className="relative z-10 mt-4 max-w-[26ch] text-[0.85rem] leading-relaxed" style={{ color: "rgba(247,239,226,0.88)" }}>
              Your dose and schedule are prescribed based on your individual treatment plan, with
              clear instructions for at-home use
            </p>
          </PhotoCard>
          <PhotoCard img="/site/nad/care-consistency.avif" title="Ongoing Care" delay={0.08} glass>
            <p
              className="relative z-10 mt-4 max-w-[28ch] text-[0.85rem] leading-relaxed"
              style={{ color: "rgba(247,239,226,0.88)" }}
            >
              Follow your provider&rsquo;s prescribed treatment schedule and recommended check-ins
            </p>
          </PhotoCard>
        </div>

        {/* Required qualifiers, verbatim from the comp. */}
        <div className="mt-8 flex flex-col gap-2 text-[0.78rem] leading-relaxed text-muted">
          <span>Prescription treatment requires medical evaluation and is not guaranteed.</span>
          <span>Treatment and dosing are determined based on individual medical needs. Results vary.</span>
          <span>
            Images and graphics are for illustrative purposes only and do not represent expected or
            guaranteed outcomes
          </span>
        </div>
      </div>
    </section>
  );
}
