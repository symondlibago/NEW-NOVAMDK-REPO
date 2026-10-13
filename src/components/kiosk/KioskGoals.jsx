import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import KioskTopBar, { GoldTitle } from "./KioskTopBar";
import { GOALS, startingPrice } from "./kioskCatalog";

/* A goal card: the treatments page's tan card and cut-out, with dark type
   because cream on the lighter tans is too faint to read at a distance. */
function GoalCard({ goal, hero = false, onPick }) {
  const art = goal.art;
  const price = hero ? startingPrice(goal.slug) : "";
  return (
    <button
      type="button"
      onClick={() => onPick(goal.slug)}
      className={`nv-goal flex flex-col justify-between rounded-3xl text-left ${art.bg || ""} ${
        hero ? "min-h-80 p-8 lg:min-h-112 lg:p-12" : "min-h-64 p-6 lg:min-h-88 lg:p-9"
      }`}
    >
      <img
        src={art.hero || art.cutout}
        alt=""
        aria-hidden="true"
        className={`nv-goal__figure pointer-events-none absolute bottom-0 right-0 w-auto max-w-none object-contain ${
          hero ? "h-full" : "h-5/6"
        }`}
      />
      <span className={`nv-goal__content flex flex-col gap-2 ${hero ? "max-w-1/2" : "max-w-3/5"}`}>
        <span className="font-mono text-xs uppercase tracking-widest text-ks-heading lg:text-base">{goal.tag}</span>
        <span className={`font-display font-extrabold leading-none tracking-tight text-ink ${hero ? "text-5xl lg:text-7xl" : "text-3xl lg:text-5xl"}`}>
          {goal.name}
        </span>
        {hero && <span className="mt-2 text-lg font-medium leading-snug text-ink/75 lg:text-2xl">{goal.blurb}</span>}
      </span>
      <span className="nv-goal__content flex flex-wrap items-center gap-3">
        {hero && (
          <span className="rounded-full bg-ink px-4 py-2 text-base font-semibold text-surface lg:px-5 lg:text-xl">Most popular</span>
        )}
        {price && <span className="text-xl font-bold text-ink lg:text-3xl">{price}</span>}
        <span className={`ml-auto grid place-items-center rounded-full bg-surface text-ink ${hero ? "size-16 lg:size-20" : "size-12 lg:size-16"}`}>
          <ArrowRight className="size-6 lg:size-8" strokeWidth={2.4} />
        </span>
      </span>
    </button>
  );
}

export default function KioskGoals({ onPick, onQuiz, onStartOver }) {
  const [hero, ...rest] = GOALS;
  return (
    <div className="flex h-full flex-col">
      <KioskTopBar onStartOver={onStartOver} />
      <main data-lenis-prevent className="flex flex-1 flex-col gap-5 overflow-y-auto px-8 pb-8 lg:gap-7 lg:px-16 lg:pb-12">
        <div className="pt-2 lg:pt-4">
          <GoldTitle className="text-5xl lg:text-8xl">What&rsquo;s your goal?</GoldTitle>
          <p className="mt-3 text-xl text-muted lg:text-3xl">Tap one to see your treatment options.</p>
        </div>

        <GoalCard goal={hero} hero onPick={onPick} />
        <div className="grid grid-cols-2 gap-5 lg:gap-7">
          {rest.map((g) => (
            <GoalCard key={g.slug} goal={g} onPick={onPick} />
          ))}
        </div>

        <button
          type="button"
          onClick={onQuiz}
          className="flex items-center gap-6 rounded-3xl bg-panel p-7 text-left text-on-panel lg:gap-8 lg:p-10"
        >
          <span className="grid size-16 flex-none place-items-center rounded-full bg-ks-brass text-white lg:size-24">
            <Sparkles className="size-8 lg:size-12" />
          </span>
          <span className="flex flex-1 flex-col gap-1">
            <span className="text-lg text-on-panel/70 lg:text-2xl">Not sure where to start?</span>
            <span className="font-display text-3xl font-extrabold text-white lg:text-5xl">Take the quick quiz</span>
            <span className="text-lg text-on-panel/70 lg:text-2xl">Two taps, then we&rsquo;ll show you options to explore.</span>
          </span>
          <ArrowRight className="size-8 flex-none text-ks-cream lg:size-12" strokeWidth={2.4} />
        </button>

        <p className="mt-auto text-center text-base text-muted lg:text-xl">
          Prescription treatments require evaluation by a licensed healthcare provider and are prescribed only when medically appropriate.
        </p>
      </main>
    </div>
  );
}
