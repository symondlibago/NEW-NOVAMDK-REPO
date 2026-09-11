import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter } from "lucide-react";

const TikTokIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.55a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.0z" />
  </svg>
);

// Outlined rather than filled: a row of solid chips on a light base reads busy,
// and only fills in on hover.
const social =
  "grid h-10 w-10 place-items-center rounded-full border border-line-strong bg-surface text-primary transition-colors hover:border-primary hover:bg-primary hover:text-on-primary";

const heading = "mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.13em] text-ink md:mb-6";
const link = "transition-colors hover:text-primary";

export default function Footer() {
  return (
    // Warm cream rather than white: a full-width white block under a cream page
    // is the part that glares. surface-2 sits just below the page tone, so the
    // footer still reads as a separate base without brightening.
    <footer className="mt-auto w-full border-t border-line-strong bg-surface-2 pb-10 pt-16 text-muted md:pt-24">
      <div className="mx-auto max-w-[1340px] px-6 md:px-10">
        <div className="mb-12 grid grid-cols-2 gap-x-6 gap-y-9 md:mb-20 md:grid-cols-4 md:gap-10 lg:gap-16">
          <div className="col-span-2 lg:col-span-1 md:pr-8">
            {/* The white pill existed to lift a dark logo off a dark panel — on a
                light base it's just a floating box, so the mark sits direct. */}
            <img src="/logo.png" alt="Nova MDK" className="h-[42px] w-auto" />
            <p className="mt-5 max-w-[34ch] text-sm leading-relaxed text-muted">
              Personalized prescription treatments, reviewed by licensed physicians and, if prescribed, shipped discreetly by a licensed pharmacy.
            </p>
            <div className="mt-6 flex gap-3">
              <a href="https://www.facebook.com/novamdk" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={social}><Facebook size={18} strokeWidth={1.5} /></a>
              <a href="https://www.instagram.com/novamdk" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={social}><Instagram size={18} strokeWidth={1.5} /></a>
              <a href="https://www.tiktok.com/@novamdk" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className={social}><TikTokIcon size={18} /></a>
              <a href="https://x.com/novamdk" target="_blank" rel="noopener noreferrer" aria-label="X" className={social}><Twitter size={18} strokeWidth={1.5} /></a>
            </div>
          </div>

          <div>
            <h4 className={heading}>Treatments</h4>
            <ul className="space-y-3 text-[14px] text-muted md:space-y-4">
              <li><Link to="/treatments" className={link}>All Treatments</Link></li>
              <li><Link to="/treatments/weight-loss" className={link}>Weight Loss</Link></li>
              <li><Link to="/treatments/longevity" className={link}>Longevity</Link></li>
              <li><Link to="/treatments/skin-health" className={link}>Skin Health</Link></li>
              <li><Link to="/treatments/sexual-health" className={link}>Sexual Health</Link></li>
              <li><Link to="/treatments/recovery-wellness" className={link}>Recovery &amp; Wellness</Link></li>
            </ul>
          </div>

          <div>
            <h4 className={heading}>Company</h4>
            <ul className="space-y-3 text-[14px] text-muted md:space-y-4">
              <li><Link to="/#how" className={link}>How it works</Link></li>
              {/* Smart Kiosk hidden at client request (2026-08-11) — route still live, just unlinked. */}
              <li><Link to="/blog" className={link}>Blog</Link></li>
              <li><Link to="/weight-loss-calculator" className={link}>Weight loss calculator</Link></li>
              <li><Link to="/#reviews" className={link}>Reviews</Link></li>
              <li><Link to="/#faq" className={link}>FAQ</Link></li>
              <li><Link to="/contact" className={link}>Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className={heading}>Legal</h4>
            <ul className="space-y-3 text-[14px] text-muted md:space-y-4">
              <li><Link to="/legal/privacy-policy" className={link}>Privacy policy</Link></li>
              <li><Link to="/legal/hipaa-notice-of-privacy-practices" className={link}>Notice of Privacy Practices</Link></li>
              <li><Link to="/legal/terms-and-conditions" className={link}>Terms &amp; conditions</Link></li>
              <li><Link to="/legal/telehealth-consent" className={link}>Telehealth consent</Link></li>
              <li><Link to="/legal/consumer-health-data" className={link}>Consumer Health Data</Link></li>
              <li><Link to="/sitemap" className={link}>Sitemap</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-line-strong pt-8 text-[13px] text-muted md:flex-row md:items-center md:justify-between md:pt-10">
          <p>©2026 Nova MDK, LLC. All rights reserved.</p>
          <a
            href="mailto:privacy@novamdk.com?subject=Do%20Not%20Sell%20or%20Share%20My%20Personal%20Information&body=I%20am%20requesting%20to%20opt%20out%20of%20the%20sale%20or%20sharing%20of%20my%20personal%20information.%20Please%20process%20this%20request%20for%20the%20email%20address%20on%20file."
            className="font-medium text-ink underline underline-offset-2 transition-colors hover:text-primary"
          >
            Do Not Sell or Share My Personal Information
          </a>
        </div>

        <div className="mt-8 max-w-6xl space-y-2 text-left text-[10px] leading-relaxed text-muted md:text-[11px]">
          <p>
            Compounded drug products are not approved or evaluated for safety, effectiveness, or quality
            by the FDA. Prescription required. Nova MDK does not manufacture drug products.
          </p>
          <p>
            The medication you receive may differ in appearance from the website images. Results not
            guaranteed and side effects may occur.
          </p>
          <p>
            Prescription products require an online evaluation by a licensed medical professional.
            Medications are prescribed by licensed physicians as part of our programs. For prescription
            items, Nova MDK will arrange a consultation with a qualified healthcare provider.
          </p>
          <p>
            Most online visits are quick, but appointment length may vary based on
            the patient's medical needs and the treating clinician's independent professional judgment.
            The provider — not Nova MDK or its management services organization — determines how long each
            clinical evaluation takes.
          </p>
        </div>
      </div>
    </footer>
  );
}
