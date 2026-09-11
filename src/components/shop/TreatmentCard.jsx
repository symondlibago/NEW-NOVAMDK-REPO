import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "../ui/Reveal";
export default function TreatmentCard({ item, delay = 0, floatDelay = 0, onViewDetails, compact = false }) {
  return (
    <Reveal as="div" delay={delay} className="h-full">
      <div
        className={`group relative flex h-full flex-col overflow-hidden rounded-[calc(18px*var(--nv-r-scale,1))] border-2 border-[#b39355] transition-all duration-300 hover:-translate-y-1 hover:border-[#8f7136] nv-shadow hover:nv-shadow-lg ${compact ? "pt-9 pr-4 pb-4 pl-4" : "pt-11 pr-5 pb-5 pl-5"}`}
        style={{ background: "linear-gradient(90deg, #ffffff 0%, #e4d2b8 100%)" }}
      >
        {item.ribbon && (
          <span
            className={`absolute left-0 top-0 rounded-br-[14px] font-semibold text-white ${compact ? "px-3 py-1 text-[0.62rem]" : "px-4 py-1.5 text-[0.74rem]"}`}
            style={{ background: "#aa8847" }}
          >
            {item.ribbon}
          </span>
        )}

        <h3 className={`font-display font-extrabold leading-tight tracking-tight text-[#725826] ${compact ? "text-[1.05rem]" : "text-[clamp(1.3rem,2.1vw,1.6rem)]"}`}>
          {item.title}
        </h3>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {item.chips.filter(Boolean).map((c) => (
            <span
              key={c}
              className={`rounded-full border border-[#c0a468] py-[3px] font-medium text-[#6b511e] ${compact ? "px-2 text-[0.6rem]" : "px-2.5 text-[0.68rem]"}`}
            >
              {c}
            </span>
          ))}
        </div>

        <div className={`flex items-center justify-center ${compact ? "my-3.5 h-24 sm:h-28" : "my-5 h-32 sm:h-40"}`}>
          {/* Wrapper carries the idle float so the img keeps its own hover scale. */}
          <span
            className="nv-float flex h-full w-full items-center justify-center"
            style={{ animationDelay: `${floatDelay}s` }}
          >
            <img
              src={item.img}
              alt={item.title}
              loading="lazy"
              className="pointer-events-none h-full w-full object-contain mix-blend-multiply drop-shadow-xl transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </span>
        </div>

        {item.blurb && (
          <p className={`text-center leading-snug text-[#b49a5d] ${compact ? "mb-3.5 text-[0.7rem]" : "mb-5 text-[0.82rem]"}`}>{item.blurb}</p>
        )}

        {/* mt-auto pins the buttons to the bottom so they line up across a row
            whatever the blurb length. */}
        <div className={`mt-auto flex flex-wrap items-center justify-center ${compact ? "gap-1.5" : "gap-2.5"}`}>
          <Link
            to={item.startTo}
            className={`inline-flex items-center gap-1.5 rounded-full border border-[#a28851] font-semibold text-[#fdfaf3] transition-all duration-300 hover:brightness-105 ${compact ? "px-3 py-1.5 text-[0.72rem]" : "px-4 py-2 text-[0.82rem]"}`}
            style={{ background: "#a28851" }}
          >
            Get Started
            <ArrowRight size={14} strokeWidth={2.4} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
          {/* Opens the quick-view modal rather than routing — the shop owns that
              state, so the card just hands the product up. */}
          <button
            type="button"
            onClick={() => onViewDetails?.(item.product)}
            className={`inline-flex items-center rounded-full border border-[#b39355] bg-[#fdfaf3] font-semibold text-[#725826] transition-colors duration-300 hover:border-[#8f7136] ${compact ? "px-3 py-1.5 text-[0.72rem]" : "px-4 py-2 text-[0.82rem]"}`}
          >
            View Details
          </button>
        </div>
      </div>
    </Reveal>
  );
}
