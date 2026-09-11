import React from "react";
import { Link } from "react-router-dom";
import { BarChart3, Calendar, ChevronRight, Heart, Zap } from "lucide-react";
import Reveal from "../ui/Reveal";

/**
 * "Starts With What Matters To You" — the glass dashboard band (2026-09-11).
 *
 * The figure is a full-bleed cover photo, untouched: its own studio backdrop
 * runs tan at the top to cream at the bottom, which is the band's ground. The
 * cards are real glass over it, and that is the only blur here.
 *
 * The progress curve is the NAD+ graph's machinery — same gold ramp, same haze
 * under the line, same draw-in — turned the other way up, since this one is
 * showing a rise rather than a decline.
 */

/*
|--------------------------------------------------------------------------
| GLASS
|--------------------------------------------------------------------------
| Transcribed from the Figma layer rather than eyeballed, because the sharpness
| is entirely in the two inner shadows and the half-pixel rim, not in the fill:
|
|   Fill    #FFFFFF 2%
|   Stroke  linear gradient, inside, 0.5
|   Effect  inner shadow  0 -2  blur 4  #000000 20%
|   Effect  inner shadow  0  2  blur 4  #FFFFFF 40%
|   Effect  glass: frost 54, refraction 75, dispersion 35
|
| A near-zero fill is what keeps the photo readable through the card. An
| earlier pass used 16% white and the cards went milky, which flattened the
| lit top edge into the fill and lost the whole effect.
*/
const GLASS = {
  background: "rgba(255,255,255,0.02)",
  /* Frost only. A saturate() boost was tried with it and pushed the whole
     card orange, because the backdrop here is skin and warm tan. */
  backdropFilter: "blur(26px)",
  WebkitBackdropFilter: "blur(26px)",
  boxShadow:
    "inset 0 2px 4px rgba(255,255,255,0.40), inset 0 -2px 4px rgba(0,0,0,0.20)",
};

/* Figma's "refraction" catches the light along the top-left and again faintly
   at the bottom-right. CSS has no gradient border, so the rim is a masked
   overlay: a gradient-filled box with its own middle punched out, leaving only
   the half-pixel edge. */
const RIM = {
  padding: "0.5px",
  background:
    "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.46) 38%, rgba(255,255,255,0.32) 64%, rgba(255,255,255,0.78) 100%)",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  maskComposite: "exclude",
};

function Rim({ radius = "rounded-3xl" }) {
  return (
    <span aria-hidden="true" className={`pointer-events-none absolute inset-0 ${radius}`} style={RIM} />
  );
}

const GOALS = [
  { icon: BarChart3, label: "Weight Management", pct: 58 },
  { icon: Zap, label: "Energy & Wellness", pct: 38 },
  { icon: Heart, label: "Sexual Health", pct: 26 },
];

/*
|--------------------------------------------------------------------------
| PROGRESS CURVE
|--------------------------------------------------------------------------
*/

/* Five points, read off the comp: a gentle lift, a climb, a level stretch,
   then the run to the top right. Cubics rather than a polyline because the
   comp's line eases through each marker instead of turning a corner at it. */
const DOTS = [
  [14, 86],
  [72, 72],
  [148, 40],
  [220, 38],
  [300, 14],
];

const CURVE = `
  M 14 86
  C 34 84, 52 76, 72 72
  C 100 66, 118 46, 148 40
  C 172 35, 196 40, 220 38
  C 248 36, 272 28, 300 14
`;

/* The haze carries on past both ends of the line and down to the floor of the
   box, so it reads as light coming off the curve rather than as a shape with
   the same start and finish as the line. */
const CURVE_AREA = `
  M 0 89
  L 14 86
  C 34 84, 52 76, 72 72
  C 100 66, 118 46, 148 40
  C 172 35, 196 40, 220 38
  C 248 36, 272 28, 300 14
  L 320 9
  L 320 104
  L 0 104
  Z
`;

