import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate, Navigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Lock, CreditCard, CheckCircle2, ShieldCheck } from "lucide-react";
import { productsData } from "../components/data/products";
import { treatmentLabel } from "../lib/ghl";
import { readScanSource, sourceLabel } from "../lib/kioskLocations";
import Seo from "../components/Seo";

const MDI_ORIGIN = "https://patient.novamdk.com";
const PAYMENT_TRIGGER_EVENTS = ["finish"];
const PAYMENT_TRIGGER_STEPS = ["identification", "thank-you"];

/* ------------------------------- checkout -------------------------------- */
/* PayTechTrust is an NMI white-label. Collect.js renders the three card fields
 * as iframes served by the gateway, so the number, expiry and CVC never enter
 * this page's DOM — we only ever handle the single-use token it hands back.
 * This key is public by design: it can tokenize a card but not charge one. The
 * key that can charge lives server side as NMI_SECURITY_KEY. */
const TOKENIZATION_KEY = import.meta.env.VITE_NMI_TOKENIZATION_KEY;
const COLLECT_SRC = "https://paytechtrust.transactiongateway.com/token/Collect.js";

const CARD_FIELD_CSS = {
  width: "100%",
  height: "46px",
  padding: "0 14px",
  "box-sizing": "border-box",
  border: "1px solid #cfd8d3",
  "border-radius": "12px",
  background: "#fff",
  color: "#1a2420",
  "font-size": "15px",
  "font-family": "inherit",
};

/* Matches CARD_FIELD_CSS above so our two inputs sit level with the gateway's
   three iframes. */
const CARD_INPUT =
  "h-11.5 w-full rounded-xl border border-line-strong bg-surface px-3.5 text-[0.94rem] text-ink placeholder:text-muted focus:border-primary focus:outline-none";

let collectPromise = null;
function loadCollectJs() {
  if (collectPromise) return collectPromise;
  collectPromise = new Promise((resolve, reject) => {
    if (window.CollectJS) return resolve(window.CollectJS);
    const s = document.createElement("script");
    s.src = COLLECT_SRC;
    s.async = true;
    // Collect.js reads its key off its own script tag as it boots, so this has
    // to be set before the element is appended.
    s.dataset.tokenizationKey = TOKENIZATION_KEY;
    s.onload = () =>
      window.CollectJS ? resolve(window.CollectJS) : reject(new Error("loaded without CollectJS"));
    s.onerror = () => {
      collectPromise = null; // let a later attempt retry rather than latching the failure
      reject(new Error("script blocked or offline"));
    };
    document.head.appendChild(s);
  });
  return collectPromise;
}

const stored = (key) => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null; // private mode
  }
};

/* The hand-off banks the contact id only once GHL answers, and that round trip
   is several API calls long. MDI can be showing the first question before it
   lands, which used to drop the milestone outright. Waiting briefly is what
   makes the tag dependable rather than a race against the questionnaire. */
const CONTACT_WAIT_MS = 8000;
const CONTACT_POLL_MS = 300;

async function contactIdSoon() {
  const deadline = Date.now() + CONTACT_WAIT_MS;
  for (;;) {
    const id = stored("ghl_contact");
    if (id) return id;
    if (Date.now() >= deadline) return null;
    await new Promise((resolve) => setTimeout(resolve, CONTACT_POLL_MS));
  }
}

/* Fire-and-forget: a CRM write must never surface to the patient mid-intake,
   so a failure is logged and the questionnaire carries on regardless.
   Resolves false when nothing was sent, which lets the caller un-latch and try
   again on MDI's next event. */
