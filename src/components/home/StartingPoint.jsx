import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "../ui/Reveal";
import { visibleProducts } from "../data/products";
import { productPath } from "../../lib/slug";
import { stageOf, displayTitle } from "../../lib/catalog";

/**
 * "Find the Right Starting Point" — the swipeable product rail under the goals
 * band (2026-09-11).
 *
 * Scrolling is native overflow rather than a transform-driven carousel. A JS
 * carousel has to own the pointer to work, and that is exactly what makes a
 * swipe feel broken: it fights momentum, drops the gesture when a finger leaves
 * the track, and cannot be flung. Native scrolling gets real inertia on every
 * platform for free.
 *
 * Free scrolling, no scroll-snap. Snapping was tried and removed: even at
 * `proximity` the browser pulls toward the nearest card while the drag is still
 * in progress, so the rail lurched a card at a time under the cursor instead of
 * tracking it. Without it the rail follows the pointer exactly.
 */

/* The line from the earlier home rail. SubMagna Drops is swapped for
   Glutathione at the client's request (2026-09-11); the rail already carried
   two weight-loss entries, so the slot was better spent on another category.
   Matched on name because these are the marketing names, not the ladder rungs:
   the catalogue splits most of them into Starter / Mid-Dose / Maintenance and
   only the base record should appear here. */
const PICKS = [
  "Tirzepatide",
  "Semaglutide",
  "Low-Dose Naltrexone",
  "Luminance",
  "Olympus Peak",
  "NAD+ Injection",
  "Glutathione Injection",
];

const CARDS = PICKS.map((pick) => {
  const hit =
    visibleProducts.find((p) => !stageOf(p) && displayTitle(p).startsWith(pick)) ||
    visibleProducts.find((p) => stageOf(p) === "Starter" && displayTitle(p).startsWith(pick)) ||
    visibleProducts.find((p) => displayTitle(p).startsWith(pick));
  return hit || null;
}).filter(Boolean);

/* The comp's fill on the lead card: D5B584 at 9% down to 97784A at 80%. */
const LEAD = "linear-gradient(180deg, #d5b584 9%, #97784a 80%)";
const CARD_R = "rounded-3xl";

/* Native overflow gives touch its inertia for free, but a mouse cannot grab a
   scroll container: on a desktop the rail was only reachable by trackpad or
   shift+wheel. This adds click-and-drag for mouse pointers ONLY — touch and pen
   fall through to the browser, which already does it better than any handler
   could. The click capture at the end matters: without it, releasing a drag
   over a card fires that card's link and navigates away mid-swipe. */
/* How long the rail rests on a card before stepping to the next. */
const AUTO_MS = 3600;
/* One card step, and the longer run back to the start. */
const STEP_MS = 750;
const REWIND_MS = 1100;

