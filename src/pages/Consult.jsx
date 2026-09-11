import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, X, Check, Lock, ShieldCheck } from "lucide-react";
import { CONSULTS, CONSULT_ORDER } from "../components/data/consultations";
import { getLenis } from "../lib/smoothScroll";
import { track, EVENTS } from "../lib/analytics";
import useKioskMode from "../lib/useKioskMode";
import Seo from "../components/Seo";

// On the kiosk, keep each step vertically centered — but biased a little upward
// (pb-40) because the physical kiosk is mounted low, so dead-center sits too far
// down for a comfortable reach. Touch targets land in the upper-middle band.
const CENTER_KIOSK = "flex min-h-[calc(100vh-65px)] flex-col justify-center pb-64";

const EASE = [0.4, 0, 0.2, 1];

function PrimaryButton({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group/btn mt-7 flex w-full items-center justify-center gap-2 rounded-[calc(13px*var(--nv-r-scale,1))] bg-primary px-5 py-[17px] text-[15.5px] font-bold tracking-tight text-on-primary nv-shadow transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-deep disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
      <ArrowRight size={17} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
    </button>
  );
}

/* ------------------------------- screens ------------------------------- */
/* Category picker — shown first when no goal is chosen yet ("/start"). Picking
   one routes to that category's questionnaire ("/start/:slug"). */
