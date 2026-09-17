import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// Aliased because this ESLint config doesn't count <motion.ul> as using `motion`.
const MotionList = motion.ul;
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  Mail,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import Seo from "../components/Seo";
import Navbar from "../components/Nav/Navbar";
import Footer from "../components/Nav/Footer";
import Reveal from "../components/ui/Reveal";
import { submitContactForm } from "../lib/ghl";
import { track, EVENTS } from "../lib/analytics";

/* Built on the site rather than embedded from GoHighLevel. The survey embed was
   an iframe we couldn't style, so it never sat right on a phone, and GA4 couldn't
   see a submission happen inside it. Messages still land in GoHighLevel: see the
   contact_form branch of api/ghl-contact.js. */

/* Values must match CONTACT_TOPICS in api/ghl-contact.js, which owns the label
   GoHighLevel receives. */
const TOPICS = [
  { value: "general", label: "General question" },
  { value: "treatment", label: "Treatment question" },
  { value: "order", label: "Order or shipping" },
  { value: "account", label: "Account or portal" },
  { value: "kiosk", label: "Host a kiosk" },
];

const SUPPORT_EMAIL = "support@novamdk.com";
const MESSAGE_MAX = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY = { name: "", email: "", topic: "general", message: "", company: "" };

// Theme-driven tints, so the panel follows whichever palette the site is in.
const tint = { background: "color-mix(in oklab, var(--nv-primary) 13%, var(--nv-surface))" };
const panel = {
  background:
    "linear-gradient(135deg, color-mix(in oklab, var(--nv-primary) 10%, var(--nv-surface)) 0%, color-mix(in oklab, var(--nv-primary) 34%, var(--nv-surface)) 100%)",
};
const cta = {
  background:
    "linear-gradient(135deg, color-mix(in oklab, var(--nv-primary) 72%, white) 0%, var(--nv-primary) 100%)",
};

const label = "mb-2 block text-[0.92rem] font-medium";
/* 16px on purpose: iOS zooms the page into any input set smaller than that, which
   is one of the things that made the embedded form feel broken on a phone. */
const field =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-[16px] text-ink outline-none transition-colors placeholder:text-muted focus:border-primary";
const eyebrow = "text-[0.7rem] font-bold uppercase tracking-[0.16em]";

/* A hand-built listbox rather than a native <select>, so the open list matches the
   design instead of the operating system's menu. That trade gives up the keyboard
   and screen reader behaviour a <select> has for free, so it's put back here:
   arrow keys move, Enter or Space picks, Escape and Tab close, and the options are
   announced through aria-activedescendant. */
