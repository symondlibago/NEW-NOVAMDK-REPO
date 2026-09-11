/* Pulls blog posts out of GoHighLevel and writes src/content/blog/posts.json.
 *
 * GHL is the authoring tool: marketing writes there, this script is the only
 * bridge, and the site renders the result in its own typography. Posts are NOT
 * served from GHL's own blog domain on purpose — hosting them on novamdk.com is
 * what makes the SEO accrue to the real domain instead of a subdomain.
 *
 *   node scripts/ghl-blog-sync.mjs                 published posts, all sites
 *   node scripts/ghl-blog-sync.mjs --drafts        drafts too (for previewing)
 *   node scripts/ghl-blog-sync.mjs --dry-run       report only, write nothing
 *   node scripts/ghl-blog-sync.mjs --site="Name"   one blog site only
 *   node scripts/ghl-blog-sync.mjs --blog=<id>     skip the site listing entirely
 *   node scripts/ghl-blog-sync.mjs --soft          never fail the build
 *
 * `pnpm build` runs this with --soft, so a deploy refreshes the blog by itself.
 * Soft mode means a GHL outage or a rotated token leaves the committed
 * posts.json in place and the deploy carries on: publishing an article must
 * never be able to block an unrelated release.
 *
 * The GHL editor emits HTML; the site renders blocks. htmlToBlocks() below is
 * that translation, and it is deliberately lossy: headings, paragraphs, lists,
 * quotes and images survive, everything else is flattened to text. Blocks mean
 * our typography owns the rendering and there is no untrusted HTML to sanitise.
 *
 * Two quirks of the GHL API worth knowing before editing this:
 *   - /blogs/posts/all returns NOTHING unless `status` is set, and the value is
 *     an uppercase enum (PUBLISHED, DRAFT, SCHEDULED, ARCHIVED). Omitting it
 *     silently yields count: 0 rather than an error, so each status is a
 *     separate request.
 *   - That listing carries metadata only. The article body (`rawHTML`) comes
 *     from GET /blogs/posts/{postId}, one call per post.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { slugify } from "../src/lib/slug.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "src/content/blog/posts.json");

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const valueOf = (f) => args.find((a) => a.startsWith(`${f}=`))?.slice(f.length + 1);

const INCLUDE_DRAFTS = has("--drafts") || has("--include-drafts");
const DRY_RUN = has("--dry-run");
const SOFT = has("--soft");
const ONLY_SITE = valueOf("--site");
// Blog ids, comma separated. Two jobs: listing sites needs a scope that reading
// posts does not, so this is the escape hatch when that scope is missing (the id
// is in the GHL URL with a blog site open), and it pins the sync to specific
// sites while GHL still holds demo content. GHL_BLOG_IDS lets Vercel set it
// without a code change, and dropping the variable syncs every site.
const BLOG_IDS = (valueOf("--blog") || process.env.GHL_BLOG_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/* ------------------------------------------------------------------ env ---- */

// Vercel injects env vars; a local run reads .env, which is why there is no
// dotenv dependency for a script that runs twice a week.
function loadEnv() {
  const file = join(root, ".env");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    if (!process.env[key]) process.env[key] = line.slice(i + 1).trim();
  }
}
loadEnv();

const BASE = process.env.GHL_API_BASE || "https://services.leadconnectorhq.com";
const TOKEN = process.env.GHL_API_TOKEN;
const LOCATION_ID = process.env.GHL_LOCATION_ID;
const VERSION = process.env.GHL_API_VERSION || "2021-07-28";

const SCOPE_HELP = `
GHL rejected the request for lack of scope. The token itself is fine, since
contacts work with it. The Private Integration just has no blog permissions.

Fix, in GHL: Settings > Private Integrations > open the integration whose token
is GHL_API_TOKEN > Edit > tick the Blogs scopes > Update. Needed:

    View Blogs        (blogs/post.readonly)
    View Blog Authors (blogs/author.readonly)
    View Blog Categories (blogs/category.readonly)

The token string does not change when scopes are added, so nothing in .env or
Vercel needs updating. Re-run this script afterwards.
`;

