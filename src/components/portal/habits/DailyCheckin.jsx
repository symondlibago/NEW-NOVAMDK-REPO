import React, { useEffect, useState } from "react";
import { Check, Dumbbell, Flame, Footprints, GlassWater, MessageSquare } from "lucide-react";
import { FACES, MOODS, POINTS, WATER_GOAL } from "../../../lib/habits";
import { buzz } from "../../../lib/haptics";
import { Confetti, DayRings, PointsPop } from "./Celebrate";
import Sheet from "./Sheet";

const ringsOf = (day) => ({
  checkin: day.mood != null ? 1 : 0,
  water: (day.water || 0) / WATER_GOAL,
  move: day.move ? 1 : 0,
});

/* Eight glasses; a tap fills up to that glass, a tap on the last full one
   empties it, so a slip is one tap to undo. */
export function WaterTapper({ habits, onGoal }) {
  const water = habits.day.water || 0;
  const set = (n) => {
    habits.setWater(n);
    buzz(15);
    if (n >= WATER_GOAL && water < WATER_GOAL) onGoal?.();
  };
  return (
    <div className="grid grid-cols-8 gap-1.5" role="group" aria-label={`Water, ${water} of ${WATER_GOAL} glasses`}>
      {Array.from({ length: WATER_GOAL }, (_, i) => {
        const full = i < water;
        return (
          <button
            key={i}
            type="button"
            onClick={() => set(i + 1 === water ? i : i + 1)}
            aria-label={`${i + 1} glass${i ? "es" : ""}`}
            aria-pressed={full}
            className={`grid aspect-square place-items-center rounded-xl border transition-all active:scale-90 ${
              full ? "border-sky-500 bg-sky-500 text-white" : "border-line bg-surface text-muted hover:border-sky-500"
            }`}
          >
            <GlassWater size={18} />
          </button>
        );
      })}
    </div>
  );
}

function MoveChoices({ habits, onStrength, onWalk }) {
  if (habits.day.move) {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3 text-base font-semibold text-ink">
        <span className="grid size-7 place-items-center rounded-full bg-emerald-500 text-white">
          <Check size={15} />
        </span>
        {habits.day.move === "strength" ? "Strength in 10 done" : "Walk logged"}
      </p>
    );
  }
  const choice = "flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 text-left transition-colors hover:border-emerald-500";
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      <button type="button" onClick={onStrength} className={choice}>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
          <Dumbbell size={18} />
        </span>
        <span>
          <span className="block text-base font-semibold text-ink">Strength in 10</span>
          <span className="block text-sm text-muted">Guided, at home</span>
        </span>
      </button>
      <button type="button" onClick={onWalk} className={choice}>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
          <Footprints size={18} />
        </span>
        <span>
          <span className="block text-base font-semibold text-ink">I took a walk</span>
          <span className="block text-sm text-muted">20 minutes or more</span>
        </span>
      </button>
    </div>
  );
}

/* Move on its own, from Home's Move tile: a walk or Strength in 10. */
export function MoveSheet({ habits, open, onClose, onStrength }) {
  const [burst, setBurst] = useState(0);
  useEffect(() => {
    if (open) setBurst(0);
  }, [open]);
  const walk = () => {
    habits.logWalk();
    buzz();
    setBurst((n) => n + 1);
  };
  return (
    <Sheet open={open} onClose={onClose} label="Move today">
      <div className="text-center">
        <span className="relative mx-auto grid size-16 place-items-center rounded-full bg-emerald-500 text-white">
          <Confetti burst={burst} />
          {burst ? <Check size={30} /> : <Footprints size={28} />}
        </span>
        <h2 className="mt-4 text-2xl tracking-tight text-ink">{burst ? "Nice walk" : "Move today"}</h2>
        <p className="mt-1 text-base text-muted">{burst ? "That fills today's move ring." : "A walk or a short workout both count."}</p>
        {burst > 0 && <PointsPop points={POINTS.move} className="mt-3" />}
      </div>
      <div className="mt-6">
        <MoveChoices habits={habits} onStrength={onStrength} onWalk={walk} />
      </div>
      <button type="button" onClick={onClose} className="mt-6 w-full rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-on-primary transition-colors hover:bg-primary-deep">
        Done
      </button>
    </Sheet>
  );
}

/* The daily check-in: one tap on how today feels fills the first ring, then
   water and movement fill the other two, here or from Home. A rough or low day
   offers Messages, the same as the weekly check-in. */
export default function DailyCheckin({ habits, open, onClose, onMessage, onStrength }) {
  const [step, setStep] = useState("mood");
  const [burst, setBurst] = useState(0);
  const [earned, setEarned] = useState(0);
  const [checked, setChecked] = useState(false);
  const day = habits.day;

  useEffect(() => {
    if (!open) return;
    setStep(day.mood == null ? "mood" : "today");
    setBurst(0);
    setEarned(0);
    setChecked(false);
    // Only on opening: checking in moves this on by itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const celebrate = (points) => {
    buzz();
    setBurst((n) => n + 1);
    setEarned(points);
  };

  const pick = (n) => {
    habits.checkInDay(n);
    setChecked(true);
    setStep("today");
    celebrate(POINTS.checkin);
  };

  const walk = () => {
    habits.logWalk();
    celebrate(POINTS.move);
  };

  const rings = ringsOf(day);
  const streak = habits.dayStreak;

  return (
    <Sheet open={open} onClose={onClose} label="Daily check-in">
      {step === "mood" ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Daily check-in</p>
          <h2 className="mt-1 text-2xl leading-snug tracking-tight text-ink">How are you feeling today?</h2>
          <p className="mt-2 text-base text-muted">One tap. It fills your first ring.</p>
          <div className="mt-6 grid grid-cols-5 gap-2">
            {MOODS.map((label, n) => (
              <button
                key={label}
                type="button"
                onClick={() => pick(n)}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-surface px-1 py-4 text-xs font-semibold text-ink transition-all hover:border-primary active:scale-95"
              >
                <span className="text-3xl" aria-hidden="true">
                  {FACES[n]}
                </span>
                {label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <Confetti burst={burst} />
              <DayRings {...rings} size={132} />
            </div>
            <h2 className="mt-4 text-2xl tracking-tight text-ink">{checked ? "You're checked in" : "Today"}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-base font-semibold text-primary-deep">
              <Flame size={17} />
              {streak} day{streak === 1 ? "" : "s"} in a row
            </p>
            <PointsPop key={burst} points={earned} className="mt-3" />
          </div>

          {day.mood != null && day.mood <= 1 && (
            <div className="mt-6 rounded-2xl border border-line bg-surface p-4">
              <p className="text-base text-ink">Sorry today is a hard one. Your care team reads every message.</p>
              <button type="button" onClick={onMessage} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                <MessageSquare size={15} /> Message your care team
              </button>
            </div>
          )}

          <section className="mt-6">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-base font-semibold text-ink">Water</p>
              <p className="text-sm text-muted">
                {day.water || 0} of {WATER_GOAL} glasses
              </p>
            </div>
            <div className="mt-3">
              <WaterTapper habits={habits} onGoal={() => celebrate(POINTS.water)} />
            </div>
          </section>

          <section className="mt-6">
            <p className="text-base font-semibold text-ink">Move</p>
            <div className="mt-3">
              <MoveChoices habits={habits} onStrength={onStrength} onWalk={walk} />
            </div>
          </section>

          <button type="button" onClick={onClose} className="mt-7 w-full rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-on-primary transition-colors hover:bg-primary-deep">
            Done
          </button>
        </>
      )}
    </Sheet>
  );
}
