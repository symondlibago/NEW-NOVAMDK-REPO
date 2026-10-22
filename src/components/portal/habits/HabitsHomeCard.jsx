import React, { useState } from "react";
import { format } from "date-fns";
import { ArrowRight, Award, Check, Dumbbell, Flame, Syringe } from "lucide-react";
import { STRENGTH_PER_WEEK, useHabits, usePatientId } from "../../../lib/habits";
import { lessonState } from "../../../lib/lessons";
import { useMilestones } from "../../../lib/milestones";
import { nextSpot, shotStatus, spotLabel, useBodySex, useWeeklyShot } from "../../../lib/shots";
import HabitCheckin from "./HabitCheckin";
import { LessonSheet } from "./Lessons";
import ShotLogSheet from "./ShotLogSheet";
import StrengthSession from "./StrengthSession";

/* Home's one card for the week. It shows the next thing to do, in this order:
   the shot (patients on a weekly injection only), the check-in, then the two
   strength sessions. One card rather than three, because Home has to fit a
   phone screen with a visit already on it (client, 2026-10-14). Once those are
   done it offers the week's lesson, and a new milestone gets a chip. */
export default function HabitsHomeCard({ onNavigate }) {
  const pid = usePatientId();
  const habits = useHabits(pid);
  const shot = useWeeklyShot();
  const sex = useBodySex();
  const [open, setOpen] = useState(null); // "checkin" | "shot" | "strength" | "lesson"
  const [session, setSession] = useState(0);
  const milestones = useMilestones(habits, pid);
  if (!pid) return null;

  const shots = habits.data.shots || [];
  const s = shotStatus(shots, habits.data.shotDay);
  const shotDone = Boolean(shot) && !s.due;
  const strengthDone = habits.strengthDone >= STRENGTH_PER_WEEK;
  const lessons = lessonState(habits.data, habits.thisWeek);
  const lessonDue = !lessons.read.has(lessons.current.title);
  const next = shot && s.due ? "shot" : !habits.done ? "checkin" : !strengthDone ? "strength" : lessonDue ? "lesson" : "done";

  const streak =
    habits.streak > 0 ? (
      <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-primary-deep">
        {habits.streak} week{habits.streak === 1 ? "" : "s"} in a row
      </span>
    ) : null;

  const view = {
    shot: {
      icon: Syringe,
      title: !shots.length ? "Log your weekly shot" : s.today ? "Today is shot day" : s.late ? `Your shot was due ${format(s.next, "EEEE")}` : "Shot day",
      text: `Suggested spot: ${spotLabel(nextSpot(shots)).toLowerCase()}`,
      action: "Log my shot",
    },
    checkin: { icon: Flame, title: "Weekly habits", badge: streak, text: "Your check-in is ready. About a minute.", action: "Check in" },
    strength: {
      icon: Dumbbell,
      title: "Strength in 10",
      text: `Session ${habits.strengthDone + 1} of ${STRENGTH_PER_WEEK} this week. About 10 minutes.`,
      action: "Start",
    },
    lesson: { icon: Check, title: "All done this week", badge: streak, text: `New lesson: ${lessons.current.title}. 2 min.`, action: "Read lesson" },
    done: {
      icon: Check,
      title: "All done this week",
      badge: streak,
      text: shot && s.next ? `Next shot: ${format(s.next, "EEEE, MMM d")}` : habits.goal ? `Focus: ${habits.goal.label}` : "Nice work. Small steps add up.",
    },
  }[next];
  const Icon = view.icon;

  const steps = [
    ...(shot ? [{ key: "shot", label: "Shot", done: shotDone }] : []),
    { key: "checkin", label: "Check-in", done: habits.done },
    { key: "strength", label: `Strength ${Math.min(habits.strengthDone, STRENGTH_PER_WEEK)}/${STRENGTH_PER_WEEK}`, done: strengthDone },
  ];

  return (
    <section className="mt-6 md:mt-10">
      <div className="rounded-2xl border border-primary/30 bg-linear-to-br from-primary/15 to-primary/5 p-4 sm:p-5">
        {/* On a phone the button drops to its own full-width row, so the text
            beside the icon never has to squeeze. */}
        <div className="flex flex-wrap items-center gap-4 sm:flex-nowrap sm:gap-5">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
            <Icon size={22} />
          </span>
          <div className="min-w-0 flex-1 basis-0">
            <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-base font-semibold text-ink">
              {view.title}
              {view.badge}
            </p>
            <p className="mt-0.5 text-sm text-muted">{view.text}</p>
          </div>
          {next === "done" ? (
            <button
              type="button"
              onClick={() => onNavigate("progress")}
              className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-full border border-primary/40 bg-surface px-4 py-2.5 text-sm font-semibold text-primary-deep transition-colors hover:border-primary sm:w-auto"
            >
              See progress
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSession((n) => n + 1);
                setOpen(next);
              }}
              className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-deep sm:w-auto sm:py-2.5"
            >
              {view.action} <ArrowRight size={15} />
            </button>
          )}
        </div>

        <ul className="mt-4 flex flex-wrap gap-2" aria-label="This week">
          {steps.map((st) => (
            <li
              key={st.key}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${
                st.done
                  ? "border-primary bg-primary text-on-primary"
                  : st.key === next
                    ? "border-primary bg-surface text-primary-deep"
                    : "border-line bg-surface/70 text-muted"
              }`}
            >
              {st.done && <Check size={12} />}
              {st.label}
            </li>
          ))}
          {milestones.fresh.length > 0 && (
            <li>
              <button
                type="button"
                onClick={() => onNavigate("progress")}
                className="inline-flex items-center gap-1 rounded-full border border-primary bg-surface px-3 py-1 text-xs font-semibold text-primary-deep hover:bg-primary/10"
              >
                <Award size={12} /> New milestone
              </button>
            </li>
          )}
        </ul>
      </div>

      <HabitCheckin
        habits={habits}
        open={open === "checkin"}
        onClose={() => setOpen(null)}
        onSeeProgress={() => onNavigate("progress")}
        onMessage={() => onNavigate("messages")}
      />
      <ShotLogSheet habits={habits} open={open === "shot"} onClose={() => setOpen(null)} sex={sex} />
      <StrengthSession habits={habits} open={open === "strength"} onClose={() => setOpen(null)} />
      <LessonSheet
        lesson={lessons.current}
        session={session}
        open={open === "lesson"}
        onClose={() => setOpen(null)}
        onDone={() => {
          habits.markRead(lessons.current.title, lessons.start);
          setOpen(null);
        }}
      />
    </section>
  );
}
