import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import Reveal from "../ui/Reveal";
import { priceLabel } from "../data/products";

/* Glutathione, rebuilt 2026-10-13 on the NAD+ layout (client: one layout for
   every product page): what it is on the gold band, then the old page's second
   block kept in its format (a heading either side of a centre piece), how the
   injection differs from a capsule, and the dark price card. The brass diagram,
   the white card and the role chips are gone; their few facts live in the
   kept block. The product sits on the Recovery & Wellness shelf since the
   2026-09-08 compliance pass, so nothing here touches skin, tone or
   brightening. The old legal footnote is not repeated: Important Safety
   Information carries the compounded notice and the eligibility line. */

const BAND = "radial-gradient(circle at 30% 40%, #c1a27a, #9a7843)";
/* The price card's ground: a light champagne (client, 2026-10-13, in place
   of the dark brown), with the heading in the page's deep gold. */
const CHAMPAGNE = "linear-gradient(160deg, #f5ead6 0%, #ecdcbf 55%, #e2cda6 100%)";
const GOLD_INK = "#725826";
const CREAM = "#ffe8b1";
const GROUND = "#fbfaf7";
const TITLE = "font-display font-extrabold leading-[1.1]";
const H2 = `${TITLE} text-[clamp(1.7rem,3.4vw,2.5rem)] text-[#725826]`;
const CARD_R = "rounded-[calc(24px*var(--nv-r-scale,1))]";

