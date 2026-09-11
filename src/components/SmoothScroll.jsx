import { useEffect } from "react";
import Lenis from "lenis";
import { setLenis } from "../lib/smoothScroll";

/**
 * Mounts Lenis once for buttery, momentum-based wheel scrolling site-wide.
 * The real document scrolls (no transformed wrapper), so position:sticky,
 * IntersectionObserver reveals and framer-motion useScroll all keep working.
 */
export default function SmoothScroll() {
  useEffect(() => {
    // Respect reduced-motion: skip smoothing entirely.
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo-out
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
    });
    setLenis(lenis);

    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return null;
}
