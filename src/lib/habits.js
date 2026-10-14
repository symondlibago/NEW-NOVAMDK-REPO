import { useCallback, useEffect, useState } from "react";
import { addWeeks, getISOWeek, getISOWeekYear, startOfISOWeek } from "date-fns";
import { portalData } from "./portal";

/* Weekly habits: a short weekly check-in on water, sleep, movement, protein
 * and how the week felt, with an optional weigh-in, a streak, one small goal
 * and a short read. Built after Noom's habit loop (client, 2026-10-13).
 * The shot log, strength sessions and monthly measurements were added from
 * Noom's GLP-1 Companion (client, 2026-10-14) and live in the same record.
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

/* General wellness only: no doses, no promises, nothing that reads as medical
   advice. Anything about treatment goes to the care team through Messages. */
export const LESSONS = [
  {
    title: "Make water easy",
    points: [
      "Keep a bottle where you can see it.",
      "Have a glass with each meal.",
      "Add lemon or cucumber if plain water feels boring.",
    ],
  },
  {
    title: "Start with protein",
    points: [
      "Eat the protein on your plate first.",
      "Easy options: eggs, Greek yogurt, chicken, fish, beans, tofu.",
      "Ask your care team what amount is right for you.",
    ],
  },
  {
    title: "Short walks count",
    points: [
      "A 10 minute walk after a meal is a simple start.",
      "Pick the same time each day so it becomes routine.",
      "Bring a friend or a podcast.",
    ],
  },
  {
    title: "A steady bedtime",
    points: [
      "Aim for the same bedtime most nights.",
      "Dim screens 30 minutes before bed.",
      "Keep the bedroom cool and dark.",
    ],
  },
  {
    title: "Slow down at meals",
    points: [
      "Put your fork down between bites.",
      "Stop when you feel comfortably full.",
      "A smaller plate makes a portion look generous.",
    ],
  },
  {
    title: "Keep your strength",
    points: [
      "Two short sessions a week is a good start.",
      "Squats, wall push-ups and bands need no gym.",
      "Check with your care team before anything new and strenuous.",
    ],
  },
  {
    title: "Plan your week",
    points: [
      "Shop with a list.",
      "Prep two or three easy meals on the weekend.",
      "Keep a snack with protein on hand.",
    ],
  },
  {
    title: "Be kind to yourself",
    points: [
      "One off day doesn't undo a good week.",
      "Notice what got in the way, without judging it.",
      "Start again at the next meal.",
    ],
  },
];

export const MILESTONES = [
  { at: 1, label: "First check-in" },
  { at: 4, label: "1 month" },
  { at: 8, label: "2 months" },
  { at: 12, label: "3 months" },
  { at: 26, label: "6 months" },
];

export const REMIND_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/* shots: [{ at, spot }], newest first. strength: sessions per week key.
   measures: { waist, hips } in inches per month key ("2026-10"). */
const EMPTY = { weeks: {}, goal: null, read: [], remind: null, shots: [], shotDay: null, strength: {}, measures: {} };

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
  const total = Object.keys(data.weeks).length;
  return {
    data,
    thisWeek,
    done: Boolean(data.weeks[thisWeek]),
    streak: streakOf(data.weeks),
    total,
    goal: goalById(data.goal),
    lesson: LESSONS[Math.max(0, total - (data.weeks[thisWeek] ? 1 : 0)) % LESSONS.length],
    saveWeek: (entry) =>
      update((d) => ({ ...d, weeks: { ...d.weeks, [thisWeek]: { ...entry, at: new Date().toISOString() } } })),
    setGoal: (id) => update((d) => ({ ...d, goal: id })),
    markRead: (title) => update((d) => ({ ...d, read: [...new Set([...(d.read || []), title])] })),
    setRemind: (day) => update((d) => ({ ...d, remind: day })),
    strengthDone: data.strength?.[thisWeek] || 0,
    addStrength: () =>
      update((d) => ({ ...d, strength: { ...d.strength, [thisWeek]: (d.strength?.[thisWeek] || 0) + 1 } })),
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
