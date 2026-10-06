import { nextIntakeDue, ladderFor, renewalDate } from "./_plans.js";
import { PRICES } from "./_prices.js";

const BASE = process.env.GHL_API_BASE || "https://services.leadconnectorhq.com";
const TOKEN = process.env.GHL_API_TOKEN;
const LOCATION_ID = process.env.GHL_LOCATION_ID;
const VERSION = process.env.GHL_API_VERSION || "2021-07-28";

export const ghlConfigured = () => Boolean(TOKEN && LOCATION_ID);
export const FIELD = {
  TREATMENT: "treatment",
  SEX_AT_BIRTH: "sex_at_birth",
  EMAIL_ADDRESS: "email_address",
  PRODUCT_LINE: "product_line",
  INTAKE_STAGE: "intake_stage",
  INTAKE_STARTED_DATE: "intake_started_date",
  /* ---- optional marketing opt-in, recorded as four parts so the choice can
     be defended later: what they said, when, where they were asked, and which
     wording they were shown ---- */
  EMAIL_MARKETING_CONSENT: "email_marketing_consent",
  EMAIL_MARKETING_CONSENT_DATE: "email_marketing_consent_date",
  EMAIL_MARKETING_CONSENT_SOURCE: "email_marketing_consent_source",
  EMAIL_MARKETING_CONSENT_VERSION: "email_marketing_consent_version",
  // MDI's permanent id for the person. One per patient, never changes, so the
  // Contact is the only place it belongs.
  /* The Stripe customer holding this patient's saved card, which is what lets
     a renewal be charged without them present.
   *
   * The only piece of plan machinery still on the contact. Everything else
   * (the term, the product, the counts, the renewal switch and date) moved to
   * OPP_FIELD further down on 2026-10-06, because a patient can hold a plan per
   * treatment and one set of contact fields could only hold one: buying a
   * second treatment overwrote the first and lost its prepaid months. A saved
   * card is genuinely one per patient, so this stayed. */
  STRIPE_CUSTOMER: "stripe_customer",
  MDI_PATIENT_ID: "mdi_patient_id",
  // The newest encounter, mirrored onto the Contact so a list can show it
  // without opening the opportunity. The per-visit copy lives below.
  LATEST_MDI_ENCOUNTER_ID: "latest_mdi_encounter_id",
  MDI_ENCOUNTER_STATUS: "mdi_encounter_status",
  LAST_MDI_UPDATE_DATE: "last_mdi_update_date",
  /* ---- these two live on the Opportunity, not the Contact ---- */
  // One person can walk up to two different kiosks, and per-visit is the only
  // place that stays true.
  KIOSK_LOCATION: "kiosk_location",
  // The encounter this particular visit produced. Distinct from the Contact's
  // LATEST_MDI_ENCOUNTER_ID, which gets overwritten each visit — this one is
  // the permanent record of which encounter belongs to which opportunity.
  MDI_ENCOUNTER_ID: "mdi_encounter_id",
};
const TREATMENT_FIELD_ID = "aUvylLMgR2BFDDjxKNm1";
const TREATMENT_SEPARATOR = "; ";
const TREATMENT_MAX_LENGTH = 500;
const SEX_AT_BIRTH = { 1: "Male", 2: "Female" };

/* `product_line` is a single-select dropdown in GHL, and a dropdown rejects any
 * value that isn't already one of its options: the write fails rather than
 * storing something new. So this mirrors the configured options exactly.
 *
 * "Supplements" is a real category on the site but deliberately absent here,
 * so those visits leave the column empty instead of failing. Add it to both
 * places, never just one, if that changes. */
const PRODUCT_LINES = new Set([
  "Weight Loss",
  "Recovery & Wellness",
  "Sexual Health",
  "Skin Health",
  "Longevity",
]);
const productLineOf = (name) => {
  const value = clean(name);
  if (!value) return null;
  if (PRODUCT_LINES.has(value)) return value;
  console.warn(`GHL product_line has no option for "${value}" — leaving it unset.`);
  return null;
};

/* Where a visit got to before the questionnaire was submitted. Guarded for the
 * same reason as product_line: the Contact copy is a dropdown. The Opportunity
 * copy is plain text and takes the value unchecked, so a mismatch loses the
 * Contact field but never the per-visit record. */
export const INTAKE_STAGE = {
  NOT_STARTED: "not_started",
  STARTED: "started",
  COMPLETE: "complete",
};
const INTAKE_STAGES = new Set(Object.values(INTAKE_STAGE));
const intakeStageOf = (stage) => {
  const value = clean(stage);
  if (!value) return null;
  if (INTAKE_STAGES.has(value)) return value;
  console.warn(`GHL intake_stage has no option for "${value}" — leaving it unset.`);
  return null;
};

/* Timestamps written for humans, in the clinic's own timezone. These land in
 * text fields, so nothing is gained by storing UTC, and a raw ISO stamp reads
 * seven hours wrong to the staff in California who actually look at them. */
const CLINIC_TZ = process.env.GHL_CLINIC_TIMEZONE || "America/Los_Angeles";
export const clinicStamp = (d = new Date()) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: CLINIC_TZ,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(d);

/* A plain calendar day, "2026-10-30", for GHL's DATE fields.
 *
 * Distinct from the two stamps either side of it because those land in TEXT
 * fields and are written to be read. This one is written to be compared: GHL
 * can only trigger a workflow off a real date field, and a date field rejects
 * "Oct 30, 2026 10:32 PDT". Built in the clinic's timezone so a due date set
 * late in a California evening isn't filed under tomorrow. */
export const dueDate = (d = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const at = (type) => parts.find((p) => p.type === type)?.value || "";
  return `${at("year")}-${at("month")}-${at("day")}`;
};

/* Sortable rather than friendly: "2026-09-11 10:32 PDT". A consent record gets
 * read in date order far more often than it gets read aloud, and this is the
 * shape the client asked for. */
export const consentStamp = (d = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CLINIC_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: "short",
  }).formatToParts(d);
  const at = (type) => parts.find((p) => p.type === type)?.value || "";
  return `${at("year")}-${at("month")}-${at("day")} ${at("hour")}:${at("minute")} ${at("timeZoneName")}`;
};

/* Written only when the browser actually reported a choice. An absent or
 * malformed payload leaves all four fields untouched rather than guessing, so a
 * blank column always means "never asked" and never "asked and we lost it". */
