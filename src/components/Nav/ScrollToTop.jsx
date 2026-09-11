import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getLenis } from "../../lib/smoothScroll";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const prevPathname = useRef(pathname);

  /* The browser restores the previous scroll offset on history navigation, and
     with lazy routes it does so AFTER the new chunk has rendered — which is
     after the reset below has already run. Leaving a route as tall as /contact
     therefore lands you hundreds of pixels down the next page, staring at
     whatever happens to be there. Handing scroll position to the app is the
     documented fix for a client-routed site. */
  useEffect(() => {
    if (typeof window === "undefined" || !("scrollRestoration" in window.history)) return undefined;
    const prev = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = prev;
    };
  }, []);

  useEffect(() => {
    const lenis = getLenis();

    // Anchor navigation (e.g. "/#how", "/#faq") — smooth-scroll to the target.
    if (hash) {
      const id = hash.slice(1);
      let tries = 0;
      const tryScroll = () => {
        const el = document.getElementById(id);
        if (el) {
          if (lenis) lenis.scrollTo(el, { offset: -84 });
          else el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (tries++ < 12) {
          // Section may be lazy-loaded; retry a few frames.
          setTimeout(tryScroll, 80);
        }
      };
      requestAnimationFrame(tryScroll);
      prevPathname.current = pathname;
      return;
    }

    // Normal route change — jump to top instantly.
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;

      /* Asserted twice on purpose. Routes are lazy behind `Suspense fallback
         null`, so at this point the outgoing page has gone and the incoming one
         has not arrived: the document is a few pixels tall and scrolling it to
         the top is trivially true. The offset that matters is the one in force
         once the chunk lands and the page is tall again, which is a frame or
         more later — so re-assert it after the browser has laid that out.

         Lenis also has to be told, not just the window: it keeps its own scroll
         value and would otherwise animate back to where it thought it was. */
      const top = () => {
        if (lenis) lenis.scrollTo(0, { immediate: true });
        else window.scrollTo(0, 0);
      };
      top();
      let second = 0;
      const first = requestAnimationFrame(() => {
        second = requestAnimationFrame(top);
      });
      return () => {
        cancelAnimationFrame(first);
        if (second) cancelAnimationFrame(second);
      };
    }
    return undefined;
  }, [pathname, hash]);

  return null;
}
