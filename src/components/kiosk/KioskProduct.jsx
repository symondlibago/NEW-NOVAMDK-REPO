import React, { useEffect } from "react";
import { FlaskConical, Lock, MessageSquareText, Stethoscope, Truck } from "lucide-react";
import KioskTopBar from "./KioskTopBar";
import KioskQr from "./KioskQr";
import { ComplianceBadges, CompoundedDisclaimer, closingDisclaimer } from "../Compliance";
import { STEPS } from "../product/ProductJourney";
import { isCompounded, priceUnit } from "../data/products";
import { scanUrl } from "../../lib/kioskLocations";
import { track, EVENTS } from "../../lib/analytics";

/* The product page's assurance tiles, same wording. */
const TILE_ICON = "size-8 text-ks-heading lg:size-10";
const ASSURANCES = [
  { icon: <Stethoscope className={TILE_ICON} />, label: "US licensed providers" },
  { icon: <Truck className={TILE_ICON} />, label: "Home delivery, if prescribed" },
  { icon: <Lock className={TILE_ICON} />, label: "Discreet packaging" },
];

const SECTION_TITLE = "font-display text-3xl font-extrabold tracking-tight text-ks-heading lg:text-5xl";

function QrDock({ card, locId, onTextMe }) {
  return (
    <div className="mx-8 flex flex-none items-center gap-6 rounded-3xl bg-panel p-6 text-on-panel lg:mx-16 lg:gap-10 lg:p-9">
      <div className="flex min-w-0 flex-1 flex-col gap-3 lg:gap-4">
        <span className="font-display text-3xl font-extrabold leading-tight text-white lg:text-5xl">Scan to start your visit</span>
        <span className="text-lg leading-snug text-on-panel/80 lg:text-2xl">
          {card.title} · {card.chips[0]}
        </span>
        <span className="flex flex-wrap items-center gap-3 pt-1">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-base lg:text-xl">
            <Lock className="size-4 text-ks-gold-hi lg:size-5" /> Private to your own device
          </span>
          {onTextMe && (
            <button
              type="button"
              onClick={onTextMe}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-base font-semibold text-ink active:bg-surface-2 lg:px-6 lg:py-3 lg:text-xl"
            >
              <MessageSquareText className="size-5 lg:size-6" /> Text me the link instead
            </button>
          )}
        </span>
      </div>
      {/* Drawn once the placement is read, so a scan is always tagged with
          this kiosk; see KioskQrModal on the product page. */}
      {/* KioskQr draws at a fixed pixel size, so the box is one size everywhere. */}
      <div className="grid size-60 flex-none place-items-center rounded-2xl bg-white p-3">
        {locId !== undefined && <KioskQr value={scanUrl(card.product, locId)} size={216} />}
      </div>
    </div>
  );
}

function Hero({ card }) {
  const p = card.product;
  return (
    <section className="grid grid-cols-5 items-start gap-6 lg:gap-10">
      <div className="relative col-span-2 aspect-square overflow-hidden rounded-3xl bg-surface-2">
        <img src={p.imgDetail || p.img} alt={card.title} className="h-full w-full object-cover" />
        <span className="absolute left-3 top-3 rounded-full bg-surface/90 px-3 py-1 font-mono text-xs uppercase tracking-widest text-ink lg:left-4 lg:top-4 lg:text-sm">
          {p.dosageForm}
        </span>
      </div>
      <div className="col-span-3">
        <h2 className="font-display text-5xl font-extrabold leading-none tracking-tight text-ks-heading lg:text-6xl">{card.title}</h2>
        <p className="mt-4 text-lg leading-relaxed text-muted lg:text-2xl">{p.subtitle}</p>
        <ComplianceBadges compounded={isCompounded(p)} rx={!p.otc} size="lg" className="mt-5" />
        <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-line pt-5">
          {!p.exactPrice && <span className="text-lg uppercase tracking-wider text-ink lg:text-2xl">Starts at</span>}
          <span className="font-display text-5xl font-extrabold leading-none tracking-tight text-ink lg:text-6xl">
            {p.price}
            <span className="font-semibold">{priceUnit(p)}</span>
          </span>
          {p.priceNote && <span className="text-lg text-muted lg:text-2xl">· {p.priceNote}</span>}
        </div>
      </div>
    </section>
  );
}

