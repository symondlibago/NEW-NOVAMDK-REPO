import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { faqsFor } from "../data/products";

/* The treatment's own questions, at the foot of a visit.
 *
 * John's request, 2026-10-07: a visit should answer the questions about the
 * medication it is for, those answers already exist beside the prices in
 * products.jsx one set per treatment, and this belongs at the very bottom,
 * centred, under the message button.
 *
 * Deliberately NOT ProductFaq. That component is the marketing block from the
 * product page: its own display heading, its own brand colours, a two column
 * comp, and a generated tail about prescriptions, days supply and delivery that
 * a patient inside their own visit has already been through. This takes the
 * same source, `faqsFor`, and nothing else.
 */
export default function PortalFaq({ product }) {
  const items = faqsFor(product);
  const [open, setOpen] = useState(-1);

  if (!items.length) return null;

  return (
    <section className="mx-auto max-w-2xl text-center">
      <h2 className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted">
        Frequently asked questions
      </h2>
      <p className="mt-2 text-[1.15rem] leading-snug tracking-tight text-ink">
        About your treatment
      </p>

      {/* Questions read left, under a centred heading. Centring the text as
          well would make every answer a ragged block and cost it its legibility,
          which is the one thing an answer has to have. */}
      <ul className="mt-6 border-t border-line text-left">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <li key={item.q} className="border-b border-line">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="group flex w-full items-center justify-between gap-5 py-4 text-left"
              >
                <span
                  className={`text-[0.92rem] font-medium leading-snug transition-colors ${
                    isOpen ? "text-primary" : "text-ink group-hover:text-primary"
                  }`}
                >
                  {item.q}
                </span>
                {/* A plus that becomes a minus, which reads as open and closed
                    without needing a label. */}
                <motion.span
                  aria-hidden="true"
                  animate={{ rotate: isOpen ? 135 : 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className={`grid h-7 w-7 flex-none place-items-center rounded-full border transition-colors ${
                    isOpen
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-line text-muted group-hover:border-primary/40 group-hover:text-primary"
                  }`}
                >
                  <Plus size={14} />
                </motion.span>
              </button>

              {/* Height animated from the measured content rather than a fixed
                  max-height: these answers run from one line to five, and a
                  max-height guess either clips the long ones or makes the short
                  ones drift open slowly. */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pb-5 pr-10 text-[0.88rem] leading-relaxed text-muted">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
