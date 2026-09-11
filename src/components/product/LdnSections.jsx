import React from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
/* Aliased: the project lint rule does not count `motion.span` as a use of the
   lowercase binding, so the capitalised alias keeps this file clean. */
import { motion as Motion } from "framer-motion";
import Reveal from "../ui/Reveal";

/* Matched to Reveal's own easing and trigger margin so the ladder's rules and
   the words they lead to are sequenced by one clock rather than two. */
const EASE = [0.2, 0.7, 0.3, 1];
const VIEWPORT_MARGIN = "-80px 0px -80px 0px";
/* One rung per 0.62s: the rule draws, then its word lands, then the next rule
   starts. */
const RUNG_MS = 0.62;
const RULE_DUR = 0.4;
const WORD_LAG = 0.34;

const INK = "#6b511e";
const INK_DEEP = "#5a4620";
const BODY = "#7a6d58";
const CREAM = "#f7e9c9";
const CREAM_SOFT = "rgba(247,233,201,0.84)";
const SERIF = "'Playfair Display', Georgia, serif";
const PANEL = "#f7f1e5";
const LINE = "#e3d5b8";
const BRASS = "radial-gradient(circle at 50% 50%, #c1a27a, #9a7843)";

/* Measured off the comp as fractions of the copy column and of the ladder's own
   height. The rules are NOT attached to their labels there — two of the four sit
   in the gaps between rows entirely — so label and rule carry separate
   coordinates and neither is derived from the other. */
const ENDORPHIN_ROWS = [
  // Canva uses a short elbow under the first item, two straight rules in the
  // middle, and another elbow above the final item. Keeping the rule geometry
  // separate from the labels prevents the ladder from looking like a table.
  /* Evenly stepped at 30% now: the old 0 / 36 / 55 / 90 left gaps of 36, 19 and
     35, which is what made the cascade look bunched in the middle. The lefts
     keep the comp's diagonal. */
  {
    label: { top: "0%", left: "39.5%" },
    rule: { top: "13%", left: "53%", width: "30%" },
    shape: "elbow-down",
  },
  {
    label: { top: "30%", left: "18.5%" },
    rule: { top: "30%", left: "33.7%", width: "61%" },
    shape: "straight",
  },
  {
    label: { top: "60%", left: "8.1%" },
    rule: { top: "60%", left: "43.5%", width: "49%" },
    shape: "straight",
  },
  {
    label: { top: "90%", left: "34%" },
    rule: { top: "77%", left: "53%", width: "37%" },
    shape: "elbow-up",
  },
];
const CARD_R = "rounded-[calc(26px*var(--nv-r-scale,1))]";
const TILE_R = "rounded-[calc(18px*var(--nv-r-scale,1))]";
const TITLE = "nv-weight-keep font-display font-extrabold leading-[1.14]";
const TITLE_SIZE = "text-[clamp(1.6rem,3.4vw,2.5rem)]";
const BODY_SIZE = "text-[clamp(0.82rem,1.02vw,0.95rem)]";

/* The comp ramps its tail words left to right, dark gold into pale tan — the
   same construction the Sermorelin and Scream Cream blocks use. */
const TAN_DEEP = "#9c8452";
const TAN_PALE = "#d0bd99";

function Tail({ children }) {
  return (
    <span
      className="bg-clip-text text-transparent"
      style={{ backgroundImage: `linear-gradient(90deg, ${TAN_DEEP} 0%, ${TAN_PALE} 100%)` }}
    >
      {children}
    </span>
  );
}

/* ------------------------------ 1. a lower dose ------------------------------ */

