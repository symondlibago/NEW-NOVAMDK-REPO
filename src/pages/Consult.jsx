import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowRight, Check, ChevronLeft, ChevronRight, ShieldCheck, X } from "lucide-react";
import { productsData, isCompounded, priceLabel } from "../components/data/products";
import { ComplianceBadges, CompoundedDisclaimer } from "../components/Compliance";
import { SCREENS, PICKS, GOAL_FOR_SLUG, CATEGORY_OF, firstScreenFor, match, pathOf } from "../components/quiz/quizData";
import { productSlug, productPath } from "../lib/slug";
import { getLenis } from "../lib/smoothScroll";
import { track, EVENTS } from "../lib/analytics";
import Seo from "../components/Seo";

/* The quick assessment at /start: a goal, a few questions, then one treatment
   option to explore and a second one beside it. Copy and rules live in
   quizData.js. /start/<slug> (the menu's and category pages' links) starts
   past the goal question with that goal already chosen. */

const STEPS = ["Your goal", "A few questions", "Options to explore"];

const BUTTON =
  "flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-bold text-on-primary transition-colors hover:bg-primary-deep disabled:pointer-events-none disabled:opacity-40 lg:w-auto lg:min-w-60";

/* The catalog record behind a pick, for its live price, photo and link. */
const productFor = (key) => productsData.find((p) => productSlug(p) === PICKS[key].slug);

function scrollTop() {
  const l = getLenis();
  if (l) l.scrollTo(0, { immediate: true });
  else window.scrollTo(0, 0);
}

/* Answer chips for the sidebar, in the order they were given. */
function chipsFor(trail, answers) {
  const chips = [];
  trail.forEach((key) => {
    const s = SCREENS[key];
    if (!s?.opts || answers[key] == null) return;
    [].concat(answers[key]).forEach((v) => {
      const o = s.opts.find((x) => x.v === v);
      if (o) chips.push(s.chip ? s.chip(v, o) : o.t);
    });
  });
  return chips;
}

