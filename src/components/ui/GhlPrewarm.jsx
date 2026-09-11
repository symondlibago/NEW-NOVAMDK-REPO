import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import useKioskMode from "../../lib/useKioskMode";
export default function GhlPrewarm({ src }) {
  const isKiosk = useKioskMode();
  const { pathname } = useLocation();
  const [warm, setWarm] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || pathname === "/contact") return;

    const go = () => {
      if (fired.current) return;
      fired.current = true;
      setWarm(true);
    };

    if (isKiosk) {
      const idle = window.requestIdleCallback;
      const id = idle ? idle(go, { timeout: 4000 }) : setTimeout(go, 2500);
      return () => (idle ? window.cancelIdleCallback(id) : clearTimeout(id));
    }

    // pointerover (not pointerenter) so it bubbles up from the anchor's children.
    const onIntent = (e) => {
      if (e.target?.closest?.('a[href^="/contact"]')) go();
    };
    const opts = { capture: true, passive: true };
    document.addEventListener("pointerover", onIntent, opts);
    document.addEventListener("touchstart", onIntent, opts);
    document.addEventListener("focusin", onIntent, opts);
    return () => {
      document.removeEventListener("pointerover", onIntent, opts);
      document.removeEventListener("touchstart", onIntent, opts);
      document.removeEventListener("focusin", onIntent, opts);
    };
  }, [isKiosk, pathname]);

  if (!warm || pathname === "/contact") return null;

  /* The frame can't be trusted to keep itself hidden. LeadConnector's
     form_embed.js — which /contact appends to the document and never removes —
     walks document.querySelectorAll("iframe"), adopts every GHL widget src it
     finds, and rewrites that element's inline position, left, height, opacity,
     visibility and display. Those are exactly the properties this frame used to
     hide itself with, so once /contact had been visited the prewarm came back as
     a ~1600px visible block at the top of #root and pushed the whole page down by
     that much. It read as a reload bug because only /contact loads the script, so
     landing anywhere else fresh left nothing to adopt it.

     Hiding therefore lives on a wrapper the script has no reason to look at: out
     of flow, zero-sized and clipping, so whatever height it writes onto the frame
     stays inside. Zero-sized rather than display:none, and at 0,0 rather than off
     to the left, because the frame still has to load — being hidden is the point,
     being skipped or deprioritised is not. */
  return (
    <div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 h-0 w-0 overflow-hidden">
      <iframe src={src} title="" tabIndex={-1} className="h-px w-px border-0" />
    </div>
  );
}