const MARKETING_SOURCE_FALLBACK = "website_intake";
const marketingFields = (m) => {
  if (!m || typeof m.consent !== "boolean") return {};
  const at = new Date(m.at || Date.now());
  return {
    [FIELD.EMAIL_MARKETING_CONSENT]: m.consent ? "yes" : "no",
    [FIELD.EMAIL_MARKETING_CONSENT_DATE]: consentStamp(Number.isNaN(at.getTime()) ? new Date() : at),
    [FIELD.EMAIL_MARKETING_CONSENT_SOURCE]: clean(m.source) || MARKETING_SOURCE_FALLBACK,
    [FIELD.EMAIL_MARKETING_CONSENT_VERSION]: clean(m.version),
  };
};

async function ghlFetch(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Version: VERSION,
      Accept: "application/json",
      ...(body && { "Content-Type": "application/json" }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* error bodies aren't always JSON — fall through with the raw text */
  }

  if (!res.ok) {
    const err = new Error(data?.message || `GHL ${method} ${path} failed (${res.status})`);
    err.status = res.status;
    err.details = data ?? text;
    throw err;
  }
  return data;
}

/* GHL stores phone numbers in E.164; the intake modal collects them free-form. */
function toE164(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits ? `+${digits}` : null;
}

const clean = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);

// GET responses spell it `value`, upsert responses spell it `fieldValue`.
const treatmentOf = (contact) =>
  clean(
    (contact?.customFields || []).find((f) => f.id === TREATMENT_FIELD_ID)
      ?.value ??
      (contact?.customFields || []).find((f) => f.id === TREATMENT_FIELD_ID)
        ?.fieldValue
  );

// Append `next` unless it's already listed, dropping the oldest entries if the
// field would overflow.
function mergeTreatment(previous, next) {
  if (!next) return null;
  const list = previous ? previous.split(TREATMENT_SEPARATOR).map((s) => s.trim()).filter(Boolean) : [];
  if (list.includes(next)) return list.join(TREATMENT_SEPARATOR);
  list.push(next);
  while (list.length > 1 && list.join(TREATMENT_SEPARATOR).length > TREATMENT_MAX_LENGTH) list.shift();
  return list.join(TREATMENT_SEPARATOR);
}

/* Additive: GHL's tag endpoint appends rather than replacing, so a later
 * lifecycle tag never wipes the ones the lead arrived with. */
export async function tagContact(contactId, tags = []) {
  const wanted = tags.filter(Boolean);
  if (!contactId || !wanted.length) return null;
  await ghlFetch(`/contacts/${contactId}/tags`, { method: "POST", body: { tags: wanted } });
  return wanted;
}

/* The mirror of the above, for a tag a later event makes untrue. Only
 * `payment-failed` uses this today: a declined card that goes through on the
 * second attempt must not leave the contact sitting in a recovery workflow. */
export async function untagContact(contactId, tags = []) {
  const wanted = tags.filter(Boolean);
  if (!contactId || !wanted.length) return null;
  await ghlFetch(`/contacts/${contactId}/tags`, { method: "DELETE", body: { tags: wanted } });
  return wanted;
}

/* Bare keys throughout. GHL's UI shows these wrapped as
 * `{{contact.some_key}}` / `{{opportunity.some_key}}` because that's the merge
 * syntax for emails and forms, but the API only accepts the unprefixed key. */
const customFieldList = (fields) =>
  Object.entries(fields)
    .filter(([, value]) => value != null && String(value).trim() !== "")
    .map(([key, value]) => ({ key, field_value: typeof value === "string" ? value.trim() : value }));

export async function updateContactFields(contactId, fields = {}) {
  const customFields = customFieldList(fields);
  if (!contactId || !customFields.length) return null;
  await ghlFetch(`/contacts/${contactId}`, { method: "PUT", body: { customFields } });
  return customFields;
}

/* `name` rides along because GHL treats it as required on an opportunity PUT.
 * Callers pass the same treatment the record was created with, so it reads as a
 * no-op rather than a rename. */
export async function updateOpportunityFields(opportunityId, fields = {}, { name } = {}) {
  const customFields = customFieldList(fields);
  if (!opportunityId || !customFields.length) return null;
  const data = await ghlFetch(`/opportunities/${opportunityId}`, {
    method: "PUT",
    body: { customFields, ...(clean(name) && { name: clean(name) }) },
  });
  return data?.opportunity || null;
}

export async function upsertContact({ patient = {}, treatment, tags = [], source, mdiPatientId, productLine, intakeStage, marketing } = {}) {
  const email = clean(patient.email);
  const phone = toE164(patient.phone_number);
  if (!email && !phone) throw new Error("A GHL contact needs at least an email or a phone number.");

  const address = patient.address || {};
  const customFields = [];
  const addField = (key, value) => value && customFields.push({ key, field_value: value });
  const nextTreatment = clean(treatment);
  addField(FIELD.SEX_AT_BIRTH, SEX_AT_BIRTH[Number(patient.gender)]);
  addField(FIELD.EMAIL_ADDRESS, email);
  // MDI hands this back with the voucher, which is minted moments before this
  // call. It stays blank when MDI couldn't match or create the patient.
  addField(FIELD.MDI_PATIENT_ID, clean(mdiPatientId));
  // Single-select, so a repeat patient's column reflects their newest visit
  // rather than every line they've bought. The full history lives in Treatment.
  addField(FIELD.PRODUCT_LINE, productLineOf(productLine));
  // Reset on every visit: the stage describes the newest intake, not a lifetime
  // high-water mark. The per-visit history stays on the opportunities.
  addField(FIELD.INTAKE_STAGE, intakeStageOf(intakeStage));
  for (const [key, value] of Object.entries(marketingFields(marketing))) addField(key, value);

  const body = {
    locationId: LOCATION_ID,
    country: "US",
    ...(email && { email }),
    ...(phone && { phone }),
    ...(clean(patient.first_name) && { firstName: clean(patient.first_name) }),
    ...(clean(patient.last_name) && { lastName: clean(patient.last_name) }),
    ...(clean(patient.date_of_birth) && { dateOfBirth: clean(patient.date_of_birth) }),
    ...(clean(address.address) && { address1: clean(address.address) }),
    ...(clean(address.city_name) && { city: clean(address.city_name) }),
    ...(clean(address.state_name) && { state: clean(address.state_name) }),
    ...(clean(address.zip_code) && { postalCode: clean(address.zip_code) }),
    ...(clean(source) && { source: clean(source) }),
    ...(customFields.length && { customFields }),
  };

  const data = await ghlFetch("/contacts/upsert", { method: "POST", body });
  const contact = data?.contact || null;

  if (phone && contact && !contact.phone) {
    console.warn(`GHL saved contact ${contact.id} without its phone — that number already belongs to another contact.`);
  }

  if (contact?.id && nextTreatment) {
    const previous = treatmentOf(contact);
    const merged = mergeTreatment(previous, nextTreatment);
    if (merged && merged !== previous) {
      try {
        await ghlFetch(`/contacts/${contact.id}`, {
          method: "PUT",
          body: { customFields: [{ key: FIELD.TREATMENT, field_value: merged }] },
        });
      } catch (e) {
        console.error("GHL treatment update failed:", e.message);
      }
    }
  }

  if (contact?.id) {
    try {
      await tagContact(contact.id, tags);
    } catch (e) {
      console.error("GHL tagging failed:", e.message);
    }
  }

  return contact;
}