/* ---------------------------------------------------------------- fetch ---- */

async function ghl(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, Version: VERSION, Accept: "application/json" },
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* error bodies aren't always JSON */
  }
  if (res.status === 401) {
    const err = new Error(data?.message || "Unauthorized");
    err.scope = /scope/i.test(data?.message || "");
    throw err;
  }
  if (!res.ok) throw new Error(data?.message || `GHL GET ${path} failed (${res.status})`);
  return data;
}

// GHL is inconsistent about the array key per endpoint (`data`, `blogs`,
// `authors`...), so take the first array-valued property rather than guessing.
function listOf(payload) {
  if (Array.isArray(payload)) return payload;
  for (const key of ["data", "blogs", "posts", "sites", "authors", "categories"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  const first = Object.values(payload || {}).find(Array.isArray);
  return first || [];
}

const idOf = (o) => o?._id || o?.id || null;

async function paginate(build, pageSize = 50) {
  const all = [];
  for (let offset = 0; offset < 1000; offset += pageSize) {
    const page = listOf(await ghl(build(offset, pageSize)));
    all.push(...page);
    if (page.length < pageSize) break;
  }
  return all;
}

/* -------------------------------------------------------------- html --> ---- */

const ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
  mdash: "—", ndash: "–", hellip: "…", middot: "·", deg: "°",
};

function decode(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

/** Inline HTML to plain text: tags dropped, entities decoded, whitespace collapsed. */
function toText(html) {
  return decode(
    String(html)
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]*>/g, "")
  )
    .replace(/\s+/g, " ")
    .trim();
}

const attr = (attrs, name) =>
  attrs.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i"))?.[1] ??
  attrs.match(new RegExp(`${name}\\s*=\\s*'([^']*)'`, "i"))?.[1] ??
  "";

const BLOCK_TAGS = "h1|h2|h3|h4|h5|h6|p|ul|ol|blockquote|figure|figcaption|div|section|article|pre|table|img|hr";
const VOID_TAGS = new Set(["img", "hr"]);

/* Index of the tag's matching close, counting nested opens of the same name.
   `from` is the index just past the opening tag. */
function closeOf(html, tag, from) {
  const re = new RegExp(`<(/?)${tag}\\b[^>]*?(/?)>`, "gi");
  re.lastIndex = from;
  let depth = 0;
  let m;
  while ((m = re.exec(html))) {
    if (m[2] === "/") continue; // self-closing, neither opens nor closes
    if (m[1] === "/") {
      if (depth === 0) return { inner: html.slice(from, m.index), end: re.lastIndex };
      depth -= 1;
    } else {
      depth += 1;
    }
  }
  return { inner: html.slice(from), end: html.length };
}

function pushText(out, html) {
  const text = toText(html);
  if (text) out.push({ type: "p", text });
}

function pushImage(out, attrs) {
  const src = attr(attrs, "src");
  if (!src) return;
  const alt = attr(attrs, "alt");
  out.push({ type: "image", src, ...(alt && { alt }) });
}

