import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import BrandLoader from "../components/transition/BrandLoader";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, House, Lock, Menu, MessageSquare, Pill, RefreshCw, TrendingUp, UserRound } from "lucide-react";
import Seo from "../components/Seo";
import PortalLogin from "../components/portal/PortalLogin";
import PortalSidebar from "../components/portal/PortalSidebar";
import PortalNotifications from "../components/portal/PortalNotifications";
import PortalHome from "../components/portal/PortalHome";
import PortalMessages from "../components/portal/PortalMessages";
import PortalTreatments from "../components/portal/PortalTreatments";
import PortalVisits from "../components/portal/PortalVisits";
import PortalProfile from "../components/portal/PortalProfile";
import PortalProgress from "../components/portal/PortalProgress";
import { getLenis } from "../lib/smoothScroll";
import { portalAuth, portalData, clearPortalCache } from "../lib/portal";
import { resumeIntakeUrl } from "../lib/resumeIntake";

/* John's five, in his order (2026-10-06): Home, Treatments, Visits, Messages,
   Profile. No separate tab for billing, orders, pharmacy or subscriptions; all
   four of those live inside Treatments. Progress (weekly habits) added after
   Home, 2026-10-13. Visits folded into Treatments the same day, as the visit
   history under the plans (client's request, to cut the tab count). */
const TABS = [
  { key: "home", label: "Home", icon: House },
  { key: "progress", label: "Progress", icon: TrendingUp },
  { key: "treatments", label: "Treatments", icon: Pill },
  { key: "messages", label: "Messages", icon: MessageSquare },
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

  /* Asked for the moment they are signed in, not when the Treatments tab opens.
   *
   * `unpaid` is the portal's slowest read by a distance: MDI only reports a
   * case's hold from /cases/:id, so it costs a call per unassigned case at two
   * to three seconds each, about six in all. Asked for on arrival at the tab,
   * that is six seconds of a row sitting there looking settled before its
   * Finish paying button appears, which is exactly how long the client watched
   * it for (2026-10-15).
   *
   * Nothing is done with the answer here. It goes into the read cache, and the
   * tab, the row and the ?resume=1 link all find it already there. Fire and
   * forget: it is a prefetch, and a failure costs the tab one real attempt. */
  useEffect(() => {
    if (state !== "in") return;
    portalData({ resource: "unpaid" }).catch(() => {});
  }, [state]);

  /* ?resume=1, the checkout_link written on the CRM card of a visit that was
   * submitted and never paid for.
   *
   * The link carries nothing else on purpose: it is the portal's front door,
   * and WHICH visit is unpaid is read from the patient's own record after they
   * have signed in. So it waits for "in" and then goes looking.
   *
   * Two kinds of unfinished intake, asked for together because the link cannot
   * know which kind it was written for:
   *   - `unpaid`, a questionnaire finished with the checkout closed. MDI holds
   *     the case and nothing releases it until someone pays. This is what the
   *     checkout_link is actually for.
   *   - a DRAFT, abandoned part-way through the questionnaire. Older, rarer,
   *     and resumed the same way once found.
   *
   * Exactly one between them and it goes straight there, which is the point of
   * the link. More than one and it cannot choose for them, so it opens the list
   * where each has its own button. None and it says nothing: they paid in the
   * meantime, or it expired, and the portal they landed on is the right answer.
   *
   * Runs once. The parameter comes off immediately so a refresh, or Back out of
   * the checkout, does not fire it again. */
  const [resumed, setResumed] = useState(false);
  useEffect(() => {
    if (state !== "in" || resumed) return;
    if (new URLSearchParams(window.location.search).get("resume") !== "1") return;
    setResumed(true);
    window.history.replaceState({}, "", "/portal");

    let alive = true;
    Promise.all([
      portalData({ resource: "unpaid" }).catch(() => null),
      portalData({ resource: "cases" }).catch(() => null),
    ])
      .then(async ([owed, seen]) => {
        if (!alive) return;
        const held = (owed?.unpaid || []).map((u) => u.voucher_id);
        const drafts = (seen?.visits || [])
          .filter((v) => v.kind === "draft" && v.bucket === "incomplete")
          .map((v) => v.id);
        const resumable = [...held, ...drafts];
        if (resumable.length === 1) navigate(await resumeIntakeUrl(resumable[0]));
        else if (resumable.length > 1) setTab("treatments");
      })
      /* A failure here leaves them signed in and looking at their portal, which
         is a worse link than it should have been and not a broken one. */
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [state, resumed, navigate]);

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

  /* Set when the patient taps "Message about this visit". MDI's chat is one
     thread per patient with no case attached to a message, so naming the visit
     in the message is the only context a clinician gets. Cleared on any other
     navigation, so it can never attach itself to an unrelated message. */
  const [messageAbout, setMessageAbout] = useState(null);

  /* The visit a Home card or the history list sent them to, so Treatments opens
     on it rather than on the plans. Cleared by any other navigation, so going
     to Treatments from the sidebar afterwards still shows the plans. */
  const [openVisitId, setOpenVisitId] = useState(null);

  const selectTab = useCallback((key) => {
    // Notifications from the server still name the old Visits tab.
    setTab(key === "visits" ? "treatments" : key);
    setMessageAbout(null);
    setOpenVisitId(null);
    setDrawerOpen(false); // the drawer overlays the content on mobile
  }, []);

  const openVisit = useCallback((caseId) => {
    setOpenVisitId(caseId);
    setTab("treatments");
    setDrawerOpen(false);
  }, []);

  const messageAboutVisit = useCallback((visit) => {
    setMessageAbout(visit);
    setTab("messages");
    setDrawerOpen(false);
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
                  <img src="/logo-2026.png" alt="Nova MDK" className="h-9 w-auto" />
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
                  {/* Refresh means refresh. Reads are cached for a minute so
                      that moving between tabs does not re-pay MDI's four
                      seconds, and this is the control that says ignore that. */}
                  <button
                    onClick={() => {
                      clearPortalCache();
                      setReloadKey((k) => k + 1);
                    }}
                    aria-label="Refresh"
                    className={chip}
                  >
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
                {tab === "home" && (
                  <PortalHome
                    onUnauthorized={signOut}
                    onNavigate={selectTab}
                    onOpenVisit={openVisit}
                    onMessageAbout={messageAboutVisit}
                  />
                )}
                {tab === "treatments" &&
                  (openVisitId ? (
                    <PortalVisits
                      onUnauthorized={signOut}
                      onMessageAbout={messageAboutVisit}
                      initialOpenId={openVisitId}
                      onBack={() => setOpenVisitId(null)}
                    />
                  ) : (
                    <PortalTreatments
                      onUnauthorized={signOut}
                      onMessage={messageAboutVisit}
                      onOpenVisit={openVisit}
                    >
                      <PortalVisits embedded onUnauthorized={signOut} onOpen={openVisit} />
                    </PortalTreatments>
                  ))}
                {tab === "messages" && (
                  <PortalMessages
                    onUnauthorized={signOut}
                    about={messageAbout}
                    onClearAbout={() => setMessageAbout(null)}
                  />
                )}
                {tab === "progress" && <PortalProgress onNavigate={selectTab} />}
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
