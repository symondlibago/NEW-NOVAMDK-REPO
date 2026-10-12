import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Home, Plus, Repeat, Syringe, Truck } from "lucide-react";
import Navbar from "../Nav/Navbar";
import Footer from "../Nav/Footer";
import Seo from "../Seo";
import Reveal from "../ui/Reveal";
import ProductGallery from "./ProductGallery";
import ProductMechanism from "./ProductMechanism";
import ProductWhy from "./ProductWhy";
import ProductFaq from "./ProductFaq";
import ProductJourney from "./ProductJourney";
import { ComplianceBadges } from "../Compliance";
import { doseStage } from "../data/subscriptions";
import { productPath } from "../../lib/slug";

/* The product page for the triple blends (molecule + glycine + B12).
 *
 * Presentation only. ProductPage still owns the lookup, `startVisit`, the
 * Turnstile pass, the state rule and the patient modal, and hands this the
 * product plus an `onStart`. Nothing here talks to an API, which is why a
 * second layout is safe to add at all: the one path that takes money and
 * creates a case is still the one path.
 *
 * The page body is mostly the sections the original product page already uses
 * (mechanism diagram, why, FAQ, journey) rather than prose written here. The
 * first pass hand rolled four boxes of text in their place and read like a spec
 * sheet. What is local to this file is the mobile first hero, the photo band and
 * the step rail, because those are the parts the shared sections do not cover.
 *
 * Mobile first: the column order below `md` is the reading order, picture, what
 * it is, what it costs, start. The desktop two column hero is the enhancement.
 */

const EASE = [0.2, 0.7, 0.3, 1];

/* What actually happens, in the order it happens, so the plan is a sequence
   rather than a paragraph. Wording follows the hold model: the card is
   authorised at checkout and only charged once a provider approves. */
const STEPS = [
  { title: "Answer a short questionnaire", text: "A few minutes, on your own phone." },
  { title: "A licensed provider reviews it", text: "They decide whether treatment is appropriate." },
  { title: "Your first fill ships", text: "Discreetly, from a licensed pharmacy, once approved." },
  { title: "A check-in before each refill", text: "So your provider can adjust the dose." },
];

/* One spec row, closed by default. An accordion rather than a table because the
   rows are reference: a patient reads Active Compound and Pharmacy, and scrolls
   past the rest to the button. */
