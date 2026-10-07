import React from "react";
import { Link } from "react-router-dom";
import { CircleCheck } from "lucide-react";
import Reveal from "../ui/Reveal";
import useRunOnceInView from "../../lib/useRunOnceInView";

const INK = "#544529";
const BROWN = "#9a8154";
/* The two ends of the "simple" ramp, read off the comp. */
const TAN_DEEP = "#9c8452";
const TAN_PALE = "#d0bd99";
const BODY = "#7a6d58";

/* The cream panel behind the three benefits, and the hairlines that divide it. */
const CARD_TAN = "#f2e9dd";
const RULE_TAN = "#dfd0bb";
const RULE_BRASS = "#c3a475";

const CARD_R = "rounded-[calc(26px*var(--nv-r-scale,1))]";
const TITLE = "nv-weight-keep font-display font-extrabold";
const BODY_SIZE = "text-[clamp(0.86rem,1.15vw,0.98rem)]";

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
    body: "Applied vaginally as directed by your healthcare provider. Dosing is determined based on individual patient needs",
    /* The comp sets the copy on the photograph under this one rather than
       inside the card. */
    split: true,
    box: "left-0 top-[52%] w-[30%]",
    rule: "left-[30%] top-[62%] w-[8%]",
    delay: 0.95,
  },
  {
    label: "What is it?",
    body: "A compounded vaginal cream formulated with L-Arginine, Oxytocin, and Niacin for women's sexual wellness",
    split: false,
    box: "right-0 top-[33%] w-[26%]",
    rule: "right-[26%] top-[45%] w-[7%]",
    delay: 1.1,
  },
  {
    label: "What is it used for?",
    body: "Used to support blood flow, sensitivity, responsiveness, and sexual pleasure",
    split: true,
    box: "right-[1%] top-[70%] w-[27%]",
    rule: "right-[28%] top-[76%] w-[7%]",
    delay: 1.25,
  },
];

/* ---- 1. designed for a more responsive experience ----
   Three columns in one cream panel, divided by hairlines rather than split into
   separate cards: the comp draws them as one object. */
const BENEFITS = [
  { t: "Blood Flow", body: "Formulated to increase local blood flow" },
  { t: "Sensitivity + Responsiveness", body: "Designed to support sensitivity and sexual responsiveness" },
  { t: "Provider-Directed Use", body: "Use according to the dose and instructions provided by your prescriber" },
];

/* ---- 2. keep the routine simple ----
   Note for review: steps 1 and 2 carry the same sentence in the client's comp.
   It is reproduced as drawn rather than guessed at, because inventing a line
   for step 2 would be writing clinical copy that nobody has approved. */
