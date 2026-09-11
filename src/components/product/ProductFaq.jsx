import React, { useState } from "react";
import { faqsFor } from "../data/products";

const spec = (product, label) =>
  product?.specs?.find((s) => s.label === label)?.value || "";

function buildFaqs(product, { otc }) {
  const items = [];

  /* The treatment's own Q&A leads: it is written for this medication, where
     everything below is generated from the catalogue and true of any of them. */
  const own = faqsFor(product);
  items.push(...own);

  // Then the thing people want to know before anything else.
  items.push({
    q: "Do I need a prescription?",
    a: otc
      ? "No. You can order this one without a visit, and there is no provider review to wait on."
      : "Yes. A licensed U.S. provider reviews your intake and decides whether this is right for you. You only pay if they prescribe it.",
  });

  const dosing = spec(product, "Dosing Schedule");
  const admin = spec(product, "Administration");
  /* Skipped when the treatment's own set already answers it, so the list does
     not ask "How is it taken?" and "How do I take it?" back to back. */
  const ownCoversDosing = own.some((f) => /how (do i|is it) (take|used|use)/i.test(f.q));
  if ((dosing || admin) && !ownCoversDosing) {
    items.push({ q: "How do I take it?", a: [dosing, admin].filter(Boolean).join(" ") });
  }

  const supply = spec(product, "Days Supply");
  if (supply) {
    items.push({
      q: "How long does one order last?",
      a: `${supply}. Your provider confirms the schedule that fits you, and refills are handled from your patient portal.`,
    });
  }

  items.push({
    q: "How does it arrive?",
    a: "It comes in plain packaging with nothing on the outside that says what is inside, sent to the address you give us.",
  });

  items.push({
    q: "What if I have questions later?",
    a: otc
      ? "Message our care team any time and someone will come back to you."
      : "Message your care team from your patient portal any time, before or after you start.",
  });

  return items;
}

export default function ProductFaq({ product, otc }) {
  const items = buildFaqs(product, { otc });
  const [open, setOpen] = useState(-1);

  if (!items.length) return null;

  /* Heading on the left, questions on the right, and nothing else: the three
     showcase cards that used to sit beside the list were stock imagery that
     said nothing about the treatment, so the comp drops them. */
  return (
    <div className="grid gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)]">
      <div className="lg:pt-1">
        <span className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#a8884c]">
          What you should know
        </span>
        <h2 className="mt-3 max-w-[12ch] font-display text-[clamp(1.65rem,3.2vw,2.4rem)] font-extrabold leading-[1.15] text-[#725826]">
          Before You Get Started
        </h2>
      </div>

      <ul className="border-t border-line">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <li key={item.q} className="border-b border-line">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="group flex w-full items-start justify-between gap-6 py-5 text-left"
              >
                <span className="max-w-[34ch] text-[1.02rem] leading-snug text-ink transition-colors group-hover:text-[#9a7843] sm:text-[1.08rem]">
                  {item.q}
                </span>
                {/* One glyph, rotated: a plus turns into a cross on open, so
                    nothing swaps mid-transition and the two strokes stay put. */}
                <span
                  aria-hidden="true"
                  className={`relative mt-1.5 block h-3.5 w-3.5 shrink-0 transition-transform duration-300 ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-muted" />
                  <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-muted" />
                </span>
              </button>
              {/* Height animation would need a measured max-height; a grid row
                  collapsing from 1fr to 0fr animates cleanly without measuring. */}
              <div
                className="grid transition-all duration-300 ease-out"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <p className="max-w-[62ch] pb-5 pr-10 text-[0.94rem] leading-relaxed text-muted">
                    {item.a}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
