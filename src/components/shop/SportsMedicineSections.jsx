import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "../ui/Reveal";
import useRunOnceInView from "../../lib/useRunOnceInView";
import { getLenis } from "../../lib/smoothScroll";

const GROUND = "#f7f5f1";
const INK = "#3f3a33";
const TAUPE = "#8a7b64";
const BRASS = "#a2865a";
const LABEL_INK = "#4a4033";

const CARD_R = "rounded-[calc(24px*var(--nv-r-scale,1))]";
const TILE_R = "rounded-[calc(18px*var(--nv-r-scale,1))]";

/* ------------------------------ 1. hero band ------------------------------ */

function KeepMoving({ assessmentTo }) {
  return (
    <section className="relative isolate overflow-hidden">
      <img
        src="/site/sports-medicine/hero-run.avif"
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 -z-10 h-full w-full object-cover object-center"
      />
      <span
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(62% 48% at 50% 48%, rgba(46,40,30,0.34) 0%, rgba(46,40,30,0.2) 52%, rgba(46,40,30,0.06) 78%, rgba(46,40,30,0) 100%)",
        }}
      />

      {/* Centred on both axes, per the comp — the copy sits in the middle of the
          frame over the open sky, not stacked into the left third. */}
      <div className="mx-auto flex min-h-[clamp(26rem,54vw,50rem)] max-w-[1320px] flex-col items-center justify-center px-5 py-[clamp(3rem,8vw,6rem)] text-center md:px-10">
        <Reveal className="flex flex-col items-center">
          <h2 className="nv-weight-keep font-display text-[clamp(1.75rem,6vw,3.6rem)] font-extrabold leading-[1.06] text-white drop-shadow-[0_2px_18px_rgba(40,32,20,0.45)]">
            Keep Moving Forward
          </h2>

          <p className="mt-4 max-w-[34ch] text-[clamp(0.88rem,1.1vw,1rem)] leading-relaxed text-white/85 drop-shadow-[0_1px_10px_rgba(40,32,20,0.5)]">
            Provider-guided care for recovery, mobility, and wellness goals
          </p>

          {/* Straight into the sports-medicine assessment rather than the product
              handoff the other CTAs on this page use. */}
          <Link
            to={assessmentTo}
            className="mt-7 inline-flex rounded-full px-7 py-3 text-[0.88rem] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 nv-shadow"
            style={{ background: "#b08c52" }}
          >
            Start Your Consultation
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------- 2. recovery carousel -------------------------- */

/* "Give Your Body Time to Respond" (recovery-stretch) and "Support That Fits
   Your Training" (recovery-reach) were pulled from the rotation on 2026-08-31 at
   the client's request. Both photographs are still on the page — they are the
   two picture tiles in the mosaic row below — so this is a rotation change, not
   a deletion, and neither file is now unreferenced. Everything downstream sizes
   itself from SLIDES.length, so three is as valid a count here as five. */
const SLIDES = [
  { label: "Built Around How You Move", img: "/site/sports-medicine/recovery-shoulder.avif", fit: "object-center" },
  { label: "Make Recovery Part of the Routine", img: "/site/sports-medicine/recovery-routine.avif", fit: "object-[62%_center]" },
  { label: "Stay Ready for What's Next", img: "/site/sports-medicine/recovery-stayready.avif", fit: "object-[50%_28%]" },
  { label: "Recovery That Fits Your Pace", img: "/site/sports-medicine/recovery-pace.avif", fit: "object-center" },
  { label: "Stay Connected to Your Goals", img: "/site/sports-medicine/recovery-goals.avif", fit: "object-[50%_35%]" },
];

/* Shared by the meter and the cards, so the two move as one gesture. */
const SETTLE_MS = 560;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/* ------------------------------ the tick meter ----------------------------- */

const TICKS = 86;
const PITCH = 360 / TICKS;
const RING_R = 86;
const TICK_LEN = 8;
const METER_STEP = PITCH * 3;
const MASK_ID = "nv-arc-mask";

