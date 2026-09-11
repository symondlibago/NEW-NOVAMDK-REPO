import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Seo from "../components/Seo";
import Navbar from "../components/Nav/Navbar";
import Footer from "../components/Nav/Footer";
import Reveal from "../components/ui/Reveal";
import { getPosts, formatDate, tagLabel } from "../lib/blog";

/**
 * The journal index (2026-09-11 redesign).
 *
 * One featured article beside a stack of three, a category filter above them,
 * and the remainder revealed on demand. Headings are serif here and nowhere
 * else on the site, which is the point: the journal is meant to read as
 * editorial rather than as another marketing band.
 */

const SITE_URL = "https://www.novamdk.com";

const GROUND = "#f8f3ea";
const CARD = "#fdfbf7";
const LINE = "#e3d9c6";
const INK = "#24201a";
const BODY = "#5d5647";
const MUTED = "#8a8273";
const GOLD = "#9a8248";
const EYEBROW = "#8a7550";

/* How many articles the page opens with: the featured one plus its stack. */
const LEAD_COUNT = 4;

/* The site's five categories, in nav order, and the same five offered by the
   Category field in GoHighLevel. Fixed rather than derived from whatever tags
   the posts happen to carry: the categories are the taxonomy, and a post that
   does not sit in one of them is a post that needs its category set, not a new
   chip on the page. */
const CATEGORIES = [
  { label: "Weight Loss", slug: "weight-loss" },
  { label: "Longevity", slug: "longevity" },
  { label: "Skin Health", slug: "skin-health" },
  { label: "Sexual Health", slug: "sexual-health" },
  { label: "Recovery & Wellness", slug: "recovery-wellness" },
];

/* GHL hands the category back as a display name on some posts and a slug on
   others, so both sides are flattened before they are compared. */
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

/* The third comparison routes the tag through tagLabel first, so whatever a
   card displays is what its chip filters on. Without it a post tagged
   "unisex-anti-aging-rx" showed LONGEVITY on the card and then vanished when
   the Longevity chip was pressed. */
function matches(post, cat) {
  return (post.tags || []).some(
    (t) => norm(t) === norm(cat.label) || norm(t) === norm(cat.slug) || norm(tagLabel(t)) === norm(cat.label)
  );
}

/** The category a post belongs to, or its raw tag tidied up if it has none. */
function categoryOf(post) {
  const hit = CATEGORIES.find((c) => matches(post, c));
  return hit ? hit.label : tagLabel(post.tags?.[0]);
}

/* The publish date, and nothing else. The comp's "N min read · Medically
   reviewed" is gone: the read time was an estimate off the word count, and
   nothing in the data records who reviewed a post, so neither could be stated
   as fact. The date comes straight from the post's own `date`, which the GHL
   sync writes. */
function Meta({ post }) {
  return (
    <p className="mt-3 text-[0.74rem]" style={{ color: MUTED }}>
      {formatDate(post.date)}
    </p>
  );
}

function Category({ post }) {
  const label = categoryOf(post);
  if (!label) return null;
  return (
    <span
      className="block text-[0.68rem] font-semibold uppercase tracking-[0.14em]"
      style={{ color: GOLD }}
    >
      {label}
    </span>
  );
}

function Featured({ post }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border transition-shadow duration-300 hover:shadow-[0_14px_40px_rgba(90,70,30,0.10)]"
      style={{ background: CARD, borderColor: LINE }}
    >
      <span className="block aspect-11/5 w-full overflow-hidden">
        <img
          src={post.image}
          alt={post.imageAlt || ""}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      </span>

      <span className="block p-6 md:p-7">
        <Category post={post} />
        <span
          className="mt-2.5 block font-journal text-[clamp(1.5rem,2.4vw,2rem)] font-bold leading-[1.15]"
          style={{ color: INK }}
        >
          {post.title}
        </span>
        <span className="mt-2.5 line-clamp-2 text-[0.95rem] leading-relaxed" style={{ color: BODY }}>
          {post.excerpt}
        </span>
        <Meta post={post} />
      </span>
    </Link>
  );
}

function Row({ post }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex gap-4 overflow-hidden rounded-2xl border p-3 transition-shadow duration-300 hover:shadow-[0_10px_30px_rgba(90,70,30,0.09)]"
      style={{ background: CARD, borderColor: LINE }}
    >
      <span className="block aspect-4/3 w-30 shrink-0 overflow-hidden rounded-xl sm:w-38">
        <img
          src={post.image}
          alt={post.imageAlt || ""}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
        />
      </span>

      <span className="block min-w-0 flex-1 py-1 pr-1">
        <Category post={post} />
        <span
          className="mt-1.5 line-clamp-2 font-journal text-[1.05rem] font-bold leading-[1.2]"
          style={{ color: INK }}
        >
          {post.title}
        </span>
        <span className="mt-1.5 line-clamp-2 text-[0.82rem] leading-relaxed" style={{ color: BODY }}>
          {post.excerpt}
        </span>
        <Meta post={post} />
      </span>
    </Link>
  );
}

