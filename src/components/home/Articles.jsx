import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "../ui/Reveal";
import { latestPosts, categoryOf, imageProps } from "../../lib/blog";

/**
 * The home page's journal band (relaid out 2026-10-08).
 *
 * A mosaic — one feature beside two stacked cards — then "What's New" over a
 * row of three. Reads straight from the blog data layer.
 *
 * It replaces a version that put a frosted glass panel over every photograph.
 * That was the slowest thing on the page: `backdrop-filter` re-blurs the region
 * behind it on every composited frame, there were four of them over full-bleed
 * photographs, and each carried a `mask-composite` rim on top. The copy now
 * sits on a plain gradient, which the compositor paints once. The chips' own
 * rims, the category filter and its shared-layout spring went with the band
 * they lived on.
 *
 * The other half of the fix is in the images themselves: see imageProps.
 */

const GROUND = "#ffffff";
const HEADING = "#725826";
const TITLE = "#463a24";

/* Plain gradient, no blur. Deep enough at the foot to carry white type over a
   pale photograph, and clear by halfway up so the picture is still the card. */
const SCRIM =
  "linear-gradient(to top, rgba(28,20,8,0.82) 0%, rgba(28,20,8,0.55) 28%, rgba(28,20,8,0.12) 56%, rgba(28,20,8,0) 78%)";

const CHIP = "rgba(220,190,143,0.92)";

/* Six posts: three in the mosaic, three under "What's New". */
const ALL = latestPosts(6);

/**
 * One card: photograph, category chip, headline.
 *
 * `sizes` has to be passed per slot. It is what tells the browser which rung of
 * the WebP ladder to fetch, and a wrong one either fetches a blurry image or
 * throws away the point of the ladder.
 */
function PostTile({ post, sizes, big = false }) {
  const img = imageProps(post, sizes);
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group relative block h-full overflow-hidden rounded-2xl bg-[#e7dcc7]"
    >
      {/* The zoom is a transform, so it runs on the compositor and never
          repaints the card. Nothing samples this image any more, which is what
          makes that safe. */}
      <img
        {...img}
        alt={post.imageAlt || ""}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      />

      <span aria-hidden="true" className="absolute inset-0" style={{ background: SCRIM }} />

      <div className={`absolute inset-x-0 bottom-0 ${big ? "p-5 sm:p-7" : "p-4 sm:p-5"}`}>
        <span
          className={`inline-flex rounded-full px-3 py-1 font-medium ${
            big ? "text-[0.72rem] sm:text-[0.8rem]" : "text-[0.66rem]"
          }`}
          style={{ background: CHIP, color: TITLE }}
        >
          {categoryOf(post)}
        </span>

        <h3
          className={`mt-2.5 line-clamp-3 font-display font-extrabold leading-[1.18] text-white ${
            big
              ? "text-[clamp(1.15rem,2.4vw,1.95rem)]"
              : "text-[clamp(0.95rem,1.4vw,1.15rem)]"
          }`}
        >
          {post.title}
        </h3>
      </div>
    </Link>
  );
}

export default function Articles() {
  if (!ALL.length) return null;

  const feature = ALL[0];
  const side = ALL.slice(1, 3);
  const fresh = ALL.slice(3, 6);

  return (
    <section className="w-full" style={{ background: GROUND }}>
      <div className="mx-auto max-w-360 px-5 py-[clamp(2.5rem,5vw,4.5rem)] md:px-12">
        {/* The band opens on the mosaic, as the comp has it. The heading is kept
            for screen readers and for search, which would otherwise meet a run
            of links with nothing naming them. */}
        <h2 className="sr-only">Health &amp; Wellness Articles</h2>

        {/* ---- mosaic: feature beside two stacked ---- */}
        <Reveal>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
            {/* The feature keeps its aspect at every width: it is what gives the
                mosaic row its height, and the pair beside it stretches to
                match. Drop it at lg and both columns collapse. */}
            <div className="aspect-4/3 sm:aspect-3/2">
              <PostTile
                post={feature}
                big
                sizes="(min-width: 1024px) 60vw, (min-width: 640px) 94vw, 92vw"
              />
            </div>

            {/* Two equal rows so the pair stands exactly as tall as the feature
                beside it. Below lg they are their own cards and carry their own
                aspect instead. */}
            {side.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2">
                {side.map((post) => (
                  <div key={post.slug} className="aspect-16/9 lg:aspect-auto">
                    <PostTile
                      post={post}
                      sizes="(min-width: 1024px) 34vw, (min-width: 640px) 47vw, 92vw"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Reveal>

        {/* ---- what's new ---- */}
        {fresh.length > 0 && (
          <Reveal>
            <h2
              className="nv-weight-keep mt-[clamp(2.25rem,4.5vw,3.5rem)] font-display text-[clamp(1.6rem,3.4vw,2.9rem)] font-extrabold leading-[1.05] tracking-[0.01em]"
              style={{ color: HEADING }}
            >
              What&rsquo;s New
            </h2>

            <div className="mt-[clamp(1.25rem,2.5vw,2rem)] grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fresh.map((post) => (
                <div key={post.slug} className="aspect-16/9">
                  <PostTile
                    post={post}
                    sizes="(min-width: 1024px) 31vw, (min-width: 640px) 47vw, 92vw"
                  />
                </div>
              ))}
            </div>
          </Reveal>
        )}

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
