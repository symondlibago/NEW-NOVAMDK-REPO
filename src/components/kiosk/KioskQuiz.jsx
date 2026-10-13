import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import KioskTopBar, { GoldTitle } from "./KioskTopBar";
import { GOALS, GOAL_ANSWERS, hasFormChoice } from "./kioskCatalog";

const FORM_ANSWERS = [
  { id: "injection", label: "An injection is fine" },
  { id: "needle-free", label: "No needles, please" },
  { id: "any", label: "No preference" },
];

/* Two taps at most: the goal, then needle or not, and only where that
   category actually offers both. Nothing answered here leaves the kiosk. */
export default function KioskQuiz({ onDone, onBack, onStartOver }) {
  const [goal, setGoal] = useState(null);

  const pickGoal = (slug) => {
    if (hasFormChoice(slug)) setGoal(slug);
    else onDone(slug, null);
  };

  const question = goal
    ? { title: "How would you prefer to take it?", answers: FORM_ANSWERS.map((a) => ({ ...a, pick: () => onDone(goal, a.id) })) }
    : {
        title: "What would you most like to improve?",
        answers: GOALS.map((g) => ({ id: g.slug, label: GOAL_ANSWERS[g.slug], pick: () => pickGoal(g.slug) })),
      };

  return (
    <div className="flex h-full flex-col">
      <KioskTopBar onBack={goal ? () => setGoal(null) : onBack} onStartOver={onStartOver} />
      <main className="flex flex-1 flex-col gap-8 px-8 pb-10 lg:gap-12 lg:px-16 lg:pb-16">
        <div className="flex gap-3 pt-2 lg:pt-6">
          <span className="h-2 flex-1 rounded-full bg-primary lg:h-3" />
          <span className={`h-2 flex-1 rounded-full lg:h-3 ${goal ? "bg-primary" : "bg-surface-2"}`} />
        </div>
        <div>
          <span className="font-mono text-sm uppercase tracking-widest text-ks-heading lg:text-xl">
            Question {goal ? 2 : 1}
          </span>
          <GoldTitle className="mt-3 text-5xl leading-tight lg:text-7xl">{question.title}</GoldTitle>
        </div>
        <div className="flex flex-col gap-4 lg:gap-6">
          {question.answers.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={a.pick}
              className="flex min-h-24 items-center justify-between gap-6 rounded-3xl border-2 border-line bg-surface px-8 text-left text-2xl font-semibold text-ink shadow-sm active:border-primary active:bg-surface-2 lg:min-h-36 lg:px-12 lg:text-4xl"
            >
              {a.label}
              <ChevronRight className="size-8 flex-none text-primary lg:size-12" strokeWidth={2.4} />
            </button>
          ))}
        </div>
        <p className="mt-auto text-center text-base text-muted lg:text-xl">
          This just narrows the list. A licensed provider decides what is right for you.
        </p>
      </main>
    </div>
  );
}
