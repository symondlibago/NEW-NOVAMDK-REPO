import React from "react";
import Reveal from "../ui/Reveal";
import BackButton from "../ui/BackButton";
export default function PageHero({
  eyebrow,
  title,
  subtitle,
  chips = [],
  children,
  showBack = false,
  compact = false,
}) {
  // No ground of its own — it inherits the page's. The tall variant below paints
  // bg-surface and closes with a rule, which reads as a deliberate band; without
  // that rule the same fill just stops in mid-air above the content.
  if (compact) {
    return (
      <section>
        <div className="mx-auto max-w-[1320px] px-4 md:px-6">
          <div className="relative mb-8 pt-[clamp(1.5rem,4vw,3rem)] text-center sm:mb-10">
            {showBack && (
              <div className="mb-2 text-left sm:absolute sm:left-0 sm:top-[clamp(1.5rem,4vw,3rem)] sm:mb-0">
                <BackButton />
              </div>
            )}
            <Reveal>
              {/* Gradient clipped to the glyphs, the same stops the shop header
                  uses. The text colour has to be transparent for it to show. */}
              <h1
                className="bg-clip-text text-[clamp(1.9rem,4.4vw,3.1rem)] font-extrabold leading-[1.1] tracking-tight text-transparent"
                style={{ backgroundImage: "radial-gradient(circle at 0% 0%, #d9c797, #6b511e)" }}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="mx-auto mt-3 max-w-[46ch] text-[0.95rem] leading-relaxed text-muted sm:text-[1.02rem]">
                  {subtitle}
                </p>
              )}
              {children}
            </Reveal>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-line bg-surface">
      {showBack && (
        <div className="mx-auto max-w-[1340px] px-5 pt-6 md:px-10">
          <BackButton />
        </div>
      )}
      <div className="mx-auto max-w-[760px] px-5 pb-[clamp(2.8rem,6vw,4.5rem)] pt-[clamp(1.6rem,3vw,2.4rem)] text-center md:px-10">
        <Reveal>
          {eyebrow && <span className="nv-eyebrow">{eyebrow}</span>}
          <h1 className="mt-3 text-[clamp(2.2rem,5.5vw,3.6rem)] font-extrabold leading-[1.05] tracking-tight">{title}</h1>
          {subtitle && <p className="mx-auto mt-4 max-w-[52ch] text-[clamp(1rem,1.7vw,1.15rem)] text-muted">{subtitle}</p>}
          {chips.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              {chips.map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-3.5 py-1.5 text-[0.82rem] font-medium text-muted">
                  {c}
                </span>
              ))}
            </div>
          )}
          {children}
        </Reveal>
      </div>
    </section>
  );
}
