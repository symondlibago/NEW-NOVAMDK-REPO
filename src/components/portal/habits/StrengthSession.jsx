import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion as Motion } from "framer-motion";
import { AlertCircle, Check, Pause, Play, SkipForward, Volume2, VolumeX } from "lucide-react";
import { POINTS, STRENGTH_PER_WEEK } from "../../../lib/habits";
import { buzz } from "../../../lib/haptics";
import { Confetti, PointsPop } from "./Celebrate";
import MoveFigure from "./MoveFigure";
import Sheet from "./Sheet";

/* Five moves at home, no equipment, two rounds, about ten minutes. General
   movement only, with the same check-with-your-care-team line every session.
   Guided since 2026-10-24 (client, after Noom and Hims): a timer per move, a
   rest between, a drawn demo of each move, sound cues and a finish screen. A
   move with a `video` plays that clip instead of the drawing. */
const MOVES = [
  { name: "Sit to stand", how: "Sit near the front of a sturdy chair. Stand up, then sit back down slowly.", reps: "10 times", pose: "sitStand" },
  { name: "Wall push-up", how: "Hands on the wall at shoulder height. Bend your elbows, then push back.", reps: "10 times", pose: "wallPush" },
  { name: "Glute bridge", how: "Lie on your back, knees bent. Lift your hips, hold for a breath, lower.", reps: "10 times", pose: "bridge" },
  { name: "Calf raise", how: "Hold a counter. Rise onto your toes, then lower slowly.", reps: "15 times", pose: "calfRaise" },
  { name: "Bird dog", how: "On hands and knees, reach one arm and the opposite leg out. Hold, then switch.", reps: "5 each side", pose: "birdDog" },
];
const ROUNDS = 2;
const WORK = 45;
const REST = 20;
const STEPS = Array.from({ length: ROUNDS * MOVES.length }, (_, i) => ({
  move: MOVES[i % MOVES.length],
  round: Math.floor(i / MOVES.length) + 1,
  index: i % MOVES.length,
}));

/* Short tones, started from the Start tap so the browser allows them. */
function useCues(on) {
  const ctx = useRef(null);
  const start = useCallback(() => {
    try {
      ctx.current ||= new (window.AudioContext || window.webkitAudioContext)();
      ctx.current.resume?.();
    } catch {
      /* no sound here */
    }
  }, []);
  const tone = useCallback(
    (freq, ms = 140) => {
      const c = ctx.current;
      if (!on || !c) return;
      try {
        const o = c.createOscillator();
        const g = c.createGain();
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.25, c.currentTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + ms / 1000);
        o.connect(g).connect(c.destination);
        o.start();
        o.stop(c.currentTime + ms / 1000 + 0.05);
      } catch {
        /* no sound here */
      }
    },
    [on]
  );
  return { start, tone };
}

function Countdown({ left, total, size = 96, tone = "text-primary" }) {
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 80 80" className={`absolute inset-0 -rotate-90 ${tone}`} aria-hidden="true">
        <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="6" fill="none" opacity="0.15" />
        <Motion.circle
          cx="40"
          cy="40"
          r="35"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: Math.max(0, left) / total }}
          transition={{ duration: 1, ease: "linear" }}
        />
      </svg>
      <span className="text-2xl font-semibold tabular-nums text-ink" aria-live="off">
        {Math.floor(Math.max(0, left) / 60)}:{String(Math.max(0, left) % 60).padStart(2, "0")}
      </span>
    </span>
  );
}

function Demo({ move, className = "" }) {
  return (
    <div className={`overflow-hidden rounded-2xl bg-surface-2 ${className}`}>
      {move.video ? (
        <video src={move.video} autoPlay loop muted playsInline className="block aspect-video w-full object-cover" />
      ) : (
        <MoveFigure pose={move.pose} className="block aspect-video w-full p-2" />
      )}
    </div>
  );
}

