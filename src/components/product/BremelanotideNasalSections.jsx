import React from "react";
import BremelanotideSections from "./BremelanotideSections";

/* PT-141 Nasal Spray: since 2026-10-13 the same page as the injection, with
   the spray's own art, steps and comparison (client: one structure for both
   formats). Kept as its own file because ProductPage imports it by name. */

export default function BremelanotideNasalSections(props) {
  return <BremelanotideSections {...props} format="nasal" />;
}