/* Rolls through random digits and settles on the real figure, the way a counter
   wheel lands. Each roll is slower than the last, so the number decelerates
   onto its value instead of stopping dead on it. */
const ROLLS = 11;

function useSlotCount(target, on) {
  const [n, setN] = React.useState(target);

  React.useEffect(() => {
    if (!on) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    let id = 0;
    let step = 0;
    const rand = () => 1 + Math.floor(Math.random() * 9);

    const roll = () => {
      step += 1;
      if (step >= ROLLS) {
        setN(target);
        return;
      }
      setN(rand());
      id = setTimeout(roll, 55 + step * step * 2);
    };

    setN(rand());
    id = setTimeout(roll, 55);
    return () => clearTimeout(id);
  }, [target, on]);

  return n;
}

/* Runs the card's animations once, the first time it is scrolled to. */
function useRunOnceInView() {
  const ref = React.useRef(null);
  const [on, setOn] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.unobserve(e.target);
        }
      },
      { threshold: 0.35 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return [ref, on];
}

function ActiveGoals() {
  const [ref, on] = useRunOnceInView();
  const count = useSlotCount(3, on);

  return (
    <div
      ref={ref}
      className={`relative flex h-full flex-col rounded-3xl p-6 sm:p-7 ${on ? "is-in" : ""}`}
      style={GLASS}
    >
      <Rim />

      {/* ---- the ring ---- */}
      <div className="relative mx-auto h-40 w-40 shrink-0 sm:h-44 sm:w-44">
        <svg viewBox="0 0 100 100" aria-hidden="true" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.26)" strokeWidth="2.5" />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinecap="round"
            pathLength="1"
            strokeDasharray="0.27 1"
            className="nv-mty-ring"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center text-white">
          <div>
            {/* tabular-nums so the rolling digits all occupy the same width
                and the number does not jitter on its way to 3. */}
            <span className="block font-display text-[2.9rem] font-extrabold leading-none tabular-nums">
              {count}
            </span>
            <span className="mt-1 block text-[0.85rem] font-bold leading-tight">
              Active
              <br />
              Goals
            </span>
          </div>
        </div>
      </div>

      {/* ---- the three tracked goals ----
              Inset well inside the card's own padding, as the comp has them:
              the rows sit visibly narrower than the button below, which is
              what stops the card reading as a full-width list. */}
      <ul className="mt-6 grow px-4 sm:px-10">
        {GOALS.map((g, i) => (
          <li
            key={g.label}
            className={`nv-mty-row flex items-center gap-3 py-3.5 ${i > 0 ? "border-t border-white/20" : ""}`}
            style={{ animationDelay: `${0.42 + i * 0.16}s` }}
          >
            <g.icon size={22} strokeWidth={1.8} className="shrink-0 text-white/85" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <span className="block truncate text-[0.9rem] font-medium text-white/90">{g.label}</span>
              <span aria-hidden="true" className="mt-2 block h-0.75 w-full rounded-full bg-white/25">
                <span
                  className="nv-mty-bar block h-full rounded-full bg-white"
                  style={{ "--w": `${g.pct}%`, animationDelay: `${0.62 + i * 0.16}s` }}
                />
              </span>
            </div>
          </li>
        ))}
      </ul>

      <Link
        to="/treatments"
        className="mt-5 block rounded-full bg-white px-5 py-3 text-center text-[0.9rem] font-semibold text-[#6d5934] transition-transform duration-300 hover:-translate-y-0.5"
      >
        See What Fits For You
      </Link>
    </div>
  );
}

