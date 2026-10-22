import React, { useState } from "react";
import { format } from "date-fns";
import { BookOpen, Check, ChevronRight, Lightbulb, Lock } from "lucide-react";
import { LESSONS, lessonState } from "../../../lib/lessons";
import Sheet from "./Sheet";

/* One lesson, a card at a time, ending on one thing to try this week. The
   pages restart each time it opens (`session`), and the lesson stays on screen
   while the sheet slides away. */
export function LessonSheet({ lesson, session, open, onClose, onDone }) {
  return (
    <Sheet open={open} onClose={onClose} label={lesson?.title || "Lesson"}>
      {lesson && <LessonPages key={session} lesson={lesson} onDone={onDone} />}
    </Sheet>
  );
}

function LessonPages({ lesson, onDone }) {
  const [page, setPage] = useState(0);
  const pages = lesson.cards.length + 1;
  const last = page === pages - 1;
  return (
    <div className="flex flex-col">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">
        Lesson {LESSONS.indexOf(lesson) + 1} of {LESSONS.length} · 2 min
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{lesson.title}</h2>
      <span className="mt-4 flex gap-1.5" aria-hidden="true">
        {Array.from({ length: pages }, (_, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i <= page ? "bg-primary" : "bg-line"}`} />
        ))}
      </span>

      <div className="mt-6 flex min-h-48 flex-col justify-center">
        {last ? (
          <div className="rounded-2xl bg-primary/10 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-primary-deep">
              <Lightbulb size={16} /> Try this week
            </p>
            <p className="mt-3 text-xl font-semibold leading-snug text-ink">{lesson.tryThis}</p>
          </div>
        ) : (
          <p className="text-xl leading-relaxed text-ink">{lesson.cards[page]}</p>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        {page > 0 && (
          <button
            type="button"
            onClick={() => setPage(page - 1)}
            className="flex-1 rounded-full border border-line-strong py-3 text-base font-semibold text-ink transition-colors hover:border-primary"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={() => (last ? onDone() : setPage(page + 1))}
          className="flex-1 rounded-full bg-primary py-3 text-base font-semibold text-on-primary transition-colors hover:bg-primary-deep"
        >
          {last ? "Done" : "Next"}
        </button>
      </div>
    </div>
  );
}

/* Progress's lesson card: this week's lesson, and the library of the ones
   opened so far. A new lesson opens each week. */
export default function LessonsCard({ habits, className = "" }) {
  const st = lessonState(habits.data, habits.thisWeek);
  const [reading, setReading] = useState(null); // { lesson, session }
  const [open, setOpen] = useState(false);
  const [library, setLibrary] = useState(false);
  const isRead = st.read.has(st.current.title);
  const nextOpens = st.unlocked < LESSONS.length ? st.opensOn(st.unlocked) : null;

  const start = (lesson) => {
    setLibrary(false);
    setReading({ lesson, session: Date.now() });
    setOpen(true);
  };

  return (
    <section className={className}>
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-surface-2 text-primary">
          <BookOpen size={18} />
        </span>
        <p className="flex-1 text-base font-semibold text-ink">This week&rsquo;s lesson</p>
        <span className="text-sm text-muted">2 min</span>
      </div>
      <p className="mt-4 text-sm font-semibold text-muted">
        Lesson {st.number} of {LESSONS.length}
      </p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-ink">{st.current.title}</p>
      <p className="mt-2 text-base leading-snug text-muted">{isRead && nextOpens ? `Your next lesson opens ${format(nextOpens, "EEEE, MMM d")}.` : st.current.cards[0]}</p>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <button
          type="button"
          onClick={() => start(st.current)}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
            isRead ? "border border-line-strong text-ink hover:border-primary" : "bg-primary text-on-primary hover:bg-primary-deep"
          }`}
        >
          {isRead ? (
            <>
              <Check size={15} /> Read again
            </>
          ) : (
            "Start lesson"
          )}
        </button>
        <button type="button" onClick={() => setLibrary(true)} className="text-sm font-semibold text-primary hover:underline">
          All lessons
        </button>
      </div>

      <Sheet open={library} onClose={() => setLibrary(false)} label="Lessons">
        <p className="text-2xl font-semibold tracking-tight text-ink">Lessons</p>
        <p className="mt-1 text-sm text-muted">Two minutes each. A new one opens every week.</p>
        <ul className="mt-5 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {LESSONS.map((l, i) => {
            const opened = i < st.unlocked;
            const done = st.read.has(l.title);
            return (
              <li key={l.title}>
                <button
                  type="button"
                  disabled={!opened}
                  onClick={() => start(l)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors enabled:hover:bg-surface-2"
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                      done ? "bg-primary text-on-primary" : opened ? "border border-primary text-primary-deep" : "bg-surface-2 text-muted"
                    }`}
                  >
                    {done ? <Check size={15} /> : i + 1}
                  </span>
                  <span className={`min-w-0 flex-1 text-base font-semibold ${opened ? "text-ink" : "text-muted"}`}>{l.title}</span>
                  {opened ? (
                    <ChevronRight size={17} className="shrink-0 text-muted" />
                  ) : (
                    <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-muted">
                      <Lock size={12} /> {format(st.opensOn(i), "MMM d")}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </Sheet>

      <LessonSheet
        lesson={reading?.lesson}
        session={reading?.session}
        open={open}
        onClose={() => setOpen(false)}
        onDone={() => {
          habits.markRead(reading.lesson.title, st.start);
          setOpen(false);
        }}
      />
    </section>
  );
}
