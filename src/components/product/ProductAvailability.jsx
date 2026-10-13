import React from "react";
import { unavailableStates } from "../../lib/serviceArea";

/* The states a product can't ship to, under its description (client's
   pharmacy table, 2026-10-13). Read from the same list the intake's state
   check uses, so the page and the intake can't disagree. */
export default function ProductAvailability({ product, className = "" }) {
  const states = product ? unavailableStates(product.id) : [];
  if (!states.length) return null;
  return (
    <p className={`text-[0.92rem] font-semibold text-ink ${className}`}>Currently unavailable in: {states.join(", ")}</p>
  );
}
