import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion as Motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Lock, MapPin, X } from "lucide-react";
import { productsData, isCompounded, priceLabel } from "../components/data/products";
import { ComplianceBadges, CompoundedDisclaimer } from "../components/Compliance";
import { SCREENS, PICKS, GOAL_FOR_SLUG, CATEGORY_OF, firstScreenFor, choose, pathOf, stepsLeft } from "../components/quiz/quizData";
import { STATE_NAMES, isBlockedState } from "../lib/serviceArea";
import { productSlug, productPath } from "../lib/slug";
import { getLenis } from "../lib/smoothScroll";
import { track, EVENTS } from "../lib/analytics";
import Seo from "../components/Seo";

/* The quick assessment at /start: a goal, a few questions, then one treatment
   option to explore and a second one beside it. Copy and rules live in
   quizData.js. /start/<slug> (the menu's and category pages' links) starts
   past the goal question with that goal already chosen.

   One question to a screen in a single column, after Noom and Hers (client,
   2026-10-16): each question types itself in, its answers rise in after it,
   a tap ticks and glides on, and a short matching screen comes before the
   result. Everything is shown at once for anyone whose device asks for less
   motion. */

const BUTTON =
  "flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-bold text-on-primary transition-colors hover:bg-primary-deep disabled:pointer-events-none disabled:opacity-40";

const EASE = [0.22, 1, 0.36, 1];

/* Screens glide in from the side they are heading to. `custom` is the
   direction, which AnimatePresence also hands the screen that is leaving. */
const GLIDE = {
  enter: (dir) => ({ opacity: 0, x: 40 * dir }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: -40 * dir }),
};
const FADE = { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } };

/* The catalog record behind a pick, for its live price, photo and link. */
const productFor = (key) => productsData.find((p) => productSlug(p) === PICKS[key]?.slug);

function scrollTop() {
  const l = getLenis();
  if (l) l.scrollTo(0, { immediate: true });
  else window.scrollTo(0, 0);
}

/* Seconds until a heading has typed itself out, near enough, so what comes
   under it can start rising just before it finishes. The same pace as the
   sign-up steps' questions. */
const TYPE_START_MS = 150;
const typeStepMs = (text) => Math.min(30, 850 / Math.max(1, text.length));
const typingSeconds = (text) => (TYPE_START_MS + typeStepMs(text) * text.length * 0.8) / 1000;

/* A heading that types itself in, a letter at a time, with a gold caret. The
   untyped rest is already there but invisible, so the line never reflows, and
   screen readers get the whole sentence at once. */
function TypeLine({ text }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(() => (reduce ? text.length : 0));
  useEffect(() => {
    if (reduce) return undefined;
    let i = 0;
    let timer = setTimeout(function tick() {
      i += 1;
      setN(i);
      if (i < text.length) timer = setTimeout(tick, typeStepMs(text));
    }, TYPE_START_MS);
    return () => clearTimeout(timer);
  }, [text, reduce]);
  const shown = reduce ? text.length : n;
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.slice(0, shown)}
        {shown < text.length && (
          <span className="relative">
            <span className="absolute left-0 animate-pulse font-thin text-primary">|</span>
          </span>
        )}
        <span className="text-transparent">{text.slice(shown)}</span>
      </span>
    </>
  );
}

/* Rises a little as it fades in, a beat after the heading. */
function Rise({ delay = 0, className, children }) {
  const reduce = useReducedMotion();
  return (
    <Motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: EASE }}
    >
      {children}
    </Motion.div>
  );
}

function Heading({ screen }) {
  return (
    <>
      {screen.eyebrow && (
        <Rise>
          <p className="mb-2.5 text-sm font-semibold text-primary">{screen.eyebrow}</p>
        </Rise>
      )}
      <h1 className="text-3xl font-medium leading-tight tracking-tight lg:text-4xl">
        <TypeLine text={screen.h} />
      </h1>
      {screen.sub && (
        <Rise delay={typingSeconds(screen.h)}>
          <p className="mt-2.5 text-base text-muted">{screen.sub}</p>
        </Rise>
      )}
    </>
  );
}

/* The tick in an answer, which pops in when it is picked. */
function Tick({ on, round }) {
  return (
    <span
      className={`grid size-5.5 flex-none place-items-center border-2 transition-colors ${round ? "rounded-full" : "rounded-md"} ${
        on ? "border-primary bg-primary" : "border-line-strong"
      }`}
    >
      <Motion.span initial={false} animate={{ scale: on ? 1 : 0 }} transition={{ type: "spring", stiffness: 520, damping: 22 }}>
        <Check className="size-3 text-ink" strokeWidth={3} />
      </Motion.span>
    </span>
  );
}

