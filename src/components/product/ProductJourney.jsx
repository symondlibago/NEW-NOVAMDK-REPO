import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { track, EVENTS } from "../../lib/analytics";
import { productPath } from "../../lib/slug";
import { programsFor } from "../data/subscriptions";
import { programItem } from "../../lib/programCard";
import Reveal from "../ui/Reveal";
import TreatmentCard from "../shop/TreatmentCard";

/* Four brass panels rather than the old carousel: the comp shows every step at
   once, each with its cut-out standing on the panel floor and the caption over
   the photo's lower edge. */
const STEPS = [
  {
    title: "Complete your medical intake",
    text: "Tell us about your health history, medications, and treatment goals",
    img: "/products/detail/journey-intake.avif",
    /* Each cut-out is framed differently, so its height and horizontal seat are
       set per card rather than shared. */
    art: "h-[74%] left-[6%] w-[94%]",
  },
  {
    title: "Licensed provider review",
    /* Set explicitly: at the shared 15ch measure this title broke to three
       lines. The client wants two, with "review" up on the same line as
       "provider". */
    titleLines: ["Licensed", "provider review"],
    text: "A licensed healthcare provider evaluates your information and determines whether treatment is medically appropriate",
    img: "/products/detail/journey-provider.avif",
    art: "h-[76%] left-[2%] w-[98%]",
  },
  {
    title: "Prescription, if appropriate",
    text: "If prescribed, your prescription is sent to a qualified pharmacy for fulfillment",
    img: "/products/detail/journey-shipment.avif",
    art: "h-[42%] left-[6%] w-[88%] bottom-[26%]",
  },
  {
    title: "Ongoing care",
    text: "Follow-up care and treatment guidance are available throughout your treatment plan",
    img: "/products/detail/journey-followup.avif",
    art: "h-[76%] left-[4%] w-[92%]",
  },
];

const PANEL = "linear-gradient(160deg, #a4854f 0%, #9a7843 55%, #8f6f3c 100%)";

function StepPanel({ step, index }) {
  return (
    <Reveal as="div" delay={index * 0.09} y={16}>
      <div
        className="relative flex h-full min-h-76 flex-col overflow-hidden rounded-[calc(18px*var(--nv-r-scale,1))] px-5 pb-5 pt-6 sm:min-h-84 lg:min-h-96"
        style={{ background: PANEL }}
      >
        <h3
          className={`relative z-10 font-display text-[0.95rem] font-bold uppercase leading-[1.2] tracking-[0.02em] text-[#f8e8c5] sm:text-[1.02rem] ${
            step.titleLines ? "" : "max-w-[15ch]"
          }`}
        >
          {step.titleLines
            ? step.titleLines.map((l, i) => (
                <React.Fragment key={l}>
                  {i > 0 && <br />}
                  {l}
                </React.Fragment>
              ))
            : step.title}
        </h3>
        {/* Seated on the panel floor and behind the caption, the way the comp
            crops each figure at the bottom edge. */}
        <img
          src={step.img}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className={`pointer-events-none absolute bottom-0 max-w-none object-contain object-bottom ${step.art}`}
        />
        <p className="relative z-10 mt-auto pt-6 text-[0.82rem] font-semibold leading-[1.35] text-white sm:text-[0.86rem]">
          {step.text}
        </p>
      </div>
    </Reveal>
  );
}

export default function ProductJourney({ product }) {
  const navigate = useNavigate();
  const programs = programsFor(product.categorySlug).map(programItem);

  return (
    <section className="py-[clamp(2.5rem,5vw,4.5rem)]">
      <div className="mx-auto max-w-[1180px] px-5 md:px-10">
      <Reveal as="div" className="grid gap-6 md:grid-cols-2 md:items-start">
        <h2 className="max-w-[16ch] font-display text-[clamp(1.5rem,3.2vw,2.2rem)] font-extrabold leading-[1.15] text-[#725826]">
          From assessment to ongoing care
        </h2>
        {/* Column is a flex stack so both the sentence and the link can be sent
            to the container's right edge. Left-ranged on a phone, where there
            is no width to push into. */}
        <div className="flex flex-col items-start md:items-end md:pt-1">
          <p className="max-w-[46ch] text-[0.88rem] leading-relaxed text-muted md:text-right">
            A straightforward path to personalized treatment, with licensed medical oversight at every step
          </p>
          <Link
            to="/start"
            onClick={() => track(EVENTS.QUIZ_STARTED, { source: "product-journey" })}
            className="group mt-3 inline-flex items-center gap-2.5 text-[0.92rem] font-bold text-ink transition-colors hover:text-[#725826] md:self-end"
          >
            Take a quick assessment
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </Reveal>
      {/* One column on a phone, two on a tablet, the comp's four-across from lg. */}
      <ol className="mt-[clamp(2rem,4vw,3.25rem)] grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {STEPS.map((s, k) => (
          <li key={s.img} className="h-full">
            <StepPanel step={s} index={k} />
          </li>
        ))}
      </ol>
      </div>

      {/* Deliberately outside the 1180 container the rest of the section uses —
          the comp runs this panel considerably wider than the carousel above it,
          with only a thin margin left and right. */}
      {programs.length > 0 && (
        <Reveal as="div" className="mx-auto mt-[clamp(2.5rem,5vw,4rem)] max-w-[1520px] px-4 md:px-6">
          <div
            className="grid items-center gap-6 rounded-[calc(38px*var(--nv-r-scale,1))] px-6 py-10 md:px-12 lg:grid-cols-[1fr_1.35fr_0.85fr] lg:gap-10"
            style={{ background: "linear-gradient(135deg, #9a7843 0%, #b8935c 45%, #a07c46 100%)" }}
          >
            <div>
              <h3 className="max-w-[10ch] font-display text-[clamp(1.5rem,2.8vw,2.1rem)] font-extrabold leading-[1.2] text-[#ffe8b1]">
                {product.categoryName} Treatments
              </h3>
            </div>

            <div className="mx-auto grid w-full max-w-[560px] gap-5 sm:grid-cols-2">
              {programs.slice(0, 2).map((c) => (
                /* No quick-view here: we are already on a product page, so
                   View Details routes to the other product instead of stacking
                   a modal on top of one. */
                <TreatmentCard key={c.key} item={c} compact onViewDetails={(p) => navigate(productPath(p))} />
              ))}
            </div>

            {/* Hairline only from lg, where the three blocks actually sit in a row. */}
            <div className="lg:border-l lg:border-white/30 lg:pl-10">
              <h3 className="max-w-[12ch] font-display text-[clamp(1.4rem,2.6vw,1.95rem)] font-extrabold leading-[1.2] text-[#ffe8b1]">
                Explore Other Treatments
              </h3>
              {/* Outlined, not filled — the comp keeps the solid cream button for
                  the primary CTAs and gives this secondary one a ghost pill. */}
              <Link
                to="/treatments"
                className="group mt-5 inline-flex items-center gap-2 rounded-full border border-[#ffe8b1]/70 px-6 py-2.5 text-[0.85rem] font-semibold text-[#ffe8b1] transition-all hover:-translate-y-0.5 hover:bg-[#ffe8b1]/10"
              >
                See More
                <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </Reveal>
      )}
    </section>
  );
}
