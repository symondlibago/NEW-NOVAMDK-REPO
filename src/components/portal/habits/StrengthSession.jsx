import React, { useEffect, useState } from "react";
import { AlertCircle, Check, Dumbbell } from "lucide-react";
import { STRENGTH_PER_WEEK } from "../../../lib/habits";
import Sheet from "./Sheet";

/* Five moves at home, no equipment, about ten minutes. General movement only,
   with the same check-with-your-care-team line every session. Demo videos can
   sit in each row once the clips are chosen. */
const MOVES = [
  { name: "Sit to stand", how: "Sit near the front of a sturdy chair. Stand up, then sit back down slowly.", reps: "10 times" },
  { name: "Wall push-up", how: "Hands on the wall at shoulder height. Bend your elbows, then push back.", reps: "10 times" },
  { name: "Glute bridge", how: "Lie on your back, knees bent. Lift your hips, hold for a breath, lower.", reps: "10 times" },
  { name: "Calf raise", how: "Hold a counter. Rise onto your toes, then lower slowly.", reps: "15 times" },
  { name: "Bird dog", how: "On hands and knees, reach one arm and the opposite leg out. Hold, then switch.", reps: "5 each side" },
];

export default function StrengthSession({ habits, open, onClose }) {
  const [ticked, setTicked] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTicked([]);
    setSaved(false);
  }, [open]);

  const flip = (i) => setTicked((t) => (t.includes(i) ? t.filter((x) => x !== i) : [...t, i]));
  const all = ticked.length === MOVES.length;
  const session = Math.min(habits.strengthDone + (saved ? 0 : 1), STRENGTH_PER_WEEK);

  const finish = () => {
    habits.addStrength();
    setSaved(true);
  };

  return (
    <Sheet open={open} onClose={onClose} label="Strength in 10">
      {saved ? (
        <div className="text-center">
          <span className="mx-auto grid size-20 place-items-center rounded-full bg-primary text-on-primary">
            <Check size={34} />
          </span>
          <h2 className="mt-5 text-3xl tracking-tight text-ink">Session done</h2>
          <p className="mt-2 text-base text-muted">
            {Math.min(habits.strengthDone, STRENGTH_PER_WEEK)} of {STRENGTH_PER_WEEK} this week. It counts toward your active days.
          </p>
          <button type="button" onClick={onClose} className="mt-6 w-full rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-on-primary transition-colors hover:bg-primary-deep">
            Done
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Strength in 10</p>
          <h2 className="mt-1 text-2xl leading-snug tracking-tight text-ink">
            Session {session} of {STRENGTH_PER_WEEK} this week
          </h2>
          <p className="mt-2 text-base text-muted">Five moves, about 10 minutes. Tap a move when you finish it.</p>

          <ul className="mt-5 divide-y divide-line rounded-2xl border border-line bg-surface">
            {MOVES.map((m, i) => {
              const done = ticked.includes(i);
              return (
                <li key={m.name}>
                  <button type="button" role="checkbox" aria-checked={done} onClick={() => flip(i)} className="flex w-full items-center gap-4 px-4 py-4 text-left">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface-2 text-base font-semibold text-primary-deep">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-base font-semibold ${done ? "text-muted line-through decoration-line-strong" : "text-ink"}`}>{m.name}</span>
                      <span className="mt-0.5 block text-sm leading-snug text-muted">
                        {m.how} {m.reps}.
                      </span>
                    </span>
                    <span className={`grid size-7 shrink-0 place-items-center rounded-full border-2 ${done ? "border-primary bg-primary text-on-primary" : "border-line-strong text-transparent"}`}>
                      <Check size={15} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={finish}
            disabled={!all}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-on-primary transition-colors hover:bg-primary-deep disabled:opacity-40"
          >
            <Dumbbell size={17} /> {all ? "Finish session" : `${ticked.length} of ${MOVES.length} done`}
          </button>
          <p className="mt-4 flex gap-2 text-sm text-muted">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-primary" />
            New to exercise, or have joint or heart concerns? Check with your care team first. Stop if anything hurts.
          </p>
        </>
      )}
    </Sheet>
  );
}