export default function BlogPage() {
  const posts = React.useMemo(() => getPosts().filter((p) => !p.draft), []);

  const [active, setActive] = React.useState("all");
  const [expanded, setExpanded] = React.useState(false);

  const cat = CATEGORIES.find((c) => c.slug === active);
  const shown = cat ? posts.filter((p) => matches(p, cat)) : posts;
  const [lead, ...rest] = shown;
  const stack = rest.slice(0, LEAD_COUNT - 1);
  const overflow = rest.slice(LEAD_COUNT - 1);

  const pick = (key) => {
    setActive(key);
    setExpanded(false);
  };

  return (
    <main className="min-h-screen w-full" style={{ background: GROUND, color: INK }}>
      <Seo
        title="Blog: Guides on Weight Loss, Longevity and Skin"
        description="Clinician-reviewed guides from Nova MDK on GLP-1 weight loss, longevity, skin health and sexual wellness. Written to answer the questions patients actually ask."
        path="/blog"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Nova MDK Blog",
          url: `${SITE_URL}/blog`,
          blogPost: posts.map((p) => ({
            "@type": "BlogPosting",
            headline: p.title,
            datePublished: p.date,
            url: `${SITE_URL}/blog/${p.slug}`,
          })),
        }}
      />
      <Navbar />

      <section className="mx-auto max-w-350 px-5 py-[clamp(2rem,4.5vw,3.75rem)] md:px-12">
        {/* ---- header ---- */}
        <Reveal>
          {/* The page's own title, so it is obvious which page this is. It takes
              the h1 and the journal line below drops to an h2: two h1s on a
              page is not a heading order any crawler should have to guess at.
              Same face and gold ramp as every other page header (PageHero), so
              /blog is titled like /treatments/weight-loss rather than looking
              like a page from another site. */}
          <h1
            className="nv-weight-keep bg-clip-text text-center text-[clamp(1.9rem,4.4vw,3.1rem)] font-extrabold leading-[1.1] tracking-tight text-transparent"
            style={{ backgroundImage: "radial-gradient(circle at 0% 0%, #d9c797, #6b511e)" }}
          >
            Blog
          </h1>

          <div className="mt-10 flex items-center gap-4">
            <span
              className="shrink-0 text-[0.7rem] font-semibold uppercase tracking-[0.18em]"
              style={{ color: EYEBROW }}
            >
              The NovaMDK Journal
            </span>
            <span aria-hidden="true" className="h-px w-16 shrink-0" style={{ background: LINE }} />
          </div>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
            <h2
              className="font-journal text-[clamp(1.5rem,2.8vw,2.3rem)] font-bold leading-[1.1]"
              style={{ color: INK }}
            >
              Expert guidance for feeling your best
            </h2>

            {/* Resets the category filter. On the archive itself that is what
                "all articles" can honestly mean. */}
            <button
              type="button"
              onClick={() => pick("all")}
              className="group inline-flex shrink-0 items-center gap-2.5 rounded-full border px-6 py-3 text-[0.88rem] font-medium transition-colors duration-300 hover:bg-white"
              style={{ borderColor: LINE, color: BODY }}
            >
              View all articles
              <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>

          <p className="mt-3 max-w-[62ch] text-[clamp(0.85rem,1vw,0.95rem)] leading-relaxed" style={{ color: BODY }}>
            Thoughtful articles on health, wellness, treatments, and the topics that matter
            throughout your care journey.
          </p>
        </Reveal>

        {/* ---- category filter ---- */}
        <Reveal delay={0.06}>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {[{ label: "All", slug: "all" }, ...CATEGORIES].map((c) => {
              const on = active === c.slug;
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => pick(c.slug)}
                  aria-pressed={on}
                  className="rounded-full border px-5 py-2 text-[0.82rem] font-medium transition-colors duration-300"
                  style={
                    on
                      ? { background: "#3f3524", borderColor: "#3f3524", color: GROUND }
                      : { background: "transparent", borderColor: LINE, color: BODY }
                  }
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* ---- the grid ---- */}
        {!lead ? (
          <p className="py-16 text-center text-[1rem]" style={{ color: MUTED }}>
            {cat
              ? `No articles in ${cat.label} yet.`
              : "New articles are on the way. Check back shortly."}
          </p>
        ) : (
          <>
            <div className="mt-7 grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
              <Reveal className="h-full">
                <Featured post={lead} />
              </Reveal>

              {stack.length > 0 && (
                <div className="flex flex-col gap-4">
                  {stack.map((p, i) => (
                    <Reveal key={p.slug} delay={0.06 + i * 0.06}>
                      <Row post={p} />
                    </Reveal>
                  ))}
                </div>
              )}
            </div>

            {expanded && overflow.length > 0 && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {overflow.map((p, i) => (
                  <Reveal key={p.slug} delay={Math.min(i, 3) * 0.06}>
                    <Row post={p} />
                  </Reveal>
                ))}
              </div>
            )}

            {/* The comp's footer row. It earns its place by revealing whatever
                did not fit above rather than linking back to this same page. */}
            {overflow.length > 0 && !expanded && (
              <div className="mt-8 flex items-center gap-6">
                <span aria-hidden="true" className="h-px flex-1" style={{ background: LINE }} />
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="group inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-[0.9rem] font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
                  style={{ background: "#c2a163" }}
                >
                  Explore the journal
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </div>
            )}
          </>
        )}

        <p className="mt-10 text-[0.78rem] leading-relaxed" style={{ color: MUTED }}>
          Articles are for general information only. They are not medical advice and do not create a
          patient-provider relationship. Talk to a licensed provider about your own circumstances.
        </p>
      </section>

      <Footer />
    </main>
  );
}
