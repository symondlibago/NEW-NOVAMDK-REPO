import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import Reveal from "../ui/Reveal";
const GROUND = "#f8f6f2";
const PANEL = "#ebe4d8";
const INK = "#4a4238";
const MUTED = "#6b5e4b";
const GOLD = "#a8874e";
const GOLD_LIGHT = "#c3a56d";
const GOLD_DEEP = "#5f4c2c";
/* The ramp that runs across "so much" alone: mid gold into the pale gold. */
const HEAD_FILL = "linear-gradient(90deg, #8a6f36 0%, #a8874e 45%, #c9b183 100%)";
const CREAM = "#f1e4c2";
const PILL = "#ede5d6";

const CARD_R = "rounded-[calc(24px*var(--nv-r-scale,1))]";
const TILE_R = "rounded-[calc(18px*var(--nv-r-scale,1))]";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/* --------------------- 1. hero + "routine" panel, one card -------------------- */

const TRUST = [
  { img: "/site/skin-health/trust-clinician.avif", label: "Licensed provider review" },
  { img: "/site/skin-health/trust-phone.avif", label: "Prescription skin treatment options" },
  { img: "/site/skin-health/trust-delivery.avif", label: "Online care. Home delivery, if prescribed" },
];

function HeroCard({ startTo }) {
  return (
    <div className="mx-auto max-w-[1320px] px-4 pt-[clamp(1.5rem,3vw,2.5rem)] md:px-10">
      <Reveal as="div">
        <div className={`overflow-hidden ${CARD_R}`}>
          <div className="relative flex min-h-[clamp(20rem,64vw,30rem)] items-center justify-center px-5 py-12 sm:px-10">
            <img
              src="/site/skin-health/hero-sky.avif"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-[72%_center] sm:object-center"
            />
            <span
              className="pointer-events-none absolute inset-0"
              aria-hidden="true"
              style={{
                background:
                  "radial-gradient(58% 46% at 50% 46%, rgba(40,44,52,0.28) 0%, rgba(40,44,52,0.14) 58%, rgba(40,44,52,0) 100%)",
              }}
            />

            <div className="relative z-10 text-center">
              <h2 className="nv-weight-keep mx-auto max-w-[16ch] font-display text-[clamp(1.6rem,5.4vw,3.1rem)] font-extrabold leading-[1.1] text-white drop-shadow-[0_2px_16px_rgba(30,34,42,0.4)]">
                It might be time for something better
              </h2>

              <p className="mx-auto mt-3 max-w-[34ch] text-[clamp(0.8rem,2.6vw,1rem)] leading-relaxed text-white/90 drop-shadow-[0_1px_10px_rgba(30,34,42,0.45)]">
                See what could work better for your skin
              </p>

              <Link
                to={startTo}
                className="mt-6 inline-flex rounded-full px-7 py-3 text-[0.85rem] font-medium transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: PILL, color: INK }}
              >
                See Your Options
              </Link>
            </div>
          </div>
          <div
            className="grid gap-8 px-6 py-9 sm:px-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-12"
            style={{ background: PANEL }}
          >
            <div>
              {/* Solid deep brown, with the ramp on "so much" alone. It stays
                  on one line, so clipping the fill to an inline span is safe. */}
              <h2
                className="nv-weight-keep font-display text-[clamp(1.4rem,4.6vw,2.4rem)] font-extrabold leading-[1.14]"
                style={{ color: GOLD_DEEP }}
              >
                Sometimes, your routine can only do{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: HEAD_FILL }}
                >
                  so much
                </span>
              </h2>

              <p
                className="mt-4 max-w-[42ch] text-[clamp(0.78rem,2.4vw,0.9rem)] leading-relaxed"
                style={{ color: INK }}
              >
                If your usual routine isn&apos;t giving you what you&apos;re looking for, there may be
                another option
              </p>
            </div>

            <TrustReel />
          </div>
        </div>
      </Reveal>
    </div>
  );
}

/* ------------------------------- the trust reel ------------------------------ */

const REEL = [...TRUST, ...TRUST, ...TRUST];
const REEL_MID = TRUST.length;
const SLOT_MS = 3400;

function slotStyle(offset) {
  const w = offset === 0 ? 34 : 24;
  return { left: `${50 + offset * 30 - w / 2}%`, width: `${w}%` };
}

