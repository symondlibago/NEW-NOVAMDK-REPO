import React from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1];

const CTA = "#AA8B5D";

/*
|--------------------------------------------------------------------------
| HEADLINE GRADIENTS
|--------------------------------------------------------------------------
*/
const INK = "#6d5934";
const TAN = "#c3a97d";


const RAMP = {
  backgroundImage: `linear-gradient(90deg, ${INK} 0%, ${TAN} 100%)`,
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
};

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function HeroVideo() {
  return (
    <section className="relative isolate w-full overflow-hidden bg-[#161616]">

      {/* =========================================================
          BACKGROUND VIDEO
      ========================================================== */}
      <video
        src="/video/right-vid.mp4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
        className="
          absolute
          inset-0
          h-full
          w-full
          object-cover
          object-center
        "
      />

      {/* =========================================================
          VIDEO OVERLAY
      ========================================================== */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(
              180deg,
              rgba(20, 20, 20, 0.28) 0%,
              rgba(20, 20, 20, 0.15) 45%,
              rgba(20, 20, 20, 0.48) 100%
            )
          `,
        }}
      />

      {/* Optional subtle center overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              circle at 55% 50%,
              rgba(255,255,255,0.05) 0%,
              rgba(0,0,0,0.05) 50%,
              rgba(0,0,0,0.18) 100%
            )
          `,
        }}
      />

      {/* =========================================================
          HERO CONTENT
      ========================================================== */}
      <div
        className="
          relative
          z-10
          mx-auto
          flex
          min-h-[calc(100svh-110px)]
          max-w-[1340px]
          flex-col
          items-center
          justify-center
          px-5
          py-[clamp(4rem,16vw,7.5rem)]
          text-center
          md:px-10
        "
      >

        {/* =======================================================
            HEADLINE
        ======================================================== */}
        <Motion.h1
          initial={{
            opacity: 0,
            y: 22,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.9,
            ease: EASE,
          }}
          className="
            font-display
            text-[clamp(2.1rem,7vw,4.4rem)]
            font-extrabold
            leading-[1.08]
            tracking-[-0.035em]
          "
        >

          {/* FIRST LINE */}
          <span className="block">

            {/* Modern */}
            <span
              className="inline-block"
              style={{ color: INK }}
            >
              Modern
            </span>

            {" "}

            {/* Healthcare, — carries the ramp */}
            <span
              className="inline-block"
              style={RAMP}
            >
              Healthcare,
            </span>

          </span>

          {/* SECOND LINE */}
          <span className="block">

            {/* Second line stays flat ink — the ramp belongs to one tail word
                per heading, not to every line. */}
            <span
              className="inline-block"
              style={{ color: INK }}
            >
              Built Around You
            </span>

          </span>

        </Motion.h1>

        {/* =======================================================
            CTA BUTTONS
        ======================================================== */}
        <Motion.div
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.9,
            ease: EASE,
            delay: 0.14,
          }}
          className="
            mt-[clamp(1.6rem,4vw,2.4rem)]
            flex
            w-full
            max-w-sm
            flex-col
            gap-3
            sm:max-w-none
            sm:flex-row
            sm:justify-center
          "
        >

          {/* PRIMARY CTA */}
          <Link
            to="/treatments"
            style={{
              backgroundColor: CTA,
            }}
            className="
              group
              inline-flex
              h-[52px]
              items-center
              justify-center
              gap-2
              rounded-full
              px-8
              text-[0.98rem]
              font-semibold
              text-white
              shadow-lg
              transition-all
              duration-300

              hover:-translate-y-0.5
              hover:brightness-[1.08]
            "
          >
            Explore Treatments

            <ArrowRight
              size={16}
              strokeWidth={2}
              className="
                transition-transform
                duration-300
                group-hover:translate-x-1
              "
            />
          </Link>

          {/* SECONDARY CTA */}
          <Link
            to="/start"
            className="
              inline-flex
              h-[52px]
              items-center
              justify-center
              rounded-full
              border
              border-white/45
              bg-white/10
              px-8
              text-[0.98rem]
              font-semibold
              text-white
              backdrop-blur-md
              transition-all
              duration-300

              hover:-translate-y-0.5
              hover:bg-white/20
            "
          >
            Get Started
          </Link>

        </Motion.div>
      </div>
    </section>
  );
}