import React from "react";
import { Link } from "react-router-dom";
import Reveal from "../ui/Reveal";
import useRunOnceInView from "../../lib/useRunOnceInView";
import { getLenis } from "../../lib/smoothScroll";
const INK = "#6b511e";
const SOFT = "#c0a878";
const CREAM = "#f2ece1";

/* Deliberately soft-focus, not a crisp disc: the comp renders it out of focus,
   so it is a warm gradient blurred at the edges with a halo bleeding past it. */
const BEAD = "radial-gradient(circle at 34% 30%, #f2ddab 0%, #d6b273 42%, #a9853f 78%, #8a6a33 100%)";
const BEAD_GLOW = "0 0 9px 3px rgba(180,145,80,0.45)";
const ORBITS = [
  { label: "Confidence", pos: "left-[1%] top-[13%] sm:left-[6%]" },
  { label: "Connection", pos: "right-[1%] top-[15%] sm:right-[10%]" },
  { label: "Satisfaction", pos: "right-[0%] top-[47%] sm:right-[2%]" },
  { label: "Intimacy", pos: "left-[2%] top-[77%] sm:left-[6%]" },
];

const FOCUS = [
  { label: "Desire & Arousal", img: "/site/sexual-health/focus-desire.avif", fit: "object-center" },
  { label: "Sexual Function", img: "/site/sexual-health/focus-function.avif", fit: "object-center" },
  { label: "Confidence & Intimacy", img: "/site/sexual-health/focus-confidence.avif", fit: "object-center" },
];

const CARD_R = "rounded-[calc(28px*var(--nv-r-scale,1))]";
const TILE_R = "rounded-[calc(20px*var(--nv-r-scale,1))]";

function GlassPill({ children, tone = "light", on = false, className = "", ...rest }) {
  const light = tone === "light";
  return (
    <span
      {...rest}
      className={`inline-flex items-center whitespace-nowrap rounded-full backdrop-blur-md ${light ? "gap-3 px-5 py-3 text-[clamp(0.82rem,1.4vw,0.98rem)] font-bold" : "gap-2 border px-4 py-2 text-[0.78rem] font-semibold"} ${className}`}
      style={{
        background: light
          ? "rgba(252,249,243,0.55)"
          : on
            ? "rgba(255,255,255,0.3)"
            : "rgba(255,255,255,0.14)",
        borderColor: light ? "transparent" : "rgba(255,255,255,0.22)",
        boxShadow: light ? "0 8px 22px rgba(122,96,58,0.16)" : "none",
        color: light ? "#5c4a2a" : on ? "#ffffff" : "rgba(255,255,255,0.72)",
      }}
    >
      {children}
    </span>
  );
}

/* ------------------------------ 1. hero card ------------------------------ */

