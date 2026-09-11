import React from "react";
import { Link } from "react-router-dom";
import Reveal from "../ui/Reveal";

const INK = "#544529";
const BROWN = "#9a8154";
/* The two ends of the "simple" ramp, read off the comp. */
const TAN_DEEP = "#9c8452";
const TAN_PALE = "#d0bd99";
const BODY = "#7a6d58";

/* The three small cards and the wide photo card. The wide one is painted the
   photograph's own backdrop so the shot can fade into it with no seam. */
const CARD_TAN = "#f2e9dd";
const MIND_TAN = "#dcc0a8";

const CARD_R = "rounded-[calc(26px*var(--nv-r-scale,1))]";
const TILE_R = "rounded-[calc(18px*var(--nv-r-scale,1))]";
const TITLE = "nv-weight-keep font-display font-extrabold";
const BODY_SIZE = "text-[clamp(0.86rem,1.15vw,0.98rem)]";

/* The approved feature set (2026-09-08 compliance pass). Labels only: the
   supporting lines these cards used to carry were the arousal and response
   claims the review removed, and nothing was approved to replace them. */
const MOMENTS = [
  { t: "Topical Formula" },
  { t: "Prescription Only" },
  { t: "Use as Directed" },
];

/* ---------------------------- 1. more feeling ---------------------------- */