function Question({ id, screen, value, onPick }) {
  const multi = screen.type === "multi";
  /* The goal screen's answers sit two across from sm, as tiles. */
  const tiles = id === "goal";
  const start = typingSeconds(screen.h) + (screen.sub ? 0.15 : 0);
  return (
    <>
      <Heading screen={screen} />
      <div className={`mt-6 grid gap-2.5 ${tiles ? "sm:grid-cols-2" : ""}`} role="group" aria-label={screen.h}>
        {screen.opts.map((o, i) => {
          const on = multi ? (value || []).includes(o.v) : value === o.v;
          const Icon = o.icon;
          return (
            <Rise key={o.v} delay={start + i * 0.06}>
              <Motion.button
                type="button"
                aria-pressed={on}
                onClick={() => onPick(o)}
                whileTap={{ scale: 0.98 }}
                className={`flex min-h-16 w-full items-center gap-3.5 rounded-2xl border-2 px-4 py-3.5 text-left text-base transition-colors ${
                  on ? "border-primary bg-surface-2/60 font-semibold" : "border-line bg-surface font-medium hover:border-line-strong"
                }`}
              >
                {Icon && (
                  <span
                    className={`grid size-10 flex-none place-items-center rounded-full transition-colors ${
                      on ? "bg-primary text-on-primary" : "bg-surface-2 text-primary"
                    }`}
                  >
                    <Icon className="size-5" strokeWidth={1.8} />
                  </span>
                )}
                <span className="flex-1">
                  {o.t}
                  {o.hint && <span className="mt-0.5 block text-sm font-normal text-muted">{o.hint}</span>}
                </span>
                <Tick on={on} round={!multi} />
              </Motion.button>
            </Rise>
          );
        })}
      </div>
      <Rise delay={start + screen.opts.length * 0.06 + 0.1}>
        <p className="mt-5 flex items-center gap-2 text-sm text-muted">
          <Lock className="size-3.5 flex-none" />
          Your answers stay in your browser and aren&rsquo;t sent anywhere.
        </p>
      </Rise>
    </>
  );
}