function Picker({ onPick }) {
  return (
    <section className="mx-auto max-w-[560px] px-6 pb-14 pt-8">
      <div className="font-mono text-[12px] uppercase tracking-[0.06em] text-accent">Free 2-minute assessment</div>
      <h2 className="mt-4 font-display text-[clamp(1.8rem,5vw,2.1rem)] font-medium leading-[1.12] tracking-tight text-ink">
        What would you like help with?
      </h2>
      <p className="mt-4 text-[1.02rem] leading-relaxed text-muted">
        Pick a focus and we'll ask a few quick questions, then match you with the right care.
      </p>

      <div className="mt-7 flex flex-col gap-2.5">
        {CONSULT_ORDER.map((key) => {
          const c = CONSULTS[key];
          const Icon = c.Icon;
          return (
            <button
              key={key}
              onClick={() => onPick(key)}
              className="group flex w-full items-center gap-4 rounded-[calc(14px*var(--nv-r-scale,1))] border-[1.5px] border-line bg-surface px-[18px] py-[15px] text-left transition-colors duration-200 hover:border-primary active:scale-[0.99]"
            >
              <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-surface-2 text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary">
                <Icon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15.5px] font-bold tracking-tight text-ink">{c.short}</span>
                <span className="mt-0.5 block truncate text-[13px] text-muted">{c.blurb}</span>
              </span>
              <ArrowRight size={18} className="flex-none text-muted transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-[13px] text-muted">
        <Lock size={14} /> <span>Private &amp; secure</span>
      </div>
    </section>
  );
}

function Intro({ step, onNext }) {
  return (
    <section className="mx-auto max-w-[480px] px-6 pb-12 pt-8">
      <div className="font-mono text-[12px] uppercase tracking-[0.06em] text-accent">{step.eyebrow}</div>
      <h2 className="mt-4 font-display text-[clamp(1.8rem,5vw,2.1rem)] font-medium leading-[1.12] tracking-tight text-ink">{step.title}</h2>
      <p className="mt-4 text-[1.02rem] leading-relaxed text-muted">{step.body}</p>
      <PrimaryButton onClick={onNext}>{step.cta}</PrimaryButton>
      <div className="mt-4 flex items-center justify-center gap-2 text-[13px] text-muted">
        <Lock size={14} /> <span>Private &amp; secure</span>
      </div>
    </section>
  );
}

function Question({ step, value, onPick, onNext }) {
  const multi = !!step.multi;
  const picked = value ?? (multi ? [] : null);
  const isOn = (idx) => (multi ? picked.includes(idx) : picked === idx);

  return (
    <section className="mx-auto max-w-[480px] px-6 pb-12 pt-8">
      <div className="font-mono text-[12px] uppercase tracking-[0.06em] text-accent">{multi ? "Choose any" : "Choose one"}</div>
      <h2 className="mt-4 text-[clamp(1.5rem,4.4vw,1.65rem)] font-bold leading-[1.2] tracking-tight text-ink">{step.q}</h2>
      {step.help && <p className="mt-2.5 text-[0.95rem] text-muted">{step.help}</p>}

      <div className="mt-7 flex flex-col gap-2.5">
        {step.opts.map((o, idx) => {
          const on = isOn(idx);
          return (
            <button
              key={idx}
              onClick={() => onPick(idx)}
              className={`flex w-full items-center gap-3.5 rounded-[calc(14px*var(--nv-r-scale,1))] border-[1.5px] px-[18px] py-[17px] text-left text-[15.5px] font-semibold transition-colors duration-200 active:scale-[0.99] ${
                on ? "border-primary bg-surface-2" : "border-line bg-surface hover:border-line-strong"
              }`}
            >
              <span
                className={`grid h-[22px] w-[22px] flex-none place-items-center border-2 transition-colors duration-200 ${multi ? "rounded-[calc(7px*var(--nv-r-scale,1))]" : "rounded-full"} ${
                  on ? "border-primary bg-primary" : "border-line"
                }`}
              >
                <Check
                  size={13}
                  strokeWidth={3}
                  className={`text-on-primary transition-all duration-200 ${on ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
                />
              </span>
              <span>{o}</span>
            </button>
          );
        })}
      </div>

      {multi && <PrimaryButton onClick={onNext} disabled={picked.length === 0}>Continue</PrimaryButton>}
    </section>
  );
}

function Fact({ step, onNext }) {
  return (
    <section className="flex min-h-[calc(100vh-65px)] flex-col justify-center bg-surface-2">
      <div className="mx-auto w-full max-w-[520px] px-7 py-12">
        <div className="mb-7 h-[3px] w-10 rounded-full bg-primary" />
        <p className="font-display text-[clamp(1.55rem,4.6vw,2rem)] font-normal leading-[1.24] tracking-tight text-ink">{step.lead}</p>
        <p className="mt-5 max-w-[430px] text-[1.02rem] leading-relaxed text-ink/70">{step.body}</p>
        <div className="max-w-[430px]"><PrimaryButton onClick={onNext}>Continue</PrimaryButton></div>
      </div>
    </section>
  );
}

function End({ step, onFinish, onHome }) {
  return (
    <section className="mx-auto flex max-w-[480px] flex-col items-center px-6 py-16 text-center">
      <div
        className="mb-7 grid h-[62px] w-[62px] place-items-center rounded-full bg-surface-2 text-primary"
        style={{ boxShadow: "0 0 0 8px color-mix(in oklab, var(--nv-primary) 8%, transparent)" }}
      >
        <Check size={30} strokeWidth={2.4} />
      </div>
      <h2 className="font-display text-[clamp(1.7rem,4.6vw,1.95rem)] font-medium leading-[1.14] tracking-tight text-ink">{step.title}</h2>
      <p className="mt-3.5 max-w-[380px] text-[1.02rem] text-muted">{step.body}</p>
      <div className="w-full max-w-[340px]"><PrimaryButton onClick={onFinish}>{step.cta}</PrimaryButton></div>
      <div className="mt-[18px] flex items-center gap-2 text-[13px] text-muted">
        <ShieldCheck size={14} /> <span>{step.note}</span>
      </div>
      <button onClick={onHome} className="mt-3 px-2 py-1.5 text-[14px] font-semibold text-muted transition-colors hover:text-ink">
        ← Back to all care
      </button>
    </section>
  );
}

/* ------------------------------- engine -------------------------------- */
export default function Consult() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const consult = CONSULTS[slug];
  const isKiosk = useKioskMode();

  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});

  // Reset when switching funnels (defensive — route normally remounts).
  useEffect(() => {
    setI(0);
    setAnswers({});
    if (CONSULTS[slug]) track(EVENTS.QUIZ_STARTED, { slug });
  }, [slug]);

  // Scroll to top on every step.
  useEffect(() => {
    const l = getLenis();
    if (l) l.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [i]);

  // No category chosen yet ("/start") → show the picker first.
  if (!slug) {
    return (
      <main className="min-h-screen w-full bg-bg text-ink">
        <Seo title="Start Your Consultation" noindex />
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-bg/85 px-4 py-3 backdrop-blur-md md:px-5">
          <button onClick={() => navigate("/treatments")} aria-label="Back" className="grid h-[38px] w-[38px] place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink">
            <ArrowLeft size={18} />
          </button>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Step 1 of 2</span>
          <button onClick={() => navigate("/")} aria-label="Close" className="grid h-[38px] w-[38px] place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink">
            <X size={18} />
          </button>
        </header>
        <div className={isKiosk ? CENTER_KIOSK : undefined}>
          <Picker onPick={(key) => navigate(`/start/${key}`)} />
        </div>
      </main>
    );
  }

  if (!consult) return <Navigate to="/" replace />;

  const steps = consult.steps;
  const step = steps[i];
  const lastIndex = steps.length - 1;

  const advance = () => setI((p) => Math.min(p + 1, lastIndex));
  const goHome = () => navigate("/");
  const back = () => (i === 0 ? goHome() : setI((p) => p - 1));
  const finish = () => {
    track(EVENTS.QUIZ_COMPLETED, { slug, goal: consult.goalSlug });
    navigate(`/treatments/${consult.goalSlug}`);
  };

  // progress + counter
  const progress = lastIndex > 0 ? i / lastIndex : 0;
  const questions = steps.filter((s) => s.t === "q");
  let counter = "";
  if (step.t === "q") {
    const n = questions.indexOf(step) + 1;
    counter = `${String(n).padStart(2, "0")} / ${String(questions.length).padStart(2, "0")}`;
  }

  const pick = (idx) => {
    if (step.multi) {
      setAnswers((a) => {
        const arr = a[i] ? [...a[i]] : [];
        const at = arr.indexOf(idx);
        if (at > -1) arr.splice(at, 1);
        else arr.push(idx);
        return { ...a, [i]: arr };
      });
    } else {
      setAnswers((a) => ({ ...a, [i]: idx }));
      setTimeout(advance, 220);
    }
  };

  return (
    <main className="min-h-screen w-full bg-bg text-ink">
      <Seo title={consult.name} noindex />
      {/* progress bar */}
      <header className="sticky top-0 z-20 flex items-center gap-3.5 border-b border-line bg-bg/85 px-4 py-3 backdrop-blur-md md:px-5">
        <button onClick={back} aria-label="Back" className="grid h-[38px] w-[38px] flex-none place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink">
          <ArrowLeft size={18} />
        </button>
        <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-line">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={false}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.5, ease: EASE }}
          />
        </div>
        <div className="min-w-[48px] flex-none text-right font-mono text-[12px] tracking-[0.04em] text-muted">{counter}</div>
        <button onClick={goHome} aria-label="Close" className="grid h-[38px] w-[38px] flex-none place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink">
          <X size={18} />
        </button>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.32, ease: EASE }}
          className={isKiosk ? CENTER_KIOSK : undefined}
        >
          {step.t === "intro" && <Intro step={step} onNext={advance} />}
          {step.t === "q" && <Question step={step} value={answers[i]} onPick={pick} onNext={advance} />}
          {step.t === "fact" && <Fact step={step} onNext={advance} />}
          {step.t === "end" && <End step={step} onFinish={finish} onHome={goHome} />}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
