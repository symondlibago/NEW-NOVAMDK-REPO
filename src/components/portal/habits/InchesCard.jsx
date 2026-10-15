import React, { useState } from "react";
import { format } from "date-fns";
import { Check, Ruler } from "lucide-react";

const monthKey = (d = new Date()) => format(d, "yyyy-MM");
const monthName = (key) => format(new Date(`${key}-15T12:00:00`), "MMMM");

/* One line per measurement, oldest on the left; the latest point is the one
   marked, and every point names itself on hover. */
function Spark({ points, label }) {
  if (points.length < 2) return null;
  const vals = points.map((p) => p.v);
  const lo = Math.min(...vals) - 0.5;
  const hi = Math.max(...vals) + 0.5;
  const x = (i) => 6 + (i * 108) / (points.length - 1);
  const y = (v) => 6 + ((hi - v) * 28) / (hi - lo);
  return (
    <svg viewBox="0 0 120 40" className="mt-3 h-10 w-full overflow-visible" role="img" aria-label={`${label} by month`}>
      <polyline points={points.map((p, i) => `${x(i)},${y(p.v)}`).join(" ")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="text-primary" />
      {points.map((p, i) => (
        <circle key={p.key} cx={x(i)} cy={y(p.v)} r={i === points.length - 1 ? 4 : 6} className={i === points.length - 1 ? "fill-primary stroke-surface" : "fill-transparent"} strokeWidth="1.5">
          <title>{`${label}, ${monthName(p.key)}: ${p.v} in`}</title>
        </circle>
      ))}
    </svg>
  );
}

/* Waist and hips once a month: a second way to see change besides the scale. */
export default function InchesCard({ habits }) {
  const measures = habits.data.measures || {};
  const months = Object.keys(measures).sort();
  const now = monthKey();
  const saved = measures[now];
  const [editing, setEditing] = useState(false);
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");

  const series = (field) => months.filter((m) => measures[m]?.[field]).map((m) => ({ key: m, v: measures[m][field] }));
  const valid = (v) => Number(v) > 10 && Number(v) < 90;

  const save = (e) => {
    e.preventDefault();
    if (!valid(waist) || !valid(hips)) return;
    habits.saveMeasure(now, { waist: Number(waist), hips: Number(hips) });
    setEditing(false);
  };

  const field = "w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink outline-none focus:border-primary";

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 nv-shadow sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-surface-2 text-primary">
          <Ruler size={18} />
        </span>
        <div className="flex-1">
          <p className="text-base font-semibold text-ink">Inches</p>
          <p className="text-sm text-muted">Once a month. Waist at your belly button, hips at the widest part.</p>
        </div>
      </div>

      {months.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            ["waist", "Waist"],
            ["hips", "Hips"],
          ].map(([key, label]) => {
            const pts = series(key);
            const last = pts[pts.length - 1];
            return (
              <div key={key} className="rounded-xl bg-bg p-4">
                <p className="text-sm text-muted">{label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-ink tabular-nums">
                  {last?.v} <span className="text-sm font-normal text-muted">in</span>
                </p>
                <Spark points={pts} label={label} />
              </div>
            );
          })}
        </div>
      )}

      {saved && !editing ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-primary/10 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary-deep">
            <Check size={15} /> {monthName(now)} saved
          </p>
          <button
            type="button"
            onClick={() => {
              setWaist(String(saved.waist));
              setHips(String(saved.hips));
              setEditing(true);
            }}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Edit
          </button>
        </div>
      ) : (
        <form onSubmit={save} className="mt-4">
          <p className="text-sm font-semibold text-ink">{monthName(now)}</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <label className="text-sm text-muted">
              Waist (in)
              <input type="number" inputMode="decimal" step="0.25" value={waist} onChange={(e) => setWaist(e.target.value)} className={`${field} mt-1`} />
            </label>
            <label className="text-sm text-muted">
              Hips (in)
              <input type="number" inputMode="decimal" step="0.25" value={hips} onChange={(e) => setHips(e.target.value)} className={`${field} mt-1`} />
            </label>
          </div>
          <button
            type="submit"
            disabled={!valid(waist) || !valid(hips)}
            className="mt-3 w-full rounded-full bg-primary px-6 py-3 text-base font-semibold text-on-primary transition-colors hover:bg-primary-deep disabled:opacity-40"
          >
            Save {monthName(now)}
          </button>
        </form>
      )}
    </section>
  );
}
