import React from "react";
import { ChevronLeft } from "lucide-react";

/* Sized for a finger on a 32" portrait screen, with the tablet size first. */
export const PILL =
  "inline-flex h-14 items-center gap-2 rounded-full border-2 border-line bg-surface px-6 text-lg font-semibold text-ink active:bg-surface-2 lg:h-18 lg:px-8 lg:text-2xl";

export default function KioskTopBar({ onBack, backLabel = "Back", onStartOver }) {
  return (
    <header className="grid flex-none grid-cols-3 items-center gap-4 px-8 pb-4 pt-8 lg:px-16 lg:pb-6 lg:pt-14">
      <div>
        {onBack && (
          <button type="button" onClick={onBack} className={`${PILL} pl-4 lg:pl-6`}>
            <ChevronLeft className="size-6 lg:size-8" strokeWidth={2.4} />
            {backLabel}
          </button>
        )}
      </div>
      <img src="/logo-2026.png" alt="Nova MDK" className="h-10 w-auto justify-self-center lg:h-14" />
      <div className="justify-self-end">
        {onStartOver && (
          <button type="button" onClick={onStartOver} className={PILL}>
            Start over
          </button>
        )}
      </div>
    </header>
  );
}

/* The site's brass gradient heading, as on the category shelves. */
export function GoldTitle({ className = "", children }) {
  return (
    <h1
      className={`bg-linear-to-br from-ks-gold-hi via-ks-gold to-ks-gold-lo bg-clip-text pb-1 font-display font-extrabold tracking-tight text-transparent ${className}`}
    >
      {children}
    </h1>
  );
}
