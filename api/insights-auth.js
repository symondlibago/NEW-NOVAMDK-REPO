import { blocked } from "./_guard.js";
import {
  adminAuthConfigured,
  passwordMatches,
  adminCookie,
  clearedAdminCookie,
  readAdminSession,
} from "./_admin.js";

/* Login, session check and logout for the staff dashboard, mirroring
   portal-auth's shape so the page can ask "am I signed in?" before rendering. */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  /* A tighter rate limit than the default: this is the one endpoint on the site
     where guessing repeatedly is the attack. 12 tries a minute leaves room for
     a typo or two and nothing else. */
  if (blocked(req, res, { max: 12 })) return;

  const action = req.body?.action;

  if (action === "session") {
    return res.status(200).json({ authenticated: readAdminSession(req) });
  }

  if (action === "logout") {
    res.setHeader("Set-Cookie", clearedAdminCookie());
    return res.status(200).json({ authenticated: false });
  }

  if (action !== "login") {
    return res.status(400).json({ error: "Unknown action" });
  }

  if (!adminAuthConfigured()) {
    console.warn("Rejected dashboard login: ADMIN_PASSWORD or signing secret missing");
    return res.status(503).json({ error: "not_configured" });
  }

  if (!passwordMatches(req.body?.password)) {
    console.warn("Failed dashboard login attempt");
    // Deliberately vague: a wrong password and an unknown user look identical.
    return res.status(401).json({ error: "invalid" });
  }

  res.setHeader("Set-Cookie", adminCookie());
  return res.status(200).json({ authenticated: true });
}