function StateQuestion({ screen, value, onChange }) {
  const start = typingSeconds(screen.h) + 0.15;
  return (
    <>
      <Heading screen={screen} />
      <Rise delay={start}>
        <label className="mt-6 flex items-center gap-3.5 rounded-2xl border-2 border-line bg-surface px-4 py-2 focus-within:border-primary">
          <span className="grid size-10 flex-none place-items-center rounded-full bg-surface-2 text-primary">
            <MapPin className="size-5" strokeWidth={1.8} />
          </span>
          <span className="sr-only">State</span>
          <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="h-12 w-full flex-1 cursor-pointer bg-transparent text-base font-medium text-ink outline-none"
          >
            <option value="" disabled>
              Select your state
            </option>
            {STATE_NAMES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </Rise>
      <Rise delay={start + 0.1}>
        <p className="mt-5 flex items-center gap-2 text-sm text-muted">
          <Lock className="size-3.5 flex-none" />
          Your answers stay in your browser and aren&rsquo;t sent anywhere.
        </p>
      </Rise>
    </>
  );
}

/* A "good to know" card: the topic's icon with two soft rings spreading out
   behind it, then the note. */
function Note({ screen }) {
  const reduce = useReducedMotion();
  const Icon = screen.icon;
  const after = typingSeconds(screen.h);
  return (
    <div className="rounded-3xl bg-surface-2/50 px-7 py-8">
      {Icon && (
        <div className="relative mb-6 grid size-16 place-items-center">
          {!reduce &&
            [0, 1].map((i) => (
              <Motion.span
                key={i}
                className="absolute inset-0 rounded-full border-2 border-primary/40"
                initial={{ scale: 1, opacity: 0.7 }}
                animate={{ scale: 1.9, opacity: 0 }}
                transition={{ duration: 2.4, delay: i * 1.2, repeat: Infinity, ease: "easeOut" }}
              />
            ))}
          <Motion.span
            className="grid size-16 place-items-center rounded-full bg-primary text-on-primary"
            initial={reduce ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
          >
            <Icon className="size-7" strokeWidth={1.8} />
          </Motion.span>
        </div>
      )}
      <Rise>
        <p className="mb-2.5 text-sm font-semibold text-primary">Good to know</p>
      </Rise>
      <h1 className="text-3xl font-medium leading-tight tracking-tight lg:text-4xl">
        <TypeLine text={screen.h} />
      </h1>
      <Rise delay={after} className="mt-3 border-l-2 border-primary py-2 pl-5">
        <p className="max-w-prose text-lg leading-relaxed">{screen.p}</p>
        {screen.fine && <p className="mt-4 text-sm text-muted">{screen.fine}</p>}
      </Rise>
    </div>
  );
}

/* After Noom: a ring fills while three lines tick, then the result. */
const RING = 2 * Math.PI * 44;
function Matching({ screen, answers, onDone }) {
  const reduce = useReducedMotion();
  const total = reduce ? 0.9 : 2.6;
  const lines = ["Your goal", "What you prefer", `What ships to ${answers.state || "your state"}`];
  useEffect(() => {
    const t = setTimeout(onDone, total * 1000 + 350);
    return () => clearTimeout(t);
    // Once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="flex flex-col items-center pt-6 text-center lg:pt-12">
      <div className="relative grid size-32 place-items-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r="44" fill="none" strokeWidth="6" className="stroke-line" />
          <Motion.circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className="stroke-primary"
            strokeDasharray={RING}
            initial={{ strokeDashoffset: RING }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: total, ease: "easeInOut" }}
          />
        </svg>
        <Motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: total, type: "spring", stiffness: 420, damping: 20 }}
          className="grid size-14 place-items-center rounded-full bg-primary text-on-primary"
        >
          <Check className="size-7" strokeWidth={2.6} />
        </Motion.span>
      </div>
      <h1 className="mt-8 text-3xl font-medium leading-tight tracking-tight lg:text-4xl">
        <TypeLine text={screen.h} />
      </h1>
      <ul className="mt-6 grid gap-3 text-left">
        {lines.map((line, i) => (
          <Motion.li
            key={line}
            className="flex items-center gap-3 text-base"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (total / 3) * i + 0.3, duration: 0.4, ease: EASE }}
          >
            <span className="relative size-6 rounded-full border border-line-strong">
              <Motion.span
                className="absolute -inset-px grid place-items-center rounded-full bg-primary text-on-primary"
                initial={reduce ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: (total / 3) * (i + 1), type: "spring", stiffness: 500, damping: 20 }}
              >
                <Check className="size-3.5" strokeWidth={3} />
              </Motion.span>
            </span>
            {line}
          </Motion.li>
        ))}
      </ul>
    </div>
  );
}

function NotServed({ state }) {
  return (
    <Rise>
      <p className="mb-2.5 text-sm font-semibold text-primary">Based on your answers</p>
      <h1 className="text-3xl font-medium leading-tight tracking-tight lg:text-4xl">We&rsquo;re not in {state} yet</h1>
      <p className="mt-3 text-base text-muted">
        Nova MDK can&rsquo;t offer care to patients in {state} right now. Thank you for thinking of us.
      </p>
      <Link to="/" className={`${BUTTON} mt-6`}>
        Back to the homepage <ArrowRight className="size-4" />
      </Link>
    </Rise>
  );
}

