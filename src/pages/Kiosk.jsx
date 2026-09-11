import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, ClipboardCheck, Stethoscope, PackageOpen, LayoutGrid,
  ShieldCheck, Truck, Building2, Monitor, Smartphone,
} from "lucide-react";
import Seo from "../components/Seo";
import Navbar from "../components/Nav/Navbar";
import Footer from "../components/Nav/Footer";
import Reveal from "../components/ui/Reveal";
import BackButton from "../components/ui/BackButton";

const STATS = [
  { b: "~2 min", s: "Guided questionnaire" },
  { b: "100%", s: "Physician-reviewed" },
  { b: "Fast", s: "Doorstep delivery" },
  { b: "0", s: "Apps to download" },
];

const STEPS = [
  { icon: LayoutGrid, title: "Browse treatments", desc: "Scroll the full Nova MDK catalog on the big touchscreen, just like you would on your phone." },
  { icon: ClipboardCheck, title: "Take the questionnaire", desc: "Answer a few quick, guided questions to start your visit. It only takes a couple of minutes." },
  { icon: Stethoscope, title: "Provider review", desc: "A licensed U.S. clinician reviews your answers and prescribes the option that actually fits you." },
  { icon: PackageOpen, title: "Delivered to your door", desc: "Approved treatments ship free and discreetly. There's nothing to carry home." },
];

const FEATURES = [
  { icon: LayoutGrid, title: "Browse every treatment", desc: "Explore weight, skin, recovery, longevity, sexual health, and the full peptide line." },
  { icon: Smartphone, title: "Scroll like your phone", desc: "A big, familiar touchscreen with no app to download and nothing new to learn." },
  { icon: ClipboardCheck, title: "Take the questionnaire", desc: "Answer the guided intake right on the screen to start your visit." },
  { icon: Stethoscope, title: "Provider-reviewed", desc: "A licensed U.S. clinician reviews your answers and prescribes what fits. No guesswork." },
  { icon: Truck, title: "Shipped to your door", desc: "Approved treatments ship priority — free and discreetly, right to your door." },
  { icon: ShieldCheck, title: "Private & secure", desc: "Your own private session, HIPAA-compliant and encrypted end to end." },
];

// Venue types the kiosk lives in (no specific locations).
const VENUES = ["Flagship centers", "Premium gyms", "Luxury med spas", "Wellness retail", "Member clubs"];

