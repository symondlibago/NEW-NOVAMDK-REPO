import posts from "../content/blog/posts.json";

/* The blog's data layer, and the ONLY file that knows where posts come from.
   Pages and components import from here and never touch the source.

   Posts are authored in GoHighLevel and pulled into the JSON below by
   scripts/ghl-blog-sync.mjs. scripts/seo-routes.mjs parses the identical file
   under Node, which is why the source is JSON rather than a .js module: one
   shape, two consumers, no scraping.

   Post shape:
     slug, title, excerpt, description, date (YYYY-MM-DD), image, imageAlt,
     tags[], author { name, role }, ghlId, body[], draft?

   `draft: true` marks a post still unpublished in GHL. It renders for anyone with
   the URL so copy can be reviewed in place, but carries noindex and is left out
   of sitemap.xml, prerendering and the /sitemap page.

   Body blocks: { type: "p" | "h2" | "h3" | "quote" | "ul" | "image" | "cta" }
   Blocks rather than raw HTML on purpose. GHL's editor output would need
   sanitising before it could be injected, and blocks let our own typography own
   the rendering instead of inheriting a page builder's markup. */

const WORDS_PER_MINUTE = 220;

/** Rough read time in whole minutes, floored at 1. */
export function readTime(post) {
  const words = (post.body || []).reduce((n, b) => {
    if (b.text) return n + b.text.split(/\s+/).length;
    if (b.items) return n + b.items.join(" ").split(/\s+/).length;
    return n;
  }, 0);
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** "2026-08-14" -> "August 14, 2026". Parsed as UTC so the date never shifts. */
export function formatDate(iso) {
  const [y, m, d] = String(iso || "").split("-").map(Number);
  if (!y || !m || !d) return "";
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  });
}

/** All posts, newest first. */
export function getPosts() {
  return [...posts].sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

/** The newest `limit` published posts, one per title.
    The sync has re-imported at least one article under a second slug
    ("why-does-energy-decline-with-age" and "blog-why-does-energy-decline-with-age"),
    and a short list is exactly where that shows: the same headline twice in a
    row of three reads as a broken page. Deduping here rather than in a view
    keeps every caller honest. */
export function latestPosts(limit = 3) {
  const seen = new Set();
  return getPosts()
    .filter((p) => !p.draft)
    .filter((p) => {
      const key = String(p.title || "").trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

/* Tags arrive from GoHighLevel in two shapes: names an author typed
   ("Weight Management") and slugs the CMS generated ("unisex-anti-aging-rx").
   Anything rendered to a reader goes through here so a slug never reaches the
   page. The map covers the ones whose de-slugified form would still read badly;
   everything else falls through to title case. */
const TAG_LABELS = {
  "unisex-anti-aging-rx": "Longevity",
  "mind-body-healing": "Mind & Body",
  "benefits-holistic-wellness": "Holistic Wellness",
};

/* The site's five categories, in nav order, and the same five offered by the
   Category field in GoHighLevel. Fixed rather than derived from whatever tags
   the posts happen to carry: the categories are the taxonomy, and a post that
   does not sit in one of them is a post that needs its category set, not a new
   chip on the page. Lives here so the blog index and the home band filter by
   one definition instead of two drifting copies. */
export const CATEGORIES = [
  { label: "Weight Loss", slug: "weight-loss" },
  { label: "Longevity", slug: "longevity" },
  { label: "Skin Health", slug: "skin-health" },
  { label: "Sexual Health", slug: "sexual-health" },
  { label: "Recovery & Wellness", slug: "recovery-wellness" },
];

/* GHL hands the category back as a display name on some posts and a slug on
   others, so both sides are flattened before they are compared. */
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** Whether a post belongs to a category. The tagLabel comparison is what keeps
    a card's visible category and its chip in agreement: without it a post
    tagged "unisex-anti-aging-rx" reads LONGEVITY and then vanishes when the
    Longevity chip is pressed. */
export function inCategory(post, cat) {
  return (post.tags || []).some(
    (t) => norm(t) === norm(cat.label) || norm(t) === norm(cat.slug) || norm(tagLabel(t)) === norm(cat.label)
  );
}

/** The category a post belongs to, or its raw tag tidied up if it has none. */
export function categoryOf(post) {
  const hit = CATEGORIES.find((c) => inCategory(post, c));
  return hit ? hit.label : tagLabel(post.tags?.[0]);
}

/** Display label for a raw tag. */
export function tagLabel(tag) {
  if (!tag) return "";
  if (TAG_LABELS[tag]) return TAG_LABELS[tag];
  if (!tag.includes("-")) return tag;
  return tag
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** One post by slug, or null. */
export function getPost(slug) {
  return posts.find((p) => p.slug === slug) || null;
}

/** Up to `limit` other posts, preferring ones that share a tag. */
export function relatedPosts(post, limit = 2) {
  const tags = new Set(post?.tags || []);
  const others = getPosts().filter((p) => p.slug !== post?.slug);
  const shared = others.filter((p) => (p.tags || []).some((t) => tags.has(t)));
  const rest = others.filter((p) => !shared.includes(p));
  return [...shared, ...rest].slice(0, limit);
}
