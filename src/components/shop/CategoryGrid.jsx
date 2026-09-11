import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "../ui/Reveal";

function DarkCard({ it, art, onClick, hero = false }) {
  return (
    <Link
      to={it.link}
      onClick={onClick}
      className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-[calc(22px*var(--nv-r-scale,1))] bg-panel text-on-panel transition-all duration-300 hover:-translate-y-1.5 hover:nv-shadow-lg ${
        hero ? "min-h-[clamp(220px,30vw,280px)] p-7 sm:p-9" : "min-h-[clamp(196px,24vw,220px)] p-6"
      }`}
    >
      {/* champagne glow — stronger on the hero tile */}
      <span
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{ background: "radial-gradient(78% 120% at 100% 0%, color-mix(in oklab, var(--nv-accent) 20%, transparent), transparent 64%)", opacity: hero ? 1 : 0.55 }}
      />

      {/* product tile on the right — gentle float */}
      <span className={`nv-bob pointer-events-none absolute bottom-0 right-5 top-0 z-[1] my-auto aspect-square overflow-hidden rounded-[calc(16px*var(--nv-r-scale,1))] ${
        hero ? "h-[clamp(120px,18vw,170px)] sm:right-9" : "h-[clamp(78px,9.5vw,100px)]"
      }`}>
        <img
          src={it.art || art}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110"
        />
      </span>

      {/* content */}
      <div className={`relative z-[2] ${hero ? "max-w-[68%]" : "max-w-[62%]"}`}>
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-accent">{it.tag}</span>
        <h3 className={`mt-1.5 font-display font-bold leading-tight tracking-tight text-white ${hero ? "text-[clamp(1.6rem,3.4vw,2.15rem)]" : "text-[1.3rem]"}`}>{it.name}</h3>
        {it.blurb && <p className={`mt-2 leading-snug text-on-panel/65 ${hero ? "max-w-[42ch] text-[0.95rem]" : "text-[0.83rem]"}`}>{it.blurb}</p>}
      </div>

      {/* CTA pill */}
      <span className={`relative z-[2] inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] py-1.5 pl-1.5 pr-4 font-semibold text-white transition-colors duration-300 group-hover:bg-white group-hover:text-ink ${
        hero ? "mt-6 text-[0.9rem]" : "mt-4 text-[0.84rem]"
      }`}>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 transition-colors duration-300 group-hover:bg-ink/10">
          <ArrowRight size={14} strokeWidth={2.4} />
        </span>
        {it.cta || "Start assessment"}
      </span>
    </Link>
  );
}

function PhotoCard({ it, onClick, hero = false }) {
  const darkTone = it.tone === "dark";
  return (
    <Link
      to={it.link}
      onClick={onClick}
      className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-[calc(22px*var(--nv-r-scale,1))] transition-all duration-300 hover:-translate-y-1.5 hover:nv-shadow-lg ${
        darkTone ? "bg-panel text-on-panel" : "border border-line bg-surface text-ink"
      } ${hero ? "min-h-[clamp(220px,30vw,280px)] p-7 sm:p-9" : "min-h-[clamp(196px,24vw,220px)] p-6"}`}
    >
      <img
        src={it.photo}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        style={it.photoPos ? { objectPosition: it.photoPos } : undefined}
      />
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background: darkTone
            ? "linear-gradient(90deg, color-mix(in oklab, var(--nv-ink-panel) 88%, black) 0%, color-mix(in oklab, var(--nv-ink-panel) 55%, transparent) 48%, transparent 78%)"
            : "linear-gradient(90deg, color-mix(in oklab, var(--nv-surface) 94%, transparent) 0%, color-mix(in oklab, var(--nv-surface) 62%, transparent) 48%, transparent 78%)",
        }}
      />
      {it.overlay && (
        <img
          src={it.overlay}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className={`nv-bob pointer-events-none absolute top-1/2 z-[1] -translate-y-1/2 object-contain transition-transform duration-500 group-hover:scale-105 ${
            hero ? "right-[2%] h-[90%]" : "right-2 h-[74%]"
          }`}
        />
      )}

      <div className={`relative z-[2] ${hero ? "max-w-[68%]" : "max-w-[70%]"}`}>
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-accent">{it.tag}</span>
        <h3 className={`mt-1.5 font-display font-bold leading-tight tracking-tight ${darkTone ? "text-white" : "text-ink"} ${hero ? "text-[clamp(1.6rem,3.4vw,2.15rem)]" : "text-[1.3rem]"}`}>{it.name}</h3>
        {it.blurb && <p className={`mt-2 leading-snug ${darkTone ? "text-on-panel/70" : "text-muted"} ${hero ? "max-w-[42ch] text-[0.95rem]" : "max-w-[26ch] text-[0.83rem]"}`}>{it.blurb}</p>}
      </div>

      <span
        className={`relative z-[2] inline-flex w-fit items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 font-semibold transition-colors duration-300 ${
          darkTone
            ? "border border-white/15 bg-white/10 text-white group-hover:bg-white group-hover:text-ink"
            : "bg-ink/85 text-white group-hover:bg-ink"
        } ${hero ? "mt-6 text-[0.9rem]" : "mt-4 text-[0.84rem]"}`}
      >
        <span className={`grid h-7 w-7 place-items-center rounded-full transition-colors duration-300 ${darkTone ? "bg-white/10 group-hover:bg-ink/10" : "bg-white/15"}`}>
          <ArrowRight size={14} strokeWidth={2.4} />
        </span>
        {it.cta || "Browse treatments"}
      </span>
    </Link>
  );
}