function ConfidenceStage({ startTo }) {
  // The arc draws once it is on screen — the draw is the point of it.
  const [arcRef, arcIn] = useRunOnceInView("-80px");

  return (
    <div className="mx-auto max-w-[1320px] px-5 pt-[clamp(2.5rem,6vw,4.5rem)] md:px-10">
      <Reveal>
        <div
          className={`relative overflow-hidden px-5 pt-10 sm:px-10 sm:pt-14 ${CARD_R}`}
          style={{ background: "linear-gradient(180deg, #d9c4a1 0%, #e3d2b4 42%, #ebdfc8 78%, #f0e7d5 100%)" }}
        >
          <h2 className="nv-weight-keep mx-auto max-w-[18ch] text-center font-display text-[clamp(1.7rem,5.4vw,3rem)] font-extrabold leading-[1.12] text-white">
            Confidence <em className="italic">Starts</em> With Feeling Like Yourself
          </h2>
          <p className="mx-auto mt-4 max-w-[44ch] text-center text-[0.85rem] leading-relaxed text-white/85">
            Discreet, provider-guided care for sexual health and intimacy concerns
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={startTo}
              className="inline-flex rounded-full px-7 py-3 text-[0.85rem] font-medium transition-all duration-300 hover:-translate-y-0.5"
              style={{ background: CREAM, color: "#665c4f" }}
            >
              Get Started
            </Link>
            <Link
              to="/treatments"
              className="inline-flex rounded-full px-7 py-3 text-[0.85rem] font-medium backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5"
              style={{ background: "rgba(139,123,102,0.62)", color: "#fbf7f0" }}
            >
              Explore Treatments
            </Link>
          </div>

          <div ref={arcRef} className={`nv-arc relative mt-8 h-[clamp(19rem,46vw,30rem)] ${arcIn ? "is-in" : ""}`}>
            <svg
              viewBox="0 0 200 108"
              preserveAspectRatio="xMidYMax meet"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full"
            >
              <path
                className="nv-arc__line"
                d="M 6 108 A 94 94 0 0 1 194 108"
                pathLength="1"
                fill="none"
                stroke="rgba(255,255,255,0.72)"
                strokeWidth="0.55"
                strokeLinecap="round"
              />
            </svg>
            <img
              src="/site/sexual-health/hero-couple.avif"
              alt=""
              aria-hidden="true"
              className="absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2 object-contain object-bottom"
            />
            {ORBITS.map((o, i) => (
              /* Staggered so the four never rise and fall together, which would
                 read as the whole picture moving rather than the words drifting
                 across it. */
              <span
                key={o.label}
                className={`nv-drift absolute ${o.pos}`}
                style={{ animationDelay: `${i * -1.6}s` }}
              >
                <GlassPill>
                  <span className="h-3 w-3 shrink-0 rounded-full blur-[1.5px]" style={{ background: BEAD, boxShadow: BEAD_GLOW }} aria-hidden="true" />
                  {o.label}
                </GlassPill>
              </span>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

/* ----------------------------- 2. talking band ---------------------------- */

/* Replaces the old "Explore Sexual Health" band (2026-09-01). Same job — the
   closing CTA — but it sends the reader back up to the shelf on this page
   instead of out to the intake, which is what the comp's arrow asks for: the
   products are already above, so pushing to /start skipped past them. */
function TalkingBand() {
  /* Scrolls to the shelf, which carries id="shop" and its own scroll-mt. Lenis
     owns the scroll position site-wide, so it has to be told rather than the
     window — a plain #shop href would fight the smooth-scroll and jump. */
  const seeOptions = () => {
    const el = document.getElementById("shop");
    if (!el) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(el, { offset: -84 });
    else el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    /* Top padding, not bottom. This was written as a closing band, where the
       space belonged underneath it; sitting second it needs the gap above
       instead or it butts straight into the hero card. FocusRow below brings its
       own top padding, so adding one here too would double the gap. */
    <div className="mx-auto max-w-[1320px] px-5 pt-[clamp(2rem,5vw,3.5rem)] md:px-10">
      <Reveal>
        <div className={`relative flex min-h-[clamp(20rem,42vw,34rem)] items-center overflow-hidden ${CARD_R}`}>
          {/* The photograph is the whole card. Its left third is a plain wall, so
              the copy sits on that rather than on a scrim over the couple. */}
          <img
            src="/site/sexual-health/talking-about.png"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right"
          />

          <div className="relative z-10 px-7 py-10 sm:px-12">
            <h2 className="nv-weight-keep font-display text-[clamp(1.5rem,3.4vw,2.7rem)] font-extrabold leading-[1.16] text-white">
              When something feels different,
              <br />
              {/* #ffe8b1 — the comp's "Light orange", second line only. */}
              <span style={{ color: "#ffe8b1" }}>it’s worth talking about</span>
            </h2>
            <p className="mt-5 text-[clamp(0.88rem,1.25vw,1.02rem)] leading-relaxed text-white/85">
              Changes in desire, arousal, or performance happen.
              <br />
              Getting support doesn’t have to feel complicated
            </p>
            <button
              type="button"
              onClick={seeOptions}
              className="mt-7 inline-flex rounded-full bg-white px-7 py-3 text-[0.95rem] font-semibold text-ink transition-all duration-300 hover:-translate-y-0.5 nv-shadow"
            >
              See My Options
            </button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

/* ------------------------------- 3. focus -------------------------------- */

function FocusRow() {
  return (
    <div className="mx-auto max-w-[1320px] px-5 pb-[clamp(3rem,6vw,5rem)] pt-[clamp(2.5rem,6vw,4.5rem)] md:px-10">
      <Reveal>
        <h2 className="text-center font-display text-[clamp(1.6rem,4.6vw,2.6rem)] font-extrabold leading-[1.14]">
          <span style={{ color: INK }}>Start With What</span>{" "}
          <span className="sm:block" style={{ color: SOFT }}>
            You&rsquo;re Looking For
          </span>
        </h2>
      </Reveal>

      <div className="mt-[clamp(1.75rem,4vw,3rem)] grid gap-4 sm:grid-cols-3">
        {FOCUS.map((f, i) => (
          <Reveal as="div" key={f.label} delay={i * 0.08} className="h-full">
            <div className={`relative aspect-[0.78] overflow-hidden ${TILE_R}`}>
              <img
                src={f.img}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className={`absolute inset-0 h-full w-full object-cover ${f.fit}`}
              />
              {/* Short veil at the head of the card only — enough to carry the
                  label without washing the photograph. */}
              <span
                className="pointer-events-none absolute inset-x-0 top-0 h-1/3"
                style={{ background: "linear-gradient(180deg, rgba(30,20,12,0.55), transparent)" }}
              />
              <span className="absolute left-5 top-5 z-10 text-[0.95rem] font-semibold text-white drop-shadow-[0_2px_10px_rgba(30,20,12,0.6)]">
                {f.label}
              </span>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- 4. closing band ---------------------------- */

function ExploreBand({ startTo }) {
  return (
    <div className="mx-auto max-w-[1320px] px-5 pb-[clamp(3rem,6vw,5rem)] md:px-10">
      <Reveal>
        <div
          className={`relative flex min-h-[clamp(21rem,48vw,33rem)] items-end justify-center overflow-hidden px-6 pb-[clamp(2rem,4.5vw,3.5rem)] ${CARD_R}`}
          style={{
            background:
              "linear-gradient(180deg, #ad8f56 0%, #b59660 38%, #c9ad78 72%, #dcc08d 100%)",
          }}
        >
          <img
            src="/site/sexual-health/explore-couple.avif"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="nv-bandfade pointer-events-none absolute bottom-0 left-1/2 h-[88%] w-auto max-w-none -translate-x-1/2 object-contain object-bottom"
          />

          <div className="relative z-10 text-center">
            <h2 className="nv-weight-keep mx-auto max-w-[12ch] font-display text-[clamp(1.75rem,4.4vw,3.1rem)] font-extrabold leading-[1.12] text-[#f0dcac]">
              Explore Sexual Health
            </h2>
            <Link
              to={startTo}
              className="mt-5 inline-flex rounded-full border border-[#f0dcac]/60 px-7 py-2.5 text-[0.9rem] font-medium text-[#f0dcac] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#f0dcac]/10"
            >
              Start Your Consultation
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

export default function SexualHealthSections({ startTo = "/start" }) {
  return (
    <div style={{ background: "#faf8f4" }}>
      <ConfidenceStage startTo={startTo} />
      <TalkingBand />
      <FocusRow />
      <ExploreBand startTo={startTo} />
    </div>
  );
}