const PIPELINE_NAME = process.env.GHL_PIPELINE_NAME || null;
const STAGE_NAME = process.env.GHL_STAGE_NAME || null;
const PAID_STAGE_NAME = process.env.GHL_PAID_STAGE_NAME || "Paid";

let pipelineCache = null;

async function resolvePipeline() {
  if (pipelineCache) return pipelineCache;
  const data = await ghlFetch(`/opportunities/pipelines?locationId=${LOCATION_ID}`);
  const pipelines = data?.pipelines || [];
  const pipeline =
    (PIPELINE_NAME && pipelines.find((p) => p.name?.toLowerCase() === PIPELINE_NAME.toLowerCase())) ||
    pipelines[0];
  if (!pipeline) throw new Error("No GHL pipeline exists for this location — create one in Opportunities.");

  const stages = pipeline.stages || [];
  const stage =
    (STAGE_NAME && stages.find((s) => s.name?.toLowerCase() === STAGE_NAME.toLowerCase())) || stages[0];
  if (!stage) throw new Error(`GHL pipeline "${pipeline.name}" has no stages.`);

  // `stages` is kept so later moves (e.g. to Paid) resolve without a second call.
  pipelineCache = {
    pipelineId: pipeline.id,
    stageId: stage.id,
    stages,
    pipelineName: pipeline.name,
    label: `${pipeline.name} / ${stage.name}`,
  };
  return pipelineCache;
}

/* Stage and status are separate things in GHL, and the dashboard's conversion
 * rate counts status === "won" — the stage a card sits in doesn't feed it.
 * Moving to Paid without this left every paid visit as the "open" it was
 * created with, which is why the dashboard read 0% against a board full of
 * paid cards.
 *
 * Since 2026-10-02 the two happen at different moments, which is why they are
 * separate calls. Checkout only places a hold, so authorisation moves the card
 * to Paid, where staff look, and leaves the status alone. Capture, when a
 * provider approves, is the first point money has actually moved, so that is
 * what sets "won". Marked won at authorisation instead, a hold that later
 * expired or was reversed would leave revenue reporting claiming money the
 * practice was never paid.
 *
 * `opts.won` keeps the old one-shot behaviour for the processors that still
 * charge outright rather than holding: Kurv and NMI both settle in one step and
 * have no authorise-then-capture stage to split.
 */
export async function markOpportunityPaid(opportunityId, { won = true } = {}) {
  if (!opportunityId) return null;

  const { stages, pipelineName } = await resolvePipeline();
  const paid = stages.find((s) => s.name?.toLowerCase() === PAID_STAGE_NAME.toLowerCase());
  if (!paid) {
    throw new Error(`GHL pipeline "${pipelineName}" has no "${PAID_STAGE_NAME}" stage.`);
  }

  const data = await ghlFetch(`/opportunities/${opportunityId}`, {
    method: "PUT",
    body: { pipelineStageId: paid.id, ...(won && { status: "won" }) },
  });
  return data?.opportunity || null;
}

/**
 * Money is in. Sets the status only, deliberately moving no card.
 *
 * By the time a capture clears, the provider has approved and the board has
 * already carried the card on to Approved or beyond. Writing a stage here would
 * drag it backwards out of the clinical column it belongs in, so this touches
 * nothing but the field the revenue reports actually read.
 *
 * Never throws: the money has already moved, and a CRM hiccup must not look
 * like a failed capture to whatever called this.
 */
export async function markOpportunityWon(opportunityId) {
  if (!opportunityId) return null;
  try {
    const data = await ghlFetch(`/opportunities/${opportunityId}`, {
      method: "PUT",
      body: { status: "won" },
    });
    return data?.opportunity || null;
  } catch (e) {
    console.error("GHL mark-won failed:", e.message, e.details ?? "");
    return null;
  }
}

/* A card that was declined.
 *
 * The counterpart to markOpportunityPaid, and the one board write that
 * deliberately leaves `status` alone. Status is what every GHL revenue and
 * conversion report reads, and a declined card is neither: it was never won,
 * and it isn't lost while the patient can still reach for another card. The
 * "open" it was created with is already the right answer. Writing it would also
 * risk clobbering a "won" when a late failure event for an earlier attempt
 * lands after the successful one.
 *
 * Nothing moves a card back out of here: a later success calls
 * markOpportunityPaid, which moves it to Paid, exactly as that path clears the
 * payment-failed tag.
 *
 * Never throws, same reasoning as markOpportunityLost below: losing the board
 * write must not cost the tag that records the same decline.
 */
const FAILED_STAGE_NAME = process.env.GHL_FAILED_STAGE_NAME || "Payment Failed";

export async function markOpportunityFailed(opportunityId) {
  if (!opportunityId) return null;
  try {
    const { stages, pipelineName } = await resolvePipeline();
    const failed = stages.find((s) => s.name?.toLowerCase() === FAILED_STAGE_NAME.toLowerCase());
    if (!failed) {
      console.warn(
        `GHL pipeline "${pipelineName}" has no "${FAILED_STAGE_NAME}" stage, so the declined card keeps its column and only the tag records it.`
      );
      return null;
    }

    const data = await ghlFetch(`/opportunities/${opportunityId}`, {
      method: "PUT",
      body: { pipelineStageId: failed.id },
    });
    return data?.opportunity || null;
  } catch (e) {
    console.error("GHL mark-failed failed:", e.message, e.details ?? "");
    return null;
  }
}

/* A visit that ended without treatment.
 *
 * Deliberately not moveOpportunityForward: that one is forward-only, and an exit
 * is not a step along the board. A cancelled case ends the visit wherever it had
 * reached, including past Paid.
 *
 * The status matters more than the column here. Every revenue and conversion
 * report in GHL reads status alone, so a cancelled visit left as "won" keeps
 * counting money the patient was never charged for, or was refunded. The column
 * is set too when it exists, because that is where staff look.
 *
 * Never throws, same reasoning as moveOpportunityForward: losing the board write
 * must not cost the status field, the tag or MDI's delivery.
 */