function GrowthArrow({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 320"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="nv-goal__arrow-shaft"
        pathLength="1"
        d="M60 326Q128 262 208 158"
        stroke="currentColor"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <path className="nv-goal__arrow-head" d="M226 134L222 169L194 147Z" fill="currentColor" />
    </svg>
  );
}

/* The card's motion layer (z 3) — everything that moves on hover, always behind
   the cut-out figure so it reads as happening *around* the subject. */
function GoalMotion({ motion }) {
  if (motion === "arrow") {
    return (
      <>
        <span className="nv-goal__layer nv-goal__band" />
        <GrowthArrow className="nv-goal__arrow" />
      </>
    );
  }
  if (motion === "glow") {
    return <span className="nv-goal__layer nv-goal__glow" />;
  }
  if (motion === "spark") {
    return (
      <img
        src="/site/goals/sportsmed.avif"
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="nv-goal__spark pointer-events-none"
      />
    );
  }
  if (motion === "orbs") {
    return (
      <>
        {/* longetivityhover.png is an orbs-only cut-out — no figure baked in —
            so it flies as its own drifting layer behind the hand. */}
        <img
          src="/site/goals/longetivityhover.avif"
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="nv-goal__orbs pointer-events-none object-contain"
        />
        <span className="nv-goal__orb nv-goal__orb--a" />
        <span className="nv-goal__orb nv-goal__orb--b" />
        <span className="nv-goal__orb nv-goal__orb--c" />
      </>
    );
  }
  return null;
}

function CutoutCard({ it, onClick, hero = false }) {
  return (
    <Link
      to={it.link}
      onClick={onClick}
      /* .nv-goal owns the layer stack, the tan rest background, the elevation
         and every hover transition — see index.css. */
      className={`nv-goal group flex h-full flex-col justify-between rounded-[calc(20px*var(--nv-r-scale,1))] ${it.bg || ""} ${
        hero ? "min-h-[clamp(268px,35vw,356px)] p-6 sm:p-8" : "min-h-[clamp(240px,31vw,320px)] p-6"
      }`}
    >
      <span className="nv-goal__layer nv-goal__fade nv-goal__cream" />
      <span className="nv-goal__layer nv-goal__fade nv-goal__bloom" />

      <GoalMotion motion={it.motion} />

      <img
        src={it.cutout}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className={`nv-goal__figure pointer-events-none absolute aspect-square w-auto max-w-none object-contain ${
          it.figureMotion ? `nv-goal__figure--${it.figureMotion}` : ""
        } ${it.cutoutClass || (hero ? "-top-[6%] right-0 h-[112%]" : "-top-[7%] right-0 h-[114%]")}`}
      />
      <div className="nv-goal__content max-w-[62%]">
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#ffe8b1]/85 transition-colors duration-300 group-hover:text-ink/70">
          {it.tag}
        </span>
        <h3
          className={`mt-2 font-display font-bold leading-[1.12] tracking-tight text-[#ffe8b1] transition-colors duration-300 group-hover:text-ink ${
            hero ? "text-[clamp(1.5rem,3.1vw,2rem)]" : "text-[clamp(1.15rem,2vw,1.4rem)]"
          }`}
        >
          {it.name}
        </h3>
      </div>

      <div className="nv-goal__content flex flex-col items-center text-center">
        {it.blurb && (
          <p
            className={`font-semibold leading-snug text-[#ffe8b1]/90 transition-colors duration-300 group-hover:text-ink/75 ${
              hero ? "max-w-[42ch] text-[0.9rem]" : "max-w-[34ch] text-[0.8rem]"
            }`}
          >
            {it.blurb}
          </p>
        )}
        {/* Plain pill, no arrow disc — the comp's button is text only. */}
        <span
          className={`mt-4 inline-flex items-center rounded-full bg-surface font-semibold text-ink transition-colors duration-300 group-hover:bg-primary group-hover:text-on-primary ${
            hero ? "px-6 py-2.5 text-[0.86rem]" : "px-5 py-2 text-[0.8rem]"
          }`}
        >
          {it.cta || "Browse treatments"}
        </span>
      </div>
    </Link>
  );
}