export default function KioskPage() {
  return (
    <main className="min-h-screen w-full bg-bg text-ink">
      <Seo
        title="Smart Kiosk — Telehealth in Gyms, Med Spas & Clubs"
        description="Nova MDK Smart Kiosks bring physician-guided telehealth consultations to flagship centers, premium gyms, luxury med spas and member clubs."
        path="/kiosk"
      />
      <Navbar />

      {/* ===== Hero — Smart Kiosk showcase ===== */}
      <section className="mx-auto max-w-[1240px] px-5 pb-[clamp(2rem,4vw,3.5rem)] pt-6 md:px-10">
        <div className="mb-6">
          <BackButton />
        </div>
        <Reveal>
          {/* dotted frame */}
          <div
            className="rounded-[calc(38px*var(--nv-r-scale,1))] p-[clamp(8px,1.3vw,16px)]"
            style={{
              backgroundImage: "radial-gradient(var(--nv-line-strong) 1.2px, transparent 1.2px)",
              backgroundSize: "18px 18px",
            }}
          >
            <div className="relative overflow-hidden rounded-[calc(32px*var(--nv-r-scale,1))] border border-line bg-surface text-ink">
              <div className="relative grid items-center gap-[clamp(1.5rem,4vw,3rem)] p-[clamp(1.8rem,4vw,3.6rem)] md:grid-cols-[1.05fr_0.95fr]">
                {/* copy */}
                <div>
                  <span className="font-mono text-[0.74rem] font-medium uppercase tracking-[0.2em] text-primary">
                    Nova MDK Smart Kiosk
                  </span>
                  <h1 className="mt-4 max-w-[14ch] font-display text-[clamp(2rem,4.6vw,3.4rem)] font-extrabold leading-[1.04] tracking-tight text-ink">
                    Your clinic, in a single square metre.
                  </h1>
                  <p className="mt-5 max-w-[44ch] text-[1.04rem] leading-relaxed text-muted">
                    Step up, tap in, and walk away with a physician-designed protocol. The Smart Kiosk brings
                    concierge-grade telehealth into the premium spaces you already love.
                  </p>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link
                      to="/start"
                      className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-6 py-3.5 text-[0.98rem] font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-deep nv-shadow-lg"
                    >
                      Start your visit
                      <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                    <a
                      href="#partner"
                      className="inline-flex items-center rounded-full border border-line-strong bg-bg px-6 py-3.5 text-[0.98rem] font-semibold text-ink transition-colors hover:bg-surface-2"
                    >
                      Host a kiosk
                    </a>
                  </div>
                </div>

                {/* kiosk devices — matched scale, overlapping; the card's own
                    overflow-hidden clips the stands right at its bottom line.
                    Sized by HEIGHT, not width: these renders are tall portraits
                    (~0.4 ratio), so a width-based size overflows the box upward
                    and lands on the copy once the grid stacks on phones. */}
                <div className="relative h-[clamp(340px,44vw,520px)]">
                  <img
                    src="/site/kiosk-2.avif"
                    alt="The Nova MDK website running on a portrait touchscreen kiosk"
                    className="absolute bottom-[-12%] left-[2%] h-[104%] w-auto md:bottom-[-15%] md:h-[122%]"
                  />
                  <img
                    src="/site/kiosk-1.avif"
                    alt="A Nova MDK kiosk showing a patient check-in and queue screen"
                    className="absolute left-[54%] top-[22%] h-[76%] w-auto md:left-[60%] md:h-[94%]"
                  />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ===== Stat band ===== */}
      <section className="border-y border-line bg-surface text-ink">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-6 px-5 py-[clamp(2rem,4vw,3rem)] md:grid-cols-4 md:px-10">
          {STATS.map((s) => (
            <div key={s.s} className="text-center">
              <b className="block text-[clamp(1.7rem,4vw,2.6rem)] font-extrabold tracking-tight text-primary">{s.b}</b>
              <span className="mt-1.5 block font-mono text-[0.7rem] uppercase tracking-[0.13em] text-muted">{s.s}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== What it is (with monitor detail) ===== */}
      <section className="mx-auto max-w-[1180px] px-5 py-[clamp(2.6rem,5vw,4.5rem)] md:px-10">
        {/* image column gets the wider track — the monitor render is what sells this section */}
        <div className="grid items-center gap-[clamp(1.8rem,5vw,3.5rem)] md:grid-cols-[0.88fr_1.12fr]">
          <Reveal>
            <span className="nv-eyebrow">The experience</span>
            <h2 className="mt-3 text-[clamp(1.8rem,4vw,2.7rem)] font-extrabold leading-tight">
              As easy as using your phone
            </h2>
            <p className="mt-4 max-w-[46ch] text-[1.04rem] leading-relaxed text-muted">
              No waiting rooms. No front desk. No app to install. You walk up, tap the screen, and use
              Nova MDK exactly like you would on your phone: browse treatments, take your questionnaire,
              and start your visit.
            </p>
            <ul className="mt-6 flex flex-col gap-3.5">
              {["A big, familiar touchscreen, no app required", "Browse treatments and take the questionnaire", "Reviewed and prescribed by U.S.-licensed providers"].map((t) => (
                <li key={t} className="flex items-center gap-3 text-[1rem] font-medium">
                  <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full bg-accent/15 text-accent"><ShieldCheck size={12} strokeWidth={3} /></span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="relative overflow-hidden rounded-[calc(26px*var(--nv-r-scale,1))] bg-surface-2 nv-shadow">
              <div  
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(60% 60% at 50% 30%, color-mix(in oklab, var(--nv-accent) 22%, transparent), transparent 72%)" }}
              />
              {/* bottom-anchored (items-end, no bottom padding) so the stand's
                  tip lands exactly on the card's bottom edge */}
              <div className="relative flex min-h-80 items-end justify-center px-3 pt-6 sm:px-5 md:min-h-105 md:pt-9">
                <div className="relative w-full max-w-xl">
                  <img
                    src="/site/kioskmonitor.avif"
                    alt="Close-up of the Nova MDK Smart Kiosk touchscreen"
                    loading="lazy"
                    className="h-auto w-full object-contain drop-shadow-2xl"
                  />
                  <video
                    src="/video/right-vid.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute object-cover"
                    style={{ left: "3.4%", top: "6.2%", width: "92%", height: "62%" }}
                  />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section className="bg-surface-2 py-[clamp(2.5rem,5vw,5rem)]">
        <div className="mx-auto max-w-[1180px] px-5 md:px-10">
          <Reveal className="mx-auto max-w-[60ch] text-center">
            <span className="nv-eyebrow">How it works</span>
            <h2 className="mt-3 text-[clamp(1.7rem,3.6vw,2.5rem)] font-extrabold leading-tight">From walk-up to your visit, in minutes</h2>
            <p className="mt-3 text-[1.02rem] leading-relaxed text-muted">No appointment, no clipboard, no waiting room. Just four simple steps.</p>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal as="div" key={s.title} delay={(i % 4) * 0.08}>
                <div className="relative h-full rounded-[calc(22px*var(--nv-r-scale,1))] border border-line bg-surface p-7 nv-shadow">
                  <span className="absolute right-6 top-6 font-mono text-[1.1rem] font-bold text-line-strong">0{i + 1}</span>
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-on-primary"><s.icon size={22} /></span>
                  <h3 className="mt-5 font-display text-[1.15rem] font-bold leading-tight">{s.title}</h3>
                  <p className="mt-2 text-[0.92rem] leading-relaxed text-muted">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Feature highlights ===== */}
      <section className="mx-auto max-w-[1180px] px-5 py-[clamp(2.6rem,5vw,5rem)] md:px-10">
        <Reveal className="mx-auto max-w-[60ch] text-center">
          <span className="nv-eyebrow">Why it's different</span>
          <h2 className="mt-3 text-[clamp(1.7rem,3.6vw,2.5rem)] font-extrabold leading-tight">If you can use your phone, you can use this</h2>
          <p className="mt-3 text-[1.02rem] leading-relaxed text-muted">Everything you need to get started, right there on the screen.</p>
        </Reveal>

        {/* spotlight row */}
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <Reveal as="div" className="md:col-span-2">
            <div className="relative h-full overflow-hidden rounded-[calc(26px*var(--nv-r-scale,1))] border border-line bg-surface-2 p-8 text-ink nv-shadow-lg md:p-10">
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(60% 90% at 90% 10%, color-mix(in srgb, var(--nv-accent) 18%, transparent), transparent 70%)" }}
              />
              <div className="relative">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-bg text-primary"><Monitor size={22} /></span>
                <h3 className="mt-5 font-display text-[clamp(1.4rem,2.6vw,1.9rem)] font-extrabold leading-tight">
                  The whole Nova MDK experience, on one big screen.
                </h3>
                <p className="mt-3 max-w-[48ch] text-[1rem] leading-relaxed text-muted">
                  Everything you'd do on your phone, now on a large, easy display. Browse treatments, take
                  your questionnaire, and start your visit. From there, a licensed U.S. provider reviews your
                  answers and prescribes what fits.
                </p>
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {["Browse treatments", "Take the questionnaire", "Start your visit"].map((c) => (
                    <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-bg px-3.5 py-1.5 text-[0.82rem] font-medium text-ink">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal as="div" delay={0.08}>
            <div className="flex h-full flex-col justify-between gap-8 rounded-[calc(26px*var(--nv-r-scale,1))] border border-line bg-surface p-8 nv-shadow">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-surface-2 text-primary"><Smartphone size={22} /></span>
              <div>
                <div className="font-display text-[clamp(2rem,3.6vw,2.6rem)] font-extrabold leading-none tracking-tight text-ink">No app</div>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">Nothing to download. Scroll and tap exactly like your mobile.</p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* feature grid */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal as="div" key={f.title} delay={(i % 3) * 0.06}>
              <div className="group h-full rounded-[calc(22px*var(--nv-r-scale,1))] border border-line bg-surface p-6 nv-shadow transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:nv-shadow-lg">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-surface-2 text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary"><f.icon size={20} /></span>
                <h3 className="mt-4 font-display text-[1.05rem] font-bold leading-tight">{f.title}</h3>
                <p className="mt-1.5 text-[0.9rem] leading-relaxed text-muted">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== Venues ===== */}
      <section className="mx-auto max-w-[1180px] px-5 pb-[clamp(2.6rem,5vw,4rem)] md:px-10">
        <Reveal>
          <div className="rounded-[calc(26px*var(--nv-r-scale,1))] border border-line bg-surface p-7 nv-shadow md:p-9">
            <div className="mb-5 flex items-center">
              <span className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted">Now rolling out nationwide</span>
            </div>
            <p className="mb-4 text-[1.05rem] font-bold text-ink">Find a kiosk in premium spaces like:</p>
            <div className="flex flex-wrap gap-2.5">
              {VENUES.map((v) => (
                <span key={v} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-4 py-2 text-[0.9rem] font-medium text-ink transition-colors hover:border-primary/40">
                  <Building2 size={14} className="text-primary" /> {v}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ===== Partner CTA ===== */}
      <section id="partner" className="mx-auto mb-[clamp(3rem,6vw,5rem)] max-w-[1180px] scroll-mt-24 px-5 md:px-10">
        <Reveal>
          <div className="relative overflow-hidden rounded-[calc(28px*var(--nv-r-scale,1))] border border-line bg-surface-2 px-6 py-[clamp(2.4rem,5vw,3.6rem)] text-center text-ink">
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(50% 80% at 50% 0%, color-mix(in srgb, var(--nv-accent) 18%, transparent), transparent 70%)" }}
            />
            <div className="relative">
              <span className="nv-eyebrow text-primary">For partners</span>
              <h2 className="mx-auto mt-3 max-w-[24ch] font-display text-[clamp(1.6rem,3.4vw,2.4rem)] font-extrabold leading-tight">
                Host a Nova MDK Smart Kiosk
              </h2>
              <p className="mx-auto mt-3 max-w-[48ch] text-[1rem] text-muted">
                Own a gym, spa, or wellness space? Give your members provider-guided care on site. We handle the technology, the clinicians, and the fulfillment, so you don't have to.
              </p>
              <Link
                to="/contact"
                className="group mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-[1rem] font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-deep nv-shadow-lg"
              >
                Talk to our team <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