const DENIED_STAGE_NAME = process.env.GHL_DENIED_STAGE_NAME || "Denied";

export async function markOpportunityLost(opportunityId) {
  if (!opportunityId) return null;
  try {
    const { stages, pipelineName } = await resolvePipeline();
    const denied = stages.find((s) => s.name?.toLowerCase() === DENIED_STAGE_NAME.toLowerCase());
    if (!denied) {
      console.warn(
        `GHL pipeline "${pipelineName}" has no "${DENIED_STAGE_NAME}" stage, so the card keeps its column and only its status is set.`
      );
    }

    const data = await ghlFetch(`/opportunities/${opportunityId}`, {
      method: "PUT",
      body: { status: "lost", ...(denied && { pipelineStageId: denied.id }) },
    });
    return data?.opportunity || null;
  } catch (e) {
    console.error("GHL mark-lost failed:", e.message, e.details ?? "");
    return null;
  }
}

/** The board in display order, for the staff dashboard's funnel. */
export async function pipelineBoard() {
  const { pipelineId, stages, pipelineName } = await resolvePipeline();
  const ordered = stages
    .map((s, i) => ({ id: s.id, name: s.name, order: typeof s.position === "number" ? s.position : i }))
    .sort((a, b) => a.order - b.order);
  return { pipelineId, pipelineName, stages: ordered };
}

/* Every opportunity on one pipeline, for counting.

   Deliberately paged and counted locally rather than asking GHL for a count per
   stage: that would mean one request per column and betting on the exact spelling
   of its filter parameters. At ~120 records this is two requests and no guesswork.
   PAGE_CAP keeps a runaway location from turning a dashboard load into hundreds
   of calls. */
const OPPORTUNITY_PAGE = 100;
const PAGE_CAP = 20;

export async function listOpportunities(pipelineId) {
  if (!pipelineId) return [];
  const all = [];
  let path =
    `/opportunities/search?location_id=${LOCATION_ID}` +
    `&pipeline_id=${encodeURIComponent(pipelineId)}&limit=${OPPORTUNITY_PAGE}`;

  for (let page = 0; page < PAGE_CAP && path; page++) {
    const data = await ghlFetch(path);
    all.push(...(data?.opportunities || []));
    const next = data?.meta?.nextPageUrl;
    // nextPageUrl is absolute; ghlFetch wants a path.
    path = next && all.length < (data?.meta?.total ?? 0) ? next.replace(BASE, "") : null;
  }
  return all;
}

/* Field ids, not keys, because searching demands ids: a filter written as
   `customFields.<key>` is rejected with a 422. They're hardcoded like
   TREATMENT_FIELD_ID above because GET /locations/:id/customFields answers 401
   for this token, so they can't be resolved at runtime. Both were identified by
   asking MDI which uuid was a patient and which was a case. */
export const SEARCH_FIELD_ID = {
  MDI_PATIENT_ID: process.env.GHL_PATIENT_FIELD_ID || "7MvQaZ3R3i8ShJPSqjnF",
  LATEST_MDI_ENCOUNTER_ID: process.env.GHL_ENCOUNTER_FIELD_ID || "A78uoI08lkh2tbbQjYMU",
  /* Read, not searched: /contacts/search returns customFields on each hit, so
     the webhook can see the status it is about to overwrite without a second
     call. */
  MDI_ENCOUNTER_STATUS: process.env.GHL_STATUS_FIELD_ID || "ppPP4OXU4nNjBpbYLg1c",
  /* The encounter recorded on an OPPORTUNITY, which is how a case is matched to
     the one card that belongs to it. `/opportunities/search` returns each
     card's customFields, so this needs no extra call. Distinct from
     LATEST_MDI_ENCOUNTER_ID, which lives on the contact and holds only the most
     recent visit. */
  OPPORTUNITY_ENCOUNTER_ID:
    process.env.GHL_OPPORTUNITY_ENCOUNTER_FIELD_ID || "zITnI6V21UiTywG4QHD5",
  /* The Stripe customer holding the saved card, read when a renewal needs
     something to charge. Hand-copied like the four above, for the same reason:
     the token is refused the customFields scope outright, so nothing here can
     be looked up by name at runtime. Read back on 2026-10-05 by writing a
     sentinel into the field on a test contact and matching the value to the id
     GHL returned beside it.

     The plan's own fields used to sit here too and moved to OPP_FIELD on
     2026-10-06. See the note on FIELD.STRIPE_CUSTOMER. */
  STRIPE_CUSTOMER: process.env.GHL_STRIPE_CUSTOMER_FIELD_ID || "KRIAYZNPph7M1qyFdI7F",
};

/** The value of one custom field on a record GHL returned, or "". */
export const fieldValueOf = (record, fieldId) => {
  const f = (record?.customFields || []).find((x) => x.id === fieldId);
  return String(f?.fieldValueString ?? f?.fieldValue ?? f?.value ?? "");
};

/** The one contact carrying this value in the given custom field, or null. */
export async function findContactByCustomField(fieldId, value) {
  if (!fieldId || !value) return null;
  const data = await ghlFetch("/contacts/search", {
    method: "POST",
    body: {
      locationId: LOCATION_ID,
      pageLimit: 2,
      filters: [{ field: `customFields.${fieldId}`, operator: "eq", value }],
    },
  });
  return (data?.contacts || [])[0] || null;
}

/** One contact by id, or null. Never throws. */
export async function contactById(contactId) {
  if (!contactId) return null;
  try {
    const data = await ghlFetch(`/contacts/${encodeURIComponent(contactId)}`);
    return data?.contact || null;
  } catch (e) {
    console.warn(`GHL contact ${contactId} could not be read:`, e.message);
    return null;
  }
}

/* The card carrying this MDI encounter, found by scanning rather than filtering.
   /opportunities/search takes no customFields filter, so this reads a page of
   cards and looks at the field itself.

   Worth the scan because it is the last resort and the only durable link there
   is. The contact's mdi_patient_id and latest_mdi_encounter_id each hold ONE
   value and get overwritten: on 2026-09-26 a later test reused a contact (GHL
   upsert matches on phone as well as email) and replaced both, so an approved
   case could no longer be traced to its patient and the card never moved. The
   encounter on the card is written once, at intake, and never changes.

   Newest first and capped: this runs on a miss, and a webhook has 15 seconds.
   A case older than the cap can't be found this way, which is a bounded loss
   against an unbounded scan. */
