import React from "react";
import { Link } from "react-router-dom";
import Reveal from "../ui/Reveal";
import useRunOnceInView from "../../lib/useRunOnceInView";

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

/* ------------------------- 0. more feeling, more you -------------------------
   The 2026-09-25 comp: the couple faded into the brass, the bottle standing on
   the middle of it, and three notes pinned around it. Two of the notes carry
   their label alone with the copy set on the photograph underneath, which is
   how the comp draws them; the third holds both.

   Note for review: the arousal and response wording in the third note is the
   client's own, from the comp. Lines of that kind were taken off these cards by
   the 2026-09-08 compliance pass, so this is a deliberate reinstatement rather
   than an oversight. */

const BRASS_GROUND = "radial-gradient(circle at 50% 40%, #b9986c, #96733f)";
const CREAM_TEXT = "#f7efe2";
const NOTE = {
  background: "rgba(255,255,255,0.16)",
  borderColor: "rgba(255,255,255,0.26)",
};
const SCREAM_RULE = "rgba(255,255,255,0.45)";

const NOTES = [
  {
    label: "How is it used?",
    body: "Applied locally to the external genital area as directed by your healthcare provider, based on your prescribed formulation and care plan",
    /* The comp sets the copy on the photograph under this one rather than
       inside the card. */
    split: true,
    box: "left-0 top-[52%] w-[30%]",
    rule: "left-[30%] top-[62%] w-[8%]",
    delay: 0.95,
  },
  {
    label: "What is it?",
    body: "A compounded prescription cream created for women's sexual wellness and formulated for local application",
    split: false,
    box: "right-0 top-[33%] w-[26%]",
    rule: "right-[26%] top-[45%] w-[7%]",
    delay: 1.1,
  },
  {
    label: "What is it used for?",
    body: "Used to address concerns related to arousal, sensitivity, and physical sexual response during intimacy",
    split: true,
    box: "right-[1%] top-[70%] w-[27%]",
    rule: "right-[28%] top-[76%] w-[7%]",
    delay: 1.25,
  },
];

function Note({ note, stage = false }) {
  return (
    <div className={stage ? `absolute ${note.box}` : ""}>
      <div
        className="nv-scream__card rounded-[calc(14px*var(--nv-r-scale,1))] border px-4 py-3"
        style={{ ...NOTE, animationDelay: `${note.delay}s` }}
      >
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: "#e8c179", boxShadow: "0 0 10px 3px rgba(232,193,121,0.4)" }}
          />
          <span
            className="text-[0.74rem] font-bold uppercase tracking-[0.1em]"
            style={{ color: CREAM_TEXT }}
          >
            {note.label}
          </span>
        </span>
        {!note.split && (
          <p className="mt-2 text-[0.78rem] leading-relaxed" style={{ color: "rgba(247,239,226,0.9)" }}>
            {note.body}
          </p>
        )}
      </div>
      {note.split && (
        <p
          className="nv-scream__card mt-3 px-1 text-[0.78rem] font-semibold leading-relaxed"
          style={{ color: CREAM_TEXT, animationDelay: `${note.delay + 0.12}s` }}
        >
          {note.body}
        </p>
      )}
    </div>
  );
}

