import { blocked } from './_guard.js';
import { mdi, mdiConfigured, PATIENT_BASE } from './_mdi.js';
import { sessionCookie, clearedCookie, readSession, revokeSessions, sessionsEnabled } from './_session.js';
const buckets = new Map();

function tooMany(key, limit, windowMs) {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now - entry.start > windowMs) {
    buckets.set(key, { start: now, count: 1 });
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (now - v.start > windowMs) buckets.delete(k);
    }
    return false;
  }

  entry.count += 1;
  return entry.count > limit;
}

const clientIp = (req) =>
  (req.headers?.['x-forwarded-for'] || '').split(',')[0].trim() ||
  req.socket?.remoteAddress ||
  'unknown';

const TEN_MIN = 10 * 60_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  // Session checks are cheap and frequent; the code-sending throttles below are
  // the ones that actually matter here.
  if (blocked(req, res, { max: 60 })) return;

  if (!sessionsEnabled()) {
    console.error('Portal disabled — set API_SIGNING_SECRET to sign session cookies.');
    return res.status(503).json({ error: 'Portal not configured' });
  }
  if (!mdiConfigured()) {
    console.error('MDI credentials missing — set MDI_CLIENT_ID and MDI_CLIENT_SECRET.');
    return res.status(503).json({ error: 'Portal not configured' });
  }

  const action = req.body?.action;
  const ip = clientIp(req);

  try {
    if (action === 'session') {
      return res.status(200).json({ authenticated: Boolean(await readSession(req)) });
    }

    if (action === 'logout') {
      /* Clearing the cookie only ends it in this browser. The record ends every
         copy of it, wherever it has already been. */
      const who = await readSession(req);
      if (who) await revokeSessions(who);
      res.setHeader('Set-Cookie', clearedCookie());
      return res.status(200).json({ authenticated: false });
    }

    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });

    if (action === 'start') {
      if (tooMany(`ip:${ip}`, 8, TEN_MIN) || tooMany(`em:${email}`, 3, TEN_MIN)) {
        return res.status(429).json({ error: 'Too many codes requested. Try again in a few minutes.' });
      }

      const r = await mdi('/auth/2fa', { method: 'POST', body: { email }, base: PATIENT_BASE });
      if (!r.ok && r.status >= 500) {
        console.error('MDI 2FA send failed:', r.status);
        return res.status(502).json({ error: 'Could not send your code. Please try again.' });
      }
      /* Anything else non-2xx still answers "sent" below, so it is logged here
         or it is invisible. That is how the wrong path went unnoticed for a
         month. A 4xx for an address that is not a patient is expected. */
      if (!r.ok) console.warn(`MDI 2FA send returned ${r.status}`);

      // Deliberately identical whether or not the address is a patient — the
      // response must not tell a stranger who has an account here.
      return res.status(200).json({ sent: true });
    }

    if (action === 'verify') {
      if (tooMany(`vf:${ip}`, 10, TEN_MIN)) {
        return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
      }

      /* Every space comes out, not just the ends. The field renders the code
         with wide tracking and the email shows it spaced too, so a pasted code
         can arrive as "3 P L X 7 X" and MDI would call a correct code wrong. */
      const code = String(req.body?.code || '').replace(/\s+/g, '').toUpperCase();
      if (!code) return res.status(400).json({ error: 'Enter the code from your email' });

      const r = await mdi('/auth/2fa/validate', {
        method: 'POST',
        body: { email, verification_code: code },
        base: PATIENT_BASE,
      });

      /* A wrong or spent code is a 404 here, and that is the only thing that
         may deny a sign-in. It is checked on its own, before any lookup below,
         because everything after this point trusts that MDI accepted the code.
         Folding the two together is how a lookup turns into an auth bypass. */
      if (!r.ok) {
        console.warn(`MDI 2FA validate refused the code (${r.status})`);
        // MDI answers 4xx for both a bad code and an unknown email; either way
        // the visitor gets one message and no hint which it was.
        return res.status(401).json({ error: 'That code is incorrect or has expired' });
      }

      /* MDI accepted the code. Now find who it belongs to, which it does not
         reliably say: this endpoint answers 200 with a bare [] on success, the
         same as the send does, so reading patient_id off the body returned null
         and a correct code was reported as expired. Read the body where it does
         carry an id, and fall back to looking the patient up by the address the
         code was just proved against. */
      const d = r.data || {};
      let patientId = d.patient_id || d.id || d.patient?.id || d.data?.patient_id || d.data?.id || null;
      let firstName = d.first_name || d.patient?.first_name || null;

      if (!patientId) {
        const s = await mdi('/patients/search', { method: 'POST', body: { search: email } });
        const list = Array.isArray(s.data) ? s.data : s.data?.data || [];
        const match = list.find((x) => String(x.email || '').toLowerCase() === email);
        patientId = match?.patient_id || match?.id || null;
        firstName = firstName || match?.first_name || null;
        if (!patientId) {
          console.error(`MDI accepted the 2FA code for a sign-in but no patient could be resolved (search ${s.status})`);
        }
      }

      if (!patientId) {
        return res.status(401).json({ error: 'That code is incorrect or has expired' });
      }

      res.setHeader('Set-Cookie', sessionCookie(patientId));
      return res.status(200).json({
        authenticated: true,
        first_name: firstName,
      });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (error) {
    console.error('Portal auth error:', error.message);
    return res.status(500).json({ error: 'Internal error' });
  }
}