function emit(tag, inner, out) {
  switch (tag) {
    case "h1":
    case "h2":
      pushHeading(out, "h2", inner);
      break;
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      pushHeading(out, "h3", inner);
      break;

    case "p": {
      const text = toText(inner);
      const imgs = [...inner.matchAll(/<img\b([^>]*)>/gi)];
      // A paragraph whose only content is an image is a figure, not a paragraph.
      if (!text && imgs.length) {
        imgs.forEach((m) => pushImage(out, m[1]));
        break;
      }
      if (text) out.push({ type: "p", text });
      break;
    }

    case "ul":
    case "ol": {
      const items = [...inner.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
        .map((m) => toText(m[1]))
        .filter(Boolean);
      if (items.length) out.push({ type: "ul", items });
      break;
    }

    case "blockquote": {
      const text = toText(inner);
      if (text) out.push({ type: "quote", text });
      break;
    }

    case "figure": {
      // Walk the figure, then fold its caption onto the image it belongs to.
      const sub = [];
      walk(inner, sub);
      const caption = sub.filter((b) => b.type === "caption").map((b) => b.text).join(" ");
      const blocks = sub.filter((b) => b.type !== "caption");
      const image = blocks.find((b) => b.type === "image");
      if (image && caption) image.caption = caption;
      out.push(...blocks);
      if (!image && caption) out.push({ type: "p", text: caption });
      break;
    }

    case "figcaption": {
      const text = toText(inner);
      if (text) out.push({ type: "caption", text });
      break;
    }

    // Layout wrappers the page builder adds: transparent, keep walking.
    case "div":
    case "section":
    case "article":
      walk(inner, out);
      break;

    case "pre":
      pushText(out, inner);
      break;

    // No table block exists in PostBody, so flatten to readable prose rather
    // than letting the cells run together into one word.
    case "table": {
      const text = toText(inner.replace(/<\/(td|th)>/gi, ", ").replace(/<\/tr>/gi, ". "))
        .replace(/[,.\s]+$/, "");
      if (text) out.push({ type: "p", text });
      break;
    }
  }
}

function pushHeading(out, type, inner) {
  const text = toText(inner);
  if (text) out.push({ type, text });
}

function walk(html, out) {
  const re = new RegExp(`<(${BLOCK_TAGS})\\b([^>]*?)(/?)>`, "gi");
  let cursor = 0;
  let m;
  while ((m = re.exec(html))) {
    if (m.index < cursor) continue;
    pushText(out, html.slice(cursor, m.index));

    const tag = m[1].toLowerCase();
    const attrs = m[2] || "";
    const openEnd = m.index + m[0].length;

    if (VOID_TAGS.has(tag)) {
      if (tag === "img") pushImage(out, attrs);
      cursor = openEnd;
      re.lastIndex = openEnd;
      continue;
    }

    const { inner, end } = closeOf(html, tag, openEnd);
    emit(tag, inner, out);
    cursor = end;
    re.lastIndex = end;
  }
  pushText(out, html.slice(cursor));
}

/* ------------------------------------------------------------- reflow ----- */

/* Text pasted into the GHL editor from a PDF or Word arrives as one <p> per
   VISUAL LINE, with no headings and no lists: 192 paragraphs, sentences split
   mid-clause, bullet points as bare lines. Rendering that verbatim gives a wall
   of one-line paragraphs, so imports get repaired here.
   The durable fix is formatting the post properly in GHL; this stops badly
   pasted copy from reaching the site in the meantime. */

const ENDS_SENTENCE = /[.!?:;”"’']$/;
const STARTS_CONTINUATION = /^[a-z,;:)\]”’"-]/;
const NO_SPACE_BEFORE = /^[,;:.!?)\]”’]/;
// "1. Your Body May Need Fewer Calories" — a numbered section header.
const NUMBERED_HEADING = /^\d{1,2}[.)]\s+[A-Z][^.!?]{4,90}$/;

