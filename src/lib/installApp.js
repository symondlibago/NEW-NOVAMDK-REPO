import { useEffect, useState } from "react";

/* The portal on the home screen, like an app (client, 2026-10-22).
 *
 * Only the portal is installable. Its manifest and icons are added to the page
 * while the portal is open and taken off when it closes, so the public site
 * never offers to install anything. There is no service worker: nothing is
 * cached, and every open reads fresh from the server like the website does.
 *
 * On iPhone an app on the home screen keeps its own storage, apart from
 * Safari, so the patient signs in once inside it and starts a new habits
 * record there. Android shares Chrome's. */

const HEAD = [
  ["link", { rel: "manifest", href: "/manifest.webmanifest" }],
  ["link", { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" }],
  ["meta", { name: "theme-color", content: "#FFFFFF" }],
  ["meta", { name: "mobile-web-app-capable", content: "yes" }],
  ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
  ["meta", { name: "apple-mobile-web-app-title", content: "Nova MDK" }],
  ["meta", { name: "apple-mobile-web-app-status-bar-style", content: "default" }],
];

let prompt = null; // Chrome's install prompt, held for our own button
const subscribers = new Set();
const notify = () => subscribers.forEach((fn) => fn());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    prompt = e;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    prompt = null;
    notify();
  });
}

/** Adds the manifest and icon tags while the calling component is mounted. */
export function useAppManifest() {
  useEffect(() => {
    const added = HEAD.map(([tag, attrs]) => {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      el.dataset.portalApp = "";
      document.head.appendChild(el);
      return el;
    });
    return () => added.forEach((el) => el.remove());
  }, []);
}

export const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true);

/* iPads report themselves as a Mac, so a Mac with a touch screen is an iPad. */
export const isIOS = () =>
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

export const isAndroid = () => typeof navigator !== "undefined" && /Android/.test(navigator.userAgent);

/** How this device installs: "prompt" (our button can do it), "ios" or
 *  "android" (the patient does it from the browser menu), "installed", or
 *  null where there is no way to (most desktop browsers). */
export function useInstall() {
  const [, rerender] = useState(0);
  useEffect(() => {
    const fn = () => rerender((n) => n + 1);
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  }, []);

  const way = isStandalone() ? "installed" : prompt ? "prompt" : isIOS() ? "ios" : isAndroid() ? "android" : null;
  const install = async () => {
    if (!prompt) return false;
    const p = prompt;
    prompt = null;
    p.prompt();
    const { outcome } = await p.userChoice;
    notify();
    return outcome === "accepted";
  };
  return { way, install };
}
