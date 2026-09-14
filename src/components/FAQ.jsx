import React, { useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import Reveal from "./ui/Reveal";

/**
 * Support FAQs (2026-09-12 rebuild).
 *
 * One centred column of questions that open in place. The previous version was
 * a split pane: questions on the left, answers in a panel on the right with a
 * "Select a question" empty state. That layout only worked once something was
 * selected, and the comp asks for the plain list instead.
 */

const EASE = [0.16, 1, 0.3, 1];

const INK = "#4a4336";
const MUTED = "#6f6555";
const LINE = "#e0d6c2";

/* "Your Care," in the dark gold, "Made Simple" in the lighter one, per the
   2026-09-15 copy update. */
const DARK_GOLD = "#725826";
const LIGHT_GOLD = "#b39258";

/* Compliance-forward copy supplied by the client (2026-09-15). Kept verbatim:
   the wording around provider independence and "not guaranteed" is the
   point, so it should not be tightened for length. */
const FAQS = [
  {
    q: "How does online care work?",
    a: "Start by completing a secure health intake. An independent, licensed medical provider will review your information and determine whether treatment is medically appropriate. Additional information or a virtual consultation may be required before a prescription is issued.",
  },
  {
    q: "Who reviews my treatment?",
    a: "Your care is reviewed by an independent, state-licensed medical provider authorized to practice in your state. Prescriptions are only issued when the provider determines treatment is clinically appropriate.",
  },
  {
    q: "What types of care are available?",
    a: "NovaMDK provides access to virtual care across Weight Management, Longevity, Recovery & Wellness, and Sexual Wellness. Treatment options vary based on medical history, provider evaluation, state availability, and clinical eligibility.",
  },
  {
    q: "How are prescriptions filled and delivered?",
    a: "When prescribed, medications are fulfilled by licensed U.S. pharmacies and shipped directly to the address provided. Pharmacy availability, formulation, packaging, and shipping times may vary by treatment and location.",
  },
  {
    q: "Is a prescription guaranteed?",
    a: "No. Completing an intake or making an applicable service payment does not guarantee that a prescription will be issued. Treatment decisions are made independently by the licensed medical provider based on individual clinical needs.",
  },
  {
    q: "Can I pause or cancel my plan?",
    a: "Eligible recurring plans may be paused or canceled according to the terms of the membership or treatment plan. Cancellation does not affect charges or pharmacy orders that have already been processed.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(-1);

  return (
    <section className="relative w-full overflow-hidden bg-surface py-[clamp(2.5rem,5vw,4rem)]" id="faq-section">
      <div className="relative z-10 mx-auto max-w-215 px-5 md:px-10">
        <Reveal y={26} duration={0.9} className="text-center">
          {/* 64/60 with 1px of tracking in the file. */}
          <h2 className="nv-weight-keep font-display text-[clamp(2.1rem,4.6vw,4rem)] font-extrabold leading-[0.94] tracking-[0.01em]">
            <span className="block" style={{ color: DARK_GOLD }}>
              Your Care,
            </span>
            <span className="block" style={{ color: LIGHT_GOLD }}>
              Made Simple
            </span>
          </h2>
        </Reveal>

        <div className="mt-[clamp(1.75rem,3.5vw,2.75rem)]">
          {FAQS.map((faq, i) => {
            const on = open === i;
            return (
              <Motion.div
                layout
                key={faq.q}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.07, ease: EASE }}
                className="border-b"
                style={{ borderColor: LINE }}
              >
                <button
                  type="button"
                  aria-expanded={on}
                  onClick={() => setOpen(on ? -1 : i)}
                  className="flex w-full cursor-pointer items-center justify-between gap-6 py-5 text-left outline-none md:py-6"
                >
                  <span
                    className="text-[clamp(0.98rem,1.4vw,1.1rem)] transition-colors duration-300"
                    style={{ color: on ? INK : MUTED }}
                  >
                    {faq.q}
                  </span>

                  {/* The comp's plain +, rotated into an x rather than swapped
                      for a second icon, so the two states are one movement. */}
                  <Motion.span
                    aria-hidden="true"
                    animate={{ rotate: on ? 135 : 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="shrink-0"
                    style={{ color: on ? INK : MUTED }}
                  >
                    <Plus size={18} strokeWidth={1.8} />
                  </Motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {on && (
                    <Motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p
                        className="pb-6 text-[0.95rem] leading-[1.75]"
                        style={{ color: MUTED }}
                      >
                        {faq.a}
                      </p>
                    </Motion.div>
                  )}
                </AnimatePresence>
              </Motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
