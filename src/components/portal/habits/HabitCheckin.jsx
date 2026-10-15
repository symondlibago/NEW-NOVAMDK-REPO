import React, { useEffect, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { AlertCircle, ArrowRight, Check, ChevronLeft, Droplet, Egg, Flame, Footprints, HeartPulse, MessageSquare, Moon, Scale, Smile, Target, X } from "lucide-react";
import { FEELING_TIPS, QUESTIONS, SYMPTOMS, TIPS_APPROVED, goalById, suggestGoals } from "../../../lib/habits";

const ICON = { water: Droplet, sleep: Moon, active: Footprints, protein: Egg, energy: Smile, symptoms: HeartPulse, goal: Target, weight: Scale };
const FACES = ["😣", "😕", "😐", "🙂", "😄"];

const option =
  "flex w-full items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-left text-base font-semibold transition-colors";
const optionOff = "border-line bg-surface text-ink hover:border-primary";
const optionOn = "border-primary bg-primary text-on-primary";

/* One question per screen, big tap targets, about a minute end to end. A tap
   on an answer moves on by itself; Back is there for a slip. */
export default function HabitCheckin({ habits, open, onClose, onSeeProgress, onMessage }) {
  const lastGoal = habits.goal;
  const steps = [
    ...QUESTIONS.map((q) => q.key),
    "symptoms",
    ...(lastGoal ? ["goal"] : []),
    "weight",
    "done",
  ];
  const [i, setI] = useState(0);
  const [entry, setEntry] = useState({});
  const [weight, setWeight] = useState("");
  const [nextGoal, setNextGoal] = useState(null);

  useEffect(() => {
    if (!open) return;
    setI(0);
    setEntry({});
    setWeight("");
    setNextGoal(null);
  }, [open]);

  const step = steps[i];
  const q = QUESTIONS.find((x) => x.key === step);
  const Icon = ICON[step] || Flame;
  const asked = steps.length - 1;

  const pick = (key, value) => {
    setEntry((e) => ({ ...e, [key]: value }));
    setTimeout(() => setI((n) => n + 1), 180);
  };

  const finish = (w) => {
    const lb = Number(w);
    habits.saveWeek({ ...entry, goalId: lastGoal?.id || null, weight: w && lb > 50 && lb < 700 ? lb : null });
    setI(steps.length - 1);
  };

  const close = () => {
    if (nextGoal) habits.setGoal(nextGoal);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <Motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <Motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Weekly check-in"
            className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-bg shadow-2xl sm:rounded-3xl"
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 pt-5 sm:px-7 sm:pt-6">
              {step !== "done" && i > 0 ? (
                <button type="button" onClick={() => setI((n) => n - 1)} aria-label="Back" className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink">
                  <ChevronLeft size={20} />
                </button>
              ) : (
                <span className="size-9" />
              )}
              <span className="flex flex-1 gap-1.5" aria-hidden="true">
                {Array.from({ length: asked }, (_, n) => (
                  <span key={n} className={`h-1.5 flex-1 rounded-full ${n < i || step === "done" ? "bg-primary" : n === i ? "bg-primary/45" : "bg-line"}`} />
                ))}
              </span>
              <button type="button" onClick={close} aria-label="Close" className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink">
                <X size={20} />
              </button>
            </div>

            <div className="nv-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-7 pt-5 sm:px-7" data-lenis-prevent>
              <AnimatePresence mode="wait" initial={false}>
                <Motion.div
                  key={step}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.2 }}
                >
                  {step !== "done" && (
                    <>
                      <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                        <Icon size={22} />
                      </span>
                      <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted">
                        {i + 1} of {asked}
                      </p>
                    </>
                  )}

                  {q && (
                    <>
                      <h2 className="mt-1 text-2xl leading-snug tracking-tight text-ink">{q.title}</h2>
                      {q.hint && <p className="mt-2 text-base text-muted">{q.hint}</p>}
                      {q.count ? (
                        <div className="mt-6 grid grid-cols-4 gap-2.5">
                          {Array.from({ length: q.count + 1 }, (_, n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => pick(q.key, n)}
                              className={`h-16 rounded-2xl border text-xl font-semibold transition-colors ${entry[q.key] === n ? optionOn : optionOff}`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      ) : q.faces ? (
                        <div className="mt-6 grid grid-cols-5 gap-2">
                          {q.options.map((label, n) => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => pick(q.key, n)}
                              className={`flex flex-col items-center gap-1.5 rounded-2xl border px-1 py-4 text-xs font-semibold transition-colors ${entry[q.key] === n ? optionOn : optionOff}`}
                            >
                              <span className="text-3xl" aria-hidden="true">{FACES[n]}</span>
                              {label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-6 space-y-2.5">
                          {q.options.map((label, n) => (
                            <button key={label} type="button" onClick={() => pick(q.key, n)} className={`${option} ${entry[q.key] === n ? optionOn : optionOff}`}>
                              {label}
                              {entry[q.key] === n && <Check size={18} />}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {step === "symptoms" && (
                    <Symptoms
                      value={entry.symptoms}
                      onChange={(symptoms) => setEntry((e) => ({ ...e, symptoms }))}
                      onNext={() => setI((n) => n + 1)}
                    />
                  )}

                  {step === "goal" && (
                    <>
                      <h2 className="mt-1 text-2xl leading-snug tracking-tight text-ink">How did your goal go?</h2>
                      <p className="mt-2 text-base text-muted">{lastGoal.label}</p>
                      <div className="mt-6 space-y-2.5">
                        {["Did it", "Partly", "Not this week"].map((label, n) => (
                          <button key={label} type="button" onClick={() => pick("goalMet", 2 - n)} className={`${option} ${entry.goalMet === 2 - n ? optionOn : optionOff}`}>
                            {label}
                            {entry.goalMet === 2 - n && <Check size={18} />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {step === "weight" && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        finish(weight);
                      }}
                    >
                      <h2 className="mt-1 text-2xl leading-snug tracking-tight text-ink">Want to log your weight?</h2>
                      <p className="mt-2 text-base text-muted">Optional. Only you see it.</p>
                      <label className="mt-6 flex items-center gap-3 rounded-2xl border border-line bg-surface px-5 py-4 focus-within:border-primary">
                        <input
                          type="number"
                          inputMode="decimal"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          placeholder="0"
                          className="w-full bg-transparent text-3xl font-semibold text-ink outline-none placeholder:text-line-strong"
                          aria-label="Weight in pounds"
                        />
                        <span className="text-lg font-semibold text-muted">lb</span>
                      </label>
                      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse">
                        <button type="submit" disabled={!weight} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-on-primary transition-colors hover:bg-primary-deep disabled:opacity-40">
                          Save <ArrowRight size={16} />
                        </button>
                        <button type="button" onClick={() => finish("")} className="flex-1 rounded-full border border-line-strong px-6 py-3.5 text-base font-semibold text-ink hover:border-primary">
                          Skip
                        </button>
                      </div>
                    </form>
                  )}

                  {step === "done" && (
                    <Done habits={habits} entry={entry} lastGoal={lastGoal} nextGoal={nextGoal} onGoal={setNextGoal} onClose={close} onSeeProgress={onSeeProgress} onMessage={onMessage} />
                  )}
                </Motion.div>
              </AnimatePresence>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}

/* Anything bothering them this week. Several can be picked; "Nothing" stands
   alone and moves on by itself, like the single-answer questions. */
function Symptoms({ value = [], onChange, onNext }) {
  const toggle = (id) => {
    if (id === "none") {
      onChange([]);
      setTimeout(onNext, 180);
      return;
    }
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };
  return (
    <>
      <h2 className="mt-1 text-2xl leading-snug tracking-tight text-ink">Anything bothering you this week?</h2>
      <p className="mt-2 text-base text-muted">Pick any that apply.</p>
      <div className="mt-6 space-y-2.5">
        {SYMPTOMS.map((s) => {
          const on = s.id === "none" ? false : value.includes(s.id);
          return (
            <button key={s.id} type="button" aria-pressed={on} onClick={() => toggle(s.id)} className={`${option} ${on ? optionOn : optionOff}`}>
              {s.label}
              {on && <Check size={18} />}
            </button>
          );
        })}
      </div>
      {value.length > 0 && (
        <button type="button" onClick={onNext} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-on-primary transition-colors hover:bg-primary-deep">
          Continue <ArrowRight size={16} />
        </button>
      )}
    </>
  );
}

/* After a check-in that named a symptom: the care team, one tap away. The
   tips stay off until a provider has approved their wording. */
function CareTeamNote({ symptoms, onMessage }) {
  const named = SYMPTOMS.filter((s) => symptoms.includes(s.id));
  const list = named.map((s) => s.label.toLowerCase());
  const said = list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}` : list[0];
  return (
    <div className="mt-7 rounded-2xl border border-line bg-surface p-5 text-left">
      <p className="text-base font-semibold text-ink">You mentioned {said}.</p>
      <p className="mt-1 text-base text-muted">Send your care team a note so they know.</p>
      {TIPS_APPROVED && (
        <ul className="mt-3 space-y-2">
          {named.map((s) => (
            <li key={s.id} className="flex gap-2.5 text-base leading-snug text-muted">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              {FEELING_TIPS[s.id]}
            </li>
          ))}
        </ul>
      )}
      {onMessage && (
        <button type="button" onClick={onMessage} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-on-primary transition-colors hover:bg-primary-deep">
          <MessageSquare size={16} /> Message my care team
        </button>
      )}
      <p className="mt-3 flex gap-2 text-sm text-muted">
        <AlertCircle size={14} className="mt-0.5 shrink-0 text-primary" /> In an emergency, call 911.
      </p>
    </div>
  );
}

function Done({ habits, entry, lastGoal, nextGoal, onGoal, onClose, onSeeProgress, onMessage }) {
  const ideas = suggestGoals(entry, null);
  const chosen = nextGoal || lastGoal?.id || null;
  return (
    <div className="text-center">
      <Motion.span
        className="mx-auto grid size-20 place-items-center rounded-full bg-primary text-on-primary"
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
      >
        <Flame size={34} />
      </Motion.span>
      <h2 className="mt-5 text-3xl tracking-tight text-ink">
        {habits.streak > 1 ? `${habits.streak} weeks in a row` : "First week done"}
      </h2>
      <p className="mt-2 text-base text-muted">Nice work. Small steps add up.</p>

      {entry.symptoms?.length > 0 && (
        <CareTeamNote
          symptoms={entry.symptoms}
          onMessage={
            onMessage &&
            (() => {
              onClose();
              onMessage();
            })
          }
        />
      )}

      <div className="mt-7 text-left">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Pick a focus for next week</p>
        <div className="mt-3 space-y-2.5">
          {[...(lastGoal && !ideas.some((g) => g.id === lastGoal.id) ? [lastGoal] : []), ...ideas].slice(0, 3).map((g) => (
            <button key={g.id} type="button" onClick={() => onGoal(g.id)} className={`${option} ${chosen === g.id ? optionOn : optionOff}`}>
              {g.label}
              {chosen === g.id && <Check size={18} />}
            </button>
          ))}
        </div>
        {goalById(chosen) && <p className="mt-3 text-sm text-muted">You can change it any time on your Progress page.</p>}
      </div>

      <div className="mt-7 flex flex-col gap-2.5 sm:flex-row-reverse">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-on-primary transition-colors hover:bg-primary-deep"
        >
          Done
        </button>
        {onSeeProgress && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onSeeProgress();
            }}
            className="flex-1 rounded-full border border-line-strong px-6 py-3.5 text-base font-semibold text-ink hover:border-primary"
          >
            See my progress
          </button>
        )}
      </div>
    </div>
  );
}
