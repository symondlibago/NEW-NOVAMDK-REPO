import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1];

/* Lifted straight off the client's 2026-10-07 mock (Better.mp4): the gold is
   lighter than the brand's #AA8B5D so it keeps its weight against the warm
   grade over the clip. */
const CTA = "#CDA560";

/* The grade is the mock's, measured rather than guessed: sampling the same
   pixels in the clean clip and in the mock fits mock = 0.573 x clip + 23, i.e.
   one flat wash of this colour at this alpha. */
const GRADE = "rgba(59, 47, 35, 0.43)";

/* Three verbs over one constant "Better". They rotate on a timer rather than
   with the footage: the mock changes the word mid-scene, so there is nothing
   to sync to. */
const VERBS = ["Feel", "Perform", "Look"];
const HOLD = 3400;

/* The word arrives a letter at a time and leaves the same way. The stagger
   lives on the wrapper so the letters inherit it rather than each carrying its
   own delay, which would have to be recomputed per word length. */
const WORD = {
  animate: { transition: { staggerChildren: 0.05 } },
  exit: { transition: { staggerChildren: 0.03 } },
};

const LETTER = {
  initial: { opacity: 0, y: "0.32em" },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
  exit: { opacity: 0, y: "-0.22em", transition: { duration: 0.26, ease: "easeIn" } },
};

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function HeroVideo() {
  const [verb, setVerb] = useState(0);

  useEffect(() => {
    /* Nothing to animate for anyone who has asked for less motion: the word
       then simply stays on the first verb. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const id = setInterval(() => setVerb((i) => (i + 1) % VERBS.length), HOLD);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative isolate w-full overflow-hidden bg-[#161616]">

      {/* =========================================================
          BACKGROUND VIDEO
      ========================================================== */}
      {/* 2026-10-07 clip. The master came as 1080p AV1, which Safari cannot
          decode below an A17 iPhone or an M3 Mac, so it would have been a blank
          hero on most phones. This is a re-encode to H.264 (CRF 21, audio
          dropped, faststart): 11.5MB, and H.264 plays everywhere. */}
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
      <div aria-hidden="true" className="absolute inset-0" style={{ background: GRADE }} />

      {/* The clip cuts between scenes that are bright bottom left as often as
          they are dark, so the copy gets its own shade rather than relying on
          the grade alone. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(
              100deg,
              rgba(20, 16, 12, 0.42) 0%,
              rgba(20, 16, 12, 0.18) 42%,
              rgba(20, 16, 12, 0) 70%
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
          items-start
          justify-center
          px-5
          py-[clamp(4rem,16vw,7.5rem)]
          text-left
          md:px-10
        "
      >

        {/* =======================================================
            HEADLINE
        ======================================================== */}
        <h1
          className="
            font-display
            font-extrabold
            uppercase
            leading-[0.95]
            text-white
          "
          /* The soft shade keeps it legible on the brightest frames. */
          style={{ textShadow: "0 2px 24px rgba(0,0,0,0.28)" }}
        >
          <span className="sr-only">Feel better, perform better, look better</span>

          {/* The rotating line is kept at the taller word's height so "Better"
              never shifts as the word changes. */}
          <span
            aria-hidden="true"
            className="block text-[clamp(1.9rem,4.5vw,5.2rem)] tracking-[-0.01em]"
          >
            <AnimatePresence mode="wait" initial={false}>
              <Motion.span
                key={VERBS[verb]}
                variants={WORD}
                initial="initial"
                animate="animate"
                exit="exit"
                className="inline-block"
              >
                {VERBS[verb].split("").map((ch, i) => (
                  <Motion.span key={`${VERBS[verb]}-${i}`} variants={LETTER} className="inline-block">
                    {ch}
                  </Motion.span>
                ))}
              </Motion.span>
            </AnimatePresence>
          </span>

          <Motion.span
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
            aria-hidden="true"
            className="block text-[clamp(3.5rem,8.2vw,9.5rem)] tracking-[0.07em]"
          >
            Better
          </Motion.span>
        </h1>

        {/* =======================================================
            STANDFIRST
        ======================================================== */}
        <Motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
          className="
            mt-[clamp(0.85rem,1.6vw,1.4rem)]
            max-w-[34ch]
            text-[clamp(0.95rem,1.7vw,1.55rem)]
            font-medium
            leading-snug
            text-white/90
            sm:max-w-none
          "
          style={{ textShadow: "0 1px 14px rgba(0,0,0,0.3)" }}
        >
          Personalized care for weight, wellness, longevity &amp; more
        </Motion.p>

        {/* =======================================================
            CTA BUTTONS
        ======================================================== */}
        {/* Transform only, no opacity: a fading ancestor would be a backdrop
            root, and the glass on the second button would have nothing left to
            sample until the fade finished. */}
        <Motion.div
          initial={{ y: 18 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.16 }}
          /* Held to a pill's width on a phone (2026-09-19): at max-w-sm the two
             CTAs ran the full width of the screen and read as slabs rather
             than buttons. Unchanged from sm up. */
          className="
            mt-[clamp(1.6rem,3.2vw,2.4rem)]
            flex
            w-full
            max-w-60
            flex-col
            gap-2.5
            sm:max-w-none
            sm:flex-row
            sm:gap-3
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
              h-11
              items-center
              justify-center
              gap-2
              rounded-full
              px-6
              text-[0.88rem]
              font-semibold
              text-white
              shadow-lg
              transition-all
              duration-300

              sm:h-14
              sm:px-8
              sm:text-[0.98rem]

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
              h-11
              items-center
              justify-center
              rounded-full
              border
              border-white/45
              bg-white/10
              px-6
              text-[0.88rem]
              font-semibold
              text-white
              backdrop-blur-md
              transition-all
              duration-300

              sm:h-14
              sm:px-8
              sm:text-[0.98rem]

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
