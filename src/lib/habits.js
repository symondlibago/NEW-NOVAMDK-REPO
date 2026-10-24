import { useCallback, useEffect, useState } from "react";
import { addDays, addWeeks, format, getISOWeek, getISOWeekYear, startOfISOWeek } from "date-fns";
import { portalData } from "./portal";

/* Weekly habits: a short weekly check-in on water, sleep, movement, protein
 * and how the week felt, with an optional weigh-in, a streak, one small goal
 * and a short read. Built after Noom's habit loop (client, 2026-10-13).
 * The shot log, strength sessions and monthly measurements were added from
 * Noom's GLP-1 Companion (client, 2026-10-14) and live in the same record, as
 * does the daily check-in with its rings and points (client, 2026-10-24).
 *
 * Version one keeps everything in this browser's storage, keyed by patient.
 * Nothing here is sent anywhere: these answers are health information, so they
 * stay out of GoHighLevel and analytics until they have a HIPAA covered home.
 * Not to be confused with the monthly refill check-in, which is an MDI intake.
 */

const KEY = "nv_habits_v1";
const EVENT = "nv-habits";

export const weekKey = (date = new Date()) =>
  `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, "0")}`;

export const weekStart = (key) => {
  const [y, w] = key.split("-W").map(Number);
  // The 4th of January is always in week 1.
  return addWeeks(startOfISOWeek(new Date(y, 0, 4)), w - 1);
};

export const QUESTIONS = [
  {
    key: "water",
    title: "How much water did you drink on a typical day?",
    options: ["Under 4 glasses", "4 to 5 glasses", "6 to 7 glasses", "8 or more"],
  },
  {
    key: "sleep",
    title: "How much did you sleep most nights?",
    options: ["Under 6 hours", "6 to 7 hours", "7 to 8 hours", "Over 8 hours"],
  },
  {
    key: "active",
    title: "How many days were you active for 20 minutes or more?",
    hint: "Walks and Strength in 10 sessions both count.",
    count: 7,
  },
  {
    key: "protein",
    title: "How often did your meals include protein?",
    options: ["Rarely", "Some meals", "Most meals"],
  },
  {
    key: "energy",
    title: "How have you felt this week?",
    options: ["Rough", "Low", "Okay", "Good", "Great"],
    faces: true,
  },
];

export const GOALS = [
  { id: "water", label: "Drink 8 glasses of water a day", area: "water" },
  { id: "protein", label: "Include protein at every meal", area: "protein" },
  { id: "walk", label: "Walk 20 minutes, 3 days this week", area: "active" },
  { id: "bed", label: "Lights out by 10:30 on weeknights", area: "sleep" },
  { id: "strength", label: "Two short strength sessions", area: "active" },
  { id: "screens", label: "Eat dinner without screens", area: "energy" },
];

export const goalById = (id) => GOALS.find((g) => g.id === id) || null;

/* The check-in's last question. Several can be picked; "none" stands alone. */
export const SYMPTOMS = [
  { id: "none", label: "Nothing, I feel fine" },
  { id: "nausea", label: "Nausea" },
  { id: "constipation", label: "Constipation" },
  { id: "appetite", label: "Low appetite" },
  { id: "tired", label: "Tired" },
  { id: "other", label: "Something else" },
];

/* Placeholder wording. A provider has to approve these before TIPS_APPROVED
   is turned on; until then the check-in only offers Messages. */
export const TIPS_APPROVED = false;
export const FEELING_TIPS = {
  nausea: "Smaller meals, eaten slowly, and stopping when you feel full can make meals easier.",
  constipation: "Water through the day and some fiber with each meal can help.",
  appetite: "Start each meal with the protein, even if it's only a few bites.",
  tired: "Regular meals and a short walk can help. Tell your care team if it keeps up.",
  other: "Tell your care team what's going on. They read every message.",
};

export const STRENGTH_PER_WEEK = 2;

/* The daily check-in (client, 2026-10-24, after Hims and Noom): one tap on how
   the day feels, then glasses of water and one bit of movement. Those three
   are the day's rings. */
export const WATER_GOAL = 8;
export const MOODS = ["Rough", "Low", "Okay", "Good", "Great"];
export const FACES = ["😣", "😕", "😐", "🙂", "😄"];
export const dayKey = (date = new Date()) => format(date, "yyyy-MM-dd");

/** Days in a row with a check-in, counting back from today, or from
 *  yesterday while today's is still open. */
export function dayStreakOf(days, now = new Date()) {
  const checked = (d) => days[dayKey(d)]?.mood != null;
  let d = checked(now) ? now : addDays(now, -1);
  let n = 0;
  while (checked(d)) {
    n += 1;
    d = addDays(d, -1);
  }
  return n;
}

/* Points for showing up, never for results. Worked out from the record each
   time rather than kept as a total, so they can't drift from what was done. */
export const POINTS = { checkin: 10, water: 10, move: 10, strength: 25, weekly: 50, lesson: 15 };
export const LEVEL_SIZE = 250;

export function pointsOf(data) {
  let n = 0;
  for (const d of Object.values(data.days || {})) {
    if (d.mood != null) n += POINTS.checkin;
    if ((d.water || 0) >= WATER_GOAL) n += POINTS.water;
    if (d.move) n += POINTS.move;
  }
  n += Object.values(data.strength || {}).reduce((a, b) => a + b, 0) * POINTS.strength;
  n += Object.keys(data.weeks || {}).length * POINTS.weekly;
  n += (data.read || []).length * POINTS.lesson;
  return n;
}

