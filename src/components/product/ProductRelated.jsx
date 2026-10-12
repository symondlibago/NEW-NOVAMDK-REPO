import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "../ui/Reveal";
import { priceLabel } from "../data/products";
import { displayTitle } from "../../lib/catalog";
import { productPath } from "../../lib/slug";

/* The other treatments in this product's category (client, 2026-10-12). Takes
   the page's own related list, so dose rungs and hidden records are already
   filtered out. A grid on a desktop, a swipe row on a phone; nothing at all
   when the category has no other treatment. */
export default function ProductRelated({ product, items }) {
  if (!items.length) return null;
  return (
    <section className="pb-[clamp(2.5rem,5vw,4.5rem)]">
      <div className="mx-auto max-w-[1180px] px-5 md:px-10">
        <Reveal as="div" className="flex items-end justify-between gap-4">
          <div>
            <span className="nv-eyebrow">{product.categoryName}</span>
            <h2 className="mt-3 font-display text-[clamp(1.5rem,3vw,2.1rem)] font-extrabold leading-tight text-ink">
              Other {product.categoryName.toLowerCase()} treatments
            </h2>
          </div>
          <Link
            to={`/treatments/${product.categorySlug}`}
            className="group hidden shrink-0 items-center gap-2 text-[0.92rem] font-bold text-ink transition-colors hover:text-accent sm:inline-flex"
          >
            See all
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
        <div className="no-scrollbar -mx-5 mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-4">
          {items.map((r, k) => (
            <Reveal as="div" key={r.id} delay={k * 0.06} y={16} className={`${items.length > 1 ? "w-3/4" : "w-full"} shrink-0 snap-start md:w-auto`}>
              <Link
                to={productPath(r)}
                className="group flex h-full flex-col overflow-hidden rounded-[calc(20px*var(--nv-r-scale,1))] border border-line bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:nv-shadow-lg"
              >
                <div className="flex h-52 items-center justify-center bg-linear-to-b from-surface-2/50 to-surface">
                  <img src={r.img} alt={displayTitle(r)} loading="lazy" className="h-40 w-auto max-w-4/5 object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="flex grow flex-col px-5 pb-5 pt-4">
                  <h3 className="font-display text-[1.02rem] font-bold leading-snug text-ink">{displayTitle(r)}</h3>
                  {r.dosageForm && <p className="mt-1 text-[0.84rem] text-muted">{r.dosageForm}</p>}
                  <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                    <span className="text-[0.92rem] font-bold text-ink">
                      {r.exactPrice ? "" : "From "}
                      {priceLabel(r)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[0.84rem] font-semibold text-accent">
                      View <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
