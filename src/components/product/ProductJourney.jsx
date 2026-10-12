import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Reveal from "../ui/Reveal";

/* The four steps as photo cards (client's reference, 2026-10-12): photo on
   top, step number, title and its line under it. Four across on a desktop; a
   swipe row with arrows on a phone and tablet. The photos are the client's,
   graded to the site's cream so the four read as one set. */
const STEPS = [
  {
    title: "Complete your medical intake",
    text: "Tell us about your health history, medications, and treatment goals.",
    img: "/products/journey/intake.avif",
  },
  {
    title: "Licensed provider review",
    text: "A licensed provider evaluates your information and determines whether treatment is medically appropriate.",
    img: "/products/journey/provider.avif",
  },
  {
    title: "Prescription, if appropriate",
    text: "If prescribed, your prescription is sent to a qualified pharmacy for fulfillment.",
    img: "/products/journey/prescription.avif",
  },
  {
    title: "Ongoing care",
    text: "Follow-up care and treatment guidance are available throughout your treatment plan.",
    img: "/products/journey/followup.avif",
  },
];

export default function ProductJourney() {
  const row = useRef(null);
  const [at, setAt] = useState(0);

  const step = () => row.current?.firstElementChild?.getBoundingClientRect().width || 1;
  const go = (n) => {
    const el = row.current;
    if (!el) return;
    const to = Math.max(0, Math.min(STEPS.length - 1, n));
    el.scrollTo({ left: to * (step() + 16), behavior: "smooth" });
  };
  const onScroll = () => {
    const el = row.current;
    if (el) setAt(Math.round(el.scrollLeft / (step() + 16)));
  };
  const last = row.current ? row.current.scrollLeft + row.current.clientWidth >= row.current.scrollWidth - 4 : false;

  return (
    <section className="py-[clamp(2.5rem,5vw,4.5rem)]">
      <div className="mx-auto max-w-[1180px] px-5 md:px-10">
        <Reveal as="div" className="flex items-end justify-between gap-4">
          <div>
            <span className="nv-eyebrow">How it works</span>
            <h2 className="mt-3 max-w-[16ch] font-display text-[clamp(1.6rem,3.2vw,2.3rem)] font-extrabold leading-[1.12] text-ink">
              From assessment to ongoing care
            </h2>
          </div>
          <div className="flex shrink-0 gap-2.5 lg:hidden">
            <button
              type="button"
              onClick={() => go(at - 1)}
              disabled={at === 0}
              aria-label="Previous step"
              className="grid h-12 w-12 place-items-center rounded-full border border-line-strong bg-surface text-ink transition-opacity disabled:opacity-35"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => go(at + 1)}
              disabled={at >= STEPS.length - 1 || last}
              aria-label="Next step"
              className="grid h-12 w-12 place-items-center rounded-full border border-line-strong bg-surface text-ink transition-opacity disabled:opacity-35"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </Reveal>

        <ol
          ref={row}
          onScroll={onScroll}
          className="no-scrollbar -mx-5 mt-[clamp(1.75rem,3.5vw,2.75rem)] flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 md:-mx-10 md:scroll-px-10 md:px-10 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0"
        >
          {STEPS.map((s, k) => (
            <li key={s.img} className="w-5/6 shrink-0 snap-start sm:w-5/12 lg:w-auto">
              <Reveal as="div" delay={k * 0.08} y={16} className="h-full">
                <div className="flex h-full flex-col rounded-[calc(20px*var(--nv-r-scale,1))] bg-surface-2/45 p-2.5">
                  <img
                    src={s.img}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="aspect-5/4 w-full rounded-[calc(14px*var(--nv-r-scale,1))] object-cover"
                  />
                  <div className="px-3 pb-4 pt-5">
                    <p className="font-mono text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-accent">
                      Step {String(k + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-2 font-display text-[1.08rem] font-bold leading-snug text-ink">{s.title}</h3>
                    <p className="mt-1.5 text-[0.9rem] leading-relaxed text-muted">{s.text}</p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