export default function KioskProduct({ cards, card, locId, onSelect, onTextMe, onBack, onStartOver }) {
  const p = card.product;
  const mechanism = p.mechanism;

  /* Counted once per product the kiosk shows a code for, like the product
     page's QR modal. The id stands in for the name. */
  useEffect(() => {
    if (locId === undefined) return;
    track(EVENTS.KIOSK_QR_SHOWN, {
      kiosk_location_id: locId || "unset",
      product_id: p.id,
      treatment_category: p.categorySlug,
    });
  }, [locId, p.id, p.categorySlug]);

  return (
    <div className="flex h-full flex-col">
      <KioskTopBar onBack={onBack} onStartOver={onStartOver} />

      {cards.length > 1 && (
        <nav className="flex flex-none flex-wrap gap-3 px-8 pb-5 lg:px-16 lg:pb-7">
          {cards.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => onSelect(c.key)}
              className={`h-14 flex-none rounded-full px-6 text-lg font-semibold lg:h-16 lg:px-8 lg:text-2xl ${
                c.key === card.key ? "bg-ink text-surface" : "border-2 border-line bg-surface text-ink"
              }`}
            >
              {c.title}
            </button>
          ))}
        </nav>
      )}

      <QrDock card={card} locId={locId} onTextMe={onTextMe} />
      <p className="flex-none py-3 text-center text-base text-muted lg:py-4 lg:text-xl">Scroll for details. The code stays here.</p>

      <main key={card.key} data-lenis-prevent className="flex-1 space-y-12 overflow-y-auto px-8 pb-16 lg:space-y-16 lg:px-16 lg:pb-24">
        <Hero card={card} />

        <section className="grid grid-cols-3 gap-4 lg:gap-6">
          {ASSURANCES.map(({ icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-3 rounded-2xl bg-surface-2 px-4 py-6 text-center lg:py-8">
              {icon}
              <span className="text-lg font-semibold leading-snug text-ink lg:text-2xl">{label}</span>
            </div>
          ))}
        </section>

        {card.program && (
          <section>
            <h3 className={SECTION_TITLE}>{card.program.blends.length > 1 ? "Formulations" : "Formulation"}</h3>
            <ul className="mt-5 space-y-3">
              {card.program.blends.map((b) => (
                <li key={b.slug} className="flex flex-wrap items-baseline justify-between gap-x-4 rounded-2xl border-2 border-line px-6 py-5">
                  <span className="text-xl font-bold text-ink lg:text-3xl">{b.name}</span>
                  <span className="text-lg text-muted lg:text-2xl">{b.note}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {mechanism?.timeline && (
          <section>
            <h3 className={SECTION_TITLE}>{mechanism.timelineTitle}</h3>
            {mechanism.description && <p className="mt-3 text-lg leading-relaxed text-muted lg:text-2xl">{mechanism.description}</p>}
            <ol className="mt-6 space-y-5">
              {mechanism.timeline.map((step, i) => (
                <li key={step.label} className="flex gap-5">
                  <span className="grid size-12 flex-none place-items-center rounded-full bg-ks-brass text-xl font-bold text-white lg:size-14 lg:text-2xl">
                    {i + 1}
                  </span>
                  <span className="pt-1">
                    <span className="block text-xl font-bold text-ink lg:text-3xl">{step.label}</span>
                    <span className="mt-1 block text-lg leading-snug text-muted lg:text-2xl">{step.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section>
          <h3 className={SECTION_TITLE}>Getting started</h3>
          <p className="mt-3 text-lg text-muted lg:text-2xl">Scan the code at the top and the rest happens on your phone.</p>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:gap-6">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative flex min-h-96 flex-col overflow-hidden rounded-3xl bg-linear-to-br from-ks-panel to-ks-panel-deep p-6 lg:min-h-112 lg:p-8">
                <span className="relative z-10 font-mono text-sm uppercase tracking-widest text-ks-cream/70 lg:text-lg">Step {i + 1}</span>
                <span className="relative z-10 mt-2 font-display text-2xl font-bold leading-tight text-ks-cream lg:text-4xl">{step.title}</span>
                <span className="relative z-10 mt-2 max-w-4/5 text-base leading-snug text-ks-cream/80 lg:text-xl">{step.text}</span>
                <img src={step.img} alt="" aria-hidden="true" className="absolute bottom-0 right-0 h-2/5 w-auto object-contain" />
              </div>
            ))}
          </div>
        </section>

        {isCompounded(p) && (
          <section className="flex gap-4 rounded-3xl border border-line bg-surface-2/60 p-6 lg:p-8">
            <FlaskConical className="size-7 flex-none text-primary lg:size-9" />
            <div>
              <h4 className="font-mono text-sm font-semibold uppercase tracking-widest text-ink lg:text-lg">Compounded drug notice</h4>
              <CompoundedDisclaimer className="mt-2 lg:text-lg" />
            </div>
          </section>
        )}

        <section>
          <h3 className="font-display text-xl font-bold text-ink lg:text-3xl">Important safety information</h3>
          {p.safety && <p className="mt-3 text-base leading-relaxed text-muted lg:text-xl">{p.safety}</p>}
          <p className="mt-3 text-base leading-relaxed text-muted lg:text-xl">{closingDisclaimer(p)}</p>
        </section>
      </main>
    </div>
  );
}