const ENCOUNTER_SCAN_LIMIT = 100;

export async function opportunityForEncounter(caseId) {
  if (!caseId) return null;
  try {
    const data = await ghlFetch(
      `/opportunities/search?location_id=${LOCATION_ID}&limit=${ENCOUNTER_SCAN_LIMIT}`
    );
    const opps = data?.opportunities || [];
    const hit = opps.find(
      (o) => fieldValueOf(o, SEARCH_FIELD_ID.OPPORTUNITY_ENCOUNTER_ID) === caseId
    );
    if (!hit) {
      console.warn(`No card carries encounter ${caseId} in the newest ${opps.length} scanned`);
      return null;
    }
    return { id: hit.id, contactId: hit.contact?.id || hit.contactId || null };
  } catch (e) {
    console.warn(`GHL opportunity scan for ${caseId} failed:`, e.message);
    return null;
  }
}

/* Every opportunity belonging to one contact, newest first. `contact_id` is
   snake_case on this endpoint; `contactId` is rejected with a 422. */
export async function opportunitiesForContact(contactId) {
  if (!contactId) return [];
  const data = await ghlFetch(
    `/opportunities/search?location_id=${LOCATION_ID}` +
      `&contact_id=${encodeURIComponent(contactId)}&limit=50`
  );
  return (data?.opportunities || []).sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
}

/* ---- multi-month plans, one per OPPORTUNITY ----
 *
 * A plan used to live on the contact: one plan_months, one plan_product, one
 * set of counts, one renewal switch. That only works while a patient holds one
 * plan. The moment they buy a second treatment, recordPlan overwrote the first,
 * and a patient on a 3 month semaglutide plan with two months left who bought
 * tirzepatide silently lost those two prepaid months. Found 2026-10-06.
 *
 * So a plan now lives on the opportunity it was bought on. Each treatment
 * carries its own term, counts, renewal date and renewal switch, which also
 * gives the patient what the client asked for: renewal turned off per treatment
 * rather than all or nothing.
 *
 * The one thing that stays on the CONTACT is stripe_customer. A patient has one
 * saved card, not one per plan.
 */

/* Keys for the OPPORTUNITY copies. Deliberately the same names as the contact
   fields they replace, because they mean the same thing; GHL scopes custom
   fields per object, so there is no clash. */
export const OPP_FIELD = {
  PLAN_MONTHS: "plan_months",
  PLAN_PRODUCT: "plan_product",
  FILLS_CLAIMED: "fills_claimed",
  FILLS_USED: "fills_used",
  NEXT_INTAKE_DUE: "next_intake_due",
  AUTO_RENEW: "auto_renew",
  RENEWS_ON: "renews_on",
};

/* Ids, for reading them back. Blank until the fields exist, and every read
   below returns "no plan" rather than a half-built one while they are. The
   token is refused the customFields scope, so these are copied in by hand the
   same way every other id in this file is. */
export const OPP_FIELD_ID = {
  PLAN_MONTHS: process.env.GHL_OPP_PLAN_MONTHS_FIELD_ID || "YQScrqs9GcKyIE3x8u6r",
  PLAN_PRODUCT: process.env.GHL_OPP_PLAN_PRODUCT_FIELD_ID || "MbzPwY224q0SjQT8pTjG",
  FILLS_CLAIMED: process.env.GHL_OPP_FILLS_CLAIMED_FIELD_ID || "bKKlaHoOI4Inc6E3tqBN",
  FILLS_USED: process.env.GHL_OPP_FILLS_USED_FIELD_ID || "8pJNGW7pEDoZBpMh8U5K",
  NEXT_INTAKE_DUE: process.env.GHL_OPP_NEXT_INTAKE_DUE_FIELD_ID || "LuzOKaPgu6KHIGHqN8rA",
  AUTO_RENEW: process.env.GHL_OPP_AUTO_RENEW_FIELD_ID || "aYW3423UK4NZ58FOHieo",
  RENEWS_ON: process.env.GHL_OPP_RENEWS_ON_FIELD_ID || "2eoypg0KTKlYXfooc7L5",
};

export const oppPlansEnabled = () => Boolean(OPP_FIELD_ID.PLAN_MONTHS);

/* One opportunity, by id. Never throws.
 *
 * A DIRECT GET, deliberately, not /opportunities/search. Search is indexed and
 * lags: a custom field written a moment earlier comes back missing from a
 * search while a GET on the card has it. That cost an hour on 2026-10-06, when
 * seven freshly written fields read as empty and looked like a failed write.
 * Anything that has just been written must be read this way. */
export async function opportunityById(opportunityId) {
  if (!opportunityId) return null;
  try {
    const data = await ghlFetch(`/opportunities/${encodeURIComponent(opportunityId)}`);
    return data?.opportunity || null;
  } catch (e) {
    console.warn(`GHL opportunity ${opportunityId} could not be read:`, e.message);
    return null;
  }
}

/* The plan recorded on an opportunity GHL already handed us, or null.
 *
 * Synchronous on purpose: /opportunities/search returns customFields on every
 * card, so a patient's whole set of plans costs one call rather than one per
 * plan. */
export function planOn(opportunity) {
  if (!opportunity?.id || !OPP_FIELD_ID.PLAN_MONTHS) return null;
  const months = Number(fieldValueOf(opportunity, OPP_FIELD_ID.PLAN_MONTHS)) || 0;
  if (months < 1) return null;

  const num = (key) => Number(fieldValueOf(opportunity, OPP_FIELD_ID[key])) || 0;
  const day = (key) => {
    const v = OPP_FIELD_ID[key] ? fieldValueOf(opportunity, OPP_FIELD_ID[key]) : "";
    return v ? String(v).slice(0, 10) : null;
  };
  const used = num("FILLS_USED");
  /* At least one: the month they bought was handed to them by the purchase. A
     plan recorded before fills_claimed existed reads as 1, which is right. */
  const claimed = Math.max(1, num("FILLS_CLAIMED"));
  const renewRaw = OPP_FIELD_ID.AUTO_RENEW
    ? fieldValueOf(opportunity, OPP_FIELD_ID.AUTO_RENEW)
    : "";

  return {
    opportunityId: opportunity.id,
    /* Carried because every write back to an opportunity has to resend its
       name: GHL treats it as required on a PUT. */
    name: opportunity.name || "",
    months,
    productId: num("PLAN_PRODUCT") || null,
    claimed,
    used,
    remaining: Math.max(0, months - used),
    /* The month they are ON, which is the one they would recognise. One before
       anything has shipped, not zero. */
    current: Math.min(months, used + 1),
    nextDue: day("NEXT_INTAKE_DUE"),
    autoRenew: Number(renewRaw) === 1,
    renewsOn: day("RENEWS_ON"),
  };
}

