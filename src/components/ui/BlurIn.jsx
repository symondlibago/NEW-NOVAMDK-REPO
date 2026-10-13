import React from "react";
import { motion } from "framer-motion";

const EASE = [0.2, 0.7, 0.3, 1];

/**
 * Reveal's sibling for big headings: the line comes into focus as well as
 * rising, the way Good Life Meds brings its section titles in (client's
 * reference, 2026-10-13). Plays once, like Reveal.
 */
export default function BlurIn({ children, as = "div", delay = 0, className = "", ...rest }) {
  const M = motion[as] || motion.div;
  return (
    <M
      initial={{ opacity: 0, y: 18, filter: "blur(14px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px 0px -80px 0px" }}
      transition={{ duration: 1, ease: EASE, delay }}
      className={className}
      {...rest}
    >
      {children}
    </M>
  );
}
