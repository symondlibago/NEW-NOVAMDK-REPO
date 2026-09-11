import { useEffect, useRef, useState } from "react";

/**
 * Fires once, the first time the element enters the viewport, and then
 * disconnects. Returns [ref, running] — put the ref on the element and gate an
 * `.is-in` class on `running`, which is what the `.nv-*` animation classes in
 * index.css key off.
 *
 * Runs immediately where IntersectionObserver is unavailable, so a non-browser
 * render never leaves the animation stuck in its start state.
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
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRan(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ran, margin]);

  return [ref, ran];
}
