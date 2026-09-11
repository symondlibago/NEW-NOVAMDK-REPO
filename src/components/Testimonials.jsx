import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";

const liquidEase = [0.16, 1, 0.3, 1];

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // Desktop Drag States
  const [width, setWidth] = useState(0);
  const [maxIndex, setMaxIndex] = useState(0);
  const [cardWidthWithGap, setCardWidthWithGap] = useState(364);

  const mobileCarouselRef = useRef(null);
  const desktopCarouselRef = useRef(null);

  const reviews = [
    { name: "Theresa M.", location: "Columbus, OH", rating: 5, text: "I started NAD+ mostly for the afternoon crashes. A few weeks in, I stopped reaching for a third coffee. Small thing, but I noticed it." },
    { name: "Anna K.", location: "Denver, CO", rating: 5, text: "I figured there'd be the usual runaround. It was a short intake form and one video call — now my refills just show up without me thinking about it." },
    { name: "Marcus T.", location: "Austin, TX", rating: 4, text: "Down about 19 lbs over four months. Not overnight, and I still have to do the work, but the monthly check-ins kept me honest." },
    { name: "Joshua R.", location: "Sacramento, CA", rating: 5, text: "Been a member a little over a year. I had a question about my dose and an actual clinician wrote back the same day. That's mostly why I've stayed." },
    { name: "Sarah L.", location: "Raleigh, NC", rating: 5, text: "The app isn't flashy, but it does what I need. Messaging the care team beats taking a half-day off for a waiting room." }
  ];

  // Track Window Resize to switch between Mobile (Native) and Desktop (Framer Drag)
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

        const cardElement = desktopCarouselRef.current.querySelector('.review-card');
        const gap = 24;
        const actualCardWidth = cardElement ? cardElement.offsetWidth + gap : 364;

        setCardWidthWithGap(actualCardWidth);
        const newMaxIndex = Math.ceil(maxScroll / actualCardWidth);
        setMaxIndex(newMaxIndex);
        setActiveIndex(prev => Math.min(prev, newMaxIndex));
      }
    };

    setTimeout(updateCarouselBounds, 50);
    window.addEventListener("resize", updateCarouselBounds);
    return () => window.removeEventListener("resize", updateCarouselBounds);
  }, [reviews.length, isMobile]);

  // --- MOBILE: Track Native Scrolling ---
  const handleMobileScroll = () => {
    if (!mobileCarouselRef.current || !isMobile) return;

    const scrollLeft = mobileCarouselRef.current.scrollLeft;
    const cardElement = mobileCarouselRef.current.querySelector('.review-card');

    if (cardElement) {
      const gap = 16;
      const cardWidth = cardElement.offsetWidth + gap;
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveIndex(newIndex);
    }
  };

  // --- CONTROLS ---
  const scrollToCard = (index) => {
    setActiveIndex(index);
    if (isMobile && mobileCarouselRef.current) {
      const container = mobileCarouselRef.current;
      const cards = container.querySelectorAll('.review-card');

      if (cards[index]) {
        const card = cards[index];
        const targetScrollLeft = card.offsetLeft - (container.offsetWidth / 2) + (card.offsetWidth / 2);
        container.scrollTo({
            left: targetScrollLeft,
            behavior: 'smooth'
        });
      }
    }
  };

  const handleNext = () => {
    if (!isMobile && activeIndex < maxIndex) {
      setActiveIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isMobile && activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
    }
  };

  // Reusable card template
  const renderCards = () => reviews.map((review, i) => (
      <div
        key={i}
        className={`review-card group shrink-0 flex flex-col h-full min-h-90 rounded-[calc(24px*var(--nv-r-scale,1))] border border-line bg-surface p-8 md:p-10 nv-shadow transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:nv-shadow-lg ${
          isMobile ? 'snap-center w-[82vw] max-w-[300px] sm:max-w-[320px]' : 'w-[340px]'
        }`}
      >
          {/* Rating stars — reflects each member's actual score */}
          <div className="mb-6 flex justify-center gap-1">
            {[1,2,3,4,5].map(star => (
               <svg key={star} width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className={star <= review.rating ? "text-primary" : "text-line-strong"}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            ))}
          </div>

          {/* Quote text */}
          <p className="mb-8 grow text-center text-[1rem] leading-relaxed text-ink/80 md:text-[1.05rem]">
              "{review.text}"
          </p>

          <div className="mt-auto text-center">
              <p className="text-[0.95rem] font-semibold text-ink">{review.name}</p>
              <p className="mt-0.5 text-[0.82rem] text-muted">{review.location}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3.5 py-1 font-mono text-[0.64rem] uppercase tracking-[0.12em] text-muted">
                  <ShieldCheck size={13} className="text-primary" /> Verified member
              </div>
          </div>
      </div>
  ));

  const totalDots = isMobile ? reviews.length : maxIndex + 1;

  return (
    <section className="w-full overflow-hidden bg-bg py-[clamp(2rem,4vw,3.5rem)]">
      <div className="mx-auto max-w-[1240px] px-0 text-center md:px-16">

        {/* --- ANIMATED HEADER --- */}
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 1.5, ease: liquidEase }}
            className="flex flex-col items-center px-6"
        >
            <div className="mb-3 flex items-center gap-3">
                <span className="h-px w-8 bg-accent/60" />
                <span className="nv-eyebrow">Testimonials</span>
                <span className="h-px w-8 bg-accent/60" />
            </div>

            <h2 className="mb-4 text-[clamp(2rem,3.6vw,3.25rem)] font-extrabold leading-tight tracking-tight text-ink">
                In our members' <span className="nv-em text-primary">own words</span>
            </h2>

            <div className="mb-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[0.92rem] font-medium text-muted">
                <span className="font-semibold text-ink">4.8 average</span>
                <div className="flex gap-0.5 text-primary">
                {[1,2,3,4,5].map(star => (
                    <svg key={star} width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
                </div>
                <span>from 4,000+ verified reviews</span>
            </div>
        </motion.div>

        {/* --- ANIMATED HYBRID CAROUSEL --- */}
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 1.5, delay: 0.1, ease: liquidEase }}
            className="relative mx-auto max-w-6xl"
        >
          {isMobile ? (
            // MOBILE: Native CSS Scroll Snap
            <div
              ref={mobileCarouselRef}
              onScroll={handleMobileScroll}
              className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-6 py-4 pb-6 no-scrollbar"
            >
              {renderCards()}
              <div className="w-[4vw] shrink-0"></div>
            </div>
          ) : (
            // DESKTOP: Framer Motion Spring Drag
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

          {/* Desktop Navigation Arrows */}
          <AnimatePresence>
            {!isMobile && activeIndex > 0 && (
              <motion.button
                aria-label="Previous testimonial"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                onClick={handlePrev}
                className="absolute -left-6 top-1/2 z-10 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-ink nv-shadow transition-all hover:border-primary hover:text-primary hover:nv-shadow-lg md:flex cursor-pointer"
              >
                <ChevronLeft size={24} strokeWidth={1.5} />
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!isMobile && activeIndex < maxIndex && (
              <motion.button
                aria-label="Next testimonial"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                onClick={handleNext}
                className="absolute -right-6 top-1/2 z-10 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-ink nv-shadow transition-all hover:border-primary hover:text-primary hover:nv-shadow-lg md:flex cursor-pointer"
              >
                <ChevronRight size={24} strokeWidth={1.5} />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Dynamic Pagination Dots */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 1.5, delay: 0.4, ease: liquidEase }}
            className="mt-2 flex items-center justify-center gap-2 md:mt-4"
        >
          {Array.from({ length: totalDots }).map((_, idx) => (
            <div
              key={idx}
              onClick={() => scrollToCard(idx)}
              className={`h-2 cursor-pointer rounded-full transition-all duration-300 ${activeIndex === idx ? 'w-8 bg-primary' : 'w-2 bg-line-strong hover:bg-muted/50'}`}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
