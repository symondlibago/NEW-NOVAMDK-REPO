import { useState, useEffect } from "react";

// Portrait + at least tablet-width covers both the portrait tablets and the
// physical 32" kiosk (1080×1920). Phones stay under the 600px floor.
export const KIOSK_MQ = "(min-width: 600px) and (orientation: portrait)";

/* A tighter test: is this display an actual kiosk, as opposed to merely
 * portrait and roomy? KIOSK_MQ above only decides styling tweaks, so a portrait
 * iPad matching it is harmless. This one swaps the whole home screen for the
 * in-store app, so a patient on an iPad must not match it.
 *
 * 1080px is the 32" kiosk's own width (the "kiosk" device in theme/themes.js).
 * The widest portrait tablet, a 12.9" iPad Pro, is 1024, so it stays out.
 */
export const KIOSK_APP_MQ = "(min-width: 1080px) and (orientation: portrait)";

/* `?site=1` opts a kiosk-sized display back into the ordinary website, for
   staff who need to reach the real pages on the kiosk hardware. Sticky for the
   same reason the kiosk flag below is: client-side navigation drops the query. */
let stickySite = false;

// `?kiosk` in the URL forces kiosk mode, and stays forced for the rest of the
// SPA session — client-side navigation drops query params, and losing the flag
// mid-flow would snap the kiosk back to the desktop layout.
let stickyKiosk = false;

export default function useKioskMode() {
  const read = () => {
    if (typeof window === "undefined") return false;
    if (new URLSearchParams(window.location.search).has("kiosk")) stickyKiosk = true;
    return stickyKiosk || window.matchMedia(KIOSK_MQ).matches;
  };

  const [kiosk, setKiosk] = useState(read);
  useEffect(() => {
    const mq = window.matchMedia(KIOSK_MQ);
    const onChange = () => setKiosk(read());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return kiosk;
}

/* Whether the home screen should be the in-store kiosk app rather than the
 * website. Size alone decides it, so a kiosk boots straight to the app with no
 * URL to remember and nothing to provision (client, 2026-10-14).
 *
 * Only the home route reads this. Every other route stays the real website, so
 * a texted product link still opens the page it names.
 */
export function useKioskApp() {
  const read = () => {
    if (typeof window === "undefined") return false;
    if (new URLSearchParams(window.location.search).get("site") === "1") stickySite = true;
    if (stickySite) return false;
    return window.matchMedia(KIOSK_APP_MQ).matches;
  };

  const [app, setApp] = useState(read);
  useEffect(() => {
    const mq = window.matchMedia(KIOSK_APP_MQ);
    const onChange = () => setApp(read());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return app;
}