function Sidebar({ step, chips }) {
  return (
    <aside className="hidden flex-col bg-surface-2 px-12 py-14 lg:col-span-5 lg:flex" aria-label="Progress">
      <p className="text-sm font-semibold text-primary">Find a starting point</p>
      <ol className="mt-3">
        {STEPS.map((label, i) => (
          <li key={label} className={`flex items-center gap-3.5 py-3 ${i === step ? "font-semibold text-ink" : "font-medium text-muted"}`}>
            <span
              className={`grid size-7 flex-none place-items-center rounded-full border text-sm ${
                i < step ? "border-primary bg-primary text-on-primary" : i === step ? "border-primary text-primary" : "border-line-strong"
              }`}
            >
              {i < step ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>
      <h3 className="mb-3 mt-10 text-sm font-semibold text-muted">What you&rsquo;ve told us</h3>
      <div className="flex flex-wrap gap-2">
        {chips.length ? (
          chips.map((c, i) => (
            <span key={`${i}-${c}`} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm">{c}</span>
          ))
        ) : (
          <span className="text-sm text-muted">Your answers will show up here.</span>
        )}
      </div>
      <p className="mt-auto flex max-w-xs items-start gap-2.5 pt-10 text-sm text-muted">
        <ShieldCheck className="mt-0.5 size-4.5 flex-none" />
        Your answers stay in your browser and aren&rsquo;t sent anywhere. Prescription treatments require evaluation by a licensed provider.
      </p>
    </aside>
  );
}

function Question({ screen, value, onPick }) {
  const multi = screen.type === "multi";
  return (
    <>
      {screen.eyebrow && <p className="mb-2.5 text-sm font-semibold text-primary">{screen.eyebrow}</p>}
      <h1 className="text-3xl font-medium leading-tight tracking-tight lg:text-4xl">{screen.h}</h1>
      {screen.sub && <p className="mt-2.5 text-base text-muted">{screen.sub}</p>}
      <div className="mt-6 flex flex-col gap-2.5" role="group" aria-label={screen.h}>
        {screen.opts.map((o) => {
          const on = multi ? (value || []).includes(o.v) : value === o.v;
          return (
            <button
              key={o.v}
              type="button"
              aria-pressed={on}
              onClick={() => onPick(o)}
              className={`flex min-h-14 w-full items-center gap-3.5 rounded-2xl border-2 px-4.5 py-3.5 text-left text-base transition-colors ${
                on ? "border-primary bg-surface-2/50 font-semibold" : "border-line bg-surface font-medium hover:border-line-strong"
              }`}
            >
              <span
                className={`grid size-5.5 flex-none place-items-center border-2 ${multi ? "rounded-md" : "rounded-full"} ${
                  on ? "border-primary bg-primary" : "border-line-strong"
                }`}
              >
                <Check className={`size-3 text-ink ${on ? "opacity-100" : "opacity-0"}`} strokeWidth={3} />
              </span>
              <span className="flex-1">
                {o.t}
                {o.hint && <span className="mt-0.5 block text-sm font-normal text-muted">{o.hint}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function Note({ screen }) {
  return (
    <div className="rounded-3xl bg-surface-2/50 px-7 py-8">
      <p className="mb-2.5 text-sm font-semibold text-primary">{screen.eyebrow}</p>
      <h1 className="text-3xl font-medium leading-tight tracking-tight lg:text-4xl">{screen.h}</h1>
      <div className="mt-2 border-l-2 border-primary py-2 pl-5">
        <p className="max-w-prose text-lg leading-relaxed">{screen.p}</p>
        {screen.fine && <p className="mt-4 text-sm text-muted">{screen.fine}</p>}
      </div>
    </div>
  );
}

function Result({ answers }) {
  const { lead, alt, why } = match(answers);
  const pick = PICKS[lead];
  const p = productFor(lead);
  const other = productFor(alt);
  /* A catalog rename would leave the pick without a page: send them to the
     shelf rather than show a broken card. */
  if (!p) {
    return (
      <Link to="/treatments" className={BUTTON}>
        See all treatments <ArrowRight className="size-4" />
      </Link>
    );
  }
  return (
    <>
      <p className="mb-2.5 text-sm font-semibold text-primary">Based on your answers</p>
      <h1 className="text-3xl font-medium leading-tight tracking-tight lg:text-4xl">A treatment option to explore</h1>
      <div className="mt-4 overflow-hidden rounded-3xl border-2 border-primary bg-surface lg:grid lg:grid-cols-11">
        <div className="hidden place-items-center bg-surface-2/50 lg:col-span-5 lg:grid">
          <img src={p.img} alt={pick.name} className="h-4/5 max-h-72 w-auto object-contain" />
        </div>
        <div className="p-5.5 lg:col-span-6">
          <div className="mb-3.5 flex items-center gap-3.5">
            <span className="grid size-22 flex-none place-items-center rounded-2xl bg-surface-2/50 lg:hidden">
              <img src={p.img} alt="" className="h-19 w-auto object-contain" />
            </span>
            <div>
              <span className="mb-1.5 inline-block rounded-full bg-surface-2/50 px-2.5 py-1 text-xs font-semibold text-muted">{p.categoryName}</span>
              <h2 className="text-xl font-semibold leading-tight tracking-tight lg:text-2xl">{pick.name}</h2>
              <p className="text-sm text-muted">{pick.form}</p>
            </div>
          </div>
          <ComplianceBadges compounded={isCompounded(p)} rx={!p.otc} className="mb-3.5" />
          <ul className="mb-4 space-y-1">
            {why.map((line) => (
              <li key={line} className="flex gap-2.5 text-sm">
                <Check className="mt-0.5 size-4 flex-none text-primary" strokeWidth={2.4} />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between border-t border-line pt-3.5 text-sm text-muted">
            <span>{p.exactPrice ? "Price" : "Starting at"}</span>
            <b className="text-2xl font-semibold tracking-tight text-ink">{priceLabel(p)}</b>
          </div>
        </div>
      </div>

      <div className="mt-4.5 flex flex-col">
        <Link to={productPath(p)} className={BUTTON}>
          See treatment details <ArrowRight className="size-4" />
        </Link>
        <p className="mt-2.5 text-center text-sm text-muted lg:text-left">
          This quiz is general information, not medical advice. A licensed provider reviews your intake and decides whether any treatment is appropriate.
        </p>
      </div>

      {other && (
        <Link to={productPath(other)} className="mt-3.5 flex items-center gap-3.5 rounded-2xl border border-line px-3.5 py-3 hover:border-line-strong">
          <img src={other.img} alt="" className="size-13 rounded-xl bg-surface-2/50 object-contain p-1" />
          <span className="flex-1">
            <small className="block text-xs text-muted">Another option to explore</small>
            <b className="text-base font-semibold">{PICKS[alt].name}</b>
          </span>
          <ChevronRight className="size-4" />
        </Link>
      )}

      {isCompounded(p) && <CompoundedDisclaimer className="mt-6" />}
    </>
  );
}

export default function Consult() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const preset = GOAL_FOR_SLUG[slug];

  /* trail is every screen before this one, so Back can retrace any path. */
  const [answers, setAnswers] = useState(() => (preset ? { goal: preset } : {}));
  const [trail, setTrail] = useState(() => (preset ? ["goal"] : []));
  const [cur, setCur] = useState(() => (preset ? firstScreenFor(preset) : "goal"));
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    track(EVENTS.QUIZ_STARTED, { slug: slug || "start" });
  }, [slug]);

  useEffect(() => {
    scrollTop();
    if (cur === "result") {
      // The category only: no answers and no product leave the page.
      track(EVENTS.QUIZ_COMPLETED, { slug: slug || "start", goal: CATEGORY_OF[pathOf(answers)] });
    }
    // Fires on arrival at a screen, not on every answer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur]);

  const screen = SCREENS[cur];
  const go = (next) => {
    setTrail((t) => [...t, cur]);
    setCur(next);
  };
  const back = () => {
    if (!trail.length) return navigate("/treatments");
    setCur(trail[trail.length - 1]);
    setTrail((t) => t.slice(0, -1));
  };
  const exit = () => navigate("/");

  const pick = (o) => {
    if (screen.type === "multi") {
      const prev = answers[cur] || [];
      let nextVals;
      if (prev.includes(o.v)) nextVals = prev.filter((v) => v !== o.v);
      else if (o.only) nextVals = [o.v];
      else nextVals = prev.filter((v) => !screen.opts.find((x) => x.v === v && x.only)).concat(o.v);
      setAnswers((a) => ({ ...a, [cur]: nextVals }));
      return;
    }
    /* One choice moves straight on, after a beat so the tick is seen. */
    if (moving) return;
    setMoving(true);
    const nextAnswers = { ...answers, [cur]: o.v };
    setAnswers(nextAnswers);
    setTimeout(() => {
      setMoving(false);
      go(screen.next(nextAnswers));
    }, 240);
  };

  const answered = screen.type === "multi" ? (answers[cur] || []).length > 0 : answers[cur] != null;
  const showContinue = screen.type === "note" || screen.type === "multi" || (screen.type === "single" && answered && !moving);
  const progress = cur === "result" ? 100 : cur === "goal" ? 8 : cur === "vibe" ? 14 : screen.type === "note" ? 80 : 30 + trail.filter((k) => SCREENS[k].step === 1).length * 14;

  return (
    /* A column, so the two panes below the header fill exactly what is left
       of the screen and the sidebar's footnote stays in view. */
    <main className="flex min-h-screen w-full flex-col bg-bg text-ink">
      <Seo title="Find a Starting Point" noindex />
      <header className="sticky top-0 z-20 flex-none border-b border-line bg-bg">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-3 items-center px-3 lg:px-8">
          <div className="flex items-center gap-4">
            <img src="/logo-2026.png" alt="Nova MDK" className="hidden h-8 w-auto lg:block" />
            <button
              type="button"
              onClick={back}
              aria-label="Back"
              className={`grid size-11 place-items-center rounded-full hover:bg-surface-2/50 ${trail.length || cur !== "goal" ? "" : "invisible"}`}
            >
              <ChevronLeft className="size-5" />
            </button>
          </div>
          <img src="/logo-2026.png" alt="Nova MDK" className="h-8 w-auto justify-self-center lg:hidden" />
          <button type="button" onClick={exit} aria-label="Exit quiz" className="col-start-3 grid size-11 place-items-center justify-self-end rounded-full hover:bg-surface-2/50">
            <X className="size-4.5" />
          </button>
        </div>
        <div className="h-0.5 bg-line">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      </header>

      <div className="flex-1 lg:grid lg:grid-cols-12">
        <Sidebar step={screen.step} chips={chipsFor([...trail, cur], answers)} />
        <section className={`mx-auto max-w-xl px-5 pt-7 lg:col-span-7 lg:mx-0 lg:max-w-2xl lg:px-12 lg:py-18 ${showContinue ? "pb-36" : "pb-12"}`}>
          <div key={cur} aria-live="polite">
            {(screen.type === "single" || screen.type === "multi") && <Question screen={screen} value={answers[cur]} onPick={pick} />}
            {screen.type === "note" && <Note screen={screen} />}
            {screen.type === "result" && <Result answers={answers} />}
          </div>

          {showContinue && (
            /* Pinned to the foot of a phone screen; in the flow on desktop. */
            <div className="fixed inset-x-0 bottom-0 z-10 bg-linear-to-t from-bg from-70% to-transparent px-5 pb-6 pt-4 lg:static lg:bg-none lg:px-0 lg:pb-0 lg:pt-7">
              <div className="mx-auto max-w-lg lg:mx-0 lg:max-w-none">
                <button type="button" className={BUTTON} disabled={!answered && screen.type !== "note"} onClick={() => go(screen.next(answers))}>
                  Continue
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
