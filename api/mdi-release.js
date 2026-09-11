import { blocked, verifyReleaseToken } from './_guard.js';

const CLIENT_ID = process.env.MDI_CLIENT_ID;
const CLIENT_SECRET = process.env.MDI_CLIENT_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('MDI credentials missing — set MDI_CLIENT_ID and MDI_CLIENT_SECRET.');
    return res.status(500).json({ error: 'MDI not configured' });
  }

  if (blocked(req, res)) return;

  if (!verifyReleaseToken(req.body?.release_token)) {
    console.warn('Rejected /api/mdi-release: missing or expired release token');
    return res.status(403).json({ error: 'Forbidden' });
  }

  const caseId = req.body?.case_id;
  if (!caseId) {
    return res.status(400).json({ error: 'case_id is required' });
  }

  try {
    const authResponse = await fetch('https://api.mdintegrations.com/v1/partner/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: "*"
      })
    });

    if (!authResponse.ok) {
      console.error("MDI Auth Rejected:", await authResponse.text());
      return res.status(502).json({ error: "Upstream request failed" });
    }

    const { access_token } = await authResponse.json();

    const releaseResponse = await fetch(
      `https://api.mdintegrations.com/v1/partner/cases/${encodeURIComponent(caseId)}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify({ hold_status: false })
      }
    );

    if (!releaseResponse.ok) {
      console.error("MDI Release Rejected:", await releaseResponse.text());
      return res.status(502).json({ error: "Release failed" });
    }

    return res.status(200).json({ released: true, case_id: caseId });

  } catch (error) {
    console.error("Internal API Error:", error.message);
    return res.status(500).json({ error: 'Internal error' });
  }
}
