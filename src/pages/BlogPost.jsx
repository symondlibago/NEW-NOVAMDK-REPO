import React from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Seo from "../components/Seo";
import Navbar from "../components/Nav/Navbar";
import Footer from "../components/Nav/Footer";
import Reveal from "../components/ui/Reveal";
import PostBody from "../components/blog/PostBody";
import PostCard from "../components/blog/PostCard";
import { getPost, relatedPosts, formatDate } from "../lib/blog";
import { SITE_URL, absoluteUrl } from "../lib/absoluteUrl";

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = getPost(slug);

  // Unknown slug goes to the index rather than a dead end, which also covers any
  // post that gets unpublished in GHL after being shared.
  if (!post) return <Navigate to="/blog" replace />;

  const related = relatedPosts(post);

  return (
    <main className="min-h-screen w-full bg-bg text-ink">
      <Seo
        title={post.title}
        description={post.description || post.excerpt}
        path={`/blog/${post.slug}`}
        image={post.image}
        noindex={Boolean(post.draft)}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.description || post.excerpt,
          image: absoluteUrl(post.image),
          datePublished: post.date,
          dateModified: post.date,
          author: { "@type": "Organization", name: post.author?.name || "Nova MDK" },
          publisher: {
            "@type": "Organization",
            name: "Nova MDK",
            logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
          },
          mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${post.slug}` },
        }}
      />
      <Navbar />

      {/* ---------------- header ---------------- */}
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-[1180px] px-5 pb-[clamp(2rem,4vw,3rem)] pt-6 md:px-10">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-[0.88rem] font-semibold text-muted transition-colors hover:text-primary"
          >
            <ArrowLeft size={15} /> Blog
          </Link>

          {/* Still a draft in GoHighLevel. Search engines never see it (noindex,
              and the sync keeps drafts out of sitemap.xml), but anyone reviewing
              the article should know it is not live copy. */}
          {post.draft && (
            <p className="mt-6 rounded-[calc(14px*var(--nv-r-scale,1))] border border-line bg-surface-2 px-4 py-3 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-muted">
              Draft preview: not published in GoHighLevel yet
            </p>
          )}

          <div className="mx-auto mt-8 max-w-[68ch]">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[0.66rem] uppercase tracking-[0.12em] text-muted">
              {post.tags?.[0] && <span className="text-primary">{post.tags[0]}</span>}
              {post.tags?.[0] && <span aria-hidden="true">·</span>}
              <span>{formatDate(post.date)}</span>
            </div>

            <h1 className="mt-4 font-display text-[clamp(1.9rem,4.4vw,3rem)] font-extrabold leading-[1.08] tracking-tight">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="mt-4 text-[clamp(1.02rem,1.6vw,1.15rem)] leading-relaxed text-muted">
                {post.excerpt}
              </p>
            )}

            {post.author?.name && (
              <div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 font-display text-[0.8rem] font-bold text-primary">
                  {post.author.name.slice(0, 1)}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[0.9rem] font-bold leading-tight text-ink">{post.author.name}</span>
                  {post.author.role && (
                    <span className="mt-0.5 text-[0.8rem] leading-snug text-muted">{post.author.role}</span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ---------------- hero image ---------------- */}
      {post.image && (
        <div className="mx-auto max-w-[1180px] px-5 pt-[clamp(1.75rem,4vw,2.75rem)] md:px-10">
          <Reveal>
            <div className="aspect-[16/9] overflow-hidden rounded-[calc(28px*var(--nv-r-scale,1))] border border-line nv-shadow">
              <img
                src={post.image}
                alt={post.imageAlt || ""}
                className="h-full w-full object-cover"
              />
            </div>
          </Reveal>
        </div>
      )}

      {/* ---------------- body ---------------- */}
      <article className="mx-auto max-w-[1180px] px-5 py-[clamp(2.25rem,5vw,3.5rem)] md:px-10">
        <PostBody blocks={post.body} />

        <div className="mx-auto mt-[clamp(2.5rem,5vw,3.5rem)] max-w-[68ch] border-t border-line pt-6">
          <p className="text-[0.8rem] leading-relaxed text-muted">
            This article is for general information only. It is not medical advice, does not create a
            patient-provider relationship, and is not a substitute for evaluation by a licensed
            provider. Talk to a provider about your own circumstances.
          </p>
        </div>
      </article>

      {/* ---------------- related ---------------- */}
      {related.length > 0 && (
        <section className="border-t border-line bg-surface">
          <div className="mx-auto max-w-[1180px] px-5 py-[clamp(2.4rem,5vw,4rem)] md:px-10">
            <h2 className="mb-6 font-display text-[1.3rem] font-extrabold leading-tight">Keep reading</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {related.map((p, i) => (
                <Reveal key={p.slug} delay={i * 0.07} className="h-full">
                  <PostCard post={p} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