function ALowerDose({ startTo }) {
  return (
    <div className="mx-auto max-w-[1180px] px-5 py-[clamp(2.5rem,6vw,4.5rem)] md:px-10">
      <div className="grid items-center gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)]">
        <Reveal as="div">
          <h2 className={`${TITLE} ${TITLE_SIZE} max-w-[12ch]`} style={{ color: INK }}>
            A lower <Tail>dose</Tail>
          </h2>

          <p className={`mt-5 max-w-[52ch] leading-relaxed ${BODY_SIZE}`} style={{ color: BODY }}>
            LDN uses a much smaller amount of naltrexone than its standard FDA-approved uses. At low
            doses, it temporarily interacts with opioid receptors and may influence natural endorphin
            signaling and inflammatory pathways
          </p>

          {/* Pale button on the light ground, per the comp — the solid brass CTA
              belongs to the closing band, not here. */}
          <Link
            to={startTo}
            className="mt-7 inline-flex rounded-full px-9 py-3.5 text-[0.92rem] font-semibold transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: "#f0e3cb", color: INK }}
          >
            Explore LDN
          </Link>

          <p className="mt-[clamp(2rem,4vw,3.5rem)] max-w-[46ch] text-[0.76rem] italic leading-relaxed text-muted">
            Prescription required. Eligibility is determined by a licensed healthcare provider.
            Individual results may vary.
          </p>
        </Reveal>

        <Reveal as="div" delay={0.08}>
          <div className={`relative aspect-[3/2] w-full overflow-hidden ${CARD_R}`}>
            <img
              src="/site/sports-medicine/ldn-lower.avif"
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

/* --------------------------- 2. why the dose matters --------------------------- */

const DOSE_POINTS = [
  "Standard naltrexone is used at much higher doses.",
  "LDN uses a much smaller provider-guided dose.",
  "That lower amount may support a different response in the body.",
];

const DOSE_CARDS = [
  { label: "Standard naltrexone", amount: "50 mg", note: "Standard-dose naltrexone" },
  { label: "Low-dose naltrexone", amount: "1.5–4.5 mg", note: "Much smaller provider-guided dose" },
];

function WhyTheDose() {
  return (
    <div className="mx-auto max-w-[1180px] px-5 pb-[clamp(2.5rem,6vw,4.5rem)] md:px-10">
      <Reveal>
        <div
          className={`px-5 py-8 sm:px-10 sm:py-16 lg:px-14 lg:py-20 ${CARD_R}`}
          style={{ background: PANEL }}
        >
          <div className="grid gap-8 sm:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
            {/* -------- left: the claim -------- */}
            <div>
              <span className="nv-eyebrow">Why the dose matters</span>

              {/* Serif here and nowhere else in the block, as the comp sets it. */}
              <h2
                className="nv-weight-keep mt-3 max-w-[14ch] text-[clamp(1.6rem,4.2vw,3.1rem)] font-medium leading-[1.14]"
                style={{ color: INK_DEEP, fontFamily: SERIF }}
              >
                Why does the &ldquo;low dose&rdquo; matter?
              </h2>

              <span aria-hidden="true" className="mt-5 block h-px w-16 sm:mt-6" style={{ background: LINE }} />

              <ul className="mt-6 flex flex-col gap-3.5 sm:mt-9 sm:gap-5">
                {DOSE_POINTS.map((p) => (
                  <li key={p} className="flex items-start gap-3.5">
                    <span
                      className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border"
                      style={{ borderColor: LINE }}
                    >
                      <Check size={13} strokeWidth={3} style={{ color: INK }} />
                    </span>
                    <span className="text-[clamp(0.92rem,1.15vw,1.05rem)]" style={{ color: BODY }}>
                      {p}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* -------- right: the comparison -------- */}
            <div>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                {DOSE_CARDS.map((c) => (
                  <div
                    key={c.label}
                    className={`border px-4 py-5 text-center sm:py-8 ${TILE_R}`}
                    style={{ background: "#fdfaf3", borderColor: LINE }}
                  >
                    <span className="block font-mono text-[0.64rem] uppercase tracking-[0.14em] text-muted">
                      {c.label}
                    </span>
                    <span
                      aria-hidden="true"
                      className="mx-auto mt-4 block h-px w-full"
                      style={{ background: LINE }}
                    />
                    <span
                      className="mt-4 block whitespace-nowrap text-[clamp(1.45rem,2.5vw,2.2rem)] leading-none sm:mt-6"
                      style={{ color: "#8a6a2f", fontFamily: SERIF }}
                    >
                      {c.amount}
                    </span>
                    <span className="mt-3 block text-[0.86rem] leading-snug sm:mt-5" style={{ color: BODY }}>
                      {c.note}
                    </span>
                  </div>
                ))}
              </div>

              {/* The scale. Ticks are a repeating gradient rather than eleven
                  elements, so the spacing stays even at any width. */}
              <div className="mt-6 sm:mt-8">
                <div className="relative flex items-center">
                  <span
                    aria-hidden="true"
                    className="h-px w-full"
                    style={{
                      backgroundImage: `linear-gradient(90deg, ${LINE} 0 100%)`,
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2"
                    style={{
                      backgroundImage: `repeating-linear-gradient(90deg, ${LINE} 0 1px, transparent 1px 10%)`,
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute left-0 h-3 w-3 rounded-full"
                    style={{ background: "#b1873f" }}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute right-0 h-3 w-3 rounded-full border-2"
                    style={{ borderColor: "#b1873f", background: PANEL }}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between text-[0.8rem]" style={{ color: BODY }}>
                  <span>1 mg</span>
                  <span>Dose (mg)</span>
                  <span>50 mg</span>
                </div>
              </div>

              <span aria-hidden="true" className="mt-6 block h-px w-full sm:mt-8" style={{ background: LINE }} />

              <p
                className="mt-6 text-center text-[clamp(1.1rem,1.9vw,1.45rem)] sm:mt-8"
                style={{ color: INK_DEEP, fontFamily: SERIF }}
              >
                Same active ingredient. Different dosing approach.
              </p>

              <span
                aria-hidden="true"
                className="mx-auto mt-4 block h-px w-16"
                style={{ background: LINE }}
              />

              <p className="mt-5 text-center text-[0.78rem] italic leading-relaxed text-muted">
                Illustrative comparison. Dosing is individualized by a licensed healthcare provider.
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

/* ------------------------------ 3. the mechanism ------------------------------ */

const MECHANISM = [
  {
    img: "/site/sports-medicine/ldn-pathways.avif",
    label: "Broader pathways",
    body: "Endorphins and related signaling are involved in pain perception, mood, inflammation, and immune activity",
  },
  {
    img: "/site/sports-medicine/ldn-cells.avif",
    label: "LDN",
    body: "Briefly interacts with opioid receptors",
  },
  {
    img: "/site/sports-medicine/ldn-blockade.avif",
    label: "Temporary blockade",
    body: "Natural endorphins are temporarily displaced",
  },
  {
    img: "/site/sports-medicine/ldn-rebound.avif",
    label: "Rebound response",
    body: "The body may increase endorphin signaling",
  },
];

const MECH_MS = 5000;
/* The seats are spaced by their gaps, not by round numbers: the old tops left
   28px between the top pair and 8px between the bottom pair, which read as the
   stack drifting. Every gap is 24px now (148 + 24 = 172, 196 + 24 = 392), and
   the off-stage seat sits one gap above the top one. */
const MECH_SLOTS = [
  { top: "392px", height: "148px", width: "78%", left: "11%", opacity: 0.75 },
  { top: "172px", height: "196px", width: "100%", left: "0%", opacity: 1 },
  { top: "0px", height: "148px", width: "78%", left: "11%", opacity: 0.75 },
  { top: "-172px", height: "148px", width: "78%", left: "11%", opacity: 0 },
];

const MECH_EASE = "cubic-bezier(0.22,1,0.36,1)";

function GlassCard({ item }) {
  return (
    <div
      className={`flex h-full min-h-[7.25rem] items-stretch gap-3 overflow-hidden border border-white/45 p-2.5 backdrop-blur-xl sm:min-h-[9.5rem] sm:gap-4 sm:p-3 md:min-h-0 ${TILE_R}`}
      style={{
        background: "rgba(240,227,203,0.28)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 30px rgba(96,74,40,0.07)",
      }}
    >
      <span className={`relative w-[38%] shrink-0 overflow-hidden ${TILE_R}`}>
        <img
          src={item.img}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      </span>
      <span className="flex min-w-0 flex-col justify-center py-2 pr-2">
        <span className="block font-mono text-[0.58rem] uppercase tracking-[0.14em]" style={{ color: INK }}>
          {item.label}
        </span>
        <span className="mt-2 block text-[0.78rem] leading-snug" style={{ color: BODY }}>
          {item.body}
        </span>
      </span>
    </div>
  );
}

function Mechanism() {
  const [step, setStep] = React.useState(0);
  const [staged, setStaged] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setStaged(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  React.useEffect(() => {
    if (!staged) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const t = setInterval(() => setStep((v) => v + 1), MECH_MS);
    return () => clearInterval(t);
  }, [staged]);

  return (
    <div className="mx-auto max-w-[1180px] px-5 pb-[clamp(2.5rem,6vw,4.5rem)] md:px-10">
      <Reveal>
        <span className="nv-eyebrow">The mechanism</span>
        <h2 className={`${TITLE} ${TITLE_SIZE} mt-3 max-w-[18ch]`} style={{ color: INK }}>
          A brief block can trigger a <Tail>bigger response</Tail>
        </h2>
      </Reveal>
      <div className="mt-[clamp(1.75rem,4vw,2.75rem)] flex flex-col gap-4 md:relative md:mx-auto md:block md:h-[34rem] md:max-w-[46rem] md:gap-0 md:overflow-hidden">
        {MECHANISM.map((m, i) => {
          const slot = MECH_SLOTS[(i + step) % MECH_SLOTS.length];
          return (
            <div
              key={m.label}
              className="md:absolute"
              style={
                staged
                  ? {
                      top: slot.top,
                      left: slot.left,
                      width: slot.width,
                      height: slot.height,
                      opacity: slot.opacity,
                      transition: `top 800ms ${MECH_EASE}, left 800ms ${MECH_EASE}, width 800ms ${MECH_EASE}, height 800ms ${MECH_EASE}, opacity 800ms ease`,
                    }
                  : undefined
              }
            >
              <GlassCard item={m} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------- 4. endorphins band ----------------------------- */

const ENDORPHINS = ["Pain signaling", "Mood", "Immune signaling", "Inflammatory pathways"];

function EndorphinsBand({ startTo }) {
  return (
    <div className="mx-auto max-w-[1180px] px-5 pb-[clamp(3rem,6vw,5rem)] md:px-10">
      <Reveal>
        <div
          className={`relative overflow-hidden px-6 pb-0 pt-8 sm:px-10 sm:pt-10 lg:h-[clamp(34rem,38vw,36.5rem)] lg:px-14 ${CARD_R}`}
          style={{ background: BRASS }}
        >
          <div className="grid items-end gap-6 lg:h-full lg:grid-cols-[minmax(0,1fr)_minmax(0,0.66fr)] lg:gap-10">
            <div className="pb-8 sm:pb-10 lg:flex lg:h-full lg:flex-col lg:items-start">
              <h2
                /* 16ch dropped "good" onto a line of its own. The break is set
                   where the comp sets it instead of left to the wrap. */
                className="nv-weight-keep max-w-[24ch] font-display text-[clamp(1.5rem,3.2vw,2.4rem)] font-extrabold leading-[1.14]"
                style={{ color: CREAM }}
              >
                Endorphins do more{" "}
                <span className="sm:block">than make you feel good</span>
              </h2>

              <p className={`mt-5 max-w-[56ch] leading-relaxed ${BODY_SIZE}`} style={{ color: CREAM_SOFT }}>
                Most people know endorphins as the chemicals behind a &ldquo;runner&rsquo;s
                high.&rdquo; But they also interact with systems{" "}
                {/* Held together so the colon can never be orphaned onto its own
                    line at any width. */}
                <span className="whitespace-nowrap">involved in:</span>
              </p>

              <Link
                to={startTo}
                className="mt-7 inline-flex rounded-full px-9 py-3.5 text-[0.92rem] font-semibold transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: "#f0e3cb", color: INK }}
              >
                Get Started
              </Link>
              {/* lg:mb-10 lifts the ladder off the card's bottom edge: with
                  mt-auto alone it sat flush against it. */}
              <ul className="mt-[clamp(1.5rem,3vw,2.25rem)] flex flex-col gap-3.5 sm:relative sm:block sm:h-[clamp(10.75rem,12vw,11.5rem)] sm:mt-[clamp(1.75rem,2.4vw,2.25rem)] lg:mt-auto lg:mb-14 lg:w-full">
                {ENDORPHINS.map((e, i) => (
                  <li key={e} className="contents sm:block">
                    {/* Each word waits for its own rule to finish drawing, so the
                        ladder reads rung by rung: line, word, line, word. */}
                    <Motion.span
                      className="flex items-center gap-3 sm:absolute sm:whitespace-nowrap"
                      style={ENDORPHIN_ROWS[i].label}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: VIEWPORT_MARGIN }}
                      transition={{ duration: 0.45, ease: EASE, delay: i * RUNG_MS + WORD_LAG }}
                    >
                      <span aria-hidden="true" className="relative grid h-3 w-3 shrink-0 place-items-center">
                        <span
                          className="absolute inset-0 rounded-full"
                          style={{ background: "radial-gradient(circle, rgba(253,246,230,0.75) 0%, rgba(253,246,230,0.22) 45%, rgba(253,246,230,0) 100%)" }}
                        />
                        <span className="relative h-1.5 w-1.5 rounded-full" style={{ background: "#fdf6e6" }} />
                      </span>
                      <span className="text-[0.92rem]" style={{ color: CREAM }}>
                        {e}
                      </span>
                    </Motion.span>

                    {/* Drawn left to right by clipping, not by scaling: the
                        elbows are borders, and scaling one would thin its
                        stroke as it grew. */}
                    <Motion.span
                      aria-hidden="true"
                      className="pointer-events-none hidden sm:absolute sm:block"
                      style={{
                        ...ENDORPHIN_ROWS[i].rule,
                        height: ENDORPHIN_ROWS[i].shape === "straight" ? "1px" : "14px",
                      }}
                      initial={{ clipPath: "inset(0 100% 0 0)" }}
                      whileInView={{ clipPath: "inset(0 0% 0 0)" }}
                      viewport={{ once: true, margin: VIEWPORT_MARGIN }}
                      transition={{ duration: RULE_DUR, ease: EASE, delay: i * RUNG_MS }}
                    >
                      <span
                        className="absolute inset-0 block"
                        style={
                          ENDORPHIN_ROWS[i].shape === "elbow-down"
                            ? {
                                borderLeft: "1px solid rgba(247,233,201,0.28)",
                                borderBottom: "1px solid rgba(247,233,201,0.28)",
                              }
                            : ENDORPHIN_ROWS[i].shape === "elbow-up"
                              ? {
                                  borderLeft: "1px solid rgba(247,233,201,0.28)",
                                  borderTop: "1px solid rgba(247,233,201,0.28)",
                                }
                              : { background: "rgba(247,233,201,0.28)" }
                        }
                      />
                    </Motion.span>
                  </li>
                ))}
              </ul>
            </div>

            {/* The cut-out sits on the brass with no frame, as the comp has it. */}
            <div className="relative flex items-end justify-center self-end lg:justify-end">
              <img
                src="/site/sports-medicine/ldn-endorphins.avif"
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="block h-auto w-[62%] max-w-[17rem] object-contain object-bottom sm:w-[42%] lg:w-full lg:max-w-none"
              />
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

export default function LdnSections({ startTo = "/start" }) {
  return (
    <section style={{ background: "#faf8f4" }}>
      <ALowerDose startTo={startTo} />
      <WhyTheDose />
      <Mechanism />
      <EndorphinsBand startTo={startTo} />
    </section>
  );
}
