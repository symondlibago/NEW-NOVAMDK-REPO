import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight, ArrowRight, Menu, X, ClipboardList, LogIn, LifeBuoy, Phone, User } from "lucide-react";
import { getLenis } from "../../lib/smoothScroll";
import Marquee from "../ui/Marquee";
import useKioskMode from "../../lib/useKioskMode";
import { visibleProducts, inCategory } from "../data/products";
import { productPath } from "../../lib/slug";
import { stageOf, displayTitle, baseName } from "../../lib/catalog";

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

/* Shared by the desktop panel tile and the drawer row, so both size a
   product off the same measurement. */
function useTightArt(src) {
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

  return tight;
}

/* The drawer's row thumbnail. It used to draw every file at 110% to fill a
   36px tile, which suited the padded renders but blew the tight crops
   (nad-sublingual, glutathione, scream-cream) up past the tile edge, so those
   rows showed a cropped close-up of a label while their neighbours showed a
   whole bottle. The padded renders carry their product at about 82% of the
   file's height, so they go in unscaled with a hairline of margin; a tight
   crop fills its file edge to edge, so it gets 12% margin. Both land at about
   76% of the tile height. Scaling the padded ones up clipped their caps. */
function DrawerThumb({ src, alt }) {
  const tight = useTightArt(src);
  return (
    <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface-2">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`absolute inset-0 h-full w-full object-contain ${tight ? "p-[12%]" : "p-0.5"}`}
      />
    </span>
  );
}

function ProductThumb({ src, tag = "" }) {
  const tight = useTightArt(src);

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
      {/* Sits on the art rather than under the name, so the card is read in one
          look. Inside this span because it is already the relative box, and
          above the image in the stack since the image fills inset-0. */}
      {tag && (
        <span className="absolute left-2 top-2 rounded-full bg-surface/90 px-2 py-0.5 text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-primary-deep nv-shadow backdrop-blur-sm">
          {tag}
        </span>
      )}
    </span>
  );
}

/* ---------------------- desktop category mega-panel ----------------------
   One panel shared by all five categories rather than a dropdown each. The
   shell animates in once and then stays put while the pointer travels along
   the row, and only the contents change, so moving Weight Loss → Longevity
   reads as the panel changing its mind rather than closing and reopening.

   The products glide in from the side the pointer is travelling towards and
   come into focus as they land, one after another (client, 2026-10-13, after
   ReadyRx and the homepage's blur-in headings). `dir` is +1 when the pointer
   moved right along the row, -1 when it moved left. The outgoing set slips
   the other way and fades fast, so the new one is never kept waiting. */
const PANEL_OUT = { duration: 0.16, ease: [0.4, 0, 1, 1] };
const panelMotion = {
  enter: { opacity: 1 },
  leave: (d) => ({ opacity: 0, x: d * -16, filter: "blur(4px)", transition: PANEL_OUT }),
};

