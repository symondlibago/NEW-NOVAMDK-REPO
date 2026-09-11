import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

const SCRIPT_SRC = "https://link.msgsndr.com/js/form_embed.js";

/* LeadConnector's embed script attaches a window "message" listener and resizes
   the iframe by element id as the survey advances between steps. Two SPA-specific
   rules follow from that:
     1. It has to be appended AFTER the iframe exists in the DOM, so it lives in an
        effect rather than index.html.
     2. It must only be appended once per session — the listener keys off the id at
        message time, so it keeps working across route changes and remounts. */
function loadEmbedScript() {
  if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
  const s = document.createElement("script");
  s.src = SCRIPT_SRC;
  s.async = true;
  document.body.appendChild(s);
}

/**
 * Embeds a GoHighLevel form or survey.
 * @param {string} id      The GHL widget id — must match the iframe id for the resize to land.
 * @param {string} src     Full widget URL from the GHL embed snippet.
 * @param {string} title   Accessible name for the frame.
 * @param {number} minH    Floor height, used until the script reports the real one
 *                         (and permanently if the script is blocked).
 */
export default function GhlEmbed({ id, src, title = "Form", minH = 560 }) {
  const frame = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Seed a height imperatively so React never fights the script over style.height.
    if (frame.current && !frame.current.style.height) frame.current.style.height = `${minH}px`;
    loadEmbedScript();
    // A cached frame can finish before React attaches onLoad, which would strand
    // the skeleton on screen forever.
    if (frame.current?.contentDocument?.readyState === "complete") setLoaded(true);
  }, [minH]);

  return (
    <div className="relative w-full" style={{ minHeight: minH }}>
      {!loaded && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-[calc(24px*var(--nv-r-scale,1))] border border-line bg-surface text-muted"
          role="status"
          aria-live="polite"
        >
          <Loader2 size={26} className="animate-spin text-primary" />
          <span className="text-[0.9rem] font-medium">Loading the form…</span>
        </div>
      )}
      <iframe
        ref={frame}
        id={id}
        src={src}
        title={title}
        scrolling="no"
        /* Deliberately eager: this frame is the entire reason the page exists, but
           it sits below the hero, so `lazy` left it un-requested until the visitor
           scrolled — a stall the kiosk felt as "the contact page is slow". */
        loading="eager"
        onLoad={() => setLoaded(true)}
        className="block w-full border-0"
        style={{ minHeight: minH }}
      />
    </div>
  );
}
