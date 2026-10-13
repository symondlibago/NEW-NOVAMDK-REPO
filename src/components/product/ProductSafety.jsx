import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { isCompounded, isOtc } from "../data/products";
import { CompoundedDisclaimer } from "../Compliance";
import useLockBodyScroll from "../../lib/useLockBodyScroll";

const Panel = motion.div;
const Backdrop = motion.div;

const shortName = (product) => product.name.split("—")[0].split("(")[0].split("/")[0].trim();

/* The closing sentence, chosen from the catalogue's flags (client request,
   2026-10-08, from the Euphoria Cream O comp).
 *
 * The comp's own wording, "is a compounded prescription medication and is not
 * FDA-approved", is true of the compounded line and false of the rest of the
 * catalogue: Zepbound and Wegovy are FDA-approved brand drugs and the supplement
 * line is not a prescription at all. The compounded case is verbatim from the
 * comp; the other two reuse wording already on the site. Legal to confirm the
 * two it did not supply. */
export function closingLine(product) {
  const name = shortName(product);
  if (isOtc(product)) {
    return `${name} is a dietary supplement, not a prescription medication. These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease. Individual outcomes may vary.`;
  }
  if (isCompounded(product)) {
    return `${name} is a compounded prescription medication and is not FDA-approved. It has not been reviewed by the FDA for safety, effectiveness, or quality. Eligibility and dosing are determined by a licensed healthcare provider. Individual outcomes may vary.`;
  }
  return `${name} is a prescription medication. Eligibility and dosing are determined by a licensed healthcare provider. Individual outcomes may vary.`;
}

/* Everything the page used to spread over the compounded notice card and the
   closing disclaimer, gathered in one place the way Hims carries it (client,
   2026-10-12). Only wording already on the site: the record's own safety line,
   the compounded notice, the record's own FDA statement (the B12 combination
   notice, for one) and the closing sentence. The name-matched FDA wording in
   Compliance.jsx stays off Rx pages, as before. */
function SafetyContent({ product }) {
  return (
    <div className="space-y-5 text-[0.92rem] leading-relaxed text-muted">
      {product.safety && <p>{product.safety}</p>}
      {isCompounded(product) && (
        <div>
          <h3 className="font-semibold text-ink">Compounded drug notice</h3>
          <CompoundedDisclaimer plain className="mt-1.5" />
        </div>
      )}
      {product.fdaDisclaimer && <p>{product.fdaDisclaimer}</p>}
      <p>{closingLine(product)}</p>
    </div>
  );
}

/* A panel from the right on a desktop, its own full-screen page on a phone
   (client, 2026-10-12, after hims.com). */
function Sheet({ product, onClose }) {
  useLockBodyScroll();
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const wide = window.matchMedia("(min-width: 768px)").matches;
  const off = wide ? { x: "100%" } : { y: "100%" };
  return (
    <>
      <Backdrop
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[119] hidden bg-ink/30 backdrop-blur-sm md:block"
      />
      <Panel
        key="panel"
        role="dialog"
        aria-modal="true"
        aria-label="Important Safety Information"
        initial={off}
        animate={{ x: 0, y: 0 }}
        exit={off}
        transition={{ type: "spring", damping: 30, stiffness: 260 }}
        data-lenis-prevent
        className="fixed inset-0 z-[120] flex flex-col bg-bg md:left-auto md:w-full md:max-w-xl md:shadow-2xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 md:px-8 md:py-5">
          <h2 className="font-display text-[1.15rem] font-extrabold text-ink md:text-[1.3rem]">Important Safety Information</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-ink"
          >
            <X size={20} />
          </button>
        </div>
        <div className="grow overflow-y-auto px-5 pb-10 pt-6 md:px-8">
          <p className="font-display text-[1.05rem] font-bold text-ink">{shortName(product)}</p>
          <div className="mt-3">
            <SafetyContent product={product} />
          </div>
        </div>
      </Panel>
    </>
  );
}

/* Opened from the row under the price. */
export function SafetySheet({ product, open, onClose }) {
  return <AnimatePresence>{open && <Sheet product={product} onClose={onClose} />}</AnimatePresence>;
}
