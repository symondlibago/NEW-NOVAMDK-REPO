import React, { Suspense, lazy } from "react";

import Navbar from "./Nav/Navbar";
import Footer from "./Nav/Footer";
import HeroVideo from "./home/HeroVideo";
import ImproveGoals from "./home/ImproveGoals";
import StartingPoint from "./home/StartingPoint";
import MattersToYou from "./home/MattersToYou";
import HowItWorks from "./home/HowItWorks";
import MoreWays from "./home/MoreWays";
/* Blog band parked on 2026-09-11 at the client's request. Uncomment this and
   the <Articles /> below to bring it back; the component is untouched. */
// import Articles from "./home/Articles";

/* useKioskVariant and the HeroStage card grid it drove went with the
   2026-09-11 hero redesign. The new hero is one full-bleed clip and reads the
   same on a phone, a desktop and the 1080x1920 kiosk, so there is no longer a
   per-kiosk layout to pick. HeroStage.jsx is still on disk if a variant is
   ever wanted back. */
/* The three photo tiles this section used to be moved into HowItWorks.jsx as
   one glass panel over a single photo (2026-09-11). Same three steps, same
   copy; the per-step links became one "Get Started" per the comp. */
const FAQ = lazy(() => import("./FAQ"));

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-bg text-ink">
      <Navbar />
      <HeroVideo />
      <ImproveGoals />
      <StartingPoint />
      <MattersToYou />

      <HowItWorks />
      <MoreWays />
      {/* <Articles /> */}

      {/* ===== FAQ ===== */}
      <Suspense fallback={<div className="grid h-[200px] place-items-center bg-bg text-muted">Loading…</div>}>
        <div id="faq" className="scroll-mt-24"><FAQ /></div>
      </Suspense>

      <Footer />
    </main>
  );
}
