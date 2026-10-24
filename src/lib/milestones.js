import { useEffect } from "react";
import { addDays, addWeeks } from "date-fns";
import { dayKey, dayStreakOf, weekKey, weekStart } from "./habits";
import { LESSONS } from "./lessons";

/* Milestones (client, 2026-10-22): badges for showing up, not for results,
 * plus the patient's own weigh-ins once there are two. Everything is worked
 * out from the habits record on this device; once earned, a badge is kept
 * even if a number later goes the other way. */
export const MILESTONE_GROUPS = [
  { kind: "checkins", label: "Check-ins", steps: [1, 4, 8, 12, 26], name: (n) => (n === 1 ? "First check-in" : `${n} check-ins`) },
  { kind: "streak", label: "In a row", steps: [3, 6, 12], name: (n) => `${n} weeks in a row` },
  { kind: "days", label: "Daily check-ins", steps: [3, 7, 14, 30], name: (n) => `${n} days in a row` },
  { kind: "strength", label: "Strength in 10", steps: [1, 10, 25], name: (n) => (n === 1 ? "First Strength in 10" : `${n} strength sessions`) },
  { kind: "lessons", label: "Lessons", steps: [4, LESSONS.length], name: (n) => (n === LESSONS.length ? "Every lesson read" : `${n} lessons read`) },
  { kind: "weight", label: "Weigh-ins", steps: [5, 10, 15, 20], name: (n) => `${n} lb down` },
];

export const MILESTONES = MILESTONE_GROUPS.flatMap((g) => g.steps.map((at) => ({ id: `${g.kind}-${at}`, kind: g.kind, at, label: g.name(at) })));

/** The longest run of weeks in a row ever checked in. */
function bestStreak(weeks) {
  let best = 0;
  let run = 0;
  let prev = null;
  for (const key of Object.keys(weeks).sort()) {
    run = prev && weekKey(addWeeks(weekStart(prev), 1)) === key ? run + 1 : 1;
    best = Math.max(best, run);
    prev = key;
  }
  return best;
}

/** The longest run of days in a row with a daily check-in. */
function bestDayStreak(days) {
  let best = 0;
  let run = 0;
  let prev = null;
  for (const key of Object.keys(days).filter((k) => days[k]?.mood != null).sort()) {
    run = prev && dayKey(addDays(new Date(`${prev}T12:00:00`), 1)) === key ? run + 1 : 1;
    best = Math.max(best, run);
    prev = key;
  }
  return best;
}

function weightDown(weeks) {
  const lbs = Object.keys(weeks)
    .sort()
    .map((k) => weeks[k].weight)
    .filter(Boolean);
  return lbs.length < 2 ? 0 : Math.floor(lbs[0] - lbs[lbs.length - 1]);
}

const titles = new Set(LESSONS.map((l) => l.title));

/** Where the patient stands on every milestone. `streak` is this week's run,
 *  used for the next badge; earning one counts the best run ever. */
export function milestoneState(data, streak = 0) {
  const weeks = data.weeks || {};
  const value = {
    checkins: Object.keys(weeks).length,
    streak: bestStreak(weeks),
    days: bestDayStreak(data.days || {}),
    strength: Object.values(data.strength || {}).reduce((a, b) => a + b, 0),
    lessons: (data.read || []).filter((t) => titles.has(t)).length,
    weight: weightDown(weeks),
  };
  const earned = data.earned || {};
  const seen = new Set(data.seen || []);
  const list = MILESTONES.map((m) => ({ ...m, got: Boolean(earned[m.id]) || value[m.kind] >= m.at }));
  const got = list.filter((m) => m.got);

  // The next badge is the closest one to earning in each kind, then the
  // closest of those. Weight is left out: it is not a habit to chase.
  const now = { ...value, streak, days: dayStreakOf(data.days || {}) };
  const next = MILESTONE_GROUPS.filter((g) => g.kind !== "weight")
    .map((g) => list.find((m) => m.kind === g.kind && !m.got))
    .filter(Boolean)
    .map((m) => ({ ...m, value: Math.min(now[m.kind], m.at) }))
    .sort((a, b) => b.value / b.at - a.value / a.at)[0];

  return {
    list,
    value,
    got,
    fresh: got.filter((m) => !seen.has(m.id)),
    unsaved: got.filter((m) => !earned[m.id]).map((m) => m.id),
    next: next || null,
  };
}

/** milestoneState, plus keeping each badge once it is reached. */
export function useMilestones(habits, pid) {
  const state = milestoneState(habits.data, habits.streak);
  const unsaved = state.unsaved.join(",");
  const { saveEarned } = habits;
  useEffect(() => {
    if (pid && unsaved) saveEarned(unsaved.split(","));
  }, [pid, unsaved, saveEarned]);
  return state;
}
