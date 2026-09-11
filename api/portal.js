import { blocked } from './_guard.js';
import { mdi, mdiUpload, mdiConfigured, listOf } from './_mdi.js';
import { readSession, sessionsEnabled } from './_session.js';

const MESSAGE_PAGE = 100;
const CHANNELS = new Set(['patient']);

/* MDI's own list of accepted upload types; anything else is rejected upstream. */
const UPLOAD_TYPE = (mime) => {
  if (String(mime).startsWith('image/')) return 'photo';
  if (String(mime).startsWith('audio/') || String(mime).startsWith('video/')) return 'av-video';
  return 'other';
};
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const MIN_UPLOAD_BYTES = 1024;
const WRITABLE = [
  'first_name', 'last_name', 'phone_number', 'date_of_birth', 'gender',
  'weight', 'height', 'blood_pressure', 'body_temperature', 'oxygen_saturation',
  'current_medications', 'medical_conditions', 'allergies', 'pregnancy',
  'is_sms_enabled', 'is_email_enabled',
];
const ADDRESS_FIELDS = ['address', 'address2', 'zip_code', 'city_name', 'state_name'];

/** MDI stamps authorship as a PHP class name: App\Models\Patient, …\Clinician. */
const isPatient = (userType) => /\\Patient$/.test(String(userType || ''));

const shapeMessage = (m) => ({
  id: m.id,
  text: m.text || '',
  created_at: m.created_at,
  mine: isPatient(m.user_type),
  author: isPatient(m.user_type) ? null : m.user_name || 'Care team',
  read_at: m.read_at || null,
  files: (m.files || []).map((f) => ({
    id: f.file_id || f.id,
    name: f.name || f.file_name || 'Attachment',
    mime_type: f.mime_type || null,
  })),
});

const shapeProfile = (p) => ({
  patient_id: p.patient_id || p.id,
  first_name: p.first_name || '',
  last_name: p.last_name || '',
  email: p.email || '',
  phone_number: p.phone_number || '',
  date_of_birth: p.date_of_birth || '',
  gender: p.gender ?? null,
  gender_label: p.gender_label || null,
  weight: p.weight ?? null,
  height: p.height ?? null,
  blood_pressure: p.blood_pressure || '',
  body_temperature: p.body_temperature ?? null,
  oxygen_saturation: p.oxygen_saturation ?? null,
  current_medications: p.current_medications || '',
  medical_conditions: p.medical_conditions || '',
  allergies: p.allergies || '',
  pregnancy: Boolean(p.pregnancy),
  is_sms_enabled: p.is_sms_enabled !== false,
  is_email_enabled: p.is_email_enabled !== false,
  address: p.address
    ? {
        address: p.address.address || '',
        address2: p.address.address2 || '',
        zip_code: p.address.zip_code || '',
        city_name: p.address.city_name || '',
        // MDI nests the state on read but takes a flat name on write.
        state_name: p.address.state?.name || p.address.state_name || '',
      }
    : null,
});

/* The last thing MDI knows is `fulfilled` — the pharmacy shipped it and
   attached a tracking number. There is no delivered status and no delivery
   webhook; that knowledge stays with the carrier. So the final step is
   "Shipped", not "Delivered", which would never fill in. */
const STEPS = [
  { key: 'received', label: 'Received' },
  { key: 'in_review', label: 'In Review' },
  { key: 'rx_approved', label: 'Rx Approved' },
  { key: 'fulfillment', label: 'In Fulfillment' },
  { key: 'shipped', label: 'Shipped' },
];

/* Case statuses only carry the clinical half. The last two steps come from the
   pharmacy order, which is a separate vocabulary entirely
   (new / ready / received / fulfilled / failed). */
const STATUS_STEP = {
  created: 'received', pending: 'received', new: 'received',
  assigned: 'in_review', processing: 'in_review', in_review: 'in_review',
  prescribed: 'rx_approved', approved: 'rx_approved',
  completed: 'rx_approved', closed: 'rx_approved',
};

/* Coarse progress for a visit, derived from its status alone so the list and
   the Home page cost no extra upstream calls. It tops out at "Rx Approved":
   the last two steps come from the pharmacy order, which only the case detail
   fetches. The label is what's shown, so this never claims more than it knows. */
