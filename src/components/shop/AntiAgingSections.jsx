import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import Reveal from "../ui/Reveal";
import ProductJourney from "../product/ProductJourney";
import { visibleProducts } from "../data/products";
import { stageOf } from "../../lib/catalog";
const STEPS = [
  {
    title: "Complete Your Health Check-In",
    body: "Answer a few questions about your health, medications, lifestyle, and wellness goals",
  },
  {
    title: "Provider Review",
    body: "A licensed medical provider reviews your information to determine if NAD+ treatment is appropriate for you",
  },
  {
    // {price} is filled from the catalogue below rather than typed here: a stale
    // figure on a page that quotes a starting price is worse than no figure.
    title: "Review Your Treatment & Pricing",
    body: "If approved, review your prescribed treatment and final pricing. NAD+ starts at {price}",
  },
  {
    title: "Fulfillment & Delivery",
    body: "Your prescription is sent to a licensed partner pharmacy for fulfillment and shipped discreetly, if prescribed",
  },
];

function nadFromPrice() {
  const prices = visibleProducts
    .filter(
      (p) =>
        p.categorySlug === "longevity" &&
        /nad\+/i.test(p.name) &&
        /injection/i.test(p.name) &&
        !stageOf(p)
    )
    .map((p) => Number(String(p.price).replace(/[^0-9.]/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);
  /* Monthly, like every other prescription price on the site. */
  return prices.length ? `$${Math.min(...prices)}/mo` : "";
}

/* The claims that ride past the bottle. Kept to product facts the catalogue
   already states — sublingual, so needle-free; prescription, so provider
   guided — rather than outcomes. */
const MARQUEE = [
  "Energy Support",
  "Needle-Free",
  "Easy Routine",
  "Provider Guided",
  "Dissolves Under the Tongue",
  "At-Home or On the Go",
];

/* ProductJourney reads only these two fields off what it is handed. */
const JOURNEY_CATEGORY = {
  categorySlug: "longevity",
  categoryName: "Longevity",
};

/* ------------------------- two ways to experience ------------------------- */

const FORMATS = [
  {
    key: "injection",
    title: "NAD+ Injection",
    badge: "/site/anti-aging/ways-droplet.avif",
    points: [
      "Provider-guided treatment",
      "Personalized dosing and schedule",
      "Convenient at-home administration",
      "Direct injectable format",
      "Easy to incorporate into a structured wellness routine",
    ],
  },
  {
    key: "sublingual",
    title: "NAD+ Sublingual Tablet",
    badge: "/site/anti-aging/ways-tablet.avif",
    points: [
      "No injection supplies needed",
      "Easy, discreet treatment option",
      "Convenient at home or on the go",
      "Needle-free, dissolves under the tongue",
      "Simple daily routine, easy to fit into your schedule",
    ],
  },
];

function TwoWays() {
  return (
    <div className="mx-auto max-w-[1320px] px-5 pt-[clamp(2.5rem,6vw,4.5rem)] md:px-10">
      <Reveal>
        <h2 className="text-center font-display text-[clamp(1.7rem,3.6vw,2.6rem)] font-extrabold leading-tight text-[#725826]">
          Two Ways to Experience NAD+
        </h2>
      </Reveal>

      <div className="mt-[clamp(2rem,4vw,3.25rem)] grid gap-6 lg:grid-cols-2 lg:gap-8">
        {FORMATS.map((f, i) => {
          const filled = f.key === "injection";
          return (
            <Reveal as="div" key={f.key} delay={i * 0.08} className="h-full">
              <div
                className={`relative h-full overflow-hidden rounded-[calc(26px*var(--nv-r-scale,1))] px-7 py-8 nv-shadow sm:px-9 sm:py-10 ${
                  filled ? "" : "bg-white"
                }`}
                style={
                  filled
                    ? { background: "linear-gradient(135deg, #c9ac83 0%, #bd9d70 60%, #b3925f 100%)" }
                    : undefined
                }
              >
                {/* Badge floats in the corner as in the comp, and idles so the
                    two cards don't read as flat blocks side by side. */}
                <span className="nv-float pointer-events-none absolute right-6 top-6 block h-14 w-14 sm:h-16 sm:w-16">
                  <img src={f.badge} alt="" aria-hidden="true" loading="lazy" className="h-full w-full object-contain" />
                </span>

                <h3
                  className={`max-w-[16ch] font-display text-[clamp(1.15rem,2.2vw,1.6rem)] font-semibold leading-tight ${
                    filled ? "text-[#ffe8b1]" : "text-[#725826]"
                  }`}
                >
                  {f.title}
                </h3>

                <ul className="mt-6 flex flex-col gap-3.5">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-start gap-3">
                      <span
                        className={`mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                          filled ? "bg-[#ffe8b1]/30 text-[#fdf6e6]" : "bg-[#e5d6b8] text-[#8a6a33]"
                        }`}
                      >
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <span
                        className={`text-[0.92rem] leading-snug ${
                          filled ? "text-[#fdf6e6]" : "text-[#7a6a52]"
                        }`}
                      >
                        {p}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------- benefits -------------------------------- */

/* Rotates on its own rather than on hover, per the comp's note. Copy is the
   supplied wording verbatim; "Healthy Aging Routine" and "Cellular Support"
   were given the same sentence in the spec and are left as supplied. */
const BENEFITS = [
  {
    title: "Energy Support",
    body: "Helps support the body's natural process of turning nutrients into energy",
    img: "/site/anti-aging/benefit-energy.avif",
    scale: "h-[88%]",
  },
  {
    title: "Healthy Aging Routine",
    body: "NAD+ plays an important role in normal cellular function throughout the body",
    img: "/site/anti-aging/benefit-aging.avif",
    scale: "h-full",
  },
  {
    title: "Cellular Support",
    body: "NAD+ plays an important role in normal cellular function throughout the body",
    img: "/site/anti-aging/benefit-cellular.avif",
    scale: "h-full",
  },
  {
    title: "Everyday Vitality",
    body: "A simple daily step that sits alongside sleep, movement and nutrition in your routine",
    img: "/site/anti-aging/benefit-vitality.avif",
    scale: "h-[80%]",
  },
];

const BENEFIT_MS = 4000;

function Benefits() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  /* Timeout re-armed on every change rather than one long interval, so clicking
     a tab gives a full dwell on the panel it opened instead of inheriting
     whatever was left of the current tick. */
  useEffect(() => {
    if (paused) return undefined;
    const t = setTimeout(() => setActive((v) => (v + 1) % BENEFITS.length), BENEFIT_MS);
    return () => clearTimeout(t);
  }, [active, paused]);

  const shown = BENEFITS[active];

  return (
    <div
      className="mx-auto max-w-[1320px] px-5 pt-[clamp(2.5rem,6vw,4.5rem)] md:px-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="grid items-center gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,1fr)]">
        <Reveal as="div">
          <ul className="flex w-full max-w-[21rem] flex-col gap-3">
            {BENEFITS.map((b, i) => {
              const on = i === active;
              return (
                <li key={b.title}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    aria-current={on ? "true" : undefined}
                    className={`w-full rounded-full border px-6 py-3.5 text-left font-display text-[clamp(0.9rem,1.35vw,1.02rem)] font-semibold transition-all duration-500 ${
                      on
                        ? "-translate-y-px border-transparent text-[#ffe8b1] nv-shadow"
                        : "border-[#c9ab72] bg-transparent text-[#8a6a33] hover:bg-[#e5d6b8]/40"
                    }`}
                    style={
                      on
                        ? { background: "linear-gradient(135deg, #a98757 0%, #9a7843 100%)" }
                        : undefined
                    }
                  >
                    {b.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </Reveal>

        <Reveal as="div" delay={0.08}>
          {/* One panel, re-keyed on the active benefit so the copy and the photo
              cross-fade together instead of the text swapping under a stale
              image. aria-live announces the change for anyone not watching. */}
          <div
            className="relative overflow-hidden rounded-[calc(26px*var(--nv-r-scale,1))]"
            style={{ background: "linear-gradient(160deg, #cbb195 0%, #c0a382 100%)" }}
            aria-live="polite"
          >
            <div className="px-7 pt-8 sm:px-9 sm:pt-9">
              <h3
                key={`t${active}`}
                className="nv-fade-slow font-display text-[clamp(1.2rem,2.4vw,1.75rem)] font-extrabold leading-tight text-[#6b4f22]"
              >
                {shown.title}
              </h3>
              <p
                key={`b${active}`}
                className="nv-fade-slow mt-2 max-w-[38ch] text-[0.95rem] leading-relaxed text-[#6b5a3d]"
              >
                {shown.body}
              </p>
            </div>

            <div className="relative mt-6 h-[clamp(18rem,34vw,29rem)]">
              {BENEFITS.map((b, i) => (
                <img
                  key={b.img}
                  src={b.img}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className={`nv-figfade pointer-events-none absolute bottom-0 left-1/2 w-auto max-w-none -translate-x-1/2 object-contain object-bottom transition-opacity duration-700 ease-out ${b.scale} ${
                    i === active ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/* ----------------------------- closing band ------------------------------ */

function ExploreBand({ startTo }) {
  return (
    <div className="mx-auto max-w-[1520px] px-4 pt-[clamp(2.5rem,6vw,4.5rem)] md:px-6">
      <Reveal>
        <div
          className="relative flex min-h-[clamp(24rem,58vw,52rem)] items-end justify-center overflow-hidden rounded-[calc(30px*var(--nv-r-scale,1))] px-6 pb-[clamp(2.5rem,5vw,4rem)]"
          style={{ background: "radial-gradient(circle at 50% 45%, #c8ab7e, #a2814a)" }}
        >
          <img
            src="/site/anti-aging/explore-nad.avif"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="nv-bandfade pointer-events-none absolute bottom-0 left-1/2 h-[96%] w-auto max-w-none -translate-x-1/2 object-contain object-bottom"
          />

          {/* Copy sits over the figure, as in the comp. */}
          <div className="relative z-10 text-center">
            <h2 className="font-display text-[clamp(1.9rem,4.4vw,4rem)] font-extrabold leading-tight text-[#ffe8b1]">
              Explore NAD+ Care
            </h2>
            <Link
              to={startTo}
              className="mt-6 inline-flex rounded-full border border-[#ffe8b1]/70 px-7 py-2.5 text-[0.95rem] font-medium text-[#ffe8b1] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#ffe8b1]/10"
            >
              Start Your Consultation
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
function useMidChip(hostRef, focus = 0.78) {
  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof IntersectionObserver === "undefined") return undefined;

    let raf = 0;
    let lit = null;

    const clear = () => {
      if (lit) lit.classList.remove("is-mid");
      lit = null;
    };

    const tick = () => {
      const box = host.getBoundingClientRect();
      const target = box.left + box.width * focus;
      let best = null;
      let bestGap = Number.POSITIVE_INFINITY;
      host.querySelectorAll("[data-nv-chip]").forEach((el) => {
        const r = el.getBoundingClientRect();
        const gap = Math.abs(r.left + r.width / 2 - target);
        if (gap < bestGap) {
          bestGap = gap;
          best = el;
        }
      });
      if (best !== lit) {
        clear();
        if (best) best.classList.add("is-mid");
        lit = best;
      }
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!raf) raf = requestAnimationFrame(tick);
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
        clear();
      }
    });
    io.observe(host);

    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
      clear();
    };
  }, [hostRef, focus]);
}

function SublingualBanner() {
  const bandRef = useRef(null);
  useMidChip(bandRef);

  return (
    <div className="mx-auto max-w-[1520px] px-4 pt-[clamp(2.5rem,6vw,4.5rem)] md:px-6">
      <Reveal>
        <div
          ref={bandRef}
          className="relative min-h-[clamp(17rem,26vw,24rem)] overflow-hidden rounded-[calc(30px*var(--nv-r-scale,1))] px-7 py-9 sm:px-11 sm:py-12"
          style={{ background: "radial-gradient(circle at 50% 50%, #c1a27a, #9a7843)" }}
        >
          <h2 className="relative z-20 max-w-[10ch] font-display text-[clamp(1.5rem,3vw,2.3rem)] font-extrabold leading-[1.14] text-[#ffe8b1]">
            NAD+ Sublingual Tablet
          </h2>
          <div className="nv-nadtrack pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 overflow-hidden">
            <div className="nv-marquee--claims flex w-max">
              {[0, 1].map((copy) => (
                <div key={copy} className="flex shrink-0 items-center gap-4 pr-4 sm:gap-6 sm:pr-6">
                  {MARQUEE.map((label) => (
                    <span
                      key={label}
                      data-nv-chip=""
                      aria-hidden={copy === 1 ? "true" : undefined}
                      className="nv-midchip whitespace-nowrap rounded-full border border-[#ffe8b1]/40 px-5 py-2 text-[clamp(0.85rem,1.15vw,1.08rem)] text-[#ffe8b1]/85"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 z-12 aspect-[1.2] h-[92%] w-auto -translate-x-1/2 -translate-y-1/2"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, #c2a37b 0%, #c2a37b 34%, rgba(194,163,123,0.72) 56%, rgba(194,163,123,0) 78%)",
            }}
          />

          {/* Two elements: nv-float writes `transform`, so it cannot share one
              with the centring translate or the keyframes would wipe it. */}
          <span className="pointer-events-none absolute left-1/2 top-1/2 z-15 h-[74%] -translate-x-1/2 -translate-y-1/2">
            <img
              src="/products/nad-sublingual.avif"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="nv-float block h-full w-auto max-w-none drop-shadow-2xl"
            />
          </span>
        </div>
      </Reveal>
    </div>
  );
}

export default function AntiAgingSections({ startTo = "/start" }) {
  const price = nadFromPrice();

  return (
    <div style={{ background: "#fbfaf7" }}>
    <div className="mx-auto max-w-[1320px] px-5 pb-[clamp(1.5rem,4vw,3rem)] pt-[clamp(4rem,8vw,7rem)] md:px-10">
      <div className="grid items-center gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)]">
        {/* ---------------- steps ---------------- */}
        <Reveal as="div">
          <h2 className="max-w-[12ch] font-display text-[clamp(1.9rem,4.4vw,3rem)] font-extrabold leading-[1.08] text-[#725826]">
            How Your Care Works
          </h2>

          <ul className="mt-[clamp(1.75rem,3vw,2.5rem)] flex flex-col gap-6">
            {STEPS.map((s) => (
              <li key={s.title} className="flex gap-4">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e0cfa8] text-[#6b511e]">
                  <Check size={16} strokeWidth={2.6} />
                </span>
                <span className="block">
                  <h3 className="font-display text-[1.05rem] font-bold leading-tight text-[#725826]">
                    {s.title}
                  </h3>
                  <p className="mt-1.5 max-w-[46ch] text-[0.9rem] leading-relaxed text-[#8a7a5c]">
                    {/* Drops the sentence rather than printing a blank if the
                        catalogue ever stops listing an NAD+ injection. */}
                    {price
                      ? s.body.replace("{price}", price)
                      : s.body.replace(/\.?\s*NAD\+ starts at \{price\}/, "")}
                  </p>
                </span>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* ---------------- brass card ---------------*/}
        <Reveal as="div" delay={0.08}>
          <div
            className="relative min-h-[clamp(21rem,36vw,31rem)] rounded-[calc(28px*var(--nv-r-scale,1))] px-7 py-9 sm:px-10 sm:py-11"
            style={{ background: "linear-gradient(150deg, #b9955c 0%, #a98757 52%, #9a7843 100%)" }}
          >
            <img
              src="/site/anti-aging/nad-supported.avif"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="pointer-events-none absolute bottom-0 right-0 h-[116%] w-auto max-w-none rounded-br-[calc(28px*var(--nv-r-scale,1))] object-contain object-bottom"
            />

            {/* Copy rides above the portrait, and is capped at 60% so the two
                never collide on a narrow card. */}
            <div className="relative z-10 max-w-[60%]">
              <h2 className="font-display text-[clamp(1.5rem,3vw,2.3rem)] font-extrabold leading-[1.12] text-[#ffe8b1]">
                Ready to Feel More Supported?
              </h2>

              <div className="mt-7 flex flex-col items-start gap-3">
                <Link
                  to={startTo}
                  className="inline-flex rounded-full border border-[#ffe8b1]/70 px-6 py-2.5 text-[0.92rem] font-medium text-[#ffe8b1] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#ffe8b1]/10"
                >
                  See If NAD+ Is Right for You
                </Link>
                <Link
                  to="/treatments"
                  className="inline-flex rounded-full bg-[#ffe8b1]/15 px-6 py-2.5 text-[0.92rem] font-medium text-[#ffe8b1] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#ffe8b1]/25"
                >
                  Explore Other Treatments
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>

    <SublingualBanner />
    <TwoWays />
    <ProductJourney product={JOURNEY_CATEGORY} />

    <Benefits />

    {/* Carries the block's bottom space so the light ground runs past the last
        card rather than stopping at its edge. */}
    <div className="pb-[clamp(3rem,6vw,5rem)]">
      <ExploreBand startTo={startTo} />
    </div>
    </div>
  );
}
