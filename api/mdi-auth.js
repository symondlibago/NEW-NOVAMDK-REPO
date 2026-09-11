import { blocked, signReleaseToken } from './_guard.js';

const CLIENT_ID = process.env.MDI_CLIENT_ID;
const CLIENT_SECRET = process.env.MDI_CLIENT_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (blocked(req, res)) return;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('MDI credentials missing — set MDI_CLIENT_ID and MDI_CLIENT_SECRET.');
    return res.status(500).json({ error: 'MDI not configured' });
  }

  try {
    // STEP 1: Authenticate with explicit keys
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
    
    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    const mdi = (path, body) => fetch(`https://api.mdintegrations.com/v1/partner${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify(body)
    });
    const mdiGet = (path) => fetch(`https://api.mdintegrations.com/v1/partner${path}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    let patientId = null;
    const p = req.body.patient;
    const consent = req.body.consent || null;
    if (p?.email) {
      try {
        for (const body of [{ search: p.email }, { search: p.email, is_sandbox: true }]) {
          if (patientId) break;
          const searchRes = await mdi('/patients/search', body);
          if (searchRes.ok) {
            const found = await searchRes.json();
            const list = Array.isArray(found) ? found : found.data || [];
            const match = list.find((x) => (x.email || '').toLowerCase() === p.email.toLowerCase());
            if (match) patientId = match.patient_id || match.id;
          }
        }

        const hasFullProfile = p.first_name && p.last_name && p.date_of_birth && p.gender &&
          p.address?.address;
        if (!patientId && !hasFullProfile) {
          return res.status(200).json({ need_profile: true });
        }

        if (!patientId && hasFullProfile) {
          const consentMeta = consent
            ? {
                consent: [
                  consent.telehealth_informed_consent && 'telehealth',
                  consent.terms_and_privacy && 'terms_privacy',
                ].filter(Boolean).join(','),
                consent_at: consent.accepted_at,
              }
            : {};
          const metadata = [
            JSON.stringify({ ...(p.metadata || {}), ...consentMeta }),
            JSON.stringify(consentMeta),
            JSON.stringify({ consent_at: consentMeta.consent_at || null }),
          ].find((m) => m.length <= 255) ?? '';

          const createRes = await mdi('/patients', {
            first_name: p.first_name,
            last_name: p.last_name,
            email: p.email,
            phone_number: p.phone_number || null,
            phone_type: 2,
            date_of_birth: p.date_of_birth,
            gender: p.gender,
            // Only sent if a caller supplies them — the intake modal doesn't,
            // since the questionnaire asks. The portal profile can set them later.
            ...(p.weight ? { weight: p.weight } : {}),
            ...(p.height ? { height: p.height } : {}),
            address: {
              address: p.address.address,
              address2: p.address.address2 || null,
              zip_code: p.address.zip_code,
              city_name: p.address.city_name,
              state_name: p.address.state_name
            },
            is_sms_enabled: true,
            is_email_enabled: true,
            metadata
          });
          if (createRes.ok) {
            const created = await createRes.json();
            patientId = created.patient_id || created.id || created.data?.patient_id || null;
          } else {
            console.error('MDI Patient Create Rejected:', await createRes.text());
          }
        }
      } catch (e) {
        console.error('MDI patient prefill failed:', e.message);
      }
    }
    let patientProfile = null;
    if (patientId) {
      try {
        const profileRes = await mdiGet(`/patients/${patientId}`);
        if (profileRes.ok) {
          const full = await profileRes.json();
          const d = full.data || full;
          patientProfile = {
            first_name: d.first_name || null,
            last_name: d.last_name || null,
            email: d.email || p?.email || null,
            phone_number: d.phone_number || null,
            date_of_birth: d.date_of_birth || null,
            gender: d.gender ?? null,
            address: d.address ? {
              address: d.address.address || null,
              zip_code: d.address.zip_code || null,
              city_name: d.address.city_name || null,
              // MDI nests the state; GHL wants the plain name.
              state_name: d.address.state?.name || null
            } : null
          };
        } else {
          console.error('MDI Patient Fetch Rejected:', await profileRes.text());
        }
      } catch (e) {
        console.error('MDI patient fetch failed:', e.message);
      }
    }

    if (consent && (patientId || p?.email)) {
      console.info('NovaMDK consent:', JSON.stringify({ patient_id: patientId, ...consent }));
    }

    const offeringId = req.body.case_offering_id;
    const voucherResponse = await mdi('/vouchers', {
      hold_status: true,
      patient_id: patientId,
      questionnaire_id: req.body.questionnaire_id,
      case_offerings: offeringId ? [offeringId] : [],
      disease: []
    });

    if (!voucherResponse.ok) {
      console.error("MDI Voucher Rejected:", await voucherResponse.text());
      return res.status(502).json({ error: "Voucher failed" });
    }

    const voucherData = await voucherResponse.json();
    return res.status(200).json({
      ...voucherData,
      patient_id: patientId,
      prefill: !!patientId,
      patient_profile: patientProfile,
      // Null unless API_SIGNING_SECRET is set — see api/_guard.js.
      release_token: signReleaseToken(patientId)
    });

  } catch (error) {
    console.error("Internal API Error:", error.message);
    return res.status(500).json({ error: 'Internal error' });
  }
}