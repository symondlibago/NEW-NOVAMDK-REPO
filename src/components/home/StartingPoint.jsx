import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Reveal from "../ui/Reveal";
import { visibleProducts } from "../data/products";
import { productPath } from "../../lib/slug";
import { stageOf, displayTitle } from "../../lib/catalog";
import { SafetySheet } from "../product/ProductSafety";

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

/* Where the rail is, as a thumb on a short track under it: its width is the
   share of the rail on screen and it slides with the scroll. */
function useRailMeter(ref) {
  const [meter, setMeter] = React.useState({ left: 0, width: 0.3 });
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const read = () => {
      const w = el.scrollWidth || 1;
      setMeter({ left: el.scrollLeft / w, width: Math.min(1, el.clientWidth / w) });
    };
    read();
    el.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      el.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, [ref]);
  return meter;
}

/* Laid out after the client's comp (2026-10-12): the heading with its line and
   "View all options" across the top in place of the lead card, product cards
   with their own safety link, and a swipe hint, meter and arrows under the
   rail. */
export default function StartingPoint() {
  const trackRef = useDragScroll();
  const meter = useRailMeter(trackRef);
  const [safetyFor, setSafetyFor] = React.useState(null);

  const nudge = (dir) => {
    const el = trackRef.current;
    const first = el?.firstElementChild;
    if (!first) return;
    el.scrollBy({ left: dir * (first.getBoundingClientRect().width + 20), behavior: "smooth" });
  };

  return (
    /* From md the band fills one screen under the sticky header and centres
       the rail in it (2026-09-15). White ground to match the page. */
    <section className="flex w-full flex-col justify-center overflow-hidden bg-white md:min-h-[calc(100svh-69px)] [@media(min-width:600px)_and_(orientation:portrait)]:min-h-0">
      <div className="mx-auto flex w-full max-w-[1340px] flex-col gap-5 px-5 pb-[clamp(1.5rem,3vw,2.25rem)] pt-[clamp(2rem,4vw,3rem)] md:flex-row md:items-end md:justify-between md:px-10">
        <Reveal>
          <h2 className="nv-weight-keep font-display text-[clamp(1.9rem,4.4vw,3.1rem)] font-semibold leading-[1.08] tracking-tight">
            <span className="block text-ink">Find the right</span>
            <span className="block" style={{ color: "#b39258" }}>
              starting point
            </span>
          </h2>
        </Reveal>
        <Reveal as="div" delay={0.06} className="md:max-w-[22rem]">
          <p className="text-[1.02rem] leading-snug text-ink">Explore care options through online provider review.</p>
          <Link
            to="/treatments"
            className="group mt-3 inline-flex items-center gap-2 rounded-full border border-[#c9ab7c] px-6 py-2.5 text-[0.92rem] font-semibold text-ink transition-colors hover:bg-[#f5efe4]"
          >
            View all options
            <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
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
        className="no-scrollbar flex cursor-grab select-none gap-5 overflow-x-auto overscroll-x-contain px-5 pb-6 pt-2 md:px-10"
      >
        {CARDS.map((p) => (
          <div
            key={p.id}
            className={`flex w-80 shrink-0 flex-col border border-[#ece3d3] bg-[#fbf8f2] p-6 shadow-[0_6px_24px_rgba(90,70,30,0.07)] sm:w-96 lg:w-104 ${CARD_R}`}
          >
            <h3 className="nv-weight-keep font-display text-[clamp(1.3rem,1.8vw,1.55rem)] font-medium leading-tight text-ink">
              {displayTitle(p)}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip>{p.categoryName}</Chip>
            </div>

            {/* grow so every card's buttons sit on the same line whatever the
                title wraps to. */}
            <div className="grid grow place-items-center py-2">
              <ProductArt src={p.img} />
            </div>

            <button
              type="button"
              onClick={() => setSafetyFor(p)}
              className="mx-auto mb-4 text-[0.86rem] font-medium text-ink underline decoration-[#c9ab7c] underline-offset-4 hover:decoration-ink"
            >
              Important safety information
            </button>

            <div className="flex items-center gap-2.5">
              <Link
                to={`${productPath(p)}?start=1`}
                className="flex-1 rounded-full bg-[#b39258] px-4 py-3 text-center text-[0.88rem] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#a5854f]"
              >
                Get Started
              </Link>
              <Link
                to={productPath(p)}
                className="flex-1 rounded-full border border-[#c9ab7c] bg-white px-4 py-3 text-center text-[0.88rem] font-semibold text-ink transition-colors hover:bg-[#f5efe4]"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto grid w-full max-w-[1340px] grid-cols-[1fr_auto] items-center gap-4 px-5 md:grid-cols-[1fr_auto_1fr] md:px-10">
        <p className="text-[0.86rem] text-muted">Swipe to explore more treatments</p>
        <span aria-hidden="true" className="relative block h-1 w-28 overflow-hidden rounded-full bg-[#ece3d3] md:w-44">
          <span
            className="absolute inset-y-0 rounded-full bg-[#b39258] transition-[left] duration-150"
            style={{ left: `${meter.left * 100}%`, width: `${meter.width * 100}%` }}
          />
        </span>
        <div className="hidden justify-end gap-2.5 md:flex">
          <button
            type="button"
            onClick={() => nudge(-1)}
            aria-label="Previous treatments"
            className="grid h-11 w-11 place-items-center rounded-full border border-[#c9ab7c] text-ink transition-colors hover:bg-[#f5efe4]"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => nudge(1)}
            aria-label="More treatments"
            className="grid h-11 w-11 place-items-center rounded-full border border-[#c9ab7c] text-ink transition-colors hover:bg-[#f5efe4]"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
      <p className="px-5 pb-[clamp(2rem,4vw,3rem)] pt-4 text-center text-[0.8rem] text-muted">
        Prescription treatment requires provider evaluation.
      </p>

      {/* The same Important Safety Information panel the product page opens. */}
      <SafetySheet product={safetyFor || CARDS[0]} open={Boolean(safetyFor)} onClose={() => setSafetyFor(null)} />
    </section>
  );
}
