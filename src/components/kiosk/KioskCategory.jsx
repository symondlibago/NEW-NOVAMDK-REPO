import React from "react";
import { ArrowRight, Check, QrCode } from "lucide-react";
import KioskTopBar, { GoldTitle } from "./KioskTopBar";
import { CompoundedDisclaimer } from "../Compliance";
import { goalBySlug, matchesForm } from "./kioskCatalog";

/* Same wording as the category shelf on the site (TreatmentShop). */
const CATEGORY_INTRO = {
  "longevity": "Provider-guided options based on your individual longevity and wellness goals.",
};

const FORM_LABEL = { injection: "Injection", "needle-free": "No needles" };

function TreatmentRow({ card, match, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(card.key)}
      className={`flex items-stretch gap-6 rounded-3xl border-2 bg-surface p-4 text-left shadow-sm active:bg-surface-2 lg:gap-8 lg:p-5 ${
        match ? "border-primary" : "border-line"
      }`}
    >
      <span className="grid w-40 flex-none place-items-center overflow-hidden rounded-2xl bg-linear-to-b from-surface-2/60 to-surface-2 lg:w-60">
        <img src={card.img} alt="" aria-hidden="true" className="h-40 w-full object-contain p-3 lg:h-60 lg:p-4" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-3 py-2">
        <span className="flex flex-wrap gap-2">
          {match && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-on-primary lg:text-lg">
              <Check className="size-4 lg:size-5" strokeWidth={3} /> Matches your answer
            </span>
          )}
          {card.ribbon && (
            <span className="rounded-full bg-ks-brass px-3 py-1 text-sm font-semibold text-white lg:text-lg">{card.ribbon}</span>
          )}
        </span>
        <span className="font-display text-3xl font-extrabold leading-tight tracking-tight text-ks-heading lg:text-5xl">{card.title}</span>
        <span className="flex flex-wrap gap-2">
          {card.chips.filter(Boolean).map((chip) => (
            <span key={chip} className="rounded-full border border-line-strong px-3 py-1 text-base font-medium text-ink lg:px-4 lg:text-xl">
              {chip}
            </span>
          ))}
        </span>
        {card.product.dosageForm && <span className="text-lg leading-snug text-muted lg:text-2xl">{card.product.dosageForm}</span>}
      </span>
      <span className="grid size-14 flex-none self-center place-items-center rounded-full bg-ks-brass text-white lg:size-20">
        <ArrowRight className="size-6 lg:size-9" strokeWidth={2.4} />
      </span>
    </button>
  );
}

export default function KioskCategory({ category, cards, form, onOpen, onBack, onStartOver }) {
  const goal = goalBySlug(category);
  const sorted = form ? [...cards].sort((a, b) => matchesForm(b, form) - matchesForm(a, form)) : cards;
  return (
    <div className="flex h-full flex-col">
      <KioskTopBar onBack={onBack} onStartOver={onStartOver} />
      <main data-lenis-prevent className="flex flex-1 flex-col gap-5 overflow-y-auto px-8 pb-8 lg:gap-7 lg:px-16 lg:pb-12">
        <div className="pt-2 lg:pt-4">
          <span className="font-mono text-sm uppercase tracking-widest text-ks-heading lg:text-xl">{goal.tag}</span>
          <GoldTitle className="mt-2 text-5xl lg:text-8xl">{goal.name}</GoldTitle>
          <p className="mt-3 text-xl leading-snug text-muted lg:text-3xl">
            {CATEGORY_INTRO[category] || `Explore prescription options for ${goal.name.toLowerCase()} and learn how each treatment works.`}
          </p>
          {FORM_LABEL[form] && (
            <p className="mt-4 text-lg font-semibold text-ink lg:text-2xl">
              Treatments that match &ldquo;{FORM_LABEL[form]}&rdquo; are marked and listed first.
            </p>
          )}
        </div>

        {sorted.map((card) => (
          <TreatmentRow key={card.key} card={card} match={matchesForm(card, form)} onOpen={onOpen} />
        ))}

        <div className="flex items-center gap-5 rounded-3xl bg-surface-2 px-7 py-6 text-ink lg:px-10 lg:py-8">
          <QrCode className="size-10 flex-none text-ks-heading lg:size-14" />
          <span className="text-xl font-medium leading-snug lg:text-3xl">
            Tap a treatment, then scan its code to start your visit on your phone.
          </span>
        </div>

        <div className="mt-auto space-y-3 pt-2 text-center">
          <p className="text-base text-muted lg:text-xl">
            Prescription treatments require evaluation by a licensed healthcare provider and are prescribed only when medically appropriate.
          </p>
          <CompoundedDisclaimer className="lg:text-base" />
        </div>
      </main>
    </div>
  );
}
