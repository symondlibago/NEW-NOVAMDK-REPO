import React from "react";
const CHIP_LG = "gap-2 border-[#b47f2f]/45 px-3.5 py-1.5 text-[0.66rem] tracking-[0.1em] text-[#b47f2f]";
const CHIP_SM =
  "gap-1 border-line px-2 py-0.5 text-[0.5rem] tracking-[0.08em] sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[0.58rem] sm:tracking-[0.1em]";

export function ComplianceBadges({ compounded = true, rx = true, size = "sm", className = "" }) {
  const lg = size === "lg";
  const chip = lg ? CHIP_LG : CHIP_SM;
  return (
    <div className={`flex flex-wrap items-center gap-1 sm:gap-1.5 ${className}`}>
      <span className={`inline-flex items-center rounded-full border bg-surface font-mono font-semibold uppercase ${lg ? "" : "text-ink"} ${chip}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${rx ? "bg-primary" : "bg-accent"}`} />
        {rx ? "Rx only" : "No prescription"}
      </span>
      {compounded && (
        <span className={`inline-flex items-center rounded-full border font-mono font-semibold uppercase ${lg ? "bg-surface" : "bg-surface-2 text-muted"} ${chip}`}>
          Compounded
        </span>
      )}
    </div>
  );
}

const FDA_RESEARCH =
  "This product is an experimental chemical compounded for research use only. Claims about the use of this product and its safety have not been evaluated or approved by the FDA. This product is not intended to diagnose, treat, cure, or prevent any disease. Use only in consultation with a medical provider. Results are not guaranteed, and you may experience side effects.";
const FDA_NOT_APPROVED =
  "Claims about the use of this product have not been evaluated or approved by the FDA. Use only in consultation with a medical provider. Results are not guaranteed, and you may experience side effects.";
const FDA_COMPOUNDED =
  "Compounded products have not been evaluated or approved by the FDA. Use only in consultation with a medical provider. Results are not guaranteed, and you may experience side effects.";

const FDA_GROUPS = [
  { text: FDA_RESEARCH, match: ["nad", "mots-c", "bpc-157", "tb-500", "tb4", "thymosin beta 4", "selank", "semax", "ipamorelin"] },
  { text: FDA_NOT_APPROVED, match: ["ss-31", "retatrutide"] },
  { text: FDA_COMPOUNDED, match: ["tesamorelin", "tirzepatide"] },
];

export function fdaDisclaimer(product) {
  // A product can carry its own required wording (e.g. the DSHEA statement on
  // the non-Rx supplement line); otherwise fall back to name matching.
  if (product?.fdaDisclaimer) return product.fdaDisclaimer;
  const name = (product?.name || "").toLowerCase();
  for (const g of FDA_GROUPS) {
    if (g.match.some((m) => name.includes(m))) return g.text;
  }
  return null;
}

export function FdaDisclaimer({ product, className = "" }) {
  const text = fdaDisclaimer(product);
  if (!text) return null;
  return <p className={`text-[0.82rem] italic leading-relaxed text-muted ${className}`}>{text}</p>;
}

export function CompoundedDisclaimer({ className = "", tone = "muted" }) {
  const color = tone === "panel" ? "text-on-panel/55" : "text-muted";
  return (
    /* Italic and tighter (2026-09-07): the comp sets the legal footnote apart
       from body copy by its slant rather than by a rule or a size drop. */
    <div className={`space-y-1.5 text-[0.78rem] italic leading-relaxed ${color} ${className}`}>
      <p>
        Compounded drug products are not approved or evaluated for safety, effectiveness, or quality by
        the FDA. Prescription required. Nova MDK does not manufacture drug products.
      </p>
      <p>
        The medication you receive may differ in appearance from the website images. Results not
        guaranteed and side effects may occur.
      </p>
    </div>
  );
}