function NextCheckIn() {
  return (
    <Link
      to="/portal"
      className="group relative flex items-center gap-5 rounded-3xl p-6 sm:gap-8 sm:p-7"
      style={GLASS}
    >
      <Rim />

      <span
        aria-hidden="true"
        className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-white/90 sm:h-20 sm:w-20"
        style={GLASS}
      >
        <Rim radius="rounded-2xl" />
        <Calendar size={34} strokeWidth={1.6} />
      </span>

      {/* No flex-1 on the copy and the chevron pushed out with ml-auto, so the
          text block sits on the card's centre line instead of being stretched
          across the whole remaining width and reading left-heavy. */}
      <span className="min-w-0">
        <span className="block text-[0.9rem] text-white/70">Next Check-In</span>
        <span className="mt-1 block font-display text-[clamp(1.3rem,1.9vw,1.7rem)] font-extrabold leading-tight text-white">
          In 14 Days
        </span>
        <span className="mt-1.5 block max-w-[18ch] text-[0.9rem] leading-snug text-white/70">
          Stay on track with ongoing care
        </span>
      </span>

      <ChevronRight
        size={30}
        strokeWidth={1.7}
        aria-hidden="true"
        className="ml-auto shrink-0 text-white/70 transition-transform duration-300 group-hover:translate-x-1"
      />
    </Link>
  );
}

