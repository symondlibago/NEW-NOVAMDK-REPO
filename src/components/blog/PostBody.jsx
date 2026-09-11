import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/* Renders a post's block array. Long-form typography lives here and nowhere else,
   so every article reads the same regardless of who wrote it.

   Measure is capped around 68 characters. Wider than that and readers lose their
   place returning to the start of each line, which is the difference between an
   article that gets finished and one that gets skimmed. */

export default function PostBody({ blocks = [] }) {
  return (
    <div className="mx-auto max-w-[68ch]">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return (
              <h2
                key={i}
                className="mt-[clamp(2rem,4vw,2.9rem)] font-display text-[clamp(1.4rem,2.6vw,1.85rem)] font-extrabold leading-tight tracking-tight text-ink"
              >
                {b.text}
              </h2>
            );

          case "h3":
            return (
              <h3 key={i} className="mt-8 font-display text-[1.15rem] font-bold leading-snug text-ink">
                {b.text}
              </h3>
            );

          case "quote":
            return (
              <blockquote
                key={i}
                className="my-[clamp(1.75rem,3.5vw,2.5rem)] border-l-2 border-primary pl-6 font-display text-[clamp(1.15rem,2vw,1.4rem)] font-bold italic leading-snug text-ink"
              >
                {b.text}
              </blockquote>
            );

          case "ul":
            return (
              <ul key={i} className="mt-5 space-y-2.5">
                {(b.items || []).map((item) => (
                  <li key={item} className="flex gap-3.5 text-[1.05rem] leading-relaxed text-muted">
                    <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    <span className="min-w-0">{item}</span>
                  </li>
                ))}
              </ul>
            );

          case "image":
            return (
              <figure key={i} className="my-[clamp(1.75rem,4vw,2.75rem)]">
                <div className="overflow-hidden rounded-[calc(20px*var(--nv-r-scale,1))] border border-line">
                  <img src={b.src} alt={b.alt || ""} loading="lazy" className="block w-full object-cover" />
                </div>
                {b.caption && (
                  <figcaption className="mt-3 text-center text-[0.84rem] text-muted">{b.caption}</figcaption>
                )}
              </figure>
            );

          case "cta":
            return (
              <Link
                key={i}
                to={b.to}
                className="group mt-[clamp(1.75rem,3.5vw,2.5rem)] inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[0.96rem] font-semibold text-on-primary transition-all hover:-translate-y-0.5 nv-shadow"
              >
                {b.text}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            );

          case "p":
          default:
            return (
              <p key={i} className="mt-5 text-[1.05rem] leading-[1.75] text-muted">
                {b.text}
              </p>
            );
        }
      })}
    </div>
  );
}
