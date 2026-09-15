import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { resumeIntakeUrl } from "../../lib/resumeIntake";

/* A button, not a link to MDI's resume page: resuming has to mint a fresh
   release token first and then route through /intake so the checkout appears. */
export default function ResumeIntakeButton({ draftId, className, children, onUnauthorized }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const resume = async () => {
    setBusy(true);
    setError(null);
    try {
      navigate(await resumeIntakeUrl(draftId));
    } catch (err) {
      setBusy(false);
      if (err.status === 401 && onUnauthorized) return onUnauthorized();
      setError(err.message);
    }
  };

  return (
    <span className="flex shrink-0 flex-col items-stretch gap-1.5 sm:items-end">
      <button type="button" onClick={resume} disabled={busy} className={className}>
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
