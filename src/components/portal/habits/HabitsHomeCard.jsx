import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Award, BookOpen, Check, Dumbbell, Flame, Footprints, GlassWater, Minus, Smile, Star, Syringe } from "lucide-react";
import { FACES, MOODS, POINTS, STRENGTH_PER_WEEK, WATER_GOAL, useHabits, usePatientId } from "../../../lib/habits";
import { buzz } from "../../../lib/haptics";
import { lessonState } from "../../../lib/lessons";
import { useMilestones } from "../../../lib/milestones";
import { nextSpot, shotStatus, spotLabel, useBodySex, useWeeklyShot } from "../../../lib/shots";
import { Confetti, DayRings, PointsPop } from "./Celebrate";
import DailyCheckin, { MoveSheet } from "./DailyCheckin";
import HabitCheckin from "./HabitCheckin";
import { LessonSheet } from "./Lessons";
import ShotLogSheet from "./ShotLogSheet";
import StrengthSession from "./StrengthSession";

/* Home's one habits card. On top, today: three rings for checking in, water
   and moving, each a tile to tap (client, 2026-10-24, after Hims and Noom).
   Under them, the week: the shot for patients on a weekly injection, the
   weekly check-in, the two strength sessions and a new lesson, each a chip
   that opens it. Still one card, because Home has to fit a phone screen with
   a visit already on it (client, 2026-10-14). */
