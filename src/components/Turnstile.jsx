import { useEffect, useRef } from "react";

/* Cloudflare Turnstile widget. Pairs with api/_turnstile.js, which does the
   check that actually matters: this only obtains a token for it.

   Renders nothing while VITE_TURNSTILE_SITE_KEY is unset, and forms treat that
   as "no check needed", so the site behaves exactly as before until the keys
   are added. VITE_ variables are baked in at build time, so adding the key in
   Vercel takes a redeploy to show. */

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export const turnstileOn = Boolean(SITE_KEY);

// One script per page however many widgets mount, and never on pages without one.
let scriptPromise = null;
function loadScript() {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null; // let a later mount try again
        reject(new Error("Turnstile script failed to load"));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

/**
 * @param {object} props
 * @param {(token: string) => void} props.onToken called with "" when the token
 *   expires or the check errors, so the form can disable its button again
 * @param {() => void} [props.onError] the widget couldn't load at all
 * @param {string} [props.action] shows up in Cloudflare's analytics per form
 *
 * To get a fresh token after a failed submit, remount it with a new `key`:
 * tokens are single use, and a remount is simpler than threading a reset call.
 */
export default function Turnstile({ onToken, onError, action }) {
  const ref = useRef(null);
  // Latest callbacks without re-rendering the widget whenever the parent does.
  const cb = useRef({ onToken, onError });
  cb.current = { onToken, onError };

  useEffect(() => {
    if (!SITE_KEY) return undefined;
    let id;
    let gone = false;

    loadScript()
      .then(() => {
        if (gone || !ref.current) return;
        id = window.turnstile.render(ref.current, {
          sitekey: SITE_KEY,
          action,
          // Explicit, not "auto": the site sets its own palette, and "auto"
          // follows the phone's dark mode, which put a black box on a white modal.
          theme: "light",
          size: "flexible",
          appearance: "always",
          callback: (token) => cb.current.onToken(token),
          "expired-callback": () => cb.current.onToken(""),
          "error-callback": () => {
            cb.current.onToken("");
            cb.current.onError?.();
          },
        });
      })
      .catch(() => cb.current.onError?.());

    return () => {
      gone = true;
      if (id !== undefined) window.turnstile?.remove(id);
    };
  }, [action]);

  if (!SITE_KEY) return null;
  // Reserves the widget's height so the form doesn't jump when it appears.
  return <div ref={ref} className="min-h-16.25 w-full" />;
}
