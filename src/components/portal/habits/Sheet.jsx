import React from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { X } from "lucide-react";

/* The same bottom sheet the weekly check-in uses: up from the bottom on a
   phone, a centred card on a computer. */
export default function Sheet({ open, onClose, label, children }) {
  return (
    <AnimatePresence>
      {open && (
        <Motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <Motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-bg shadow-2xl sm:rounded-3xl"
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end px-5 pt-5 sm:px-7 sm:pt-6">
              <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink">
                <X size={20} />
              </button>
            </div>
            <div className="nv-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-7 sm:px-7" data-lenis-prevent>
              {children}
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}
