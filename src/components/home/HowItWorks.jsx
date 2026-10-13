import React from "react";
import { Link } from "react-router-dom";
import { motion as Motion, useMotionValueEvent, useScroll, useSpring } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Reveal from "../ui/Reveal";
import BlurIn from "../ui/BlurIn";

/**
 * "Care in Three Simple Steps", rebuilt 2026-10-13 from the client's comp and
 * the Good Life Meds "How it works" they pointed to.
 *
 * The steps run down a rail that fills with gold as the reader scrolls, each
 * number lighting as the fill reaches it. On a desktop the photo beside them is
 * pinned and changes with the step in front, ending on the Nova MDK box, the
 * one part of the old comp the client wanted kept. On a phone each step carries
 * its own photo. Colours are the site's own: ink type, brass rail, cream ground.
 *
 * The photos are this band's own, sharper copies (client, 2026-10-13: the
 * shared journey files were too soft here): the intake photo upscaled 2x from
 * the client's original, a real clinician in place of the generated doctor,
 * and the Nova MDK box from the client's full-size file.
 */

const STEPS = [
  {
    tag: "Start online",
    title: "Complete a private assessment",
    body: "Share your goals and health history from wherever you are, on your own time.",
    img: "/site/home/how-intake.avif",
  },
  {
    tag: "Licensed provider review",
    title: "A provider reviews your information",
    body: "A licensed provider reviews your assessment and determines whether treatment is appropriate for you.",
    img: "/site/home/how-provider.avif",
  },
  {
    tag: "Discreet delivery",
    title: "Receive your treatment at home",
    body: "If prescribed, a U.S.-licensed pharmacy prepares your treatment and ships it to your door in discreet packaging.",
    img: "/site/home/how-delivery.avif",
  },
];

const GOLD = "#b08d57";
const GROUND = "#fbf8f2";

function Tag({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/55 px-3.5 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-ink backdrop-blur-md ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: GOLD }} />
      {children}
    </span>
  );
}