async function recordMilestone(milestone, { treatment } = {}) {
  const contactId = await contactIdSoon();
  if (!contactId) {
    console.error(`GHL milestone "${milestone}" skipped: no contact id after ${CONTACT_WAIT_MS}ms`);
    return false;
  }

  try {
    await fetch("/api/ghl-journey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contact_id: contactId,
        // Carries the stage onto this visit's own record, which is what
        // survives the patient coming back for something else later.
        opportunity_id: stored("ghl_opportunity"),
        treatment,
        milestone,
        release_token: stored("mdi_release_token"),
      }),
    });
    return true;
  } catch (e) {
    console.error(`GHL milestone "${milestone}" failed:`, e.message);
    return false;
  }
}

/* The event payload's shape came from reading MDI's shipped bundle rather than
   their documentation, so the status is read defensively: whichever of these
   they happen to send, or none at all. */
const statusOf = (data) =>
  data?.case_status?.name || data?.status || data?.encounter_status || null;

/* Same fire-and-forget contract as the milestones above. The encounter ids are
   for the CRM's benefit alone, so a patient mid-questionnaire must never see a
   failure to record them. */
function recordEncounter({ encounterId, status, additional, treatment, value, productLine }) {
  const contactId = stored("ghl_contact");
  // No contact means the hand-off never wrote one, and there is nothing in the
  // CRM for this encounter to hang off. Unlike the milestone above this needs
  // no wait: submitting a questionnaire takes minutes, so the contact has long
  // since landed by the time MDI gets here.
  if (!contactId) return;

  // Only needed if this encounter has to open its own opportunity, but it costs
  // nothing to send and keeps the kiosk funnel intact when it does.
  const scannedFrom = readScanSource();
  const originLabel = scannedFrom ? sourceLabel(scannedFrom) : "NovaMDK website";

  fetch("/api/ghl-encounter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contact_id: contactId,
      opportunity_id: stored("ghl_opportunity"),
      encounter_id: encounterId,
      status,
      additional,
      treatment,
      value,
      productLine,
      source: originLabel,
      kioskLocation: scannedFrom ? originLabel : undefined,
      release_token: stored("mdi_release_token"),
    }),
  }).catch((e) => console.error("GHL encounter write failed:", e.message));
}