function TrustReel() {
  const [i, setI] = useState(REEL_MID);
  const [snap, setSnap] = useState(false);

  useEffect(() => {
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (still?.matches) return undefined;

    const id = setInterval(() => setI((n) => n + 1), SLOT_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (i < REEL_MID + TRUST.length) return undefined;
    // Two frames: the first paints the rebased position with transitions off,
    // the second turns them back on before the next tick.
    setSnap(true);
    setI(i - TRUST.length);
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setSnap(false));
    });
    return () => {
      cancelAnimationFrame(first);
      if (second) cancelAnimationFrame(second);
    };
  }, [i]);

  const active = TRUST[i % TRUST.length];

  return (
    <div>
      <div className="relative overflow-hidden">
        <div className="invisible mx-auto aspect-[4/3] w-[34%]" />

        {REEL.map((t, k) => {
          const offset = k - i;
          if (Math.abs(offset) > 2) return null;

          return (
            <div
              key={k}
              className={`absolute top-1/2 -translate-y-1/2 overflow-hidden ${TILE_R}`}
              style={{
                ...slotStyle(offset),
                transition: snap ? "none" : `left 620ms ${EASE}, width 620ms ${EASE}`,
              }}
            >
              <img
                src={t.img}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="block aspect-[4/3] w-full object-cover"
              />
            </div>
          );
        })}
      </div>
      <div key={active.label} className="nv-fade-in mt-5 flex items-start justify-center gap-2.5">
        <CheckDot />
        <span className="text-[clamp(0.76rem,2.3vw,0.86rem)] leading-snug" style={{ color: INK }}>
          {active.label}
        </span>
      </div>
    </div>
  );
}

/* The comp's bullet: a filled brass disc with a white tick, not an outline. Sized
   in rem rather than by the text, so a wrapping label does not stretch it. */
function CheckDot() {
  return (
    <span
      className="mt-0.5 inline-flex h-[1.15rem] w-[1.15rem] shrink-0 items-center justify-center rounded-full"
      style={{ background: GOLD }}
      aria-hidden="true"
    >
      <Check size={12} strokeWidth={3} color="#fff" />
    </span>
  );
}

/* ---------------------------- 2. the gold band ---------------------------- */

function BeyondRoutine({ startTo }) {
  return (
    <div className="mx-auto max-w-[1320px] px-4 pt-[clamp(2.5rem,6vw,4.5rem)] md:px-10">
      <Reveal as="div">
        <div
          className={`relative overflow-hidden ${CARD_R}`}
          style={{ background: "radial-gradient(circle at 50% 50%, #c1a27a 0%, #9a7843 100%)" }}
        >
          <div className="relative flex flex-col items-center gap-8 px-6 pb-0 pt-10 text-center sm:px-10 lg:min-h-[clamp(26rem,52vw,43rem)] lg:flex-row lg:items-end lg:gap-0 lg:pt-0 lg:text-left">
            <div className="order-2 w-full max-w-[26rem] lg:order-1 lg:max-w-none lg:flex-[0_0_46%]">
              <img
                src="/site/skin-health/routine-figure.avif"
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="block h-auto w-full object-contain object-bottom lg:absolute lg:bottom-0 lg:left-0 lg:h-[90%] lg:w-[48%] lg:object-cover lg:object-[56%_center]"
              />
            </div>
            <div className="order-1 lg:order-2 lg:flex-1 lg:self-start lg:pl-4 lg:pt-[clamp(2rem,9vw,7.5rem)]">
              <h2
                className="nv-weight-keep mx-auto max-w-[22ch] font-display text-[clamp(1.5rem,5vw,2.9rem)] font-extrabold leading-[1.12] lg:mx-0"
                style={{ color: CREAM }}
              >
                Beyond your <span className="lg:block">daily routine</span>
              </h2>

              <p className="mx-auto mt-5 max-w-[44ch] text-[clamp(0.76rem,2.3vw,0.92rem)] leading-relaxed text-white/90 lg:mx-0">
                Explore provider-guided options for common skin concerns
              </p>

              <p className="mx-auto mt-2 max-w-[44ch] text-[clamp(0.7rem,2vw,0.82rem)] leading-relaxed text-white/75 lg:mx-0">
                Provider-guided options for individual skin concerns
              </p>

              <Link
                to={startTo}
                className="mt-6 inline-flex rounded-full px-7 py-3 text-[0.85rem] font-medium transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: PILL, color: INK }}
              >
                See Your Options
              </Link>
            </div>
            <img
              src="/products/luminance.avif"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="pointer-events-none absolute -bottom-[3%] -right-[6%] hidden h-[74%] w-auto max-w-none rotate-[14deg] object-contain drop-shadow-[0_20px_36px_rgba(70,54,26,0.34)] lg:block"
            />
          </div>
        </div>
      </Reveal>
    </div>
  );
}

/* ------------------------------- 4. the goal ------------------------------- */

/* A staggered row whose labels sit *inside* the frame in white
   rather than under it — that is the difference the comp draws between "what you
   are seeing now" and "what you are working toward".

   Cards three and four carry the same wording in the comp. Left as supplied. */
const GOAL = [
  {
    img: "/site/skin-health/goal-clear.avif",
    label: "What we're working toward",
    lift: "",
    plot: true,
  },
  {
    img: "/site/skin-health/goal-change.avif",
    label: "The kind of change you want to see",
    lift: "sm:translate-y-6",
  },
  {
    img: "/site/skin-health/goal-even.avif",
    label: "For skin that looks more even and refreshed",
    lift: "sm:translate-y-2",
  },
  {
    img: "/site/skin-health/goal-refreshed.avif",
    label: "For skin that looks more even and refreshed",
    lift: "sm:translate-y-8",
  },
];

