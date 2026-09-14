import React from "react";
import { Link } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import Reveal from "../ui/Reveal";
import { formatDate, latestPosts, categoryOf, CATEGORIES, inCategory } from "../../lib/blog";

/**
 * "Health & Wellness Articles" — the home page's journal band (2026-09-11).
 *
 * Three overlay cards, a category filter on a tan band, then a feature beside
 * two split cards. Reads straight from the blog data layer and filters through
 * the same CATEGORIES the /blog index uses, so a post lands in the same place
 * on both.
 */

const GROUND = "#ffffff";
const BAND = "#dcbe8f";
const HEADING = "#725826";
const TITLE = "#463a24";
const BODY = "#6a5c45";
const CARD = "#fdfbf7";
const LINE = "#e7dcc7";

/*
| The glass panel over each photo. Same family as the other bands, but a
| heavier fill than the 12% those use: this one sits over whatever photograph a
| post happens to carry, and at 12% the copy stopped being readable the moment
| a dark image came through the feed.
*/
const PANEL = {
  background: "rgba(255,255,255,0.52)",
  /* brightness lifts a dark photograph toward the light end before the fill
     goes over it, so the panel lands in the same tonal range whatever the post
     is illustrated with. Over an already-light image it barely registers. */
  backdropFilter: "blur(12px) brightness(1.18)",
  WebkitBackdropFilter: "blur(12px) brightness(1.18)",
  boxShadow:
    "inset 0 2px 4px rgba(255,255,255,0.45), inset 0 -2px 4px rgba(0,0,0,0.16)",
};

/*
| The filter chips. Same layer spec as the Get Started button in the steps
| band, because it is the same component in the file:
|
|   Fill    BC9461 0% (nothing)
|   Stroke  none — the edge is the glass effect's own refraction
|   Effect  glass: light -45 / 80%, refraction 80, depth 20,
|           dispersion 50, frost 4, splay 0
|   Text    FFFFFF 69%
|
| Frost 4 is almost no blur, so the tan band reads through the chip rather than
| the chip sitting on it as a solid lozenge.
*/
const CHIP = {
  background: "rgba(202,176,141,0.20)",
  backdropFilter: "blur(7px)",
  WebkitBackdropFilter: "blur(7px)",
  boxShadow:
    "inset 0 1.5px 3px rgba(255,255,255,0.34), inset 0 -1.5px 3px rgba(0,0,0,0.10)",
};

const CHIP_RIM = {
  padding: "1px",
  background:
    "linear-gradient(145deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.26) 40%, rgba(255,255,255,0.18) 66%, rgba(255,255,255,0.56) 100%)",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  maskComposite: "exclude",
};

const RIM = {
  padding: "0.5px",
  background:
    "linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.36) 40%, rgba(255,255,255,0.26) 66%, rgba(255,255,255,0.72) 100%)",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  maskComposite: "exclude",
};

/* Everything published, newest first and deduped by title. The band slices
   this into its rows rather than asking the data layer for each row's worth,
   so a category filter reflows the whole block from one list. */
const ALL = latestPosts(24);

/* The swap when a category changes: the outgoing set leaves together, then the
   incoming cards rise in one after another. mode="wait" on the AnimatePresence
   is what keeps the two sets from overlapping mid-air. */
const LIST = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const ITEM = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

/*
| The panel's radius, shared with its rim so the two edges stay on top of each
| other while the card resizes.
*/
const PANEL_ROUND = "rounded-[clamp(0.9rem,3cqw,1.6rem)]";