function TickArc({ rotation }) {
  const [ref, running] = useRunOnceInView("-40px");

  return (
    <svg
      ref={ref}
      viewBox="0 0 200 200"
      aria-hidden="true"
      className={`nv-ticks pointer-events-none absolute inset-x-0 top-[clamp(2rem,5vw,4.5rem)] mx-auto block h-auto w-[94%] max-w-[44rem] ${
        running ? "is-in" : ""
      }`}
    >
      <defs>
        <linearGradient id={`${MASK_ID}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.45" stopColor="#fff" />
          <stop offset="0.53" stopColor="#000" />
        </linearGradient>
        <mask id={MASK_ID}>
          <rect width="200" height="200" fill={`url(#${MASK_ID}-g)`} />
        </mask>
      </defs>

      <g mask={`url(#${MASK_ID})`}>
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformBox: "view-box",
            transformOrigin: "100px 100px",
            transition: running ? `transform ${SETTLE_MS}ms ${EASE}` : "none",
          }}
        >
          {Array.from({ length: TICKS }, (_, i) => {
            // Index 0 at the apex, so the strike animation can radiate from it.
            const a = (-90 + i * PITCH) * (Math.PI / 180);
            const cos = Math.cos(a);
            const sin = Math.sin(a);
            const fromTop = Math.min(i, TICKS - i) / (TICKS / 2);

            return (
              <line
                key={i}
                className="nv-ticks__tick"
                x1={100 + RING_R * cos}
                y1={100 + RING_R * sin}
                x2={100 + (RING_R + TICK_LEN) * cos}
                y2={100 + (RING_R + TICK_LEN) * sin}
                stroke="#cbc4b7"
                strokeWidth="1.3"
                strokeLinecap="round"
                style={{ animationDelay: `${fromTop * 620}ms` }}
              />
            );
          })}
        </g>
      </g>
    </svg>
  );
}

/* ---------------------------- carousel mechanics --------------------------- */

const COPIES = 5;
const ITEMS = Array.from({ length: SLIDES.length * COPIES }, (_, k) => ({
  ...SLIDES[k % SLIDES.length],
  key: k,
}));
const MID = Math.floor(COPIES / 2) * SLIDES.length;
const START = MID + Math.floor(SLIDES.length / 2);

/* One step every three seconds, against a 560ms settle — long enough that each
   card is legible at rest rather than the row reading as constant motion. */
const STEP_MS = 3000;

function metricsFor(cw) {
  const active = Math.round(Math.min(272, Math.max(184, cw * 0.295)));
  const label = Math.round(active * 0.26);
  return {
    active,
    idle: Math.round(active * 0.676),
    gap: Math.round(Math.min(16, Math.max(10, cw * 0.017))),
    label,
    box: Math.round(active / 0.94) + label + 40,
  };
}