function YourProgress() {
  const [ref, on] = useRunOnceInView();

  return (
    <div
      ref={ref}
      className={`relative flex flex-col rounded-3xl p-6 sm:p-7 ${on ? "is-in" : ""}`}
      style={GLASS}
    >
      <Rim />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-[clamp(1.3rem,1.8vw,1.6rem)] font-extrabold leading-tight text-white">
            Your Progress
          </h3>
          <p className="mt-0.5 text-[0.88rem] text-white/70">Last 30 days</p>
        </div>

        <span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[0.72rem] font-semibold text-[#5d4a2e]"
          style={{ background: "rgba(255,255,255,0.72)" }}
        >
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#a9884f]" />
          On Track
        </span>
      </div>

      <svg viewBox="0 0 320 104" aria-hidden="true" className="my-auto block h-auto w-full overflow-visible pt-4">
        <defs>
          {/* Runs bottom-left to top-right, following the line rather than the
              box, so the ramp reads along the curve. */}
          <linearGradient id="nv-mty-line" x1="14" y1="86" x2="300" y2="14" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#bb8c2f" />
            <stop offset="50%" stopColor="#c2953a" />
            <stop offset="100%" stopColor="#cdaa4f" />
          </linearGradient>

          {/* The golden cast the comp throws under the line. Cream at the top
              of the wedge falling through tan to nothing, rather than the flat
              near-white haze this had before. */}
          <linearGradient id="nv-mty-area" x1="0" y1="6" x2="0" y2="104" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffeec9" stopOpacity="0.95" />
            <stop offset="26%" stopColor="#f6d8a2" stopOpacity="0.62" />
            <stop offset="55%" stopColor="#eccb8d" stopOpacity="0.30" />
            <stop offset="80%" stopColor="#e4bf7c" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#e4bf7c" stopOpacity="0" />
          </linearGradient>

          <filter id="nv-mty-blur" x="-30%" y="-40%" width="170%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>

          {/* Softens the shadow the line casts onto the haze below it. */}
          <filter id="nv-mty-shadow" x="-30%" y="-60%" width="170%" height="260%">
            <feGaussianBlur stdDeviation="3.2" />
          </filter>

          <filter id="nv-mty-glow" x="-30%" y="-80%" width="170%" height="320%">
            <feGaussianBlur stdDeviation="7" />
          </filter>

          {/* Without this the haze ends on a hard vertical edge and reads as a
              lit rectangle rather than a glow. */}
          <linearGradient id="nv-mty-ends" x1="0" y1="0" x2="320" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="black" />
            <stop offset="12%" stopColor="white" />
            <stop offset="88%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </linearGradient>

          <mask id="nv-mty-area-mask">
            <rect x="-20" y="-20" width="360" height="150" fill="url(#nv-mty-ends)" />
          </mask>
        </defs>

        <path
          d={CURVE_AREA}
          fill="url(#nv-mty-area)"
          mask="url(#nv-mty-area-mask)"
          filter="url(#nv-mty-blur)"
          className="nv-mty-area"
        />
        <path
          d={CURVE_AREA}
          fill="url(#nv-mty-area)"
          mask="url(#nv-mty-area-mask)"
          className="nv-mty-area nv-mty-area-inner"
        />

        {/* A wide, soft gold band riding just under the line. The wedge alone
            is a flat vertical ramp, so where the curve is low the colour under
            it had already faded out; this rides the curve and keeps the cast
            tight to it along the whole run. */}
        <path
          d={CURVE}
          pathLength="1"
          fill="none"
          stroke="#e9c684"
          strokeWidth="15"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.38"
          transform="translate(0 9)"
          filter="url(#nv-mty-glow)"
          mask="url(#nv-mty-area-mask)"
          className="nv-mty-draw nv-mty-glow"
        />

        {/* The bright edge of that cast, kept narrow and close in. Without it
            the glow is one flat warm wedge and the line has nothing to sit
            against. */}
        <path
          d={CURVE}
          pathLength="1"
          fill="none"
          stroke="#fff3d8"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.55"
          transform="translate(0 4.5)"
          filter="url(#nv-mty-shadow)"
          mask="url(#nv-mty-area-mask)"
          className="nv-mty-draw nv-mty-glow"
        />

        {/* The shadow the line drops onto the haze. No vectorEffect on any of
            the drawn paths: it resolves the stroke in screen units, which
            breaks pathLength="1" dash normalisation and left the line stopping
            short of the last marker. Stroke widths are in viewBox units
            instead, which scale with the card. */}
        <path
          d={CURVE}
          pathLength="1"
          fill="none"
          stroke="#6f5320"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.34"
          transform="translate(0 3.6)"
          filter="url(#nv-mty-shadow)"
          className="nv-mty-draw nv-mty-shadow"
        />

        <path
          d={CURVE}
          pathLength="1"
          fill="none"
          stroke="#e6cf9c"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.26"
          className="nv-mty-draw nv-mty-halo"
        />

        <path
          d={CURVE}
          pathLength="1"
          fill="none"
          stroke="url(#nv-mty-line)"
          strokeWidth="2.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="nv-mty-draw nv-mty-main"
        />

        {DOTS.map(([cx, cy], i) => (
          <circle
            key={cx}
            cx={cx}
            cy={cy}
            r="4.2"
            fill="#fdf6e6"
            stroke="#bc8e39"
            strokeWidth="1.5"
            className="nv-mty-dot"
            style={{ animationDelay: `${0.5 + i * 0.2}s` }}
          />
        ))}
      </svg>
    </div>
  );
}

export default function MattersToYou() {
  return (
    <section className="relative isolate w-full overflow-hidden">
      <img
        src="/site/matters-hero.avif"
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-[50%_28%]"
      />

      <style>{`
        .nv-mty-ring { stroke-dashoffset: 0.27; }
        .is-in .nv-mty-ring { animation: nvMtyRing 1.1s cubic-bezier(0.22,1,0.36,1) 0.15s forwards; }

        /* The row arrives, then its bar fills: the two together read as the
           card loading its data rather than as three bars simply appearing. */
        .nv-mty-row { opacity: 0; transform: translateY(10px); }
        .is-in .nv-mty-row { animation: nvMtyRow 0.65s cubic-bezier(0.22,1,0.36,1) forwards; }

        .nv-mty-bar { width: 0; }
        .is-in .nv-mty-bar { animation: nvMtyBar 1.4s cubic-bezier(0.22,1,0.36,1) forwards; }

        .nv-mty-draw { stroke-dasharray: 1; stroke-dashoffset: 1; }
        .is-in .nv-mty-main { animation: nvMtyDraw 1.6s cubic-bezier(0.4,0,0.2,1) 0.2s forwards; }
        .is-in .nv-mty-halo { animation: nvMtyDraw 1.6s cubic-bezier(0.4,0,0.2,1) 0.26s forwards; }
        .is-in .nv-mty-shadow { animation: nvMtyDraw 1.6s cubic-bezier(0.4,0,0.2,1) 0.3s forwards; }
        .is-in .nv-mty-glow { animation: nvMtyDraw 1.6s cubic-bezier(0.4,0,0.2,1) 0.34s forwards; }

        .nv-mty-area { opacity: 0; }
        .is-in .nv-mty-area { animation: nvMtyFade 1.2s ease-out 0.5s forwards; }
        .is-in .nv-mty-area-inner { animation: nvMtyFadeInner 1.2s ease-out 0.55s forwards; }

        .nv-mty-dot { opacity: 0; transform: scale(0.5); transform-box: fill-box; transform-origin: center; }
        .is-in .nv-mty-dot { animation: nvMtyDot 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }

        @keyframes nvMtyRing { to { stroke-dashoffset: 0; } }
        @keyframes nvMtyRow { to { opacity: 1; transform: none; } }
        @keyframes nvMtyBar { to { width: var(--w); } }
        @keyframes nvMtyDraw { to { stroke-dashoffset: 0; } }
        @keyframes nvMtyFade { to { opacity: 1; } }
        @keyframes nvMtyFadeInner { to { opacity: 0.66; } }
        @keyframes nvMtyDot { to { opacity: 1; transform: scale(1); } }

        @media (prefers-reduced-motion: reduce) {
          .nv-mty-ring, .nv-mty-draw { stroke-dashoffset: 0 !important; animation: none !important; }
          .nv-mty-row { opacity: 1 !important; transform: none !important; animation: none !important; }
          .nv-mty-bar { width: var(--w) !important; animation: none !important; }
          .nv-mty-area { opacity: 0.5 !important; animation: none !important; }
          .nv-mty-dot { opacity: 1 !important; transform: none !important; animation: none !important; }
        }
      `}</style>

      <div className="relative mx-auto max-w-310 px-5 py-[clamp(2.75rem,6vw,4.75rem)] md:px-10">
        <Reveal className="text-center">
          <h2 className="nv-weight-keep font-display text-[clamp(2rem,4.6vw,3.9rem)] font-extrabold leading-[1.1] tracking-tight text-white">
            <span className="block">Starts With What</span>
            <span className="block">Matters To You</span>
          </h2>

          <p className="mx-auto mt-4 max-w-[46ch] text-[clamp(0.95rem,1.35vw,1.15rem)] leading-relaxed text-white/85">
            Explore treatment options for your health goals and take the next step when you&rsquo;re
            ready
          </p>

          <div className="mt-7 flex w-full max-w-sm flex-col gap-3 sm:mx-auto sm:max-w-none sm:flex-row sm:justify-center">
            {/* Solid white in the comp, against the outlined secondary. */}
            <Link
              to="/treatments"
              className="inline-flex h-13 items-center justify-center rounded-full bg-white px-8 text-[0.98rem] font-semibold text-[#6d5934] transition-transform duration-300 hover:-translate-y-0.5"
            >
              Explore Treatments
            </Link>
            {/* A plain white ring rather than the cards' gradient rim: at pill
                size the gradient's faint stretch swallowed most of the outline
                and the button read as a solid tan blob. */}
            <Link
              to="/start"
              className="inline-flex h-13 items-center justify-center rounded-full border border-white/75 bg-white/5 px-8 text-[0.98rem] font-semibold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15"
            >
              Get Started
            </Link>
          </div>
        </Reveal>

        {/* One column on a phone, then the comp's split: the goals card runs the
            full height beside two stacked cards of matching size. */}
        <div className="mx-auto mt-[clamp(1.75rem,4vw,2.75rem)] grid max-w-225 gap-5 md:grid-cols-2 md:gap-8">
          <Reveal className="h-full">
            <ActiveGoals />
          </Reveal>
          {/* Two equal grid rows from md up, so the pair is exactly the same
              size. flex-grow was tried first and could not do it: a flex item
              will not shrink under its own content, so the taller card kept
              its content height and the other one came out short. */}
          <Reveal delay={0.08} className="flex h-full flex-col gap-5 md:grid md:grid-rows-2 md:gap-8">
            <NextCheckIn />
            <YourProgress />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