/* Sixth cell of the goal grid: no product art, no eyebrow — the quiet exit for
   anyone who doesn't recognise their goal in the other five. */
function GoalCtaCard({ it, onClick }) {
  return (
    <Link
      to={it.link}
      onClick={onClick}
      className={`nv-goal group flex h-full flex-col justify-center rounded-[calc(20px*var(--nv-r-scale,1))] min-h-[clamp(240px,31vw,320px)] p-6 ${it.bg || ""}`}
    >
      <span className="nv-goal__layer nv-goal__fade nv-goal__cream" />
      <span className="nv-goal__layer nv-goal__fade nv-goal__bloom" />
      {/* No art on this cell, so the bloom is the whole hover — it gets the same
          centre glow the image cards use. */}
      <span className="nv-goal__layer nv-goal__glow" />

      <div className="nv-goal__content">
        {/* Gradient fill rather than a flat colour: clipped to the glyphs, so the
            text needs a transparent colour for the background to show through. */}
        <h3 className="max-w-[14ch] bg-linear-to-br from-[#d3b46a] via-[#b08b34] to-[#6b511e] bg-clip-text font-display text-[clamp(1.1rem,1.9vw,1.3rem)] font-bold leading-[1.12] tracking-tight text-transparent">
          {it.name}
        </h3>
        <span className="mt-4 inline-flex items-center gap-2 text-[0.8rem] font-semibold text-ink">
          {it.cta}
          <ArrowRight className="nv-goal__nudge" size={14} strokeWidth={2.4} />
        </span>
      </div>
    </Link>
  );
}

function LightCard({ it, art, onClick, hero = false }) {
  return (
    <Link
      to={it.link}
      onClick={onClick}
      className={`group relative flex h-full flex-col overflow-hidden rounded-[calc(22px*var(--nv-r-scale,1))] border border-line bg-surface transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/30 hover:nv-shadow-lg ${
        hero ? "min-h-[clamp(210px,28vw,264px)] p-7 sm:p-9" : "min-h-[clamp(180px,22vw,208px)] p-6"
      }`}
    >
      <span
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(75% 62% at 100% 0%, color-mix(in oklab, var(--nv-accent) 16%, transparent), transparent 72%)", opacity: hero ? 1 : 0 }}
      />
      <span className={`pointer-events-none absolute right-4 top-5 grid place-items-center ${hero ? "h-[clamp(96px,14vw,128px)] w-[clamp(96px,14vw,128px)] sm:right-8" : "h-[78px] w-[78px]"}`}>
        <span
          className="absolute inset-0 rounded-full opacity-80 blur-[8px]"
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--nv-accent) 38%, transparent), transparent 66%)" }}
        />
        <img src={it.art || art} alt="" aria-hidden="true" className={`nv-bob relative object-contain transition-transform duration-500 group-hover:scale-110 ${hero ? "w-[clamp(88px,13vw,118px)]" : "w-[72px]"}`} />
      </span>

      <div className={`relative z-[2] ${hero ? "max-w-[68%]" : "max-w-[62%]"}`}>
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-accent">{it.tag}</span>
        <h3 className={`mt-1.5 font-display font-bold leading-tight tracking-tight text-ink ${hero ? "text-[clamp(1.55rem,3.2vw,2.05rem)]" : "text-[1.28rem]"}`}>{it.name}</h3>
        {it.blurb && <p className={`mt-2 leading-snug text-muted ${hero ? "max-w-[42ch] text-[0.95rem]" : "text-[0.85rem]"}`}>{it.blurb}</p>}
      </div>

      <span className="relative z-[2] mt-auto flex items-center gap-2.5 pt-5 text-[0.86rem] font-semibold text-ink">
        <span className="grid h-8 w-8 place-items-center rounded-full border border-line text-muted transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary">
          <ArrowRight size={14} strokeWidth={2.4} />
        </span>
        {it.cta || "Explore"}
      </span>
    </Link>
  );
}

export default function CategoryGrid({ items, art = "/site/pills-float.avif", dark = false, featured = false, onItemClick }) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-[clamp(0.8rem,1.6vw,1.1rem)] sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it, i) => {
        const onClick = onItemClick ? () => onItemClick(it) : undefined;
        const hero = featured && i === 0;
        const Card = it.kind === "goal-cta" ? GoalCtaCard : it.cutout ? CutoutCard : it.photo ? PhotoCard : dark ? DarkCard : LightCard;
        return (
          <Reveal as="div" key={it.name} delay={(i % 3) * 0.06} className={`h-full ${hero ? "sm:col-span-2" : ""}`}>
            <Card it={it} art={art} onClick={onClick} hero={hero} />
          </Reveal>
        );
      })}
    </div>
  );
}
