import { useState, useEffect } from "react";
import { readKioskLocation } from "./kioskLocations";

// Portrait + at least tablet-width covers both the portrait tablets and the
// physical 32" kiosk (1080×1920). Phones stay under the 600px floor.
export const KIOSK_MQ = "(min-width: 600px) and (orientation: portrait)";

/* A true 1080 wide portrait panel, which no tablet reaches. Kept only as a
 * fallback for a kiosk nobody has placed yet: the real hardware reports
 * tablet-ish CSS pixels, not 1080, because the panel is scaled. So size alone
 * cannot tell a kiosk from an iPad, and the placement flag below decides it.
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
    /* A placed kiosk announces itself. It is booted once at /?kiosk=<id> and
       the id is remembered in localStorage, so every boot after that knows it
       is a kiosk without a URL. A patient's tablet never has one, which is what
       makes this safe where a width test was not. */
    if (readKioskLocation() && window.matchMedia(KIOSK_MQ).matches) return true;
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