const stepOf = (status) => {
  const key = STATUS_STEP[String(status || '').toLowerCase()];
  const index = key ? STEPS.findIndex((s) => s.key === key) : -1;
  return { index, total: STEPS.length, label: index >= 0 ? STEPS[index].label : null };
};

const VISIT_BUCKET = {
  created: 'pending', pending: 'pending', new: 'pending',
  assigned: 'pending', processing: 'pending', in_review: 'pending',
  prescribed: 'active', approved: 'active', completed: 'active',
  closed: 'inactive', cancelled: 'inactive', canceled: 'inactive',
  rejected: 'inactive', denied: 'inactive',
};

const shapeDraft = (v) => {
  const resumable = String(v.status || '').toLowerCase() === 'pending' && !v.is_expired;
  return {
    kind: 'draft',
    id: v.id,
    case_id: null,
    created_at: v.created_at,
    status: resumable ? 'incomplete' : 'expired',
    bucket: resumable ? 'incomplete' : 'inactive',
    answered: Array.isArray(v.questionnaire_progress) ? v.questionnaire_progress.length : 0,
    resume_url: resumable ? v.onboarding_url || null : null,
    // Lets the portal name and illustrate the treatment they were part-way through.
    questionnaire_id: v.partner_questionnaire_id || null,
    clinician: null,
    specialty: null,
    treatments: [],
  };
};

/* Only statuses worth telling a patient about. Anything unlisted produces no
   notification rather than leaking an internal workflow name. */
const VISIT_HEADLINE = {
  created: 'Your visit was submitted',
  pending: 'Your visit was submitted',
  new: 'Your visit was submitted',
  assigned: 'A clinician is reviewing your visit',
  processing: 'Your visit is in review',
  prescribed: 'Your treatment has been prescribed',
  approved: 'Your treatment has been approved',
  completed: 'Your visit is complete',
  closed: 'Your visit is complete',
  cancelled: 'Your visit was cancelled',
  canceled: 'Your visit was cancelled',
};

/** Flattens /cases/:id/orders, which nests orders under pharmacy sequences. */
const flattenOrders = (payload) =>
  listOf(payload).flatMap((row) => (Array.isArray(row?.orders) ? row.orders : row ? [row] : []));

function summariseOrders(orders) {
  if (!orders.length) return { exists: false, shipped: false, tracking: null, issue: null };

  const status = (o) => String(o.status || '').toLowerCase();
  const shippedOrder = orders.find((o) => status(o) === 'fulfilled');
  const failed = orders.find((o) => status(o) === 'failed');

  // Tracking arrives either as a structured object or embedded in the details
  // string — the webhook sends it as "Tracking Number: 101010".
  let tracking = null;
  for (const o of orders) {
    if (o.tracking?.number) {
      tracking = { number: o.tracking.number, link: o.tracking.link || null, company: o.tracking.company || null };
      break;
    }
    const match = String(o.details || o.status_details || '').match(/tracking number[:\s]+([A-Za-z0-9-]+)/i);
    if (match) { tracking = { number: match[1], link: null, company: null }; break; }
  }

  return {
    exists: true,
    shipped: Boolean(shippedOrder),
    at: shippedOrder?.updated_at || shippedOrder?.date || null,
    started_at: orders[0]?.created_at || orders[0]?.date || null,
    tracking,
    // A pharmacy rejection ("Invalid Address Zip") is the patient's to fix, and
    // without it the stepper would just sit at In Fulfillment forever.
    issue: failed ? String(failed.status_details || failed.details || 'The pharmacy could not process this order.') : null,
  };
}

/** Earliest timestamp per stage, plus how far the case has actually got. */
function buildTimeline(statuses, orderState) {
  const reachedAt = {};
  let furthest = -1;
  let cancelled = null;

  for (const s of statuses) {
    const name = String(s.name || '').toLowerCase();
    if (name === 'cancelled' || name === 'canceled') {
      cancelled = s.created_at || null;
      continue;
    }
    const step = STATUS_STEP[name];
    if (!step) continue;
    const index = STEPS.findIndex((x) => x.key === step);
    if (!reachedAt[step]) reachedAt[step] = s.created_at || null;
    if (index > furthest) furthest = index;
  }

  if (orderState.exists) {
    reachedAt.fulfillment = orderState.started_at;
    furthest = Math.max(furthest, STEPS.findIndex((x) => x.key === 'fulfillment'));
  }
  if (orderState.shipped) {
    reachedAt.shipped = orderState.at;
    furthest = STEPS.length - 1;
  }

  return {
    cancelled_at: cancelled,
    tracking: orderState.tracking,
    issue: orderState.issue,
    steps: STEPS.map((s, i) => ({
      key: s.key,
      label: s.label,
      at: reachedAt[s.key] || null,
      done: i < furthest,
      current: i === furthest,
    })),
  };
}

