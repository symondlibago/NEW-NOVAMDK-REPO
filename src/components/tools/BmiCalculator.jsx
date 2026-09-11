import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Info, Lock, CircleUserRound, Star, Activity, Flag } from "lucide-react";
import { track, EVENTS } from "../../lib/analytics";

const DIAL_MIN = 16;
const DIAL_MAX = 40;

/* lucide 0.510 has no CircleStar, so the comp's star-in-a-ring is composed: a
   bordered circle with a small star centred in it. Sized to sit level with the
   plain glyphs on the other rows. */
function CircleStar({ size = 15 }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full border border-current"
      style={{ width: size, height: size }}
    >
      <Star size={size * 0.52} strokeWidth={1.8} />
    </span>
  );
}

const BANDS = [
  { key: "under", label: "Underweight", range: "< 18.5", max: 18.5, icon: CircleUserRound, color: "var(--nv-muted)" },
  { key: "healthy", label: "Healthy weight", range: "18.5 - 24.9", max: 25, icon: CircleStar, color: "var(--nv-accent)" },
  { key: "over", label: "Overweight", range: "25 - 29.9", max: 30, icon: Activity, color: "var(--nv-primary)" },
  { key: "obese", label: "Obesity", range: "≥ 30", max: Infinity, icon: Flag, color: "var(--nv-primary)" },
];

const bandFor = (bmi) => BANDS.find((b) => bmi < b.max);

const RANGE = {
  heightIn: { min: 48, max: 84 },
  weightLb: { min: 80, max: 500 },
};

const IN_TO_CM = 2.54;
const LB_TO_KG = 0.45359237;
const DEFAULT_CM = 175;
const DEFAULT_KG = 84;

const clamp = (n, { min, max }) => Math.min(max, Math.max(min, n));
const feetInches = (totalIn) => `${Math.floor(totalIn / 12)}' ${totalIn % 12}"`;
const fractionOf = (bmi) => (clamp(bmi, { min: DIAL_MIN, max: DIAL_MAX }) - DIAL_MIN) / (DIAL_MAX - DIAL_MIN);

/* --------------------------------- the dial -------------------------------- */

/* A semicircle of radius 80 centred at (100, 100) in a 200x112 box, so the arc's
   two ends land on the box's own baseline and the readout can sit under the
   crown without a magic offset.

   Everything on the arc — the sweep, the bead, every tick — is placed from one
   parametrisation: t is the reading's share of the 16-40 range, and the angle is
   pi(1 - t) measured from the positive x-axis. t=0 puts you at the left end, t=1
   at the right, t=0.5 at the top. */
const R = 80;
const ARC = "M 20 100 A 80 80 0 0 1 180 100";
const pointAt = (t, radius) => {
  const a = Math.PI * (1 - t);
  return { x: 100 + radius * Math.cos(a), y: 100 - radius * Math.sin(a) };
};

/* The boundary values, not evenly spaced marks: each one has to sit at the angle
   of the number it names, which is what lets a reader check their own position
   against the band edges. */
const TICKS = [DIAL_MIN, 18.5, 25, 30, DIAL_MAX];

function Dial({ bmi, band }) {
  const t = fractionOf(bmi);
  const bead = pointAt(t, R);

  return (
    <div className="relative mx-auto w-full max-w-[17rem]">
      <svg viewBox="0 0 200 112" className="block w-full" aria-hidden="true">
        <path d={ARC} fill="none" stroke="var(--nv-surface-2)" strokeWidth="10" strokeLinecap="round" />
        {/* pathLength normalises the dash to the arc itself, so the sweep is a
            plain fraction and stays correct at any rendered width. */}
        <path
          d={ARC}
          fill="none"
          stroke={band.color}
          strokeWidth="10"
          strokeLinecap="round"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - t}
          style={{ transition: "stroke-dashoffset 260ms ease-out, stroke 300ms ease" }}
        />
        <circle
          cx={bead.x}
          cy={bead.y}
          r="7"
          fill={band.color}
          stroke="var(--nv-surface)"
          strokeWidth="3"
          style={{ transition: "cx 260ms ease-out, cy 260ms ease-out, fill 300ms ease" }}
        />
      </svg>

      {TICKS.map((v) => {
        const p = pointAt(fractionOf(v), R + 19);
        return (
          <span
            key={v}
            aria-hidden="true"
            className="absolute -translate-x-1/2 -translate-y-1/2 font-mono text-[0.62rem] tabular-nums text-muted"
            style={{ left: `${(p.x / 200) * 100}%`, top: `${(p.y / 112) * 100}%` }}
          >
            {v}
          </span>
        );
      })}

      {/* Under the crown of the arc rather than centred in the box: the box is a
          semicircle, so its middle is empty air well above where the reading
          belongs. */}
      <div className="absolute inset-x-0 top-[44%] flex flex-col items-center">
        <span className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-muted">Your BMI</span>
        <span className="mt-1 font-display text-[clamp(2.1rem,5vw,2.85rem)] font-extrabold leading-none tracking-tight text-ink tabular-nums">
          {bmi}
        </span>
        <span
          className="mt-1 text-[0.95rem] font-bold leading-tight transition-colors duration-300"
          style={{ color: band.color }}
        >
          {band.label}
        </span>
      </div>
    </div>
  );
}

/* --------------------------------- sliders -------------------------------- */

