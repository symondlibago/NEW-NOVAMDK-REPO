import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";

const PLACEHOLDER_FRAMES = ["/products/gallery/clinical.avif", "/products/gallery/telehealth.avif"];
const TARGET_FRAMES = 3;

function framesFor(product) {
  const frames = [];
  const seen = new Set();
  const add = (src, photo) => {
    // A product pointing two fields at the same file must not double up.
    if (!src || seen.has(src)) return;
    seen.add(src);
    frames.push({ src, photo });
  };

  add(product.imgDetail, true);
  for (const src of product.imgGallery || []) add(src, true);
  if (!frames.length) add(product.img, false);
  if (!product.imgGallery?.length) {
    for (const src of PLACEHOLDER_FRAMES) {
      if (frames.length >= TARGET_FRAMES) break;
      add(src, true);
    }
  }
  return frames;
}

/* A swipe strip rather than a big frame and thumbnails (client, 2026-10-12):
   one photo per slide, swiped on a phone, dragged or arrowed on a desktop. The
   strip is a native scroll-snap row, so touch and trackpad swipes need no code;
   the mouse drag is the only gesture handled here. */
export default function ProductGallery({ product, categoryLabel }) {
  const frames = framesFor(product);
  const [i, setI] = useState(0);
  const strip = useRef(null);
  const drag = useRef(null);
  useEffect(() => {
    setI(0);
    if (strip.current) strip.current.scrollLeft = 0;
  }, [product.id]);

  const go = (n) => {
    const el = strip.current;
    if (!el) return;
    const to = Math.max(0, Math.min(frames.length - 1, n));
    el.scrollTo({ left: to * el.clientWidth, behavior: "smooth" });
  };
  const onScroll = () => {
    const el = strip.current;
    if (el) setI(Math.round(el.scrollLeft / el.clientWidth));
  };

  /* Snap is switched off while the mouse holds the strip, or it would fight
     every pixel of the drag, and put back once the strip has settled. */
  const onPointerDown = (e) => {
    if (e.pointerType !== "mouse" || frames.length < 2) return;
    drag.current = { x: e.clientX, left: strip.current.scrollLeft, moved: false };
    strip.current.style.scrollSnapType = "none";
    strip.current.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4) d.moved = true;
    strip.current.scrollLeft = d.left - dx;
  };
  const onPointerUp = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    const el = strip.current;
    const w = el.clientWidth;
    const past = (el.scrollLeft - d.left) / w;
    const from = Math.round(d.left / w);
    const n = past > 0.15 ? from + 1 : past < -0.15 ? from - 1 : from;
    go(n);
    setTimeout(() => { if (strip.current) strip.current.style.scrollSnapType = ""; }, 450);
  };

  return (
    <div className="min-w-0">
      <div className="group/img relative overflow-hidden rounded-[calc(26px*var(--nv-r-scale,1))]">
        <div
          ref={strip}
          onScroll={onScroll}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={`no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain ${frames.length > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
          aria-roledescription="carousel"
          aria-label="Product images"
        >
          {frames.map((f, idx) => (
            <div
              key={f.src}
              className={`relative flex min-h-90 w-full shrink-0 snap-center items-center justify-center md:min-h-140 ${f.photo ? "" : "p-7 md:p-10"}`}
              style={f.photo ? undefined : { background: "linear-gradient(145deg, #e6d9c3 0%, #d8c6a8 100%)" }}
              aria-label={`Image ${idx + 1} of ${frames.length}`}
            >
              {/* pedestal shadow — only grounds a cut-out; a photo has its own */}
              {!f.photo && (
                <div className="pointer-events-none absolute bottom-[16%] left-1/2 h-6 w-2/5 -translate-x-1/2 rounded-[50%] bg-ink/15 blur-xl" />
              )}
              <img
                src={f.src}
                alt={idx === 0 ? product.name : ""}
                draggable={false}
                loading={idx === 0 ? undefined : "lazy"}
                className={
                  f.photo
                    ? "pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
                    : "pointer-events-none relative max-h-100 w-auto max-w-full select-none object-contain mix-blend-multiply drop-shadow-2xl md:max-h-115"
                }
              />
            </div>
          ))}
        </div>

        <span className="pointer-events-none absolute left-5 top-5 z-10 rounded-full bg-[#f7f2e8]/90 px-3.5 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-[#8a6f3c] backdrop-blur-sm">
          {categoryLabel}
        </span>

        {frames.length > 1 && (
          <>
            {/* Arrows for a mouse; a phone swipes. */}
            <button
              type="button"
              onClick={() => go(i - 1)}
              aria-label="Previous image"
              className={`absolute left-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-ink shadow-md backdrop-blur-sm transition-opacity hover:bg-surface md:grid ${i === 0 ? "pointer-events-none opacity-0" : "opacity-0 group-hover/img:opacity-100"}`}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => go(i + 1)}
              aria-label="Next image"
              className={`absolute right-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-ink shadow-md backdrop-blur-sm transition-opacity hover:bg-surface md:grid ${i === frames.length - 1 ? "pointer-events-none opacity-0" : "opacity-0 group-hover/img:opacity-100"}`}
            >
              <ChevronRight size={20} />
            </button>
            {/* On a pill of their own, so they read on a pale photo and a dark
                one alike. */}
            <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 rounded-full bg-surface/75 px-2.5 py-1.5 backdrop-blur-sm">
              {frames.map((f, idx) => (
                <button
                  key={f.src}
                  type="button"
                  onClick={() => go(idx)}
                  aria-label={`Show image ${idx + 1}`}
                  aria-current={idx === i}
                  className={`h-1.5 rounded-full transition-all ${idx === i ? "w-5 bg-ink/75" : "w-1.5 bg-ink/25 hover:bg-ink/45"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <p className="mt-4 flex items-start gap-2.5 text-[0.82rem] leading-snug text-muted">
        <Info size={17} className="mt-px shrink-0 text-line-strong" strokeWidth={1.8} />
        <span>
          Images are for illustrative purposes only.
          <br className="hidden sm:block" /> Actual products may vary.
        </span>
      </p>
    </div>
  );
}