function TheGoal() {
  return (
    <div className="mx-auto max-w-[1320px] px-6 pt-[clamp(3rem,7vw,5.5rem)] md:px-10">
      <Reveal as="div">
        <h2 className="nv-weight-keep font-display text-[clamp(1.4rem,4.6vw,2.2rem)] font-extrabold leading-[1.24]">
          <span className="block" style={{ color: GOLD_DEEP }}>
            The goal?
          </span>
          <span className="block" style={{ color: GOLD_LIGHT }}>
            Skin you feel good about
          </span>
        </h2>

        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-4 sm:gap-x-5">
          {GOAL.map((g) => (
            <li key={g.img} className={g.lift}>
              <div className={`relative overflow-hidden ${TILE_R}`}>
                <img
                  src={g.img}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="block aspect-[2/3] w-full object-cover"
                />

                {/* The rising line over the first frame, per the comp. Drawn
                    rather than baked into the photograph so it stays crisp and
                    the shot underneath can be swapped on its own. */}
                {g.plot && (
                  <svg
                    viewBox="0 0 100 60"
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-[22%] h-auto w-full"
                    preserveAspectRatio="none"
                  >
                    <polyline
                      points="12,44 30,20 44,38 60,10 82,30"
                      fill="none"
                      stroke="rgba(255,255,255,0.9)"
                      strokeWidth="1.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                )}

                {/* Just enough veil at the foot to carry white type over a light
                    photograph, without washing the skin tones above it. */}
                <span
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
                  style={{ background: "linear-gradient(180deg, transparent, rgba(40,28,16,0.55))" }}
                />
                <p className="absolute inset-x-0 bottom-0 p-4 text-[clamp(0.7rem,2vw,0.8rem)] font-bold leading-snug text-white">
                  {g.label}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  );
}

/* ------------------------------ 5. guided panel ----------------------------- */

const GUIDED = [
  "Tell us about your skin, health history, current medications, and treatment goals",
  "A licensed physician reviews your information and determines whether prescription treatment is medically appropriate for you.",
];

function Guided() {
  return (
    <div className="mx-auto max-w-[1320px] px-6 pt-[clamp(3rem,7vw,5.5rem)] md:px-10">
      <Reveal as="div">
        <div className="grid gap-9 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div>
            <h2
              className="nv-weight-keep max-w-[15ch] font-display text-[clamp(1.5rem,5vw,2.4rem)] font-extrabold leading-[1.16]"
              style={{ color: GOLD }}
            >
              You don&apos;t need to figure everything out on your own
            </h2>

            <ul className="mt-7 grid gap-4">
              {GUIDED.map((g) => (
                <li key={g} className="flex items-start gap-3">
                  <CheckDot />
                  <span
                    className="max-w-[46ch] text-[clamp(0.76rem,2.3vw,0.86rem)] leading-relaxed"
                    style={{ color: INK }}
                  >
                    {g}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Squarer than the source frame, which is a tall portrait: the comp
              crops it to sit level with the copy beside it rather than running
              past the bottom of the column. */}
          <div className={`overflow-hidden ${CARD_R}`}>
            <img
              src="/site/skin-health/guided-skin.avif"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="block aspect-[5/4] w-full object-cover"
            />
          </div>
        </div>

        <p
          className="mt-9 max-w-[52ch] text-[clamp(0.68rem,2vw,0.76rem)] italic leading-relaxed"
          style={{ color: MUTED }}
        >
          Prescription treatment is available only when medically appropriate and prescribed by a
          licensed healthcare provider. Individual results may vary.
        </p>
      </Reveal>
    </div>
  );
}

/* ----------------------------- 5. closing band ---------------------------- */

function ExploreBand({ startTo }) {
  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-[clamp(3rem,6vw,5rem)] pt-[clamp(3rem,7vw,5.5rem)] md:px-10">
      <Reveal>
        <div
          className={`relative flex min-h-[clamp(22rem,52vw,40rem)] items-end justify-center overflow-hidden px-6 pb-[clamp(2rem,4.5vw,3.5rem)] ${CARD_R}`}
          style={{ background: "radial-gradient(circle at 52% 44%, #c3a670 0%, #a2854b 100%)" }}
        >
          <img
            src="/site/skin-health/explore-figure.avif"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="nv-bandfade pointer-events-none absolute bottom-0 left-1/2 h-[97%] w-auto max-w-none -translate-x-1/2 object-contain object-bottom"
          />

          <div className="relative z-10 text-center">
            <h2
              className="nv-weight-keep mx-auto max-w-[12ch] font-display text-[clamp(1.6rem,4.4vw,3.1rem)] font-extrabold leading-[1.12]"
              style={{ color: CREAM }}
            >
              Explore Skin Health
            </h2>

            <Link
              to={startTo}
              className="mt-5 inline-flex rounded-full border px-7 py-2.5 text-[0.9rem] font-medium transition-all duration-300 hover:-translate-y-0.5"
              style={{ borderColor: "rgba(241,228,194,0.6)", color: CREAM }}
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

export default function SkinHealthSections({ startTo = "/start" }) {
  return (
    <div style={{ background: GROUND }}>
      <HeroCard startTo={startTo} />
      <BeyondRoutine startTo={startTo} />
      <TheGoal />
      <Guided />
      <ExploreBand startTo={startTo} />
    </div>
  );
}