/* easeInOutCubic. The tween is hand-rolled rather than `scroll-behavior:
   smooth` because that gives no control over duration, so a one-card step and
   a full rewind would take the same time and the rewind would look frantic. */
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function useDragScroll() {
  const ref = React.useRef(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    let down = false;
    let moved = false;
    let startX = 0;
    let startLeft = 0;
    let hover = false;
    let raf = 0;

    const cancelTween = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const tweenTo = (target, dur) => {
      cancelTween();
      const from = el.scrollLeft;
      const delta = target - from;
      if (Math.abs(delta) < 1) return;
      const t0 = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - t0) / dur);
        el.scrollLeft = from + delta * ease(t);
        raf = t < 1 ? requestAnimationFrame(step) : 0;
      };
      raf = requestAnimationFrame(step);
    };

    /* Measured off the live card rather than hard-coded, so it stays correct
       across the sm width change and any future card resize. */
    const cardStep = () => {
      const first = el.firstElementChild;
      if (!first) return 320;
      const gap = parseFloat(getComputedStyle(el).columnGap) || 16;
      return first.getBoundingClientRect().width + gap;
    };

    const advance = () => {
      /* Never fight the reader: paused while dragging, while the pointer is
         over the rail, and while the tab is in the background. */
      if (down || hover || document.hidden) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      if (el.scrollLeft >= max - 2) tweenTo(0, REWIND_MS);
      else tweenTo(Math.min(max, el.scrollLeft + cardStep()), STEP_MS);
    };

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = still ? 0 : setInterval(advance, AUTO_MS);

    const onEnter = () => { hover = true; };
    const onLeave = () => { hover = false; };
    /* Any deliberate input kills the tween mid-flight, so the rail never
       wrestles the reader for the scroll position. */
    const onUserScroll = () => cancelTween();

    const onDown = (e) => {
      if (e.button !== 0) return;
      cancelTween();
      down = true;
      moved = false;
      startX = e.clientX;
      startLeft = el.scrollLeft;
      el.style.cursor = "grabbing";
      /* Stops the browser starting its own image/text drag, which swallows
         every subsequent move event. */
      e.preventDefault();
    };

    const onMove = (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      if (moved) {
        el.scrollLeft = startLeft - dx;
        e.preventDefault();
      }
    };

    const onUp = () => {
      down = false;
      el.style.cursor = "";
    };

    /* Capture phase, so it runs before the Link's own handler. */
    const onClick = (e) => {
      if (!moved) return;
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    };

    /* Mouse events, not pointer events. The pointerdown never reached this
       element — the cards' links and images consume it first — while mousedown
       arrives reliably. Touch is unaffected either way: a touch only emits
       compatibility mouse events after the gesture ends, so native scrolling
       and its inertia still own the swipe on a phone. */
    const onDragStart = (e) => e.preventDefault();

    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    el.addEventListener("click", onClick, true);
    el.addEventListener("dragstart", onDragStart);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("wheel", onUserScroll, { passive: true });
    el.addEventListener("touchstart", onUserScroll, { passive: true });

    return () => {
      cancelTween();
      if (timer) clearInterval(timer);
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      el.removeEventListener("click", onClick, true);
      el.removeEventListener("dragstart", onDragStart);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("wheel", onUserScroll);
      el.removeEventListener("touchstart", onUserScroll);
    };
  }, []);

  return ref;
}

function Chip({ children }) {
  return (
    <span className="rounded-full bg-[#efe4d2] px-3 py-1 text-[0.7rem] font-semibold text-[#6d5934]">
      {children}
    </span>
  );
}

/* Most catalogue renders sit in a square canvas with the product filling about
   82% of its height, so even drawn at the full box height the bottle floats in
   a band of empty frame. Those are scaled up into it. Tight crops (glutathione,
   253x542) already fill their file edge to edge and are left alone, or they
   would spill over the chips and buttons. Judged from the loaded file's own
   ratio rather than a list, so new art is handled without touching this, and
   unscaled until the file has loaded, so a failure lands on the safe side.
   The padding the box used to carry went into the box itself (py-6 to py-2,
   with the height up by the same 32px), so the card is exactly as tall. */