/* Embedded MDIntegrations patient intake — the questionnaire runs in an iframe */
export default function IntakePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [paid, setPaid] = useState(false);
  const [caseId, setCaseId] = useState(null);
  const intakeTagged = useRef(false);
  /* Holds the last encounter id sent rather than a boolean: MDI re-emits
     encounter_created when the patient navigates back, and the id is what tells
     a repeat of the same encounter from a genuinely new visit. */
  const encounterSent = useRef(null);
  /* Latches for the rest of the session: whatever MDI emits afterwards, we must
     never put a checkout in front of someone the questionnaire just turned
     away. */
  const ineligible = useRef(false);

  const token = params.get("token");
  const productName = params.get("product") || "";
  const pid = params.get("pid");
  const payDemo = params.get("paydemo") === "1";

  const product = pid ? productsData.find((p) => String(p.id) === String(pid)) : null;

  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== MDI_ORIGIN) return;
      if (import.meta.env.DEV) console.log("[MDI message]", event.data);
      const msg = typeof event.data === "object" && event.data !== null ? event.data : {};

      if ((msg.event === "start" || msg.event === "step") && !intakeTagged.current) {
        intakeTagged.current = true;
        /* Un-latched when nothing was sent, so MDI's next `step` retries. The
           patient moves through several questions, which gives this more than
           one chance to land. */
        recordMilestone("intake-started", { treatment: treatmentLabel(product) }).then((sent) => {
          if (!sent) intakeTagged.current = false;
        });
      }

      /* The questionnaire disqualified them. Recorded as a plain outcome; the
         answer that caused it never leaves MDI. */
      if (msg.event === "dead_end_question" && !ineligible.current) {
        ineligible.current = true;
        setPayOpen(false);
        recordMilestone("not-eligible");
      }

      if (msg.event === "encounter_created" && msg.data) {
        const encounterId = msg.data.encounter_id || null;
        setCaseId(encounterId);
        try {
          sessionStorage.setItem("mdi_encounter", JSON.stringify(msg.data));
        } catch { /* private mode */ }

        /* This session already opened an opportunity at the email step, and the
           first encounter belongs to it. A second, different encounter is a new
           visit, so it earns its own record instead of displacing the first. */
        if (encounterId && encounterId !== encounterSent.current) {
          const additional = Boolean(encounterSent.current);
          encounterSent.current = encounterId;
          recordEncounter({
            encounterId,
            status: statusOf(msg.data),
            additional,
            treatment: treatmentLabel(product),
            productLine: product?.categoryName,
            // Prices are display strings ("$249"); GHL rejects anything
            // non-numeric as an opportunity value.
            value: Number(String(product?.price ?? "").replace(/[^0-9.]/g, "")) || undefined,
          });
        }
      }
      if (paid || ineligible.current) return;
      const step = msg.data?.step || msg.data?.route || null;
      if (
        PAYMENT_TRIGGER_EVENTS.includes(msg.event) ||
        (msg.event === "step" && PAYMENT_TRIGGER_STEPS.includes(step))
      ) {
        setPayOpen(true);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [paid, product]);

  useEffect(() => {
    if (!payDemo || !loaded || paid) return;
    const t = setTimeout(() => setPayOpen(true), 3000);
    return () => clearTimeout(t);
  }, [payDemo, loaded, paid]);

  /* Move the CRM opportunity to Paid the moment checkout completes. This fires
     on `paid` alone — the team wants to see the card move immediately — whereas
     the MDI release below has to wait for the case id as well. */
  const marked = useRef(false);
  useEffect(() => {
    if (!paid || marked.current) return;
    marked.current = true;

    let opportunityId = null;
    let payToken = null;
    try {
      opportunityId = sessionStorage.getItem("ghl_opportunity");
      payToken = sessionStorage.getItem("mdi_release_token");
    } catch { /* private mode */ }
    if (!opportunityId) return;

    // Swallowed on failure: a CRM write must never surface to the patient as a
    // checkout error. The server logs the reason.
    fetch("/api/ghl-paid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunity_id: opportunityId, release_token: payToken }),
    }).catch((e) => console.error("GHL Paid move failed:", e.message));
  }, [paid]);

  /* Releasing the held case needs two facts that no longer arrive together:
     payment (taken at "identification") and the case id (only known once MDI
     emits encounter_created at submit, several screens later). */
  const released = useRef(false);
  useEffect(() => {
    if (!paid || !caseId || released.current) return;
    released.current = true;

    let releaseToken = null;
    try { releaseToken = sessionStorage.getItem("mdi_release_token"); } catch { /* private mode */ }

    fetch("/api/mdi-release", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ case_id: caseId, release_token: releaseToken }),
    })
      .then((r) => { if (!r.ok) throw new Error(`release ${r.status}`); })
      .catch((e) => {
        released.current = false;
        console.error("MDI release failed:", e.message);
      });
  }, [paid, caseId]);

  if (!token) return <Navigate to="/treatments" replace />;

  const intakeSrc = `${MDI_ORIGIN}?token=${encodeURIComponent(token)}`;
  const exitTo = pid ? `/product/${pid}` : "/treatments";

  return (
    <main className="flex h-screen w-full flex-col overflow-hidden bg-bg text-ink">
      <Seo title="Medical Intake" noindex />
      {/* slim header — logo home, context label, exit back to the product */}
      <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-line bg-surface px-4 md:px-6">
        <Link to="/" aria-label="Nova MDK home">
          <img src="/logo.png" alt="Nova MDK" className="h-9 w-auto" />
        </Link>
        <span className="hidden items-center gap-2 text-[0.85rem] font-medium text-muted sm:flex">
          <Lock size={13} className="text-primary" />
          Private medical intake{productName ? ` — ${productName}` : ""}
        </span>
        <button
          onClick={() => navigate(exitTo)}
          className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-[0.85rem] font-semibold text-muted transition-colors hover:border-primary hover:text-ink"
        >
          <ArrowLeft size={14} /> Exit
        </button>
      </header>

      {/* intake iframe fills the rest of the viewport */}
      <div className="relative flex-1">
        {!loaded && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-bg">
            <div className="flex flex-col items-center gap-3 text-muted">
              <Loader2 size={28} className="animate-spin text-primary" />
              <span className="text-[0.9rem] font-medium">Connecting you to your provider…</span>
            </div>
          </div>
        )}
        <iframe
          src={intakeSrc}
          title="Medical intake questionnaire"
          onLoad={() => setLoaded(true)}
          allow="camera; microphone; payment; geolocation; clipboard-write"
          className="h-full w-full border-0"
        />
      </div>

      {payOpen && !paid && (
        <PaymentGateModal
          productName={productName || product?.name || "Your treatment"}
          price={product?.price || "$0"}
          /* Only the id travels: /api/pay looks the amount up from the
             catalogue rather than trusting what the browser displays. */
          pid={pid}
          onPaid={() => {
            setPaid(true);
            setPayOpen(false);
          }}
        />
      )}
    </main>
  );
}

