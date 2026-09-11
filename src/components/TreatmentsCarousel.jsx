import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const liquidEase = [0.16, 1, 0.3, 1];

// Category cards — full-bleed photo + brand badge; each links into that goal's catalog.
const CATEGORIES = [
  { name: "Weight & Metabolism", img: "/site/weight-metabolism.avif", goal: "weight-loss" },
  { name: "Skin Health", img: "/site/dermatology.avif", goal: "skin-health" },
  { name: "Longevity", img: "/site/mens-health.avif", goal: "longevity" },
  { name: "Sexual Health", img: "/site/sexual-health.avif", goal: "sexual-health" },
  { name: "Recovery & Wellness", img: "/site/pain-recovery.avif", goal: "recovery-wellness" },
];

export default function Treatments() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // Desktop Drag States
  const [width, setWidth] = useState(0);
  const [maxIndex, setMaxIndex] = useState(0);
  const [cardWidthWithGap, setCardWidthWithGap] = useState(364);

  const mobileCarouselRef = useRef(null);
  const desktopCarouselRef = useRef(null);

  const products = CATEGORIES;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- DESKTOP: Setup Framer Motion Drag Constraints ---
  useEffect(() => {
    if (isMobile) return;

    const updateCarouselBounds = () => {
      if (desktopCarouselRef.current) {
        const scrollWidth = desktopCarouselRef.current.scrollWidth;
        const offsetWidth = desktopCarouselRef.current.offsetWidth;
        const maxScroll = Math.max(0, scrollWidth - offsetWidth);
        setWidth(maxScroll);

        const cardElement = desktopCarouselRef.current.querySelector('.treatment-card');
        const gap = 24;
        const actualCardWidth = cardElement ? cardElement.offsetWidth + gap : 364;

        setCardWidthWithGap(actualCardWidth);
        const newMaxIndex = Math.ceil(maxScroll / actualCardWidth);
        setMaxIndex(newMaxIndex);
        setActiveIndex(prev => Math.min(prev, newMaxIndex));
      }
    };

    updateCarouselBounds();
    window.addEventListener("resize", updateCarouselBounds);
    setTimeout(updateCarouselBounds, 100);
    return () => window.removeEventListener("resize", updateCarouselBounds);
  }, [products.length, isMobile]);

  // --- MOBILE: Track Native Scrolling ---
  const handleMobileScroll = () => {
    if (!mobileCarouselRef.current || !isMobile) return;

    const scrollLeft = mobileCarouselRef.current.scrollLeft;
    const cardElement = mobileCarouselRef.current.querySelector('.treatment-card');

    if (cardElement) {
      const gap = 16;
      const cardWidth = cardElement.offsetWidth + gap;
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveIndex(newIndex);
    }
  };

  useEffect(() => {
    if (isPaused || products.length === 0) return;

    const interval = setInterval(() => {
      if (isMobile) {
        if (!mobileCarouselRef.current) return;

        setActiveIndex((prev) => {
          const nextIndex = prev >= products.length - 1 ? 0 : prev + 1;
          const container = mobileCarouselRef.current;
          const cards = container.querySelectorAll('.treatment-card');
          if (cards[nextIndex]) {
            const card = cards[nextIndex];
            const targetScrollLeft = card.offsetLeft - (container.offsetWidth / 2) + (card.offsetWidth / 2);
            container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
          }
          return nextIndex;
        });

      } else {
        setActiveIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused, products.length, isMobile, maxIndex]);

  // --- CONTROLS ---
  const scrollToCard = (index) => {
    setActiveIndex(index);
    if (isMobile && mobileCarouselRef.current) {
      const container = mobileCarouselRef.current;
      const cards = container.querySelectorAll('.treatment-card');
      if (cards[index]) {
        const card = cards[index];
        const targetScrollLeft = card.offsetLeft - (container.offsetWidth / 2) + (card.offsetWidth / 2);
        container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
      }
    }
  };

  const handleNext = () => {
    if (!isMobile) setActiveIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
  };

  const handlePrev = () => {
    if (!isMobile) setActiveIndex(prev => (prev <= 0 ? maxIndex : prev - 1));
  };

  if (products.length === 0) return null;

  const renderCards = () => products.map((c, i) => (
    <Link
      key={i}
      to={`/treatments/${c.goal}`}
      className={`treatment-card group relative block shrink-0 overflow-hidden rounded-[calc(28px*var(--nv-r-scale,1))] nv-shadow transition-all duration-500 hover:-translate-y-1 hover:nv-shadow-lg ${
        isMobile ? 'h-[150px] w-[80vw] max-w-[330px] snap-center' : 'h-[164px] w-[340px]'
      }`}
    >
      <img
        src={c.img}
        alt={c.name}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      {/* legibility wash — darker on the left where the label sits */}
      <span
        className="absolute inset-0"
        style={{ background: "linear-gradient(90deg, color-mix(in oklab, var(--nv-ink-panel) 64%, transparent) 0%, color-mix(in oklab, var(--nv-ink-panel) 26%, transparent) 52%, transparent 100%)" }}
      />
      <div className="relative flex h-full items-center justify-between gap-3 p-5 md:p-6">
        <h3 className="max-w-[58%] font-display text-[1.35rem] font-bold leading-[1.1] text-white drop-shadow-[0_2px_14px_rgba(15,22,34,0.65)] md:text-[1.5rem]">
          {c.name}
        </h3>
        <img
          src="/site/novamdkpill.avif"
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="w-[64px] shrink-0 object-contain drop-shadow-[0_6px_18px_rgba(15,22,34,0.35)] transition-transform duration-500 group-hover:scale-110 md:w-[72px]"
        />
      </div>
    </Link>
  ));

  const totalDots = isMobile ? products.length : maxIndex + 1;

  return (
    <section id="treatments-section" className="relative w-full overflow-hidden bg-surface-2 py-[clamp(2rem,4vw,3.5rem)]">
      <div className="mx-auto max-w-[1400px] px-0 md:px-16">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 1.2, ease: liquidEase }}
          className="mx-auto mb-[clamp(1.5rem,3vw,2.5rem)] max-w-3xl px-6 text-center"
        >
          <div className="mb-3 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-accent/60" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-primary lg:text-[11px]">Treatments &amp; Solutions</span>
            <span className="h-px w-8 bg-accent/60" />
          </div>
          <h2 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-ink md:text-[52px]">
            Personalized care for <br /> <span className="nv-em text-primary">your health goals</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 1.2, delay: 0.1, ease: liquidEase }}
          className="relative mx-auto w-full"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {isMobile ? (
            <div
              ref={mobileCarouselRef}
              onScroll={handleMobileScroll}
              className="no-scrollbar flex w-full snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-6 py-4 pb-6"
            >
              {renderCards()}
              <div className="w-[4vw] shrink-0" />
            </div>
          ) : (
            <div className="w-full overflow-hidden py-4" ref={desktopCarouselRef}>
              <motion.div
                className="flex w-max cursor-grab gap-6 px-2 pb-6 pt-2 active:cursor-grabbing"
                drag="x"
                dragConstraints={{ right: 0, left: -width }}
                initial={{ x: 0 }}
                animate={{ x: width > 0 ? -Math.min(activeIndex * cardWidthWithGap, width) : 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 30 }}
              >
                {renderCards()}
              </motion.div>
            </div>
          )}

          <AnimatePresence>
            {!isMobile && activeIndex > 0 && (
              <motion.button
                aria-label="Previous treatment"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                onClick={handlePrev}
                className="absolute -left-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-ink/55 text-white transition-all hover:bg-ink/75 nv-shadow md:flex"
              >
                <ChevronLeft size={22} strokeWidth={2.2} />
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!isMobile && activeIndex < maxIndex && (
              <motion.button
                aria-label="Next treatment"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                onClick={handleNext}
                className="absolute -right-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-ink/55 text-white transition-all hover:bg-ink/75 nv-shadow md:flex"
              >
                <ChevronRight size={22} strokeWidth={2.2} />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 1, delay: 0.5, ease: liquidEase }}
          className="mt-2 flex items-center justify-center gap-2 md:mt-4"
        >
          {Array.from({ length: totalDots }).map((_, idx) => (
            <div
              key={idx}
              onClick={() => scrollToCard(idx)}
              className={`h-2 cursor-pointer rounded-full transition-all duration-300 ${activeIndex === idx ? 'w-8 bg-primary' : 'w-2 bg-line-strong hover:bg-muted/40'}`}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
