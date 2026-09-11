import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
/* Aliased: the project lint rule does not count `motion.div` as a use of the
   lowercase binding, so the capitalised alias keeps this file clean. */
import { motion as Motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { CONSULTS, CONSULT_ORDER } from "../data/consultations";
import { productsData, isHidden } from "../data/products";
import { GOAL_ART } from "../../lib/goalArt";
import { productPath } from "../../lib/slug";
import { track, EVENTS } from "../../lib/analytics";

const EASE = [0.22, 0.61, 0.18, 1];
/* shelf/tirzepatide.png is a Zepbound pen, not the vial the comp shows, so this
   points at the catalogue's own tirzepatide.avif — the same GIP/GLP-1 vial the
   treatments pages use. */
const FEATURED = {
  id: 5,
  name: "Tirzepatide",
  label: "Weight management",
  img: "/products/tirzepatide.avif",
};

const SHELF = [
  { id: 1, name: "GLP-1", label: "Appetite & metabolic support", img: "/products/shelf/semaglutide.avif" },
  { id: 26, name: "Low-Dose Naltrexone", label: "Inflammation & wellness support", img: "/products/shelf/ldn.avif" },
  { id: 29, name: "Luminance", label: "Dark spot & skin tone support", img: "/products/shelf/luminance.avif" },
  { id: 32, name: "Olympus Peak", label: "Support for strength & vitality", img: "/products/shelf/olympus-peak.avif" },
  { id: 16, name: "NAD+", label: "Helps support daily energy", img: "/products/shelf/nad-plus.avif" },
  { id: 13, name: "SubMagna Drops", label: "Weight management drops", img: "/products/shelf/submagna.avif" },
];

const SPOT_COPY = {
  "weight-loss": {
    tag: "Appetite & metabolic support",
    name: "GLP-1",
    blurb: "Weekly dosing, provider-adjusted as you go",
  },
};

const SPOTS = CONSULT_ORDER.map((key) => {
  const c = CONSULTS[key];
  const art = GOAL_ART[c.goalSlug] || {};
  return {
    key,
    goal: c.goalSlug,
    to: `/treatments/${c.goalSlug}`,
    tag: c.tag,
    name: c.name,
    blurb: c.blurb,
    ...SPOT_COPY[c.goalSlug],
    img: art.hero,
    imgClass: art.heroClass,
    bg: art.heroBg,
  };
}).filter((s) => s.img);

const SPOT_MS = 4200;

/* Both were heavy enough to read as a tint over the artwork rather than a veil
   under the type. Pulled back about a third at the dark end, which still leaves
   ~0.6 behind the headline — the copy only occupies the left 26ch, so that is the
   only part that has to carry white text. */
const VIDEO_SCRIM =
  "linear-gradient(96deg, rgba(22,16,9,0.6) 0%, rgba(22,16,9,0.44) 38%, rgba(22,16,9,0.18) 68%, rgba(22,16,9,0.06) 100%)";
const SPOT_SCRIM =
  "linear-gradient(96deg, rgba(42,29,10,0.56) 0%, rgba(42,29,10,0.42) 34%, rgba(42,29,10,0.24) 60%, rgba(42,29,10,0.12) 82%, rgba(42,29,10,0.05) 100%)";

const TITLE_FILL = "radial-gradient(circle at 0% 0%, #6b511e, #d9c797)";

const CARD_R = "rounded-[calc(20px*var(--nv-r-scale,1))]";
const TILE_R = "rounded-[calc(14px*var(--nv-r-scale,1))]";
const RAIL_ITEM ="w-[48%] shrink-0 snap-start aspect-[5/6] min-w-0 lg:aspect-auto lg:w-auto lg:h-full";
const AUTO_MS = 3000;
const SETTLE_MS = 180;

function useAutoAdvance(ref, unique) {
  useEffect(() => {
    const el = ref.current;
    if (!el || unique < 2) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    let held = false;
    let visible = true;
    let idleUntil = 0;
    let settle;

    // Returns 0 when the rail is not a scroller (lg) or has not been laid out.
    const stride = () => {
      if (el.scrollWidth <= el.clientWidth + 4 || el.children.length < 2) return 0;
      return Math.max(0, el.children[1].offsetLeft - el.children[0].offsetLeft);
    };

    const rebase = () => {
      const s = stride();
      if (s && el.scrollLeft >= s * unique - 1) el.scrollLeft -= s * unique;
    };

    const step = () => {
      if (held || !visible || document.hidden || Date.now() < idleUntil) return;
      const s = stride();
      if (!s) return;
      rebase();
      el.scrollTo({ left: el.scrollLeft + s, behavior: "smooth" });
    };

    const hold = () => {
      held = true;
    };
    const release = () => {
      held = false;
      idleUntil = Date.now() + AUTO_MS;
    };
    const nudge = () => {
      idleUntil = Date.now() + AUTO_MS;
    };
    // Fires for the automatic scroll too, but rebasing onto an identical frame
    // of a periodic strip is a no-op on screen, so that costs nothing.
    const onScroll = () => {
      clearTimeout(settle);
      settle = setTimeout(() => {
        if (!held) rebase();
      }, SETTLE_MS);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(el);

    const passive = { passive: true };
    el.addEventListener("pointerdown", hold, passive);
    el.addEventListener("touchstart", hold, passive);
    el.addEventListener("wheel", nudge, passive);
    el.addEventListener("mouseenter", hold, passive);
    el.addEventListener("mouseleave", release, passive);
    el.addEventListener("scroll", onScroll, passive);
    window.addEventListener("pointerup", release, passive);
    window.addEventListener("touchend", release, passive);

    const timer = setInterval(step, AUTO_MS);

    return () => {
      clearInterval(timer);
      clearTimeout(settle);
      io.disconnect();
      el.removeEventListener("pointerdown", hold, passive);
      el.removeEventListener("touchstart", hold, passive);
      el.removeEventListener("wheel", nudge, passive);
      el.removeEventListener("mouseenter", hold, passive);
      el.removeEventListener("mouseleave", release, passive);
      el.removeEventListener("scroll", onScroll, passive);
      window.removeEventListener("pointerup", release, passive);
      window.removeEventListener("touchend", release, passive);
    };
  }, [ref, unique]);
}

/* Shared by both wide cards: eyebrow and copy up top, CTA pinned to the floor.
   The phone card is a 2.4:1 letterbox rather than the 1.5:1 it used to be, so
   every step of the type ramp is set from the comp at that height — roughly two
   thirds of the tablet sizes. The 26ch measure goes with it: at 0.66rem the
   video blurb is one line in the comp, and 26ch would fold it. */
function CardCopy({ tag, name, blurb, cta, big = false }) {
  return (
    <div className="relative z-10 flex h-full flex-col justify-between p-4 sm:p-6 lg:p-7">
      <div className="max-w-[44ch] sm:max-w-[26ch]">
        <span className="block font-mono text-[0.5rem] uppercase tracking-[0.18em] text-[#f4e3bd] sm:text-[0.6rem]">
          {tag}
        </span>
        <h2
          className={`nv-weight-keep mt-1.5 font-display font-bold leading-[1.1] text-white sm:mt-2 ${
            big
              ? "text-[clamp(1rem,3.6vw,1.9rem)]"
              : "text-[clamp(0.95rem,3.4vw,2.1rem)]"
          }`}
        >
          {name}
        </h2>
        <p className="mt-1.5 text-[0.66rem] leading-snug text-white/75 sm:mt-2 sm:text-[0.85rem]">{blurb}</p>
      </div>
      <span className="mt-3 inline-flex items-center gap-1.5 text-[0.68rem] font-semibold text-white transition-all duration-300 group-hover:gap-3 sm:mt-5 sm:gap-2 sm:text-[0.84rem]">
        {cta}
        <ArrowRight size={13} strokeWidth={2.4} className="sm:h-3.5 sm:w-3.5" />
      </span>
    </div>
  );
}
const GPU_LAYER = "transform-gpu will-change-transform [backface-visibility:hidden]";

function VideoCard() {
  return (
    <div className="group isolate">
      <Link
        to="/treatments"
        onClick={() => track(EVENTS.BROWSE_TREATMENTS, { source: "hero-video" })}
        className={`relative block aspect-[2.4/1] overflow-hidden sm:aspect-[1.7/1] lg:aspect-[2.25/1] ${CARD_R} ${GPU_LAYER} nv-shadow-lg transition-transform duration-500 group-hover:-translate-y-1`}
      >
        {/* preload="auto" because the clip is ~15MB and the default only fetches
            metadata, so the loop can reach the end before the start is buffered
            again and stall there. */}
        <video
          src="/video/right-vid.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className={`absolute inset-0 h-full w-full object-cover object-center ${GPU_LAYER} transition-transform duration-[1200ms] group-hover:scale-105`}
        />
        <span className="pointer-events-none absolute inset-0" style={{ background: VIDEO_SCRIM }} />
        <CardCopy
          tag="New here"
          name="Explore your treatments"
          blurb="Answer a few questions and a licensed provider matches you to a plan"
          cta="Find your match"
        />
      </Link>
    </div>
  );
}

function SpotlightCard() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || SPOTS.length < 2) return undefined;
    const t = setTimeout(() => setActive((v) => (v + 1) % SPOTS.length), SPOT_MS);
    return () => clearTimeout(t);
  }, [active, paused]);

  const s = SPOTS[active];
  if (!s) return null;

  return (
    /* This wrapper already existed to hold the dots and the pause handlers, and
       it is the element that does not move — so `group` goes here for the same
       reason it does on the video card. It also means the rotation no longer
       pauses and resumes as the lift flickers the pointer in and out. */
    <div
      className="group relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <Link
        to={s.to}
        onClick={() => track(EVENTS.CATEGORY_SELECTED, { category: s.goal, source: "hero-spotlight" })}
        aria-live="polite"
        className={`relative block aspect-[2.4/1] overflow-hidden sm:aspect-[1.7/1] lg:aspect-[2.25/1] ${CARD_R} ${GPU_LAYER} nv-shadow-lg transition-transform duration-500 group-hover:-translate-y-1`}
        style={{ background: s.bg }}
      >
        {SPOTS.map((it, i) => (
          <span
            key={it.key}
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ease-out ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
            style={{ background: it.bg }}
          >
            <img
              src={it.img}
              alt=""
              loading={i === 0 ? "eager" : "lazy"}
              /* No bottom-0 here: men's health has to hang below the floor, and
                 a base value would race its override in the emitted CSS. Every
                 heroClass carries its own vertical anchor. */
              className={`absolute w-auto max-w-none object-contain object-bottom ${GPU_LAYER} transition-transform duration-[1200ms] group-hover:scale-105 ${it.imgClass}`}
            />
          </span>
        ))}

        <span className="pointer-events-none absolute inset-0" style={{ background: SPOT_SCRIM }} />

        {/* Keyed on the active goal so the copy dissolves with the artwork
            instead of snapping over a half-faded figure. */}
        <span key={s.key} className="nv-fade-slow block h-full">
          <CardCopy tag={s.tag} name={s.name} blurb={s.blurb} cta="Check your eligibility" big />
        </span>
      </Link>

      {SPOTS.length > 1 && (
        <div className="absolute bottom-3 right-4 z-10 flex items-center gap-1.5 sm:bottom-5 sm:right-6">
          {SPOTS.map((it, i) => (
            <button
              key={it.key}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show ${it.name}`}
              aria-current={i === active ? "true" : undefined}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === active ? "w-5 bg-white" : "w-1.5 bg-white/45 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* The clones exist only to make the strip periodic, so they neither animate in
   (they are off-screen at mount and would only fight the rebase) nor take part
   in the tab order. */
const railMotion = (delay, clone) =>
  clone
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: EASE, delay },
      };

function Tile({ item, delay, clone }) {
  return (
    <Motion.div
      {...railMotion(delay, clone)}
      className={clone ? `${RAIL_ITEM} lg:hidden` : RAIL_ITEM}
      aria-hidden={clone || undefined}
    >
      <Link
        to={productPath(item.product)}
        tabIndex={clone ? -1 : undefined}
        onClick={() => track(EVENTS.PRODUCT_VIEWED, { id: item.product.id, name: item.product.name, source: "hero-shelf" })}
        className={`group flex h-full flex-col overflow-hidden border border-line bg-surface p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/45 lg:min-h-[6.5rem] lg:flex-row lg:items-center lg:gap-2 lg:px-4 lg:py-3 ${TILE_R} nv-shadow`}
      >
        <span className="min-w-0 lg:flex-1">
          <span className="block font-display text-[1.02rem] font-bold leading-tight text-primary lg:text-[1.12rem]">
            {item.name}
          </span>
          <span className="mt-1 block font-mono text-[0.5rem] uppercase leading-[1.35] tracking-[0.1em] text-muted lg:text-[0.52rem]">
            {item.label}
          </span>
        </span>
        <span className="relative mt-2 min-h-0 w-full flex-1 lg:mt-0 lg:w-28 lg:flex-none lg:shrink-0 lg:self-stretch">
          <img
            src={item.img}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain object-bottom transition-transform duration-500 group-hover:scale-105 lg:inset-auto lg:-top-[12%] lg:left-1/2 lg:h-[215%] lg:w-auto lg:max-w-none lg:-translate-x-1/2"
          />
        </span>
      </Link>
    </Motion.div>
  );
}

function FeaturedTile({ product, delay, clone }) {
  return (
    <Motion.div
      {...railMotion(delay, clone)}
      className={clone ? `${RAIL_ITEM} lg:hidden` : `${RAIL_ITEM} lg:row-span-2`}
      aria-hidden={clone || undefined}
    >
      <Link
        to={productPath(product)}
        tabIndex={clone ? -1 : undefined}
        onClick={() => track(EVENTS.PRODUCT_VIEWED, { id: product.id, name: product.name, source: "hero-featured" })}
        className={`group flex h-full flex-col overflow-hidden border border-line bg-surface p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/45 lg:px-5 lg:py-5 ${TILE_R} nv-shadow`}
      >
        <span className="min-w-0">
          <span className="block font-display text-[1.02rem] font-bold leading-tight text-primary lg:text-[1.22rem]">
            {FEATURED.name}
          </span>
          <span className="mt-1 block font-mono text-[0.5rem] uppercase leading-[1.35] tracking-[0.1em] text-muted lg:text-[0.52rem]">
            {FEATURED.label}
          </span>
        </span>
        <span className="relative mt-2 min-h-0 w-full flex-1 lg:mt-3">
          <img
            src={FEATURED.img}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-contain object-bottom transition-transform duration-500 group-hover:scale-105"
          />
        </span>
      </Link>
    </Motion.div>
  );
}

export default function HomeHero() {
  const featured = productsData.find((p) => p.id === FEATURED.id);
  const shelf = SHELF.map((s) => ({ ...s, product: productsData.find((p) => p.id === s.id) })).filter(
    (s) => s.product && !isHidden(s.product)
  );

  const rail = [
    ...(featured && !isHidden(featured) ? [{ key: "featured", featured }] : []),
    ...shelf.map((s) => ({ key: s.id, item: s })),
  ];
  const railRef = useRef(null);
  useAutoAdvance(railRef, rail.length);

  const card = (r, i, clone) =>
    r.featured ? (
      <FeaturedTile key={`${clone ? "b" : "a"}-${r.key}`} product={r.featured} delay={0.22} clone={clone} />
    ) : (
      <Tile key={`${clone ? "b" : "a"}-${r.key}`} item={r.item} delay={0.26 + i * 0.04} clone={clone} />
    );

  return (
    <section className="relative isolate overflow-hidden bg-bg">
      <div className="mx-auto max-w-[1180px] px-5 pb-[clamp(2rem,4vw,3.25rem)] pt-[clamp(1.75rem,3.6vw,2.75rem)] md:px-10">
        {/* ---------------------------- headline ---------------------------- */}
        <Motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <h1
            className="nv-weight-keep text-[clamp(1.5rem,5.8vw,3.05rem)] font-extrabold leading-[1.15] tracking-[-0.015em] lg:max-w-[16ch] lg:leading-[1.1]"
            style={{ color: "#6b511e" }}
          >
            Modern{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: TITLE_FILL }}>
              Healthcare,
            </span>{" "}
            <span className="block">Built Around You</span>
          </h1>
        </Motion.div>

        {/* --------------------------- wide cards --------------------------- */}
        <Motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          className="mt-8 grid gap-5 sm:mt-[clamp(1.5rem,3vw,2.5rem)] sm:grid-cols-2 sm:gap-3.5 lg:gap-5"
        >
          <VideoCard />
          <SpotlightCard />
        </Motion.div>

        {/* ----------------------------- shelf ------------------------------ */}
        {/* pb-2 leaves the card shadows somewhere to fall: overflow-x also clips
            vertically, so without it the rail shears them off. */}
        <div
          ref={railRef}
          className="no-scrollbar -mx-5 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-5 px-5 pb-2 md:-mx-10 md:scroll-pl-10 md:px-10 lg:mx-0 lg:mt-5 lg:grid lg:grid-cols-[0.86fr_1fr_1fr_1fr] lg:gap-3.5 lg:overflow-visible lg:px-0 lg:pb-0"
        >
          {rail.map((r, i) => card(r, i, false))}
          {rail.map((r, i) => card(r, i, true))}
        </div>
      </div>
    </section>
  );
}