/* Photo with the copy floating over it, as the comp has the wide cards.
|
| Everything inside the panel is sized in cqw against the card itself rather
| than in fixed rem, because this same card runs at two widths: a third of the
| row up top and the wide feature below. The comp's proportions are taken off
| the feature — panel 83% of the card wide, 5% in from the left and 12% from
| the right so a strip of the photograph stays visible, sitting 6% off the
| bottom — and the clamps are what keep the small instance readable rather than
| a shrunk photocopy of the big one. */
function OverlayCard({ post }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group @container relative block aspect-4/3 h-full overflow-hidden rounded-2xl"
    >
      <img
        src={post.image}
        alt={post.imageAlt || ""}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      <div
        className={`absolute bottom-[6%] left-[5%] right-[12%] ${PANEL_ROUND} p-[clamp(1rem,3.4cqw,2rem)]`}
        style={PANEL}
      >
        <span aria-hidden="true" className={`pointer-events-none absolute inset-0 ${PANEL_ROUND}`} style={RIM} />

        <div className="relative flex flex-wrap items-center gap-x-[clamp(0.6rem,2.2cqw,1.25rem)] gap-y-1">
          <span
            className="rounded-full bg-white/45 px-[clamp(0.6rem,2cqw,1.05rem)] py-[clamp(0.2rem,1.1cqw,0.5rem)] text-[clamp(0.68rem,1.7cqw,0.95rem)] font-medium"
            style={{ color: TITLE }}
          >
            {categoryOf(post)}
          </span>
          <span className="text-[clamp(0.68rem,1.7cqw,0.95rem)]" style={{ color: BODY }}>
            {formatDate(post.date)}
          </span>
        </div>

        <h3
          className="relative mt-[clamp(0.75rem,5.2cqw,3rem)] line-clamp-2 font-display text-[clamp(1.05rem,4.2cqw,2.4rem)] font-extrabold leading-[1.17]"
          style={{ color: TITLE }}
        >
          {post.title}
        </h3>

        <p
          className="relative mt-[clamp(0.5rem,2.4cqw,1.3rem)] line-clamp-2 text-[clamp(0.78rem,2cqw,1.1rem)] leading-[1.6]"
          style={{ color: BODY }}
        >
          {post.excerpt}
        </p>

        {/* Its own row under the copy, right aligned, the way the comp has it:
            pinned to the corner it used to cut a notch out of the excerpt. */}
        <span
          aria-hidden="true"
          className="relative ml-auto mt-[clamp(0.4rem,1.3cqw,0.75rem)] grid size-[clamp(1.75rem,6cqw,3.1rem)] place-items-center rounded-full border border-white/60 bg-white/35 transition-transform duration-300 group-hover:translate-x-0.5"
          style={{ color: TITLE }}
        >
          <ChevronRight className="size-[clamp(0.8rem,2.8cqw,1.45rem)]" strokeWidth={2} />
        </span>
      </div>
    </Link>
  );
}

/* Photo beside the copy rather than under it — the pair that flanks the
   feature. */
function SplitCard({ post }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex h-full overflow-hidden rounded-2xl border transition-shadow duration-300 hover:shadow-[0_12px_34px_rgba(90,70,30,0.10)]"
      style={{ background: CARD, borderColor: LINE }}
    >
      <span className="block w-[46%] shrink-0 overflow-hidden sm:w-[52%]">
        <img
          src={post.image}
          alt={post.imageAlt || ""}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
        />
      </span>

      <span className="flex min-w-0 flex-1 flex-col justify-center p-4 md:p-5">
        <span
          className="inline-flex w-fit rounded-full border px-2.5 py-1 text-[0.68rem] font-medium"
          style={{ borderColor: LINE, color: TITLE }}
        >
          {categoryOf(post)}
        </span>

        <span
          className="mt-2.5 line-clamp-2 font-display text-[1rem] font-extrabold leading-[1.2]"
          style={{ color: TITLE }}
        >
          {post.title}
        </span>

        <span className="mt-1 text-[0.68rem]" style={{ color: BODY }}>
          {formatDate(post.date)}
        </span>

        <span className="mt-2 line-clamp-4 text-[0.74rem] leading-relaxed" style={{ color: BODY }}>
          {post.excerpt}
        </span>
      </span>
    </Link>
  );
}