const STEPS = [
  { t: "Apply", body: "Use the amount prescribed by your provider on the external intimate area" },
  { t: "Give it a little time", body: "Use the amount prescribed by your provider on the external intimate area" },
  {
    t: "Let the moment happen",
    body: "No complicated routine. Just follow your provider's instructions and continue with your evening",
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
            A compounded prescription cream for women&rsquo;s sexual wellness, formulated to support
            blood flow, sensitivity, responsiveness, and intimacy
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
          {/* Scaled back for the Euphoria render (2026-09-26): the bottle fills
              80% of its canvas where the old file filled 53%, so the same box
              would have drawn it half again as large. */}
          <span className="pointer-events-none absolute left-1/2 top-[6%] h-[88%] -translate-x-1/2">
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
                className="nv-float pointer-events-none block h-[clamp(9rem,34vw,13rem)] w-auto object-contain drop-shadow-[0_22px_38px_rgba(60,42,16,0.38)]"
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

/* ------------------ 1. designed for a more responsive experience ------------------ */

function ResponsiveExperience() {
  return (
    <div className="mx-auto max-w-[1180px] px-5 py-[clamp(2.5rem,6vw,4.5rem)] md:px-10">
      <Reveal>
        <h2
          className={`${TITLE} mx-auto max-w-[20ch] text-center text-[clamp(1.6rem,4vw,2.6rem)] leading-[1.14]`}
          style={{ color: BROWN }}
        >
          Designed for a more responsive experience
        </h2>
      </Reveal>

      <Reveal delay={0.08}>
        {/* One panel, divided by hairlines, as the comp draws it. The dividers
            are borders on the columns rather than elements of their own, so they
            disappear with the stack below sm instead of needing to be hidden. */}
        <div
          className={`mt-[clamp(1.75rem,3.5vw,2.75rem)] grid gap-8 px-6 py-8 sm:grid-cols-3 sm:gap-0 sm:px-4 sm:py-10 ${CARD_R}`}
          style={{ background: CARD_TAN }}
        >
          {BENEFITS.map((b, i) => (
            <div
              key={b.t}
              className={`sm:px-7 ${i > 0 ? "sm:border-l" : ""}`}
              style={i > 0 ? { borderColor: RULE_TAN } : undefined}
            >
              <h3
                className="flex items-center gap-2.5 font-display text-[clamp(1rem,1.5vw,1.12rem)] font-bold leading-tight"
                style={{ color: INK }}
              >
                <CircleCheck size={19} strokeWidth={2.2} className="shrink-0" style={{ color: BROWN }} />
                {b.t}
              </h3>
              <p className={`mt-2.5 max-w-[34ch] leading-[1.55] ${BODY_SIZE}`} style={{ color: BODY }}>
                {b.body}
              </p>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}

/* --------------------------- 2. keep the routine --------------------------- */
/* The brass "A little support, right where you want it" card and the numbered
   steps went on 2026-09-08 with the compliance pass. The 2026-10-08 comp brings
   a three-step routine back, in the client's own wording. */

function KeepTheRoutine() {
  const [ref, running] = useRunOnceInView("-80px");

  return (
    <div
      ref={ref}
      className={`nv-routine mx-auto max-w-[1180px] px-5 pb-[clamp(2.5rem,6vw,4.5rem)] md:px-10 ${
        running ? "is-in" : ""
      }`}
    >
      <Reveal>
        <h2 className={`${TITLE} text-[clamp(1.6rem,4vw,2.6rem)] leading-[1.14]`} style={{ color: INK }}>
          <span className="block">Keep the routine</span>
          <span
            className="block bg-clip-text text-transparent"
            style={{ backgroundImage: `linear-gradient(90deg, ${TAN_DEEP} 0%, ${TAN_PALE} 100%)` }}
          >
            simple
          </span>
        </h2>
      </Reveal>

      <div className="relative mt-[clamp(2rem,4.5vw,3.5rem)] grid gap-9 sm:grid-cols-3 sm:gap-6">
        {/* The rail runs between the first and last circle, not the full width,
            so it does not hang past either end. Stacked below sm there is
            nothing for it to join, so it is simply not drawn. */}
        <span
          aria-hidden="true"
          className="nv-routine__rail pointer-events-none absolute left-[16.67%] right-[16.67%] top-6 hidden h-px sm:block"
          style={{ background: RULE_BRASS }}
        />
        {STEPS.map((s, i) => (
          <div
            key={s.t}
            className="nv-routine__step relative text-center"
            style={{ animationDelay: `${0.3 + i * 0.16}s` }}
          >
            <span
              className="mx-auto grid h-12 w-12 place-items-center rounded-full border-2 font-display text-[1.1rem] font-bold"
              /* Opaque, so the rail passes behind the circle rather than
                 through it. */
              style={{ borderColor: RULE_BRASS, color: BROWN, background: "#faf8f4" }}
            >
              {i + 1}
            </span>
            <h3
              className="mt-5 font-display text-[clamp(1rem,1.6vw,1.15rem)] font-bold leading-tight"
              style={{ color: INK }}
            >
              {s.t}
            </h3>
            <p className={`mx-auto mt-2.5 max-w-[32ch] leading-[1.55] ${BODY_SIZE}`} style={{ color: BODY }}>
              {s.body}
            </p>
          </div>
        ))}
      </div>
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

        /* The routine's rail draws itself between the circles, then the three
           steps arrive along it. */
        .nv-routine__rail { transform: scaleX(0); transform-origin: left; }
        .nv-routine.is-in .nv-routine__rail {
          animation: nvRoutineRail 760ms cubic-bezier(0.22, 1, 0.36, 1) 0.15s both;
        }
        @keyframes nvRoutineRail { to { transform: scaleX(1); } }

        .nv-routine__step { opacity: 0; transform: translateY(12px); }
        .nv-routine.is-in .nv-routine__step {
          animation: nvRoutineStep 560ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes nvRoutineStep { to { opacity: 1; transform: none; } }

        @media (prefers-reduced-motion: reduce) {
          .nv-scream__card, .nv-scream__bottle { opacity: 1 !important; transform: none !important; animation: none !important; }
          .nv-scream__rule { transform: none !important; animation: none !important; }
          .nv-routine__rail { transform: none !important; animation: none !important; }
          .nv-routine__step { opacity: 1 !important; transform: none !important; animation: none !important; }
        }
      `}</style>

      <MoreFeelingHero startTo={startTo} />
      <ResponsiveExperience />
      <KeepTheRoutine />
    </section>
  );
}
