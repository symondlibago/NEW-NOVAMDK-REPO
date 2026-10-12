import { CONSULTS, CONSULT_ORDER } from "../data/consultations";
import { GOAL_ART } from "../../lib/goalArt";

/* The five goals plus the catch-all sixth cell, shared by the treatments page
   and the home page's phone grid (2026-10-12). Each tile browses that goal's
   shoppable catalog; the sixth closes the 2x3 grid for anyone who doesn't see
   their goal. */
export const GOAL_TILES = [
  ...CONSULT_ORDER.map((k) => ({
    name: CONSULTS[k].name,
    tag: CONSULTS[k].tag,
    blurb: CONSULTS[k].blurb,
    cta: "Browse treatments",
    goal: CONSULTS[k].goalSlug,
    link: `/treatments/${CONSULTS[k].goalSlug}`,
    ...(GOAL_ART[CONSULTS[k].goalSlug] || {}),
  })),
  {
    kind: "goal-cta",
    name: "Not Sure Where To Start?",
    cta: "Take Quick Assessment",
    goal: "quick-assessment",
    link: "/start",
    bg: "bg-linear-to-br from-[#f4eddd] to-[#fceed2]",
  },
];
