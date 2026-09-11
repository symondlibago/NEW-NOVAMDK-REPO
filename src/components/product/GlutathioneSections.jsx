import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import Reveal from "../ui/Reveal";
import useRunOnceInView from "../../lib/useRunOnceInView";

const INK = "#544529";
const TAN = "#b9a179";
const BODY = "#7a6d58";

const TITLE = "nv-weight-keep font-display font-extrabold leading-[1.14]";
const TITLE_SIZE = "text-[clamp(1.6rem,3.6vw,2.7rem)]";
const BODY_SIZE = "text-[clamp(0.9rem,1.2vw,1.05rem)]";

function Ramp({ children }) {
  return (
    <span
      className="bg-clip-text text-transparent"
      style={{ backgroundImage: `linear-gradient(90deg, ${INK} 0%, ${TAN} 100%)` }}
    >
      {children}
    </span>
  );
}

const CREAM = "#f4e3c1";
const CREAM_SOFT = "rgba(244,227,193,0.88)";

const CARD_R = "rounded-[calc(26px*var(--nv-r-scale,1))]";
const BRASS = "radial-gradient(circle at 50% 50%, #c1a27a, #9a7843)";
/* The comp's ground under the white card: pale at the top, warming into tan as
   it falls, so the card reads as lifted off it. */
const GROUND =
  "radial-gradient(120% 100% at 50% 0%, #fdfbf6 0%, #f7eeda 52%, #ecd9b6 100%)";
const WITHIN = [
  { label: "Naturally Produced", body: "Found throughout the body" },
  { label: "Antioxidant Role", body: "Participates in the body's response to oxidative stress" },
  { label: "Cellular Function", body: "Involved in normal cellular processes" },
];


function AlreadyUsing() {
  return (
    <div className="mx-auto max-w-[1180px] px-5 py-[clamp(2.5rem,6vw,4.5rem)] md:px-10">
      <div className="grid items-center gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.62fr)_minmax(0,1fr)]">
        <Reveal as="div" className="lg:self-start">
          <h2 className={`${TITLE} ${TITLE_SIZE}`} style={{ color: INK }}>
            Support something
            <br />
            your body is already
            <br />
            using <Ramp>every day</Ramp>
          </h2>
          <p className={`mt-5 max-w-[46ch] leading-[1.5] ${BODY_SIZE}`} style={{ color: BODY }}>
            Your body naturally makes it, but levels can change with age, stress, lifestyle, and
            environmental exposure
          </p>
        </Reveal>
        <Reveal as="div" delay={0.06} className="order-first lg:order-none">
          <span className="nv-float mx-auto block w-[52%] max-w-[13rem] sm:w-[38%] lg:w-full">
            <picture>
              <source srcSet="/products/glutathione-tilted.webp" type="image/webp" />
              <img
                src="/products/glutathione-tilted.avif"
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="block h-auto w-full drop-shadow-[0_22px_34px_rgba(104,82,50,0.22)]"
              />
            </picture>
          </span>
        </Reveal>

        <Reveal as="div" delay={0.12}>
          {/* Same reason as the left column: the comp breaks after "comes". */}
          <h2 className={`${TITLE} ${TITLE_SIZE}`} style={{ color: INK }}>
            Some support comes
            <br />
            <Ramp>naturally</Ramp>
          </h2>
          <p className={`mt-4 max-w-[46ch] leading-[1.5] ${BODY_SIZE}`} style={{ color: BODY }}>
            Glutathione works throughout the body to help protect cells from everyday oxidative
            stress
          </p>
        </Reveal>
      </div>
    </div>
  );
}

/* ------------------------- 2. how glutathione works ------------------------- */

const CALLOUTS = [
  {
    label: "What is glutathione?",
    body: "A naturally occurring tripeptide made from cysteine, glycine and glutamic acid",
    pos: "right-[1%] top-[5%] w-[27%]",
    wire: "62,40 85.5,40 85.5,27",
  },
  {
    label: "Antioxidant role",
    body: "Participates in the body's normal response to oxidative stress",
    pos: "left-[1%] top-[32%] w-[25%]",
    wire: "38,24 13.5,24 13.5,31",
  },
  {
    label: "Cellular function",
    body: "Involved in normal cellular processes throughout the body",
    pos: "left-[34%] top-[74%] w-[32%]",
    wire: "50,68 50,73",
  },
];

const STAGES = ["Oxidative activity", "Glutathione activity", "Cellular redox balance"];
const RAIL_S = 1.6;
const RAIL_HOLD_MS = 3000;

