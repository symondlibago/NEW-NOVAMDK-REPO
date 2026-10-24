import React, { useState } from "react";
import { format } from "date-fns";
import { Check, Droplet, Dumbbell, Flame, Footprints, Lock, MessageSquare, Moon, Scale, Smile, Target } from "lucide-react";
import { GOALS, QUESTIONS, STRENGTH_PER_WEEK, recentWeeks, useHabits, usePatientId, weekStart } from "../../lib/habits";
import { useMilestones } from "../../lib/milestones";
import { useBodySex, useWeeklyShot } from "../../lib/shots";
import HabitCheckin from "./habits/HabitCheckin";
import InchesCard from "./habits/InchesCard";
import LessonsCard from "./habits/Lessons";
import MilestonesCard, { MilestoneCelebration, PointsCard } from "./habits/Milestones";
import MealIdeas from "./habits/MealIdeas";
import PhotosCard from "./habits/PhotosCard";
import ShotsPanel from "./habits/ShotsPanel";
import StrengthSession from "./habits/StrengthSession";

const Label = ({ children }) => <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">{children}</h2>;

const card = "rounded-2xl border border-line bg-surface p-5 nv-shadow sm:p-6";

const TRENDS = [
  { key: "water", label: "Water", icon: Droplet, value: (v) => QUESTIONS[0].options[v] },
  { key: "sleep", label: "Sleep", icon: Moon, value: (v) => QUESTIONS[1].options[v] },
  { key: "active", label: "Active days", icon: Footprints, value: (v) => `${v} of 7 days` },
  { key: "energy", label: "How you felt", icon: Smile, value: (v) => QUESTIONS[4].options[v] },
];

const fraction = (key, v) => {
  const q = QUESTIONS.find((x) => x.key === key);
  return q.count ? v / q.count : v / (q.options.length - 1);
};

/* Eight thin bars, one per week, oldest on the left. An empty week is a dot,
   so a gap reads as a gap rather than as a zero. */
function Bars({ weeks, field }) {
  return (
    <span className="mt-4 flex h-12 items-end gap-1.5" aria-hidden="true">
      {weeks.map(({ key, entry }) =>
        entry && entry[field] != null ? (
          <span key={key} className="flex-1 rounded-sm bg-primary/70" style={{ height: `${Math.max(12, fraction(field, entry[field]) * 100)}%` }} />
        ) : (
          <span key={key} className="mb-0.5 h-1 flex-1 rounded-full bg-line" />
        )
      )}
    </span>
  );
}

/* How the weekly goal went, one mark per week: full for "did it", soft for
   "partly", an empty ring for "not this week". */
function GoalTrack({ weeks }) {
  const rated = weeks.filter(({ entry }) => entry?.goalMet != null);
  if (!rated.length) return null;
  const met = rated.filter(({ entry }) => entry.goalMet === 2).length;
  return (
    <div className="mt-auto pt-6">
      <span className="flex gap-1.5" aria-hidden="true">
        {weeks.map(({ key, entry }) => {
          const g = entry?.goalMet;
          return (
            <span
              key={key}
              className={`grid size-7 place-items-center rounded-full ${
                g === 2 ? "bg-primary text-on-primary" : g === 1 ? "bg-primary/25" : g === 0 ? "border-2 border-line" : "scale-50 bg-line"
              }`}
            >
              {g === 2 && <Check size={14} />}
            </span>
          );
        })}
      </span>
      <p className="mt-2.5 text-sm text-muted">
        Goal met {met} of the last {rated.length} week{rated.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}

function WeightCard({ weeks }) {
  const points = Object.entries(weeks)
    .filter(([, e]) => e.weight)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, e]) => ({ key, lb: e.weight }));
  if (points.length < 2) return null;
  const lbs = points.map((p) => p.lb);
  const lo = Math.min(...lbs) - 2;
  const hi = Math.max(...lbs) + 2;
  const x = (i) => 8 + (i * 284) / (points.length - 1);
  const y = (lb) => 8 + ((hi - lb) * 64) / (hi - lo);
  const first = points[0];
  const last = points[points.length - 1];
  const change = Math.round((last.lb - first.lb) * 10) / 10;
  return (
    <section className={card}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-surface-2 text-primary">
            <Scale size={18} />
          </span>
          <div>
            <p className="text-base font-semibold text-ink">Weight</p>
            <p className="text-sm text-muted">
              {change === 0 ? "Same as" : `${change > 0 ? "Up" : "Down"} ${Math.abs(change)} lb since`} {format(weekStart(first.key), "MMM d")}
            </p>
          </div>
        </div>
        <p className="text-2xl font-semibold tracking-tight text-ink">
          {last.lb} <span className="text-base text-muted">lb</span>
        </p>
      </div>
      <svg viewBox="0 0 300 80" className="mt-4 h-24 w-full" preserveAspectRatio="none" aria-hidden="true">
        <polyline points={points.map((p, i) => `${x(i)},${y(p.lb)}`).join(" ")} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={p.key} cx={x(i)} cy={y(p.lb)} r="3.5" className="fill-primary" />
        ))}
      </svg>
    </section>
  );
}