function Result({ answers }) {
  const reduce = useReducedMotion();
  const { lead, alt, why } = choose(answers, productFor);
  const p = lead && productFor(lead);
  const other = alt && productFor(alt);
  /* Nothing on this path ships to their state, or a catalog rename left the
     pick without a page: send them to the shelf rather than show a broken
     card. */
  if (!p) {
    return (
      <Rise>
        <h1 className="text-3xl font-medium leading-tight tracking-tight lg:text-4xl">Let&rsquo;s look at everything together</h1>
        <p className="mt-3 text-base text-muted">
          The options for this goal aren&rsquo;t available in {answers.state || "your state"} right now. Other treatments may be.
        </p>
        <Link to="/treatments" className={`${BUTTON} mt-6`}>
          See all treatments <ArrowRight className="size-4" />
        </Link>
      </Rise>
    );
  }
  const pick = PICKS[lead];
  return (
    <>
      <Rise>
        <p className="mb-2.5 text-sm font-semibold text-primary">Based on your answers</p>
      </Rise>
      <h1 className="text-3xl font-medium leading-tight tracking-tight lg:text-4xl">
        <TypeLine text="A treatment option to explore" />
      </h1>
      <Motion.div
        className="mt-5 overflow-hidden rounded-3xl border-2 border-primary bg-surface nv-shadow"
        initial={reduce ? false : { opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.35, type: "spring", stiffness: 170, damping: 22 }}
      >
        <div className="flex items-center gap-4 bg-surface-2/50 p-5 sm:p-6">
          <Motion.span
            className="grid size-24 flex-none place-items-center rounded-2xl bg-surface sm:size-28"
            initial={reduce ? false : { rotate: -6, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.55, type: "spring", stiffness: 220, damping: 16 }}
          >
            <img src={p.img} alt={pick.name} className="h-20 w-auto object-contain sm:h-24" />
          </Motion.span>
          <div className="min-w-0">
            <span className="mb-1.5 inline-block rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-muted">{p.categoryName}</span>
            <h2 className="text-xl font-semibold leading-tight tracking-tight lg:text-2xl">{pick.name}</h2>
            <p className="text-sm text-muted">{pick.form}</p>
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <ComplianceBadges compounded={isCompounded(p)} rx={!p.otc} className="mb-3.5" />
          <ul className="mb-4 space-y-1.5">
            {why.map((line, i) => (
              <Motion.li
                key={line}
                className="flex gap-2.5 text-sm"
                initial={reduce ? false : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.25, duration: 0.4, ease: EASE }}
              >
                <Check className="mt-0.5 size-4 flex-none text-primary" strokeWidth={2.4} />
                <span>{line}</span>
              </Motion.li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between border-t border-line pt-3.5 text-sm text-muted">
            <span>{p.exactPrice ? "Price" : "Starting at"}</span>
            <b className="text-2xl font-semibold tracking-tight text-ink">{priceLabel(p)}</b>
          </div>
        </div>
      </Motion.div>

      <Rise delay={1.2} className="mt-5 flex flex-col">
        {/* Straight into the sign-up on the product page, which opens on
            ?start=1, so a visitor who is ready skips a page. */}
        <Link to={`${productPath(p)}?start=1`} className={BUTTON}>
          Start my visit <ArrowRight className="size-4" />
        </Link>
        <Link to={productPath(p)} className="mt-3 text-center text-sm font-semibold text-primary underline underline-offset-4">
          See treatment details
        </Link>
        <p className="mt-3 text-center text-sm text-muted">
          This quiz is general information, not medical advice. A licensed provider reviews your intake and decides whether any treatment is appropriate.
        </p>
      </Rise>

      {other && (
        <Rise delay={1.35}>
          <Link to={productPath(other)} className="mt-4 flex items-center gap-3.5 rounded-2xl border border-line px-3.5 py-3 hover:border-line-strong">
            <img src={other.img} alt="" className="size-13 rounded-xl bg-surface-2/50 object-contain p-1" />
            <span className="flex-1">
              <small className="block text-xs text-muted">Another option to explore</small>
              <b className="text-base font-semibold">{PICKS[alt].name}</b>
            </span>
            <ChevronRight className="size-4" />
          </Link>
        </Rise>
      )}

      {isCompounded(p) && <CompoundedDisclaimer className="mt-6" />}
    </>
  );
}

export default function Consult() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const preset = GOAL_FOR_SLUG[slug];

  /* trail is every screen before this one, so Back can retrace any path. */
  const [answers, setAnswers] = useState(() => (preset ? { goal: preset } : {}));
  const [trail, setTrail] = useState(() => (preset ? ["goal"] : []));
  const [cur, setCur] = useState(() => (preset ? firstScreenFor(preset) : "goal"));
  const [moving, setMoving] = useState(false);
  // Continue pressed before anything was picked: say what's missing.
  const [nudge, setNudge] = useState(false);
  /* 1 forward, -1 back: which way the screens glide. */
  const [dir, setDir] = useState(1);

  useEffect(() => {
    track(EVENTS.QUIZ_STARTED, { slug: slug || "start" });
  }, [slug]);

  useEffect(() => {
    scrollTop();
    if (cur === "result") {
      // The category only: no answers, no state and no product leave the page.
      track(EVENTS.QUIZ_COMPLETED, { slug: slug || "start", goal: CATEGORY_OF[pathOf(answers)] });
    }
    // Fires on arrival at a screen, not on every answer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur]);

  const screen = SCREENS[cur];
  const go = (next) => {
    setDir(1);
    setNudge(false);
    setTrail((t) => [...t, cur]);
    setCur(next);
  };
  const back = () => {
    /* The matching screen moves on by itself, so Back steps over it. */
    const t = trail[trail.length - 1] === "matching" ? trail.slice(0, -1) : trail;
    if (!t.length) return navigate("/treatments");
    setDir(-1);
    setNudge(false);
    setCur(t[t.length - 1]);
    setTrail(t.slice(0, -1));
  };
  const exit = () => navigate("/");

  const pick = (o) => {
    if (screen.type === "multi") {
      const prev = answers[cur] || [];
      let nextVals;
      if (prev.includes(o.v)) nextVals = prev.filter((v) => v !== o.v);
      else if (o.only) nextVals = [o.v];
      else nextVals = prev.filter((v) => !screen.opts.find((x) => x.v === v && x.only)).concat(o.v);
      setAnswers((a) => ({ ...a, [cur]: nextVals }));
      return;
    }
    /* One choice moves straight on, after a beat so the tick is seen. */
    if (moving) return;
    setMoving(true);
    const nextAnswers = { ...answers, [cur]: o.v };
    setAnswers(nextAnswers);
    setTimeout(() => {
      setMoving(false);
      go(screen.next(nextAnswers));
    }, 380);
  };

  const answered =
    screen.type === "multi" ? (answers[cur] || []).length > 0 : screen.type === "state" ? Boolean(answers.state) : answers[cur] != null;
  const showContinue =
    screen.type === "note" || screen.type === "multi" || screen.type === "state" || (screen.type === "single" && answered && !moving);
  const left = cur === "result" ? 0 : stepsLeft(cur, answers);
  const progress = cur === "result" ? 100 : Math.max(6, Math.round((trail.length / (trail.length + left)) * 100));

  return (
    <main className="flex min-h-screen w-full flex-col bg-bg text-ink">
      <Seo title="Find a Starting Point" noindex />
      <header className="sticky top-0 z-20 flex-none border-b border-line bg-bg">
        <div className="mx-auto grid h-16 max-w-3xl grid-cols-3 items-center px-3">
          <button
            type="button"
            onClick={back}
            aria-label="Back"
            className={`grid size-11 place-items-center rounded-full hover:bg-surface-2/50 ${trail.length || cur !== "goal" ? "" : "invisible"}`}
          >
            <ChevronLeft className="size-5" />
          </button>
          <img src="/logo-2026.png" alt="Nova MDK" className="h-8 w-auto justify-self-center" />
          <button type="button" onClick={exit} aria-label="Exit quiz" className="grid size-11 place-items-center justify-self-end rounded-full hover:bg-surface-2/50">
            <X className="size-4.5" />
          </button>
        </div>
        <div className="h-1 bg-line">
          <Motion.div
            className="h-full rounded-r-full bg-primary"
            initial={false}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.6, ease: EASE }}
          />
        </div>
      </header>

      <section className={`mx-auto w-full max-w-xl flex-1 overflow-x-hidden px-5 pt-8 lg:pt-14 ${showContinue ? "pb-36" : "pb-12"}`}>
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <Motion.div
            key={cur}
            aria-live="polite"
            custom={dir}
            variants={reduce ? FADE : GLIDE}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: EASE }}
          >
            {(screen.type === "single" || screen.type === "multi") && (
              <Question id={cur} screen={screen} value={answers[cur]} onPick={pick} />
            )}
            {screen.type === "state" && (
              <StateQuestion screen={screen} value={answers.state} onChange={(v) => setAnswers((a) => ({ ...a, state: v }))} />
            )}
            {screen.type === "note" && <Note screen={screen} />}
            {screen.type === "matching" && <Matching screen={screen} answers={answers} onDone={() => go("result")} />}
            {screen.type === "result" &&
              (isBlockedState(answers.state) ? <NotServed state={answers.state} /> : <Result answers={answers} />)}
          </Motion.div>
        </AnimatePresence>

        {showContinue && (
          /* Pinned to the foot of a phone screen; in the flow on desktop. */
          <div className="fixed inset-x-0 bottom-0 z-10 bg-linear-to-t from-bg from-70% to-transparent px-5 pb-6 pt-4 lg:static lg:bg-none lg:px-0 lg:pb-0 lg:pt-8">
            <div className="mx-auto max-w-xl lg:max-w-none">
              {nudge && !answered && (
                <p role="alert" className="mb-3 text-center text-sm font-semibold text-primary-deep">
                  {screen.type === "state" ? "Choose your state to continue." : "Pick at least one to continue."}
                </p>
              )}
              <button
                type="button"
                className={BUTTON}
                onClick={() => (answered || screen.type === "note" ? go(screen.next(answers)) : setNudge(true))}
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
