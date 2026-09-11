import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import useKioskMode from "../../lib/useKioskMode";

const KIOSK_AD_SRC = "/video/golden.mp4";
const DEFAULT_IDLE_MS = 2 * 60 * 1000; // 2 minutes of inactivity

function resolveIdleMs() {
  if (typeof window === "undefined") return DEFAULT_IDLE_MS;
  const raw = new URLSearchParams(window.location.search).get("idleSeconds");
  const secs = raw ? Number(raw) : NaN;
  return Number.isFinite(secs) && secs > 0 ? secs * 1000 : DEFAULT_IDLE_MS;
}

// Activity that should keep the kiosk "awake" / wake it from the ad.
const ACTIVITY_EVENTS = ["pointerdown", "touchstart", "mousedown", "keydown", "wheel", "scroll", "mousemove"];

export default function KioskAttractLoop() {
  const isKiosk = useKioskMode();
  const navigate = useNavigate();
  // Suspend on the intake and portal pages: both run in a cross-origin iframe,
  // whose touches never reach our window — the ad would fire mid-visit.
  const { pathname } = useLocation();
  const suspended = pathname === "/intake" || pathname === "/portal";
  const [active, setActive] = useState(false);
  const activeRef = useRef(false);
  const timerRef = useRef(null);
  const idleMsRef = useRef(resolveIdleMs());

  useEffect(() => { activeRef.current = active; }, [active]);

  // (Re)start the idle countdown that brings up the ad.
  const armTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setActive(true), idleMsRef.current);
  }, []);

  // Any interaction resets the countdown.
  const handleActivity = useCallback(() => {
    if (activeRef.current) {
      setActive(false);
      navigate("/");
    }
    armTimer();
  }, [armTimer, navigate]);

  useEffect(() => {
    if (!isKiosk || suspended) return undefined;
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));
    armTimer();
    return () => {
      clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handleActivity));
    };
  }, [isKiosk, suspended, handleActivity, armTimer]);

  // Lock the page behind the ad while it's up.
  useEffect(() => {
    if (!active) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [active]);

  if (!isKiosk) return null;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="kiosk-attract"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          onClick={handleActivity}
          role="dialog"
          aria-label="Advertisement — touch the screen to continue"
          className="fixed inset-0 z-[200] cursor-pointer overflow-hidden bg-black"
        >
          <video
            src={KIOSK_AD_SRC}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* legibility scrim */}
          <div className="absolute inset-0 bg-linear-to-b from-black/45 via-black/10 to-black/85" />

          {/* branding + call to action */}
          <div className="absolute inset-0 flex flex-col items-center justify-between px-8 py-12 text-center text-white">
            {/* logo (dark mark → sits in a frosted pill so it reads over video) */}
            <span className="inline-flex items-center rounded-full bg-white/90 px-5 py-2.5 backdrop-blur-sm nv-shadow-lg">
              <img src="/logo.png" alt="Nova MDK" className="h-9 w-auto md:h-10" />
            </span>

            <motion.div
              animate={{ opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex items-center gap-2.5 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-[0.95rem] font-semibold tracking-wide backdrop-blur-sm"
            >
              <span className="grid h-2.5 w-2.5 place-items-center">
                <span className="h-2.5 w-2.5 animate-ping rounded-full bg-white/80" />
              </span>
              Touch anywhere to begin
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