function ProductArt({ src }) {
  const ref = React.useRef(null);
  const [padded, setPadded] = React.useState(false);

  React.useEffect(() => {
    const img = ref.current;
    if (!img) return undefined;
    const judge = () =>
      setPadded(img.naturalWidth > 0 && img.naturalHeight / img.naturalWidth < 1.5);
    if (img.complete) judge();
    img.addEventListener("load", judge);
    return () => img.removeEventListener("load", judge);
  }, [src]);

  return (
    <img
      ref={ref}
      src={src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      /* Shorter on a short laptop window (1366x768 and the like), so the
         whole rail still lands inside one screen. */
      className={`pointer-events-none h-60 w-full object-contain lg:h-68 [@media(max-height:820px)]:lg:h-52 ${
        padded ? "scale-[1.2]" : ""
      }`}
    />
  );
}

export default function StartingPoint() {
  const trackRef = useDragScroll();

  return (
    /* From md the band fills one screen under the sticky header and centres
       the rail in it (2026-09-15). White ground to match the page. */
    <section className="flex w-full flex-col justify-center overflow-hidden bg-white md:min-h-[calc(100svh-69px)] [@media(min-width:600px)_and_(orientation:portrait)]:min-h-0">
      {/* The standfirst that sat beside the heading was dropped at the client's
          request (2026-09-25). The band keeps the roomier spacing it came with:
          the heading no longer sits hard against the rail. */}
      <div className="mx-auto w-full max-w-[1340px] px-5 pb-[clamp(2rem,4vw,3rem)] pt-[clamp(2rem,4vw,3rem)] md:px-10">
        <Reveal>
          <h2 className="nv-weight-keep font-display text-[clamp(1.9rem,4.4vw,3.1rem)] font-extrabold leading-[1.1] tracking-tight">
            <span className="block" style={{ color: "#b39258" }}>
              Find the Right
            </span>
            <span className="block" style={{ color: "#6d5934" }}>
              Starting Point
            </span>
          </h2>
        </Reveal>
      </div>

      {/* The track runs to the viewport edge rather than stopping at the
          container, so a card is always half-visible at the right and the rail
          reads as scrollable without needing an affordance. */}
      {/* No scroll-smooth: it applies to programmatic scrolls too, so it lags
          a whole frame behind the cursor while dragging. select-none stops the
          drag from highlighting card text. */}
      <div
        ref={trackRef}
        /* pt/pb leave the cards' shadow room: an overflow-x container clips
           vertically too. */
        className="no-scrollbar flex cursor-grab select-none gap-5 overflow-x-auto overscroll-x-contain px-5 pb-[clamp(2rem,4vw,3rem)] pt-2 md:px-10"
      >
        {/* Lead card */}
        <div
          className={`relative flex w-80 shrink-0 flex-col justify-center p-7 text-white sm:w-96 lg:w-104 ${CARD_R}`}
          style={{ background: LEAD }}
        >
          {/* The button is taken out of flow, so the copy centres against the
              whole card rather than against the space left above the button.
              In flow it was always pushed above the true centre by the button's
              own height, however the free space was distributed. */}
          <div>
            <h3 className="font-display text-[clamp(1.6rem,2.2vw,2rem)] font-extrabold leading-tight">
              Explore
              <br />
              Treatments
            </h3>
            <p className="mt-3 max-w-[30ch] text-[0.92rem] leading-relaxed text-white/85">
              Browse care options across weight management, sexual health, longevity, skin health,
              and more
            </p>
          </div>
          <Link
            to="/treatments"
            className="group absolute inset-x-7 bottom-7 inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-[0.92rem] font-semibold text-[#6d5934] transition-transform duration-300 hover:-translate-y-0.5"
          >
            View All Options
            <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {CARDS.map((p) => (
          /* On the white ground a white card needs its own edge: a hairline
             and a soft warm shadow. */
          <div
            key={p.id}
            className={`flex w-80 shrink-0 flex-col border border-[#ece3d3] bg-white p-6 shadow-[0_6px_24px_rgba(90,70,30,0.07)] sm:w-96 lg:w-104 ${CARD_R}`}
          >
            <h3 className="font-display text-[clamp(1.4rem,1.9vw,1.65rem)] font-extrabold leading-tight text-[#a5854f]">
              {displayTitle(p)}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip>{p.categoryName}</Chip>
              {p.priceSuffix !== "" && <Chip>Subscription</Chip>}
            </div>

            {/* grow so every card's buttons sit on the same line whatever the
                title wraps to. */}
            <div className="grid grow place-items-center py-2">
              <ProductArt src={p.img} />
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                to={`/start`}
                className="flex-1 rounded-full bg-[#c9ab7c] px-4 py-3 text-center text-[0.88rem] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#b8975e]"
              >
                Get Started
              </Link>
              <Link
                to={productPath(p)}
                className="flex-1 rounded-full border border-[#d9cdb8] px-4 py-3 text-center text-[0.88rem] font-semibold text-[#6d5934] transition-colors hover:bg-[#f5efe4]"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
