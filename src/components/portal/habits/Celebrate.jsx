import React from "react";
import { motion as Motion, useReducedMotion } from "framer-motion";

/* The small rewards around the daily check-in and Strength in 10 (client,
   2026-10-24): the day's three rings and a burst of confetti, skipped for
   anyone who asks for less motion. The buzz is in lib/haptics.js. */

// Same scatter every time from a seed, so a render never reshuffles it.
const rnd = (n) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const BITS = Array.from({ length: 30 }, (_, i) => {
  const angle = (i / 30) * Math.PI * 2 + rnd(i) * 0.4;
  const dist = 80 + rnd(i + 40) * 100;
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist * 0.8 - 50,
    turn: rnd(i + 80) * 540 - 270,
    delay: rnd(i + 120) * 0.1,
    tone: ["bg-primary", "bg-primary-deep", "bg-sky-400", "bg-emerald-500", "bg-ink"][i % 5],
    round: i % 3 === 0,
  };
});

/** Confetti from the middle of its parent, which needs `relative`. A new
 *  `burst` number fires it again. */
export function Confetti({ burst = 1 }) {
  const reduce = useReducedMotion();
  if (reduce || !burst) return null;
  return (
    <span key={burst} className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
      {BITS.map((b, i) => (
        <Motion.span
          key={i}
          className={`absolute block ${b.round ? "size-2 rounded-full" : "h-3 w-1.5 rounded-sm"} ${b.tone}`}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.4 }}
          animate={{ x: b.x, y: [0, b.y, b.y + 140], opacity: [1, 1, 0], rotate: b.turn, scale: 1 }}
          transition={{ duration: 1.5, delay: b.delay, ease: "easeOut", times: [0, 0.4, 1] }}
        />
      ))}
    </span>
  );
}

/* Three rings, outside in: checked in, water, moved. Each value is 0 to 1. */
const RINGS = [
  { key: "checkin", tone: "text-primary" },
  { key: "water", tone: "text-sky-500" },
  { key: "move", tone: "text-emerald-500" },
];

export function DayRings({ checkin, water, move, size = 76, className = "" }) {
  const reduce = useReducedMotion();
  const values = { checkin, water, move };
  const stroke = 7;
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={`-rotate-90 ${className}`} aria-hidden="true">
      {RINGS.map((r, i) => {
        const radius = 35 - i * (stroke + 2);
        const v = Math.max(0, Math.min(1, values[r.key] || 0));
        return (
          <g key={r.key} className={r.tone} stroke="currentColor" strokeWidth={stroke} fill="none" strokeLinecap="round">
            <circle cx="40" cy="40" r={radius} opacity="0.16" />
            <Motion.circle
              cx="40"
              cy="40"
              r={radius}
              initial={false}
              animate={{ pathLength: v, opacity: v > 0 ? 1 : 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </g>
        );
      })}
    </svg>
  );
}

/** "+10 points", floating up into place. */
export function PointsPop({ points, className = "" }) {
  if (!points) return null;
  return (
    <Motion.p
      initial={{ y: 10, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ delay: 0.25, type: "spring", stiffness: 260, damping: 18 }}
      className={`inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary-deep ${className}`}
    >
      +{points} points
    </Motion.p>
  );
}