const LIST_MAX_CHARS = 60;
const LIST_MIN_ITEMS = 3;
const isListItem = (b) =>
  b.type === "p" && b.text.length <= LIST_MAX_CHARS && /^[A-Z“"]/.test(b.text) && !/[.!?,;:]$/.test(b.text);

/* A period butted straight against the next capital is a PDF extraction
   artefact ("maintenance.In simple terms"). Two lowercase letters are required
   before it so initialisms like "U.S." are left alone. */
const despace = (s) => s.replace(/([a-z]{2})\.([A-Z])/g, "$1. $2");

function reflow(blocks, notes) {
  // 1. Headings first, so they act as barriers to the line joining below.
  let out = blocks.map((b) =>
    b.type === "p" && NUMBERED_HEADING.test(b.text) ? { type: "h2", text: b.text } : b
  );
  notes.headings = out.filter((b) => b.type === "h2").length - blocks.filter((b) => b.type === "h2").length;

  // 2. Runs of short unpunctuated lines are bullet points that lost their <ul>.
  //    Done before joining, which would otherwise glue the items into prose.
  const grouped = [];
  for (let i = 0; i < out.length; ) {
    let j = i;
    while (j < out.length && isListItem(out[j])) j += 1;
    if (j - i >= LIST_MIN_ITEMS) {
      grouped.push({ type: "ul", items: out.slice(i, j).map((b) => b.text) });
      notes.lists += 1;
      i = j;
    } else {
      grouped.push(out[i]);
      i += 1;
    }
  }

  // 3. Stitch hard-wrapped lines back into sentences.
  out = [];
  for (const b of grouped) {
    const prev = out[out.length - 1];
    const joinable =
      b.type === "p" &&
      prev?.type === "p" &&
      (!ENDS_SENTENCE.test(prev.text) || STARTS_CONTINUATION.test(b.text));
    if (joinable) {
      prev.text += (NO_SPACE_BEFORE.test(b.text) ? "" : " ") + b.text;
      notes.joins += 1;
    } else {
      out.push({ ...b });
    }
  }

  for (const b of out) {
    if (b.text) b.text = despace(b.text);
    if (b.items) b.items = b.items.map(despace);
  }
  return out;
}

export function htmlToBlocks(html, notes = { joins: 0, lists: 0, headings: 0 }) {
  if (!html) return [];
  const cleaned = String(html)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  const out = [];
  walk(cleaned, out);

  // Collapse runs of identical adjacent paragraphs, which nested wrappers can
  // otherwise produce, and drop any stray captions.
  const cleanBlocks = out.filter(
    (b, i, all) =>
      b.type !== "caption" && !(b.type === "p" && all[i - 1]?.type === "p" && all[i - 1].text === b.text)
  );
  return reflow(cleanBlocks, notes);
}

/* --------------------------------------------------------------- mapping ---- */

const firstOf = (o, keys) => {
  for (const k of keys) if (o?.[k]) return o[k];
  return "";
};

/* GHL stores meta descriptions with the author's hard line breaks intact, which
   would reach <meta name="description"> verbatim. */
const oneLine = (s) => String(s || "").replace(/\s+/g, " ").trim();

/** GHL timestamps are ISO or epoch ms; the site keys posts by calendar day. */
function toDate(value) {
  if (!value) return "";
  const d = typeof value === "number" ? new Date(value) : new Date(String(value));
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function isPublished(post) {
  const status = String(firstOf(post, ["status", "state"]) || "").toLowerCase();
  if (status) return status === "published" || status === "publish";
  return Boolean(post?.publishedAt);
}

function mapPost(post, { authors, categories }, notes) {
  const title = firstOf(post, ["title", "name"]);
  const rawSlug = firstOf(post, ["urlSlug", "slug", "url_slug"]);
  const excerpt = firstOf(post, ["description", "excerpt", "summary", "metaDescription"]);
  const image = firstOf(post, ["imageUrl", "image", "featuredImage", "coverImage"]);
  const authorId = typeof post.author === "string" ? post.author : idOf(post.author);
  const author = authors.get(authorId);

  // Categories come back as ids on some responses and as full objects on others,
  // so read an embedded label when there is one and fall back to the lookup.
  const label = (c) =>
    typeof c === "string" ? categories.get(c) : firstOf(c, ["label", "name"]) || categories.get(idOf(c));
  const tags = [
    ...(Array.isArray(post.categories) ? post.categories.map(label).filter(Boolean) : []),
    ...(Array.isArray(post.tags) ? post.tags.filter((t) => typeof t === "string") : []),
  ];

  return {
    slug: slugify(rawSlug || title),
    title: oneLine(title),
    excerpt: oneLine(excerpt),
    description: oneLine(firstOf(post, ["metaDescription", "seoDescription"]) || excerpt),
    date: toDate(firstOf(post, ["publishedAt", "updatedAt", "createdAt"])),
    // Only what GHL actually says. A byline like "Reviewed by a licensed
    // provider" is a medical claim, so it is never invented here — set it as the
    // author's title in GHL and it will carry through.
    author: {
      name: oneLine(author?.name) || "Nova MDK Care Team",
      ...(oneLine(author?.role) && oneLine(author.role) !== oneLine(author?.name)
        ? { role: oneLine(author.role) }
        : {}),
    },
    image,
    imageAlt: oneLine(firstOf(post, ["imageAltText", "imageAlt", "altText"]) || title),
    tags: [...new Set(tags)],
    ghlId: idOf(post),
    body: htmlToBlocks(firstOf(post, ["rawHTML", "content", "html", "body"]), notes),
  };
}

/* ------------------------------------------------------------------ run ---- */

/* Sets the exit code and lets Node wind down on its own. Calling process.exit()
   while undici still holds open sockets trips a libuv assertion on Windows,
   which buries the actual error message under a crash dump. */
function fail(message, extra) {
  console.error(SOFT ? `[blog sync skipped] ${message}` : message);
  if (extra && !SOFT) console.error(extra);
  if (SOFT) console.error("Keeping the committed posts.json and continuing the build.");
  else process.exitCode = 1;
}

/* Returns the blog sites to walk, or null if the caller should stop. Reading
   posts and listing sites are governed by separate GHL scopes, so a token that
   can do the former may still be refused the latter — in that case explain the
   --blog escape hatch rather than dying on a bare 401. */
async function resolveSites() {
  if (BLOG_IDS.length) return BLOG_IDS.map((id) => ({ _id: id, name: id }));
  try {
    const all = await paginate((o, l) => `/blogs/site/all?locationId=${LOCATION_ID}&skip=${o}&limit=${l}`);
    return all.filter(
      (s) => !ONLY_SITE || firstOf(s, ["name", "title"]) === ONLY_SITE || idOf(s) === ONLY_SITE
    );
  } catch (e) {
    if (!e.scope) throw e;
    fail(
      "Listing blog sites was refused for lack of scope.",
      `
Reading posts works, only the site listing is blocked. Two ways forward:

  1. In GHL, add the remaining Blogs scope to the novamdk-website integration.
     It sits alongside the three already granted and reads roughly
     "View Blogs" / blogs/list.readonly.

  2. Skip the listing. Open the blog site in GHL and copy the id out of the
     address bar, then pass it directly:

         pnpm sync:blog --blog=<id>            (comma separate for several)
`
    );
    return null;
  }
}

async function main() {
  if (!TOKEN || !LOCATION_ID) {
    return fail("Missing GHL_API_TOKEN or GHL_LOCATION_ID.");
  }

  const authors = new Map();
  const categories = new Map();
  for (const a of await paginate((o, l) => `/blogs/authors?locationId=${LOCATION_ID}&limit=${l}&offset=${o}`)) {
    if (idOf(a)) {
      authors.set(idOf(a), {
        name: firstOf(a, ["name", "authorName"]),
        role: firstOf(a, ["title", "role", "description"]),
      });
    }
  }
  for (const c of await paginate((o, l) => `/blogs/categories?locationId=${LOCATION_ID}&limit=${l}&offset=${o}`)) {
    if (idOf(c)) categories.set(idOf(c), firstOf(c, ["label", "name", "title"]));
  }

  const sites = await resolveSites();
  if (!sites) return;
  if (sites.length === 0) {
    return fail(ONLY_SITE ? `No blog site matched "${ONLY_SITE}".` : "This location has no blog sites.");
  }

  // Drafts and scheduled posts are only worth asking for when previewing.
  const statuses = INCLUDE_DRAFTS ? ["PUBLISHED", "DRAFT", "SCHEDULED"] : ["PUBLISHED"];

  const raw = [];
  for (const site of sites) {
    const name = firstOf(site, ["name", "title"]) || idOf(site);
    const posts = [];
    for (const status of statuses) {
      posts.push(
        ...(await paginate(
          (o, l) =>
            `/blogs/posts/all?locationId=${LOCATION_ID}&blogId=${idOf(site)}` +
            `&limit=${l}&offset=${o}&status=${status}`
        ))
      );
    }
    console.log(`${name}: ${posts.length} post${posts.length === 1 ? "" : "s"}`);

    // The listing has no body, so pull each post's detail record for its HTML.
    for (const post of posts) {
      const detail = await ghl(`/blogs/posts/${idOf(post)}?locationId=${LOCATION_ID}`);
      raw.push({ ...post, ...(detail?.blogPost || detail?.post || {}), __site: name });
    }
  }

  const kept = [];
  for (const post of raw) {
    const published = isPublished(post);
    const notes = { joins: 0, lists: 0, headings: 0 };
    const mapped = mapPost(post, { authors, categories }, notes);
    const label = mapped.title || mapped.ghlId;

    // Loud on purpose: heavy repair means the post is badly formatted in GHL,
    // and the fix belongs there rather than in this script.
    if (notes.joins > 20) {
      console.log(
        `  repaired: ${notes.joins} wrapped lines rejoined, ${notes.lists} list${
          notes.lists === 1 ? "" : "s"
        } and ${notes.headings} heading${notes.headings === 1 ? "" : "s"} recovered  ${label}`
      );
    }

    if (!published && !INCLUDE_DRAFTS) {
      console.log(`  skip (draft)   ${label}`);
      continue;
    }
    if (!mapped.slug || !mapped.title) {
      console.log(`  skip (no slug) ${post.__site} / ${mapped.ghlId}`);
      continue;
    }
    if (mapped.body.length === 0) console.log(`  warn: empty body after conversion  ${label}`);
    if (!mapped.date) console.log(`  warn: no date, will sort last  ${label}`);
    if (mapped.body.some((b) => /[—–]/.test(b.text || ""))) {
      console.log(`  note: contains an em or en dash  ${label}`);
    }
    kept.push({ ...mapped, ...(published ? {} : { draft: true }) });
  }

  // Two posts sharing a slug would share a URL; last write would win silently.
  const seen = new Map();
  const posts = kept.filter((p) => {
    if (seen.has(p.slug)) {
      console.log(`  skip (slug clash with "${seen.get(p.slug)}")  ${p.title}`);
      return false;
    }
    seen.set(p.slug, p.title);
    return true;
  });

  posts.sort((a, b) => String(b.date).localeCompare(String(a.date)));

  console.log(
    `\n${posts.length} post${posts.length === 1 ? "" : "s"} ready` +
      (INCLUDE_DRAFTS ? ` (${posts.filter((p) => p.draft).length} draft)` : "")
  );
  for (const p of posts) console.log(`  /blog/${p.slug}${p.draft ? "  [draft]" : ""}`);

  if (DRY_RUN) {
    console.log("\n--dry-run: posts.json untouched.");
    return;
  }
  if (posts.length === 0) {
    return fail("\nRefusing to write an empty posts.json, that would blank the blog.");
  }

  writeFileSync(OUT, `${JSON.stringify(posts, null, 2)}\n`, "utf8");
  console.log(`\nWrote ${OUT}`);
  console.log("Run `pnpm build` to prerender the new pages and refresh sitemap.xml.");
}

// Only when run directly, so htmlToBlocks() can be imported and exercised on
// its own without firing a round of API calls.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => fail(`\nSync failed: ${e.message}`, e.scope ? SCOPE_HELP : null));
}
