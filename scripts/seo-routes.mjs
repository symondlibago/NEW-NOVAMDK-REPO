import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { slugify, productSlug } from "../src/lib/slug.js";
import { CATEGORY_META } from "../src/lib/categoryMeta.js";
import { LEGAL_PAGES, CONTENT_PAGES } from "../src/lib/siteLinks.js";
import { SITE_URL, absoluteUrl } from "../src/lib/absoluteUrl.js";

export { SITE_URL };
const SITE_NAME = "Nova MDK";
export const DEFAULT_TITLE = "Nova MDK | Premium Telehealth & Longevity";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function extractProducts() {
  const src = readFileSync(join(root, "src/components/data/products.jsx"), "utf8");
  const idMatches = [...src.matchAll(/^\s{4}id:\s*(\d+),/gm)];
  if (idMatches.length === 0) {
    throw new Error("seo-routes: no product ids found in products.jsx — regex out of sync?");
  }
  const field = (block, name) => block.match(new RegExp(`${name}:\\s*"([^"]*)"`))?.[1] ?? "";
  const flag = (block, name) => new RegExp(`${name}:\\s*true`).test(block);
  const lastIndex = idMatches[idMatches.length - 1].index;
  const arrayEnd = src.indexOf("\n];", lastIndex);
  const limit = arrayEnd === -1 ? src.length : arrayEnd;

  const products = idMatches
    .map((m, i) => {
      const end = i + 1 < idMatches.length ? idMatches[i + 1].index : limit;
      const block = src.slice(m.index, end);
      return {
        id: Number(m[1]),
        name: field(block, "name"),
        subtitle: field(block, "subtitle"),
        categoryName: field(block, "categoryName"),
        categorySlug: field(block, "categorySlug"),
        img: field(block, "img"),
        brandName: field(block, "brandName"),
        price: field(block, "price"),
        slug: field(block, "slug"),
        hidden: flag(block, "hidden"),
      };
    })
    // `hidden: true` products redirect to their category, so listing them would
    // hand Google a sitemap full of redirects.
    .filter((p) => !p.hidden);
  // Guard against slug collisions — two products must never share a URL.
  const seen = new Map();
  for (const p of products) {
    const slug = productSlug(p);
    if (seen.has(slug)) {
      throw new Error(`seo-routes: duplicate product slug "${slug}" (ids ${seen.get(slug)} and ${p.id})`);
    }
    seen.set(slug, p.id);
  }
  return products;
}

export function buildRoutes() {
  const products = extractProducts();

  const routes = [
    {
      path: "/",
      title: DEFAULT_TITLE,
      description:
        "Personalized prescription treatments, reviewed by licensed physicians and delivered to your door.",
      priority: "1.0",
    },
    {
      path: "/treatments",
      title: `Treatments — Physician-Prescribed Telehealth Care | ${SITE_NAME}`,
      description:
        "Explore Nova MDK treatments for weight loss, longevity, skin health, sexual wellness and recovery — prescribed online by licensed physicians and shipped to your door.",
      priority: "0.9",
    },
    {
      path: "/kiosk",
      title: `Smart Kiosk — Telehealth in Gyms, Med Spas & Clubs | ${SITE_NAME}`,
      description:
        "Nova MDK Smart Kiosks bring physician-guided telehealth consultations to flagship centers, premium gyms, luxury med spas and member clubs.",
      priority: "0.7",
    },
    {
      path: "/contact",
      title: `Contact Us | ${SITE_NAME}`,
      description:
        "Get in touch with the Nova MDK care team — questions about treatments, orders, kiosk partnerships or anything else.",
      priority: "0.6",
    },
  ];

  for (const [slug, meta] of Object.entries(CATEGORY_META)) {
    routes.push({
      path: `/treatments/${slug}`,
      title: `${meta.title} | ${SITE_NAME}`,
      description: meta.description,
      priority: "0.9",
    });
  }

  for (const p of products) {
    const priceNum = String(p.price || "").replace(/[^0-9.]/g, "");
    const offers =
      Number(priceNum) > 0
        ? {
            "@type": "Offer",
            price: priceNum,
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url: `${SITE_URL}/product/${productSlug(p)}`,
          }
        : undefined;
    routes.push({
      path: `/product/${productSlug(p)}`,
      title: `${p.name} — ${p.categoryName} | ${SITE_NAME}`,
      description: p.subtitle || `${p.name} from Nova MDK — physician-guided telehealth treatment, delivered to your door.`,
      image: p.img ? `${SITE_URL}${p.img}` : undefined,
      priority: "0.8",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Product",
        name: p.name,
        description: p.subtitle || undefined,
        image: p.img ? `${SITE_URL}${p.img}` : undefined,
        category: p.categoryName,
        brand: { "@type": "Brand", name: p.brandName || SITE_NAME },
        offers,
      },
    });
  }

  // Standalone marketing/tool pages (calculator, HTML sitemap).
  for (const page of CONTENT_PAGES) {
    routes.push({ ...page, title: `${page.title} | ${SITE_NAME}` });
  }

  // Blog. Posts are authored in GoHighLevel and land in this JSON via
  // scripts/ghl-blog-sync.mjs; parsing the same file the app imports is what
  // keeps the prerendered <head> and sitemap.xml in step with what renders.
  // `draft: true` posts stay reachable in the browser for review but get no
  // static page and no sitemap entry, so Google never indexes unfinished copy.
  const posts = JSON.parse(
    readFileSync(join(root, "src/content/blog/posts.json"), "utf8")
  ).filter((p) => !p.draft);
  routes.push({
    path: "/blog",
    title: `Blog: Guides on Weight Loss, Longevity and Skin | ${SITE_NAME}`,
    description:
      "Clinician-reviewed guides from Nova MDK on GLP-1 weight loss, longevity, skin health and sexual wellness. Written to answer the questions patients actually ask.",
    priority: "0.9",
  });
  for (const p of posts) {
    routes.push({
      path: `/blog/${p.slug}`,
      title: `${p.title} | ${SITE_NAME}`,
      description: p.description || p.excerpt,
      image: absoluteUrl(p.image),
      priority: "0.7",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: p.title,
        description: p.description || p.excerpt,
        image: absoluteUrl(p.image),
        datePublished: p.date,
        dateModified: p.date,
        author: { "@type": "Organization", name: p.author?.name || SITE_NAME },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${p.slug}` },
      },
    });
  }

  for (const [id, title] of LEGAL_PAGES) {
    routes.push({
      path: `/legal/${id}`,
      title: `${title} | ${SITE_NAME}`,
      description: `${title} for Nova MDK telehealth services.`,
      priority: "0.3",
    });
  }

  return routes;
}

// slugify re-exported for scripts that need it directly.
export { slugify, productSlug };
