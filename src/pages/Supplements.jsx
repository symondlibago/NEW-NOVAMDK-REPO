import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Seo from "../components/Seo";
import Navbar from "../components/Nav/Navbar";
import Footer from "../components/Nav/Footer";
import PageHero from "../components/shop/PageHero";
// import CategoryGrid from "../components/shop/CategoryGrid"; // re-enable with the peptide list below
import Photo from "../components/ui/Photo";
import Reveal from "../components/ui/Reveal";
import { CompoundedDisclaimer } from "../components/Compliance";

/* ---------------------------------------------------------------------------
 * Peptide molecule list — HIDDEN at client request (2026-06-20). The page stays
 * live for upcoming supplement products. Uncomment this + the section below to
 * restore the "Browse by molecule" grid.
 * ---------------------------------------------------------------------------
const SUPPLEMENT_CATS = [
  { name: "Semaglutide", tag: "GLP-1", link: "/contact" },
  { name: "Tirzepatide", tag: "GLP-1 / GIP", link: "/contact" },
  { name: "Retatrutide", tag: "GLP-3", link: "/contact" },
  { name: "BPC-157", tag: "Recovery", link: "/contact" },
  { name: "NAD+", tag: "Longevity", link: "/contact" },
  { name: "GHK-Cu", tag: "Skin & repair", link: "/contact" },
  { name: "Thymosin Alpha 1", tag: "Immune", link: "/contact" },
  { name: "MOTS-C", tag: "Metabolic", link: "/contact" },
  { name: "Tesamorelin", tag: "Growth", link: "/contact" },
];
--------------------------------------------------------------------------- */

export default function SupplementsPage() {
  return (
    <main className="min-h-screen w-full bg-bg text-ink">
      {/* Supplement line hidden at client request (2026-08-15). The page still
          renders for anyone with the direct URL, but it is unlinked from the nav,
          footer and HTML sitemap, dropped from sitemap.xml and the prerender, and
          marked noindex so it stops showing up in search. */}
      <Seo
        title="Supplements — Clinical-Grade Formulas"
        description="Compounded peptides and daily-foundation supplements from Nova MDK, prepared by state licensed U.S. pharmacies and matched to your protocol."
        path="/supplements"
        noindex
      />
      <Navbar />

      <PageHero
        showBack
        eyebrow="Supplements"
        title="Clinical-grade formulas, tailored to your labs"
        subtitle="Compounded peptides and daily-foundation supplements, prepared by state licensed U.S. pharmacies and matched to your protocol."
        chips={["Physician-reviewed", "Purity tested"]}
      />

      {/* ===== Coming soon =====
          The shoppable grid is pulled at client request (2026-08-11). Its ProductCard
          grid, the LIVE_SUPPLEMENTS filter and the QuickViewModal wiring were removed
          with it rather than left as dead code — recover them from git history. */}
      <section className="bg-surface-2 py-[clamp(2.5rem,5.5vw,4rem)]">
        <div className="mx-auto max-w-[1180px] px-5 md:px-10">
          <Reveal className="mx-auto max-w-[52ch] text-center">
            <span className="nv-eyebrow">Coming soon</span>
            <h2 className="mt-1.5 text-[1.4rem] font-extrabold leading-tight sm:mt-2 sm:text-[clamp(1.8rem,4vw,2.6rem)]">
              Our supplement line is on its way
            </h2>
            <p className="mx-auto mt-2 max-w-[46ch] text-[0.92rem] leading-relaxed text-muted sm:text-[1.02rem]">
              We're finalizing a range of non-prescription formulas to sit alongside your
              protocol. Message the care team and we'll let you know the moment they're available.
            </p>
            <Link
              to="/contact"
              className="group mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[0.96rem] font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-deep nv-shadow"
            >
              Message the care team
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Peptide molecule list hidden at client request (2026-06-20) — restore with SUPPLEMENT_CATS above.
      <section className="mx-auto max-w-[1180px] px-5 py-[clamp(2.6rem,5vw,4rem)] md:px-10">
        <span className="nv-eyebrow">Browse by molecule</span>
        <div className="mt-6">
          <CategoryGrid items={SUPPLEMENT_CATS} />
        </div>
      </section>
      */}

      {/* What arrives band */}
      <section className="mx-auto max-w-[1180px] px-5 pb-[clamp(3.5rem,7vw,6rem)] md:px-10">
        <div className="grid items-center gap-[clamp(2rem,5vw,4.5rem)] md:grid-cols-2">
          <Reveal>
            <span className="nv-eyebrow">What arrives</span>
            <h2 className="mt-3 text-[clamp(1.8rem,4vw,2.7rem)] font-extrabold leading-tight">Pre-sorted, dated, and ready to take</h2>
            <p className="mt-4 max-w-[46ch] text-[1.04rem] text-muted">Your supplements come split into morning and evening packs alongside any prescription treatments — one box, no juggling bottles.</p>
            <Link to="/contact" className="group mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[0.96rem] font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-deep nv-shadow">
              Build your protocol <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
          <Reveal delay={0.08}>
            <Photo src="/site/amber-bottles.avif" alt="Hands holding two amber supplement bottles" className="min-h-[320px] w-full rounded-[calc(26px*var(--nv-r-scale,1))] border border-line nv-shadow" imgClassName="object-cover" />
          </Reveal>
        </div>

        {/* required compounded-drug + GLP-1 marketing disclaimers */}
        <CompoundedDisclaimer className="mx-auto mt-12 max-w-[680px] border-t border-line pt-6 text-center" />
      </section>

      <Footer />
    </main>
  );
}
