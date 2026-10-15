import React, { Suspense, lazy } from "react";

import Navbar from "./Nav/Navbar";
import Footer from "./Nav/Footer";
import HeroVideo from "./home/HeroVideo";
import HealthFit from "./home/HealthFit";

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

/* Lazy for its DATA, not its markup.
 *
 * Articles reads src/lib/blog, which imports content/blog/posts.json whole:
 * every post's body, 160KB of it before minifying. Imported eagerly, that sat
 * in the entry chunk, so every visitor downloaded the entire blog before React
 * mounted, on /portal and /intake as much as on the home page. It is the last
 * band before the FAQ, well below the fold, so nobody sees it arrive. */
const Articles = lazy(() => import("./home/Articles"));

/* The bands below the fold.
 *
 * App.jsx lazy-loads every route except this one, so the home page and
 * everything it imports was the entry chunk, which is the file a patient waits
 * for on /portal before React mounts at all. These four are nobody's first
 * screen: the hero fills the viewport above them, and StartingPoint drags the
 * whole 53-product catalogue in with it.
 *
 * Navbar, HeroVideo and HealthFit stay eager. They are what a visitor actually
 * looks at first, and loading those in a second step would trade the home
 * page's first paint for the portal's, which is not the deal. */
const ModernCare = lazy(() => import("./home/ModernCare"));
const StartingPoint = lazy(() => import("./home/StartingPoint"));
const MattersToYou = lazy(() => import("./home/MattersToYou"));
const HowItWorks = lazy(() => import("./home/HowItWorks"));

const FOOTER_FADE = "linear-gradient(180deg, var(--nv-surface) 0%, var(--nv-surface-2) 100%)";

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
      {/* One boundary for the four, not four boundaries: they are fetched in
          parallel either way, and a single reserved block keeps the page from
          growing in four separate jerks as each one lands. */}
      <Suspense fallback={<div className="h-96 bg-bg" aria-hidden="true" />}>
        <ModernCare />
        <StartingPoint />
        <MattersToYou />
        <HowItWorks />
      </Suspense>
      {/* A reserved band rather than null, so the FAQ below it does not jump
          up and back down as the chunk arrives. */}
      <Suspense fallback={<div className="h-80 bg-bg" aria-hidden="true" />}>
        <Articles />
      </Suspense>

      {/* ===== FAQ ===== */}
      <Suspense fallback={<div className="grid h-[200px] place-items-center bg-bg text-muted">Loading…</div>}>
        <div id="faq" className="scroll-mt-24"><FAQ /></div>
      </Suspense>

      {/* The white FAQ settles into the footer's cream instead of meeting it
          at a rule, the last of the homepage's fades (client, 2026-10-14). */}
      <div aria-hidden="true" className="h-16 md:h-24" style={{ background: FOOTER_FADE }} />
      <Footer seamless />
    </main>
  );
}
