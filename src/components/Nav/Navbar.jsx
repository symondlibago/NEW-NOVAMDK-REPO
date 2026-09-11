import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { ChevronDown, ArrowRight, Menu, X, ClipboardList, LogIn, LifeBuoy } from "lucide-react";
import { getLenis } from "../../lib/smoothScroll";
import Marquee from "../ui/Marquee";
import useKioskMode from "../../lib/useKioskMode";
import { visibleProducts, inCategory } from "../data/products";
import { productPath } from "../../lib/slug";
import { stageOf, displayTitle } from "../../lib/catalog";

/* The five treatment categories, in the order the 2026-09-11 comp sets them.
   `consult` is the questionnaire slug, which is not always the category slug. */
const CATEGORIES = [
  { label: "Weight Loss", goal: "weight-loss", consult: "weight-loss" },
  { label: "Longevity", goal: "longevity", consult: "longevity" },
  { label: "Skin Health", goal: "skin-health", consult: "skin" },
  { label: "Sexual Health", goal: "sexual-health", consult: "intimacy" },
  { label: "Recovery & Wellness", goal: "recovery-wellness", consult: "recovery" },
];

const EASE = [0.16, 1, 0.3, 1];

/* Built once at module load, not per render: the catalogue is static.
   `inCategory` rather than a categorySlug match, so a cross-listed treatment
   (NAD+ and Glutathione sit in two categories) appears under both. Dose rungs
   collapse to their Starter so the panel lists treatments, not strengths. */
const TREATMENTS = Object.fromEntries(
  CATEGORIES.map((c) => {
    const seen = new Set();
    const items = visibleProducts
      .filter((p) => inCategory(p, c.goal))
      .filter((p) => !stageOf(p) || stageOf(p) === "Starter")
      .filter((p) => {
        const t = displayTitle(p);
        if (seen.has(t)) return false;
        seen.add(t);
        return true;
      });
    return [c.goal, items];
  }),
);

/* The peptide molecule menu listed the LUVIRA sub-lines (Semaglutide, BPC-157,
   MOTS-C, …). That whole line was dropped from the catalog on 2026-08-05, so the
   menu it fed is gone with it — "Supplements" stays a plain link. */

/* The catalogue art comes in two shapes and they cannot share one size.
   The weight-loss renders are 1000x1000 with the product sitting in generous
   whitespace, so the bottle itself is only ~58% of the file. nad-sublingual
   (776x1674), glutathione (253x542) and scream-cream (390x984) are tight crops
   whose product bleeds to all four edges. Draw both at the same box height and
   the crops look blown up next to the padded ones, which is exactly what they
   looked like.

   So the box supplies the margin the crop is missing: measure the file on load
   and, if it is markedly taller than wide (every padded render is square, every
   crop is over 2:1), draw it at 60% height so its bottle lands at the same
   visual size as a padded one. Measured rather than listed by filename, so new
   art is handled without touching this. */
/* Measured off-DOM with a throwaway Image rather than from the rendered one.
   The rendered thumb is lazy and lives inside a panel whose height animates up
   from zero, so its load event is unreliable: sometimes it had already fired
   before React attached the handler, sometimes the lazy loader had not started
   it at all, and either way every crop stayed at full height. A detached Image
   always resolves, and the browser serves it from the same cache. Cached per
   src at module scope so each file is measured once for the session. */
const TIGHT_ART = new Map();

function ProductThumb({ src }) {
  const [tight, setTight] = useState(() => TIGHT_ART.get(src) ?? false);

  useEffect(() => {
    if (TIGHT_ART.has(src)) {
      setTight(TIGHT_ART.get(src));
      return undefined;
    }
    let alive = true;
    const probe = new Image();
    probe.onload = () => {
      const t = probe.naturalHeight / probe.naturalWidth > 1.5;
      TIGHT_ART.set(src, t);
      if (alive) setTight(t);
    };
    probe.src = src;
    return () => {
      alive = false;
    };
  }, [src]);

  /* The image is absolutely positioned rather than laid out in the tile.
     As a centred grid item its height was auto, so `w-full` on a 390x984 file
     resolved to a 535px-tall element inside a 212px box and the tile simply
     clipped it, which is the crop that kept coming back. Pinned to inset-0 the
     box is definite, object-contain letterboxes any ratio, and padding is the
     one lever that sets how big the product sits. */
  return (
    <span className="relative block aspect-square w-full overflow-hidden bg-surface-2">
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className={`absolute inset-0 h-full w-full object-contain transition-transform duration-500 group-hover:scale-105 ${
          tight ? "p-[20%]" : "p-4"
        }`}
      />
    </span>
  );
}