/* Every card on a contact, read FRESH, newest first.
 *
 * /opportunities/search hands back the seven plan fields EMPTY. On 2026-10-06 a
 * patient holding two live plans came back from search with plan_months,
 * plan_product, fills_claimed, auto_renew and renews_on all blank, while a GET
 * on each of those same cards had 3, 1, 1, 1 and a renewal date. The older
 * fields on the same cards (intake stage, product line, the MDI case id) do
 * come back populated, so this is not a lag that clears on its own, it is the
 * shape of the search payload. Search is used for the ids and nothing else.
 *
 * Bounded and parallel: a patient holds a handful of cards, and this sits
 * behind a portal screen. */
async function freshCardsFor(contactId, limit = 12) {
  const cards = await opportunitiesForContact(contactId);
  const read = await Promise.all(cards.slice(0, limit).map((c) => opportunityById(c.id)));
  return read.filter(Boolean);
}

/* Every plan a patient holds, newest first.
 *
 * A card without plan_months is an ordinary visit, which is most of them. */
export async function plansFor(contactId) {
  if (!contactId || !OPP_FIELD_ID.PLAN_MONTHS) return [];
  try {
    const cards = await freshCardsFor(contactId);
    return cards.map(planOn).filter(Boolean);
  } catch (e) {
    console.warn(`GHL plans read failed for ${contactId}:`, e.message);
    return [];
  }
}

/** The plan on this product's ladder, or null. */
export async function planForProduct(contactId, productId) {
  const want = Number(productId);
  if (!want) return null;
  const plans = await plansFor(contactId);
  return (
    plans.find((p) => p.productId && ladderFor(p.productId).includes(want)) || null
  );
}

/* The term a payment bought, recorded on the card it was bought on.
 *
 * Both counts are reset here, not left alone, so buying a fresh term on the
 * same card starts it over. fills_claimed starts at 1: the month they just
 * bought is the first one they have been given. Never throws. */
export async function recordPlan(opportunityId, months, productId, { name } = {}) {
  const term = Number(months);
  const pid = Number(productId);
  if (!opportunityId || !Number.isInteger(term) || term < 1) return null;
  if (!oppPlansEnabled()) {
    console.warn(
      `GHL opportunity plan fields are not configured, so the ${term} month plan on ` +
        `${opportunityId} was not recorded. Set GHL_OPP_PLAN_MONTHS_FIELD_ID.`
    );
    return null;
  }
  try {
    await updateOpportunityFields(
      opportunityId,
      {
        [OPP_FIELD.PLAN_MONTHS]: term,
        ...(Number.isInteger(pid) && pid > 0 && { [OPP_FIELD.PLAN_PRODUCT]: pid }),
        [OPP_FIELD.FILLS_CLAIMED]: 1,
        [OPP_FIELD.FILLS_USED]: 0,
      },
      { name: name || (await opportunityById(opportunityId))?.name }
    );
    console.info(
      `GHL opportunity ${opportunityId}: plan of ${term} month(s) on product ${pid || "?"} recorded`
    );
    return term;
  } catch (e) {
    console.error(`GHL plan write failed for opportunity ${opportunityId}:`, e.message);
    return null;
  }
}

/** One more month handed out. Never throws. @returns the new count, or null. */
export async function claimFill(opportunityId, claimed, { name } = {}) {
  const n = Number(claimed);
  if (!opportunityId || !Number.isInteger(n) || n < 1 || !oppPlansEnabled()) return null;
  try {
    await updateOpportunityFields(
      opportunityId,
      { [OPP_FIELD.FILLS_CLAIMED]: n },
      { name: name || (await opportunityById(opportunityId))?.name }
    );
    console.info(`GHL opportunity ${opportunityId}: ${n} fill(s) claimed`);
    return n;
  } catch (e) {
    console.error(`GHL claim write failed for opportunity ${opportunityId}:`, e.message);
    return null;
  }
}

/* ---- automatic renewal, per plan ----
 *
 * Per plan rather than per patient, which is the client's rule (2026-10-06): a
 * patient on two treatments can renew one and stop the other.
 *
 * Deliberately NOT a Stripe Subscription. A subscription charges on its own
 * schedule whatever else is going on, and the rule is that a renewal must not
 * charge while a prescription is inactive, a provider review is outstanding,
 * the patient has cancelled, or the account is on hold. Running the charge
 * ourselves is the only way those four can be honoured. */

/** Switches a plan's renewal on and sets the day it next charges. Never throws. */
export async function setRenewal(opportunityId, { on = true, renewsOn, name } = {}) {
  if (!opportunityId || !oppPlansEnabled()) return null;
  const day = renewsOn instanceof Date ? dueDate(renewsOn) : clean(renewsOn);
  try {
    await updateOpportunityFields(
      opportunityId,
      {
        [OPP_FIELD.AUTO_RENEW]: on ? 1 : 0,
        ...(day && { [OPP_FIELD.RENEWS_ON]: day }),
      },
      { name: name || (await opportunityById(opportunityId))?.name }
    );
    console.info(
      `GHL opportunity ${opportunityId}: renewal ${on ? "on" : "off"}${day ? `, next ${day}` : ""}`
    );
    return true;
  } catch (e) {
    console.error(`GHL renewal write failed for opportunity ${opportunityId}:`, e.message);
    return null;
  }
}

/* Renewal begins when a provider approves, which is the client's rule: a
 * patient is only an active subscriber once they have actually been prescribed.
 *
 * Takes the card the approval landed on, which is the one the capture already
 * knows. A card with no plan on it is an ordinary visit and is left alone.
 * Never throws. */
export async function startRenewal(opportunityId) {
  if (!opportunityId || !oppPlansEnabled()) return null;
  try {
    const card = await opportunityById(opportunityId);
    const plan = planOn(card);
    if (!plan) return null;
    /* Already switched off by the patient, so approving a month they had
       already paid for must not switch it back on. */
    if (!plan.autoRenew && fieldValueOf(card, OPP_FIELD_ID.AUTO_RENEW) !== "") {
      console.info(`GHL opportunity ${opportunityId}: renewal stays off, the patient turned it off`);
      return null;
    }
    const at = renewalDate(new Date(), plan.months);
    if (!at) return null;
    return setRenewal(opportunityId, { on: true, renewsOn: at, name: plan.name });
  } catch (e) {
    console.error(`GHL renewal start failed for opportunity ${opportunityId}:`, e.message);
    return null;
  }
}

