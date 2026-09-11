import React from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import Reveal from "../ui/Reveal";
import useRunOnceInView from "../../lib/useRunOnceInView";
const INCLUDES = [
  {
    title: "GLP-1 Treatment",
    body: "Access to GLP-1 medication, when medically appropriate, as part of your weight-management plan",
  },
  {
    title: "Ongoing Support",
    body: "Stay connected with our care team for questions, check-ins, and treatment guidance",
  },
  {
    title: "Lifestyle Guidance",
    body: "Simple nutrition and movement guidance to help support your progress",
  },
];

const CHAT_PILLS = [
  {
    src: "/site/weight-loss/chat-weight.avif",
    alt: "manage my weight",
    pos: "left-[6%] top-[44%]",
  },
  {
    src: "/site/weight-loss/chat-metabolism.avif",
    alt: "support my metabolism",
    pos: "left-[9%] top-[57%]",
  },
  {
    src: "/site/weight-loss/chat-energy.avif",
    alt: "improve my energy",
    pos: "left-[6%] top-[70%]",
  },
];

const CHIPS = [
  { src: "/site/weight-loss/chip-2.avif", alt: "Example progress card: 3 weeks in" },
  { src: "/site/weight-loss/chip-4.avif", alt: "Example check-in card: Friday, Aug 28" },
  { src: "/site/weight-loss/chip-1.avif", alt: "Example dose card: weekly dose completed, week 3 of 4" },
  { src: "/site/weight-loss/chip-5.avif", alt: "Example goal card: stay hydrated" },
  { src: "/site/weight-loss/chip-3.avif", alt: "Example summary card: 8 lbs down, goal 160 lbs" },
];

const CHIP_H = "h-24 w-[13.7rem]";

function Chip({ chip, decorative }) {
  return (
    /* Rounded, not a square clip: the wrapper crops the blown-up export, so
       without a radius here the card's own rounded corners get squared off. */
    <span
      className={`relative block shrink-0 overflow-hidden rounded-[calc(14px*var(--nv-r-scale,1))] ${CHIP_H}`}
    >
      <img
        src={chip.src}
        alt={decorative ? "" : chip.alt}
        aria-hidden={decorative ? "true" : undefined}
        loading="lazy"
        decoding="async"
        className="absolute left-1/2 top-1/2 h-[296%] w-auto max-w-none -translate-x-1/2 -translate-y-1/2"
      />
    </span>
  );
}

