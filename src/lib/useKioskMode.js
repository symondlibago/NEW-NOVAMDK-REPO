import { useState, useEffect } from "react";

// Portrait + at least tablet-width covers both the portrait tablets and the
// physical 32" kiosk (1080×1920). Phones stay under the 600px floor.
export const KIOSK_MQ = "(min-width: 600px) and (orientation: portrait)";

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
