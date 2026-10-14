import React, { useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { Check, Lock } from "lucide-react";
import { SPOTS, nextSpot, shotStatus, spotLabel } from "../../../lib/shots";
import BodyMap from "./BodyMap";
import Sheet from "./Sheet";

const LABELS = Object.fromEntries(SPOTS.map((s) => [s.id, s.label]));

export function MapLegend() {
  return (
    <p className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-3 rounded-full bg-primary" /> Today
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-3 rounded-full border-2 border-dashed border-primary" /> Suggested
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-3 rounded-full bg-muted/30" /> Last 3 weeks
      </span>
    </p>
  );
}

const chip = "rounded-full border px-4 py-2 text-sm font-semibold transition-colors";

/* Log this week's shot: tap the spot on the body, one button. The suggested
   spot is the one used longest ago, so the spots rotate on their own. */
export default function ShotLogSheet({ habits, open, onClose, sex }) {
  const shots = habits.data.shots || [];
  const [picked, setPicked] = useState(null);
  const [daysAgo, setDaysAgo] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPicked(nextSpot(habits.data.shots || []));
    setDaysAgo(0);
    setDone(false);
    // Only on opening: logging changes the shots, and must not reset the sheet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = () => {
    habits.logShot(picked, subDays(new Date(), daysAgo));
    setDone(true);
  };

  const { next } = shotStatus(shots, habits.data.shotDay);

  return (
    <Sheet open={open} onClose={onClose} label="Log your shot">
      {done ? (
        <div className="text-center">
          <span className="mx-auto grid size-20 place-items-center rounded-full bg-primary text-on-primary">
            <Check size={34} />
          </span>
          <h2 className="mt-5 text-3xl tracking-tight text-ink">Shot logged</h2>
          <p className="mt-2 text-base text-muted">
            {spotLabel(picked)}, {daysAgo ? "yesterday" : "today"}
          </p>
          <div className="mt-6 rounded-2xl border border-line bg-surface p-5 text-left">
            {next && (
              <p className="text-base text-muted">
                Next shot: <span className="font-semibold text-ink">{format(next, "EEEE, MMM d")}</span>
              </p>
            )}
            <p className="mt-1 text-base text-muted">
              Next spot: <span className="font-semibold text-ink">{spotLabel(nextSpot(shots)).toLowerCase()}</span>
            </p>
          </div>
          <button type="button" onClick={onClose} className="mt-6 w-full rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-on-primary transition-colors hover:bg-primary-deep">
            Done
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Shot day</p>
          <h2 className="mt-1 text-2xl leading-snug tracking-tight text-ink">Log your shot</h2>
          <p className="mt-2 text-base text-muted">Tap where you gave it. The dashed ring is our suggestion, so your spots rotate.</p>

          <div className="mt-5 rounded-3xl border border-line bg-surface px-4 pb-4 pt-2">
            <BodyMap
              sex={sex}
              picked={picked}
              suggested={nextSpot(shots)}
              used={shots.slice(0, 3).map((s) => s.spot)}
              onPick={setPicked}
              labels={LABELS}
              className="mx-auto block w-full max-w-72"
            />
            <p className="mx-auto flex max-w-72 justify-between text-xs text-muted">
              <span>Your right</span>
              <span>Your left</span>
            </p>
            <MapLegend />
          </div>

          <p className="mt-4 text-center text-base text-ink">
            Selected: <span className="font-semibold text-primary-deep">{spotLabel(picked)}</span>
          </p>

          <div className="mt-4 flex justify-center gap-2" role="radiogroup" aria-label="When">
            {["Today", "Yesterday"].map((label, n) => (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={daysAgo === n}
                onClick={() => setDaysAgo(n)}
                className={`${chip} ${daysAgo === n ? "border-primary bg-primary text-on-primary" : "border-line text-ink hover:border-primary"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={save}
            disabled={!picked}
            className="mt-5 w-full rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-on-primary transition-colors hover:bg-primary-deep disabled:opacity-40"
          >
            Log shot
          </button>
          <p className="mt-4 flex justify-center gap-2 text-sm text-muted">
            <Lock size={14} className="mt-0.5 shrink-0 text-primary" /> Saved privately on this device. No dose is recorded.
          </p>
        </>
      )}
    </Sheet>
  );
}
