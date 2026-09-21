import { createHmac, timingSafeEqual } from "node:crypto";

/* Cloudflare Turnstile: the "are you human" check on the two forms a stranger
   can submit, the Start visit modal and the contact form.

   Only the widget and this server-side check are used. None of the site's
   traffic goes through Cloudflare, so DNS, email and MDI's webhooks are
   untouched, which is why this was chosen over putting the site behind the
   Cloudflare proxy.

   Off until TURNSTILE_SECRET_KEY is set, the same way release tokens wait for
   API_SIGNING_SECRET: with no secret every request passes and the site behaves
   exactly as before. The page hides the widget when VITE_TURNSTILE_SITE_KEY is
   missing, so the two keys have to arrive together. */

/* Both keys or neither. With only the secret set, the page would render no
   widget and send no token while this side refused everything without one:
   every real patient locked out of Start visit. Vercel hands the VITE_ variable
   to functions as well as to the build, and both take effect on the same
   deploy, so checking it here keeps the two halves switching on together. */
const SECRET =
  process.env.TURNSTILE_SECRET_KEY && process.env.VITE_TURNSTILE_SITE_KEY
    ? process.env.TURNSTILE_SECRET_KEY
    : null;
if (process.env.TURNSTILE_SECRET_KEY && !process.env.VITE_TURNSTILE_SITE_KEY) {
  console.warn("TURNSTILE_SECRET_KEY is set but VITE_TURNSTILE_SITE_KEY is not; the human check stays off.");
}
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const VERIFY_TIMEOUT_MS = 5_000;

/* How long a verified visitor stays verified. The Start visit modal calls the
   API twice, once after the email and again after the address, and a Turnstile
   token is single use: the second call would be refused. So the first successful
   check is traded for a signed pass, and the second call shows that instead. Long
   enough to fill in three short steps, not long enough to farm. */
const PASS_TTL_MS = 30 * 60_000;

export const turnstileEnabled = () => Boolean(SECRET);

const clientIp = (req) =>
  (req.headers?.["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "";

/**
 * Asks Cloudflare whether a widget token is genuine.
 * @returns {Promise<"pass"|"fail"|"unavailable">}
 */
async function siteverify(token, ip) {
  const body = new URLSearchParams({ secret: SECRET, response: token });
  if (ip) body.set("remoteip", ip);

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    });
    if (!res.ok) return "unavailable";
    const data = await res.json();
    if (data.success) return "pass";
    console.warn("Turnstile rejected a token:", (data["error-codes"] || []).join(",") || "no reason given");
    return "fail";
  } catch (e) {
    console.error("Turnstile verify unreachable:", e.message);
    return "unavailable";
  }
}

/* The pass is bound to the email it was issued for, so a bot that gets one
   genuine pass can't spend the next half hour creating records for other
   addresses with it. */
const passKey = (email) => String(email || "").trim().toLowerCase();

function signPass(email) {
  const issued = Date.now();
  const sig = createHmac("sha256", SECRET).update(`${passKey(email)}.${issued}`).digest("hex");
  return `${issued}.${sig}`;
}

function passValid(pass, email) {
  if (typeof pass !== "string") return false;
  const [issued, sig] = pass.split(".");
  if (!issued || !sig) return false;
  if (Date.now() - Number(issued) > PASS_TTL_MS) return false;

  const expected = createHmac("sha256", SECRET).update(`${passKey(email)}.${issued}`).digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Decides whether this request comes from a person.
 *
 * Reads `human_pass` (from an earlier step) or `turnstile_token` (from the
 * widget) off the body. On success it returns a pass for the caller to hand
 * back, so a multi-step form only needs the widget once.
 *
 * @param {object} req
 * @param {string} [email] what the pass is bound to; omit for single-step forms
 * @returns {Promise<{ok: boolean, pass: string|null}>}
 */
export async function checkHuman(req, email) {
  if (!SECRET) return { ok: true, pass: null };

  const body = req.body || {};
  if (email && passValid(body.human_pass, email)) {
    return { ok: true, pass: body.human_pass };
  }

  const token = typeof body.turnstile_token === "string" ? body.turnstile_token : "";
  if (!token) {
    console.warn("Blocked a form submission with no Turnstile token");
    return { ok: false, pass: null };
  }

  const verdict = await siteverify(token, clientIp(req));

  /* Fails open when Cloudflare itself can't be reached. A telehealth sign-up
     should not go down because a third party did; the rate limit and origin
     check still stand, and the log line says it happened. A token Cloudflare
     actively rejected is still refused. */
  if (verdict === "fail") return { ok: false, pass: null };
  if (verdict === "unavailable") console.warn("Turnstile unavailable; let the submission through");

  return { ok: true, pass: email ? signPass(email) : null };
}