const PANEL = "border border-[#f4e3c1]/35 bg-[#f4e3c1]/10 backdrop-blur-[2px]";
const PANEL_R = "rounded-[calc(16px*var(--nv-r-scale,1))]";
const CALLOUT_LABEL =
  "block font-mono text-[0.6rem] font-bold uppercase leading-tight tracking-[0.13em] sm:text-[0.64rem]";

function CalloutCard({ item, className = "" }) {
  return (
    <div className={`${PANEL} ${PANEL_R} px-4 py-3.5 sm:px-5 sm:py-4 ${className}`}>
      <span className={CALLOUT_LABEL} style={{ color: CREAM_SOFT }}>
        {item.label}
      </span>
      <p
        className="mt-2 text-[0.86rem] leading-[1.45] sm:text-[0.95rem]"
        style={{ color: CREAM }}
      >
        {item.body}
      </p>
    </div>
  );
}

function Vial({ className = "" }) {
  return (
    <span className={`nv-float pointer-events-none block ${className}`}>
      {/* WebP first: some iOS Safari builds decode this AVIF's alpha plane
          wrong and paint a solid rectangle behind the glass. */}
      <picture>
        <source srcSet="/products/glutathione-tilted.webp" type="image/webp" />
        <img
          src="/products/glutathione-tilted.avif"
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="block h-full w-auto drop-shadow-[0_26px_38px_rgba(74,56,28,0.34)]"
        />
      </picture>
    </span>
  );
}

function HowItWorks() {
  const [ref, running] = useRunOnceInView("-80px");
  const [railRef, railIn] = useRunOnceInView("-80px");

  const [active, setActive] = useState(0);
  useEffect(() => {
    if (!railIn) return undefined;
    const t = setInterval(() => setActive((v) => (v + 1) % STAGES.length), RAIL_HOLD_MS);
    return () => clearInterval(t);
  }, [railIn]);

  return (
    /* Full-bleed brass, like the Semaglutide mechanism section: this is the
       page's own stage, not a card sitting on the cream ground. */
    <section className="overflow-hidden" style={{ background: BRASS }}>
      <div className="mx-auto max-w-[1180px] px-5 py-[clamp(2.75rem,6vw,5rem)] md:px-10">
        <Reveal>
          <h2
            className={`${TITLE} text-[clamp(1.5rem,3.6vw,2.5rem)]`}
            style={{ color: CREAM }}
          >
            How Glutathione Works
          </h2>
        </Reveal>
        <div
          ref={ref}
          className={`nv-diagram relative mt-8 hidden aspect-15/8 w-full lg:block ${
            running ? "is-in" : ""
          }`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            {CALLOUTS.map((c, i) => (
              <polyline
                key={c.label}
                className="nv-wire"
                points={c.wire}
                pathLength="1"
                fill="none"
                stroke="rgba(244,227,193,0.5)"
                strokeWidth="0.14"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ animationDelay: `${i * 0.42 + 0.2}s` }}
              />
            ))}
          </svg>

          {CALLOUTS.map((c, i) => (
            <div
              key={c.label}
              className={`nv-wire__label absolute ${c.pos}`}
              style={{ animationDelay: `${i * 0.42 + 0.5}s` }}
            >
              <CalloutCard item={c} />
            </div>
          ))}

          {/* Drawn last so it covers where the wires land. */}
          <Vial className="absolute left-1/2 top-[3%] h-[62%] -translate-x-1/2" />
        </div>

        {/* ---- the stack, below lg ---- */}
        <div className="mt-8 lg:hidden">
          <Vial className="mx-auto h-56 w-fit sm:h-64" />
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CALLOUTS.map((c) => (
              <Reveal as="div" key={c.label} y={12}>
                <CalloutCard item={c} className="h-full" />
              </Reveal>
            ))}
          </div>
        </div>

        {/* ---- the three-stage rule ---- */}
        <div ref={railRef} className={`nv-rail relative mt-10 sm:mt-12 ${railIn ? "is-in" : ""}`}>
          <ol className="grid grid-cols-3 gap-x-3">
            {STAGES.map((s, i) => (
              <li
                key={s}
                className={`nv-rail__item ${
                  i === 0 ? "text-left" : i === 1 ? "text-center" : "text-right"
                }`}
                style={{ animationDelay: `${(i / STAGES.length) * RAIL_S + 0.12}s` }}
              >
                <span
                  className="block font-mono text-[0.58rem] font-bold uppercase leading-tight tracking-[0.12em] transition-colors duration-500 sm:text-[0.7rem]"
                  /* Dimmed by colour, not opacity: the entry animation owns
                     opacity and its `both` fill would win. */
                  style={{ color: i === active ? "#fff6dd" : "rgba(244,227,193,0.55)" }}
                >
                  {s}
                </span>
              </li>
            ))}
          </ol>

          {/* The rule and its three stops. Positioned rather than gridded so
              the outer dots sit on the line's own ends, under the outer
              labels, exactly as the comp draws them. */}
          <div className="relative mt-4 h-3 sm:mt-5">
            <span
              aria-hidden="true"
              className="nv-rail__line absolute left-0 top-1/2 h-px w-full -translate-y-1/2"
              style={{ background: "rgba(244,227,193,0.4)" }}
            />
            {STAGES.map((s, i) => {
              const lit = i === active;
              return (
                <span
                  key={s}
                  aria-hidden="true"
                  className="absolute top-1/2 block h-3 w-3 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${(i / (STAGES.length - 1)) * 100}%` }}
                >
                  <span
                    className="nv-rail__dot block h-full w-full"
                    style={{ animationDelay: `${(i / STAGES.length) * RAIL_S}s` }}
                  >
                    <span
                      className="block h-full w-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        background: lit ? "#fff6dd" : CREAM,
                        transform: lit ? "scale(1.4)" : "scale(1)",
                        boxShadow: lit ? "0 0 20px 7px rgba(255,246,221,0.4)" : "none",
                      }}
                    />
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        <p
          className="mt-8 text-center text-[0.86rem] leading-relaxed sm:mt-10 sm:text-[0.95rem]"
          style={{ color: CREAM }}
        >
          Glutathione participates in the body&rsquo;s normal antioxidant and cellular-balance
          processes
        </p>
        {/* Required framing: a biological role is not a promise of a result. */}
        <p
          /* No max-width: the comp sets this on one line and at 0.78rem it
             fits the full row with room to spare. It still wraps on a phone,
             where the row is too narrow for any single-line setting. */
          className="mx-auto mt-2 text-center text-[0.72rem] italic leading-relaxed sm:text-[0.78rem]"
          style={{ color: "rgba(244,227,193,0.62)" }}
        >
          This describes glutathione&rsquo;s biological role and does not represent a guaranteed
          treatment outcome
        </p>
      </div>
    </section>
  );
}

