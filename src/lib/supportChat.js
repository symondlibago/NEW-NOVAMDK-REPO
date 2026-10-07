/* The GoHighLevel support chat, inside the patient portal only.
 *
 * John's request, 2026-10-07: a support chat box in the portal so patients can
 * ask about shipping, orders, account access and billing, explicitly NOT about
 * anything medical, which goes through Messages to the clinical team instead.
 *
 * WHY THIS IS NOT IN index.html. The same widget used to be pasted there and
 * was commented out on request on 2026-09-01. A script tag in the document head
 * runs on every route, and this one must not:
 *
 *   - /intake is a medical questionnaire. A support chat floating over it
 *     invites a patient to type a symptom into a CRM, which is the one thing
 *     the copy is written to prevent.
 *   - the marketing pages were deliberately cleared of it a month ago, and
 *     turning it back on there is the client's call, not a side effect of
 *     adding it to the portal.
 *
 * So it is loaded once, when a signed-in patient reaches the portal, and hidden
 * everywhere else.
 *
 * WHAT REACHES GOHIGHLEVEL. Whatever the patient types. That is why the widget
 * is worded in GoHighLevel as non-medical and why the portal repeats it beside
 * the launcher: the standing rule on this project is that questionnaire
 * answers, diagnoses, prescriptions and medication names stay in MDI. The copy
 * is the control here, because the typing is the patient's.
 */

const WIDGET_ID = "6a8c76ddc041361bdc07a056";
const LOADER = "https://widgets.leadconnectorhq.com/loader.js";
const RESOURCES = "https://widgets.leadconnectorhq.com/chat-widget/loader.js";

/* The portal, and nothing else. Not /intake, which is the questionnaire, and
   not the public pages. */
const ALLOWED = ["/portal"];

const isBrowser = typeof window !== "undefined";

/** Whether the support chat belongs on this path. */
export function supportChatAllowed(path) {
  if (!isBrowser) return false;
  const raw = typeof path === "string" && path ? path : window.location.pathname;
  /* Query and hash off first, the same way isPrivatePath does it. */
  const p = raw.split(/[?#]/)[0] || "/";
  return ALLOWED.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

/* Hidden with CSS rather than unmounted.
 *
 * The widget injects its own custom element and owns it from then on; tearing
 * that out on a route change is how you end up with two launchers or none. A
 * single attribute on <html> is reversible and cannot leave the DOM in a state
 * nobody wrote. */
const STYLE_ID = "nv-support-chat-visibility";
function installVisibilityRule() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent =
    'html:not([data-support-chat="on"]) chat-widget,' +
    'html:not([data-support-chat="on"]) #chat-widget {' +
    "display: none !important;" +
    "}";
  document.head.appendChild(style);
}

let loading = false;
function ensureLoaded() {
  if (!isBrowser || loading) return;
  loading = true;

  installVisibilityRule();

  const tag = document.createElement("script");
  tag.src = LOADER;
  tag.async = true;
  tag.setAttribute("data-resources-url", RESOURCES);
  tag.setAttribute("data-widget-id", WIDGET_ID);
  tag.setAttribute("data-source", "WEB_USER");
  document.body.appendChild(tag);
}

/**
 * Called on every route change. Loads the widget the first time a patient
 * reaches the portal, then shows or hides it as they move around. Returns
 * whether it is visible.
 */
export function applySupportChat(path) {
  if (!isBrowser) return false;
  const allowed = supportChatAllowed(path);
  /* The rule is installed either way, so the widget is hidden from the moment
     it exists rather than flashing on a route it does not belong on. */
  installVisibilityRule();
  if (allowed) {
    document.documentElement.setAttribute("data-support-chat", "on");
    ensureLoaded();
  } else {
    document.documentElement.removeAttribute("data-support-chat");
  }
  return allowed;
}
