import React, { useEffect, useState } from "react";
import { Info } from "lucide-react";

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

export default function ProductGallery({ product, categoryLabel }) {
  const frames = framesFor(product);
  const [i, setI] = useState(0);
  useEffect(() => { setI(0); }, [product.id]);

  const active = frames[Math.min(i, frames.length - 1)] || { src: product.img, photo: false };

  return (
    <div className="min-w-0">
      <div
        className={`group/img relative flex min-h-90 items-center justify-center overflow-hidden rounded-[calc(26px*var(--nv-r-scale,1))] md:min-h-140 ${
          active.photo ? "" : "p-7 md:p-10"
        }`}
        style={active.photo ? undefined : { background: "linear-gradient(145deg, #e6d9c3 0%, #d8c6a8 100%)" }}
      >
        {/* pedestal shadow — only grounds a cut-out; a photo has its own */}
        {!active.photo && (
          <div className="pointer-events-none absolute bottom-[16%] left-1/2 h-6 w-2/5 -translate-x-1/2 rounded-[50%] bg-ink/15 blur-xl" />
        )}

        <span className="absolute left-5 top-5 z-10 rounded-full bg-[#f7f2e8]/90 px-3.5 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-[#8a6f3c] backdrop-blur-sm">
          {categoryLabel}
        </span>

        <img
          key={active.src}
          src={active.src}
          alt={product.name}
          className={
            active.photo
              ? "absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/img:scale-[1.03]"
              : "relative max-h-100 w-auto max-w-full object-contain mix-blend-multiply drop-shadow-2xl transition-transform duration-500 group-hover/img:scale-[1.03] md:max-h-115"
          }
        />
      </div>

      {frames.length > 1 && (
        <div className="mt-3.5 flex gap-3" role="tablist" aria-label="Product images">
          {frames.map((f, idx) => (
            <button
              key={f.src}
              role="tab"
              type="button"
              aria-selected={idx === i}
              aria-label={`View image ${idx + 1}`}
              onClick={() => setI(idx)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-[calc(16px*var(--nv-r-scale,1))] transition-all ${
                idx === i
                  ? "ring-2 ring-ink ring-offset-2 ring-offset-bg"
                  : "opacity-75 hover:opacity-100"
              }`}
              style={f.photo ? undefined : { background: "linear-gradient(145deg, #e6d9c3 0%, #d8c6a8 100%)" }}
            >
              <img
                src={f.src}
                alt=""
                loading="lazy"
                className={f.photo ? "h-full w-full object-cover" : "h-full w-full object-contain p-1.5 mix-blend-multiply"}
              />
            </button>
          ))}
        </div>
      )}

      <p className="mt-5 flex items-start gap-2.5 text-[0.82rem] leading-snug text-muted">
        <Info size={17} className="mt-px shrink-0 text-line-strong" strokeWidth={1.8} />
        <span>
          Images are for illustrative purposes only.
          <br className="hidden sm:block" /> Actual products may vary.
        </span>
      </p>
    </div>
  );
}