function RecoveryCarousel() {
  const boxRef = useRef(null);
  const trackRef = useRef(null);

  const [m, setM] = useState(() => metricsFor(928));
  const [index, setIndex] = useState(START);
  const [jump, setJump] = useState(false);
  const [turn, setTurn] = useState(0);
  const idxRef = useRef(index);
  const mRef = useRef(m);
  const animRef = useRef(false);

  idxRef.current = index;
  mRef.current = m;

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return undefined;

    const measure = () => setM(metricsFor(box.clientWidth || 928));
    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  const restAt = (i, mm) => -(i * (mm.idle + mm.gap) + mm.active / 2);

  const apply = (px, animate) => {
    const t = trackRef.current;
    if (!t) return;
    t.style.transition = animate ? `transform ${SETTLE_MS}ms ${EASE}` : "none";
    t.style.transform = `translate3d(${px}px, 0, 0)`;
  };

  useLayoutEffect(() => {
    apply(restAt(index, m), animRef.current);
    animRef.current = true;
  }, [index, m]);

  const goTo = (i) => {
    animRef.current = true;
    setTurn((r) => r + (i - idxRef.current) * METER_STEP);
    setIndex(i);
  };

  useEffect(() => {
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (still?.matches) return undefined;

    const id = setInterval(() => goTo(idxRef.current + 1), STEP_MS);
    return () => clearInterval(id);
  }, []);

  /* The rebase. Deliberately does not touch `turn` — this is an invisible
     reposition, and turning the meter here would show as a jerk with no step
     behind it. */
  const onSettled = (e) => {
    if (e.propertyName !== "transform" || e.target !== trackRef.current) return;

    const n = SLIDES.length;
    if (index >= n && index < (COPIES - 1) * n) return;

    let next = index;
    while (next < MID) next += n;
    while (next >= MID + n) next -= n;
    if (next === index) return;

    animRef.current = false;
    setJump(true);
    setIndex(next);
  };

  useEffect(() => {
    if (!jump) return undefined;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setJump(false));
    });
    return () => {
      cancelAnimationFrame(first);
      if (second) cancelAnimationFrame(second);
    };
  }, [jump]);

  return (
    <div className="relative pt-[clamp(5.5rem,16vw,12rem)]">
      <TickArc rotation={turn} />

      <Reveal className="relative px-5 text-center md:px-10">
        <h2
          className="nv-weight-keep mx-auto max-w-[14ch] font-display text-[clamp(1.75rem,5.4vw,3rem)] font-extrabold leading-[1.12]"
          style={{ color: TAUPE }}
        >
          Recovery Is Part of Progress
        </h2>
        <p className="mt-4 text-[clamp(0.92rem,1.3vw,1.05rem)] font-bold" style={{ color: INK }}>
          Your routine doesn&apos;t stop at the workout
        </p>
      </Reveal>

      <div
        ref={boxRef}
        className="nv-fanrow relative mx-auto mt-[clamp(2rem,5vw,4rem)] max-w-[58rem] select-none overflow-hidden py-5"
        style={{ height: `${m.box}px` }}
      >
        <div
          ref={trackRef}
          onTransitionEnd={onSettled}
          className="flex w-max items-center will-change-transform"
          style={{ marginLeft: "50%", gap: `${m.gap}px`, height: `${m.box - 40}px` }}
        >
          {ITEMS.map((s, i) => {
            const on = i === index;

            return (
              <button
                key={s.key}
                type="button"
                onClick={() => goTo(i)}
                aria-current={on ? "true" : undefined}
                aria-label={s.label}
                className={`block shrink-0 overflow-hidden text-left ${TILE_R}`}
                style={{
                  width: `${on ? m.active : m.idle}px`,
                  background: on ? "#ece5da" : "#f1ece3",
                  boxShadow: on ? "0 20px 44px rgba(96,80,56,0.15)" : "none",
                  transition: jump
                    ? "none"
                    : `width ${SETTLE_MS}ms ${EASE}, background-color ${SETTLE_MS}ms ${EASE}, box-shadow ${SETTLE_MS}ms ${EASE}`,
                }}
              >
                <div className="relative aspect-[0.94] w-full overflow-hidden">
                  <img
                    src={s.img}
                    alt=""
                    aria-hidden="true"
                    decoding="async"
                    draggable="false"
                    className={`pointer-events-none absolute inset-0 h-full w-full object-cover ${s.fit}`}
                  />
                </div>

                <p
                  className="flex items-center justify-center px-3 text-center text-[clamp(0.72rem,1.5vw,0.84rem)] font-bold leading-snug"
                  style={{ color: LABEL_INK, height: `${m.label}px` }}
                >
                  {s.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => goTo(index + 1)}
        className="mx-auto mt-1 flex items-center gap-3 text-[0.82rem] font-semibold transition-transform duration-300 hover:translate-x-0.5"
        style={{ color: BRASS }}
      >
        Swipe to explore
        <ArrowRight size={18} strokeWidth={1.8} />
      </button>
    </div>
  );
}

/* ------------------------------ 3. mosaic row ------------------------------ */

/* Four tiles, alternating photograph and flat tint, as the comp sets them. The
   tinted two carry the labels; the photographs carry none. */
const MOSAIC = [
  { img: "/site/sports-medicine/recovery-stretch.avif", fit: "object-center" },
  { label: "Give Your Body Time to Respond", tint: "#e8e0d2" },
  { img: "/site/sports-medicine/recovery-reach.avif", fit: "object-center" },
  { label: "Built Around How You Move", tint: "#c9bda9" },
];

function MosaicRow() {
  return (
    <div className="mx-auto max-w-[1320px] px-5 pt-[clamp(3rem,7vw,5rem)] md:px-10">
      <Reveal as="div">
        {/* Two up on a phone, four from sm — four 4:5 tiles across a narrow screen
            would be thinner than the labels inside them. */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MOSAIC.map((t) => (
            <div
              key={t.label || t.img}
              className={`relative aspect-[4/5] overflow-hidden ${TILE_R}`}
              style={{ background: t.tint || "#e8e0d2" }}
            >
              {t.img ? (
                <img
                  src={t.img}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className={`absolute inset-0 h-full w-full object-cover ${t.fit}`}
                />
              ) : (
                /* Centred, and the spinner is gone (2026-09-01, client). The
                   spinning ring read as the tile still loading rather than as
                   decoration, which is the one thing a placeholder-coloured tile
                   must not look like. With it removed the label is the only
                   thing in the tile, so it takes the middle rather than hanging
                   off the bottom edge. */
                <p
                  className="absolute inset-0 flex items-center justify-center px-5 text-center text-[clamp(0.86rem,1.25vw,1.05rem)] font-medium leading-snug"
                  style={{ color: LABEL_INK }}
                >
                  {t.label}
                </p>
              )}
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}

/* ---------------------------- 4. stay in motion ---------------------------- */

function toShop(e) {
  const lenis = getLenis();
  const target = document.getElementById("shop");
  if (!lenis || !target) return;
  e.preventDefault();
  lenis.scrollTo(target, { offset: -96 });
}

function StayInMotion() {
  return (
    <div className="mx-auto max-w-[1320px] px-5 pt-[clamp(3rem,7vw,5rem)] md:px-10">
      <Reveal as="div" className="relative">
        <div className={`relative overflow-hidden ${CARD_R}`}>
          <img
            src="/site/sports-medicine/motion-court.avif"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-[22%_center] sm:object-center"
          />
          <div className="relative flex min-h-[clamp(24rem,60vw,44rem)] items-center justify-center px-6 py-9 sm:px-10 sm:py-12 lg:px-14">
            <div className="w-full max-w-[34rem] text-center">
              <h2
                className="nv-weight-keep font-display text-[clamp(2.2rem,7.6vw,4.4rem)] font-extrabold leading-[1.06]"
                style={{ color: "#b8c8c5" }}
              >
                Stay in Motion
              </h2>

              <p
                className="mx-auto mt-4 max-w-[32ch] text-[clamp(0.88rem,1.35vw,1.05rem)] leading-relaxed"
                style={{ color: "#c6d2d0" }}
              >
                Provider-guided care for your recovery and mobility goals
              </p>

              <a
                href="#shop"
                onClick={toShop}
                className="mt-6 inline-flex rounded-full px-8 py-3 text-[0.88rem] font-medium backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: "rgba(216,226,224,0.6)", color: "#5e6c6a" }}
              >
                Get Started
              </a>
            </div>
          </div>
        </div>

        <span className="pointer-events-none absolute -bottom-[13%] right-[13%] hidden h-[24%] sm:block">
          <span className="nv-float block h-full">
            <img
              src="/site/sports-medicine/tablet-star.avif"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="block h-full w-auto max-w-none drop-shadow-[0_18px_30px_rgba(70,60,40,0.28)]"
            />
          </span>
        </span>
      </Reveal>
    </div>
  );
}

/* ------------------------------- 5. the LDN ------------------------------- */

const BOTTLE_FRAME = "aspect-[745/1546]";
const BOTTLE_IMG = "w-[250.7%] left-[-76.1%] top-[-9.7%]";

const LDN_CHIPS = [
  { label: "Oral Prescription", pos: "left-0 top-[46%] lg:left-[6%]" },
  { label: "Provider-Guided", pos: "right-0 top-[24%] lg:right-[8%]" },
  { label: "Personalized Plan", pos: "right-[2%] top-[64%] lg:right-[8%]" },
];

function LdnPanel() {
  return (
    <div className="mx-auto max-w-[1320px] px-5 pt-[clamp(3rem,7vw,5rem)] md:px-10">
      <Reveal as="div">
        <div className={`relative px-6 py-9 sm:px-10 sm:py-12 ${CARD_R}`} style={{ background: "#f2eee6" }}>
          <div className="relative mx-auto flex w-full max-w-[46rem] flex-col items-center sm:block">
            <span
              className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[145%] w-[205%] -translate-x-1/2 -translate-y-1/2"
              aria-hidden="true"
              style={{
                background:
                  "radial-gradient(ellipse 44% 38% at 50% 50%, rgba(255,248,229,0.78) 0%, rgba(255,246,222,0.66) 16%, rgba(247,225,182,0.48) 31%, rgba(230,196,132,0.27) 48%, rgba(213,177,108,0.13) 63%, rgba(205,172,102,0.055) 76%, rgba(205,172,102,0) 100%)",
                filter: "blur(8px)",
              }}
            />

            <span className="relative z-10 block w-[62%] max-w-[15rem] sm:mx-auto">
              <span
                className={`relative z-10 block w-full overflow-hidden ${BOTTLE_FRAME}`}
                style={{ filter: "drop-shadow(0 14px 22px rgba(104,82,50,0.22))" }}
              >
                <img
                  src="/site/sports-medicine/ldn-bottle.avif"
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className={`absolute h-auto max-w-none ${BOTTLE_IMG}`}
                />
              </span>
            </span>
            <span className="nv-float pointer-events-none absolute -top-[9%] right-[11%] z-20 hidden h-[22%] sm:block">
              <img
                src="/site/sports-medicine/tablet-facet.avif"
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="block h-full w-auto max-w-none drop-shadow-[0_10px_18px_rgba(70,60,40,0.18)]"
              />
            </span>

            <ul className="mt-7 flex flex-wrap justify-center gap-2.5 sm:mt-0 sm:block">
              {LDN_CHIPS.map((c) => (
                <li key={c.label} className={`sm:absolute ${c.pos}`}>
                  <span
                    className="inline-flex whitespace-nowrap rounded-full border px-5 py-2.5 text-[clamp(0.76rem,1vw,0.88rem)] font-medium"
                    style={{ background: "#f6f2ea", borderColor: "#e3dacb", color: "#7a6a52" }}
                  >
                    {c.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

/* ----------------------------- 6. closing band ----------------------------- */

function ExploreBand({ startTo }) {
  return (
    <div className="mx-auto max-w-[1520px] px-4 pb-[clamp(3rem,6vw,5rem)] pt-[clamp(3rem,7vw,5rem)] md:px-6">
      <Reveal>
        <div
          className="relative flex min-h-[clamp(22rem,52vw,44rem)] items-end justify-center overflow-hidden rounded-[calc(30px*var(--nv-r-scale,1))] px-6 pb-[clamp(2.5rem,5vw,4rem)]"
          style={{ background: "radial-gradient(circle at 50% 45%, #c8ab7e, #a2814a)" }}
        >
          <img
            src="/site/sports-medicine/explore-track.avif"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="nv-bandfade pointer-events-none absolute bottom-0 left-1/2 h-[94%] w-auto max-w-none -translate-x-1/2 object-contain object-bottom"
          />

          <div className="relative z-10 text-center">
            <h2 className="nv-weight-keep max-w-[12ch] font-display text-[clamp(1.9rem,4.4vw,3.6rem)] font-extrabold leading-tight text-[#ffe8b1]">
              Explore Recovery &amp; Wellness
            </h2>

            <Link
              to={startTo}
              className="mt-6 inline-flex rounded-full border border-[#ffe8b1]/70 px-7 py-2.5 text-[0.95rem] font-medium text-[#ffe8b1] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#ffe8b1]/10"
            >
              Start Your Consultation
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

/* ------------------------------- main export ------------------------------- */

const ASSESSMENT_TO = "/start/recovery";

export default function SportsMedicineSections({ startTo = "/start", assessmentTo = ASSESSMENT_TO }) {
  return (
    <div style={{ background: GROUND }}>
      <KeepMoving assessmentTo={assessmentTo} />
      <RecoveryCarousel />
      <MosaicRow />
      <StayInMotion />
      <LdnPanel />
      <ExploreBand startTo={startTo} />
    </div>
  );
}
