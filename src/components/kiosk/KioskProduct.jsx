import React, { useEffect, useRef, useState } from "react";
import { FlaskConical, Lock, MessageSquareText, Stethoscope, Truck } from "lucide-react";
import KioskTopBar from "./KioskTopBar";
import KioskQr from "./KioskQr";
import KioskFaq from "./KioskFaq";
import KioskSiteSections from "./KioskSiteSections";
import { ComplianceBadges, CompoundedDisclaimer } from "../Compliance";
import { STEPS } from "../product/ProductJourney";
import { closingLine } from "../product/ProductSafety";
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

/* The code panel. Light champagne like the website's price cards (client,
   2026-10-13: the near-black panel didn't match the site), and kept short so
   the tabs and the code take no more than the top third of the screen.
   Trimmed again on 2026-10-21 (client: "a tad smaller, not too small"): a
   smaller code and title, and the "scroll for details" line gone. */
function QrDock({ card, locId, onTextMe, flash }) {
  return (
    <div
      className={`mx-8 flex flex-none items-center gap-5 rounded-3xl bg-linear-to-br from-ks-champagne to-ks-champagne-deep p-4 text-ks-heading ring-ks-brass transition-shadow duration-300 lg:mx-16 lg:gap-7 lg:p-5 ${
        flash ? "ring-8" : "ring-0"
      }`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 lg:gap-2">
        <span className="font-display text-2xl font-extrabold leading-tight lg:text-3xl">Scan to start your visit</span>
        <span className="text-base leading-snug text-ks-heading/80 lg:text-lg">
          {card.title} · {card.chips[0]}
        </span>
        <span className="flex flex-wrap items-center gap-3 pt-2">
          {/* The easier way in for most people at the kiosk, so it is the
              loudest thing on the panel (client, 2026-10-21): dark on the
              champagne, and no longer worded as a fallback. */}
          {onTextMe && (
            <button
              type="button"
              onClick={onTextMe}
              className="inline-flex items-center gap-2.5 rounded-full bg-ink px-6 py-3 text-lg font-bold text-white shadow-lg ring-4 ring-white/70 active:bg-ks-heading lg:px-8 lg:py-4 lg:text-2xl"
            >
              <MessageSquareText className="size-6 lg:size-7" /> Text me the link
            </button>
          )}
          <span className="inline-flex items-center gap-2 text-base text-ks-heading/80 lg:text-lg">
            <Lock className="size-4 lg:size-5" /> Private to your own device
          </span>
        </span>
      </div>
      {/* Drawn once the placement is read, so a scan is always tagged with
          this kiosk; see KioskQrModal on the product page. */}
      {/* KioskQr draws at a fixed pixel size, so the box is one size everywhere. */}
      <div className="grid size-44 flex-none place-items-center rounded-2xl bg-white p-2">
        {locId !== undefined && <KioskQr value={scanUrl(card.product, locId)} size={160} />}
      </div>
    </div>
  );
}

function Hero({ card }) {
  const p = card.product;
  /* No "Currently unavailable in" line here, unlike the product page: the
     kiosk only lists what its own state allows (client, 2026-10-13). */
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
  const scroller = useRef(null);
  const tabs = useRef(null);

  // Brings the chosen treatment's tab into view when it sits off the row.
  useEffect(() => {
    const row = tabs.current;
    const on = row?.querySelector("[data-on]");
    if (on) row.scrollLeft = on.offsetLeft - (row.clientWidth - on.offsetWidth) / 2;
  }, [card.key]);

  /* A tap on one of the site's own buttons lights the code instead, since the
     visit starts on the patient's phone, not here. */
  const [flash, setFlash] = useState(false);
  const flashTimer = useRef(null);
  const pointToQr = () => {
    setFlash(true);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(false), 1600);
  };
  useEffect(() => () => clearTimeout(flashTimer.current), []);

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

      {/* The category's other treatments, one row that swipes sideways. It
          wrapped onto four rows for weight loss and, with the code, filled
          half the screen (client, 2026-10-13). */}
      {cards.length > 1 && (
        <nav ref={tabs} data-lenis-prevent className="no-scrollbar relative flex flex-none gap-3 overflow-x-auto px-8 pb-4 lg:px-16 lg:pb-5">
          {cards.map((c) => (
            <button
              key={c.key}
              type="button"
              data-on={c.key === card.key || undefined}
              onClick={() => onSelect(c.key)}
              className={`h-14 flex-none whitespace-nowrap rounded-full px-6 text-lg font-semibold ${
                c.key === card.key ? "bg-ks-brass text-white" : "border-2 border-line bg-surface text-ink"
              }`}
            >
              {c.title}
            </button>
          ))}
        </nav>
      )}

      <QrDock card={card} locId={locId} onTextMe={onTextMe} flash={flash} />

      <main ref={scroller} key={card.key} data-lenis-prevent className="mt-4 flex-1 overflow-y-auto pb-16 lg:mt-5 lg:pb-24">
        <div className="space-y-12 px-8 lg:space-y-16 lg:px-16">
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
        </div>

        {/* The product page's own sections, full width as on the site. */}
        <div className="my-12 lg:my-16">
          <KioskSiteSections product={p} onLink={pointToQr} scrollRoot={scroller} />
        </div>

        <div className="space-y-12 px-8 lg:space-y-16 lg:px-16">
          <KioskFaq product={p} />

          <section>
            <h3 className={SECTION_TITLE}>Getting started</h3>
            <p className="mt-3 text-lg text-muted lg:text-2xl">Scan the code at the top and the rest happens on your phone.</p>
            {/* The product page's photo cards, two by two. */}
            <ol className="mt-6 grid grid-cols-2 gap-4 lg:gap-6">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex flex-col rounded-3xl bg-surface-2/45 p-3">
                  <img src={step.img} alt="" aria-hidden="true" className="aspect-5/4 w-full rounded-2xl object-cover" />
                  <div className="px-3 pb-4 pt-5 lg:px-4">
                    <span className="font-mono text-sm font-semibold uppercase tracking-widest text-accent lg:text-lg">Step {String(i + 1).padStart(2, "0")}</span>
                    <h4 className="mt-2 font-display text-2xl font-bold leading-snug text-ink lg:text-3xl">{step.title}</h4>
                    <p className="mt-2 text-base leading-relaxed text-muted lg:text-xl">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
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
            {p.fdaDisclaimer && <p className="mt-3 text-base leading-relaxed text-muted lg:text-xl">{p.fdaDisclaimer}</p>}
            <p className="mt-3 text-base leading-relaxed text-muted lg:text-xl">{closingLine(p)}</p>
          </section>
        </div>
      </main>
    </div>
  );
}
