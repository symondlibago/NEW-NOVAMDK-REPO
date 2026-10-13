import {
  ghlConfigured,
  upsertContact,
  addContactNote,
  createVisitOpportunity,
  updateContactFields,
  tagContact,
  untagContact,
  INTAKE_STAGE,
} from "./_ghl.js";
import { blocked } from "./_guard.js";
import { checkHuman } from "./_turnstile.js";
import { PRICES } from "./_prices.js";

/* ------------------------------ contact form ----------------------------- */

/* The website's own contact form, replacing the GoHighLevel survey embed.

   It lives in this function rather than its own because Vercel's Hobby plan
   caps a deployment at 12 serverless functions and api/ is at 11.

   It deliberately does NOT share the intake path below: that path stamps
   intake_stage "not started" and opens an opportunity, which would reset the
   stage of an existing patient who merely sent a question. A contact message
   touches names, email, phone, two message fields, a note and a tag. */
const CONTACT_TOPICS = {
  general: "General question",
  treatment: "Treatment question",
  order: "Order or shipping",
  account: "Account or portal",
  kiosk: "Host a kiosk",
};
const CONTACT_TAG = "contact-form";
const MESSAGE_MAX = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");

async function contactForm(req, res) {
  const body = req.body || {};

  /* Honeypot: a field people never see. A bot that fills every input gets a
     cheerful 200 and nothing is written, so it has no signal to adapt to. */
  if (text(body.company, 200)) {
    console.warn("Contact form honeypot was filled; submission dropped.");
    return res.status(200).json({ ok: true });
  }

  const name = text(body.name, 120);
  const email = text(body.email, 160).toLowerCase();
  const phone = text(body.phone, 40);
  const message = text(body.message, MESSAGE_MAX);
  const topic = Object.hasOwn(CONTACT_TOPICS, body.topic) ? body.topic : "general";

  if (!name || !EMAIL_RE.test(email) || message.length < 2) {
    return res.status(400).json({ ok: false, error: "invalid" });
  }

  /* After the honeypot and the field checks, which are free, and before the
     GHL writes. One step, so no pass: the token is spent here and the form
     resets its widget if the visitor needs to send again. */
  const human = await checkHuman(req);
  if (!human.ok) {
    return res.status(403).json({ ok: false, error: "human_check_failed" });
  }

  if (!ghlConfigured()) {
    console.warn("GHL env vars missing — contact form message could not be saved.");
    return res.status(503).json({ ok: false, error: "not_configured" });
  }

  const [firstName, ...rest] = name.split(/\s+/);

  try {
    /* Same upsert the GHL survey performed, so an existing contact is updated
       rather than duplicated, matched on email. */
    const contact = await upsertContact({
      patient: {
        email,
        phone_number: phone || undefined,
        first_name: firstName,
        last_name: rest.join(" ") || undefined,
      },
    });
    if (!contact?.id) throw new Error("GHL returned no contact");

    /* Written to fields, not only the note, because GHL's notification email can
       merge a contact field but can't reach "the latest note". Written before the
       tag, so the workflow the tag triggers already sees this message. */
    await updateContactFields(contact.id, {
      contact_form_topic: CONTACT_TOPICS[topic],
      contact_form_message: message,
    });

    // The note is the history: fields hold only the newest message.
    await addContactNote(contact.id, `Contact form: ${CONTACT_TOPICS[topic]}\n\n${message}`).catch((e) =>
      console.error("Contact form note failed:", e.message)
    );

    /* Removed first, then added. A GHL tag trigger fires only when a tag is newly
       added, so someone writing in a second time would otherwise send nobody an
       email: the tag would already be on them. */
    await untagContact(contact.id, [CONTACT_TAG]).catch(() => {});
    await tagContact(contact.id, [CONTACT_TAG, `contact-${topic}`]);

    console.info(`Contact form received: ${topic} from contact ${contact.id}`);
    return res.status(200).json({ ok: true });
  } catch (e) {
    /* Unlike the intake sync below, this failure is surfaced. The person is
       waiting on a reply, so they need to know the message didn't go. */
    console.error("Contact form failed:", e.message, e.details ?? "");
    return res.status(502).json({ ok: false, error: "upstream_failed" });
  }
}

/* ----------------------------- kiosk text-me ----------------------------- */

/* "Text me the link" on the in-store kiosk (client approved, 2026-10-10). The
   number is saved with a link to start the visit, then tagged; a GHL workflow
   on that tag sends the text, so its wording and opt-outs live in GHL. Same
   field-then-tag order as the contact form above.

   The link names the product by id, never by name, so nothing about a
   treatment reaches GHL from here. It is always built on the live site rather
   than from the request's Origin: a forged Origin must not be able to put
   another domain's link into a text sent from the clinic's number. */
const TEXT_LINK_TAG = "kiosk-text-link";
const SITE = "https://www.novamdk.com";
const KIOSK_ID_RE = /^[a-z0-9-]{1,40}$/;

/* At most three texts to one number in fifteen minutes on a warm instance,
   on top of the per-IP limit, so the form can't be used to flood a stranger. */
