import React, { useEffect, useState } from "react";
import { EllipsisVertical, Share, SquarePlus, X } from "lucide-react";
import { useInstall } from "../../lib/installApp";
import Sheet from "./habits/Sheet";

const HIDE_KEY = "nv_install_card_hidden";

const STEPS = {
  ios: [
    { icon: Share, title: "Tap the Share button", text: "In Safari it's at the bottom of the screen. On newer iPhones, tap ••• first." },
    { icon: SquarePlus, title: "Tap Add to Home Screen", text: "Scroll down the list if you don't see it." },
    { icon: null, title: "Tap Add", text: "Nova MDK appears on your home screen, ready to open in one tap." },
  ],
  android: [
    { icon: EllipsisVertical, title: "Open your browser menu", text: "The three dots at the top right." },
    { icon: SquarePlus, title: "Tap Add to Home screen", text: "Some browsers call it Install app." },
    { icon: null, title: "Tap Install", text: "Nova MDK appears on your home screen, ready to open in one tap." },
  ],
};

/* Home's offer to add the portal to the home screen. Shown on phones, and on
   computers whose browser can install it; hidden once installed, or for good
   once they close it. */
export default function InstallAppCard() {
  const { way, install } = useInstall();
  const [hidden, setHidden] = useState(true);
  const [how, setHow] = useState(false);

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(HIDE_KEY) === "1");
    } catch {
      setHidden(false);
    }
  }, []);

  if (hidden || !way || way === "installed") return null;

  const hide = () => {
    setHidden(true);
    try {
      localStorage.setItem(HIDE_KEY, "1");
    } catch {
      /* private mode: hidden for this visit only */
    }
  };

  return (
    <section className="mt-4 flex items-center gap-4 rounded-2xl border border-line bg-surface px-5 py-4 sm:px-6 sm:py-5">
      <img src="/icons/icon-192.png" alt="" className="size-12 shrink-0 rounded-xl border border-line" />
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-ink">Get the app</p>
        <p className="mt-0.5 text-sm text-muted">Your portal on your home screen, one tap to open.</p>
      </div>
      <button
        type="button"
        onClick={() => (way === "prompt" ? install() : setHow(true))}
        className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-deep"
      >
        {way === "prompt" ? "Install" : "Add"}
      </button>
      <button type="button" onClick={hide} aria-label="Not now" className="-mr-2 grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink">
        <X size={16} />
      </button>

      <Sheet open={how} onClose={() => setHow(false)} label="Add to your home screen">
        <div className="flex items-center gap-4">
          <img src="/icons/icon-192.png" alt="" className="size-14 rounded-2xl border border-line" />
          <div>
            <p className="text-xl font-semibold tracking-tight text-ink">Add to your home screen</p>
            <p className="text-sm text-muted">Three taps, about ten seconds.</p>
          </div>
        </div>
        <ol className="mt-6 space-y-4">
          {(STEPS[way] || STEPS.android).map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} className="flex gap-4 rounded-2xl border border-line bg-surface p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-on-primary">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-base font-semibold text-ink">
                    {s.title}
                    {Icon && <Icon size={18} className="text-primary" />}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">{s.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
        {way === "ios" && (
          <p className="mt-5 text-sm text-muted">
            The first time you open the app, you&rsquo;ll sign in once more. Check-ins saved in Safari stay in Safari, so check in from the app from then on.
          </p>
        )}
        <button
          type="button"
          onClick={() => setHow(false)}
          className="mt-6 w-full rounded-full bg-primary py-3 text-base font-semibold text-on-primary transition-colors hover:bg-primary-deep"
        >
          Got it
        </button>
      </Sheet>
    </section>
  );
}