/* The patient turning one plan's renewal off.
 *
 * Only the switch is written. The date is left exactly where it is, because the
 * client's rule is that cancelling stops FUTURE billing and leaves the period
 * already paid for alone: a patient who cancels still has the months they
 * bought, and staff can still see when the renewal would have fallen.
 *
 * Throws on failure, unlike everything else here. This one is a button the
 * patient pressed and is waiting on, so a silent failure would tell them their
 * renewal was cancelled when it was not. */
export async function cancelRenewal(opportunityId, { name } = {}) {
  if (!opportunityId) throw new Error("cancelRenewal needs an opportunity id");
  if (!oppPlansEnabled()) throw new Error("opportunity plan fields are not configured");
  await updateOpportunityFields(
    opportunityId,
    { [OPP_FIELD.AUTO_RENEW]: 0 },
    { name: name || (await opportunityById(opportunityId))?.name }
  );
  console.info(`GHL opportunity ${opportunityId}: renewal cancelled by the patient`);
  return true;
}

/* The Stripe customer holding this patient's saved card.
 *
 * On the contact, not the plan: a patient has one card, however many plans they
 * hold. The only piece of plan machinery that did not move. */
/* The saved card's Stripe customer, off a contact ALREADY in hand.
 *
 * findContactByCustomField returns the whole contact, customFields and all, so
 * asking GoHighLevel for it a second time by id is a round trip for data we are
 * holding. That was a third of a second on every portal plan read, measured
 * 2026-10-07 while chasing the client's report that the portal took ten
 * seconds. Prefer this; the async version below is for callers that only have
 * an id. */
export const stripeCustomerOn = (contact) =>
  (contact && SEARCH_FIELD_ID.STRIPE_CUSTOMER
    ? fieldValueOf(contact, SEARCH_FIELD_ID.STRIPE_CUSTOMER)
    : "") || null;

export async function stripeCustomerOf(contactId) {
  if (!contactId || !SEARCH_FIELD_ID.STRIPE_CUSTOMER) return null;
  try {
    const contact = await contactById(contactId);
    return fieldValueOf(contact, SEARCH_FIELD_ID.STRIPE_CUSTOMER) || null;
  } catch (e) {
    console.warn(`GHL stripe_customer read failed for ${contactId}:`, e.message);
    return null;
  }
}

const SHIPPED_STAGE_NAME = process.env.GHL_SHIPPED_STAGE_NAME || "Shipped";

/* A fill has shipped, so the plan it belongs to moves on.
 *
 * Which plan is decided by the LADDER: the shipped card names a product, and
 * the plan whose ladder contains that product is the one that fill belongs to.
 * That is what lets a patient hold two plans without one treatment's delivery
 * spending the other's months.
 *
 * fills_used is COUNTED from the board, not incremented. MDI repeats its
 * webhook events, so `order_status_changed: shipped` arriving twice for one
 * order would add two to a counter and tell a 3 month patient they had used two
 * thirds of a plan after a single delivery. Counting the cards that actually
 * reached Shipped cannot drift however many times the event lands, and it also
 * self-corrects if someone moves a card by hand.
 *
 * next_intake_due is set only while a month is still owed. The last fill leaves
 * it alone, which keeps the GoHighLevel side down to one trigger and one email:
 * the date only ever arrives when there really is another intake to do.
 *
 * Never throws: a shipped notification must not fail over a counter. */
export async function recordFillShipped(contactId, { shippedAt = new Date(), productId } = {}) {
  if (!contactId || !oppPlansEnabled()) return null;
  try {
    /* Fresh, not searched. A shipment counted off a searched card would read
       every counter as zero and quietly stop the ladder. */
    const cards = await freshCardsFor(contactId);
    const plans = cards.map(planOn).filter(Boolean);
    if (!plans.length) return null;

    /* The plan this shipment belongs to. Named by the caller when it knows the
       product, otherwise the only plan they hold. A patient with two plans and
       no product to go on is not guessed at. */
    const plan = productId
      ? plans.find((p) => p.productId && ladderFor(p.productId).includes(Number(productId)))
      : plans.length === 1
        ? plans[0]
        : null;
    if (!plan) {
      console.warn(
        `GHL contact ${contactId}: a fill shipped but no plan matches product ${productId || "?"}, ` +
          `so nothing was counted (${plans.length} plan(s) held)`
      );
      return null;
    }
    if (!plan.productId) {
      console.warn(
        `GHL opportunity ${plan.opportunityId} is a plan with no plan_product, so a shipped ` +
          `fill cannot be matched to it.`
      );
      return null;
    }

    const { stages } = await resolvePipeline();
    const ordered = stages
      .map((s, i) => ({ ...s, order: typeof s.position === "number" ? s.position : i }))
      .sort((a, b) => a.order - b.order);
    const shippedIndex = ordered.findIndex(
      (s) => s.name?.toLowerCase() === SHIPPED_STAGE_NAME.toLowerCase()
    );
    if (shippedIndex === -1) {
      console.error(`GHL pipeline has no "${SHIPPED_STAGE_NAME}" column, so fills cannot be counted`);
      return null;
    }

    /* Only cards on this plan's own ladder count. The ladder gives the exact
       product names to look for, and a card is named "{category} - {product}"
       by both this module and the browser, so the comparison is exact. */
    const ours = new Set(
      ladderFor(plan.productId)
        .map((id) => PRICES[String(id)])
        .filter(Boolean)
        .map((p) => [p.categoryName, p.name].filter(Boolean).join(" - "))
    );
    const positionOf = new Map(ordered.map((s, i) => [s.id, i]));
    let used = cards.filter(
      (c) =>
        ours.has(String(c.name || "").trim()) &&
        (positionOf.get(c.pipelineStageId) ?? -1) >= shippedIndex
    ).length;
    if (used === 0) used = 1; // the card driving this event, if the board lags

    const remaining = Math.max(0, plan.months - used);
    const due = remaining > 0 ? nextIntakeDue(shippedAt) : null;
    await updateOpportunityFields(
      plan.opportunityId,
      {
        [OPP_FIELD.FILLS_USED]: used,
        ...(due && { [OPP_FIELD.NEXT_INTAKE_DUE]: dueDate(due) }),
      },
      { name: plan.name }
    );
    console.info(
      `GHL opportunity ${plan.opportunityId}: fill ${used} of ${plan.months} shipped` +
        (due ? `, next intake due ${dueDate(due)}` : ", plan complete, no reminder set")
    );
    return { used, planMonths: plan.months, remaining, opportunityId: plan.opportunityId };
  } catch (e) {
    console.error(`GHL fill count failed for ${contactId}:`, e.message);
    return null;
  }
}