/* --------------------------- 2. the brass card --------------------------- */

function NotSurfaceLevel() {
  return (
    /* Full-bleed: the comp runs its soft gradient edge to edge behind the white
       card, so this band carries the ground rather than sitting on the page's
       own cream. */
    <section style={{ background: GROUND }}>
      <div className="mx-auto max-w-[1180px] px-5 py-[clamp(2.5rem,6vw,4.5rem)] md:px-10">
        <Reveal>
          <div className={`bg-white px-7 py-9 sm:px-10 sm:py-11 lg:px-14 lg:py-14 ${CARD_R} nv-shadow`}>
            {/* One rule between the columns, drawn with a border on the second so
                it cannot outlive the layout: below lg the columns stack and the
                border simply does not apply. */}
            <div className="grid gap-9 lg:grid-cols-2 lg:gap-0">
              <div className="lg:pr-12">
                <h3
                  className="nv-weight-keep max-w-[13ch] font-display text-[clamp(1.4rem,3.2vw,2.05rem)] font-extrabold leading-[1.12]"
                  style={{ color: INK }}
                >
                  Glutathione in the body
                </h3>
                <ul className="mt-7 flex flex-col gap-5">
                  {WITHIN.map((w) => (
                    <li key={w.label} className="flex items-start gap-3.5">
                      <span
                        className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-white"
                        style={{ background: "linear-gradient(120deg, #b8975e 0%, #a3854c 100%)" }}
                      >
                        <Check size={13} strokeWidth={3} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[0.92rem] font-semibold" style={{ color: INK }}>
                          {w.label}
                        </span>
                        <span
                          className="mt-1 block max-w-[38ch] text-[0.86rem] leading-relaxed"
                          style={{ color: BODY }}
                        >
                          {w.body}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                {/* Required framing: what a molecule does in the body is not what
                    a treatment will do for the reader. */}
                <p
                  className="mt-6 max-w-[44ch] text-[0.74rem] italic leading-relaxed"
                  style={{ color: "rgba(122,109,88,0.78)" }}
                >
                  Biological role does not guarantee a treatment outcome
                </p>
              </div>

              <div className="lg:border-l lg:border-[#544529]/12 lg:pl-12">
                <h3
                  className="nv-weight-keep max-w-[13ch] font-display text-[clamp(1.4rem,3.2vw,2.05rem)] font-extrabold leading-[1.12]"
                  style={{ color: INK }}
                >
                  Why injectable glutathione?
                </h3>
                <p className="mt-6 text-[0.92rem] font-semibold leading-relaxed" style={{ color: INK }}>
                  Injectable glutathione doesn&apos;t rely on digestion
                </p>
                <p className="mt-3 max-w-[44ch] text-[0.88rem] leading-relaxed" style={{ color: BODY }}>
                  Your provider reviews your health history and goals, then determines whether
                  treatment makes sense for you and what your plan should look like
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        <RoleChips />
      </div>
    </section>
  );
}

/* --------------------- the three role chips ---------------------
   Same interaction as the Luminance actives: the pill is only as wide as its
   own label until hover or keyboard focus opens the description beside it.
   Below md there is no hover to give, so they become a plain stack with the
   copy already showing. */

const ROLES = [
  {
    label: "Cellular Defense",
    body: "Participates in processes that help cells respond to oxidative stress",
    /* Scattered rather than gridded, as the comp draws them: two on the upper
       line, the third centred below. */
    slot: { left: "20%", top: "0" },
  },
  {
    label: "Antioxidant Support",
    body: "May support the body's natural antioxidant defenses",
    slot: { left: "84%", top: "0" },
  },
  {
    label: "Cellular Balance",
    /* The client's copy sets this with an em dash. House style is a comma. */
    body: "Supports normal redox balance, an important part of cellular function",
    slot: { left: "52%", top: "4.5rem" },
  },
];

const CHIP =
  "cursor-default rounded-full border border-[#544529]/12 bg-white/70 px-5 py-2.5 backdrop-blur-[2px] transition-shadow duration-500 focus:outline-none";

function RoleChips() {
  return (
    <>
      {/* The stage keeps a fixed height because the chips are taken out of flow;
          nothing below it may be pushed around by a pill opening. */}
      <div className="relative mt-9 hidden h-40 md:block">
        {ROLES.map((r) => (
          <div
            key={r.label}
            className="group absolute -translate-x-1/2"
            style={{ left: r.slot.left, top: r.slot.top }}
          >
            <div tabIndex={0} className={`${CHIP} hover:nv-shadow focus:nv-shadow`}>
              <span
                className="block whitespace-nowrap text-[0.88rem] font-semibold"
                style={{ color: INK }}
              >
                {r.label}
              </span>
              {/* Closed, the shell is zero-wide so the pill measures only its own
                  label; the copy holds a fixed inner width so it does not reflow
                  on the way open. */}
              <div className="grid w-0 grid-rows-[0fr] overflow-hidden transition-all duration-500 ease-out group-focus-within:w-[15rem] group-focus-within:grid-rows-[1fr] group-hover:w-[15rem] group-hover:grid-rows-[1fr]">
                <div className="overflow-hidden">
                  <p
                    className="w-[15rem] pt-2 text-[0.78rem] leading-relaxed"
                    style={{ color: BODY }}
                  >
                    {r.body}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ul className="mt-7 flex flex-col gap-3 md:hidden">
        {ROLES.map((r) => (
          <li key={r.label} className={`${CHIP} rounded-[calc(16px*var(--nv-r-scale,1))]`}>
            <span className="block text-[0.86rem] font-semibold" style={{ color: INK }}>
              {r.label}
            </span>
            <p className="mt-1 text-[0.78rem] leading-relaxed" style={{ color: BODY }}>
              {r.body}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ------------------------- 3. the legal footer -------------------------
   These four sentences are required on the page. They used to sit under "The
   Role of Glutathione" — the portrait-and-CTA block that opened this component,
   removed on 2026-09-08 at the client's request — so they carry on alone here
   rather than leaving the page without them. */

function Qualifiers() {
  return (
    <div className="mx-auto max-w-[1180px] px-5 pb-[clamp(2.5rem,6vw,4.5rem)] md:px-10">
      <p className="max-w-[62ch] text-[0.76rem] italic leading-relaxed text-muted">
        Prescription required. Eligibility determined by a licensed provider. Individual results may
        vary. Compounded medications are not FDA-approved.
      </p>
    </div>
  );
}

/* ----------------------------- 4. closing band ----------------------------
   Removed on 2026-09-08 with the compliance pass: "Support how you want to
   feel" is an outcome promise, and the band existed to carry it. Its legal
   footnote lives in Qualifiers so nothing required was lost. */


export default function GlutathioneSections() {
  return (
    <section style={{ background: "#faf8f4" }}>
      <HowItWorks />
      <AlreadyUsing />
      <NotSurfaceLevel />
      <Qualifiers />
    </section>
  );
}
