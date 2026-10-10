import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Seo from "../components/Seo";
import KioskStandby from "../components/kiosk/KioskStandby";
import KioskGoals from "../components/kiosk/KioskGoals";
import KioskQuiz from "../components/kiosk/KioskQuiz";
import KioskCategory from "../components/kiosk/KioskCategory";
import KioskProduct from "../components/kiosk/KioskProduct";
import KioskTextMe from "../components/kiosk/KioskTextMe";
import { shelf } from "../components/kiosk/kioskCatalog";
import { readKioskLocation } from "../lib/kioskLocations";

/* The kiosk's own app at /kiosk/home: standby film, goals, quiz, category,
   product with its code, and text-me. Boot a kiosk at /kiosk/home?kiosk=<id>
   so its codes carry the location, as /?kiosk=<id> does for the site.

   One route with screens held in state, so nothing here changes the URL and
   the site's route veil never flashes between screens. */

const DEFAULT_IDLE_MS = 2 * 60 * 1000;
const ACTIVITY = ["pointerdown", "keydown", "wheel", "scroll"];

/* ?idleSeconds= shortens it for testing, same as the site's attract loop. */
function idleMs() {
  const secs = Number(new URLSearchParams(window.location.search).get("idleSeconds"));
  return Number.isFinite(secs) && secs > 0 ? secs * 1000 : DEFAULT_IDLE_MS;
}

const STANDBY = { screen: "standby" };

export default function KioskScreen() {
  const [view, setView] = useState(STANDBY);
  const go = useCallback((next) => setView(next), []);
  const reset = useCallback(() => setView(STANDBY), []);

  /* undefined until read, so a code is never drawn untagged first. */
  const [locId, setLocId] = useState(undefined);
  useEffect(() => setLocId(readKioskLocation()), []);

  /* Back to the film after two minutes untouched, so the next person never
     lands on someone else's screen. Start over only goes back to the goals:
     someone pressing it is still at the kiosk. Capture phase, so scrolls
     inside the screens' own panes count too. */
  const timer = useRef(null);
  useEffect(() => {
    if (view.screen === "standby") return undefined;
    const ms = idleMs();
    const arm = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(reset, ms);
    };
    arm();
    ACTIVITY.forEach((e) => window.addEventListener(e, arm, { capture: true, passive: true }));
    return () => {
      clearTimeout(timer.current);
      ACTIVITY.forEach((e) => window.removeEventListener(e, arm, { capture: true }));
    };
  }, [view.screen, reset]);

  const cards = useMemo(() => (view.category ? shelf(view.category) : []), [view.category]);
  const card = cards.find((c) => c.key === view.card) || cards[0];

  const toGoals = () => go({ screen: "goals" });
  const toCategory = (category, form = null) => go({ screen: "category", category, form });
  const toProduct = (key) => go({ ...view, screen: "product", card: key });

  let screen;
  switch (view.screen) {
    case "goals":
      screen = <KioskGoals onPick={(slug) => toCategory(slug)} onQuiz={() => go({ screen: "quiz" })} />;
      break;
    case "quiz":
      screen = <KioskQuiz onDone={toCategory} onBack={toGoals} onStartOver={toGoals} />;
      break;
    case "category":
      screen = (
        <KioskCategory
          category={view.category}
          cards={cards}
          form={view.form}
          onOpen={toProduct}
          onBack={toGoals}
          onStartOver={toGoals}
        />
      );
      break;
    case "product":
      screen = (
        <KioskProduct
          cards={cards}
          card={card}
          locId={locId}
          onSelect={toProduct}
          onTextMe={() => go({ ...view, screen: "text" })}
          onBack={() => go({ ...view, screen: "category" })}
          onStartOver={toGoals}
        />
      );
      break;
    case "text":
      screen = (
        <KioskTextMe
          card={card}
          locId={locId}
          onBack={() => go({ ...view, screen: "product" })}
          onDone={toGoals}
          onStartOver={toGoals}
        />
      );
      break;
    default:
      screen = <KioskStandby onStart={toGoals} />;
  }

  return (
    <div className="fixed inset-0 select-none overflow-hidden bg-bg text-ink">
      <Seo title="Nova MDK Kiosk" description="Nova MDK in-store kiosk." path="/kiosk/home" noindex />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${view.screen}-${view.category || ""}-${view.card || ""}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {screen}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
