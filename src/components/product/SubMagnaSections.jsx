import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AnimatePresence,
  motion as Motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, Check, Droplet, Package, ShieldCheck } from "lucide-react";
import Reveal from "../ui/Reveal";
import BlurIn from "../ui/BlurIn";
import { priceLabel, productsData } from "../data/products";
import { productPath } from "../../lib/slug";

/* Semaglutide Sublingual Drops (SubMagna), redesigned phone first on
 * 2026-10-13 at the client's ask: shorter copy, one idea per screen, and
 * motion that follows the scroll rather than popping in.
 *
 * Built for a 390px screen first. Each section stacks into one column and only
 * spreads out from md/lg up. The plan cards swipe on a phone and sit in a row
 * on desktop; the drops or injection switch works the same everywhere.
 *
 * Deliberately absent, as on the first version: any mg or mg/mL figure,
 * any dosing frequency, any refrigeration or absorption claim, and anything
 * saying one route works better than the other. The label and the provider
 * set those; the specs accordion further down carries the exact figures.
 */

const EASE = [0.2, 0.7, 0.3, 1];
/* The light champagne the client set on 2026-10-13 for every price card. */
const CHAMPAGNE = "linear-gradient(160deg, #f5ead6 0%, #ecdcbf 55%, #e2cda6 100%)";
const SAND = "linear-gradient(160deg, #f6eee1 0%, #efe3cf 100%)";
const GOLD = "#977e43";
const GOLD_INK = "#725826";
const GROUND = "#fbfaf7";
const TITLE = "font-display font-extrabold leading-[1.1]";
const H2 = `${TITLE} text-[clamp(1.75rem,6.4vw,2.6rem)] text-[#725826]`;
const CARD_R = "rounded-[calc(24px*var(--nv-r-scale,1))]";

const DROPS_CUTOUT = "/products/semaglutide-sublingual-drops.avif";
const DROPPER_PHOTO = "/products/detail/semaglutide-sublingual-drops-3.avif";

/* The weekly injection the drops are set against: the B12 starter, the one
   the weight loss shelf leads with. */
const injection = () => productsData.find((p) => p.id === 1);