function SliderField({ id, label, value, display, min, max, onChange, minLabel, maxLabel, className = "" }) {
  const fill = `${((value - min) / (max - min)) * 100}%`;
  return (
    <div className={className}>
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[0.9rem] font-semibold text-ink">{label}</label>
        <span className="font-display text-[1.35rem] font-extrabold tracking-tight text-ink tabular-nums">
          {display}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="nv-range w-full"
        style={{ "--nv-fill": fill }}
      />
      <div className="mt-1.5 flex justify-between font-mono text-[0.66rem] uppercase tracking-widest text-muted">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

/* -------------------------------- component ------------------------------- */

export default function BmiCalculator({ className = "" }) {
  const [cm, setCm] = useState(DEFAULT_CM);
  const [kg, setKg] = useState(DEFAULT_KG);

  const result = useMemo(() => {
    const heightM = cm / 100;
    const bmi = kg / (heightM * heightM);
    if (!Number.isFinite(bmi)) return null;
    return { bmi: Math.round(bmi * 10) / 10, band: bandFor(bmi), mayQualify: bmi >= 27 };
  }, [cm, kg]);

  // One event per click through, carrying the band only. The height and weight a
  // patient dragged to never leaves the browser.
  const onSeeOptions = () => {
    track(EVENTS.CALCULATOR_USED, { band: result?.band?.label, tool: "weight-loss" });
  };

  const heightIn = Math.round(cm / IN_TO_CM);
  const weightLb = Math.round(kg / LB_TO_KG);

  if (!result) return null;

  return (
    <div
      className={`overflow-hidden rounded-[calc(24px*var(--nv-r-scale,1))] border border-line bg-surface nv-shadow ${className}`}
    >
      {/* ------------------------------ inputs ------------------------------ */}
      <div className="px-6 py-6 md:px-9 md:py-7">
        <h3 className="font-display text-[1.2rem] font-bold leading-tight">Your details</h3>

        {/* One rule between the two fields, drawn by the second so it cannot
            outlive the layout: below sm the pair stacks and it simply does not
            apply. */}
        <div className="mt-5 grid gap-6 sm:grid-cols-2 sm:gap-x-0">
          <SliderField
            id="bmi-height-in" label="Height"
            value={clamp(heightIn, RANGE.heightIn)} display={feetInches(clamp(heightIn, RANGE.heightIn))}
            min={RANGE.heightIn.min} max={RANGE.heightIn.max}
            minLabel={feetInches(RANGE.heightIn.min)} maxLabel={feetInches(RANGE.heightIn.max)}
            onChange={(v) => setCm(v * IN_TO_CM)}
            className="sm:pr-9"
          />
          <SliderField
            id="bmi-weight-lb" label="Current weight"
            value={clamp(weightLb, RANGE.weightLb)} display={`${clamp(weightLb, RANGE.weightLb)} lb`}
            min={RANGE.weightLb.min} max={RANGE.weightLb.max}
            minLabel={`${RANGE.weightLb.min} lb`} maxLabel={`${RANGE.weightLb.max} lb`}
            onChange={(v) => setKg(v * LB_TO_KG)}
            className="sm:border-l sm:border-line sm:pl-9"
          />
        </div>

        <p className="mt-6 flex items-center gap-2 text-[0.82rem] leading-relaxed text-muted">
          <Lock size={13} className="shrink-0 text-primary/70" />
          Your inputs are private and stay in your browser.
        </p>
      </div>

      {/* ------------------------------ reading ------------------------------
          aria-live sits here rather than on the card: the sliders are inside the
          card too, and announcing their own labels back on every drag would bury
          the number the patient is listening for. */}
      <div
        className="grid border-t border-line md:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)]"
        aria-live="polite"
      >
        <div className="px-6 pb-2 pt-7 md:px-9 md:pb-7">
          <Dial bmi={result.bmi} band={result.band} />
        </div>

        <div className="px-6 pb-7 pt-4 md:border-l md:border-line md:px-9 md:py-7">
          <ul className="flex flex-col gap-1.5">
            {BANDS.map((b) => {
              const on = b.key === result.band.key;
              const Icon = b.icon;
              return (
                <li
                  key={b.key}
                  className="flex items-center gap-3 rounded-[calc(12px*var(--nv-r-scale,1))] px-3.5 py-2.5 transition-colors duration-300"
                  style={on ? { background: `color-mix(in oklab, ${b.color} 13%, var(--nv-surface))` } : undefined}
                >
                  {/* The lit row trades its glyph for a filled bead, which is
                      what makes "you are here" readable at a glance. */}
                  <span className="grid h-4 w-4 shrink-0 place-items-center">
                    {on ? (
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />
                    ) : (
                      <Icon size={15} strokeWidth={1.6} className="text-muted" />
                    )}
                  </span>
                  <span
                    className={`min-w-0 flex-1 text-[0.9rem] ${on ? "font-semibold" : "text-ink"}`}
                    style={on ? { color: b.color } : undefined}
                  >
                    {b.label}
                  </span>
                  <span
                    className="shrink-0 font-mono text-[0.72rem] tabular-nums"
                    style={{ color: on ? b.color : "var(--nv-muted)" }}
                  >
                    {b.range}
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="mt-3 flex items-start gap-2.5 rounded-[calc(12px*var(--nv-r-scale,1))] bg-surface-2 px-3.5 py-3 text-[0.82rem] leading-relaxed text-muted">
            <Info size={14} className="mt-0.5 shrink-0 text-primary/70" />
            BMI is a screening tool. Treatment eligibility is determined by a licensed provider.
          </p>
        </div>
      </div>

      {/* ----------------------------- CTA rail ----------------------------- */}
      <div className="flex justify-end border-t border-line bg-surface-2 px-6 py-5 md:px-9">
        <Link
          to="/start/weight-loss"
          onClick={onSeeOptions}
          className="group flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[0.95rem] font-semibold text-on-primary transition-all hover:-translate-y-0.5 nv-shadow"
        >
          {result.mayQualify ? "See my treatment options" : "Talk to a provider"}
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
