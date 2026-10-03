import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { nextFillUrl } from "../../lib/nextFill";

/* Starts the next month of a plan. A button rather than a link because a fresh
   voucher and release token have to be minted first, and because which product
   the month is for is the server's decision, not a URL this page could build.

   Sibling of ResumeIntakeButton, deliberately the same shape: both mint
   something and then route into /intake. */
export default function NextFillButton({ className, children, onUnauthorized }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      navigate(await nextFillUrl());
    } catch (err) {
      setBusy(false);
      if (err.status === 401 && onUnauthorized) return onUnauthorized();
      /* 409 is the ordinary "your current month is still with a provider",
         which the server words for the patient. */
      setError(err.message);
    }
  };

  return (
    <span className="flex shrink-0 flex-col items-stretch gap-1.5 sm:items-end">
      <button type="button" onClick={start} disabled={busy} className={className}>
        {busy && <Loader2 size={15} className="animate-spin" />}
        {children}
      </button>
      {error && (
        <span role="alert" className="text-[0.78rem] text-red-600">
          {error}
        </span>
      )}
    </span>
  );
}