function StartLink({ to, light = false, className = "" }) {
  return (
    <Link
      to={to}
      className={`group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[0.95rem] font-semibold transition-all hover:-translate-y-0.5 ${
        light ? "bg-[#f6efe0] text-[#6b511e]" : "bg-[#977e43] text-white hover:bg-[#836c39] nv-shadow"
      } ${className}`}
    >
      Start your consultation
      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

/* The old block's gold fade on the last words of each heading, kept with it. */
function Ramp({ children }) {
  return (
    <span
      className="bg-clip-text text-transparent"
      style={{ backgroundImage: "linear-gradient(90deg, #725826 0%, #b39258 100%)" }}
    >
      {children}
    </span>
  );
}

/* 1. WHAT IS GLUTATHIONE: the gold band, with the vial. */

function WhatIs({ startTo }) {
  return (
    <section className="relative overflow-hidden" style={{ background: BAND }}>
      <img
        src="/products/detail/glutathione-2.avif"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 mix-blend-soft-light blur-2xl"
      />
      <div className="relative mx-auto max-w-[1180px] px-5 py-[clamp(2.5rem,6vw,5.5rem)] md:px-10">
        <Reveal as="div">
          <div
            className={`grid gap-8 border border-white/25 bg-white/10 p-6 backdrop-blur-md sm:p-10 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-12 lg:p-14 ${CARD_R}`}
          >
            <div>
              <span className="text-[0.75rem] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(255,232,177,0.8)" }}>
                An antioxidant your body makes
              </span>
              <h2 className={`${TITLE} mt-3 text-[clamp(1.8rem,3.6vw,2.7rem)]`} style={{ color: CREAM }}>
                What is Glutathione?
              </h2>
              <p className="mt-5 max-w-[50ch] text-[1rem] leading-relaxed" style={{ color: CREAM }}>
                Glutathione is an antioxidant the body makes on its own. This compounded prescription form is an
                injection used at home, if a licensed provider decides it is appropriate.
              </p>
              <StartLink to={startTo} light className="mt-7" />
            </div>

            <div>
              <div className="mx-auto w-32 sm:w-36 lg:w-44">
                {/* The tilt has its own wrapper: the float animates the image's
                    transform and would wipe a rotate set on it. */}
                <span className="block rotate-6">
                  <img
                    src="/products/glutathione.avif"
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="nv-float pointer-events-none block w-full drop-shadow-[0_18px_34px_rgba(70,50,20,0.34)]"
                  />
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* 2. MADE IN YOUR CELLS: the old page's second block, kept in its format at
   the client's request (2026-10-13): a heading either side of a centre piece.
   The vial now sits on the gold band, so the centre holds the three amino
   acids glutathione is built from instead of a second vial. */

const AMINO = [
  { abbr: "Glu", name: "Glutamic acid", cx: 90, cy: 88, r: 58 },
  { abbr: "Cys", name: "Cysteine", cx: 200, cy: 186, r: 53 },
  { abbr: "Gly", name: "Glycine", cx: 98, cy: 290, r: 48 },
];

function Tripeptide({ className = "" }) {
  return (
    <span className={`nv-float pointer-events-none block ${className}`}>
      <svg viewBox="14 14 258 350" aria-hidden="true" className="block h-auto w-full overflow-visible">
        <defs>
          <radialGradient id="glu-bead" cx="38%" cy="32%" r="72%">
            <stop offset="0%" stopColor="#f8ecd0" />
            <stop offset="24%" stopColor="#cdae78" />
            <stop offset="72%" stopColor="#9c7a44" />
            <stop offset="100%" stopColor="#74582a" />
          </radialGradient>
          <radialGradient id="glu-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f1e2c2" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f1e2c2" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="145" cy="190" r="140" fill="url(#glu-glow)" />
        {/* The two peptide bonds, drawn under the beads. */}
        {AMINO.slice(1).map((a, i) => (
          <g key={a.abbr}>
            <line x1={AMINO[i].cx} y1={AMINO[i].cy} x2={a.cx} y2={a.cy} stroke="#b89a64" strokeWidth="12" strokeLinecap="round" />
            <line x1={AMINO[i].cx} y1={AMINO[i].cy} x2={a.cx} y2={a.cy} stroke="#ecdcb8" strokeWidth="3" strokeLinecap="round" />
          </g>
        ))}
        {AMINO.map((a) => (
          <g key={a.abbr} style={{ filter: "drop-shadow(0 14px 18px rgba(70,50,20,0.28))" }}>
            <circle cx={a.cx} cy={a.cy} r={a.r} fill="url(#glu-bead)" />
            <text x={a.cx} y={a.cy + 3} textAnchor="middle" fontSize="26" fontWeight="600" fill="#fffaf0">
              {a.abbr}
            </text>
            <text x={a.cx} y={a.cy + 23} textAnchor="middle" fontSize="12.5" fontWeight="500" fill="rgba(255,250,240,0.9)">
              {a.name}
            </text>
          </g>
        ))}
      </svg>
    </span>
  );
}

function MadeInYou() {
  return (
    <section className="py-[clamp(2.75rem,6vw,5.5rem)]">
      <div className="mx-auto max-w-[1180px] px-5 md:px-10">
        <div className="grid items-center gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.62fr)_minmax(0,1fr)]">
          <Reveal as="div" className="lg:self-start">
            <span className="nv-eyebrow">Made in your cells</span>
            <h2 className={`${H2} mt-3 max-w-[15ch]`}>
              Something Your Body Makes <Ramp>Every Day</Ramp>
            </h2>
            <p className="mt-4 max-w-[40ch] text-[1rem] leading-relaxed text-muted">
              Cells build glutathione from three amino acids. Levels vary from person to person.
            </p>
          </Reveal>

          <Reveal as="div" delay={0.06} className="order-first lg:order-none">
            <Tripeptide className="mx-auto w-[min(72%,15rem)] lg:w-full" />
          </Reveal>

          <Reveal as="div" delay={0.12} className="lg:self-end">
            <span className="nv-eyebrow">Its role</span>
            <h2 className={`${H2} mt-3 max-w-[15ch]`}>
              An Antioxidant in <Ramp>Nearly Every Cell</Ramp>
            </h2>
            <p className="mt-4 max-w-[40ch] text-[1rem] leading-relaxed text-muted">
              Glutathione takes part in how cells handle oxidative stress, a normal by-product of everyday cell
              activity.
            </p>
          </Reveal>
        </div>
        <p className="mt-10 border-t border-line pt-5 text-center text-[0.76rem] italic leading-relaxed text-muted">
          How glutathione works in the body, not an expected result of treatment. Individual response varies.
        </p>
      </div>
    </section>
  );
}

/* 3. INJECTION OR CAPSULE: NAD+'s comparison table, against the oral
   supplement people already know. How each is taken and what it costs,
   nothing about how well either works. */

const compareRows = (product) => [
  { label: "How it's taken", ours: "A short injection at home", theirs: "A capsule or tablet" },
  { label: "Provider review", ours: "Yes, by a licensed provider", theirs: "Not required" },
  {
    label: "Pricing",
    ours: [priceLabel(product), product.priceNote].filter(Boolean).join(", "),
    theirs: "Varies by brand",
  },
];

function Compare({ product, startTo }) {
  return (
    <section className="pb-[clamp(2.75rem,6vw,5.5rem)]">
      <div className="mx-auto grid max-w-[1180px] gap-9 px-5 md:px-10 lg:grid-cols-2 lg:items-center lg:gap-14">
        <Reveal as="div">
          <span className="nv-eyebrow">Injection or capsule</span>
          <h2 className={`${H2} mt-3 max-w-[18ch]`}>An Injection, Not a Capsule</h2>
          <p className="mt-4 max-w-[48ch] text-[1rem] leading-relaxed text-muted">
            Glutathione is also sold as an oral supplement. Here is how the two are taken.
          </p>

          <div className={`mt-7 overflow-hidden border border-line bg-surface ${CARD_R}`}>
            <div className="grid grid-cols-[0.8fr_1fr_1fr] gap-3 bg-surface-2 px-4 py-3 text-[0.78rem] font-bold text-ink sm:px-5">
              <span />
              <span>Injection</span>
              <span className="text-muted">Oral supplement</span>
            </div>
            {compareRows(product).map((r) => (
              <div key={r.label} className="grid grid-cols-[0.8fr_1fr_1fr] gap-3 border-t border-line px-4 py-3.5 text-[0.86rem] leading-snug sm:px-5">
                <span className="font-semibold text-ink">{r.label}</span>
                <span className="text-ink">{r.ours}</span>
                <span className="text-muted">{r.theirs}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[0.76rem] italic leading-relaxed text-muted">
            A comparison of how each is taken, not of how well either works.
          </p>
          <StartLink to={startTo} className="mt-7" />
        </Reveal>

        <Reveal as="div" delay={0.08} className={`relative hidden overflow-hidden sm:block ${CARD_R}`}>
          <img
            src="/site/skin-health/trust-delivery.avif"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="aspect-4/3 w-full object-cover object-[30%_center] lg:aspect-5/6"
          />
        </Reveal>
      </div>
    </section>
  );
}

/* 4. WHAT'S INCLUDED: the dark price card, with the record's own price. */

const INCLUDED = [
  "An online intake reviewed by a licensed provider",
  "Glutathione Injection, if prescribed",
  "Compounded by a licensed U.S. pharmacy",
  "Discreet home delivery",
  "Follow-up care and guidance throughout your plan",
];

function Included({ product, startTo }) {
  return (
    <section className="mx-auto max-w-[1180px] px-5 pb-[clamp(2.75rem,6vw,5.5rem)] md:px-10">
      <Reveal as="div">
        <div className={`relative grid overflow-hidden lg:grid-cols-2 ${CARD_R}`} style={{ background: CHAMPAGNE }}>
          {/* The warm glow behind her, laid on the whole card so it fades out
              before the price card instead of ending at the column's edge.
              Desktop only: stacked, it would sit under the price card. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden lg:block"
            style={{ background: "radial-gradient(circle at 28% 92%, rgba(193,162,122,0.36), transparent 42%)" }}
          />
          <div className="relative px-6 pt-9 sm:px-10 sm:pt-12">
            <span className="relative flex items-center gap-2 text-[0.9rem] font-semibold" style={{ color: GOLD_INK }}>
              <span className="h-2 w-2 rounded-full bg-[#977e43]" />
              Provider-guided care
            </span>
            <h2 className={`${TITLE} relative z-10 mt-4 max-w-[20ch] text-[clamp(1.5rem,2.8vw,2.1rem)]`} style={{ color: GOLD_INK }}>
              Glutathione, prescribed and followed by a licensed provider.
            </h2>
            {/* A woman in the page's audience, 35 to 60. The cut-out is cropped
                only at the waist, so it stands on the card's bottom edge.
                Stacked, that crop fades out under the price card. */}
            <img
              src="/site/anti-aging/benefit-vitality.avif"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="mx-auto mt-6 block h-64 w-auto object-contain object-bottom [mask-image:linear-gradient(180deg,#000_70%,transparent)] sm:h-80 lg:absolute lg:bottom-0 lg:left-1/2 lg:mt-0 lg:h-[60%] lg:-translate-x-1/2 lg:[mask-image:none]"
            />
          </div>

          {/* Stacked, the card rides up over the photo's cropped bottom edge. */}
          <div className="relative -mt-12 p-4 sm:p-8 lg:mt-0">
            <div className={`bg-white px-6 py-7 sm:px-9 sm:py-9 ${CARD_R}`}>
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="font-display text-[clamp(2.4rem,4vw,3rem)] font-extrabold leading-none text-ink">
                  {priceLabel(product)}
                </span>
                {product.priceNote && <span className="text-[1rem] text-muted">{product.priceNote}</span>}
              </div>
              <p className="mt-2 text-[0.88rem] text-muted">
                You pay only if a provider determines that a prescription is appropriate.
              </p>
              <h3 className="mt-7 text-[0.95rem] font-bold text-ink">What's included</h3>
              <ul className="mt-3 grid gap-3">
                {INCLUDED.map((t) => (
                  <li key={t} className="flex items-start gap-3 text-[0.94rem] leading-snug text-ink">
                    <Check size={17} strokeWidth={2.4} className="mt-0.5 shrink-0 text-[#977e43]" />
                    {t}
                  </li>
                ))}
              </ul>
              <StartLink to={startTo} className="mt-8 w-full justify-center" />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default function GlutathioneSections({ product, startTo = "/start" }) {
  return (
    <>
      <WhatIs startTo={startTo} />
      <div style={{ background: GROUND }}>
        <MadeInYou />
        <Compare product={product} startTo={startTo} />
        <Included product={product} startTo={startTo} />
      </div>
    </>
  );
}
