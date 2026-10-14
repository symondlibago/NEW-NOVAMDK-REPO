import React, { useState } from "react";
import { ArrowRight, Check, Flame } from "lucide-react";
import { useHabits, usePatientId } from "../../../lib/habits";
import HabitCheckin from "./HabitCheckin";

/* Home's one line on weekly habits: the streak, and the check-in when it is
   due. Kept to a strip, because Home has to fit a phone screen with a visit
   already on it. */
export default function HabitsHomeCard({ onNavigate }) {
  const pid = usePatientId();
  const habits = useHabits(pid);
  const [open, setOpen] = useState(false);
  if (!pid) return null;

  return (
    <section className="mt-6 md:mt-10">
      {/* On a phone the button drops to its own full-width row, so the text
          beside the flame never has to squeeze. */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-primary/30 bg-linear-to-br from-primary/15 to-primary/5 p-4 sm:flex-nowrap sm:gap-5 sm:p-5">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
          <Flame size={22} />
        </span>
        <div className="min-w-0 flex-1 basis-0">
          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-base font-semibold text-ink">
            Weekly habits
            {habits.streak > 0 && (
              <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-primary-deep">
                {habits.streak} week{habits.streak === 1 ? "" : "s"} in a row
              </span>
            )}
          </p>
          <p className="mt-0.5 text-sm text-muted sm:truncate">
            {habits.done
              ? habits.goal
                ? `Done for this week. Focus: ${habits.goal.label}`
                : "Done for this week."
              : "Your check-in is ready. About a minute."}
          </p>
        </div>
        {habits.done ? (
          <button
            type="button"
            onClick={() => onNavigate("progress")}
            className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-full border border-primary/40 bg-surface px-4 py-2.5 text-sm font-semibold text-primary-deep transition-colors hover:border-primary sm:w-auto"
          >
            <Check size={15} /> See progress
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-deep sm:w-auto sm:py-2.5"
          >
            Check in <ArrowRight size={15} />
          </button>
        )}
      </div>
      <HabitCheckin habits={habits} open={open} onClose={() => setOpen(false)} onSeeProgress={() => onNavigate("progress")} />
    </section>
  );
}