function TopicPicker({ value, onChange }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrap = useRef(null);
  const reduceMotion = useReducedMotion();
  const current = TOPICS.find((t) => t.value === value) || TOPICS[0];

  /* Grows down out of the button rather than appearing, and eases back on close.
     People who ask their system for reduced motion get the fade alone. */
  const lift = reduceMotion ? 0 : -6;
  const listMotion = {
    initial: { opacity: 0, y: lift, scale: reduceMotion ? 1 : 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: lift * 0.6, scale: reduceMotion ? 1 : 0.98 },
    transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
  };

  useEffect(() => {
    if (!open) return;
    const outside = (e) => {
      if (!wrap.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  const show = () => {
    setActive(Math.max(0, TOPICS.findIndex((t) => t.value === value)));
    setOpen(true);
  };

  const choose = (index) => {
    onChange(TOPICS[index].value);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(TOPICS.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrap} className="relative">
      <span id={`${id}-label`} className={label}>
        Topic
      </span>
      <button
        type="button"
        id={`${id}-button`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-labelledby={`${id}-label ${id}-button`}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-[16px] text-ink outline-none ring-primary transition focus-visible:ring-2"
        style={tint}
      >
        {current.label}
        <ChevronDown
          size={18}
          className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
      {open && (
        <MotionList
          {...listMotion}
          id={`${id}-list`}
          role="listbox"
          aria-labelledby={`${id}-label`}
          style={{ transformOrigin: "top center" }}
          className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-line bg-surface py-1.5 shadow-xl shadow-black/10"
        >
          {TOPICS.map((t, i) => {
            const selected = t.value === value;
            return (
              <li
                key={t.value}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={selected}
                onPointerEnter={() => setActive(i)}
                // Keeps focus on the button, so a click doesn't blur it first.
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
                className={`flex cursor-pointer items-center justify-between px-4 py-2.5 text-[0.95rem] text-ink transition-colors ${
                  selected ? "font-semibold" : ""
                }`}
                style={i === active ? tint : undefined}
              >
                {t.label}
                {selected && <Check size={16} className="text-primary" />}
              </li>
            );
          })}
        </MotionList>
      )}
      </AnimatePresence>
    </div>
  );
}

function InfoCard({ icon, title, children, href }) {
  // Capitalised local so JSX can render it; this ESLint config ignores ^[A-Z_] vars.
  const Icon = icon;
  const body = (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-primary" style={tint}>
        <Icon size={19} />
      </span>
      <span className="min-w-0 flex-1">
        {title && <span className={`${eyebrow} block text-muted`}>{title}</span>}
        <span className="mt-0.5 block text-[0.98rem] font-semibold">{children}</span>
      </span>
      {href && (
        <ArrowRight size={17} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
      )}
    </>
  );

  const shell = "flex items-center gap-4 rounded-2xl border border-line/70 bg-surface/55 p-4 backdrop-blur-sm";
  return href ? (
    <a href={href} className={`group ${shell} transition-colors hover:border-primary`}>
      {body}
    </a>
  ) : (
    <div className={shell}>{body}</div>
  );
}

export default function ContactPage() {
  const [form, setForm] = useState(EMPTY);
  const [state, setState] = useState("idle"); // idle | sending | sent
  const [err, setErr] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!form.name.trim()) return setErr("Please add your name.");
    if (!EMAIL_RE.test(form.email.trim())) return setErr("Please add a valid email address so we can reply.");
    if (form.message.trim().length < 2) return setErr("Please write a short message.");

    setState("sending");
    const result = await submitContactForm(form);

    if (!result.ok) {
      setState("idle");
      setErr("We couldn't send your message just now. Please try again in a moment.");
      return;
    }

    // Topic only: never the name, email or message text.
    track(EVENTS.CONTACT_SUBMITTED, { topic: form.topic });
    setState("sent");
  };

  const reset = () => {
    setForm(EMPTY);
    setState("idle");
  };

  return (
    <main className="min-h-screen w-full bg-bg text-ink">
      <Seo
        title="Contact Us"
        description="Get in touch with the Nova MDK care team about treatments, orders, your account or hosting a kiosk."
        path="/contact"
      />
      <Navbar />

      <section className="mx-auto max-w-[1180px] px-4 py-10 md:px-8 md:py-14">
        <Reveal>
          <div className="grid overflow-hidden rounded-3xl border border-line bg-surface shadow-xl shadow-black/5 md:grid-cols-2">
            {/* Form first on a phone: it's what the visitor came to do. The
                reassurance panel follows, and sits on the left from md up. */}
            <div className="order-2 flex flex-col p-6 sm:p-10 md:order-1" style={panel}>
              <p className={`${eyebrow} text-primary`}>Talk to us</p>
              <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.6rem)] font-bold leading-[1.08] tracking-tight">
                A care team that actually answers
              </h1>
              <p className="mt-4 max-w-[40ch] text-[1rem] leading-relaxed text-muted">
                Reach the care team directly, no phone trees, no bots reading from a script.
              </p>

              <div className="mt-8 space-y-3">
                <InfoCard icon={Mail} title="Email" href={`mailto:${SUPPORT_EMAIL}`}>
                  {SUPPORT_EMAIL}
                </InfoCard>
                <InfoCard icon={Clock} title="Hours">
                  Mon-Fri, 8am-8pm ET
                </InfoCard>
                <InfoCard icon={MessageSquare}>
                  <span className="font-normal">
                    Most messages get a reply the <strong className="font-bold">same business day</strong>.
                  </span>
                </InfoCard>
              </div>

              <p className="mt-auto pt-10 text-[0.8rem] leading-relaxed text-muted">
                For a medical emergency, call 911. This inbox isn't monitored for urgent clinical needs.
              </p>
            </div>

            <div className="order-1 p-6 sm:p-10 md:order-2">
              {state === "sent" ? (
                <div
                  className="flex h-full flex-col items-center justify-center py-10 text-center"
                  role="status"
                  aria-live="polite"
                >
                  <CheckCircle2 size={48} className="text-primary" />
                  <h2 className="mt-4 text-[1.5rem] font-bold tracking-tight">Thanks, your message is on its way</h2>
                  <p className="mt-2 max-w-[38ch] text-[0.98rem] text-muted">
                    We'll reply to {form.email.trim()} as soon as we can.
                  </p>
                  <button
                    type="button"
                    onClick={reset}
                    className="mt-6 rounded-xl border border-line px-5 py-2.5 text-[0.92rem] font-semibold transition-colors hover:border-primary"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-[clamp(1.5rem,3vw,1.9rem)] font-bold tracking-tight">Send us a message</h2>
                  <p className="mt-1.5 text-[0.98rem] text-muted">Fill this out and we'll get right back to you.</p>

                  <form onSubmit={submit} noValidate className="mt-7">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="contact-name" className={label}>
                          Full name
                        </label>
                        <input
                          id="contact-name"
                          className={field}
                          placeholder="Jane Doe"
                          value={form.name}
                          onChange={set("name")}
                          autoComplete="name"
                          maxLength={120}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="contact-email" className={label}>
                          Email
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          inputMode="email"
                          className={field}
                          placeholder="jane@email.com"
                          value={form.email}
                          onChange={set("email")}
                          autoComplete="email"
                          maxLength={160}
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-5">
                      <TopicPicker value={form.topic} onChange={(topic) => setForm((f) => ({ ...f, topic }))} />
                    </div>

                    <div className="mt-5">
                      <label htmlFor="contact-message" className={label}>
                        Message
                      </label>
                      <textarea
                        id="contact-message"
                        rows={5}
                        className={`${field} resize-y`}
                        placeholder="How can we help?"
                        value={form.message}
                        onChange={set("message")}
                        maxLength={MESSAGE_MAX}
                        required
                      />
                    </div>

                    {/* Honeypot. Off-screen rather than display:none, which some bots
                        know to skip. People never reach it, so anything typed here
                        is a bot and the server quietly drops the submission. */}
                    <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                      <label htmlFor="contact-company">Company</label>
                      <input
                        id="contact-company"
                        tabIndex={-1}
                        autoComplete="off"
                        value={form.company}
                        onChange={set("company")}
                      />
                    </div>

                    {err && (
                      <p className="mt-4 text-[0.88rem] font-medium text-red-600" role="alert">
                        {err}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={state === "sending"}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-[1rem] font-bold text-on-primary shadow-lg shadow-black/10 transition hover:brightness-105 disabled:opacity-60"
                      style={cta}
                    >
                      {state === "sending" ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          Send message
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>

                    <p className="mt-4 flex items-center justify-center gap-2 text-[0.85rem] text-muted">
                      <ShieldCheck size={15} className="text-primary" />
                      Your details are private and never sold.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