/* ---------------------- desktop category mega-panel ----------------------
   One panel shared by all five categories rather than a dropdown each. The
   shell animates in once and then stays put while the pointer travels along
   the row, and only the contents cross-fade, so moving Weight Loss → Longevity
   reads as the panel changing its mind rather than closing and reopening. */
function TreatmentPanel({ cat, onNavigate }) {
  const items = TREATMENTS[cat.goal] || [];
  return (
    <motion.div
      key={cat.goal}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: EASE }}
      className="mx-auto max-w-[1340px] px-5 py-7 md:px-10"
    >
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-[1.05rem] font-bold text-ink">{cat.label}</h2>
        <Link
          to={`/treatments/${cat.goal}`}
          onClick={onNavigate}
          className="group inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-primary transition-colors hover:text-primary-deep"
        >
          View all
          <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((p, i) => (
          <motion.li
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            /* Capped so a six-item category does not run visibly late. */
            transition={{ duration: 0.34, ease: EASE, delay: Math.min(i, 6) * 0.045 }}
          >
            <Link
              to={productPath(p)}
              onClick={onNavigate}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:nv-shadow"
            >
              <ProductThumb src={p.img} />
              <span className="flex grow items-center px-3 py-2.5 text-[0.86rem] font-medium leading-snug text-ink/85 transition-colors group-hover:text-ink">
                {displayTitle(p)}
              </span>
            </Link>
          </motion.li>
        ))}
      </ul>

      <Link
        to={`/start/${cat.consult}`}
        onClick={onNavigate}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-surface-2 px-5 py-2.5 text-[0.85rem] font-semibold text-ink transition-colors hover:bg-primary hover:text-on-primary"
      >
        <ClipboardList size={15} /> Start a {cat.label} consultation
      </Link>
    </motion.div>
  );
}