/* What a visit was worth, written after the fact.
 *
 * A card is opened before the patient has chosen how many months they want, so
 * it is created with the single month price off the catalogue. On a 3 month plan
 * that is a third of what they actually paid, and since the opportunity's
 * monetaryValue is what GoHighLevel reports as revenue, every plan would read
 * low for ever. Called once the payment is known.
 *
 * The real catalogue total, never the test override: the board is a business
 * record, and $0.50 test runs should not show up on it as the price of a
 * treatment.
 *
 * Never throws. The money has already moved by the time this runs. */
export async function setOpportunityValue(opportunityId, value) {
  const amount = Number(value);
  if (!opportunityId || !Number.isFinite(amount) || amount < 0) return null;
  try {
    const data = await ghlFetch(`/opportunities/${opportunityId}`, {
      method: "PUT",
      body: { monetaryValue: amount },
    });
    return data?.opportunity || null;
  } catch (e) {
    console.error(`GHL value write failed for opportunity ${opportunityId}:`, e.message);
    return null;
  }
}


/* Board columns the intake moves a visit through. Names rather than ids, like
   Paid: they're resolved against the live pipeline, so renaming a column in GHL
   only needs the matching env var. */
export const STAGE = {
  INTAKE_STARTED: process.env.GHL_INTAKE_STARTED_STAGE_NAME || "Intake Started",
  INTAKE_SUBMITTED: process.env.GHL_INTAKE_SUBMITTED_STAGE_NAME || "Intake Submitted",
};

/* Forward only. The intake's events don't arrive in board order: a new patient
 * pays at the ID screen and submits afterwards, so a plain move to Intake
 * Submitted would drag an already-Paid card back down the board. The code moves
 * cards itself because tag-triggered workflows can't: a tag a returning
 * contact already carries never re-fires, so their new card never moved.
 *
 * Never throws. A missing column or a GHL hiccup should cost the board move,
 * not the rest of the CRM write, and never the patient's intake. */
export async function moveOpportunityForward(opportunityId, stageName) {
  if (!opportunityId || !stageName) return null;
  try {
    const { stages, pipelineName } = await resolvePipeline();
    // Board order: GHL sends a position per stage; array order is the fallback.
    const ordered = stages
      .map((s, i) => ({ ...s, order: typeof s.position === "number" ? s.position : i }))
      .sort((a, b) => a.order - b.order);

    const targetIndex = ordered.findIndex((s) => s.name?.toLowerCase() === stageName.toLowerCase());
    if (targetIndex === -1) {
      console.warn(`GHL pipeline "${pipelineName}" has no "${stageName}" stage, card not moved.`);
      return null;
    }

    const current = (await ghlFetch(`/opportunities/${opportunityId}`))?.opportunity;
    const currentIndex = ordered.findIndex((s) => s.id === current?.pipelineStageId);
    /* Backwards is the only thing forbidden. A won card may still move forward:
       on this board Paid sits after Approved, but patients pay during intake and
       a clinician reviews days later, so almost every card is already Paid (and
       won) by the time the provider decision arrives. Refusing to move won cards
       left Pharmacy Processing, Shipped and Completed permanently empty for the
       cards that actually get that far. Moving the stage doesn't touch `status`,
       so won revenue stays won. */
    if (currentIndex >= targetIndex) return null;

    const data = await ghlFetch(`/opportunities/${opportunityId}`, {
      method: "PUT",
      body: { pipelineStageId: ordered[targetIndex].id },
    });
    return data?.opportunity || null;
  } catch (e) {
    console.error(`GHL move to "${stageName}" failed for opportunity ${opportunityId}:`, e.message, e.details ?? "");
    return null;
  }
}

/* One opportunity per visit, hanging off the single patient contact — this is
 * how repeat visits stay individually trackable without duplicating the person.
 * Deliberately separate from upsertContact: a patient who books twice is one
 * contact and two opportunities. */
export async function createVisitOpportunity({ contactId, treatment, value, source, kioskLocation, mdiEncounterId, productLine, intakeStage } = {}) {
  const name = clean(treatment);
  if (!contactId || !name) return null;

  const { pipelineId, stageId } = await resolvePipeline();
  const amount = Number(value) > 0 ? { monetaryValue: Number(value) } : null;
  /* The opportunity's product_line is deliberately unvalidated, unlike the
     contact's. This one is a text field, so it records the category verbatim
     and keeps categories the contact dropdown has no option for. It is also
     the per-visit truth: the contact's copy only ever holds the newest visit,
     so counting product lines has to happen here. */
  const fields = customFieldList({
    [FIELD.KIOSK_LOCATION]: kioskLocation,
    [FIELD.MDI_ENCOUNTER_ID]: mdiEncounterId,
    [FIELD.PRODUCT_LINE]: productLine,
    [FIELD.INTAKE_STAGE]: intakeStage,
  });
  const custom = fields.length ? { customFields: fields } : null;

  try {
    const data = await ghlFetch("/opportunities/", {
      method: "POST",
      body: {
        locationId: LOCATION_ID,
        contactId,
        pipelineId,
        pipelineStageId: stageId,
        name,
        status: "open",
        ...amount,
        ...custom,
        ...(clean(source) && { source: clean(source) }),
      },
    });
    return { opportunity: data?.opportunity || null, created: true };
  } catch (e) {
    // Unless the location allows duplicates, GHL caps a contact at one
    // opportunity per pipeline — regardless of status, so closing the old one
    // doesn't help. Rather than drop the visit, roll the existing record
    // forward to the new treatment. Per-visit history still survives in the
    // contact's Treatment list and its notes timeline.
    const existingId = e.details?.meta?.existingId;
    if (e.details?.code !== "OPPORTUNITY_NO_DUPLICATE" || !existingId) throw e;

    // Roll the placement forward too: this record now represents the newer
    // visit, and that visit came from wherever this scan did.
    const data = await ghlFetch(`/opportunities/${existingId}`, {
      method: "PUT",
      body: { name, ...amount, ...custom, ...(clean(source) && { source: clean(source) }) },
    });
    return { opportunity: data?.opportunity || null, created: false };
  }
}

export async function addContactNote(contactId, note) {
  const body = clean(note);
  if (!contactId || !body) return null;
  return ghlFetch(`/contacts/${contactId}/notes`, { method: "POST", body: { body } });
}