export default function StrengthSession({ habits, open, onClose }) {
  const [phase, setPhase] = useState("intro"); // intro | work | rest | done
  const [step, setStep] = useState(0);
  const [left, setLeft] = useState(WORK);
  const [paused, setPaused] = useState(false);
  const [sound, setSound] = useState(true);
  const [gain, setGain] = useState(0);
  const cues = useCues(sound);
  const timed = open && (phase === "work" || phase === "rest");

  useEffect(() => {
    if (!open) return;
    setPhase("intro");
    setStep(0);
    setPaused(false);
  }, [open]);

  const finish = useCallback(() => {
    // The move ring's points only if nothing filled it earlier today.
    setGain(POINTS.strength + (habits.day.move ? 0 : POINTS.move));
    habits.addStrength();
    setPhase("done");
    cues.tone(988, 400);
    buzz(60);
  }, [habits, cues]);

  const advance = useCallback(() => {
    if (phase === "work") {
      if (step === STEPS.length - 1) return finish();
      setPhase("rest");
      setLeft(REST);
      cues.tone(523, 250);
    } else {
      setStep((n) => n + 1);
      setPhase("work");
      setLeft(WORK);
      cues.tone(784, 250);
    }
    buzz();
    setPaused(false);
  }, [phase, step, finish, cues]);

  // One tick a second; the last three seconds of each part get a soft tone.
  useEffect(() => {
    if (!timed || paused) return undefined;
    const t = setInterval(() => setLeft((n) => n - 1), 1000);
    return () => clearInterval(t);
  }, [timed, paused]);
  useEffect(() => {
    if (!timed) return;
    if (left <= 0) advance();
    else if (left <= 3) cues.tone(660, 90);
    // Runs on each tick only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  // Keeps a phone's screen on while a session runs, where the browser allows it.
  useEffect(() => {
    if (!timed || !navigator.wakeLock) return undefined;
    let lock = null;
    navigator.wakeLock
      .request("screen")
      .then((l) => (lock = l))
      .catch(() => {});
    return () => lock?.release().catch(() => {});
  }, [timed]);

  const begin = () => {
    cues.start();
    setStep(0);
    setLeft(WORK);
    setPhase("work");
    buzz();
  };

  const cur = STEPS[step];
  const upNext = STEPS[step + 1];
  const session = Math.min(habits.strengthDone + (phase === "done" ? 0 : 1), STRENGTH_PER_WEEK);

  const progress = (
    <div className="flex items-center gap-3">
      <span className="flex flex-1 gap-1" aria-hidden="true">
        {STEPS.map((_, n) => (
          <span key={n} className={`h-1.5 flex-1 rounded-full ${n < step || (n === step && phase === "rest") ? "bg-primary" : n === step ? "bg-primary/45" : "bg-line"}`} />
        ))}
      </span>
      <button
        type="button"
        onClick={() => setSound((v) => !v)}
        aria-label={sound ? "Turn sound off" : "Turn sound on"}
        className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
      >
        {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
      </button>
    </div>
  );

  return (
    <Sheet open={open} onClose={onClose} label="Strength in 10">
      {phase === "intro" && (
        <>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Strength in 10</p>
          <h2 className="mt-1 text-2xl leading-snug tracking-tight text-ink">
            Session {session} of {STRENGTH_PER_WEEK} this week
          </h2>
          <p className="mt-2 text-base text-muted">Five moves, two rounds, about 10 minutes. No equipment. We&rsquo;ll time each move for you.</p>

          <ul className="mt-5 divide-y divide-line rounded-2xl border border-line bg-surface">
            {MOVES.map((m) => (
              <li key={m.name} className="flex items-center gap-4 px-3 py-2.5">
                <span className="w-20 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                  <MoveFigure pose={m.pose} still ratio={4 / 3} className="block aspect-4/3 w-full" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold text-ink">{m.name}</span>
                  <span className="block text-sm text-muted">{m.reps}</span>
                </span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={begin}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-on-primary transition-colors hover:bg-primary-deep"
          >
            <Play size={17} /> Start
          </button>
          <p className="mt-4 flex gap-2 text-sm text-muted">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-primary" />
            New to exercise, or have joint or heart concerns? Check with your care team first. Stop if anything hurts.
          </p>
        </>
      )}

      {phase === "work" && (
        <>
          {progress}
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted">
            Round {cur.round} of {ROUNDS}, move {cur.index + 1} of {MOVES.length}
          </p>
          <Motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
            <Demo move={cur.move} className="mt-3" />
            <h2 className="mt-4 text-2xl leading-snug tracking-tight text-ink">{cur.move.name}</h2>
            <p className="mt-1 text-base text-muted">{cur.move.how}</p>
          </Motion.div>
          <div className="mt-5 flex items-center gap-4">
            <Countdown left={left} total={WORK} />
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-ink">{cur.move.reps}</p>
              <p className="text-sm text-muted">At your own pace. Tap Done when you finish.</p>
            </div>
          </div>
          <div className="mt-5 flex gap-2.5">
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Resume" : "Pause"}
              className="grid size-12 shrink-0 place-items-center rounded-full border border-line-strong text-ink transition-colors hover:border-primary"
            >
              {paused ? <Play size={18} /> : <Pause size={18} />}
            </button>
            <button
              type="button"
              onClick={advance}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-on-primary transition-colors hover:bg-primary-deep"
            >
              <Check size={17} /> Done
            </button>
          </div>
        </>
      )}

      {phase === "rest" && (
        <>
          {progress}
          <div className="mt-6 flex flex-col items-center text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">{upNext.round > cur.round ? "Round 2 next" : "Rest"}</p>
            <h2 className="mt-1 text-3xl tracking-tight text-ink">Breathe</h2>
            <div className="mt-5">
              <Countdown left={left} total={REST} size={132} tone="text-emerald-500" />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-line bg-surface p-3">
            <span className="w-24 shrink-0 overflow-hidden rounded-xl bg-surface-2">
              <MoveFigure pose={upNext.move.pose} ratio={4 / 3} className="block aspect-4/3 w-full" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold uppercase tracking-widest text-muted">Up next</span>
              <span className="block text-base font-semibold text-ink">{upNext.move.name}</span>
              <span className="block text-sm text-muted">{upNext.move.reps}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={advance}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-line-strong px-6 py-3 text-base font-semibold text-ink transition-colors hover:border-primary"
          >
            <SkipForward size={17} /> Skip rest
          </button>
        </>
      )}

      {phase === "done" && (
        <div className="text-center">
          <Motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 16 }}
            className="relative mx-auto grid size-20 place-items-center rounded-full bg-primary text-on-primary"
          >
            <Confetti burst={1} />
            <Check size={34} />
          </Motion.span>
          <h2 className="mt-5 text-3xl tracking-tight text-ink">Session done</h2>
          <p className="mt-2 text-base text-muted">
            {Math.min(habits.strengthDone, STRENGTH_PER_WEEK)} of {STRENGTH_PER_WEEK} this week. It fills today&rsquo;s move ring too.
          </p>
          <PointsPop points={gain} className="mt-3" />
          <button type="button" onClick={onClose} className="mt-6 w-full rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-on-primary transition-colors hover:bg-primary-deep">
            Done
          </button>
        </div>
      )}
    </Sheet>
  );
}
