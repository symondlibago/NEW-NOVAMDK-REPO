import React, { Suspense, lazy } from "react";

import Navbar from "./Nav/Navbar";
import Footer from "./Nav/Footer";
import HeroVideo from "./home/HeroVideo";
import HealthFit from "./home/HealthFit";
import ModernCare from "./home/ModernCare";
import StartingPoint from "./home/StartingPoint";
import MattersToYou from "./home/MattersToYou";
import HowItWorks from "./home/HowItWorks";
import Articles from "./home/Articles";

/* useKioskVariant and the HeroStage card grid it drove went with the
   2026-09-11 hero redesign. The new hero is one full-bleed clip and reads the
   same on a phone, a desktop and the 1080x1920 kiosk, so there is no longer a
   per-kiosk layout to pick. HeroStage.jsx and HomeHero.jsx were deleted in
   the 2026-09-14 asset cleanup; git history has them if a variant is ever
   wanted back. */
/* The three photo tiles this section used to be moved into HowItWorks.jsx as
   one glass panel over a single photo (2026-09-11). Same three steps, same
   copy; the per-step links became one "Get Started" per the comp. */
const FAQ = lazy(() => import("./FAQ"));

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-bg text-ink">
      <Navbar />
      <HeroVideo />
      {/* The client's 2026-10-13 outline, in its order. HealthFit takes over
          from the orbiting goals band and, on a phone, from the six goal
          tiles; MoreWays is not in the outline. ImproveGoals.jsx and
          MoreWays.jsx stay in the tree in case either is wanted back. */}
      <HealthFit />
      <ModernCare />
      <StartingPoint />
      <MattersToYou />
      <HowItWorks />
      <Articles />

      {/* ===== FAQ ===== */}
      <Suspense fallback={<div className="grid h-[200px] place-items-center bg-bg text-muted">Loading…</div>}>
        <div id="faq" className="scroll-mt-24"><FAQ /></div>
      </Suspense>

      <Footer />
    </main>
  );
}
