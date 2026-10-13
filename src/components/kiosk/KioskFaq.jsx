import React, { useState } from "react";
import { Plus } from "lucide-react";
import { buildFaqs } from "../product/ProductFaq";

/* The product page's questions, same list and order, with rows big enough to
   tap. One open at a time, as on the site. */
export default function KioskFaq({ product }) {
  const items = buildFaqs(product, { otc: !!product.otc });
  const [open, setOpen] = useState(-1);
  if (!items.length) return null;

  return (
    <section>
      <span className="font-mono text-sm uppercase tracking-widest text-ks-heading lg:text-lg">What you should know</span>
      <h3 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ks-heading lg:text-5xl">Before you get started</h3>
      <ul className="mt-6 border-t-2 border-line">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <li key={item.q} className="border-b-2 border-line">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full items-center justify-between gap-6 py-6 text-left lg:py-8"
              >
                <span className="text-xl font-semibold leading-snug text-ink lg:text-3xl">{item.q}</span>
                <span
                  className={`grid size-12 flex-none place-items-center rounded-full transition-transform duration-300 lg:size-14 ${
                    isOpen ? "rotate-45 bg-ks-brass text-white" : "bg-surface-2 text-ink"
                  }`}
                >
                  <Plus className="size-6 lg:size-7" strokeWidth={2.4} />
                </span>
              </button>
              {isOpen && <p className="pb-7 pr-16 text-lg leading-relaxed text-muted lg:pb-9 lg:text-2xl">{item.a}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