/* bio_details is HTML. It's stripped to text here rather than rendered as
   markup — nothing from an upstream API should reach the DOM as HTML. */
const stripHtml = (html) =>
  String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

/* MDI substitutes patient answers into prescription directions, but any token
   it can't resolve is left in the string verbatim — patients were seeing raw
   "[patient_special_necessities]" on their own visit page. */
const cleanDirections = (text) =>
  String(text || '').replace(/\[[a-z0-9_]+\]/gi, '').replace(/\s{2,}/g, ' ').trim() || null;

const shapeCase = (c) => {
  const clinician = c.case_assignment?.clinician;

  /* A prescribed offering comes back in BOTH arrays under the SAME id, so
     concatenating them listed every prescription twice. The prescription is the
     richer record (quantity, directions), so offerings only contribute what
     isn't already prescribed — lab panels, add-on services.

     Note that two prescriptions sharing a name are NOT duplicates: a titration
     ladder is one line per dose step (0.25 mg for weeks 1-4, then 0.5 mg), and
     collapsing those would hide half the schedule from the patient. */
  const prescriptions = (c.case_prescriptions || []).map((rx) => ({
    id: rx.case_prescription_id || rx.id,
    name: rx.name || rx.medication_name || 'Prescription',
    detail: [rx.strength, rx.quantity && `Qty ${rx.quantity}`, cleanDirections(rx.directions)]
      .filter(Boolean).join(' · ') || null,
  }));
  const prescribedIds = new Set(prescriptions.map((t) => t.id));

  return {
    case_id: c.case_id || c.id,
    created_at: c.created_at,
    case_type: c.case_type || null,
    status: c.case_status?.name || null,
    clinician: clinician ? `${clinician.first_name || ''} ${clinician.last_name || ''}`.trim() : null,
    specialty: clinician?.specialty || null,
    treatments: [
      ...prescriptions,
      ...(c.case_offerings || [])
        .filter((o) => !prescribedIds.has(o.case_offering_id || o.id))
        .map((o) => ({
          id: o.case_offering_id || o.id,
          name: o.name || o.title || 'Treatment',
          detail: o.description || null,
        })),
    ],
  };
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  // An open portal polls two threads, switches tabs and acknowledges reads;
  // several people behind one office NAT share this IP bucket too.
  if (blocked(req, res, { max: 240 })) return;

  if (!sessionsEnabled() || !mdiConfigured()) {
    return res.status(503).json({ error: 'Portal not configured' });
  }

  const patientId = readSession(req);
  if (!patientId) return res.status(401).json({ error: 'Not signed in' });

  const id = encodeURIComponent(patientId);
  const resource = req.body?.resource;

  try {
    if (resource === 'profile') {
      const r = await mdi(`/patients/${id}`);
      if (!r.ok) {
        console.error('Portal profile failed:', r.status);
        return res.status(502).json({ error: 'Could not load your profile' });
      }
      return res.status(200).json({ profile: shapeProfile(r.data?.data || r.data) });
    }

    if (resource === 'update_profile') {
      const patch = {};
      for (const key of WRITABLE) {
        if (req.body?.profile?.[key] !== undefined) patch[key] = req.body.profile[key];
      }
      if (req.body?.profile?.address) {
        patch.address = {};
        for (const key of ADDRESS_FIELDS) {
          if (req.body.profile.address[key] !== undefined) patch.address[key] = req.body.profile.address[key];
        }
      }
      if (!Object.keys(patch).length) return res.status(400).json({ error: 'Nothing to update' });

      const r = await mdi(`/patients/${id}`, { method: 'PATCH', body: patch });
      if (!r.ok) {
        console.error('Portal profile update failed:', r.status);
        return res.status(502).json({ error: 'Could not save your changes' });
      }
      return res.status(200).json({ profile: shapeProfile(r.data?.data || r.data) });
    }

    if (resource === 'cases') {
      const [r, v] = await Promise.all([
        mdi(`/patients/${id}/cases`),
        mdi(`/patients/${id}/vouchers`),
      ]);
      if (!r.ok) {
        console.error('Portal cases failed:', r.status);
        return res.status(502).json({ error: 'Could not load your visits' });
      }

      if (!v.ok) console.error('Portal vouchers failed:', v.status);
      const vouchers = v.ok ? listOf(v.data) : [];
      const questionnaireByCase = new Map(
        vouchers.filter((x) => x.case_id).map((x) => [x.case_id, x.partner_questionnaire_id || null])
      );

      const cases = listOf(r.data)
        .map(shapeCase)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        // Numbered oldest-first so "Visit #1" stays #1 as new ones arrive.
        .map((c, i) => ({
          ...c,
          kind: 'case',
          id: c.case_id,
          number: i + 1,
          bucket: VISIT_BUCKET[String(c.status || '').toLowerCase()] || 'pending',
          step: stepOf(c.status),
          questionnaire_id: questionnaireByCase.get(c.case_id) || null,
        }));

      const drafts = vouchers.filter((x) => !x.case_id).map(shapeDraft);

      const visits = [...cases, ...drafts].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      return res.status(200).json({ cases, visits });
    }

    if (resource === 'notifications') {
      const [msgs, cases] = await Promise.all([
        mdi(`/patients/${id}/messages?channel=patient&per_page=${MESSAGE_PAGE}`),
        mdi(`/patients/${id}/cases`),
      ]);

      const items = [];

      for (const m of listOf(msgs.data)) {
        if (isPatient(m.user_type) || m.read_at) continue;
        items.push({
          id: `message:${m.id}`,
          kind: 'message',
          tab: 'messages',
          title: `New message from ${m.user_name || 'your care team'}`,
          preview: String(m.text || '').trim().slice(0, 120) || 'Sent you an attachment',
          at: m.created_at,
        });
      }

      // Numbered oldest-first so "Visit #1" matches the Visits tab.
      const ordered = listOf(cases.data)
        .slice()
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      ordered.forEach((c, i) => {
        const status = String(c.case_status?.name || '').toLowerCase();
        const at = c.case_status?.created_at;
        const title = VISIT_HEADLINE[status];
        if (!title || !at) return;
        // Older than a month isn't news; it's just history.
        if (Date.now() - new Date(at).getTime() > 30 * 24 * 60 * 60_000) return;
        items.push({
          id: `visit:${c.case_id || c.id}:${status}`,
          kind: 'visit',
          tab: 'visits',
          title,
          preview: `Visit #${i + 1}`,
          at,
        });
      });

      items.sort((a, b) => new Date(b.at) - new Date(a.at));
      return res.status(200).json({ items: items.slice(0, 20) });
    }

    if (resource === 'case_detail') {
      const caseId = String(req.body?.case_id || '');
      if (!caseId) return res.status(400).json({ error: 'case_id is required' });

      const detail = await mdi(`/cases/${encodeURIComponent(caseId)}`);
      if (!detail.ok) {
        console.error('Portal case detail failed:', detail.status);
        return res.status(502).json({ error: 'Could not load that visit' });
      }
      const body = detail.data?.data || detail.data;

      /* case_id arrives from the browser, so ownership is re-checked against
         the session rather than trusted. Without this, editing the id in a
         request would read a stranger's chart. */
      const owner = body?.patient?.patient_id || body?.patient?.id || body?.patient_id;
      if (owner !== patientId) {
        console.warn('Portal case detail: ownership mismatch');
        return res.status(403).json({ error: 'Forbidden' });
      }

      const [history, orders] = await Promise.all([
        mdi(`/cases/${encodeURIComponent(caseId)}/statuses`),
        mdi(`/cases/${encodeURIComponent(caseId)}/orders`),
      ]);
      const timeline = buildTimeline(
        listOf(history.data),
        summariseOrders(flattenOrders(orders.data))
      );

      // The clinician id comes from the case MDI just returned, never from the
      // request, so this can't be pointed at an arbitrary record.
      let clinician = null;
      const clinicianId = body?.case_assignment?.clinician?.clinician_id;
      if (clinicianId) {
        const c = await mdi(`/clinicians/${encodeURIComponent(clinicianId)}`);
        const d = c.data?.data || c.data;
        if (c.ok && d) {
          clinician = {
            name: [d.first_name, d.last_name].filter(Boolean).join(' '),
            suffix: d.suffix || null,
            specialty: d.specialty || null,
            photo: d.url_thumbnail || null,
            bio: stripHtml(d.bio_details).slice(0, 600) || null,
          };
        }
      }

      return res.status(200).json({ timeline, clinician });
    }

    if (resource === 'messages') {
      const channel = CHANNELS.has(req.body?.channel) ? req.body.channel : 'patient';
      const r = await mdi(`/patients/${id}/messages?channel=${channel}&per_page=${MESSAGE_PAGE}`);
      if (!r.ok) {
        console.error('Portal messages failed:', r.status);
        return res.status(502).json({ error: 'Could not load your messages' });
      }
      // MDI paginates newest-first; the thread reads oldest-first.
      const messages = listOf(r.data)
        .map(shapeMessage)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      return res.status(200).json({ messages });
    }

    if (resource === 'upload') {
      const { name, mime_type: mime, data } = req.body || {};
      if (!data) return res.status(400).json({ error: 'No file received' });

      const buf = Buffer.from(String(data), 'base64');
      if (!buf.length) return res.status(400).json({ error: 'That file could not be read' });
      if (buf.length < MIN_UPLOAD_BYTES) {
        return res.status(400).json({ error: 'That file is too small to send. The minimum is 1 KB.' });
      }
      if (buf.length > MAX_UPLOAD_BYTES) {
        return res.status(413).json({ error: 'That file is too large. The limit is 3 MB.' });
      }

      const filename = String(name || 'attachment').replace(/[/\\]/g, '_').slice(0, 120);
      const form = new FormData();
      form.append('name', filename);
      form.append('type', UPLOAD_TYPE(mime));
      form.append('file', new Blob([buf], { type: mime || 'application/octet-stream' }), filename);

      const r = await mdiUpload('/files', form);
      const fileId = r.data?.file_id || r.data?.id;
      if (!r.ok || !fileId) {
        console.error('Portal upload failed:', r.status);
        return res.status(502).json({ error: 'Could not upload that file' });
      }
      return res.status(200).json({ file: { id: fileId, name: r.data?.name || filename } });
    }

    if (resource === 'send_message') {
      const channel = CHANNELS.has(req.body?.channel) ? req.body.channel : 'patient';
      const text = String(req.body?.text || '').trim();
      const fileIds = Array.isArray(req.body?.file_ids)
        ? req.body.file_ids.filter((f) => typeof f === 'string').slice(0, 10)
        : [];
      if (!text && !fileIds.length) return res.status(400).json({ error: 'Message is empty' });
      if (text.length > 5000) return res.status(400).json({ error: 'Message is too long' });

      const r = await mdi(`/patients/${id}/messages`, {
        method: 'POST',
        body: {
          channel,
          text,
          sender_type: 'patient',
          ...(fileIds.length ? { files: fileIds.map((f) => ({ id: f })) } : {}),
        },
      });

      if (!r.ok) {
        console.error('Portal send failed:', r.status);
        return res.status(502).json({ error: 'Could not send your message' });
      }
      return res.status(200).json({ message: shapeMessage(r.data?.data || r.data) });
    }

    if (resource === 'read_message') {
      const messageId = String(req.body?.message_id || '');
      if (!messageId) return res.status(400).json({ error: 'message_id is required' });

      // Path-scoped to this patient, so a guessed id from another chart 404s.
      const r = await mdi(`/patients/${id}/messages/${encodeURIComponent(messageId)}/read`, {
        method: 'POST',
      });
      return res.status(r.ok ? 200 : 502).json({ read: r.ok });
    }

    if (resource === 'file') {
      const fileId = String(req.body?.file_id || '');
      if (!fileId) return res.status(400).json({ error: 'file_id is required' });

      const r = await mdi(`/files/${encodeURIComponent(fileId)}`);
      if (!r.ok) return res.status(502).json({ error: 'Could not open that attachment' });
      return res.status(200).json({ url: r.data?.url || null, name: r.data?.name || null });
    }


    return res.status(400).json({ error: 'Unknown resource' });
  } catch (error) {
    console.error('Portal error:', error.message);
    return res.status(500).json({ error: 'Internal error' });
  }
}