function PaymentGateModal({ productName, price, pid, onPaid }) {
  // loading | ready | processing | done | dead
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [zip, setZip] = useState("");
  /* startPaymentRequest() answers through a configure-time callback rather than
     a promise, so the resolver is parked here for the callback to pick up. */
  const resolver = useRef(null);
  const configured = useRef(false);

  useEffect(() => {
    if (!TOKENIZATION_KEY) {
      console.error("VITE_NMI_TOKENIZATION_KEY is not set — the card form cannot load.");
      setStatus("dead");
      return;
    }
    // StrictMode runs effects twice in dev; configuring twice remounts the
    // gateway's iframes underneath us.
    if (configured.current) return;
    configured.current = true;

    let alive = true;
    const settle = (token) => {
      const resolve = resolver.current;
      resolver.current = null;
      if (resolve) resolve(token);
    };

    loadCollectJs()
      .then((CollectJS) => {
        if (!alive) return;
        CollectJS.configure({
          variant: "inline",
          // Left off deliberately: it copies our page CSS into the gateway's
          // iframes, and the styles below are explicit instead.
          styleSniffer: false,
          fields: {
            ccnumber: { selector: "#nv-cc-number", placeholder: "Card number" },
            ccexp: { selector: "#nv-cc-exp", placeholder: "MM / YY" },
            cvv: { selector: "#nv-cc-cvv", placeholder: "CVC" },
          },
          customCss: CARD_FIELD_CSS,
          focusCss: { "border-color": "var(--nv-primary, #1f7a5a)", outline: "none" },
          invalidCss: { "border-color": "#dc2626" },
          validCss: { "border-color": "#cfd8d3" },
          placeholderCss: { color: "#8a938f" },
          fieldsAvailableCallback: () => alive && setStatus("ready"),
          timeoutDuration: 15000,
          timeoutCallback: () => settle(null),
          callback: (response) => settle(response?.token || null),
        });
      })
      .catch((e) => {
        if (!alive) return;
        console.error("Collect.js failed to load:", e.message);
        setStatus("dead");
      });

    return () => {
      alive = false;
    };
  }, []);

  const tokenize = () =>
    new Promise((resolve) => {
      resolver.current = resolve;
      window.CollectJS.startPaymentRequest();
    });

  const pay = async () => {
    if (status !== "ready") return;
    if (!name.trim() || !zip.trim()) {
      setMessage("Please add the name and ZIP code on the card.");
      return;
    }
    setMessage("");
    setStatus("processing");

    /* The card itself never reaches us: Collect.js swaps what's in its iframes
       for a single-use token, and only that token is posted. A spent token
       can't be replayed, so a retry simply mints a fresh one. */
    const token = await tokenize();
    if (!token) {
      setStatus("ready");
      setMessage("Please check your card details and try again.");
      return;
    }

    const [first, ...rest] = name.trim().split(/\s+/);
    try {
      const r = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_token: token,
          pid,
          contact_id: stored("ghl_contact"),
          opportunity_id: stored("ghl_opportunity"),
          billing: { first_name: first, last_name: rest.join(" "), zip: zip.trim() },
        }),
      }).then((res) => res.json());

      if (r?.ok) {
        setStatus("done");
        setTimeout(onPaid, 1400);
        return;
      }

      setStatus("ready");
      setMessage(
        r?.declined
          ? r.message || "That card was declined. Please try another card."
          : "We couldn't take payment just now. Please try again."
      );
    } catch (e) {
      console.error("Payment request failed:", e.message);
      setStatus("ready");
      setMessage("We couldn't reach our payment provider. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-120 grid place-items-center bg-ink/65 p-6 backdrop-blur-sm">
      <div className="w-full max-w-110 rounded-3xl border border-line bg-surface p-6 text-center nv-shadow-lg md:p-8">
        {status === "done" ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 size={44} className="text-primary" />
            <h2 className="text-[1.25rem] font-bold">Payment received</h2>
            <p className="text-[0.9rem] text-muted">Your visit is on its way to a provider…</p>
          </div>
        ) : (
          <>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <CreditCard size={22} />
            </span>
            <h2 className="mt-4 text-[1.25rem] font-bold">One last step: payment</h2>
            <p className="mt-1.5 text-[0.9rem] text-muted">
              Complete your payment to finish your intake and send your visit to a provider.
            </p>

            <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-line bg-bg px-4 py-3.5 text-left">
              <span className="text-[0.88rem] font-medium leading-snug">{productName}</span>
              <span className="shrink-0 text-[1.05rem] font-bold">{price}</span>
            </div>

            {status === "dead" ? (
              <p className="mt-5 text-[0.85rem] font-medium text-red-600">
                We couldn't load the secure card form. Please refresh the page, or contact
                support@novamdk.com and we'll take your payment another way.
              </p>
            ) : (
              <>
                <div className="mt-5 space-y-3 text-left">
                  {/* Collect.js mounts a gateway-hosted iframe into each of these,
                      which is why they're plain ids and not inputs. */}
                  <div id="nv-cc-number" className="h-11.5" />
                  <div className="grid grid-cols-2 gap-3">
                    <div id="nv-cc-exp" className="h-11.5" />
                    <div id="nv-cc-cvv" className="h-11.5" />
                  </div>

                  {/* Ours, not the gateway's: AVS checks the name and ZIP on the
                      card, which is often not the patient's own address. */}
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="cc-name"
                    placeholder="Name on card"
                    className={CARD_INPUT}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    autoComplete="billing postal-code"
                    placeholder="Billing ZIP code"
                    className={CARD_INPUT}
                  />
                </div>

                {message && (
                  <p className="mt-3 text-left text-[0.8rem] font-medium text-red-600">{message}</p>
                )}

                <button
                  onClick={pay}
                  disabled={status !== "ready"}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-4 text-[1rem] font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-deep nv-shadow disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {status === "loading" && (
                    <>
                      <Loader2 size={17} className="animate-spin" /> Loading secure form…
                    </>
                  )}
                  {status === "processing" && (
                    <>
                      <Loader2 size={17} className="animate-spin" /> Processing…
                    </>
                  )}
                  {status === "ready" && (
                    <>
                      <Lock size={16} /> Pay {price}
                    </>
                  )}
                </button>

                <p className="mt-4 flex items-center justify-center gap-1.5 text-[0.78rem] font-medium text-muted">
                  <ShieldCheck size={14} className="text-primary" /> Encrypted and HIPAA-secure
                  checkout
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