function MoreFeeling({ startTo }) {
  return (
    <div className="mx-auto max-w-[1180px] px-5 py-8 md:px-10 lg:py-[clamp(2.5rem,6vw,4.5rem)]">
      <div className="grid items-center gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.86fr)] lg:gap-y-9">
        <Reveal as="div">
          {/* Hard break rather than a ch measure: the comp sets these two lines
              exactly, and ch on an extrabold display face is too loose a ruler
              to land a break reliably. */}
          <h2
            className={`${TITLE} text-[clamp(1.75rem,4.4vw,2.9rem)] leading-[1.12]`}
            style={{ color: BROWN }}
          >
            Topical, provider-
            <br />
            directed care
          </h2>
          <p className={`mt-4 max-w-[52ch] leading-[1.55] lg:mt-6 ${BODY_SIZE}`} style={{ color: BODY }}>
            Applied externally according to your prescription instructions
          </p>
          <Link
            to={startTo}
            className="mt-6 inline-flex rounded-full px-8 py-3.5 text-[0.95rem] font-semibold transition-all duration-300 hover:-translate-y-0.5 nv-shadow lg:mt-8"
            style={{ background: "linear-gradient(120deg, #b8975e 0%, #a3854c 100%)", color: "#fdf6e6" }}
          >
            Start Your Consultation
          </Link>
          {/* Required qualifier, verbatim from the comp and set in its italic. */}
          <p className="mt-6 text-[0.76rem] italic leading-relaxed text-muted lg:mt-[clamp(2rem,4vw,3.5rem)]">
            Prescription required. Eligibility determined by a licensed provider
          </p>
        </Reveal>

        <Reveal as="div" delay={0.08}>
          <div className={`relative aspect-square w-full overflow-hidden lg:aspect-[0.82] ${CARD_R}`}>
            <img
              src="/site/sexual-health/scream-feeling.avif"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/* ------------------------- 2. moments that matter ------------------------- */

function MomentsThatMatter() {
  return (
    <div className="mx-auto max-w-[1180px] px-5 pb-8 md:px-10 lg:pb-[clamp(2.5rem,6vw,4.5rem)]">
      <Reveal>
        <h2
          /* 22ch, not 16: the ruler is the heading's own size, and at the top of
             the clamp "moments that matter" is wider than 16 of its characters,
             so the hard break was landing and then wrapping again underneath. */
          className={`${TITLE} mx-auto max-w-[22ch] text-center text-[clamp(1.6rem,4vw,2.6rem)] leading-[1.14]`}
          style={{ color: BROWN }}
        >
          Made for the
          <br />
          moments that matter
        </h2>
      </Reveal>

      <div className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-5 lg:mt-[clamp(2rem,4vw,3rem)]">
        {MOMENTS.map((m, i) => (
          <Reveal as="div" key={m.t} delay={0.06 * i}>
            {/* Label-only tiles, so they centre rather than sit top-left with an
                empty half beneath them. */}
            <div
              className={`flex h-full items-center justify-center px-5 py-7 text-center sm:px-7 sm:py-9 ${TILE_R}`}
              style={{ background: CARD_TAN }}
            >
              <h3 className="font-display text-[1.02rem] font-bold leading-tight" style={{ color: BROWN }}>
                {m.t}
              </h3>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        {/* Copy left, photograph bleeding in from the right. The band is painted
            the shot's own backdrop and the shot is faded along its left edge, so
            the two meet with no seam and the copy sits on open ground. */}
        <div
          className={`relative mt-3 flex min-h-0 flex-col justify-center overflow-hidden px-6 py-7 sm:mt-[clamp(1.5rem,3vw,2.25rem)] sm:min-h-[clamp(17rem,36vw,26rem)] sm:px-11 sm:py-11 ${CARD_R}`}
          style={{ background: MIND_TAN }}
        >
          <img
            src="/site/sexual-health/scream-mind.avif"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="nv-feelfade pointer-events-none absolute inset-y-0 right-0 h-full w-[70%] object-cover object-center sm:w-[58%]"
          />
          <div className="relative z-10 max-w-xs sm:max-w-xl">
            <h3
              className={`${TITLE} text-[clamp(1.4rem,3.4vw,2.2rem)] leading-[1.12]`}
              style={{ color: INK }}
            >
              Sometimes your mind
              <br />
              is there
            </h3>
            <p className="mt-4 text-[0.9rem] font-semibold sm:mt-6" style={{ color: INK }}>
              Your body needs a minute
            </p>
            <p className="mt-2 max-w-[44ch] text-[0.82rem] leading-[1.5] sm:mt-3 sm:leading-[1.55]" style={{ color: "#6d5c3e" }}>
              Changes in arousal can happen for all kinds of reasons, from age and hormones to
              stress, medications, and everyday life
            </p>
          </div>
        </div>
      </Reveal>

      <p className="mt-5 text-[0.76rem] italic leading-relaxed text-muted">
        Individual response may vary. Prescription treatment requires evaluation and approval by a
        licensed healthcare provider
      </p>
    </div>
  );
}

/* --------------------------- 3. keep the routine --------------------------- */
/* The brass "A little support, right where you want it" card was removed on
   2026-09-08 with the compliance pass, along with the numbered application
   steps that used to fill this section: both were the localized-response and
   timing claims the review asked us to drop. What is left is the one approved
   sentence about how the cream is used. */

function KeepTheRoutine() {
  return (
    <div className="mx-auto max-w-[1180px] px-5 pb-10 md:px-10 lg:pb-[clamp(3rem,6vw,5rem)]">
      <Reveal>
        <h2 className={`${TITLE} text-[clamp(1.6rem,4vw,2.6rem)] leading-[1.14]`} style={{ color: INK }}>
          Keep the routine{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: `linear-gradient(90deg, ${TAN_DEEP} 0%, ${TAN_PALE} 100%)` }}
          >
            simple
          </span>
        </h2>
      </Reveal>
      <Reveal delay={0.06}>
        <p
          className={`mt-4 max-w-[46ch] leading-[1.55] lg:mt-6 ${BODY_SIZE}`}
          style={{ color: BODY }}
        >
          Use only as directed by your healthcare provider and prescription label
        </p>
      </Reveal>
    </div>
  );
}

export default function ScreamCreamSections({ startTo = "/start" }) {
  return (
    <section style={{ background: "#faf8f4" }}>
      <MoreFeeling startTo={startTo} />
      <MomentsThatMatter />
      <KeepTheRoutine />
    </section>
  );
}
