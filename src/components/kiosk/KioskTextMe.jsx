import React, { useState } from "react";
import { Check, Delete, Loader2 } from "lucide-react";
import KioskTopBar, { GoldTitle } from "./KioskTopBar";
import Turnstile, { turnstileOn } from "../Turnstile";

/* Placeholder until counsel approves the wording. It covers this one link,
   not marketing. */
const CONSENT = "Text me this link. Msg & data rates may apply. Reply STOP to opt out.";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"];

const formatPhone = (d) => {
  const p = (d + "__________").slice(0, 10);
  return `(${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6)}`;
};

/* Asks the site to save the number in GoHighLevel, whose workflow sends the
   text. Only the product id travels, never its name. */
async function requestText({ digits, pid, locId, token }) {
  try {
    const res = await fetch("/api/ghl-contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "kiosk_text_link",
        phone: digits,
        pid,
        kiosk: locId || undefined,
        consent: CONSENT,
        turnstile_token: token || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok && data.ok === true;
  } catch {
    return false;
  }
}

export default function KioskTextMe({ card, locId, onBack, onDone, onStartOver }) {
  const [digits, setDigits] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState("idle");
  /* Same human check as the contact form. A token is single use, so a failed
     send remounts the widget for a fresh one. */
  const [token, setToken] = useState("");
  const [widget, setWidget] = useState(0);

  const press = (key) => {
    if (status === "sending") return;
    setStatus("idle");
    if (key === "clear") setDigits("");
    else if (key === "back") setDigits((d) => d.slice(0, -1));
    else setDigits((d) => (d.length < 10 ? d + key : d));
  };

  const send = async () => {
    setStatus("sending");
    const ok = await requestText({ digits, pid: card.product.id, locId, token });
    setStatus(ok ? "sent" : "failed");
    if (!ok) {
      setToken("");
      setWidget((n) => n + 1);
    }
  };

  if (status === "sent") {
    return (
      <div className="flex h-full flex-col">
        <KioskTopBar onStartOver={onStartOver} />
        <main className="flex flex-1 flex-col items-center justify-center gap-8 px-8 text-center lg:gap-10 lg:px-16">
          <span className="grid size-40 place-items-center rounded-full bg-ks-brass text-white lg:size-52">
            <Check className="size-20 lg:size-28" strokeWidth={2.6} />
          </span>
          <GoldTitle className="text-6xl lg:text-8xl">Check your phone</GoldTitle>
          {/* Only the last four digits: the next person in line can read this screen. */}
          <p className="max-w-2xl text-2xl leading-snug text-muted lg:text-4xl">
            Your link is on its way to the number ending in {digits.slice(-4)}. Tap it any time to start your visit.
          </p>
          <button
            type="button"
            onClick={onDone}
            className="mt-4 h-20 rounded-full border-2 border-ink px-16 text-2xl font-bold text-ink lg:h-28 lg:px-24 lg:text-4xl"
          >
            Done
          </button>
        </main>
      </div>
    );
  }

  const ready = digits.length === 10 && agreed && (!turnstileOn || token) && status !== "sending";
  return (
    <div className="flex h-full flex-col">
      <KioskTopBar onBack={onBack} backLabel="Back to code" onStartOver={onStartOver} />
      <main className="flex flex-1 flex-col gap-6 px-8 pb-10 lg:gap-9 lg:px-16 lg:pb-16">
        <div>
          <GoldTitle className="text-5xl lg:text-7xl">We&rsquo;ll text you the link</GoldTitle>
          <p className="mt-3 text-xl text-muted lg:text-3xl">Start your {card.title} visit whenever you&rsquo;re ready.</p>
        </div>

        <div className="flex flex-col gap-3">
          <span className="font-mono text-sm uppercase tracking-widest text-ks-heading lg:text-xl">Mobile number</span>
          <span className="flex h-24 items-center rounded-3xl border-4 border-ink bg-surface px-8 font-display text-4xl font-bold tracking-wider text-ink lg:h-32 lg:px-10 lg:text-6xl">
            {formatPhone(digits)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 lg:gap-5">
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => press(key)}
              aria-label={key === "back" ? "Delete" : key === "clear" ? "Clear number" : key}
              className="grid h-20 place-items-center rounded-3xl border-2 border-line bg-surface text-4xl font-bold text-ink active:bg-surface-2 lg:h-28 lg:text-5xl"
            >
              {key === "back" ? <Delete className="size-9 lg:size-12" /> : key === "clear" ? <span className="text-2xl lg:text-3xl">Clear</span> : key}
            </button>
          ))}
        </div>

        <button type="button" onClick={() => setAgreed((a) => !a)} className="flex items-start gap-5 text-left">
          <span
            className={`mt-1 grid size-10 flex-none place-items-center rounded-lg border-2 lg:size-12 ${
              agreed ? "border-ink bg-ink text-surface" : "border-line-strong bg-surface"
            }`}
          >
            {agreed && <Check className="size-6 lg:size-8" strokeWidth={3} />}
          </span>
          <span className="text-lg leading-snug text-ink lg:text-2xl">{CONSENT}</span>
        </button>

        {turnstileOn && <Turnstile key={widget} onToken={setToken} action="kiosk_text_link" />}

        {status === "failed" && (
          <p className="text-center text-lg font-semibold text-ks-heading lg:text-2xl">
            We couldn&rsquo;t send that text. Please check the number, or go back and scan the code instead.
          </p>
        )}

        <button
          type="button"
          onClick={send}
          disabled={!ready}
          className="mt-auto flex h-24 items-center justify-center gap-3 rounded-full bg-ks-brass text-3xl font-bold text-white disabled:opacity-40 lg:h-32 lg:text-5xl"
        >
          {status === "sending" ? <Loader2 className="size-9 animate-spin" /> : "Send me the link"}
        </button>
      </main>
    </div>
  );
}
