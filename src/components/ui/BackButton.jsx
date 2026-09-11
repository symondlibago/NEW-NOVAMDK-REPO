import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";

const PILL =
  "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-[0.88rem] font-medium text-muted transition-all hover:border-line-strong hover:text-ink";

/** Back pill, paired with an explicit "Home" pill. History-based back is fine for
 *  people who know browsers; the home link is for those who don't, and for anyone
 *  landing deep from a QR code or the kiosk with no history to go back through. */
export default function BackButton({ to = "/", label = "Back", className = "", showHome = true }) {
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(to);
  };
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button onClick={goBack} className={`${PILL} hover:-translate-x-0.5`}>
        <ArrowLeft size={16} /> {label}
      </button>
      {showHome && (
        <Link to="/" className={PILL}>
          <Home size={16} /> Home
        </Link>
      )}
    </div>
  );
}