const TEXT_WINDOW_MS = 15 * 60_000;
const TEXT_MAX = 3;
const textsSent = new Map();
function tooManyTexts(phone) {
  const now = Date.now();
  const recent = (textsSent.get(phone) || []).filter((t) => now - t < TEXT_WINDOW_MS);
  if (recent.length >= TEXT_MAX) return true;
  textsSent.set(phone, [...recent, now]);
  if (textsSent.size > 5000) textsSent.clear();
  return false;
}

async function kioskTextLink(req, res) {
  const body = req.body || {};
  const digits = String(body.phone || "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  const pid = String(body.pid || "");
  const kiosk = KIOSK_ID_RE.test(body.kiosk || "") ? body.kiosk : null;
  const consent = text(body.consent, 300);

  if (digits.length !== 10 || !PRICES[pid] || !consent) {
    return res.status(400).json({ ok: false, error: "invalid" });
  }

  const human = await checkHuman(req);
  if (!human.ok) {
    return res.status(403).json({ ok: false, error: "human_check_failed" });
  }

  if (!ghlConfigured()) {
    console.warn("GHL env vars missing — kiosk text link could not be saved.");
    return res.status(503).json({ ok: false, error: "not_configured" });
  }

  if (tooManyTexts(digits)) {
    return res.status(429).json({ ok: false, error: "too_many" });
  }

  const params = new URLSearchParams({ start: "1", ...(kiosk && { from: kiosk }) });
  const link = `${SITE}/product/${pid}?${params}`;

  try {
    const contact = await upsertContact({ patient: { phone_number: digits } });
    if (!contact?.id) throw new Error("GHL returned no contact");

    await updateContactFields(contact.id, { kiosk_link: link });

    // The consent record: what the screen said, where, and when (the note's own date).
    await addContactNote(contact.id, `Kiosk text-me${kiosk ? ` (${kiosk})` : ""}. Agreed to: "${consent}"`).catch((e) =>
      console.error("Kiosk text-me note failed:", e.message)
    );

    // Removed first so a second request fires the workflow again.
    await untagContact(contact.id, [TEXT_LINK_TAG]).catch(() => {});
    await tagContact(contact.id, [TEXT_LINK_TAG]);

    console.info(`Kiosk text-me saved for contact ${contact.id}`);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Kiosk text-me failed:", e.message, e.details ?? "");
    return res.status(502).json({ ok: false, error: "upstream_failed" });
  }
}

/* -------------------------------- handler -------------------------------- */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const isContactForm = req.body?.kind === "contact_form";
  const isTextLink = req.body?.kind === "kiosk_text_link";

  /* Tighter for the public form: it's the one path here a stranger can post
     free text to, and six messages a minute is already more than a person sends.
     The kiosk's text-me sends an SMS, so it gets the same limit. */
  if (blocked(req, res, isContactForm || isTextLink ? { max: 6 } : undefined)) return;

  if (isContactForm) return contactForm(req, res);
  if (isTextLink) return kioskTextLink(req, res);

  if (!ghlConfigured()) {
    console.warn("GHL env vars missing (GHL_API_TOKEN / GHL_LOCATION_ID) — skipping contact sync.");
    return res.status(200).json({ ok: false, skipped: "not_configured" });
  }

  try {
    const { patient, treatment, tags, source, note, value, kioskLocation, mdiPatientId, productLine, marketing } = req.body || {};
    /* This call is the hand-off: the contact and its opportunity are created a
       beat before the questionnaire opens, so the intake genuinely has not
       started yet. Anyone who never gets further stays parked here, which is
       the drop-off the funnel is meant to show. */
    const stage = INTAKE_STAGE.NOT_STARTED;
    const contact = await upsertContact({ patient, treatment, tags, source, mdiPatientId, productLine, intakeStage: stage, marketing });
    // Returned to the client so the payment step can move this exact
    // opportunity to Paid, rather than guessing at it by contact later.
    let opportunityId = null;
    if (contact?.id && treatment) {
      try {
        const { opportunity, created } = await createVisitOpportunity({ contactId: contact.id, treatment, value, source, kioskLocation, productLine, intakeStage: stage });
        opportunityId = opportunity?.id || null;
        if (!created) {
          console.warn(
            `GHL blocked a second opportunity for contact ${contact.id}, so the existing one was updated to "${treatment}" instead. Enable duplicate opportunities on the location to record each visit separately.`
          );
        }
      } catch (e) {
        console.error("GHL opportunity failed:", e.message, e.status === 401 ? "(token missing opportunities.write?)" : "");
      }
    }

    if (contact?.id && note) {
      try {
        await addContactNote(contact.id, note);
      } catch (e) {
        console.error("GHL note failed:", e.message);
      }
    }

    return res.status(200).json({ ok: true, contactId: contact?.id || null, opportunityId });
  } catch (e) {
    console.error("GHL contact sync failed:", e.message, e.details ?? "");
    return res.status(200).json({ ok: false, error: e.message });
  }
}
