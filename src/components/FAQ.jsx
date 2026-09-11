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

/* "Questions," is flat 725826 and "Answered" carries the ramp, straight off
   the two fills on that text layer. */
const RAMP = {
  backgroundImage: "linear-gradient(90deg, #DAB774 8%, #735A2A 100%)",
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
};

const FAQS = [
  {
    q: "How does the online visit work?",
    a: "Answer a few questions about your health and goals. A licensed provider reviews them, and you only pay if you're prescribed.",
  },
  {
    q: "Is everything prescribed by a US physician?",
    a: "Yes. A licensed US physician reviews and prescribes every treatment, and a regulated US pharmacy fills it.",
  },
  {
    q: "What can I get treated for?",
    a: "Weight and metabolism, longevity, recovery, skin, sexual health, and our full peptide line.",
  },
  {
    q: "How will my treatment arrive?",
    a: "If prescribed, your treatment is shipped discreetly by a licensed pharmacy, usually within a few business days of approval.",
  },
  {
    q: "Can I pause or cancel anytime?",
    a: "Yes, no lock-in. One message is enough to pause, change, or cancel.",
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
            <span className="block" style={{ color: "#725826" }}>
              Questions,
            </span>
            <span className="block" style={RAMP}>
              Answered
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
                        className="max-w-[62ch] pb-6 pr-10 text-[0.95rem] leading-[1.75]"
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