function ChipTrack() {
  return (
    <div className="nv-chiptrack pointer-events-none relative z-2 overflow-hidden pb-8 lg:absolute lg:inset-x-0 lg:top-[55%] lg:-translate-y-1/2 lg:pb-0">
      <div className="nv-marquee flex w-max">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center gap-7 pr-7">
            {CHIPS.map((c) => (
              <Chip key={c.src} chip={c} decorative={copy === 1} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const PILLARS = [
  {
    title: "Support That Works With Your Body",
    body: "GLP-1 treatments work with natural hormone pathways involved in appetite and food intake",
  },
  {
    title: "More Control, More Consistency",
    body: "By helping manage appetite, GLP-1 treatment can support healthier routines and long-term weight-management efforts",
    featured: true,
  },
  {
    title: "Why GLP-1 Care?",
    body: "GLP-1 medications are designed to support appetite regulation, giving you another tool to help reach your weight goals",
  },
];

const ART_BOX = "pointer-events-none absolute bottom-0 right-0 hidden aspect-square h-[116%] lg:block";

function MembershipBanner({ to }) {
  return (
    <Reveal>
      <div
        className="relative overflow-hidden rounded-[calc(22px*var(--nv-r-scale,1))]"
        style={{
          background: "linear-gradient(90deg, #c1a27a 0%, #a98757 52%, #9a7843 100%)",
        }}
      >
        <div className="relative z-5 px-6 py-[clamp(1.5rem,3vw,2.75rem)] sm:px-9 lg:px-11">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-[#ffe8b1]">
            Ongoing Care
          </span>
          <h2 className="mt-2 font-display text-[clamp(1.6rem,4.4vw,2.9rem)] font-extrabold leading-[1.06] text-[#ffe8b1]">
            Your Membership
            <br />
            Includes
          </h2>
          <Link
            to={to}
            className="mt-5 inline-flex rounded-full border-2 border-[#d3b784] bg-[#fdfaf3] px-7 py-2.5 text-[0.95rem] font-semibold text-[#3a2c12] transition-all duration-300 hover:-translate-y-0.5 nv-shadow"
          >
            Start Your Plan
          </Link>
        </div>

        <ChipTrack />

        <div className={`${ART_BOX} z-4`}>
          <img
            src="/site/weight-loss/membership-man.avif"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain"
          />
        </div>

        {/* Above the drifting cards, below him. It used to sit at z-1, under the
            cards as well, which left the checkmark clipped from both sides. */}
        <div className={`${ART_BOX} z-3`}>
          <img
            src="/site/weight-loss/check-badge.avif"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute -left-[4%] top-[13%] w-[73%]"
          />
        </div>
      </div>
    </Reveal>
  );
}

function Includes() {
  return (
    <div className="mt-[clamp(3rem,7vw,6rem)] grid items-center gap-[clamp(2rem,5vw,4rem)] lg:grid-cols-2">
      <Reveal as="div">
        <ul className="flex flex-col gap-9">
          {INCLUDES.map((i) => (
            <li key={i.title} className="flex gap-5">
              <span className="mt-0.5 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e0c795] text-[#5c4514]">
                <Check size={22} strokeWidth={3} />
              </span>
              <span>
                <h3 className="font-display text-[clamp(1.15rem,1.5vw,1.45rem)] font-bold leading-tight text-[#725826]">
                  {i.title}
                </h3>
                <p className="mt-2 max-w-[42ch] text-[clamp(0.92rem,1.05vw,1.02rem)] leading-relaxed text-[#8a7a5c]">
                  {i.body}
                </p>
              </span>
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal as="div" delay={0.08}>
        <span className="relative mx-auto block w-full max-w-112.5">
          <img
            src="/site/weight-loss/includes-runner.avif"
            alt="A patient out running, thinking through what she wants from treatment"
            loading="lazy"
            decoding="async"
            className="block w-full"
          />
          {CHAT_PILLS.map((c, i) => (
            <Reveal key={c.src} delay={0.3 + i * 0.45} className={`absolute ${c.pos}`}>
              <span className="nv-float block" style={{ animationDelay: `${i * 0.8}s` }}>
                <span
                  className="inline-flex items-center rounded-full bg-white px-4 py-2 nv-shadow"
                >
                  <img
                    src={c.src}
                    alt={c.alt}
                    loading="lazy"
                    className="block h-auto w-[clamp(7rem,13vw,10.5rem)]"
                  />
                </span>
              </span>
            </Reveal>
          ))}
        </span>
      </Reveal>
    </div>
  );
}

function TrendBars() {
  const [ref, running] = useRunOnceInView();

  return (
    <svg
      ref={ref}
      viewBox="0 0 320 240"
      aria-hidden="true"
      className={`nv-bars pointer-events-none absolute inset-0 h-full w-full opacity-25 ${
        running ? "is-in" : ""
      }`}
      preserveAspectRatio="none"
    >
      <g fill="#fff" opacity="0.35">
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <rect
            key={n}
            className="nv-bars__bar"
            x={26 + n * 48}
            y={200 - n * 26}
            width="30"
            height={40 + n * 26}
            style={{ animationDelay: `${n * 0.13}s` }}
          />
        ))}
      </g>
      <path
        className="nv-bars__trend"
        d="M30 200L280 44"
        pathLength="1"
        stroke="#fff"
        strokeWidth="3"
        fill="none"
        style={{ animationDelay: "0.72s" }}
      />
      <path
        className="nv-bars__trend"
        d="M252 44h30v30"
        pathLength="1"
        stroke="#fff"
        strokeWidth="3"
        fill="none"
        style={{ animationDelay: "1.5s" }}
      />
    </svg>
  );
}

function Pillars() {
  return (
    <div className="mt-[clamp(3rem,7vw,6rem)] border-t border-[#e6dcc6] pt-[clamp(2.5rem,6vw,4.5rem)]">
      {/* items-center is what raises the middle card: it's taller, so the two
          beside it centre against it rather than stretching to match. */}
      <div className="grid items-center gap-4 sm:gap-5 lg:grid-cols-3">
        {PILLARS.map((p, i) => (
          <Reveal as="div" key={p.title} delay={(i % 3) * 0.06}>
            <div
              className={`relative flex flex-col justify-center overflow-hidden rounded-[calc(20px*var(--nv-r-scale,1))] ${
                p.featured ? "min-h-88 px-8 py-12 nv-shadow-lg" : "min-h-72 px-7 py-9"
              }`}
              style={{
                background: p.featured
                  ? "linear-gradient(150deg, #9a7843 0%, #b89358 55%, #a6803f 100%)"
                  : "linear-gradient(150deg, #c3ab88 0%, #b39d7c 100%)",
              }}
            >
              {/* Rising-trend motif behind the featured card, per the comp. */}
              {p.featured && <TrendBars />}
              <h3
                className={`relative font-display font-extrabold leading-tight ${
                  p.featured
                    ? "text-[clamp(1.3rem,2.2vw,1.7rem)] text-white"
                    : "text-[clamp(1.05rem,1.7vw,1.25rem)] text-[#f3e2b8]"
                }`}
              >
                {p.title}
              </h3>
              <p
                className={`relative mt-3 max-w-[34ch] font-semibold leading-snug text-white ${
                  p.featured ? "text-[0.92rem]" : "text-[0.8rem] text-white/90"
                }`}
              >
                {p.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function StartCare({ to }) {
  return (
    <section
      className="relative flex min-h-[clamp(32rem,55vw,56rem)] flex-col justify-end overflow-hidden"
      style={{ background: "linear-gradient(180deg, #b08d54 0%, #9a7843 62%, #c9ac7c 100%)" }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
        <div className="nv-marquee--slow flex h-full w-[200%]">
          {[0, 1].map((copy) => (
            <span
              key={copy}
              className="block h-full w-1/2 shrink-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/site/weight-loss/start-care-labels.avif')" }}
            />
          ))}
        </div>
      </div>
      <img
        src="/site/weight-loss/start-care-woman.avif"
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="pointer-events-none absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2"
      />
      <div className="relative mx-auto max-w-[1320px] px-4 pb-[clamp(2rem,5vw,4.5rem)] text-center md:px-6">
        <h2 className="font-display text-[clamp(1.9rem,4vw,3.2rem)] font-extrabold leading-tight text-[#f1dba6] drop-shadow-[0_2px_10px_rgba(60,44,18,0.45)]">
          Start Weight Care
        </h2>
        <Link
          to={to}
          className="mt-5 inline-flex rounded-full bg-[#fdfaf3] px-7 py-3 text-[0.9rem] font-semibold text-[#3a2c12] transition-all duration-300 hover:-translate-y-0.5 nv-shadow"
        >
          Start Your Consultation
        </Link>
      </div>
    </section>
  );
}

export default function WeightLossSections({ startTo }) {
  return (
    <div style={{ background: "#fbfaf7" }}>
      <div className="mx-auto max-w-[1320px] px-4 py-[clamp(3rem,7vw,6rem)] md:px-6">
        <MembershipBanner to={startTo} />
        <Includes />
        <Pillars />
      </div>
      <StartCare to={startTo} />
    </div>
  );
}