export default function Articles() {
  /* Null rather than a sentinel, so pressing the active chip clears it. The
     comp has five chips and no "All", and a toggle is what makes that set
     complete without inventing a sixth. */
  const [active, setActive] = React.useState(null);

  const cat = CATEGORIES.find((c) => c.slug === active) || null;

  /* The three newest, and the filter never touches them: they are the band's
     headline and are meant to stay put while the block underneath changes. */
  const top = ALL.slice(0, 3);

  /* Unfiltered, the block below carries on from where the top row stopped, so
     nothing appears twice. Once a category is picked it searches the whole
     catalogue instead — scoping it to the leftovers meant a category whose
     only articles were already in the top row came back empty, which is what
     made Longevity look like it had deleted itself. */
  const lower = cat ? ALL.filter((p) => inCategory(p, cat)) : ALL.slice(3);
  const feature = lower[0];
  const side = lower.slice(1, 3);

  if (!ALL.length) return null;

  return (
    <section className="w-full" style={{ background: GROUND }}>
      <div className="mx-auto max-w-360 px-5 pt-[clamp(2.5rem,5vw,4.5rem)] md:px-12">
        <Reveal>
          {/* Left aligned in the comp, unlike the centred bands above it. */}
          <h2
            className="nv-weight-keep font-display text-[clamp(1.9rem,4.4vw,4rem)] font-extrabold leading-[0.95] tracking-[0.01em]"
            style={{ color: HEADING }}
          >
            Health &amp; Wellness Articles
          </h2>
          <p className="mt-5 max-w-152 text-[clamp(0.95rem,1.2vw,1.05rem)] leading-relaxed" style={{ color: TITLE }}>
            Discover thoughtful articles covering health, wellness, treatments, and the topics that
            matter throughout your care journey
          </p>
        </Reveal>

        <div className="mb-[clamp(2rem,4vw,3rem)] mt-[clamp(1.75rem,3.5vw,2.75rem)] grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {top.map((post, i) => (
            <Reveal key={post.slug} delay={i * 0.08}>
              <OverlayCard post={post} />
            </Reveal>
          ))}
        </div>
      </div>

      {/* ---- category filter. Full bleed, as the comp has it ---- */}
      <div className="w-full" style={{ background: BAND }}>
        <div className="mx-auto flex max-w-360 flex-wrap justify-center gap-3 px-5 py-7 md:px-12">
          {CATEGORIES.map((c) => {
            const on = active === c.slug;
            return (
              /* The dark fill is a single shared element rather than one per
                 chip: with a layoutId, framer-motion tweens it from wherever
                 it was to wherever it is now, so it pours across the row
                 instead of blinking off one chip and on at the next. */
              <button
                key={c.slug}
                type="button"
                aria-pressed={on}
                onClick={() => setActive(on ? null : c.slug)}
                className="relative rounded-full px-5 py-2 text-[0.85rem] font-medium transition-colors duration-300"
                style={{ ...CHIP, color: on ? "#ffffff" : "rgba(255,255,255,0.69)" }}
              >
                {on && (
                  <Motion.span
                    aria-hidden="true"
                    layoutId="nv-articles-chip"
                    className="absolute inset-0 rounded-full"
                    style={{ background: "#4a3a20" }}
                    transition={{ type: "spring", stiffness: 320, damping: 30 }}
                  />
                )}
                {/* After the marker in the DOM, so the active chip keeps its
                    refracted edge instead of the dark fill covering it. */}
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full" style={CHIP_RIM} />
                <span className="relative">{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---- feature beside the pair ---- */}
      <div className="mx-auto max-w-360 px-5 pb-[clamp(2.5rem,5vw,4.5rem)] pt-[clamp(1.75rem,3.5vw,2.75rem)] md:px-12">
        {/* Keyed on the active category, so changing it unmounts one set and
            mounts the next — which is what gives AnimatePresence something to
            animate between. */}
        <AnimatePresence mode="wait">
          <Motion.div
            key={active || "all"}
            variants={LIST}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -12, transition: { duration: 0.22 } }}
          >
            {!feature ? (
              <Motion.p
                variants={ITEM}
                className="py-10 text-center text-[0.95rem]"
                style={{ color: BODY }}
              >
                {cat ? `No articles in ${cat.label} yet.` : "More articles are on the way."}
              </Motion.p>
            ) : (
              <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.28fr)_minmax(0,1fr)]">
                <Motion.div variants={ITEM} className="h-full">
                  <OverlayCard post={feature} />
                </Motion.div>

                {/* Two equal rows, so the pair together stands the same height
                    as the feature beside it. */}
                {side.length > 0 && (
                  <div className="grid h-full gap-5 lg:grid-rows-2">
                    {side.map((post) => (
                      <Motion.div key={post.slug} variants={ITEM} className="h-full">
                        <SplitCard post={post} />
                      </Motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Motion.div>
        </AnimatePresence>

        <Reveal className="mt-[clamp(1.75rem,3.5vw,2.5rem)] flex justify-center">
          <Link
            to="/blog"
            className="group inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-[0.9rem] font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
            style={{ background: "#a98c55" }}
          >
            View All Articles
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
