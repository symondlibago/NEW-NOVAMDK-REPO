import React, { useState } from "react";
import { ArrowRight, Check, Loader2, ShieldCheck } from "lucide-react";

/* The last screen of a month the patient already paid for.
 *
 * Months 2 and 3 of a plan reach the checkout like any other visit, because the
 * checkout is where a visit gets recorded against the plan, but there is
 * nothing to pay and so nothing to collect. This replaces the card form with a
 * confirmation and one button.
 *
 * Nothing here establishes the entitlement. The server works out from the
 * portal session whether a month is still owed, both when it quotes this screen
 * and again when this button is pressed, so a browser that reached this panel
 * without a plan behind it gets a 403 rather than a free visit.
 */

const SHELL =
  "flex flex-col rounded-3xl bg-surface-1 p-5 text-ink sm:p-7";

const ASSURANCES = [
  "Already paid as part of your plan",
  "Reviewed by a licensed provider",
  "Only filled if a provider approves",
  "Shipped discreetly to your door",
];

export default function PrepaidFill({
  product,
  productName,
  pid,
  quote,
  treatment,
  submitted,
  onPaid,
}) {
  // "ready" | "sending" | "done" | "dead"
  const [status, setStatus] = useState("ready");
  const [message, setMessage] = useState("");

  const name = product?.name || productName || "Your treatment";
  const image = product?.img || product?.imgDetail || null;
  const month = Number(quote?.month) || null;
  const planMonths = Number(quote?.planMonths) || null;

  const confirm = async (e) => {
    e.preventDefault();
    if (status !== "ready") return;
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "prepaid_fill",
          pid,
          contact_id: sessionStorage.getItem("ghl_contact") || undefined,
          opportunity_id: sessionStorage.getItem("ghl_opportunity") || undefined,
          treatment,
          submitted,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!data?.ok) {
        console.error("Prepaid fill refused:", data?.error || res.status);
        setStatus("ready");
        setMessage(
          data?.error === "no_fills_left"
            ? "This plan has no months left to use. Please contact us if that looks wrong."
            : "We couldn't confirm your plan. Please refresh the page and try again."
        );
        return;
      }
      setStatus("done");
      setTimeout(() => onPaid?.(), submitted ? 0 : 1800);
    } catch (err) {
      console.error("Prepaid fill call failed:", err);
      setStatus("ready");
      setMessage("We couldn't reach our server. Please try again.");
    }
  };

  if (status === "done") {
    return (
      <div className={`flex-1 ${SHELL} items-center justify-center text-center`}>
        <img src="/logo-2026.png" alt="NovaMDK" className="mx-auto h-12 w-auto sm:h-14" />
        <ShieldCheck size={34} className="mx-auto mt-6 text-primary" />
        <p className="mt-3 font-journal text-[1.4rem] font-semibold">Check-in confirmed</p>
        <p className="mt-1.5 text-[0.88rem] text-muted">Taking you back to your visit…</p>
      </div>
    );
  }

  return (
    <form onSubmit={confirm} className={`flex-1 ${SHELL}`}>
      <img src="/logo-2026.png" alt="NovaMDK" className="mx-auto h-9 w-auto sm:h-10" />

      <div className="mt-6 flex items-center gap-3.5">
        {image ? (
          <img
            src={image}
            alt=""
            className="h-16 w-16 flex-none rounded-xl bg-surface-2 object-contain p-1"
            loading="eager"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="font-journal text-[1.05rem] font-semibold leading-tight sm:text-[1.15rem]">
            {name}
          </p>
          <p className="mt-0.5 text-[0.8rem] leading-snug text-muted">
            {product?.dosageForm ? `${product.dosageForm} · ` : ""}
            {month && planMonths ? `Month ${month} of ${planMonths}` : "Part of your plan"}
          </p>
        </div>
      </div>

      {/* Where the total normally sits. A nothing-to-pay line in the same place
          answers the question before it gets asked, rather than leaving a
          patient wondering what happened to the price. */}
      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-surface-2/80 px-4 py-3.5">
        <Check size={18} className="flex-none text-primary" />
        <span className="min-w-0 flex-1 text-[0.92rem] font-semibold">Nothing to pay today</span>
        <span className="flex-none font-display text-[1.4rem] font-extrabold leading-none text-primary sm:text-[1.55rem]">
          $0
        </span>
      </div>

      <p className="mt-2.5 flex items-start gap-2 text-[0.78rem] leading-relaxed text-muted">
        <ShieldCheck size={14} className="mt-0.5 flex-none text-primary" />
        <span>
          You paid for this month when you bought your plan. No card is needed and nothing
          will be charged.
        </span>
      </p>

      {message && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-[0.84rem] font-medium leading-relaxed text-red-700"
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status !== "ready"}
        className="mt-6 flex w-full items-center gap-3 rounded-2xl bg-primary px-5 py-4 text-[1rem] font-bold text-on-primary transition-opacity disabled:opacity-45"
      >
        {status === "sending" ? (
          <span className="flex flex-1 items-center justify-center gap-2">
            <Loader2 size={17} className="animate-spin" />
            Confirming…
          </span>
        ) : (
          <>
            <span className="flex flex-1 items-center justify-center gap-2.5">
              Send to a provider
            </span>
            <ArrowRight size={18} className="flex-none" />
          </>
        )}
      </button>

      <ul className="mt-5 grid gap-x-4 gap-y-2 sm:grid-cols-2">
        {ASSURANCES.map((text) => (
          <li key={text} className="flex items-start gap-2">
            <Check size={14} className="mt-0.5 flex-none text-primary" />
            <span className="text-[0.76rem] leading-snug text-muted">{text}</span>
          </li>
        ))}
      </ul>
    </form>
  );
}