/* Four small tabs, so each one fits about a phone screen (client,
   2026-10-14): the week's to-dos, the shot log for patients on a weekly
   injection, body measures, and food. */
const TAB_LIST = [
  { key: "week", label: "This week" },
  { key: "shots", label: "Shots" },
  { key: "body", label: "Body" },
  { key: "food", label: "Food" },
];

export default function PortalProgress({ onNavigate }) {
  const pid = usePatientId();
  const habits = useHabits(pid);
  const shot = useWeeklyShot();
  const sex = useBodySex();
  const [open, setOpen] = useState(false);
  const [strength, setStrength] = useState(false);
  const [picking, setPicking] = useState(false);
  const [tab, setTab] = useState("week");
  const milestones = useMilestones(habits, pid);
  const weeks = recentWeeks(habits.data.weeks, 8);
  const next = format(weekStart(habits.thisWeek).getTime() + 7 * 864e5, "EEEE, MMM d");
  // Shots shows for a weekly injection, or once anything has been logged.
  const tabs = TAB_LIST.filter((t) => t.key !== "shots" || shot || habits.data.shots?.length);

  const shell = "nv-scroll min-h-0 flex-1 overflow-y-auto px-6 py-6 md:px-10 md:py-10";
  return (
    <div className={shell} data-lenis-prevent>
      <div className="mx-auto w-full max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Weekly habits</p>
        <h1 className="mt-2 text-3xl leading-tight tracking-tight text-primary-deep">Your progress</h1>
        <p className="mt-2 max-w-xl text-base text-muted">One minute a week for the small habits that support your treatment.</p>

        <div role="tablist" aria-label="Progress" className={`mt-6 grid max-w-xl gap-1 rounded-full bg-surface-2 p-1 ${tabs.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full py-2.5 text-sm font-semibold transition-colors ${tab === t.key ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "week" && (
          <>
            <MilestoneCelebration state={milestones} onSeen={habits.markSeen} />

            {/* The check-in leads: it is the one thing to do here. */}
            <section className="mt-6 flex flex-wrap items-center gap-5 rounded-3xl border border-primary/25 bg-linear-to-br from-primary/15 to-primary/5 p-6 sm:flex-nowrap md:p-8">
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary text-on-primary sm:size-16">
                <Flame size={28} />
              </span>
              <div className="min-w-0 flex-1 basis-0">
                <p className="text-2xl font-semibold tracking-tight text-ink">
                  {habits.streak === 0 ? "Start your streak" : `${habits.streak} week${habits.streak === 1 ? "" : "s"} in a row`}
                </p>
                <p className="mt-1 text-base text-muted">
                  {habits.done ? `This week is done. Your next check-in opens ${next}.` : "This week's check-in is ready. It takes about a minute."}
                </p>
              </div>
              {habits.done ? (
                <span className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-surface px-6 py-3 text-base font-semibold text-primary-deep sm:w-auto">
                  <Check size={18} /> Checked in
                </span>
              ) : (
                <button type="button" onClick={() => setOpen(true)} className="w-full rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-on-primary transition-colors hover:bg-primary-deep sm:w-auto">
                  Start check-in
                </button>
              )}
            </section>

            {/* Two short sessions a week, Noom's Muscle Defense idea. */}
            <section className={`${card} mt-4 flex flex-wrap items-center gap-4 sm:flex-nowrap`}>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 text-primary">
                <Dumbbell size={18} />
              </span>
              <div className="min-w-0 flex-1 basis-0">
                <p className="text-base font-semibold text-ink">Strength in 10</p>
                <p className="text-sm text-muted">
                  {Math.min(habits.strengthDone, STRENGTH_PER_WEEK)} of {STRENGTH_PER_WEEK} sessions this week. Five moves at home, no equipment.
                </p>
              </div>
              <span className="hidden gap-1.5 sm:flex" aria-hidden="true">
                {Array.from({ length: STRENGTH_PER_WEEK }, (_, n) => (
                  <span key={n} className={`h-2 w-7 rounded-full ${n < habits.strengthDone ? "bg-primary" : "bg-line"}`} />
                ))}
              </span>
              <button
                type="button"
                onClick={() => setStrength(true)}
                className="w-full rounded-full border border-line-strong px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-primary sm:w-auto"
              >
                {habits.strengthDone >= STRENGTH_PER_WEEK ? "Do another" : "Start"}
              </button>
            </section>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {/* One small goal at a time, Noom style. */}
              <section className={`${card} flex flex-col`}>
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-surface-2 text-primary">
                    <Target size={18} />
                  </span>
                  <p className="flex-1 text-base font-semibold text-ink">This week&rsquo;s focus</p>
                  <button type="button" onClick={() => setPicking((p) => !p)} className="text-sm font-semibold text-primary hover:underline">
                    {picking ? "Close" : habits.goal ? "Change" : "Choose"}
                  </button>
                </div>
                {picking ? (
                  <div className="mt-4 space-y-2">
                    {GOALS.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          habits.setGoal(g.id);
                          setPicking(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                          habits.goal?.id === g.id ? "border-primary bg-primary text-on-primary" : "border-line text-ink hover:border-primary"
                        }`}
                      >
                        {g.label}
                        {habits.goal?.id === g.id && <Check size={16} />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="mt-4 text-xl font-semibold leading-snug tracking-tight text-ink">
                      {habits.goal ? habits.goal.label : <span className="text-muted">Pick one small goal for this week.</span>}
                    </p>
                    <GoalTrack weeks={weeks} />
                  </>
                )}
              </section>

              <LessonsCard habits={habits} className={card} />
            </div>

            {/* The weekly text reminder that sat here sent nothing: there is no
                server side for it yet (client told, 2026-10-22). */}
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <PointsCard points={habits.points} className={card} />
              <MilestonesCard state={milestones} className={card} />
            </div>
          </>
        )}

        {tab === "shots" && (
          <div className="mt-6">
            <ShotsPanel habits={habits} shot={shot} sex={sex} />
          </div>
        )}

        {tab === "body" && (
          <>
            <div className="mt-6">
              <WeightCard weeks={habits.data.weeks} />
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <InchesCard habits={habits} />
              <PhotosCard pid={pid} />
            </div>

            <section className="mt-8 md:mt-10">
              <Label>Last 8 weeks</Label>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                {TRENDS.map(({ key, label, icon, value }) => {
                  const Icon = icon;
                  const latest = [...weeks].reverse().find((w) => w.entry && w.entry[key] != null)?.entry[key];
                  return (
                    <div key={key} className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
                      <p className="flex items-center gap-2 text-sm font-semibold text-muted">
                        <Icon size={15} className="text-primary" /> {label}
                      </p>
                      <p className="mt-2 text-base font-semibold leading-snug text-ink">{latest != null ? value(latest) : "No entries yet"}</p>
                      <Bars weeks={weeks} field={key} />
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {tab === "food" && (
          <div className="mt-6">
            <MealIdeas weeks={weeks} />
          </div>
        )}

        <div className="mt-8 space-y-3 pb-4 text-sm text-muted">
          <p className="flex gap-2">
            <Lock size={14} className="mt-0.5 shrink-0 text-primary" /> Your answers are saved privately on this device.
          </p>
          <p className="flex gap-2">
            <MessageSquare size={14} className="mt-0.5 shrink-0 text-primary" />
            <span>
              Feeling unwell, or have a question about your treatment?{" "}
              <button type="button" onClick={() => onNavigate?.("messages")} className="font-semibold text-primary hover:underline">
                Message your care team
              </button>
            </span>
          </p>
        </div>
      </div>

      <HabitCheckin habits={habits} open={open} onClose={() => setOpen(false)} onMessage={() => onNavigate?.("messages")} />
      <StrengthSession habits={habits} open={strength} onClose={() => setStrength(false)} />
    </div>
  );
}
