import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MIN_YEAR = 1900;
const PANEL_HEIGHT = 360;
const pad = (n) => String(n).padStart(2, "0");
const toISO = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

function parseISO(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!match) return null;
  const [, y, m, d] = match;
  const parts = { y: +y, m: +m - 1, d: +d };
  return parts.m > 11 || parts.d > 31 ? null : parts;
}

// Local-time parts — never derived from an ISO string, for the reason above.
const todayParts = () => {
  const now = new Date();
  return { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() };
};

const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const firstWeekday = (y, m) => new Date(y, m, 1).getDay();
const isAfter = (a, b) => (a.y !== b.y ? a.y > b.y : a.m !== b.m ? a.m > b.m : a.d > b.d);

export default function DatePicker({
  value,
  onChange,
  placeholder = "Select date…",
  /* Nobody is born tomorrow. */
  maxDate = todayParts(),
  minYear = MIN_YEAR,
  id,
}) {
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const selected = parseISO(value);
  const [view, setView] = useState(selected ? "days" : "years");
  const [cursor, setCursor] = useState(() => selected || { y: maxDate.y - 30, m: 0, d: 1 });

  const ref = useRef(null);
  const triggerRef = useRef(null);
  const selectedYearRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, []);

  // Reopen where the current answer lives.
  useEffect(() => {
    if (!open) return;
    setView(selected ? "days" : "years");
    if (selected) setCursor(selected);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setAbove(rect.bottom + PANEL_HEIGHT > window.innerHeight && rect.top > PANEL_HEIGHT);
  }, [open, view]);

  useEffect(() => {
    if (view === "years") selectedYearRef.current?.scrollIntoView({ block: "center" });
  }, [view]);

  const years = useMemo(() => {
    const list = [];
    for (let y = maxDate.y; y >= minYear; y--) list.push(y);
    return list;
  }, [maxDate.y, minYear]);

  const grid = useMemo(() => {
    const lead = firstWeekday(cursor.y, cursor.m);
    const total = daysInMonth(cursor.y, cursor.m);
    return [...Array(lead).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  }, [cursor.y, cursor.m]);

  const shiftMonth = (delta) => {
    const next = new Date(cursor.y, cursor.m + delta, 1);
    setCursor({ y: next.getFullYear(), m: next.getMonth(), d: 1 });
  };

  const pick = (day) => {
    onChange(toISO(cursor.y, cursor.m, day));
    setOpen(false);
  };

  const atMaxMonth = cursor.y === maxDate.y && cursor.m >= maxDate.m;
  const atMinMonth = cursor.y === minYear && cursor.m <= 0;

  const navBtn =
    "grid h-9 w-9 flex-none place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:pointer-events-none disabled:opacity-25";
  const gridBtn =
    "rounded-xl py-2.5 text-[0.9rem] font-medium transition-colors disabled:pointer-events-none disabled:opacity-25";

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-bg px-3.5 py-3 text-left text-[0.95rem] transition-colors focus:outline-none ${
          open ? "border-primary ring-2 ring-primary/15" : "border-line"
        } ${selected ? "text-ink" : "text-muted/60"}`}
      >
        <span className="truncate">
          {selected ? `${MONTHS_SHORT[selected.m]} ${selected.d}, ${selected.y}` : placeholder}
        </span>
        <CalendarDays size={16} className="shrink-0 text-muted" />
      </button>

      {open && (
        /* Fixed width, never max-w-full: the field sits in a half-width grid
           cell, so clamping to the parent squeezes the calendar to nothing. */
        <div
          role="dialog"
          aria-label="Choose a date"
          /* Lenis swallows touchmove site-wide; without this the year list
             simply won't scroll on a phone. Same flag the nav drawer uses. */
          data-lenis-prevent
          className={`absolute left-0 z-50 w-72 rounded-2xl border border-line bg-surface p-3 nv-shadow-lg sm:w-80 ${
            above ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          {/* ---------------- header ---------------- */}
          {view === "days" ? (
            <div className="flex items-center justify-between gap-1">
              <button type="button" onClick={() => shiftMonth(-1)} disabled={atMinMonth} aria-label="Previous month" className={navBtn}>
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => setView("years")}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[0.95rem] font-bold text-ink transition-colors hover:bg-surface-2"
              >
                {MONTHS[cursor.m]} {cursor.y}
                <ChevronDown size={15} className="text-muted" />
              </button>
              <button type="button" onClick={() => shiftMonth(1)} disabled={atMaxMonth} aria-label="Next month" className={navBtn}>
                <ChevronRight size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {view === "months" && (
                <button type="button" onClick={() => setView("years")} aria-label="Back to years" className={navBtn}>
                  <ChevronLeft size={18} />
                </button>
              )}
              <span className="flex-1 px-2 py-2 text-center text-[0.95rem] font-bold text-ink">
                {view === "years" ? "Select a year" : `Month in ${cursor.y}`}
              </span>
              {view === "months" && <span className="h-9 w-9 flex-none" />}
            </div>
          )}

          {/* ---------------- days ---------------- */}
          {view === "days" && (
            <>
              <div className="mt-1 grid grid-cols-7">
                {WEEKDAYS.map((w, i) => (
                  <span key={i} className="grid h-8 place-items-center font-mono text-[0.65rem] uppercase tracking-wide text-muted">
                    {w}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {grid.map((day, i) => {
                  if (!day) return <span key={`pad-${i}`} />;
                  const on = selected && selected.y === cursor.y && selected.m === cursor.m && selected.d === day;
                  const isToday = maxDate.y === cursor.y && maxDate.m === cursor.m && maxDate.d === day;
                  const disabled = isAfter({ y: cursor.y, m: cursor.m, d: day }, maxDate);
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={disabled}
                      onClick={() => pick(day)}
                      className={`grid aspect-square w-full place-items-center rounded-full text-[0.9rem] transition-colors disabled:pointer-events-none disabled:opacity-25 ${
                        on
                          ? "bg-primary font-bold text-on-primary"
                          : `font-medium text-ink hover:bg-surface-2 ${isToday ? "font-bold text-primary" : ""}`
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ---------------- years ---------------- */}
          {view === "years" && (
            <div className="mt-1.5 grid max-h-64 grid-cols-4 gap-1 overflow-y-auto pr-1 nv-scroll-lg">
              {years.map((y) => {
                const on = y === cursor.y;
                return (
                  <button
                    key={y}
                    type="button"
                    ref={on ? selectedYearRef : null}
                    onClick={() => { setCursor((c) => ({ ...c, y })); setView("months"); }}
                    className={`${gridBtn} ${on ? "bg-primary font-bold text-on-primary" : "text-ink hover:bg-surface-2"}`}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          )}

          {/* ---------------- months ---------------- */}
          {view === "months" && (
            <div className="mt-1.5 grid grid-cols-3 gap-1">
              {MONTHS_SHORT.map((label, m) => {
                const on = m === cursor.m && selected?.y === cursor.y;
                const disabled = cursor.y === maxDate.y && m > maxDate.m;
                return (
                  <button
                    key={label}
                    type="button"
                    disabled={disabled}
                    onClick={() => { setCursor((c) => ({ ...c, m })); setView("days"); }}
                    className={`${gridBtn} py-3.5 ${on ? "bg-primary font-bold text-on-primary" : "text-ink hover:bg-surface-2"}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