function StartLink({ to, className = "" }) {
  return (
    <Link
      to={to}
      className={`group inline-flex items-center gap-2 rounded-full bg-[#977e43] px-7 py-3.5 text-[0.95rem] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#836c39] nv-shadow ${className}`}
    >
      Start your consultation
      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function Eyebrow({ children }) {
  return (
    <Reveal as="span" y={12} className="nv-eyebrow block">
      {children}
    </Reveal>
  );
}

/* 1. NEEDLE-FREE: the heading, then the bottle on a sand stage. The bottle
      bobs on its own and drifts against the scroll; the three chips arrive one
      after another. Under reduced motion it all simply sits still. */

const CHIPS = [
  { icon: Droplet, text: "No needles", at: "left-3 top-6 sm:left-8 sm:top-10" },
  { icon: ShieldCheck, text: "Provider-guided", at: "right-3 top-1/3 sm:right-8" },
  { icon: Package, text: "Shipped discreetly", at: "bottom-7 left-4 sm:bottom-10 sm:left-10" },
];

function NeedleFree({ startTo }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const drift = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [36, -36]);
  const tilt = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [-2.5, 2.5]);

  return (
    <section ref={ref} className="overflow-hidden py-[clamp(3rem,9vw,6rem)]">
      <div className="mx-auto grid max-w-[1180px] gap-8 px-5 md:px-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <Eyebrow>A needle-free GLP-1</Eyebrow>
          <BlurIn as="h2" className={`${H2} mt-3 max-w-[14ch]`}>
            Semaglutide, without the needle.
          </BlurIn>
          <Reveal as="p" delay={0.1} className="mt-4 max-w-[44ch] text-[1rem] leading-relaxed text-muted">
            Drops instead of an injection: semaglutide in a SubMagna® base, taken under the tongue.
          </Reveal>
          <Reveal as="div" delay={0.2} className="mt-7 hidden lg:block">
            <StartLink to={startTo} />
          </Reveal>
        </div>

        <Reveal as="div" y={32} className={`relative aspect-[4/5] overflow-hidden sm:aspect-[5/4] lg:aspect-[4/5] ${CARD_R}`}>
          <div className="absolute inset-0" style={{ background: SAND }} />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(circle at 50% 48%, rgba(255,255,255,0.85), transparent 58%)" }}
          />
          <Motion.div style={{ y: drift, rotate: tilt }} className="absolute inset-0 flex items-center justify-center">
            <Motion.img
              src={DROPS_CUTOUT}
              alt="Semaglutide GLP-1 Drops bottle"
              loading="lazy"
              className="h-[78%] w-auto object-contain drop-shadow-[0_24px_30px_rgba(90,64,24,0.28)]"
              animate={reduced ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
            />
          </Motion.div>
          {CHIPS.map(({ icon, text, at }, i) => {
            const Icon = icon;
            return (
              <Motion.span
                key={text}
                className={`absolute flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3.5 py-2 text-[0.8rem] font-semibold text-ink backdrop-blur-md nv-shadow sm:text-[0.86rem] ${at}`}
                initial={{ opacity: 0, scale: 0.85, y: 10 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.35 + i * 0.15 }}
              >
                <Icon size={15} strokeWidth={2.2} className="text-[#977e43]" />
                {text}
              </Motion.span>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}

/* 2. HOW THE DROPS ARE TAKEN: the dropper photo, then three steps on a rail
      that fills as you scroll and lights each number as the fill reaches it.
      On desktop the photo holds still beside the steps. */

const STEPS = [
  { title: "Fill the dropper", text: "Draw up the amount shown on your prescription label." },
  { title: "Under the tongue", text: "Place the drops under your tongue and hold them there as directed." },
  { title: "Follow your plan", text: "Your provider sets how much and how often, and can adjust it over time." },
];

function HowTaken() {
  const listRef = useRef(null);
  const [lit, setLit] = useState(0);
  /* The rail runs from the first number's centre to the last one's, measured,
     since the last step's height depends on how its text wraps. */
  const [rail, setRail] = useState({ top: 22, height: 0 });
  useEffect(() => {
    const el = listRef.current;
    if (!el) return undefined;
    const measure = () => {
      const last = el.lastElementChild;
      setRail({ top: 22, height: last ? last.offsetTop : 0 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 75%", "end 55%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.4 });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = v >= 0.9 ? 2 : v >= 0.42 ? 1 : 0;
    setLit((cur) => (cur === next ? cur : next));
  });

  return (
    <section className="py-[clamp(3rem,9vw,6rem)]" style={{ background: "#ffffff" }}>
      <div className="mx-auto grid max-w-[1180px] gap-9 px-5 md:px-10 lg:grid-cols-2 lg:items-start lg:gap-16">
        <div className="lg:sticky lg:top-28">
          <Eyebrow>Needle-free</Eyebrow>
          <BlurIn as="h2" className={`${H2} mt-3 max-w-[16ch]`}>
            How the drops are taken
          </BlurIn>
          <Reveal as="div" y={28} delay={0.1} className={`mt-7 overflow-hidden ${CARD_R}`}>
            <img
              src={DROPPER_PHOTO}
              alt="The dropper lifted from the bottle"
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
          </Reveal>
        </div>

        <div className="lg:pt-24">
          <div className="relative">
            {/* The rail and its fill, behind the numbers. */}
            <span aria-hidden="true" className="absolute left-[21px] w-0.5 rounded-full bg-[#ece2cf]" style={rail} />
            <Motion.span
              aria-hidden="true"
              className="absolute left-[21px] w-0.5 origin-top rounded-full"
              style={{ ...rail, scaleY: fill, background: `linear-gradient(180deg, #d8bf8e, ${GOLD})` }}
            />
            <ol ref={listRef} className="relative grid gap-9 sm:gap-11">
              {STEPS.map(({ title, text }, i) => {
                const on = i <= lit;
                return (
                  <li key={title} className="flex gap-5">
                    <span
                      className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-[0.95rem] font-semibold transition-colors duration-500 ${
                        on ? "border-[#977e43] bg-[#977e43] text-white" : "border-[#e3d3b2] bg-white text-[#a8906a]"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <Reveal as="div" delay={0.05} className="pt-1.5">
                      <h3
                        className={`font-display text-[1.15rem] leading-snug transition-colors duration-500 ${
                          on ? "text-ink" : "text-ink/45"
                        }`}
                      >
                        {title}
                      </h3>
                      <p className="mt-1.5 max-w-[36ch] text-[0.96rem] leading-relaxed text-muted">{text}</p>
                    </Reveal>
                  </li>
                );
              })}
            </ol>
          </div>
          <Reveal as="p" className="mt-10 border-t border-line pt-5 text-[0.78rem] leading-relaxed text-muted">
            Always follow your prescription label and your provider's instructions.
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* 3. DROPS OR INJECTION: one card and a two-way switch. The gold pill slides
      to the choice and the card crossfades, so both routes read in the same
      place on a phone. Differences only, no better or worse. */

function Compare({ product }) {
  const [mode, setMode] = useState("drops");
  const sema = injection();
  const options = {
    drops: {
      label: "Drops",
      img: DROPS_CUTOUT,
      alt: "Semaglutide GLP-1 Drops bottle",
      rows: [
        ["How it's taken", "Drops under the tongue"],
        ["Needles", "None"],
        ["Ships as", "A dropper bottle"],
        ["Price", priceLabel(product)],
      ],
    },
    injection: {
      label: "Injection",
      img: sema?.img,
      alt: "Semaglutide vial",
      rows: [
        ["How it's taken", "An injection under the skin"],
        ["Needles", "A small needle"],
        ["Ships as", "A vial and syringes"],
        ["Price", sema ? priceLabel(sema) : ""],
      ],
    },
  };
  const shown = options[mode];

  return (
    <section className="py-[clamp(3rem,9vw,6rem)]">
      <div className="mx-auto max-w-[1180px] px-5 md:px-10">
        <div className="mx-auto max-w-[40rem] text-center">
          <Eyebrow>Two ways to take semaglutide</Eyebrow>
          <BlurIn as="h2" className={`${H2} mx-auto mt-3`}>
            Drops or injection?
          </BlurIn>
          <Reveal as="p" delay={0.1} className="mx-auto mt-4 max-w-[42ch] text-[1rem] leading-relaxed text-muted">
            Both contain semaglutide. Your provider helps you decide which, if either, suits you.
          </Reveal>
        </div>

        <Reveal as="div" delay={0.15} className="mx-auto mt-8 max-w-[52rem]">
          <div
            role="tablist"
            aria-label="Drops or injection"
            className="relative mx-auto grid w-full max-w-[22rem] grid-cols-2 rounded-full border border-[#e3d3b2] bg-white p-1.5"
          >
            {Object.entries(options).map(([key, o]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={mode === key}
                onClick={() => setMode(key)}
                className={`relative rounded-full py-2.5 text-[0.95rem] font-semibold transition-colors duration-300 ${
                  mode === key ? "text-white" : "text-[#8a6f33]"
                }`}
              >
                {mode === key && (
                  <Motion.span
                    layoutId="submagna-route"
                    className="absolute inset-0 rounded-full bg-[#977e43]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{o.label}</span>
              </button>
            ))}
          </div>

          <div className={`mt-6 overflow-hidden border border-[#e8dcc4] ${CARD_R}`} style={{ background: SAND }}>
            <AnimatePresence mode="wait" initial={false}>
              <Motion.div
                key={mode}
                role="tabpanel"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="grid items-center gap-2 p-5 sm:grid-cols-[0.8fr_1.2fr] sm:gap-8 sm:p-9"
              >
                <img
                  src={shown.img}
                  alt={shown.alt}
                  loading="lazy"
                  className="mx-auto h-60 w-auto object-contain drop-shadow-[0_18px_22px_rgba(90,64,24,0.22)] sm:h-72"
                />
                <dl className="grid">
                  {shown.rows.map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-4 border-t border-[#e3d3b2]/80 py-3.5 first:border-t-0">
                      <dt className="shrink-0 text-[0.86rem] text-muted">{k}</dt>
                      <dd className="text-right text-[0.98rem] font-semibold text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Motion.div>
            </AnimatePresence>
          </div>

          {sema && (
            <p className="mt-5 text-center text-[0.88rem] text-muted">
              Prefer the injection?{" "}
              <Link to={productPath(sema)} className="font-semibold text-[#8a6f33] underline underline-offset-4">
                See Semaglutide injection
              </Link>
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}

/* 4. YOUR PLAN: the two-rung ladder in plain words. Month 1 is the
      starter record, every month after is the refill. The cards swipe on a
      phone, with dots that follow; on desktop they sit in a row on a line
      that draws itself in. */

const STAGES = [
  { when: "Month 1", title: "Your first bottle", text: "Shipped once a provider reviews your intake and prescribes, if appropriate." },
  { when: "Month 2 onward", title: "Monthly refills", text: "A short check-in before each refill keeps your provider up to date." },
  { when: "Any time", title: "Care that adjusts", text: "Your provider can change your plan, and your care team is a message away." },
];

function Plan() {
  const railRef = useRef(null);
  const [at, setAt] = useState(0);

  const onScroll = () => {
    const el = railRef.current;
    if (!el) return;
    const card = el.firstElementChild;
    const step = card ? card.getBoundingClientRect().width + 16 : el.clientWidth;
    const next = Math.round(el.scrollLeft / step);
    setAt((cur) => (cur === next ? cur : Math.min(next, STAGES.length - 1)));
  };

  return (
    <section className="py-[clamp(3rem,9vw,6rem)]" style={{ background: "#ffffff" }}>
      <div className="mx-auto max-w-[1180px] px-5 md:px-10">
        <Eyebrow>Your plan</Eyebrow>
        <BlurIn as="h2" className={`${H2} mt-3 max-w-[18ch]`}>
          Month by month, with your provider.
        </BlurIn>

        <div className="relative mt-8">
          <Motion.span
            aria-hidden="true"
            className="absolute left-0 right-0 top-[2.15rem] hidden h-px origin-left bg-gradient-to-r from-[#d8c49a] via-[#977e43] to-[#d8c49a] md:block"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1.2, ease: EASE }}
          />
          <div
            ref={railRef}
            onScroll={onScroll}
            className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden"
          >
            {STAGES.map(({ when, title, text }, i) => (
              <Reveal
                key={when}
                as="div"
                delay={i * 0.12}
                className="w-[80%] shrink-0 snap-start sm:w-[60%] md:w-auto"
              >
                <div className={`relative h-full border border-line bg-[#fbf8f2] p-6 ${CARD_R}`}>
                  <span className="relative z-10 inline-flex h-9 items-center rounded-full bg-[#977e43] px-4 text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-white">
                    {when}
                  </span>
                  <h3 className="mt-5 font-display text-[1.2rem] leading-snug text-ink">{title}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Where you are in the swipe. Phones only. */}
          <div className="mt-5 flex justify-center gap-2 md:hidden" aria-hidden="true">
            {STAGES.map((s, i) => (
              <span
                key={s.when}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === at ? "w-6 bg-[#977e43]" : "w-1.5 bg-[#dccaa6]"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* 5. WHAT'S INCLUDED: the champagne price card every product page carries.
      Stacked on a phone, the white card rides up over the photo's edge. */

const INCLUDED = [
  "An online intake reviewed by a licensed provider",
  "Semaglutide sublingual drops, if prescribed",
  "Compounded by a licensed U.S. pharmacy",
  "Discreet home delivery",
  "Follow-up care throughout your plan",
];

function Included({ product, startTo }) {
  return (
    <section className="mx-auto max-w-[1180px] px-5 py-[clamp(3rem,9vw,6rem)] md:px-10">
      <Reveal as="div" y={32}>
        <div className={`relative grid overflow-hidden lg:grid-cols-2 ${CARD_R}`} style={{ background: CHAMPAGNE }}>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden lg:block"
            style={{ background: "radial-gradient(circle at 22% 92%, rgba(255,255,255,0.6), transparent 45%)" }}
          />
          <div className="relative px-6 pt-9 sm:px-10 sm:pt-12">
            <span className="relative flex items-center gap-2 text-[0.9rem] font-semibold" style={{ color: GOLD_INK }}>
              <span className="h-2 w-2 rounded-full bg-[#977e43]" />
              Provider-guided care
            </span>
            <h2
              className={`${TITLE} relative z-10 mt-4 max-w-[18ch] text-[clamp(1.5rem,5.6vw,2.1rem)]`}
              style={{ color: GOLD_INK }}
            >
              Reviewed, prescribed and followed by a licensed provider.
            </h2>
            <img
              src="/site/goals/weightlossnobg.avif"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="-ml-6 mt-6 block h-72 w-auto object-contain object-bottom [mask-image:linear-gradient(180deg,#000_70%,transparent)] sm:-ml-10 sm:h-96 lg:absolute lg:bottom-0 lg:left-0 lg:ml-0 lg:mt-0 lg:h-[60%] lg:[mask-image:none]"
            />
          </div>

          <div className="relative -mt-12 p-4 sm:p-8 lg:mt-0">
            <Reveal as="div" y={40} delay={0.15} className={`bg-white px-6 py-7 sm:px-9 sm:py-9 ${CARD_R}`}>
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="font-display text-[clamp(2.4rem,9vw,3rem)] font-extrabold leading-none text-ink">
                  {priceLabel(product)}
                </span>
                {product.priceNote && <span className="text-[1rem] text-muted">{product.priceNote}</span>}
              </div>
              <p className="mt-2 text-[0.88rem] text-muted">
                You pay only if a provider determines that a prescription is appropriate.
              </p>
              <h3 className="mt-7 text-[0.95rem] font-bold text-ink">What's included</h3>
              <ul className="mt-3 grid gap-3">
                {INCLUDED.map((t, i) => (
                  <Motion.li
                    key={t}
                    className="flex items-start gap-3 text-[0.94rem] leading-snug text-ink"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.45, ease: EASE, delay: 0.25 + i * 0.07 }}
                  >
                    <Check size={17} strokeWidth={2.4} className="mt-0.5 shrink-0 text-[#977e43]" />
                    {t}
                  </Motion.li>
                ))}
              </ul>
              <StartLink to={startTo} className="mt-8 w-full justify-center" />
            </Reveal>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default function SubMagnaSections({ product, startTo = "/start" }) {
  return (
    <div style={{ background: GROUND }}>
      <NeedleFree startTo={startTo} />
      <HowTaken />
      <Compare product={product} />
      <Plan />
      <Included product={product} startTo={startTo} />
    </div>
  );
}
