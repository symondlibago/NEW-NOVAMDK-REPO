import React, { useState } from "react";
import { Egg, Info } from "lucide-react";

/* Simple meals for a small appetite, protein first. General food ideas only:
   amounts are rough, and the care team decides what is right for a patient. */
const MEALS = {
  Breakfast: [
    ["Greek yogurt, berries and nuts", 20, "5 min"],
    ["Egg muffin cups", 18, "Make ahead"],
    ["Cottage cheese on toast", 16, "5 min"],
  ],
  Lunch: [
    ["Tuna salad lettuce wraps", 25, "10 min"],
    ["Chicken and veggie soup", 22, "Make ahead"],
    ["Lentil and feta salad", 15, "10 min"],
  ],
  Snacks: [
    ["Protein smoothie", 20, "5 min"],
    ["Cheese and turkey roll-ups", 14, "2 min"],
    ["Edamame", 11, "5 min"],
  ],
  Dinner: [
    ["Salmon, rice and greens", 28, "20 min"],
    ["Turkey chili", 24, "Make ahead"],
    ["Tofu stir fry", 18, "15 min"],
  ],
};

/* The check-in's protein answer, in words: Rarely, Some meals, Most meals. */
const PROTEIN = ["Protein at few meals", "Protein at some meals", "Protein at most meals"];

export default function MealIdeas({ weeks }) {
  const [meal, setMeal] = useState("Breakfast");
  const last = [...weeks].reverse().find((w) => w.entry?.protein != null)?.entry.protein;

  return (
    <div className="space-y-4">
      {last != null && (
        <section className="flex items-center gap-4 rounded-3xl border border-primary/25 bg-linear-to-br from-primary/15 to-primary/5 p-6">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
            <Egg size={22} />
          </span>
          <div>
            <p className="text-sm text-muted">From your last check-in</p>
            <p className="text-xl font-semibold tracking-tight text-ink">{PROTEIN[last]}</p>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-line bg-surface p-5 nv-shadow sm:p-6">
        <p className="text-base font-semibold text-ink">Meal ideas</p>
        <p className="mt-1 text-sm text-muted">Small portions, protein first.</p>
        <div className="mt-4 grid grid-cols-4 gap-1.5 rounded-full bg-surface-2 p-1" role="tablist" aria-label="Meal">
          {Object.keys(MEALS).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={meal === k}
              onClick={() => setMeal(k)}
              className={`rounded-full py-2 text-xs font-semibold sm:text-sm transition-colors ${meal === k ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}
            >
              {k}
            </button>
          ))}
        </div>
        <ul className="mt-3 divide-y divide-line">
          {MEALS[meal].map(([name, grams, time]) => (
            <li key={name} className="py-3.5">
              <span className="block text-base font-semibold text-ink">{name}</span>
              <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <span className="rounded-full bg-primary/10 px-3 py-0.5 font-semibold text-primary-deep tabular-nums">About {grams} g protein</span>
                {time}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex gap-2 text-sm text-muted">
          <Info size={14} className="mt-0.5 shrink-0 text-primary" /> Protein amounts are rough. Ask your care team how much is right for you.
        </p>
      </section>
    </div>
  );
}
