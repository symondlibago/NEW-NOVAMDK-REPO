import React, { useState, useRef, useEffect } from "react";
import { ArrowRight, Loader2, Mail, ShieldCheck } from "lucide-react";
import { portalAuth } from "../../lib/portal";


export default function PortalLogin({ onAuthenticated }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [resent, setResent] = useState(false);
  const codeRef = useRef(null);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  async function sendCode(e) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await portalAuth({ action: "start", email });
      setStep("code");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setResent(false);
    setError(null);
    try {
      await portalAuth({ action: "start", email });
      setResent(true);
    } catch (err) {
      setError(err.message);
    }
  }

  async function verify(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { first_name } = await portalAuth({ action: "verify", email, code });
      onAuthenticated(first_name);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-xl border border-line bg-surface px-4 py-3 text-[0.95rem] text-ink placeholder:text-muted/70 focus:border-primary focus:outline-none";
  const submit =
    "flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[0.95rem] font-semibold text-on-primary transition-colors hover:bg-primary-deep disabled:opacity-60";

  return (
    <div data-lenis-prevent className="nv-scroll grid min-h-0 flex-1 place-items-center overflow-y-auto px-5 py-12">
      <div className="w-full max-w-[26rem]">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-primary">
            {step === "email" ? <Mail size={20} /> : <ShieldCheck size={20} />}
          </div>
          <h1 className="text-[1.6rem] leading-tight text-ink">
            {step === "email" ? "Sign in to your portal" : "Check your email"}
          </h1>
          <p className="mx-auto mt-2 max-w-[22rem] text-[0.92rem] leading-relaxed text-muted">
            {step === "email"
              ? "Enter the email address you used for your visit and we'll send you a one-time code."
              : <>We sent a code to <span className="font-medium text-ink">{email}</span>. It expires shortly.</>}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 nv-shadow">
          {step === "email" ? (
            <form onSubmit={sendCode} className="space-y-4">
              <div>
                <label htmlFor="portal-email" className="mb-1.5 block text-[0.82rem] font-medium text-muted">
                  Email address
                </label>
                <input
                  id="portal-email"
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={field}
                />
              </div>
              <button type="submit" disabled={busy || !email} className={submit}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : <>Send code <ArrowRight size={15} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-4">
              <div>
                <label htmlFor="portal-code" className="mb-1.5 block text-[0.82rem] font-medium text-muted">
                  One-time code
                </label>
                <input
                  id="portal-code"
                  ref={codeRef}
                  required
                  inputMode="text"
                  autoComplete="one-time-code"
                  spellCheck={false}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className={`${field} text-center font-mono text-lg tracking-[0.35em] uppercase`}
                />
              </div>
              <button type="submit" disabled={busy || !code} className={submit}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : "Sign in"}
              </button>

              <div className="flex items-center justify-between pt-1 text-[0.82rem]">
                <button
                  type="button"
                  onClick={() => { setStep("email"); setCode(""); setError(null); setResent(false); }}
                  className="text-muted underline-offset-4 hover:text-ink hover:underline"
                >
                  Use a different email
                </button>
                <button
                  type="button"
                  onClick={resend}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {resent ? "Code resent" : "Resend code"}
                </button>
              </div>
            </form>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-surface-2 px-3 py-2 text-[0.85rem] text-ink">
              {error}
            </p>
          )}
        </div>

        <p className="mt-5 text-center text-[0.78rem] leading-relaxed text-muted">
          Your health information is private and protected. Codes are sent by our
          medical partner and expire after a short time.
        </p>
      </div>
    </div>
  );
}