function MoreFeelingHero({ startTo }) {
  const [ref, running] = useRunOnceInView("-80px");

  return (
    <div
      ref={ref}
      className={`nv-scream relative w-full overflow-hidden ${running ? "is-in" : ""}`}
      style={{ background: BRASS_GROUND }}
    >
      {/* The photograph sits in the lower half and is faded in at the top, so it
          grows out of the brass instead of starting on an edge. */}
      <img
        src="/site/sexual-health/scream-couple.avif"
        alt=""
        aria-hidden="true"
        loading="lazy"
        /* Full width at its own ratio rather than cropped to a percentage of
           the band: object-cover was scaling a 3.2:1 shot up to fill a much
           taller box, which zoomed it in on one face. */
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 w-full object-cover object-top sm:h-auto"
        style={{
          WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 26%)",
          maskImage: "linear-gradient(180deg, transparent 0%, #000 26%)",
        }}
      />
      {/* Warms the shot back into the band and keeps the type legible over it. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(150,115,63,0.1) 0%, rgba(150,115,63,0.42) 55%, rgba(150,115,63,0.62) 100%)",
        }}
      />

      <div className="relative mx-auto max-w-[1180px] px-5 py-[clamp(2.25rem,5vw,3.5rem)] md:px-10">
        {/* ---- the claim ---- */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)] lg:gap-12">
          <div>
            <span
              className="nv-scream__card block text-[0.7rem] font-bold uppercase tracking-[0.18em]"
              style={{ color: "rgba(247,239,226,0.82)", animationDelay: "0.05s" }}
            >
              Sexual wellness &nbsp;&middot;&nbsp; For women
            </span>
            <h2
              className={`nv-scream__card ${TITLE} mt-3 text-[clamp(2rem,5vw,3.4rem)] leading-[1.06]`}
              style={{ color: CREAM_TEXT, animationDelay: "0.15s" }}
            >
              <span className="block">More feeling</span>
              <span className="block">More you</span>
            </h2>
            <Link
              to={startTo}
              className="nv-scream__card mt-6 inline-flex rounded-full border px-7 py-3 text-[0.9rem] font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10"
              style={{ ...NOTE, color: CREAM_TEXT, animationDelay: "0.3s" }}
            >
              Start Your Assessment
            </Link>
          </div>

          <p
            className="nv-scream__card max-w-[44ch] text-[0.88rem] font-semibold leading-relaxed lg:pt-1"
            style={{ color: CREAM_TEXT, animationDelay: "0.45s" }}
          >
            A compounded prescription cream created for women&rsquo;s sexual wellness and formulated
            for local application
          </p>
        </div>

        {/* ---- the stage: bottle in the middle, notes pinned around it ---- */}
        <div className="relative mt-8 hidden h-[clamp(22rem,34vw,30rem)] lg:block">
          {/* Four layers, one transform each: the outer centres, the next
              carries the entry, the span holds the tilt and the float is on the
              image. They would overwrite each other on one element. */}
          {/* Over the stage's own height, and pulled up by half the difference
              so it stays centred on it: the bottle fills only 53% of its
              canvas, so the element has to run well past the stage for the
              bottle itself to read at the size the comp gives it. */}
          <span className="pointer-events-none absolute left-1/2 top-[-16%] h-[132%] -translate-x-1/2">
            <span className="nv-scream__bottle block h-full">
              <span className="block h-full rotate-6">
                <img
                  src="/site/sexual-health/scream-bottle.avif"
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="nv-float block h-full w-auto max-w-none object-contain drop-shadow-[0_22px_38px_rgba(60,42,16,0.38)]"
                />
              </span>
            </span>
          </span>
          {NOTES.map((n) => (
            <React.Fragment key={n.label}>
              <span
                aria-hidden="true"
                className={`nv-scream__rule absolute h-px ${n.rule} ${
                  n.box.startsWith("right") ? "nv-scream__rule--rtl" : ""
                }`}
                style={{ background: SCREAM_RULE, animationDelay: `${n.delay + 0.2}s` }}
              />
              <Note note={n} stage />
            </React.Fragment>
          ))}
        </div>

        {/* ---- below lg the stage cannot hold: bottle, then the notes ---- */}
        <div className="mt-8 lg:hidden">
          <span className="nv-scream__bottle mx-auto block w-fit">
            <span className="block rotate-6">
              <img
                src="/site/sexual-health/scream-bottle.avif"
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="nv-float pointer-events-none block h-[clamp(14rem,52vw,20rem)] w-auto object-contain drop-shadow-[0_22px_38px_rgba(60,42,16,0.38)]"
              />
            </span>
          </span>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {NOTES.map((n) => (
              <Note key={n.label} note={n} />
            ))}
          </div>
        </div>

        <p
          className="nv-scream__card mt-8 text-[0.74rem] italic leading-relaxed"
          style={{ color: "rgba(247,239,226,0.62)", animationDelay: "1.45s" }}
        >
          Prescription required. Eligibility determined by a licensed provider
        </p>
      </div>
    </div>
  );
}

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
      <style>{`
        .nv-scream__card { opacity: 0; transform: translateY(14px); }
        .nv-scream.is-in .nv-scream__card {
          animation: nvScreamCard 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes nvScreamCard { to { opacity: 1; transform: none; } }

        .nv-scream__rule { transform: scaleX(0); transform-origin: left; }
        .nv-scream__rule--rtl { transform-origin: right; }
        .nv-scream.is-in .nv-scream__rule {
          animation: nvScreamRule 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes nvScreamRule { to { transform: scaleX(1); } }

        /* The bottle keeps its tilt through the entry, so the rotation is part
           of both ends of the keyframe rather than being wiped by it. */
        .nv-scream__bottle { opacity: 0; }
        .nv-scream.is-in .nv-scream__bottle {
          animation: nvScreamBottle 900ms cubic-bezier(0.22, 1, 0.36, 1) 0.5s both;
        }
        @keyframes nvScreamBottle {
          from { opacity: 0; transform: translateY(18px) scale(0.94); }
          to   { opacity: 1; transform: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .nv-scream__card, .nv-scream__bottle { opacity: 1 !important; transform: none !important; animation: none !important; }
          .nv-scream__rule { transform: none !important; animation: none !important; }
        }
      `}</style>

      <MoreFeelingHero startTo={startTo} />
      <MoreFeeling startTo={startTo} />
      <MomentsThatMatter />
      <KeepTheRoutine />
    </section>
  );
}
