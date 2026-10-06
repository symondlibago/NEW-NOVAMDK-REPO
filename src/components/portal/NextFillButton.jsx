import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { nextFillUrl } from "../../lib/nextFill";

/* Starts the next month of a plan. A button rather than a link because a fresh
   voucher and release token have to be minted first, and because which product
   the month is for is the server's decision, not a URL this page could build.

   Sibling of ResumeIntakeButton, deliberately the same shape: both mint
   something and then route into /intake.

   `confirm` turns the first tap into a question. A month inside a plan was paid
   for months ago and needs no confirming, but the first month of a NEW term
   puts a hold on the patient's card, and money must never move on one stray
   tap. Passing it also makes the two cases read differently on screen, which is
   the point: the patient should be able to tell a free month from a paid one
   without reading carefully. */
export default function NextFillButton({
  opportunityId,
  className,
  children,
  onUnauthorized,
  confirm,
}) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState(null);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      navigate(await nextFillUrl(opportunityId));
    } catch (err) {
      setBusy(false);
      setAsking(false);
      if (err.status === 401 && onUnauthorized) return onUnauthorized();
      /* 409 is the ordinary "your current month is still with a provider", and
         402 is a declined card. The server words both for the patient. */
      setError(err.message);
    }
  };

  return (
    <span className="flex shrink-0 flex-col items-stretch gap-1.5 sm:items-end">
      {asking && confirm && (
        <span className="max-w-xs text-[0.78rem] leading-relaxed text-muted sm:text-right">
          {confirm}
        </span>
      )}
      <button
        type="button"
        onClick={() => (confirm && !asking ? setAsking(true) : start())}
        disabled={busy}
        className={className}
      >
        {busy && <Loader2 size={15} className="animate-spin" />}
        {asking && confirm ? "Yes, continue" : children}
      </button>
      {asking && !busy && (
        <button
          type="button"
          onClick={() => setAsking(false)}
          className="text-[0.78rem] font-semibold text-muted underline underline-offset-2 hover:text-ink"
        >
          Not now
        </button>
      )}
      {error && (
        <span role="alert" className="text-[0.78rem] text-red-600">
          {error}
        </span>
      )}
    </span>
  );
}