/* ------------------- category accordion (mobile + kiosk) ------------------- */
function CategoryGroup({ cat, close, open, onToggle }) {
  const treatments = TREATMENTS[cat.goal] || [];
  return (
    <div className="border-b border-line py-4">
      <button aria-expanded={open} onClick={onToggle} className="flex w-full items-center justify-between text-[17px] font-medium text-ink">
        {cat.label}
        <ChevronDown size={18} className={`text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex flex-col gap-1 pt-3">
              {treatments.map((t) => (
                <Link key={t.id} to={productPath(t)} onClick={close} className="flex items-center gap-3 rounded-xl px-3 py-2 text-[15px] text-muted transition-colors hover:bg-surface-2 hover:text-ink">
                  <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-2">
                    <img src={t.img} alt={t.name} loading="lazy" className="h-full w-full scale-[1.1] object-contain" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{displayTitle(t)}</span>
                  <ArrowRight size={14} className="shrink-0 opacity-50" />
                </Link>
              ))}
              <Link to={`/start/${cat.consult}`} onClick={close} className="mt-2 flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-[14px] font-semibold text-on-primary transition-all hover:bg-primary-deep">
                <ClipboardList size={15} /> Start a Consultation
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------- navbar ------------------------------- */
export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  // Which category is expanded in the drawer — null for none. Single value, so
  // opening one closes whichever was open.
  const [openKioskGoal, setOpenKioskGoal] = useState(null);
  /* Which category's panel is showing on the desktop bar. Kiosk is a touch
     screen with no hover, so there it toggles on tap instead. */
  const [openCat, setOpenCat] = useState(null);
  const isKiosk = useKioskMode();
  const closePanel = () => setOpenCat(null);

  // Horizontal scroll meter pinned to the bottom of the header.
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  useEffect(() => {
    const lenis = getLenis();
    document.body.style.overflow = mobileOpen ? "hidden" : "unset";
    if (lenis) mobileOpen ? lenis.stop() : lenis.start();
    return () => { document.body.style.overflow = "unset"; if (lenis) lenis.start(); };
  }, [mobileOpen]);

  return (
    <>
      {/* promo bar — scrolling credential marquee */}
      <Marquee />

      {/* The panel hangs off the header, so the whole thing is one hover
          target: travelling from a category down into its own panel never
          crosses dead space and never closes it. */}
      <header
        onMouseLeave={isKiosk ? undefined : closePanel}
        className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-xl"
      >
        <nav className="mx-auto flex min-h-[68px] max-w-[1340px] items-center justify-between gap-4 px-5 md:px-10">
          <Link to="/" aria-label="Nova MDK home" onClick={closePanel}>
            <img src="/logo.png" alt="Nova MDK" className="h-[46px] w-auto md:h-[52px]" />
          </Link>

          {/* The category row. Hidden below lg on a normal browser, where the
              drawer carries the same five; the kiosk keeps it at every width
              because its screen is wide enough and tapping beats a burger. */}
          <div className={`items-center gap-1 ${isKiosk ? "flex" : "hidden lg:flex"}`}>
            {CATEGORIES.map((cat, i) => {
              const on = openCat === cat.goal;
              return (
                <React.Fragment key={cat.goal}>
                  {/* Hairline between each pair, as the comp draws them. Not a
                      border on the button: that would sit under the active
                      marker and move with the button's own padding. */}
                  {i > 0 && <span aria-hidden="true" className="h-5 w-px shrink-0 bg-ink/15" />}
                <button
                  aria-expanded={on}
                  onMouseEnter={isKiosk ? undefined : () => setOpenCat(cat.goal)}
                  onFocus={isKiosk ? undefined : () => setOpenCat(cat.goal)}
                  onClick={() => setOpenCat((g) => (g === cat.goal ? null : cat.goal))}
                  className={`relative whitespace-nowrap rounded-full px-3 py-2 text-[14px] font-medium transition-colors xl:px-3.5 xl:text-[15px] ${
                    on ? "text-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  {cat.label}
                  {/* One element that slides between buttons rather than five
                      that fade, so the marker tracks the pointer. */}
                  {on && (
                    <motion.span
                      layoutId="nv-nav-marker"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-primary"
                    />
                  )}
                </button>
                </React.Fragment>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5">
            {!isKiosk && (
              <Link
                to="/portal"
                onClick={closePanel}
                className="hidden h-10 items-center gap-2 rounded-full border-2 border-primary bg-surface px-5 text-[14px] font-semibold text-primary transition-all hover:-translate-y-0.5 hover:bg-primary hover:text-on-primary nv-shadow lg:flex"
              >
                <LogIn size={15} /> Patient Portal
              </Link>
            )}

            {/* kiosk keeps the burger at any width — it holds the meds menu */}
            <button aria-label="Menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)} className={`grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-ink ${isKiosk ? "" : "lg:hidden"}`}>
              <Menu size={20} />
            </button>
          </div>
        </nav>

        {/* scroll progress meter */}
        <motion.div
          aria-hidden="true"
          style={{ scaleX }}
          className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-linear-to-r from-accent to-primary"
        />

        {/* The panel. Height animates so the bar below it settles rather than
            jumping when a five-item category follows a three-item one. */}
        <AnimatePresence>
          {openCat && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="absolute inset-x-0 top-full overflow-hidden border-b border-line bg-bg/95 backdrop-blur-xl nv-shadow-lg"
            >
              <AnimatePresence mode="wait">
                <TreatmentPanel
                  key={openCat}
                  cat={CATEGORIES.find((c) => c.goal === openCat)}
                  onNavigate={closePanel}
                />
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Kiosk taps outside the panel to dismiss it — there is no pointer to
          leave the header with. */}
      {isKiosk && openCat && (
        <div className="fixed inset-0 z-40" aria-hidden="true" onClick={closePanel} />
      )}

      {/* mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="fixed inset-0 z-[100] bg-ink/30 backdrop-blur-sm lg:hidden" />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220, ease: EASE }}
              data-lenis-prevent
              className="fixed right-0 top-0 z-[101] flex h-full w-[86%] max-w-sm flex-col overflow-y-auto bg-surface lg:hidden nv-scroll"
            >
              <div className="flex items-center justify-between border-b border-line p-4">
                <img src="/logo.png" alt="Nova MDK" className="h-9 w-auto" />
                <button aria-label="Close" onClick={() => setMobileOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-muted hover:text-ink">
                  <X size={20} />
                </button>
              </div>
              {isKiosk ? (
                /* Kiosk burger — category sections, then Portal / Support as buttons
                   directly under the last one (not pinned to the drawer foot, so
                   they sit with the list rather than floating away from it). */
                <div className="flex grow flex-col p-4">
                  {CATEGORIES.map((cat) => (
                    <CategoryGroup
                      key={cat.goal}
                      cat={cat}
                      open={openKioskGoal === cat.goal}
                      onToggle={() => setOpenKioskGoal((g) => (g === cat.goal ? null : cat.goal))}
                      close={() => setMobileOpen(false)}
                    />
                  ))}
                  <div className="mt-5 grid grid-cols-2 gap-2.5 pb-2">
                    <Link
                      to="/portal"
                      onClick={() => setMobileOpen(false)}
                      /* same accent mix as the marquee / Quick view / Choose your plan */
                      className="flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[color-mix(in_oklab,var(--nv-accent)_72%,var(--nv-surface))] px-3 py-3.5 text-[14px] font-semibold text-ink nv-shadow transition-all hover:-translate-y-0.5 hover:bg-[color-mix(in_oklab,var(--nv-accent)_86%,var(--nv-surface))]"
                    >
                      <LogIn size={16} /> Patient Portal
                    </Link>
                    <Link
                      to="/contact"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-line-strong bg-surface px-3 py-3.5 text-[14px] font-semibold text-ink transition-all hover:-translate-y-0.5 hover:bg-surface-2"
                    >
                      <LifeBuoy size={16} /> Support
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex grow flex-col p-4">
                  {/* The same five categories the desktop bar carries, as
                      accordions with the same thumbnails. First one opens by
                      default so the drawer never reads as an empty list. */}
                  {CATEGORIES.map((cat, i) => (
                    <CategoryGroup
                      key={cat.goal}
                      cat={cat}
                      open={openKioskGoal === null ? i === 0 : openKioskGoal === cat.goal}
                      onToggle={() => setOpenKioskGoal((g) => (g === cat.goal ? "" : cat.goal))}
                      close={() => setMobileOpen(false)}
                    />
                  ))}
                  {/* Kiosk hidden at client request (2026-08-11) — route still live, just unlinked.
                  <Link to="/kiosk" onClick={() => setMobileOpen(false)} className="flex items-center justify-between border-b border-line py-5 text-[17px] font-medium text-ink">
                    Kiosk <ArrowRight size={16} className="text-muted" />
                  </Link>
                  */}
                  <Link to="/portal" onClick={() => setMobileOpen(false)} className="flex items-center justify-between border-b border-line py-5 text-[17px] font-medium text-ink">
                    Patient Portal <ArrowRight size={16} className="text-muted" />
                  </Link>

                  {/* Get a Recommendation — starts the free 2-minute questionnaire */}
                  <Link
                    to="/start"
                    onClick={() => setMobileOpen(false)}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-[15px] font-semibold text-on-primary nv-shadow transition-all hover:-translate-y-0.5 hover:bg-primary-deep"
                  >
                    <ClipboardList size={17} /> Get a Recommendation
                  </Link>

                  {/* bottom actions — Contact lives here as a button under Get started */}
                  <div className="mt-auto flex flex-col gap-2.5 pb-4 pt-8">
                    <Link to="/treatments" onClick={() => setMobileOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-full border border-line-strong bg-surface py-3.5 text-[15px] font-semibold text-ink transition-colors hover:bg-surface-2">
                      Get started <ArrowRight size={16} />
                    </Link>
                    <Link to="/contact" onClick={() => setMobileOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-full border border-line bg-surface py-3.5 text-[15px] font-semibold text-muted transition-colors hover:text-ink">
                      Contact
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
