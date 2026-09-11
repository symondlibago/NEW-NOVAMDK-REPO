import React from "react";
import { motion } from "framer-motion";
import { Truck, Clock, Stethoscope, ClipboardList, FlaskConical } from "lucide-react";
/* The approved credential set (2026-09-08 compliance pass). It replaced a list
   that named a clinician type the Telehealth Consent does not cover and
   promised "FAST DELIVERY" with no prescription condition on it. */
const MARQUEE_ITEMS = [
  { text: "STATE-LICENSED PHYSICIANS", icon: Stethoscope },
  { text: "U.S.-LICENSED PHARMACIES", icon: FlaskConical },
  { text: "PERSONALIZED TREATMENT PLANS", icon: ClipboardList },
  { text: "DISCREET HOME DELIVERY", icon: Truck },
  { text: "DEDICATED ONLINE CARE", icon: Clock },
];

export default function Marquee({ speed = 42 }) {
  return (
    <div
      /* py-1.5, not py-2.5: the hero below is sized to fill what is left of the
         viewport, so every pixel this strip takes is a pixel off the hero. */
      className="relative flex w-full overflow-hidden border-y border-ink/10 py-1.5 text-ink"
      style={{ background: "color-mix(in oklab, var(--nv-accent) 72%, var(--nv-surface))" }}
    >
      <motion.div
        className="flex w-max shrink-0 will-change-transform"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ ease: "linear", duration: speed, repeat: Infinity }}
        aria-hidden="true"
      >
        {[0, 1].map((dup) => (
          <div key={dup} className="flex items-center">
            {MARQUEE_ITEMS.map((item, i) => (
              <span key={`${dup}-${i}`} className="flex items-center gap-2.5 px-7">
                <item.icon size={14} className="text-ink/75" strokeWidth={1.8} />
                <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.2em] text-ink">
                  {item.text}
                </span>
                <span className="ml-7 text-ink/35">•</span>
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
