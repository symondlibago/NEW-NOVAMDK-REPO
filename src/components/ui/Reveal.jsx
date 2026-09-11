import React from "react";
import { motion } from "framer-motion";

const EASE = [0.2, 0.7, 0.3, 1];

/**
 * Lightweight scroll-reveal wrapper used across marketing sections.
 * Plays once by default and stays put — re-firing the fade every time the
 * element re-enters the viewport reads as a glitch on mobile (fast up/down
 * scrolling). Pass `once={false}` to opt a specific reveal back into replay.
 */
export default function Reveal({
  children,
  as = "div",
  delay = 0,
  y = 24,
  duration = 0.7,
  once = true,
  className = "",
  ...rest
}) {
  const M = motion[as] || motion.div;
  return (
    <M
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px 0px -80px 0px" }}
      transition={{ duration, ease: EASE, delay }}
      className={className}
      {...rest}
    >
      {children}
    </M>
  );
}
