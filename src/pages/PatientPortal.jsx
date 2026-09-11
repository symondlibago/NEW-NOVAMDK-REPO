import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import BrandLoader from "../components/transition/BrandLoader";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CalendarDays, House, Lock, Menu, MessageSquare, RefreshCw, UserRound } from "lucide-react";
import Seo from "../components/Seo";
import PortalLogin from "../components/portal/PortalLogin";
import PortalSidebar from "../components/portal/PortalSidebar";
import PortalNotifications from "../components/portal/PortalNotifications";
import PortalHome from "../components/portal/PortalHome";
import PortalMessages from "../components/portal/PortalMessages";
import PortalVisits from "../components/portal/PortalVisits";
import PortalProfile from "../components/portal/PortalProfile";
import { getLenis } from "../lib/smoothScroll";
import { portalAuth } from "../lib/portal";

const TABS = [
  { key: "home", label: "Home", icon: House },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "visits", label: "Visits", icon: CalendarDays },
  { key: "profile", label: "Profile", icon: UserRound },
];

const COLLAPSE_KEY = "nv_portal_sidebar_collapsed";

export default function PatientPortalPage() {
  const navigate = useNavigate();
  const [state, setState] = useState("checking"); // checking | out | in | down
  const [tab, setTab] = useState("home");
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Bumping this remounts the active view, which is what the Refresh control
  // in MDI's own portal does.
  const [reloadKey, setReloadKey] = useState(0);

  // Read once on mount rather than during render — localStorage isn't available
  // during the prerender pass in scripts/prerender.mjs.
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try { setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1"); } catch { /* private mode */ }
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0"); } catch { /* private mode */ }
      return next;
    });
  }, []);

  useEffect(() => {
    portalAuth({ action: "session" })
      .then(({ authenticated }) => setState(authenticated ? "in" : "out"))
      .catch(() => setState("down"));
  }, []);

  useEffect(() => {
    const lenis = getLenis();
    lenis?.stop();
    return () => lenis?.start();
  }, []);

  const signOut = useCallback(async () => {
    setDrawerOpen(false);
    setState("leaving");
    // The request usually returns faster than the eye can follow, so it races
    // a floor duration — otherwise the veil flashes and looks like a glitch.
    await Promise.all([
      portalAuth({ action: "logout" }).catch(() => {}),
      new Promise((r) => setTimeout(r, 450)),
    ]);
    setTab("home");
    setState("out");
  }, []);

  const selectTab = useCallback((key) => {
    setTab(key);
    setDrawerOpen(false); // the drawer overlays the content on mobile
  }, []);

  const chip =
    "flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-[0.85rem] font-semibold text-muted transition-colors hover:border-primary hover:text-ink";

  // The shell stays mounted through "leaving" so the sidebar and header don't
  // vanish a frame before the login screen arrives.
  const signedIn = state === "in" || state === "leaving";

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-dvh w-full overflow-hidden bg-bg text-ink">
        <Seo title="Patient Portal" noindex />

        {signedIn && (
          <PortalSidebar
            tabs={TABS}
            tab={tab}
            onTab={selectTab}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            collapsed={collapsed}
            onToggleCollapse={toggleCollapse}
            onSignOut={signOut}
          />
        )}

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-15 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-2">
              {signedIn && (
                <button
                  onClick={() => setDrawerOpen(true)}
                  aria-label="Open menu"
                  aria-expanded={drawerOpen}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink md:hidden"
                >
                  <Menu size={20} />
                </button>
              )}
              {/* The sidebar carries the logo once signed in. */}
              {!signedIn && (
                <Link to="/" aria-label="Nova MDK home">
                  <img src="/logo.png" alt="Nova MDK" className="h-9 w-auto" />
                </Link>
              )}
              {/* Signed out, the wordmark already sits here and the page heading says
                  the same thing — two labels crowding each other. */}
              {signedIn && (
                <span className="hidden items-center gap-2 truncate text-[0.85rem] font-medium text-muted sm:flex">
                  <Lock size={13} className="shrink-0 text-primary" />
                  Patient portal
                </span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {signedIn && (
                <>
                  <PortalNotifications onNavigate={selectTab} />
                  <button onClick={() => setReloadKey((k) => k + 1)} aria-label="Refresh" className={chip}>
                    <RefreshCw size={14} />
                  </button>
                </>
              )}
              <button onClick={() => navigate("/")} className={chip}>
                <ArrowLeft size={14} /> Exit
              </button>
            </div>
          </header>

          {state === "down" && (
            <div className="grid flex-1 place-items-center px-6 text-center">
              <div className="max-w-sm">
                <h1 className="text-[1.35rem] text-ink">The portal is temporarily unavailable</h1>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-muted">
                  Please try again shortly. If you need help now,{" "}
                  <Link to="/contact" className="font-medium text-primary underline-offset-4 hover:underline">
                    contact our care team
                  </Link>
                  .
                </p>
              </div>
            </div>
          )}

          {state === "out" && (
            <motion.div
              className="flex min-h-0 flex-1 flex-col"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <PortalLogin onAuthenticated={() => setState("in")} />
            </motion.div>
          )}

          {signedIn && (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${tab}-${reloadKey}`}
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                {tab === "home" && <PortalHome onUnauthorized={signOut} onNavigate={selectTab} />}
                {tab === "messages" && <PortalMessages onUnauthorized={signOut} />}
                {tab === "visits" && <PortalVisits onUnauthorized={signOut} />}
                {tab === "profile" && (
                  <PortalProfile onUnauthorized={signOut} />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        {/* Same branded veil the rest of the site uses on route changes — shown
            while the session is checked, and over the sign-out layout change. */}
        <AnimatePresence>
          {(state === "checking" || state === "leaving") && (
            <motion.div
              key="veil"
              className="fixed inset-0 z-60 grid place-items-center bg-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <BrandLoader />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
