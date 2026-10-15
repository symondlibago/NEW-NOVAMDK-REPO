import React, { useState } from "react";
import { format } from "date-fns";
import { Lock, Syringe } from "lucide-react";
import { WEEKDAYS, WEEKDAY_NAMES, nextSpot, shotStatus, spotLabel } from "../../../lib/shots";
import BodyMap from "./BodyMap";
import ShotLogSheet, { MapLegend } from "./ShotLogSheet";

const card = "rounded-2xl border border-line bg-surface p-5 nv-shadow sm:p-6";

/* The Shots tab: what's next, where the last few went, and the shot day. */
export default function ShotsPanel({ habits, shot, sex }) {
  const [open, setOpen] = useState(false);
  const shots = habits.data.shots || [];
  const shotDay = habits.data.shotDay;
  const status = shotStatus(shots, shotDay);
  const suggested = nextSpot(shots);

  const headline = !shots.length
    ? "Log your weekly shot"
    : status.today
      ? "Today is shot day"
      : status.late
        ? `Your shot was due ${format(status.next, "EEEE")}`
        : `Next shot: ${format(status.next, "EEE, MMM d")}`;

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-center gap-5 rounded-3xl border border-primary/25 bg-linear-to-br from-primary/15 to-primary/5 p-6 sm:flex-nowrap md:p-8">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary text-on-primary sm:size-16">
          <Syringe size={26} />
        </span>
        <div className="min-w-0 flex-1 basis-0">
          <p className="text-2xl font-semibold tracking-tight text-ink">{headline}</p>
          <p className="mt-1 text-base text-muted">
            {shot?.name ? `${shot.name}. ` : ""}Suggested spot: {spotLabel(suggested).toLowerCase()}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`w-full rounded-full px-8 py-3.5 text-base font-semibold transition-colors sm:w-auto ${
            status.due ? "bg-primary text-on-primary hover:bg-primary-deep" : "border border-line-strong bg-surface text-ink hover:border-primary"
          }`}
        >
          {status.due ? "Log my shot" : "Log a shot"}
        </button>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className={`${card} grid grid-cols-2 items-center gap-4`}>
          <div>
            <BodyMap sex={sex} suggested={suggested} used={shots.slice(0, 3).map((s) => s.spot)} className="block w-full" />
            <MapLegend />
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-ink">Recent shots</p>
            {shots.length ? (
              <ul className="mt-2 divide-y divide-line">
                {shots.slice(0, 4).map((s) => (
                  <li key={s.at} className="py-2.5 text-sm">
                    <span className="block font-semibold text-ink">{spotLabel(s.spot)}</span>
                    <span className="text-muted">{format(new Date(s.at), "EEE, MMM d")}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">Your shots will show here once you log one.</p>
            )}
          </div>
        </section>

        <section className={card}>
          <p className="text-base font-semibold text-ink">My shot day</p>
          <p className="mt-1 text-sm text-muted">
            {shotDay == null ? "Set by your first logged shot, or pick it here." : `Every ${WEEKDAY_NAMES[shotDay]}. We remind you on Home that day.`}
          </p>
          <div className="mt-4 grid grid-cols-7 gap-1.5">
            {/* Monday first, like the rest of the portal's weeks. */}
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={shotDay === d}
                onClick={() => habits.setShotDay(d)}
                className={`rounded-xl border py-2.5 text-sm font-semibold transition-colors ${
                  shotDay === d ? "border-primary bg-primary text-on-primary" : "border-line text-ink hover:border-primary"
                }`}
              >
                {WEEKDAYS[d]}
              </button>
            ))}
          </div>
        </section>
      </div>

      <p className="flex gap-2 text-sm text-muted">
        <Lock size={14} className="mt-0.5 shrink-0 text-primary" /> Your shot log is saved privately on this device. No dose is recorded.
      </p>

      <ShotLogSheet habits={habits} open={open} onClose={() => setOpen(false)} sex={sex} />
    </div>
  );
}
