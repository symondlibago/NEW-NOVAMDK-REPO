import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquareText, ArrowRight, Plus, MousePointerClick } from "lucide-react";
import Reveal from "./ui/Reveal";

// Custom easing for a premium "liquid/fluid" feel
const liquidEase = [0.16, 1, 0.3, 1];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState(-1);

  const faqs = [
    {
      q: "How does the online visit work?",
      a: "Answer a few questions about your health and goals. A licensed provider reviews them, and you only pay if you're prescribed."
    },
    {
      q: "Is everything prescribed by a US physician?",
      a: "Yes. A licensed US physician reviews and prescribes every treatment, and a regulated US pharmacy fills it."
    },
    {
      q: "What can I get treated for?",
      a: "Weight and metabolism, longevity, recovery, skin, sexual health, and our full peptide line."
    },
    {
      q: "How will my treatment arrive?",
      a: "If prescribed, your treatment is shipped discreetly by a licensed pharmacy, usually within a few business days of approval."
    },
    {
      q: "Can I pause or cancel anytime?",
      a: "Yes, no lock-in. One message is enough to pause, change, or cancel."
    }
  ];

  const handleToggle = (i) => {
    // On mobile, allow clicking the active tab to collapse it.
    // On desktop, keep it open to ensure the right pane always has content.
    if (window.innerWidth < 1024) {
        setActiveIndex(activeIndex === i ? -1 : i);
    } else {
        setActiveIndex(i);
    }
  };

  return (
    <section className="relative w-full overflow-hidden bg-surface py-[clamp(2rem,4vw,3.5rem)]" id="faq-section">
        <div className="relative z-10 mx-auto max-w-[1240px] px-5 md:px-10">

            {/* --- ANIMATED HEADER --- */}
            <Reveal
                y={30}
                duration={1}
                className="mb-8 flex flex-col items-center text-center md:mb-10"
            >
                <div className="flex max-w-2xl flex-col items-center">
                    <div className="mb-4 flex items-center gap-3">
                        <span className="h-px w-8 bg-accent/60" />
                        <span className="nv-eyebrow">Support &amp; FAQs</span>
                        <span className="h-px w-8 bg-accent/60" />
                    </div>
                    <h2 className="font-display text-[clamp(2.2rem,4.6vw,3.2rem)] font-extrabold leading-[1.08] tracking-tight text-ink">
                        Answers to <br />
                        <span className="nv-em font-medium text-muted">Common Questions</span>
                    </h2>
                </div>
            </Reveal>

            {/* --- DYNAMIC LAYOUT (Accordion on Mobile, Split Pane on Desktop) --- */}
            <div className="mb-10 grid items-start gap-4 lg:grid-cols-12 lg:gap-16">

                {/* Left Side: Question Menu */}
                <div className="flex flex-col lg:col-span-5">
                    {faqs.map((faq, i) => {
                        const isActive = activeIndex === i;
                        return (
                            <motion.div
                                // FIX: Added layout prop to ensure siblings slide down smoothly like butter
                                layout
                                key={i}
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                // FIX: Set once to true so they don't randomly reload when pushed off screen
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.6, delay: i * 0.1, ease: liquidEase }}
                                // FIX: Changed transition-all to transition-colors to prevent CSS height conflicts
                                className={`group relative flex flex-col overflow-hidden border-b border-line transition-colors duration-300 ${
                                    isActive ? "bg-surface-2/40" : "hover:bg-surface-2/30"
                                }`}
                            >
                                {/* Active Indicator Bar (Desktop) */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeFaqIndicator"
                                        className="absolute bottom-4 left-0 top-4 hidden w-[2px] rounded-r-full bg-primary lg:block"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}

                                <button
                                    onClick={() => handleToggle(i)}
                                    className="flex w-full cursor-pointer items-center justify-between px-2 py-5 text-left outline-none md:px-5 md:py-6"
                                >
                                    <span className={`pr-4 text-[1rem] transition-colors duration-300 md:text-[1.12rem] ${
                                        isActive
                                        ? "font-semibold text-ink"
                                        : "text-muted group-hover:text-ink"
                                    }`}>
                                        {faq.q}
                                    </span>

                                    {/* Desktop Arrow Indicator */}
                                    <ArrowRight
                                        size={18}
                                        className={`hidden shrink-0 transition-all duration-300 lg:block ${
                                            isActive
                                            ? "translate-x-0 text-primary opacity-100"
                                            : "-translate-x-2 text-ink/20 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                                        }`}
                                    />

                                    {/* Mobile Premium Circular +/- Indicator (rotates on open) */}
                                    <motion.div
                                        animate={{ rotate: isActive ? 135 : 0 }}
                                        transition={{ duration: 0.4, ease: liquidEase }}
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 lg:hidden ${
                                            isActive ? "border-primary/40 bg-primary/5 text-primary" : "border-line-strong text-muted group-hover:border-primary/30 group-hover:text-primary"
                                        }`}>
                                        <Plus size={14} strokeWidth={2.2} />
                                    </motion.div>
                                </button>

                                {/* --- MOBILE ONLY: Premium Editorial Accordion Answer --- */}
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.4, ease: liquidEase }}
                                            className="overflow-hidden lg:hidden"
                                        >
                                            <div className="px-2 pb-7 pt-1 md:px-5">
                                                {/* Refined accent indent line and soft gradient wash */}
                                                <div className="relative border-l-[1.5px] border-primary/40 py-1 pl-4 md:pl-5">
                                                    <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-primary/5 to-transparent" />
                                                    <p className="relative z-10 text-[0.95rem] font-light leading-[1.8] tracking-wide text-ink/75">
                                                        {faq.a}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                            </motion.div>
                        );
                    })}
                </div>

                {/* --- DESKTOP ONLY: Right Side Answer Display Pane --- */}
                <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    // FIX: Set once to true
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 1, delay: 0.2, ease: liquidEase }}
                    className="hidden h-full lg:col-span-7 lg:flex"
                >
                    <div className="relative flex w-full min-h-[380px] flex-col justify-center overflow-hidden rounded-[calc(36px*var(--nv-r-scale,1))] border border-line bg-surface p-12 nv-shadow-lg">
                        <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 -translate-y-1/2 translate-x-1/3 rounded-full bg-primary/10 blur-[80px]" />

                        <AnimatePresence mode="wait">
                            {activeIndex !== -1 && faqs[activeIndex] ? (
                                <motion.div
                                    key={activeIndex}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                    className="relative z-10"
                                >
                                    <h3 className="mb-6 font-display text-[2rem] font-bold leading-tight text-ink">
                                        {faqs[activeIndex].q}
                                    </h3>
                                    <p className="max-w-xl text-[1.05rem] leading-relaxed text-muted">
                                        {faqs[activeIndex].a}
                                    </p>
                                </motion.div>
                            ) : (
                                /* Empty state — nudges the user to click a question on the left */
                                <motion.div
                                    key="placeholder"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                    className="relative z-10 flex flex-col items-center text-center"
                                >
                                    <motion.div
                                        animate={{ x: [0, -10, 0] }}
                                        transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity }}
                                        className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10"
                                    >
                                        <MousePointerClick size={26} className="text-primary" strokeWidth={1.8} />
                                    </motion.div>
                                    <h3 className="mb-3 font-display text-[clamp(1.5rem,2.4vw,2rem)] font-bold leading-tight text-ink">
                                        Select a question
                                    </h3>
                                    <p className="max-w-sm text-[0.98rem] leading-relaxed text-muted">
                                        Click any question on the left to reveal its answer here.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>

            {/* --- ANIMATED BOTTOM CTA --- */}
            <Reveal
                y={20}
                duration={1}
                delay={0.4}
                className="mt-4 flex flex-col items-center justify-center gap-4 md:mt-8 md:flex-row md:gap-6"
            >
                <p className="text-center text-[0.95rem] font-medium text-muted">
                    Still have questions? Our care team is here to help.
                </p>
                <Link
                    to="/contact"
                    className="group flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border border-line-strong bg-surface px-8 py-3.5 text-[0.95rem] font-semibold text-ink transition-all duration-300 hover:-translate-y-0.5 hover:border-primary nv-shadow md:w-auto"
                >
                    Message Care Team
                    <MessageSquareText size={16} className="text-muted transition-colors group-hover:text-primary" strokeWidth={2} />
                </Link>
            </Reveal>

        </div>
    </section>
  );
}