export default function HabitsHomeCard({ onNavigate }) {
  const pid = usePatientId();
  const habits = useHabits(pid);
  const shot = useWeeklyShot();
  const sex = useBodySex();
  const [open, setOpen] = useState(null); // "daily" | "move" | "checkin" | "shot" | "strength" | "lesson"
  const [session, setSession] = useState(0);
  const [burst, setBurst] = useState(0);
  const [pop, setPop] = useState(0);
  const milestones = useMilestones(habits, pid);

  useEffect(() => {
    if (!pop) return undefined;
    const t = setTimeout(() => setPop(0), 2400);
    return () => clearTimeout(t);
  }, [pop]);

  if (!pid) return null;

  const day = habits.day;
  const water = day.water || 0;
  const rings = { checkin: day.mood != null ? 1 : 0, water: water / WATER_GOAL, move: day.move ? 1 : 0 };
  const closed = rings.checkin + (water >= WATER_GOAL ? 1 : 0) + rings.move;

  const shots = habits.data.shots || [];
  const s = shotStatus(shots, habits.data.shotDay);
  const shotDone = Boolean(shot) && !s.due;
  const strengthDone = habits.strengthDone >= STRENGTH_PER_WEEK;
  const lessons = lessonState(habits.data, habits.thisWeek);
  const lessonDue = !lessons.read.has(lessons.current.title);
  const next = !habits.done ? "checkin" : !strengthDone ? "strength" : lessonDue ? "lesson" : null;

  const openSheet = (key) => {
    setSession((n) => n + 1);
    setOpen(key);
  };

  const addWater = (n) => {
    habits.setWater(n);
    buzz(15);
    if (n >= WATER_GOAL && water < WATER_GOAL) {
      setBurst((b) => b + 1);
      setPop(POINTS.water);
      buzz();
    }
  };

  const tile = "flex h-full w-full flex-col items-start rounded-xl border p-3 text-left transition-all active:scale-95";
  const chip = (done, on) =>
    `inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
      done ? "border-primary bg-primary text-on-primary" : on ? "border-primary bg-surface text-primary-deep" : "border-line bg-surface/70 text-muted hover:border-primary"
    }`;

  return (
    <section className="mt-6 md:mt-10">
      <div className="relative rounded-2xl border border-primary/30 bg-linear-to-br from-primary/15 to-primary/5 p-4 sm:p-5">
        <Confetti burst={burst} />

        <div className="flex items-center gap-4">
          <button type="button" onClick={() => openSheet("daily")} aria-label="Today's rings" className="shrink-0 rounded-full">
            <DayRings {...rings} size={72} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-ink">Today</p>
            <p className="mt-0.5 text-sm text-muted">
              {closed === 3 ? "All three rings closed. Nice work." : `${closed} of 3 rings closed`}
            </p>
            {pop ? (
              <PointsPop key={burst} points={pop} className="mt-1.5" />
            ) : (
              <p className="mt-1.5 flex flex-wrap gap-1.5">
                {habits.dayStreak > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-primary-deep">
                    <Flame size={12} /> {habits.dayStreak} day{habits.dayStreak === 1 ? "" : "s"}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onNavigate("progress")}
                  className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-primary-deep hover:bg-primary/10"
                >
                  <Star size={12} /> {habits.points} points
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Three across on every screen: the rings above, in the same order. */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => openSheet("daily")}
            className={`${tile} ${day.mood != null ? "border-primary/40 bg-primary/10" : "border-line bg-surface hover:border-primary"}`}
          >
            <span className="grid size-8 place-items-center rounded-full bg-primary/15 text-primary-deep">
              {day.mood != null ? <span className="text-lg leading-none">{FACES[day.mood]}</span> : <Smile size={16} />}
            </span>
            <span className="mt-2 text-sm font-semibold text-ink">Check in</span>
            <span className="text-xs text-muted">{day.mood != null ? `Feeling ${MOODS[day.mood].toLowerCase()}` : "How's today?"}</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => addWater(Math.min(WATER_GOAL, water + 1))}
              aria-label={`Add a glass of water, ${water} of ${WATER_GOAL} so far`}
              className={`${tile} ${water >= WATER_GOAL ? "border-sky-500/40 bg-sky-500/10" : "border-line bg-surface hover:border-sky-500"}`}
            >
              <span className="grid size-8 place-items-center rounded-full bg-sky-500/15 text-sky-600">
                <GlassWater size={16} />
              </span>
              <span className="mt-2 text-sm font-semibold text-ink">Water</span>
              <span className="text-xs text-muted">{water >= WATER_GOAL ? "Goal met" : water ? `${water} of ${WATER_GOAL}` : "Tap to add"}</span>
            </button>
            {water > 0 && (
              <button
                type="button"
                onClick={() => addWater(water - 1)}
                aria-label="Take away a glass"
                className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
              >
                <Minus size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => openSheet("move")}
            className={`${tile} ${day.move ? "border-emerald-500/40 bg-emerald-500/10" : "border-line bg-surface hover:border-emerald-500"}`}
          >
            <span className="grid size-8 place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
              {day.move ? <Check size={16} /> : <Footprints size={16} />}
            </span>
            <span className="mt-2 text-sm font-semibold text-ink">Move</span>
            <span className="text-xs text-muted">{day.move === "strength" ? "Workout done" : day.move ? "Walk done" : "Walk or workout"}</span>
          </button>
        </div>

        {/* Shot day keeps a line of its own: it has a day it's due. */}
        {shot && s.due && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-primary/40 bg-surface p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
              <Syringe size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">
                {!shots.length ? "Log your weekly shot" : s.today ? "Today is shot day" : s.late ? `Your shot was due ${format(s.next, "EEEE")}` : "Shot day"}
              </p>
              <p className="text-xs text-muted">Suggested spot: {spotLabel(nextSpot(shots)).toLowerCase()}</p>
            </div>
            <button
              type="button"
              onClick={() => openSheet("shot")}
              className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-deep"
            >
              Log
            </button>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="This week">
          <span className="mr-0.5 text-xs font-semibold uppercase tracking-widest text-muted">This week</span>
          {shot && shotDone && (
            <button type="button" onClick={() => openSheet("shot")} className={chip(true)}>
              <Check size={12} /> Shot
            </button>
          )}
          <button type="button" onClick={() => openSheet("checkin")} disabled={habits.done} className={chip(habits.done, next === "checkin")}>
            {habits.done && <Check size={12} />}
            Weekly check-in
          </button>
          <button type="button" onClick={() => openSheet("strength")} className={chip(strengthDone, next === "strength")}>
            {strengthDone ? <Check size={12} /> : <Dumbbell size={12} />}
            Strength {Math.min(habits.strengthDone, STRENGTH_PER_WEEK)}/{STRENGTH_PER_WEEK}
          </button>
          {lessonDue && (
            <button type="button" onClick={() => openSheet("lesson")} className={chip(false, next === "lesson")}>
              <BookOpen size={12} /> New lesson
            </button>
          )}
          {milestones.fresh.length > 0 && (
            <button type="button" onClick={() => onNavigate("progress")} className={chip(false, true)}>
              <Award size={12} /> New milestone
            </button>
          )}
        </div>
      </div>

      <DailyCheckin
        habits={habits}
        open={open === "daily"}
        onClose={() => setOpen(null)}
        onMessage={() => onNavigate("messages")}
        onStrength={() => openSheet("strength")}
      />
      <MoveSheet habits={habits} open={open === "move"} onClose={() => setOpen(null)} onStrength={() => openSheet("strength")} />
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
