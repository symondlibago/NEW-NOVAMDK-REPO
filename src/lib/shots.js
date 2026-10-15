import { useEffect, useState } from "react";
import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import { portalData } from "./portal";
import { treatmentFor } from "./portalCatalog";

/* The weekly shot log: where each shot went, and where the next one should go
 * so the spots rotate. Kept with the weekly habits, on this device only; no
 * dose is ever recorded or shown.
 */

export const SPOTS = [
  { id: "belly-ll", label: "Belly, lower left" },
  { id: "belly-lr", label: "Belly, lower right" },
  { id: "belly-ul", label: "Belly, upper left" },
  { id: "belly-ur", label: "Belly, upper right" },
  { id: "thigh-l", label: "Left thigh" },
  { id: "thigh-r", label: "Right thigh" },
  { id: "arm-l", label: "Left upper arm" },
  { id: "arm-r", label: "Right upper arm" },
];

export const spotLabel = (id) => SPOTS.find((s) => s.id === id)?.label || "";

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** The spot used longest ago, never-used ones first, in the order above. */
export function nextSpot(shots = []) {
  const age = (id) => {
    const i = shots.findIndex((s) => s.spot === id);
    return i === -1 ? Infinity : i;
  };
  return SPOTS.reduce((best, s) => (age(s.id) > age(best.id) ? s : best), SPOTS[0]).id;
}

/** When the next shot is due: a week after the last, or the first shot day at
 *  least four days after it once a shot day is set. */
export function nextShotDate(shots = [], shotDay = null) {
  if (!shots.length) return null;
  const last = startOfDay(new Date(shots[0].at));
  if (shotDay == null) return addDays(last, 7);
  let d = addDays(last, 4);
  while (d.getDay() !== shotDay) d = addDays(d, 1);
  return d;
}

export function shotStatus(shots = [], shotDay = null, now = new Date()) {
  const next = nextShotDate(shots, shotDay);
  const daysLeft = next ? differenceInCalendarDays(next, now) : null;
  return { next, due: !next || daysLeft <= 0, today: daysLeft === 0, late: daysLeft != null && daysLeft < 0 };
}

/* A weekly injection on an active visit is what turns the shot log on. The
   catalogue's dosage form says "Weekly Subcutaneous Injection" for exactly
   those. Drops, tablets, creams and other injections never see it. */
const isWeeklyShot = (t) => /weekly/i.test(t.product?.dosageForm || "") && /injection/i.test(t.product?.dosageForm || "");

/** The weekly shot this patient is on: { name } or null. Undefined while the
 *  visits load. The visit list is cached, so this costs nothing on Home. */
export function useWeeklyShot() {
  const [shot, setShot] = useState(undefined);
  useEffect(() => {
    let alive = true;
    portalData({ resource: "cases" })
      .then(({ visits, cases }) => {
        if (!alive) return;
        const hit = (visits || cases || [])
          .filter((v) => v.kind === "case" && v.bucket === "active")
          .map((v) => treatmentFor(v.questionnaire_id, v.treatments?.[0]?.name))
          .find(isWeeklyShot);
        setShot(hit ? { name: hit.name } : null);
      })
      .catch(() => alive && setShot(null));
    return () => {
      alive = false;
    };
  }, []);
  return shot;
}

/** "female" or "male" from the profile's sex, for the body map. MDI writes 1
 *  for male and 2 for female; anything else gets the female figure, since most
 *  of our patients are women. */
export function useBodySex() {
  const [sex, setSex] = useState("female");
  useEffect(() => {
    let alive = true;
    portalData({ resource: "profile" })
      .then((p) => {
        const g = p?.profile;
        if (alive && (String(g?.gender) === "1" || g?.gender_label === "Male")) setSex("male");
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return sex;
}