/* Desktop only: the photo beside the steps, one frame per step, crossfading. */
function PinnedPhoto({ active }) {
  return (
    <div className="sticky top-[22svh] hidden lg:block">
      <div className="relative aspect-[5/4] overflow-hidden rounded-[28px] bg-[#efe4d2] shadow-[0_30px_60px_-36px_rgba(70,50,20,0.45)]">
        {STEPS.map((s, i) => (
          <img
            key={s.img}
            src={s.img}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
              i === active ? "scale-100 opacity-100" : "scale-[1.04] opacity-0"
            }`}
          />
        ))}
        <div className="absolute left-5 top-5">
          {STEPS.map((s, i) => (
            <Tag
              key={s.tag}
              className={`absolute left-0 top-0 whitespace-nowrap transition-all duration-500 ${
                i === active ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
              }`}
            >
              {s.tag}
            </Tag>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step({ step, index, lit }) {
  return (
    <li className="relative pb-14 pl-16 last:pb-0 sm:pl-20 lg:flex lg:min-h-[58svh] lg:items-center lg:pb-0">
      <span
        data-num
        className={`absolute left-0 top-0 grid h-11 w-11 place-items-center rounded-full border text-[1rem] font-semibold transition-all duration-500 sm:h-12 sm:w-12 lg:top-1/2 lg:-translate-y-1/2 ${
          lit ? "border-transparent text-white shadow-[0_8px_20px_-8px_rgba(150,115,50,0.7)]" : "border-line-strong bg-white text-muted"
        }`}
        style={lit ? { background: GOLD } : undefined}
      >
        {index + 1}
      </span>

      <div className={`transition-opacity duration-500 ${lit ? "opacity-100" : "opacity-45"}`}>
        {/* The phone's own photo for this step. */}
        <div className="relative mb-5 aspect-[5/4] overflow-hidden rounded-3xl lg:hidden">
          <img src={step.img} alt="" aria-hidden="true" loading="lazy" className="h-full w-full object-cover" />
          <Tag className="absolute left-4 top-4">{step.tag}</Tag>
        </div>
        <h3 className="nv-weight-keep font-display text-[clamp(1.45rem,2.4vw,2.1rem)] font-normal leading-tight tracking-[-0.025em] text-ink">
          {step.title}
        </h3>
        <p className="mt-3 max-w-[40ch] text-[1rem] leading-relaxed text-muted md:text-[1.06rem]">{step.body}</p>
      </div>
    </li>
  );
}

export default function HowItWorks() {
  const railRef = React.useRef(null);
  const wrapRef = React.useRef(null);
  const [active, setActive] = React.useState(0);
  const [rail, setRail] = React.useState({ top: 0, height: 0 });

  /* The rail runs from the centre of the first number to the centre of the
     last, measured, because the numbers sit at the top of each step on a phone
     and halfway down it on a desktop. */
  React.useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const measure = () => {
      const nums = el.querySelectorAll("[data-num]");
      if (nums.length < 2) return;
      const base = el.getBoundingClientRect().top;
      const mid = (n) => {
        const r = n.getBoundingClientRect();
        return r.top + r.height / 2 - base;
      };
      const top = mid(nums[0]);
      setRail({ top, height: mid(nums[nums.length - 1]) - top });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Measured on the rail itself, which runs from the first number to the
     last: 0 as the first reaches 60% of the way down the screen, 1 as the last
     does. The fill follows through a spring so it glides rather than stepping
     with each wheel notch. */
  const { scrollYProgress } = useScroll({ target: railRef, offset: ["start 60%", "end 60%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.4 });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = v >= 0.97 ? 2 : v >= 0.47 ? 1 : 0;
    setActive((cur) => (cur === next ? cur : next));
  });

  return (
    <section id="how" className="w-full scroll-mt-24" style={{ background: GROUND }}>
      <div className="mx-auto max-w-[1340px] px-5 py-[clamp(3.5rem,8vw,7rem)] md:px-10">
        <div className="max-w-[36rem]">
          <Reveal as="span" className="nv-eyebrow block text-muted">
            How it works
          </Reveal>
          <BlurIn
            as="h2"
            className="nv-weight-keep mt-4 font-display text-[clamp(2.2rem,4.6vw,3.8rem)] font-normal leading-[1.04] tracking-[-0.035em]"
          >
            <span className="block text-ink">Care in Three</span>
            <span className="block" style={{ color: GOLD }}>
              Simple Steps
            </span>
          </BlurIn>
        </div>

        <div className="mt-12 grid gap-16 lg:mt-14 lg:grid-cols-[1.05fr_1fr] lg:items-start">
          <PinnedPhoto active={active} />

          <div ref={wrapRef} className="relative">
            {/* The rail and its fill, centred on the numbers. */}
            <span
              ref={railRef}
              aria-hidden="true"
              className="absolute left-[21px] w-0.5 rounded-full bg-[#e8dcc6] sm:left-[23px]"
              style={rail}
            />
            <Motion.span
              aria-hidden="true"
              className="absolute left-[21px] w-0.5 origin-top rounded-full sm:left-[23px]"
              style={{ ...rail, scaleY: fill, background: `linear-gradient(180deg, #d8bf8e, ${GOLD})` }}
            />
            <ol className="relative">
              {STEPS.map((s, i) => (
                <Step key={s.title} step={s} index={i} lit={i <= active} />
              ))}
            </ol>
          </div>
        </div>

        <Reveal as="div" className="mt-14 flex flex-col items-start gap-6 border-t border-line pt-8 md:flex-row md:items-center md:justify-between">
          <p className="max-w-[80ch] text-[0.8rem] leading-relaxed text-muted">
            Prescription treatments require an online medical evaluation and are only prescribed when a licensed
            provider determines they are appropriate. If prescribed, medications are fulfilled by U.S.-licensed
            pharmacy partners. Availability, eligibility and individual response may vary.
          </p>
          <Link
            to="/start"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-[#977e43] px-7 py-3.5 text-[0.95rem] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#836c39]"
          >
            Get started
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