function TreatmentPanel({ cat, dir, onNavigate }) {
  const items = TREATMENTS[cat.goal] || [];
  const still = useReducedMotion();
  /* Everything in the panel lands on this curve: a long, soft settle. */
  const land = (delay, from = 40) => ({
    initial: still ? { opacity: 0 } : { opacity: 0, x: dir * from, filter: "blur(10px)" },
    animate: still ? { opacity: 1 } : { opacity: 1, x: 0, filter: "blur(0px)" },
    transition: { duration: 0.7, ease: EASE, delay },
  });
  /* Capped so a six-item category does not run visibly late. */
  const step = (i) => 0.06 + Math.min(i, 6) * 0.07;

  return (
    <motion.div
      key={cat.goal}
      custom={dir}
      variants={panelMotion}
      initial={false}
      animate="enter"
      exit="leave"
      className="mx-auto max-w-[1340px] px-5 py-7 md:px-10"
    >
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <motion.h2 {...land(0, 20)} className="font-display text-[1.05rem] font-bold text-ink">
          {cat.label}
        </motion.h2>
        <motion.span {...land(0.1, 20)}>
          <Link
            to={`/treatments/${cat.goal}`}
            onClick={onNavigate}
            className="group inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-primary transition-colors hover:text-primary-deep"
          >
            View all
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </motion.span>
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((p, i) => (
          <motion.li key={p.id} {...land(step(i))}>
            <Link
              to={productPath(p)}
              onClick={onNavigate}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:nv-shadow"
            >
              {/* Only the products whose formulation is intended for one sex
                  carry a tag. Absent on everything else, so it means something
                  where it does appear. */}
              <ProductThumb src={p.img} tag={p.audience} />
              <span className="flex grow items-center px-3 py-2.5 text-[0.86rem] font-medium leading-snug text-ink/85 transition-colors group-hover:text-ink">
                {displayTitle(p)}
              </span>
            </Link>
          </motion.li>
        ))}
      </ul>

      <motion.span {...land(step(items.length), 20)} className="mt-4 inline-block">
        <Link
          to={`/start/${cat.consult}`}
          onClick={onNavigate}
          className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-5 py-2.5 text-[0.85rem] font-semibold text-ink transition-colors hover:bg-primary hover:text-on-primary"
        >
          <ClipboardList size={15} /> Start a {cat.label} consultation
        </Link>
      </motion.span>
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
                  <DrawerThumb src={t.img} alt={t.name} />
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

/* ---------------------------- phone drawer ----------------------------
   The client's layout 1 (2026-10-12): the Patient Portal card on top, with no
   separate Log In since it is the same door, the five categories as rows, then
   Get a Recommendation and Contact Us. Fits a normal phone without scrolling;
   Contact used to sit below the fold. A category opens its own page in the
   drawer with its treatments as cards, after the client's Longevity and Weight
   Loss comps. */
/* The product page's own heading: the first ingredient of a blend, so the
   cards read Semaglutide and Tirzepatide as the comp draws them. */
const shortTitle = (p) => p.heroTitle || baseName(p).split("/")[0].trim();

function DrawerCard({ p, close }) {
  const tight = useTightArt(p.img);
  return (
    <Link
      to={productPath(p)}
      onClick={close}
      className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-2 transition-colors hover:border-primary/40"
    >
      <span className="relative block aspect-square w-full overflow-hidden rounded-xl bg-linear-to-b from-surface-2/40 to-surface-2">
        <img
          src={p.img}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-contain transition-transform duration-500 group-hover:scale-105 ${tight ? "p-[18%]" : "p-1"}`}
        />
      </span>
      <span className="mt-2.5 px-1.5 text-[0.95rem] font-semibold leading-snug text-ink">{shortTitle(p)}</span>
      <span className="mt-auto flex items-center gap-0.5 px-1.5 pb-1 pt-2 text-[0.82rem] font-semibold text-accent">
        View treatment <ChevronRight size={15} />
      </span>
    </Link>
  );
}

const DRAWER_ROW = "flex w-full items-center justify-between border-b border-line py-3.5 text-left text-[16px] font-medium text-ink";

function DrawerHome({ close, openCat }) {
  return (
    <div className="flex grow flex-col px-4 pb-6 pt-4">
      <Link
        to="/portal"
        onClick={close}
        className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface-2/70 p-3.5 transition-colors hover:border-primary/40"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface text-primary">
          <User size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-semibold text-ink">Patient Portal</span>
          <span className="block text-[13px] text-muted">Sign in to your account</span>
        </span>
        <ArrowRight size={18} className="shrink-0 text-ink" />
      </Link>

      <div className="mt-3">
        {CATEGORIES.map((cat) => (
          <button key={cat.goal} type="button" onClick={() => openCat(cat.goal)} className={DRAWER_ROW}>
            {cat.label}
            <ArrowRight size={18} className="text-ink" />
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-2.5">
        <Link
          to="/start"
          onClick={close}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-[15px] font-semibold text-on-primary nv-shadow transition-colors hover:bg-primary-deep"
        >
          <ClipboardList size={17} /> Get a Recommendation
        </Link>
        <Link
          to="/contact"
          onClick={close}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-primary/50 bg-surface py-3.5 text-[15px] font-semibold text-primary transition-colors hover:bg-primary/5"
        >
          <Phone size={16} /> Contact Us
        </Link>
      </div>
    </div>
  );
}

function DrawerCategory({ cat, close }) {
  const items = TREATMENTS[cat.goal] || [];
  return (
    <div className="flex grow flex-col px-4 pb-6 pt-4">
      <h2 className="font-display text-[1.45rem] font-bold leading-tight text-ink">{cat.label}</h2>
      <p className="mt-1 text-[14px] text-muted">Explore treatment options.</p>

      <ul className="mt-4 grid grid-cols-2 gap-2.5">
        {items.map((p) => (
          <li key={p.id}>
            <DrawerCard p={p} close={close} />
          </li>
        ))}
      </ul>

      <p className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Explore</p>
      <div className="mt-1">
        <Link to={`/treatments/${cat.goal}`} onClick={close} className={DRAWER_ROW}>
          All {cat.label.toLowerCase()} treatments <ChevronRight size={18} className="text-muted" />
        </Link>
        <Link to="/#how" onClick={close} className={DRAWER_ROW}>
          How it works <ChevronRight size={18} className="text-muted" />
        </Link>
        <Link to="/#faq" onClick={close} className={DRAWER_ROW}>
          FAQs <ChevronRight size={18} className="text-muted" />
        </Link>
      </div>

      <Link
        to={`/start/${cat.consult}`}
        onClick={close}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-primary bg-surface py-3.5 text-[15px] font-semibold text-ink transition-colors hover:bg-primary hover:text-on-primary"
      >
        Get Started <ArrowRight size={16} />
      </Link>
      <p className="mt-3 text-center text-[12px] leading-relaxed text-muted">
        Online consultation required. Prescription treatment is subject to provider evaluation.
      </p>
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
  // Which way the pointer last moved along the row, for the panel's slide.
  const [dir, setDir] = useState(1);
  // The category page showing in the phone drawer, null for its first page.
  const [drawerCat, setDrawerCat] = useState(null);
  const isKiosk = useKioskMode();
  const closeDrawer = () => setMobileOpen(false);
  /* Back to the first page on every open, not on close, so the drawer does
     not swap pages while it slides away. */
  const openDrawer = () => {
    setDrawerCat(null);
    setMobileOpen(true);
  };
  const closePanel = () => setOpenCat(null);
  /* Opening from closed counts as moving right, so the first set still comes
     in from the side. */
  const openedAt = useRef(0);
  const showCat = (goal) => {
    if (goal === openCat) return;
    const at = (g) => CATEGORIES.findIndex((c) => c.goal === g);
    setDir(openCat && at(goal) < at(openCat) ? -1 : 1);
    setOpenCat(goal);
    openedAt.current = Date.now();
  };
  /* A tap on a touch screen fires the hover and focus first, which open the
     panel, and then the click, which used to close it again straight away. So
     a click only closes a panel that has been open for a moment. */
  const toggleCat = (goal) => {
    if (openCat !== goal) return showCat(goal);
    if (Date.now() - openedAt.current > 400) closePanel();
  };

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
        className="sticky top-0 z-50 border-b border-line bg-bg/95 backdrop-blur-xl"
      >
        <nav className="mx-auto flex min-h-[68px] max-w-[1340px] items-center justify-between gap-4 px-5 md:px-10">
          {/* No mark on the kiosk (2026-09-25): its screen is portrait, and the
              logo was squeezing the five categories into a scrunch. The unit
              stands in a branded frame, so the mark is not doing any work
              there that the frame is not already doing. */}
          {!isKiosk && (
            <Link to="/" aria-label="Nova MDK home" onClick={closePanel}>
              <img src="/logo-2026.png" alt="Nova MDK" className="h-[46px] w-auto md:h-[52px]" />
            </Link>
          )}

          {/* The category row. Hidden below lg on a normal browser, where the
              drawer carries the same five; the kiosk keeps it at every width
              because its screen is wide enough and tapping beats a burger. */}
          {/* mx-auto on the kiosk (2026-09-25): with the mark gone there is
              nothing on the left for justify-between to push against, so the
              row sat hard against the edge. The auto margins centre it in what
              the burger leaves. */}
          <div className={`items-center gap-1 ${isKiosk ? "mx-auto flex" : "hidden lg:flex"}`}>
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
                  onMouseEnter={isKiosk ? undefined : () => showCat(cat.goal)}
                  onFocus={isKiosk ? undefined : () => showCat(cat.goal)}
                  onClick={() => toggleCat(cat.goal)}
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
                className="hidden h-10 items-center gap-2 whitespace-nowrap rounded-full border-2 border-primary bg-surface px-5 text-[14px] font-semibold text-primary transition-all hover:-translate-y-0.5 hover:bg-primary hover:text-on-primary nv-shadow lg:flex"
              >
                <LogIn size={15} /> Patient Portal
              </Link>
            )}

            {/* kiosk keeps the burger at any width — it holds the meds menu */}
            <button aria-label="Menu" aria-expanded={mobileOpen} onClick={openDrawer} className={`grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-ink ${isKiosk ? "" : "lg:hidden"}`}>
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
            jumping when a five-item category follows a three-item one. Solid
            rather than see-through: the header's own blur keeps the panel's
            from working, so the hero's headline showed through it, most of all
            while the products crossed over. */}
        <AnimatePresence>
          {openCat && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="absolute inset-x-0 top-full overflow-hidden border-b border-line bg-bg nv-shadow-lg"
            >
              <AnimatePresence mode="wait" custom={dir}>
                <TreatmentPanel
                  key={openCat}
                  cat={CATEGORIES.find((c) => c.goal === openCat)}
                  dir={dir}
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeDrawer} className="fixed inset-0 z-[100] bg-ink/30 backdrop-blur-sm lg:hidden" />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220, ease: EASE }}
              data-lenis-prevent
              className="fixed right-0 top-0 z-[101] flex h-full w-[86%] max-w-sm flex-col overflow-y-auto bg-surface lg:hidden nv-scroll"
            >
              <div className="flex items-center justify-between gap-3 border-b border-line p-4">
                {!isKiosk && drawerCat ? (
                  <button
                    type="button"
                    onClick={() => setDrawerCat(null)}
                    className="flex h-10 items-center gap-1 rounded-full border border-line bg-surface pl-2.5 pr-4 text-[14px] font-semibold text-ink"
                  >
                    <ChevronLeft size={18} /> Back
                  </button>
                ) : (
                  <img src="/logo-2026.png" alt="Nova MDK" className="h-9 w-auto" />
                )}
                <div className="flex items-center gap-2">
                  {!isKiosk && drawerCat && (
                    <Link to="/portal" onClick={closeDrawer} aria-label="Patient Portal" className="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-surface-2">
                      <User size={20} />
                    </Link>
                  )}
                  <button aria-label="Close" onClick={closeDrawer} className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-muted hover:text-ink">
                    <X size={20} />
                  </button>
                </div>
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
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={drawerCat || "home"}
                    initial={{ opacity: 0, x: drawerCat ? 32 : -32 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: EASE }}
                    className="flex grow flex-col"
                  >
                    {drawerCat ? (
                      <DrawerCategory cat={CATEGORIES.find((c) => c.goal === drawerCat)} close={closeDrawer} />
                    ) : (
                      <DrawerHome close={closeDrawer} openCat={setDrawerCat} />
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
