import React from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1];

const CTA = "#AA8B5D";

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
      {/* 2026-09-15 clip. The master came as 41MB of 4K AV1, which most
          iPhones and pre-M3 Macs cannot decode at all, so it would have been a
          blank hero there. This is a re-encode of it to 4K H.264 (CRF 20,
          audio track dropped, faststart): 20.7MB, and VMAF 97.3 against the
          master, which is visually identical. H.264 plays everywhere. */}
      <video
        src="/video/hero.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
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
            text-white
          "
          /* White over the clip at the client's request (2026-09-15). The
             soft shade keeps it legible on the bright frames of the video. */
          style={{ textShadow: "0 2px 24px rgba(0,0,0,0.28)" }}
        >
          <span className="block">Modern Healthcare,</span>
          <span className="block">Built Around You</span>

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