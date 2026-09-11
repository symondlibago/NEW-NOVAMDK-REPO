import { blocked } from './_guard.js';
import { mdi, mdiConfigured } from './_mdi.js';
import { sessionCookie, clearedCookie, readSession, sessionsEnabled } from './_session.js';
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
      return res.status(200).json({ authenticated: Boolean(readSession(req)) });
    }

    if (action === 'logout') {
      res.setHeader('Set-Cookie', clearedCookie());
      return res.status(200).json({ authenticated: false });
    }

    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });

    if (action === 'start') {
      if (tooMany(`ip:${ip}`, 8, TEN_MIN) || tooMany(`em:${email}`, 3, TEN_MIN)) {
        return res.status(429).json({ error: 'Too many codes requested. Try again in a few minutes.' });
      }

      const r = await mdi('/patients/auth/2fa', { method: 'POST', body: { email } });
      if (!r.ok && r.status >= 500) {
        console.error('MDI 2FA send failed:', r.status);
        return res.status(502).json({ error: 'Could not send your code. Please try again.' });
      }

      // Deliberately identical whether or not the address is a patient — the
      // response must not tell a stranger who has an account here.
      return res.status(200).json({ sent: true });
    }

    if (action === 'verify') {
      if (tooMany(`vf:${ip}`, 10, TEN_MIN)) {
        return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
      }

      const code = String(req.body?.code || '').trim().toUpperCase();
      if (!code) return res.status(400).json({ error: 'Enter the code from your email' });

      const r = await mdi('/patients/auth/2fa/validate', {
        method: 'POST',
        body: { email, verification_code: code },
      });

      const patientId = r.data?.patient_id || r.data?.id || null;
      if (!r.ok || !patientId) {
        // MDI answers 4xx for both a bad code and an unknown email; either way
        // the visitor gets one message and no hint which it was.
        return res.status(401).json({ error: 'That code is incorrect or has expired' });
      }

      res.setHeader('Set-Cookie', sessionCookie(patientId));
      return res.status(200).json({
        authenticated: true,
        first_name: r.data?.first_name || null,
      });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (error) {
    console.error('Portal auth error:', error.message);
    return res.status(500).json({ error: 'Internal error' });
  }
}
