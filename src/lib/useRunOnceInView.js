import { useEffect, useRef, useState } from "react";

/**
 * Fires once, the first time the element enters the viewport, and then
 * disconnects. Returns [ref, running] — put the ref on the element and gate an
 * `.is-in` class on `running`, which is what the `.nv-*` animation classes in
 * index.css key off.
 *
 * Runs immediately where IntersectionObserver is unavailable, so a non-browser
 * render never leaves the animation stuck in its start state.
 *
 * Everything this gates starts at opacity 0, so a missed notification is not a
 * missed animation: it is a section that stays blank until the page is
 * reloaded, which is what was happening on the Tirzepatide mechanism list
 * (2026-09-19). Hence the three routes in below — the observer, a check on
 * mount, and a scroll fallback. Whichever arrives first wins and the other two
 * are torn down.
 */
export default function useRunOnceInView(margin = "-60px") {
  const ref = useRef(null);
  const [ran, setRan] = useState(false);

  useEffect(() => {
    if (ran) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setRan(true);
      return undefined;
    }

    const onScreen = () => {
      const r = el.getBoundingClientRect();
      const h = window.innerHeight || document.documentElement.clientHeight;
      return r.top < h && r.bottom > 0;
    };

    /* Already on screen at mount: a deep link, a restored scroll position, or
       an image above finishing and pushing this into view. */
    if (onScreen()) {
      setRan(true);
      return undefined;
    }

    let io = null;
    let onScroll = null;

    const stop = () => {
      if (io) io.disconnect();
      if (onScroll) window.removeEventListener("scroll", onScroll);
    };

    io = new IntersectionObserver(
      (entries) => {
        /* some(), not entries[0]: one callback can carry several records for the
           same target and the first is not necessarily the intersecting one.
           Reading only the first is what dropped the notification. */
        if (entries.some((e) => e.isIntersecting)) {
          setRan(true);
          stop();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);

    /* Last resort, and cheap: it is removed the moment anything reveals. */
    onScroll = () => {
      if (onScreen()) {
        setRan(true);
        stop();
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return stop;
  }, [ran, margin]);

  return [ref, ran];
}