function SpecRow({ label, value, open, onToggle, reduced }) {
  return (
    <div className="border-b border-line last:border-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:text-[#8a6f3c]"
      >
        <span className="text-[0.95rem] font-semibold">{label}</span>
        <motion.span
          animate={{ rotate: open ? 135 : 0 }}
          transition={reduced ? { duration: 0 } : { duration: 0.25, ease: EASE }}
          className="grid h-7 w-7 flex-none place-items-center rounded-full border border-line text-muted"
        >
          <Plus size={14} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={reduced ? { duration: 0 } : { duration: 0.28, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="pb-4 pr-10 text-[0.92rem] leading-relaxed text-muted">{value}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SubscriptionProductPage({
  product,
  categoryLabel,
  backLink,
  onStart,
  /* ClosingDisclaimer, rendered by ProductPage. Passed in rather than imported
     so the regulatory sentence stays in one file and this one cannot drift
     from it, and so the two pages do not import each other. */
  disclaimer = null,
  children = null,
}) {
  const reduced = useReducedMotion();
  const heroRef = useRef(null);
  /* The sticky bar appears once the hero button has scrolled away, so there are
     never two Start buttons on screen competing for the same tap. */
  const heroOnScreen = useInView(heroRef, { margin: "-120px 0px 0px 0px" });
  const [openSpec, setOpenSpec] = useState(null);

  const stage = doseStage(product);
  const highlights = (product.highlights || []).map((h) => h?.text).filter(Boolean);
  /* The photos behind the gallery, reused as the band. The gallery shows the
     first one; these are the ones a visitor would otherwise never see unless
     they clicked a thumbnail. */
  const photos = (product.imgGallery || []).filter(Boolean);
  const band = photos[0] || product.imgDetail || null;

  const cta = (
    <motion.button
      type="button"
      onClick={onStart}
      whileTap={reduced ? undefined : { scale: 0.985 }}
      className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#977e43] px-7 py-4 text-[1rem] font-semibold text-white transition-colors hover:bg-[#836c39] nv-shadow"
    >
      Start your visit
      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
    </motion.button>
  );

  return (
    <main className="min-h-screen w-full bg-bg text-ink">
      <Seo
        title={`${product.heroTitle || product.name} — ${product.categoryName}`}
        description={product.subtitle}
        path={productPath(product)}
        image={product.img}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.subtitle || undefined,
          image: `https://www.novamdk.com${product.img}`,
          category: product.categoryName,
          brand: { "@type": "Brand", name: product.brandName || "Nova MDK" },
        }}
      />
      <Navbar />

      {/* Desktop only, matching ProductPage from 2026-10-13 (client): on a
          phone these two pills cost a row above the fold and duplicate the back
          gesture and the logo. */}
      <div className="mx-auto hidden max-w-[1180px] px-5 pt-5 md:block md:px-10 md:pt-6">
        <div className="flex flex-wrap gap-2">
          <Link
            to={backLink}
            className="inline-flex flex-none items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-[0.85rem] font-medium text-muted transition-all hover:-translate-x-0.5 hover:border-line-strong hover:text-ink"
          >
            <ArrowLeft size={15} /> Back to {categoryLabel}
          </Link>
          <Link
            to="/"
            className="inline-flex flex-none items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-[0.85rem] font-medium text-muted transition-all hover:border-line-strong hover:text-ink"
          >
            <Home size={15} /> Home
          </Link>
        </div>
      </div>

      {/* ===== Hero ===== */}
      <section
        ref={heroRef}
        className="mx-auto max-w-[1180px] px-5 py-6 md:px-10 md:py-[clamp(1.5rem,4vw,3rem)]"
      >
        <div className="grid gap-7 md:grid-cols-2 md:items-start md:gap-10 lg:gap-14">
          <Reveal className="min-w-0" y={16}>
            <ProductGallery product={product} categoryLabel={categoryLabel} />
          </Reveal>

          <Reveal className="min-w-0" delay={reduced ? 0 : 0.08} y={16}>
            {/* wrap-break-word, because these names are long and "Semaglutide"
                has no break opportunity in it at all. */}
            <h1 className="wrap-break-word font-display text-[clamp(1.85rem,7vw,3.05rem)] font-extrabold leading-[1.06] tracking-tight text-[#725826]">
              {product.heroTitle || product.name}
            </h1>
            {product.tagline && (
              <p className="mt-2.5 text-[clamp(1rem,4vw,1.35rem)] font-semibold leading-snug text-ink">
                {product.tagline}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f3ead8] px-3 py-1.5 text-[0.78rem] font-semibold text-[#8a6f3c]">
                {stage === "Refill" ? <Repeat size={13} /> : <Syringe size={13} />}
                {product.dosageForm}
              </span>
              {product.size && (
                <span className="inline-flex items-center rounded-full border border-line px-3 py-1.5 text-[0.78rem] font-medium text-muted">
                  {product.size}
                </span>
              )}
            </div>

            <p className="mt-4 max-w-[58ch] text-[0.98rem] leading-[1.7] text-muted md:text-[1.02rem]">
              {product.subtitle}
            </p>

            <ComplianceBadges compounded rx size="lg" className="mt-5" />

            <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-line pt-6">
              <span className="text-[0.95rem] uppercase tracking-[0.08em] text-ink">Starts at</span>
              <span className="font-display text-[clamp(2.1rem,8vw,2.9rem)] font-extrabold leading-none tracking-tight">
                {product.price}
                <span className="font-semibold">/mo</span>
              </span>
            </div>

            <div className="mt-6">{cta}</div>

            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {[
                "Reviewed by a licensed provider",
                "Only charged once a provider approves",
                "Shipped discreetly to your door",
                "Cancel future renewals any time",
              ].map((text) => (
                <li key={text} className="flex items-start gap-2">
                  <Check size={15} className="mt-0.5 flex-none text-[#977e43]" />
                  <span className="text-[0.86rem] leading-snug text-muted">{text}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ===== Photo band =====
          Full bleed, so the page has one moment that is a picture rather than a
          card. It carries the highlights, which were three bordered boxes with a
          tick in them before and earned nothing by being their own section. */}
      {band && highlights.length > 0 && (
        <section className="relative overflow-hidden">
          <motion.img
            src={band}
            alt=""
            aria-hidden="true"
            initial={{ scale: reduced ? 1 : 1.08 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={reduced ? { duration: 0 } : { duration: 1.1, ease: EASE }}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[#2b2114]/72" />
          <div className="relative mx-auto max-w-[1180px] px-5 py-12 md:px-10 md:py-16">
            <Reveal y={16}>
              <h2 className="font-display text-[clamp(1.4rem,5vw,2rem)] font-extrabold leading-tight text-white">
                What is in the vial
              </h2>
              <p className="mt-2 max-w-[48ch] text-[0.92rem] leading-relaxed text-white/70">
                One weekly injection, compounded by a licensed pharmacy and dispensed only on a
                prescription.
              </p>
            </Reveal>
            <motion.ul
              initial="hidden"
              whileInView="shown"
              viewport={{ once: true, margin: "-60px" }}
              variants={{ shown: { transition: { staggerChildren: reduced ? 0 : 0.09 } } }}
              className="mt-7 grid gap-3 sm:grid-cols-3"
            >
              {highlights.map((text) => (
                <motion.li
                  key={text}
                  variants={{
                    hidden: { opacity: 0, y: reduced ? 0 : 16 },
                    shown: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: reduced ? 0 : 0.55, ease: EASE }}
                  className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#c9a04f]">
                    <Check size={17} strokeWidth={2.6} className="text-white" />
                  </span>
                  <p className="mt-3 text-[0.95rem] font-semibold leading-snug text-white">{text}</p>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </section>
      )}

      {/* ===== Step rail =====
          A rail with the vial beside it, rather than the two text cards this
          replaced. The line is drawn behind the markers and animates its own
          height, so the sequence reads as a sequence on a phone too. */}
      <section className="mx-auto max-w-[1180px] px-5 py-12 md:px-10 md:py-16">
        <Reveal y={16}>
          <h2 className="font-display text-[clamp(1.4rem,5vw,2rem)] font-extrabold leading-tight">
            How it works
          </h2>
        </Reveal>
        <div className="mt-7 grid gap-10 md:grid-cols-[1.15fr_0.85fr] md:items-center md:gap-14">
          <ol className="relative">
            <motion.span
              aria-hidden="true"
              initial={{ scaleY: reduced ? 1 : 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={reduced ? { duration: 0 } : { duration: 0.9, ease: EASE }}
              className="absolute left-5 top-5 bottom-5 w-px origin-top bg-[#e0cfa8]"
            />
            {STEPS.map((step, i) => (
              <motion.li
                key={step.title}
                initial={{ opacity: 0, x: reduced ? 0 : -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-70px" }}
                transition={{
                  duration: reduced ? 0 : 0.5,
                  ease: EASE,
                  delay: reduced ? 0 : 0.12 + i * 0.12,
                }}
                className="relative flex gap-4 pb-7 last:pb-0"
              >
                <span className="relative z-10 grid h-10 w-10 flex-none place-items-center rounded-full bg-linear-to-b from-[#c9a04f] to-[#a87b2c] font-display text-[0.95rem] font-extrabold text-white shadow-md shadow-[#a87b2c]/25">
                  {i + 1}
                </span>
                <div className="min-w-0 pt-1">
                  <p className="text-[1rem] font-semibold leading-snug">{step.title}</p>
                  <p className="mt-1 text-[0.9rem] leading-relaxed text-muted">{step.text}</p>
                </div>
              </motion.li>
            ))}
          </ol>

          {/* The cut-out again, on its own pedestal. Hidden below md: on a phone
              the rail is the content and a second picture of the same vial is
              just more scrolling. */}
          <Reveal
            className="hidden md:block"
            delay={reduced ? 0 : 0.1}
            y={16}
          >
            <div
              className="relative grid min-h-80 place-items-center overflow-hidden rounded-[calc(26px*var(--nv-r-scale,1))] p-10"
              style={{ background: "linear-gradient(145deg, #e6d9c3 0%, #d8c6a8 100%)" }}
            >
              <div className="pointer-events-none absolute bottom-[18%] left-1/2 h-6 w-2/5 -translate-x-1/2 rounded-[50%] bg-ink/15 blur-xl" />
              <img
                src={product.img}
                alt=""
                aria-hidden="true"
                className="relative max-h-72 w-auto max-w-full object-contain mix-blend-multiply drop-shadow-2xl"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* The diagram, the reassurance block, the questions and the cross-sell,
          all the originals. These are the visual sections of the classic page
          and there was no reason to write thinner versions of them here. */}
      <ProductMechanism product={product} />
      <ProductWhy />

      {/* ===== Details ===== */}
      {(product.specs || []).length > 0 && (
        <section className="mx-auto max-w-[1180px] px-5 py-12 md:px-10">
          <Reveal y={16}>
            <h2 className="font-display text-[clamp(1.4rem,5vw,2rem)] font-extrabold leading-tight">
              Details
            </h2>
            <div className="mt-5 rounded-2xl border border-line bg-surface px-5">
              {product.specs.map((spec) => (
                <SpecRow
                  key={spec.label}
                  label={spec.label}
                  value={spec.value}
                  open={openSpec === spec.label}
                  onToggle={() => setOpenSpec(openSpec === spec.label ? null : spec.label)}
                  reduced={reduced}
                />
              ))}
            </div>
            {product.shipping && (
              <p className="mt-4 flex items-start gap-2.5 text-[0.88rem] leading-relaxed text-muted">
                <Truck size={16} className="mt-0.5 flex-none text-[#977e43]" />
                {product.shipping}
              </p>
            )}
            {product.fdaDisclaimer && (
              <p className="mt-3 max-w-[86ch] text-[0.78rem] leading-relaxed text-muted">
                {product.fdaDisclaimer}
              </p>
            )}
          </Reveal>
        </section>
      )}

      {/* ProductFaq is the one of these that brings no container of its own, so
          it has to be wrapped exactly as the classic page wraps it. Rendered
          bare it ran off the left edge of the viewport. Mechanism, Why and
          Journey each hold their own width, hence no wrapper on those. */}
      {/* 1180px, not the 1440px the classic page gives it: every other section
          on this page is 1180, and at 1440 the FAQ sat wider than the hero
          above it with its heading column stretched into dead space. */}
      <section className="mx-auto max-w-[1180px] px-5 py-[clamp(2.5rem,5vw,4.5rem)] md:px-10">
        <Reveal>
          <ProductFaq product={product} otc={false} />
        </Reveal>
      </section>

      <ProductJourney product={product} />

      {disclaimer}

      {/* The sticky bar, phones only. */}
      <AnimatePresence>
        {!heroOnScreen && (
          <motion.div
            initial={{ y: reduced ? 0 : 90, opacity: reduced ? 1 : 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: reduced ? 0 : 90, opacity: reduced ? 1 : 0 }}
            transition={reduced ? { duration: 0 } : { duration: 0.3, ease: EASE }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-4 pt-3 backdrop-blur-sm md:hidden"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.8rem] text-muted">
                  {product.heroTitle || product.name}
                </p>
                <p className="font-display text-[1.05rem] font-extrabold leading-tight">
                  {product.price}
                  <span className="text-[0.8rem] font-semibold">/mo</span>
                </p>
              </div>
              <motion.button
                type="button"
                onClick={onStart}
                whileTap={reduced ? undefined : { scale: 0.97 }}
                className="flex-none rounded-xl bg-[#977e43] px-5 py-3 text-[0.92rem] font-semibold text-white"
              >
                Start your visit
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clears the sticky bar, so the disclaimer is not what sits behind it. */}
      <div className="h-20 md:hidden" />

      {children}
      <Footer />
    </main>
  );
}
