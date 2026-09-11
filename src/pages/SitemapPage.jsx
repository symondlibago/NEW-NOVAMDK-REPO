import React from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import Navbar from "../components/Nav/Navbar";
import Footer from "../components/Nav/Footer";
import PageHero from "../components/shop/PageHero";
import Reveal from "../components/ui/Reveal";
import { visibleProducts } from "../components/data/products";
import { productPath } from "../lib/slug";
import { LEGAL_PAGES } from "../lib/siteLinks";
import { groupedCatalog } from "../lib/catalog";
import { getPosts } from "../lib/blog";

const linkClass =
  "text-[0.92rem] leading-relaxed text-muted transition-colors hover:text-primary";

function LinkColumn({ heading, links }) {
  return (
    <div>
      <h2 className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.13em] text-ink">
        {heading}
      </h2>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className={linkClass}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SitemapPage() {
  const groups = groupedCatalog();
  // Drafts are previewable at their own URL but never advertised here.
  const blogPosts = getPosts().filter((p) => !p.draft);

  const categoryLinks = groups.map((g) => ({ to: g.href, label: g.label }));
  const companyLinks = [
    { to: "/", label: "Home" },
    { to: "/treatments", label: "All Treatments" },
    { to: "/blog", label: "Blog" },
    { to: "/weight-loss-calculator", label: "Weight Loss Calculator" },
    { to: "/start", label: "Free Online Assessment" },
    { to: "/contact", label: "Contact Us" },
  ];
  const legalLinks = LEGAL_PAGES.map(([id, label]) => ({ to: `/legal/${id}`, label }));

  const productCount = visibleProducts.length;

  return (
    <main className="min-h-screen w-full bg-bg text-ink">
      <Seo
        title="Sitemap: All Treatments & Pages"
        description={`Browse every page on Nova MDK: all ${productCount} treatments, treatment categories, tools and policies, in one place.`}
        path="/sitemap"
      />
      <Navbar />

      <PageHero
        showBack
        eyebrow="Sitemap"
        title="Every page on Nova MDK"
        subtitle="A complete index of our treatments, tools and policies."
      />

      <section className="mx-auto max-w-[1180px] px-5 py-[clamp(2.6rem,5vw,4rem)] md:px-10">
        <Reveal>
          <div className="grid grid-cols-1 gap-10 rounded-[calc(22px*var(--nv-r-scale,1))] border border-line bg-surface px-6 py-8 sm:grid-cols-2 md:grid-cols-3 md:px-10 md:py-10">
            <LinkColumn heading="Treatment Categories" links={categoryLinks} />
            <LinkColumn heading="Company" links={companyLinks} />
            <LinkColumn heading="Legal" links={legalLinks} />
          </div>
        </Reveal>

        <div className="mt-[clamp(2rem,4vw,3rem)] space-y-8">
          {groups.map((g, i) => (
            <Reveal key={g.slug} delay={Math.min(i, 3) * 0.06}>
              <div className="rounded-[calc(22px*var(--nv-r-scale,1))] border border-line bg-surface px-6 py-7 md:px-10">
                <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-4">
                  <h2 className="font-display text-[1.15rem] font-bold leading-tight">
                    <Link to={g.href} className="transition-colors hover:text-primary">{g.label}</Link>
                  </h2>
                  <span className="font-mono text-[0.66rem] uppercase tracking-[0.12em] text-muted">
                    {g.products.length} {g.products.length === 1 ? "product" : "products"}
                  </span>
                </div>
                <ul className="grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2 md:grid-cols-3">
                  {g.products.map((p) => (
                    <li key={p.id}>
                      <Link to={productPath(p)} className={linkClass}>{p.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        {blogPosts.length > 0 && (
          <Reveal>
            <div className="mt-[clamp(2rem,4vw,3rem)] rounded-[calc(22px*var(--nv-r-scale,1))] border border-line bg-surface px-6 py-7 md:px-10">
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-4">
                <h2 className="font-display text-[1.15rem] font-bold leading-tight">
                  <Link to="/blog" className="transition-colors hover:text-primary">Blog</Link>
                </h2>
                <span className="font-mono text-[0.66rem] uppercase tracking-[0.12em] text-muted">
                  {blogPosts.length} {blogPosts.length === 1 ? "article" : "articles"}
                </span>
              </div>
              <ul className="grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
                {blogPosts.map((p) => (
                  <li key={p.slug}>
                    <Link to={`/blog/${p.slug}`} className={linkClass}>{p.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        )}

        <p className="mt-8 text-[0.82rem] leading-relaxed text-muted">
          Looking for the machine-readable version? It lives at{" "}
          <a href="/sitemap.xml" className="font-medium text-primary hover:underline">/sitemap.xml</a>.
        </p>
      </section>

      <Footer />
    </main>
  );
}
