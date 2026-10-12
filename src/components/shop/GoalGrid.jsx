import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import CategoryGrid from "./CategoryGrid";
import { GOAL_TILES } from "./goalTiles";
import { track, EVENTS } from "../../lib/analytics";

/* The six goal tiles under their "Not sure where to start?" line. The treatments
   page runs it at every width; the home page uses it on a phone, where the
   client wants all six on one screen (2026-10-12). On a phone the line is one
   row, question left and link right, as the comp sets it. */
export default function GoalGrid({ source }) {
  return (
    <>
      <div className="mb-4 flex sm:mb-6 sm:justify-end">
        {/* /start is the quiz, which opens on its goal picker when no goal is
            chosen: the same place the sixth tile goes. */}
        <Link
          to="/start"
          onClick={() => track(EVENTS.QUIZ_STARTED, { click_source: `${source}-header` })}
          className="group flex w-full items-center justify-between gap-3 sm:block sm:w-auto sm:shrink-0"
        >
          <span className="block whitespace-nowrap text-[0.88rem] font-bold text-ink sm:text-[0.98rem]">Not sure where to start?</span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[0.84rem] text-muted transition-colors duration-300 group-hover:text-primary sm:mt-1.5 sm:gap-2.5 sm:text-[0.94rem]">
            Take a quick assessment
            <ArrowRight size={16} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </Link>
      </div>
      {/* No `featured` here: the sixth cell squares the grid off at 2x3, and a
          double-width first tile would break that back into ragged rows. */}
      <CategoryGrid
        items={GOAL_TILES}
        compact
        onItemClick={(it) => track(EVENTS.CATEGORY_SELECTED, { treatment_category: it.goal, click_source: source })}
      />
    </>
  );
}
