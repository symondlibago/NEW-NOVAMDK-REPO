import React, { useState } from "react";
import { Award, BookOpen, CalendarCheck, Dumbbell, Flame, Scale } from "lucide-react";
import { MILESTONE_GROUPS } from "../../../lib/milestones";
import Sheet from "./Sheet";

const ICONS = { checkins: CalendarCheck, streak: Flame, strength: Dumbbell, lessons: BookOpen, weight: Scale };

/* Shown once for anything newly earned, at the top of Progress. One badge is
   named; if several came at once (the first visit after this shipped), the
   rest are counted. */
export function MilestoneCelebration({ state, onSeen }) {
  if (!state.fresh.length) return null;
  const m = state.fresh[state.fresh.length - 1];
  const Icon = ICONS[m.kind];
  const more = state.fresh.length - 1;
  return (
    <section className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-primary/30 bg-surface p-5 nv-shadow sm:flex-nowrap">
      <span className="relative grid size-14 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
        <Icon size={24} />
        <Award size={18} className="absolute -right-1 -bottom-1 rounded-full bg-surface p-0.5 text-primary" />
      </span>
      <div className="min-w-0 flex-1 basis-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">New milestone</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-ink">{m.label}</p>
        {more > 0 && (
          <p className="text-sm text-muted">
            And {more} more. See them all under Milestones.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onSeen(state.fresh.map((x) => x.id))}
        className="w-full rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-deep sm:w-auto"
      >
        Nice
      </button>
    </section>
  );
}

const progressText = (m, value) => {
  if (m.got) return "Earned";
  if (m.kind === "weight") return "Not yet";
  return `${Math.min(value[m.kind], m.at)} of ${m.at}`;
};

/* The next badge to earn, with how close it is, and every badge in a sheet. */
export default function MilestonesCard({ state, className = "" }) {
  const [all, setAll] = useState(false);
  const { next } = state;
  return (
    <section className={className}>
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-surface-2 text-primary">
          <Award size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-ink">Milestones</p>
          <p className="text-sm text-muted">
            {state.got.length} of {state.list.length} earned
          </p>
        </div>
        <button type="button" onClick={() => setAll(true)} className="text-sm font-semibold text-primary hover:underline">
          See all
        </button>
      </div>
      {next && (
        <div className="mt-5">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-base font-semibold text-ink">Next: {next.label}</p>
            <p className="shrink-0 text-sm text-muted">
              {next.value} of {next.at}
            </p>
          </div>
          <span className="mt-2.5 block h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <span className="block h-full rounded-full bg-primary" style={{ width: `${(next.value / next.at) * 100}%` }} />
          </span>
        </div>
      )}
      {state.got.length > 0 && (
        <span className="mt-5 flex flex-wrap gap-2" aria-label="Earned">
          {state.got.slice(-6).map((m) => {
            const Icon = ICONS[m.kind];
            return (
              <span key={m.id} title={m.label} className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary-deep">
                <Icon size={16} />
              </span>
            );
          })}
        </span>
      )}

      <Sheet open={all} onClose={() => setAll(false)} label="Milestones">
        <p className="text-2xl font-semibold tracking-tight text-ink">Milestones</p>
        <p className="mt-1 text-sm text-muted">For showing up, week after week.</p>
        {MILESTONE_GROUPS.map((g) => {
          const Icon = ICONS[g.kind];
          return (
            <section key={g.kind} className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">{g.label}</h3>
              <ul className="mt-3 grid grid-cols-3 gap-2.5">
                {state.list
                  .filter((m) => m.kind === g.kind)
                  .map((m) => (
                    <li key={m.id} className={`flex flex-col items-center rounded-2xl border p-3 text-center ${m.got ? "border-primary/30 bg-primary/5" : "border-line"}`}>
                      <span className={`grid size-10 place-items-center rounded-full ${m.got ? "bg-primary text-on-primary" : "bg-surface-2 text-muted"}`}>
                        <Icon size={18} />
                      </span>
                      <span className={`mt-2 text-sm font-semibold leading-tight ${m.got ? "text-ink" : "text-muted"}`}>{m.label}</span>
                      <span className="mt-1 text-xs text-muted">{progressText(m, state.value)}</span>
                    </li>
                  ))}
              </ul>
            </section>
          );
        })}
      </Sheet>
    </section>
  );
}
