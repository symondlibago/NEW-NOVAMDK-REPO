import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Reveal from "../ui/Reveal";
import { formatDate, latestPosts, tagLabel } from "../../lib/blog";

/**
 * "Health & Wellness Articles" — the three newest posts (2026-09-11).
 *
 * Reads straight from the blog data layer, so a GoHighLevel sync drops new
 * posts in here without anyone touching this file.
 */

const GROUND = "#faf5ec";
const HEADING = "#725826";
const TITLE = "#463a24";
const BODY = "#6a5c45";

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

const RIM = {
  padding: "0.5px",
  background:
    "linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.36) 40%, rgba(255,255,255,0.26) 66%, rgba(255,255,255,0.72) 100%)",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  maskComposite: "exclude",
};

const POSTS = latestPosts(3);

function ArticleCard({ post }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group relative block aspect-4/3 overflow-hidden rounded-2xl"
    >
      <img
        src={post.image}
        alt={post.imageAlt || ""}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Centred rather than pinned, so a band of the photograph shows above
          and below it the way the comp has it. */}
      <div
        className="absolute inset-x-5 top-1/2 -translate-y-1/2 rounded-2xl p-5"
        style={PANEL}
      >
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl" style={RIM} />

        <div className="relative flex flex-wrap items-center gap-x-3 gap-y-1">
          {post.tags?.[0] && (
            <span
              className="rounded-full bg-white/45 px-3 py-1 text-[0.72rem] font-medium"
              style={{ color: TITLE }}
            >
              {tagLabel(post.tags[0])}
            </span>
          )}
          <span className="text-[0.72rem]" style={{ color: BODY }}>
            {formatDate(post.date)}
          </span>
        </div>

        <h3
          className="relative mt-3 line-clamp-2 font-display text-[1.3rem] font-extrabold leading-[1.2]"
          style={{ color: TITLE }}
        >
          {post.title}
        </h3>

        {/* pr leaves the arrow its corner, so a long excerpt never runs under it. */}
        <p className="relative mt-2 line-clamp-2 pr-12 text-[0.82rem] leading-relaxed" style={{ color: BODY }}>
          {post.excerpt}
        </p>

        <span
          aria-hidden="true"
          className="absolute bottom-4 right-4 grid h-9 w-9 place-items-center rounded-full border border-white/60 bg-white/35 transition-transform duration-300 group-hover:translate-x-0.5"
          style={{ color: TITLE }}
        >
          <ChevronRight size={17} strokeWidth={2} />
        </span>
      </div>
    </Link>
  );
}

export default function Articles() {
  if (!POSTS.length) return null;

  return (
    <section className="w-full" style={{ background: GROUND }}>
      <div className="mx-auto max-w-360 px-5 py-[clamp(2.5rem,5vw,4.5rem)] md:px-12">
        <Reveal>
          {/* Left aligned in the comp, unlike the centred bands above it. */}
          <h2
            className="nv-weight-keep font-display text-[clamp(1.9rem,4.4vw,4rem)] font-extrabold leading-[0.95] tracking-[0.01em]"
            style={{ color: HEADING }}
          >
            Health &amp; Wellness Articles
          </h2>
          <p className="mt-5 max-w-[38rem] text-[clamp(0.95rem,1.2vw,1.05rem)] leading-relaxed" style={{ color: TITLE }}>
            Discover thoughtful articles covering health, wellness, treatments, and the topics that
            matter throughout your care journey
          </p>
        </Reveal>

        <div className="mt-[clamp(1.75rem,3.5vw,2.75rem)] grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((post, i) => (
            <Reveal key={post.slug} delay={i * 0.08}>
              <ArticleCard post={post} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