export const levelOf = (points) => ({
  level: Math.floor(points / LEVEL_SIZE) + 1,
  into: points % LEVEL_SIZE,
  toNext: LEVEL_SIZE - (points % LEVEL_SIZE),
});

/* shots: [{ at, spot }], newest first. strength: sessions per week key.
   measures: { waist, hips } in inches per month key ("2026-10"). read: lesson
   titles (lessons.js). earned: milestone id to the date it was first reached;
   seen: milestones already celebrated (milestones.js). days: the daily
   check-in by date ("2026-10-24"), { mood, water, move }. */
const EMPTY = {
  weeks: {},
  goal: null,
  read: [],
  lessonStart: null,
  shots: [],
  shotDay: null,
  strength: {},
  measures: {},
  earned: {},
  seen: [],
  days: {},
};

const storageKey = (pid) => `${KEY}:${pid || "me"}`;

function load(pid) {
  try {
    const raw = localStorage.getItem(storageKey(pid));
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY; // private mode: the card still works for this visit
  }
}

function save(pid, data) {
  try {
    localStorage.setItem(storageKey(pid), JSON.stringify(data));
  } catch {
    /* storage full or blocked; nothing else to do */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Weeks in a row, counting back from this week, or from last week while this
 *  week's check-in is still open. */
export function streakOf(weeks, now = new Date()) {
  let d = weeks[weekKey(now)] ? now : addWeeks(now, -1);
  let n = 0;
  while (weeks[weekKey(d)]) {
    n += 1;
    d = addWeeks(d, -1);
  }
  return n;
}

/** The last `count` weeks, oldest first, with whatever was logged in each. */
export function recentWeeks(weeks, count = 8, now = new Date()) {
  return Array.from({ length: count }, (_, i) => {
    const key = weekKey(addWeeks(now, i - count + 1));
    return { key, entry: weeks[key] || null };
  });
}

/** Up to three goals for next week, led by the areas that scored lowest. */
export function suggestGoals(entry, current) {
  const level = (k) => {
    const q = QUESTIONS.find((x) => x.key === k);
    const v = entry?.[k];
    if (v == null) return 1;
    return q.count ? v / q.count : v / (q.options.length - 1);
  };
  return [...GOALS]
    .filter((g) => g.id !== current)
    .sort((a, b) => level(a.area) - level(b.area))
    .slice(0, 3);
}

export function useHabits(pid) {
  const [data, setData] = useState(() => load(pid));

  useEffect(() => {
    setData(load(pid));
    const sync = () => setData(load(pid));
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [pid]);

  const update = useCallback(
    (fn) => {
      const next = fn(load(pid));
      save(pid, next);
      setData(next);
    },
    [pid]
  );

  const thisWeek = weekKey();
  const today = dayKey();
  const total = Object.keys(data.weeks).length;
  const logDay = (patch) =>
    update((d) => ({ ...d, days: { ...d.days, [today]: { ...d.days?.[today], ...patch, at: new Date().toISOString() } } }));
  return {
    data,
    thisWeek,
    done: Boolean(data.weeks[thisWeek]),
    streak: streakOf(data.weeks),
    total,
    goal: goalById(data.goal),
    saveWeek: (entry) =>
      update((d) => ({ ...d, weeks: { ...d.weeks, [thisWeek]: { ...entry, at: new Date().toISOString() } } })),
    setGoal: (id) => update((d) => ({ ...d, goal: id })),
    // The first lesson read fixes the week lessons count from.
    markRead: (title, start) =>
      update((d) => ({ ...d, read: [...new Set([...(d.read || []), title])], lessonStart: d.lessonStart || start || null })),
    saveEarned: (ids) =>
      update((d) => ({ ...d, earned: { ...Object.fromEntries(ids.map((id) => [id, new Date().toISOString()])), ...d.earned } })),
    markSeen: (ids) => update((d) => ({ ...d, seen: [...new Set([...(d.seen || []), ...ids])] })),
    strengthDone: data.strength?.[thisWeek] || 0,
    // A session is also the day's movement.
    addStrength: () =>
      update((d) => ({
        ...d,
        strength: { ...d.strength, [thisWeek]: (d.strength?.[thisWeek] || 0) + 1 },
        days: { ...d.days, [today]: { ...d.days?.[today], move: "strength", at: new Date().toISOString() } },
      })),
    day: data.days?.[today] || {},
    dayStreak: dayStreakOf(data.days || {}),
    points: pointsOf(data),
    checkInDay: (mood) => logDay({ mood }),
    setWater: (n) => logDay({ water: Math.max(0, Math.min(WATER_GOAL, n)) }),
    logWalk: () => logDay({ move: "walk" }),
    logShot: (spot, at = new Date()) =>
      update((d) => ({
        ...d,
        shots: [{ at: at.toISOString(), spot }, ...(d.shots || [])].slice(0, 52),
        // The first shot logged sets the shot day; it can be changed after.
        shotDay: d.shotDay ?? at.getDay(),
      })),
    setShotDay: (day) => update((d) => ({ ...d, shotDay: day })),
    saveMeasure: (month, m) => update((d) => ({ ...d, measures: { ...d.measures, [month]: m } })),
  };
}

/* The patient's own id, so two people sharing a computer keep separate
   habits. The profile read is cached, so this costs nothing on Home. */
export function usePatientId() {
  const [pid, setPid] = useState(null);
  useEffect(() => {
    let alive = true;
    portalData({ resource: "profile" })
      .then((p) => alive && setPid(p?.profile?.patient_id || "me"))
      .catch(() => alive && setPid("me"));
    return () => {
      alive = false;
    };
  }, []);
  return pid;
}
