import React from "react";

/* The client's 1080x1920 standby film. It carries its own logo, headlines and
   "Touch to Get Started" button, so the screen adds nothing on top of it. */
const STANDBY_SRC = "/video/kiosk-standby.mp4";
// Its first frame, shown while the film loads.
const STANDBY_POSTER = "/video/kiosk-standby.jpg";

/* The whole screen is one button: any touch starts. */
export default function KioskStandby({ onStart }) {
  return (
    <button
      type="button"
      onClick={onStart}
      aria-label="Touch to get started"
      className="relative block h-full w-full overflow-hidden bg-panel"
    >
      <video
        src={STANDBY_SRC}
        poster={STANDBY_POSTER}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
    </button>
  );
}
