import React from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import Reveal from "../ui/Reveal";
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

        {/* A woman in our audience's age range in place of the man with the
            phone (client, 2026-10-13). A tall cut-out, so it gets the full
            height of the banner rather than the square box the badge uses,
            which would crop her head. */}
        <div className="pointer-events-none absolute bottom-0 right-12 top-4 z-4 hidden lg:block">
          <img
            src="/site/home/healthfit-woman.avif"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="h-full w-auto object-contain object-bottom"
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
      </div>
      <StartCare to={startTo} />
    </div>
  );
}
