import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams, Navigate, Link } from "react-router-dom";
import { track, EVENTS } from "../lib/analytics";
import {
  ArrowRight, ArrowLeft, Check, ShieldCheck, Truck, Stethoscope, Lock, FlaskConical, Loader2,
  QrCode, X, UserRound, ChevronDown, MapPin, Home,
} from "lucide-react";
import Seo from "../components/Seo";
import Navbar from "../components/Nav/Navbar";
import Footer from "../components/Nav/Footer";
import Reveal from "../components/ui/Reveal";
import {
  productsData,
  visibleProducts,
  isCompounded,
  isOtc,
  isHidden,
  priceUnit,
  priceLabel,
} from "../components/data/products";
import { productSlug, productPath } from "../lib/slug";
import { syncToGhl, treatmentLabel } from "../lib/ghl";
import {
  readKioskLocation, scanUrl, captureScanSource, readScanSource, sourceLabel, SCAN_PARAM,
} from "../lib/kioskLocations";
import { isBlockedState } from "../lib/serviceArea";
import KioskQr from "../components/kiosk/KioskQr";
import { ComplianceBadges, CompoundedDisclaimer } from "../components/Compliance";
import useKioskMode from "../lib/useKioskMode";
import useLockBodyScroll from "../lib/useLockBodyScroll";
import DatePicker from "../components/ui/DatePicker";
import { baseName, stageOf, displayTitle } from "../lib/catalog";
import ProductGallery from "../components/product/ProductGallery";
import ProductMechanism from "../components/product/ProductMechanism";
import ProductFaq from "../components/product/ProductFaq";
import ProductJourney from "../components/product/ProductJourney";
import ProductWhy from "../components/product/ProductWhy";
import NadSupport from "../components/product/NadSupport";
import NadDirected from "../components/product/NadDirected";
import NadSublingual from "../components/product/NadSublingual";
import GlutathioneSections from "../components/product/GlutathioneSections";
import ScreamCreamSections from "../components/product/ScreamCreamSections";
import SermorelinSections from "../components/product/SermorelinSections";
import LdnSections from "../components/product/LdnSections";
import LuminanceSections from "../components/product/LuminanceSections";
import OlympusSections from "../components/product/OlympusSections";
import BremelanotideSections from "../components/product/BremelanotideSections";
import BremelanotideNasalSections from "../components/product/BremelanotideNasalSections";
import LipoCSections from "../components/product/LipoCSections";

const HERO_ASSURANCES = [
  { icon: Stethoscope, l1: "US licensed", l2: "providers" },
  { icon: Truck, l1: "Home Delivery,", l2: "If Prescribed" },
  { icon: Lock, l1: "Discreet", l2: "Packaging" },
];
/* Retail items carry no prescription, so the conditional half of the delivery
   promise would be wrong here — they ship on order. */
const HERO_ASSURANCES_OTC = [
  { icon: ShieldCheck, l1: "No prescription", l2: "needed" },
  { icon: Truck, l1: "Home", l2: "Delivery" },
  { icon: Lock, l1: "Discreet", l2: "Packaging" },
];
const ingredients = (p) => baseName(p).split("/").map((s) => s.trim()).filter(Boolean);
const primaryName = (p) => ingredients(p)[0] || baseName(p);
const comboTagline = (p) => {
  // An explicit tagline wins: the blend line does not always read as a list of
  // ingredients split out of the product's own name.
  if (p?.tagline) return p.tagline;
  if (!isCompounded(p)) return "";
  const parts = ingredients(p);
  return parts.length > 1
    ? `Compounded ${parts[0]} with ${parts.slice(1).join(" and ")}`
    : "";
};

// Fallback questionnaire used when a product has no questionnaireId yet.
const DEFAULT_QUESTIONNAIRE_ID = "";

/* Compared as calendar parts rather than by subtracting timestamps: a date
   difference is thrown off by leap years and by the browser's timezone, and
   someone turning 18 today must pass. */
const MIN_AGE = 18;
function isAdult(iso) {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!parts) return false;
  const [, y, m, d] = parts.map(Number);

  const now = new Date();
  const age = now.getFullYear() - y;
  const hadBirthday =
    now.getMonth() + 1 > m || (now.getMonth() + 1 === m && now.getDate() >= d);
  return (hadBirthday ? age : age - 1) >= MIN_AGE;
}

export default function ProductPage() {
  const { id } = useParams();
  // URLs use keyword slugs (/product/semaglutide-…); legacy numeric ids still
  // resolve and 301-style redirect to the slug so old links and QR codes work.
  const product = productsData.find((p) => String(p.id) === String(id) || productSlug(p) === id);

  const isKiosk = useKioskMode();
  const [search, setSearch] = useSearchParams();
  const navigate = useNavigate();
  const [showQR, setShowQR] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!product || isKiosk) return;
    if (search.get("start") === "1" && !isOtc(product)) setShowInfo(true);
  }, [search, product, isKiosk]);

  /* A scan lands here carrying ?from=<kiosk>. Bank it, then take it back out of
     the address bar — this is the patient's own phone, and the marker is our
     bookkeeping, not something they should see or accidentally share. Routed
     through setSearchParams rather than history.replaceState so the router
     doesn't end up disagreeing with the URL about ?start=1. */
  useEffect(() => {
    const from = captureScanSource();
    if (!from) return;

    /* The only place a scan can be counted. GHL never sees this one: nobody has
       identified themselves yet, and most people who scan never will. */
    track(EVENTS.KIOSK_SCAN, {
      kiosk_location: from,
      treatment: product?.name,
      category: product?.categorySlug,
    });

    const next = new URLSearchParams(search);
    next.delete(SCAN_PARAM);
    setSearch(next, { replace: true });
  }, [search, setSearch, product?.id]);

  // Record a product view (high-signal: which treatments get attention).
  useEffect(() => {
    if (product) {
      track(EVENTS.PRODUCT_VIEWED, { id: product.id, name: product.name, category: product.categorySlug });
    }
  }, [product?.id]);

  if (!product) return <Navigate to="/treatments" replace />;
  if (isHidden(product)) {
    return <Navigate to={isOtc(product) || product.categorySlug === "supplements" ? "/treatments" : `/treatments/${product.categorySlug}`} replace />;
  }
  if (id !== productSlug(product)) return <Navigate to={productPath(product)} replace />;

  const categoryLabel = product.categoryName;
  const active = product;
  const otc = isOtc(product);
  const isNad = /nad\+/i.test(product.name);
  const isSublingual = /sublingual/i.test(product.name);
  const isGlutathione = /glutathione/i.test(product.name);
  const isScreamCream = /scream cream/i.test(product.name);
  const isSermorelin = /sermorelin/i.test(product.name);
  const isLdn = /naltrexone/i.test(product.name);
  const isLuminance = /luminance/i.test(product.name);
  /* Exact, not /olympus peak/i: the ladder also carries an Olympus Max Peak,
     and this block's copy names Olympus Peak throughout. */
  const isOlympusPeak = product.name === "Olympus Peak";
  const isBremelanotideInjection = product.name === "Bremelanotide Injection";
  const isBremelanotideNasal = product.name === "Bremelanotide Nasal Spray";
  const isLipoC = /lipo-c/i.test(product.name);
  const backLink = otc ? "/treatments" : `/treatments/${product.categorySlug}`;
  const seenTitle = new Set();
  const related = visibleProducts
    .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id && isOtc(p) === otc)
    .filter((p) => baseName(p) !== baseName(product))
    .filter((p) => !stageOf(p) || stageOf(p) === "Starter")
    .filter((p) => {
      const t = displayTitle(p);
      if (seenTitle.has(t)) return false;
      seenTitle.add(t);
      return true;
    })
    .slice(0, 3);
  const relatedHeading = `More in ${product.categoryName}`;
  const hasCompounded = isCompounded(active);
  /* isSupplement / hasFda went with the FDA disclaimer card on 2026-09-09.
     Restoring the card means restoring both: supplements carried the
     name-matched wording, while an Rx product only qualified when its own
     record named a statement (the B12 combination notice, for one), which is
     what kept Compliance.jsx from firing an unrelated disclaimer onto an Rx
     page. */
  const startVisit = async (patient) => {
    track(EVENTS.START_VISIT, { id: active.id, name: active.name, category: active.categorySlug });
    setErr("");
    setLoading(true);
    try { sessionStorage.removeItem("ghl_opportunity"); } catch { /* private mode */ }
    try {
      const res = await fetch("/api/mdi-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionnaire_id: active.questionnaireId || DEFAULT_QUESTIONNAIRE_ID,
          case_offering_id: active.caseOfferingId || undefined,
          patient: patient?.email ? patient : null,
          consent: patient?.consent || null,
        }),
      });
      if (!res.ok) throw new Error("We couldn't start your visit just now — please try again.");
      const voucher = await res.json();
      // Contact-only submit + no MDI record found: the modal collects the
      // rest of the profile (steps 2–3) before we mint the voucher.
      if (voucher.need_profile) return { needProfile: true };
      const profile = voucher.patient_profile || (patient?.first_name ? patient : null);
      if (profile?.email) {
        // Not awaited — the CRM write must never hold up the handoff to intake.
        // The opportunity id is stashed for the payment step, which moves that
        // same record to the Paid stage. It lands long before checkout, which is
        // several screens into the questionnaire.
        /* The kiosk that sent them, if a QR did. This is the first moment
           there's a person to attach it to — a scan on its own is anonymous,
           so nothing can reach GHL before now. */
        const scannedFrom = readScanSource();
        const originLabel = scannedFrom ? sourceLabel(scannedFrom) : "NovaMDK website";

        syncToGhl({
          patient: profile,
          treatment: treatmentLabel(active),
          /* MDI's permanent id for this person, minted with the voucher a
             moment ago. It rides along on the contact write rather than a
             second call, and is simply absent when MDI couldn't resolve them. */
          mdiPatientId: voucher.patient_id || undefined,
          // The category as the site names it. The server drops it when GHL's
          // dropdown has no matching option rather than failing the write.
          productLine: active.categoryName,
          // Prices are display strings ("$249"), so strip to a number for the
          // opportunity's value — GHL rejects anything non-numeric.
          value: Number(String(active.price).replace(/[^0-9.]/g, "")) || undefined,
          source: originLabel,
          kioskLocation: scannedFrom ? originLabel : undefined,
          tags: [
            "website-lead",
            active.categorySlug,
            ...(scannedFrom ? ["kiosk", `kiosk-${scannedFrom}`] : []),
          ],
          note: `Started ${treatmentLabel(active)}.` +
            (scannedFrom ? ` Scanned at ${sourceLabel(scannedFrom)}.` : "") +
            (patient?.consent?.accepted_at
              ? ` Accepted telehealth consent and terms at ${patient.consent.accepted_at}.`
              : ""),
        }).then((r) => {
          // The contact id rides along so the intake page can tag this same
          // person once MDI confirms the questionnaire actually started.
          try {
            if (r?.opportunityId) sessionStorage.setItem("ghl_opportunity", r.opportunityId);
            if (r?.contactId) sessionStorage.setItem("ghl_contact", r.contactId);
          } catch { /* private mode */ }
        });
      }

      const token = voucher.id || new URL(voucher.onboarding_url || "https://x.invalid").searchParams.get("token");
      if (token) {

        if (voucher.release_token) {
          try { sessionStorage.setItem("mdi_release_token", voucher.release_token); } catch { /* private mode */ }
        }
        navigate(`/intake?token=${encodeURIComponent(token)}&product=${encodeURIComponent(active.name)}&pid=${active.id}`);
        return;
      }
      // No URL on the voucher yet — surface it so the handoff can be finalized.
      console.info("MDI voucher minted:", voucher);
      setErr("Visit started — connecting you to intake shortly.");
    } catch (e) {
      setErr(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-bg text-ink">
      <Seo
        title={`${product.name} — ${product.categoryName}`}
        description={product.subtitle || `${product.name} from Nova MDK — physician-guided telehealth treatment, delivered to your door.`}
        path={productPath(product)}
        image={product.img}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.subtitle || undefined,
          image: `https://www.novamdk.com${product.img}`,
          category: product.categoryName,
          brand: { "@type": "Brand", name: product.brandName || "Nova MDK" },
        }}
      />
      <Navbar />

      {/* breadcrumb */}
      <div className="mx-auto max-w-[1180px] px-5 pt-6 md:px-10">
        {/* Same pill treatment as the shared BackButton on every other page. These
            stay plain Links rather than that component: back here means "up to the
            category", not browser history. */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={backLink}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-[0.88rem] font-medium text-muted transition-all hover:-translate-x-0.5 hover:border-line-strong hover:text-ink"
          >
            <ArrowLeft size={16} /> Back to {categoryLabel}
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-[0.88rem] font-medium text-muted transition-all hover:border-line-strong hover:text-ink"
          >
            <Home size={16} /> Home
          </Link>
        </div>
      </div>

      {/* ===== Hero ===== */}
      <section className="mx-auto max-w-[1180px] px-5 py-[clamp(1.5rem,4vw,3rem)] md:px-10">
        {/* min-w-0 on the columns: long unbreakable product names (e.g.
            "Semaglutide/Cyanocobalamin") must not widen the grid track past
            the viewport on phones */}
        <div className="grid gap-8 md:grid-cols-2 md:items-start lg:gap-14">
          {/* image gallery */}
          <Reveal className="min-w-0">
            <ProductGallery product={active} categoryLabel={categoryLabel} />
          </Reveal>

          {/* info */}
          <Reveal delay={0.08} className="min-w-0">
            <div>
              {/* Category now rides on the gallery frame, as in the comp, so the
                  column opens on the name rather than repeating the label. */}
              {/* The drug alone. The blend, the dose rung and the vial size are
                  all named below it rather than crowded into the heading. */}
              <h1 className="wrap-break-word font-display text-[clamp(2rem,4.4vw,3.05rem)] font-extrabold leading-[1.04] tracking-tight text-[#725826]">
                {product.heroTitle || primaryName(product)}
              </h1>
              {comboTagline(active) && (
                <p className="mt-2.5 text-[clamp(1.05rem,1.9vw,1.35rem)] font-semibold leading-snug text-ink">
                  {comboTagline(active)}
                </p>
              )}
              <p className="mt-4 max-w-[58ch] text-[clamp(0.98rem,1.15vw,1.1rem)] leading-[1.65] text-muted">{active.subtitle}</p>

              {/* required regulatory labels */}
              <ComplianceBadges compounded={isCompounded(active)} rx={!otc} size="lg" className="mt-5" />

              {/* price block */}
              <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-line pt-6">
                {/* "Starts at", not "Start": the label runs straight into the
                    figure, and a bare verb there ("Start $139/mo") does not
                    read as English. A product priced per defined fill sets
                    `exactPrice` and drops the label — it is one price, not the
                    bottom of a range — and states the supply it buys instead. */}
                {!active.exactPrice && (
                  <span className="text-[1rem] uppercase tracking-[0.08em] text-ink">Starts at</span>
                )}
                <span className="font-display text-[clamp(2.2rem,4vw,2.9rem)] font-extrabold leading-none tracking-tight">
                  {active.price}
                  <span className="font-semibold">{priceUnit(active)}</span>
                </span>
                {active.priceNote && (
                  <span className="text-[0.95rem] leading-snug text-muted">· {active.priceNote}</span>
                )}
              </div>

              {/* Highlights moved down into the "What this supports" section, so
                  the hero stays on one job: what it is, what it costs, start. */}

              {otc ? (
                /* No prescription, so no intake — the care team handles retail orders. */
                <Link
                  to="/contact"
                  className="group mt-6 flex w-full items-center justify-center gap-2 rounded-[calc(12px*var(--nv-r-scale,1))] bg-[#977e43] px-7 py-4 text-[1rem] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#836c39] nv-shadow"
                >
                  Ask about this supplement <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              ) : isKiosk ? (
                <button
                  onClick={() => setShowQR(true)}
                  className="group mt-6 flex w-full items-center justify-center gap-2 rounded-[calc(12px*var(--nv-r-scale,1))] bg-[#977e43] px-7 py-4 text-[1rem] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#836c39] nv-shadow"
                >
                  Start Your Consultation <QrCode size={17} className="transition-transform group-hover:scale-110" />
                </button>
              ) : (
                <button
                  onClick={() => setShowInfo(true)}
                  disabled={loading}
                  className="group mt-6 flex w-full items-center justify-center gap-2 rounded-[calc(12px*var(--nv-r-scale,1))] bg-[#977e43] px-7 py-4 text-[1rem] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#836c39] nv-shadow disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Starting consultation…</>
                  ) : (
                    <>Start Your Consultation <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></>
                  )}
                </button>
              )}
              {err && !isKiosk && <p className="mt-2 text-center text-[0.84rem] font-medium text-primary">{err}</p>}

              {/* Assurance tiles — the promises that used to sit in the standalone
                  band below the hero, which the comp folds in here instead. */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                {(otc ? HERO_ASSURANCES_OTC : HERO_ASSURANCES).map((a) => (
                  <div key={a.l1} className="rounded-[calc(12px*var(--nv-r-scale,1))] bg-surface-2 px-3 py-4 text-center">
                    <span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-surface text-accent">
                      <a.icon size={16} strokeWidth={1.8} />
                    </span>
                    <span className="mt-2.5 block text-[0.78rem] leading-tight text-muted">
                      {a.l1}
                      <br />
                      {a.l2}
                    </span>
                  </div>
                ))}
              </div>

              {/* Shipping and vial size lost their pills when the price row went to
                  the comp's FROM / price pairing — kept here as a plain line so the
                  facts don't disappear off the page. Size leads: the delivery
                  sentence ends on a full stop and cannot take a trailing clause. */}
              <p className="mt-4 text-[0.84rem] leading-relaxed text-muted">
                {active.size ? `${active.size} · ` : ""}
                {active.shipping}
              </p>
              {/* The "requires evaluation" and "use only as directed" lines that
                  sat here were removed on 2026-09-09 at the client's request.
                  Both came from the 2026-09-08 compliance script (global items 5
                  and 6), so restoring them is a two-line change if the
                  compliance owner wants them back. */}
            </div>
          </Reveal>
        </div>

        {/* Compounded notice only. The FDA disclaimer card that sat beside it
            was removed on 2026-09-09 at the client's request; the disclaimer
            text itself still lives on the records in products.jsx, so it is a
            card away from coming back. */}
        {hasCompounded && (
          <div className="mt-8 grid grid-cols-1 items-stretch gap-4">
            <div className="flex gap-3.5 rounded-2xl border border-line bg-surface-2/60 p-5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <FlaskConical size={16} />
              </span>
              <div>
                <h4 className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.13em] text-ink">Compounded drug notice</h4>
                <CompoundedDisclaimer className="mt-1.5" />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* NAD+ only — every line of copy names it. Matched on the product name so
          the injection, its dose ladder and the sublingual tablet all carry it. */}
      {/* NAD+ editorial, split by format. The sublingual tablet gets its own
          block; May Support and Provider-Directed are the injection's — their
          copy and photography are about an injected treatment. */}
      {/* The decline graph runs on both NAD+ formats, straight after the
          product image, per the update. Everything below it is the injection's
          own editorial. */}
      {isNad && <NadSupport />}
      {isNad && isSublingual && <NadSublingual />}
      {isNad && !isSublingual && <NadDirected />}

      {/* Glutathione's own editorial. Same contract as the NAD+ blocks: gated on
          the product name, and its CTA lands on the intake this page's own Get
          Started uses rather than a second entry point. */}
      {isGlutathione && <GlutathioneSections startTo={`${productPath(product)}?start=1`} />}
      {isScreamCream && <ScreamCreamSections startTo={`${productPath(product)}?start=1`} />}
      {isSermorelin && <SermorelinSections startTo={`${productPath(product)}?start=1`} />}
      {isLdn && <LdnSections startTo={`${productPath(product)}?start=1`} />}
      {isLuminance && <LuminanceSections startTo={`${productPath(product)}?start=1`} />}
      {isOlympusPeak && <OlympusSections startTo={`${productPath(product)}?start=1`} />}
      {isBremelanotideInjection && <BremelanotideSections startTo={`${productPath(product)}?start=1`} />}
      {isBremelanotideNasal && (
        <BremelanotideNasalSections startTo={`${productPath(product)}?start=1`} />
      )}
      {isLipoC && <LipoCSections startTo={`${productPath(product)}?start=1`} />}

      <ProductMechanism product={active} />
      {product.howItWorks && (
        <section className="bg-surface-2 py-[clamp(2.5rem,5vw,5.5rem)]">
          <div className="mx-auto max-w-[1180px] px-5 md:px-10">
            <Reveal className="mx-auto max-w-[60ch] text-center">
              <span className="nv-eyebrow">How it works</span>
              <h2 className="mt-3 text-[clamp(1.6rem,3.4vw,2.4rem)] font-extrabold leading-tight">{product.howItWorks.title}</h2>
              <p className="mt-3 text-[1.02rem] leading-relaxed text-muted">{product.howItWorks.description}</p>
            </Reveal>
            <div className="mt-12 grid gap-5 sm:grid-cols-3">
              {product.howItWorks.steps.map((s, i) => (
                <Reveal as="div" key={i} delay={(i % 3) * 0.08}>
                  <div className="relative h-full rounded-[calc(22px*var(--nv-r-scale,1))] border border-line bg-surface p-7 nv-shadow">
                    <span className="absolute right-6 top-6 font-mono text-[1.1rem] font-bold text-line-strong">0{i + 1}</span>
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-on-primary">{s.icon}</span>
                    <h3 className="mt-5 font-display text-[1.15rem] font-bold">{s.title}</h3>
                    <p className="mt-2 text-[0.92rem] leading-relaxed text-muted">{s.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
      <div
        className="pb-[clamp(3rem,6vw,5rem)] pt-[clamp(2.5rem,5vw,4rem)]"
        style={{ background: "#fbfaf7" }}
      >
      {/* ===== Safety ===== */}
      {active.safety && (
        <section className="mx-auto mb-[clamp(3rem,6vw,5rem)] max-w-[1180px] px-5 md:px-10">
          {/* Typeset as running copy rather than a bordered callout (2026-08-31).
              The tinted card, the rule around it and the alert icon together read
              as a highlight — a box the eye files as promotional and skips. This
              wording is part of the product's own description, so it is set like
              the rest of the description and simply sits in the page. */}
          <h3 className="font-display text-[1.05rem] font-bold text-ink">Important safety information</h3>
          <p className="mt-2 max-w-[86ch] text-[0.9rem] leading-relaxed text-muted">{active.safety}</p>
        </section>
      )}

      {/* ===== Why Nova MDK ===== */}
      {!otc && <ProductWhy />}
      <section className="mx-auto max-w-[1440px] px-4 py-[clamp(2.5rem,5vw,4.5rem)] md:px-6">
        <Reveal>
          <ProductFaq product={active} otc={otc} />
        </Reveal>
      </section>
      <section className="mx-auto max-w-[1180px] px-5 md:px-10">
        <Reveal>
          <div className="relative overflow-hidden rounded-[calc(28px*var(--nv-r-scale,1))] border border-line bg-[#fbfaf7] px-6 py-[clamp(2.4rem,5vw,3.6rem)] text-center text-ink">
            <div className="relative">
              <h2 className="mx-auto max-w-[22ch] font-display text-[clamp(1.6rem,3.4vw,2.4rem)] font-extrabold leading-tight">
                {otc ? "Add " : "Start consultation for "}
                {product.name.split("—")[0].split("(")[0].split("/")[0].trim()}
                {otc ? " to your routine." : "."}
              </h2>
              <p className="mx-auto mt-3 max-w-[46ch] text-[1rem] text-muted">
                {otc
                  ? "No prescription or intake required. Message the care team and we'll get it on its way — and tell you how it pairs with your protocol."
                  : "A licensed provider reviews your intake and confirms the right fit. You pay only if a provider determines that a prescription is appropriate."}
              </p>
              {otc ? (
                <Link
                  to="/contact"
                  className="group mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-[1rem] font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-deep nv-shadow-lg"
                >
                  Ask about this supplement <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              ) : isKiosk ? (
                <button
                  onClick={() => setShowQR(true)}
                  className="group mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-[1rem] font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-deep nv-shadow-lg"
                >
                  Start consultation <QrCode size={17} className="transition-transform group-hover:scale-110" />
                </button>
              ) : (
                <button
                  onClick={() => setShowInfo(true)}
                  disabled={loading}
                  className="group mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-[1rem] font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-deep nv-shadow-lg disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Starting…</>
                  ) : (
                    <>Start consultation <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></>
                  )}
                </button>
              )}
              {err && !isKiosk && <p className="mt-3 text-[0.84rem] font-medium text-on-panel/80">{err}</p>}
            </div>
          </div>
        </Reveal>
      </section>

      {/* Moved below the consultation CTA on 2026-09-09: the client wants the
          four-step path to close the page rather than interrupt it. */}
      {!otc && <ProductJourney product={active} />}
      </div>
      {otc && related.length > 0 && (
        <section className="mx-auto mb-[clamp(3.5rem,7vw,6rem)] max-w-[1180px] px-5 md:px-10">
          <h2 className="mb-6 text-[clamp(1.4rem,3vw,2rem)] font-extrabold">{relatedHeading}</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.id}
                to={productPath(r)}
                className="group rounded-[calc(22px*var(--nv-r-scale,1))] border border-line bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:nv-shadow-lg"
              >
                <div className="pointer-events-none flex h-32 items-center justify-center rounded-[calc(16px*var(--nv-r-scale,1))] bg-linear-to-br from-surface to-surface-2">
                  <img src={r.img} alt={r.name} loading="lazy" className="h-[88%] object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <h3 className="text-[0.98rem] font-bold leading-snug">{displayTitle(r)}</h3>
                  <span className="shrink-0 text-[0.9rem] font-bold text-primary">{priceLabel(r)}</span>
                </div>
                <span className="mt-2 inline-flex items-center gap-1 text-[0.82rem] font-semibold text-muted transition-colors group-hover:text-accent">
                  Shop now <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {showQR && (
        <KioskQrModal
          product={product}
          loading={loading}
          err={err}
          onClose={() => setShowQR(false)}
          onContinueHere={() => {
            setShowQR(false);
            setShowInfo(true);
          }}
        />
      )}

      {showInfo && (
        <PatientInfoModal
          loading={loading}
          err={err}
          onClose={() => setShowInfo(false)}
          onSubmit={startVisit}
        />
      )}

      <Footer />
    </main>
  );
}

const fmtCountdown = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, "0")}`;

/* Kiosk hand-off — two ways to continue: scan to finish privately on your own
   phone (recommended), or continue right here on the public kiosk. Auto-closes
   after 60s so the screen resets for the next patient. */
function KioskQrModal({ product, onClose, onContinueHere, loading = false, err = "" }) {
  const qrSrc = product.qrImg || `/qr/${product.id}.avif`;
  const [imgError, setImgError] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  /* undefined until the placement has actually been read, so the code is drawn
     once. Resolving it to null first would paint an untagged QR for a frame,
     which is long enough for someone to scan the wrong link. */
  const [locId, setLocId] = useState(undefined);
  useEffect(() => setLocId(readKioskLocation()), []);

  /* Counted once the placement is known, so it's attributable. The gap between
     this and kiosk_scan is the number worth watching: people who stood at the
     kiosk, saw the code and walked off without scanning. "unset" surfaces a
     kiosk that lost its location, which otherwise fails silently. */
  useEffect(() => {
    if (locId === undefined) return;
    track(EVENTS.KIOSK_QR_SHOWN, {
      kiosk_location: locId || "unset",
      treatment: product.name,
      category: product.categorySlug,
    });
  }, [locId, product.id]);

  // Don't auto-close while a "continue here" request is in flight.
  useEffect(() => {
    if (loading) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [loading]);
  useEffect(() => {
    if (secondsLeft <= 0) onClose();
  }, [secondsLeft, onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[120] grid place-items-center bg-ink/65 p-6 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[440px] rounded-[calc(28px*var(--nv-r-scale,1))] border border-line bg-surface p-6 text-center nv-shadow-lg md:p-8"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <X size={18} />
        </button>

        <h3 className="mt-1 font-display text-[1.4rem] font-extrabold leading-tight">How would you like to continue?</h3>
        <p className="mx-auto mt-1.5 max-w-[34ch] text-[0.86rem] text-muted">
          Finishing on <span className="font-semibold text-ink">{product.name}</span>.
        </p>

        {/* Recommended — scan to your phone */}
        <div className="relative mt-6 rounded-2xl border-2 border-primary/30 bg-surface-2/40 p-5">
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-on-primary">
            Recommended
          </span>
          {/* Drawn here rather than served as a file so the link can carry this
              kiosk's placement. Falls back to the saved image, then to the
              build-time placeholder, so a scan is never a blank square. */}
          <div className="mx-auto grid h-[190px] w-[190px] place-items-center overflow-hidden rounded-xl border border-line bg-white p-2.5">
            {locId === undefined ? null : !qrFailed ? (
              <KioskQr value={scanUrl(product, locId)} onError={() => setQrFailed(true)} />
            ) : imgError ? (
              <div className="flex flex-col items-center gap-2 text-muted">
                <QrCode size={48} strokeWidth={1.4} />
                <span className="px-3 text-[0.68rem] leading-snug">Add a QR at <code className="text-ink">{qrSrc}</code></span>
              </div>
            ) : (
              <img
                src={qrSrc}
                alt={`QR code to continue ${product.name} on your phone`}
                onError={() => setImgError(true)}
                className="h-full w-full object-contain"
              />
            )}
          </div>
          <h4 className="mt-3.5 font-display text-[1.08rem] font-bold leading-tight">Scan to continue on your phone</h4>
          <span className="mx-auto mt-2 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[0.74rem] font-medium text-muted">
            <Lock size={12} className="text-primary" /> Private to your own device
          </span>
        </div>

        {/* divider */}
        <div className="my-4 flex items-center gap-3 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-muted">
          <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
        </div>

        {/* Continue here on the kiosk */}
        <button
          onClick={onContinueHere}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-line-strong bg-surface px-6 py-3 text-[0.95rem] font-semibold text-ink transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-surface-2 disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {loading ? (
            <><Loader2 size={15} className="animate-spin" /> Starting consultation…</>
          ) : (
            "Continue here on the kiosk"
          )}
        </button>
        {err && (
          <p className="mx-auto mt-2.5 max-w-[34ch] rounded-lg bg-surface-2 px-3 py-2 text-[0.74rem] leading-snug text-muted">
            {err}
          </p>
        )}

        <p className="mt-5 border-t border-line pt-3 text-[0.72rem] text-muted">
          This screen resets in <span className="font-semibold text-ink">{fmtCountdown(secondsLeft)}</span>
        </p>
      </div>
    </div>
  );
}

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah",
  "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
];


function PatientInfoModal({ onClose, onSubmit, loading = false, err = "" }) {
  useLockBodyScroll(); // mobile: page behind the modal must not scroll
  const [step, setStep] = useState(0); // 0 = email gate, then steps 1–3
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone_number: "",
    dob: "", gender: "",
    street: "", city: "", state: "", zip: "",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setVal = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const [consent, setConsent] = useState({ telehealth: false, terms: false });
  const [consentAt, setConsentAt] = useState("");
  const toggleConsent = (k) => () => setConsent((c) => ({ ...c, [k]: !c[k] }));
  const consentValid = consent.telehealth && consent.terms;
  const consentRecord = (at) => ({
    telehealth_informed_consent: consent.telehealth,
    terms_and_privacy: consent.terms,
    accepted_at: at || consentAt,
    documents: {
      telehealth_consent: "/legal/telehealth-consent",
      terms_and_conditions: "/legal/terms-and-conditions",
      notice_of_privacy_practices: "/legal/hipaa-notice-of-privacy-practices",
    },
  });

  const emailValid = /^\S+@\S+\.\S+$/.test(form.email.trim());
  const step1Valid =
    form.first_name.trim().length > 0 &&
    form.last_name.trim().length > 0 &&
    form.phone_number.replace(/\D/g, "").length >= 10;

  /* The Terms already require 18, so catching it here saves a minor from filling
     in an address and being turned away by the questionnaire afterwards. */
  const tooYoung = form.dob && !isAdult(form.dob);
  const step2Valid =
    form.dob &&
    !tooYoung &&
    (form.gender === "1" || form.gender === "2");

  /* A blocked state fails validation like any other bad field, which disables
     Continue. Checked on form.state rather than at selection time because the
     address autocomplete can set it too, without the picker ever being opened. */
  const step3Valid =
    form.street.trim().length > 0 &&
    form.city.trim().length > 0 &&
    form.state &&
    !isBlockedState(form.state) &&
    /^\d{5}(-\d{4})?$/.test(form.zip.trim());

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (step === 0) {
      if (!emailValid || !consentValid) return;
      const at = new Date().toISOString();
      setConsentAt(at);
      const res = await onSubmit({ email: form.email.trim(), consent: consentRecord(at) });
      if (res?.needProfile) setStep(1);
      return;
    }
    if (step === 1) {
      if (step1Valid) setStep(2);
      return;
    }
    if (step === 2) {
      if (step2Valid) setStep(3);
      return;
    }
    if (!step3Valid) return;
    onSubmit({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone_number: form.phone_number.trim(),
      date_of_birth: form.dob, // <input type="date"> emits Y-m-d — MDI's format
      gender: Number(form.gender), // MDI: 1 = male, 2 = female
      address: {
        address: form.street.trim(),
        zip_code: form.zip.trim(),
        city_name: form.city.trim(),
        state_name: form.state,
      },
      consent: consentRecord(), // agreed at step 0; stored on the patient file
    });
  };

  const inputCls =
    "w-full rounded-xl border border-line bg-bg px-3.5 py-3 text-[0.95rem] text-ink placeholder:text-muted/60 focus:border-primary focus:outline-none";
  const labelCls = "flex flex-col gap-1 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-muted";
  const TITLES = {
    0: ["What's your email address?", ""],
    1: ["First, a few details", "So your care team can reach you about your visit."],
    2: ["About you", "These go on your private patient file — your intake will skip them."],
    // Says why rather than just forbidding it: a bare "no PO boxes" reads as an
    // arbitrary rule, and the carrier restriction is the actual reason.
    3: ["Where should we deliver?", "A street address"],
  };

  /* Takes over the modal rather than sitting inside the form: once we know we
     can't serve this address there's nothing left to fill in, and leaving the
     fields up invites the patient to keep trying. Sits below every hook so the
     call order can't shift when it trips. */
  if (isBlockedState(form.state)) {
    return (
      <div onClick={onClose} data-lenis-prevent className="fixed inset-0 z-120 flex overflow-y-auto bg-ink/65 p-6 backdrop-blur-sm">
        <div
          onClick={(e) => e.stopPropagation()}
          role="alertdialog"
          aria-labelledby="nv-unavailable"
          className="relative m-auto w-full max-w-110 rounded-3xl border border-line bg-surface p-6 text-center nv-shadow-lg md:p-8"
        >
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <MapPin size={22} />
          </span>
          <h3 id="nv-unavailable" className="mt-3 font-display text-[1.35rem] font-extrabold leading-tight">
            NovaMDK isn&rsquo;t currently available in {form.state}.
          </h3>
          <p className="mx-auto mt-2 max-w-[38ch] text-[0.9rem] leading-relaxed text-muted">
            We&rsquo;re working to expand access. Please check back for future availability.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[0.98rem] font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-deep nv-shadow"
          >
            Return to NovaMDK
          </button>
        </div>
      </div>
    );
  }

  return (
    /* data-lenis-prevent: Lenis intercepts touchmove globally, so without it a
       modal taller than the phone viewport can't be scrolled at all. */
    <div onClick={onClose} data-lenis-prevent className="fixed inset-0 z-120 flex overflow-y-auto bg-ink/65 p-6 backdrop-blur-sm">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative m-auto w-full max-w-110 rounded-3xl border border-line bg-surface p-6 nv-shadow-lg md:p-8"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <X size={18} />
        </button>

        <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <UserRound size={22} />
        </span>
        <h3 className="mt-3 font-display text-[1.35rem] font-extrabold leading-tight">{TITLES[step][0]}</h3>
        {TITLES[step][1] && <p className="mt-1 text-[0.86rem] text-muted">{TITLES[step][1]}</p>}
        {step > 0 && (
          <p className="mt-2 font-mono text-[0.64rem] uppercase tracking-[0.16em] text-primary">Step {step} of 3</p>
        )}

        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          {step === 0 && (
            <>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="Email address"
                autoComplete="email"
                autoFocus
                className={inputCls}
              />
              <div className="mt-1 flex flex-col gap-2.5">
                <ConsentCheck checked={consent.telehealth} onToggle={toggleConsent("telehealth")}>
                  I consent to receive care via telehealth and agree to the{" "}
                  <ConsentLink href="/legal/telehealth-consent">Telehealth Consent</ConsentLink>.
                </ConsentCheck>
                <ConsentCheck checked={consent.terms} onToggle={toggleConsent("terms")}>
                  I agree to the{" "}
                  <ConsentLink href="/legal/terms-and-conditions">Terms &amp; Conditions</ConsentLink>{" "}
                  and{" "}
                  <ConsentLink href="/legal/hipaa-notice-of-privacy-practices">Notice of Privacy Practices</ConsentLink>,
                  and authorize Nova MDK to process my health information to provide care.
                </ConsentCheck>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <input value={form.first_name} onChange={set("first_name")} placeholder="First name" autoComplete="given-name" className={inputCls} />
                <input value={form.last_name} onChange={set("last_name")} placeholder="Last name" autoComplete="family-name" className={inputCls} />
              </div>
              <input type="tel" value={form.phone_number} onChange={set("phone_number")} placeholder="Mobile number" autoComplete="tel" className={inputCls} />
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className={labelCls}>
                  Date of birth
                  <DatePicker value={form.dob} onChange={setVal("dob")} placeholder="Select…" />
                </label>
                <label className={labelCls}>
                  Sex at birth
                  <NvSelect
                    value={form.gender}
                    onChange={setVal("gender")}
                    placeholder="Select…"
                    options={[{ value: "1", label: "Male" }, { value: "2", label: "Female" }]}
                  />
                </label>
              </div>
              {/* Stated plainly rather than capping the calendar at 2008: a year
                  that simply isn't there reads as a broken picker. */}
              {tooYoung && (
                <p
                  role="alert"
                  className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-3.5 py-3 text-[0.82rem] leading-relaxed text-amber-700"
                >
                  You need to be {MIN_AGE} or older to start a visit with Nova MDK.
                </p>
              )}
            </>
          )}

          {step === 3 && (
            <>
              {/* Street with live suggestions — picking one fills city/state/ZIP too */}
              <AddressAutocomplete
                value={form.street}
                onChange={set("street")}
                onPick={({ street, city, state, zip }) =>
                  setForm((f) => ({
                    ...f,
                    street: street || f.street,
                    city: city || f.city,
                    state: US_STATES.includes(state) ? state : f.state,
                    zip: zip || f.zip,
                  }))
                }
                className={inputCls}
              />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.city} onChange={set("city")} placeholder="City" autoComplete="address-level2" className={inputCls} />
                <input value={form.zip} onChange={set("zip")} placeholder="ZIP code" autoComplete="postal-code" inputMode="numeric" className={inputCls} />
              </div>
              {/* Blocked states stay in the list rather than being removed from
                  it: a missing state reads as a broken form. Choosing one swaps
                  this whole modal for the unavailable notice below. */}
              <NvSelect value={form.state} onChange={setVal("state")} placeholder="State…" options={US_STATES} />
            </>
          )}

          <div className="mt-1 flex gap-2.5">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 rounded-full border border-line px-5 py-3.5 text-[0.92rem] font-semibold text-muted transition-colors hover:border-line-strong hover:text-ink disabled:opacity-60"
              >
                <ArrowLeft size={15} /> Back
              </button>
            )}
            <button
              type="submit"
              disabled={(step === 0 ? !emailValid || !consentValid : step === 1 ? !step1Valid : step === 2 ? !step2Valid : !step3Valid) || loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[0.98rem] font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-deep nv-shadow disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> {step === 0 ? "Checking your records…" : "Preparing your intake…"}</>
              ) : step < 3 ? (
                <>Continue <ArrowRight size={16} /></>
              ) : (
                <>Continue to intake <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        </form>

        {err && (
          <p className="mt-2.5 rounded-lg bg-surface-2 px-3 py-2 text-center text-[0.74rem] leading-snug text-muted">{err}</p>
        )}

        <p className="mt-3 flex items-center justify-center gap-1.5 text-[0.74rem] font-medium text-muted">
          <Lock size={12} className="text-primary" /> Encrypted &amp; used only for your medical visit
        </p>
      </div>
    </div>
  );
}

/* A required-consent checkbox row. Legal links open in a new tab so tapping one
   never navigates the patient out of the modal mid-consent. */
function ConsentCheck({ checked, onToggle, children }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="checkbox"
      aria-checked={checked}
      className="flex items-start gap-2.5 text-left text-[0.8rem] leading-snug text-muted"
    >
      <span
        className={`mt-px grid h-4.5 w-4.5 shrink-0 place-items-center rounded-md border transition-colors ${
          checked ? "border-primary bg-primary text-on-primary" : "border-line-strong bg-bg"
        }`}
      >
        {checked && <Check size={12} strokeWidth={3} />}
      </span>
      <span>{children}</span>
    </button>
  );
}

function ConsentLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="font-semibold text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
    >
      {children}
    </a>
  );
}

/* Themed dropdown — same pattern as Contact's TopicSelect: a button + branded
   menu instead of the unstylable native <select>. Options are strings or
   {value, label}; long lists scroll. */
function NvSelect({ value, onChange, options, placeholder = "Select…" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, []);

  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const current = opts.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-bg px-3.5 py-3 text-left text-[0.95rem] transition-colors focus:outline-none ${
          open ? "border-primary ring-2 ring-primary/15" : "border-line"
        } ${current ? "text-ink" : "text-muted/60"}`}
      >
        <span className="truncate">{current ? current.label : placeholder}</span>
        <ChevronDown size={17} className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          data-lenis-prevent
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-56 overflow-y-auto rounded-xl border border-line bg-surface p-1.5 nv-shadow-lg nv-scroll"
        >
          {opts.map((o) => {
            const on = o.value === value;
            return (
              <li key={o.value} role="option" aria-selected={on}>
                <button
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[0.92rem] transition-colors ${
                    on ? "bg-surface-2 font-semibold text-primary" : "text-ink hover:bg-surface-2"
                  }`}
                >
                  {o.label}
                  {on && <Check size={14} className="text-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* Street-address input with live suggestions (OpenStreetMap/Nominatim — free,
   no API key). Picking a suggestion also fills city, state, and ZIP. Swap the
   fetch for Google Places when an API key lands. */
function AddressAutocomplete({ value, onChange, onPick, className }) {
  const [sugs, setSugs] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => { document.removeEventListener("mousedown", onDoc); clearTimeout(timer.current); };
  }, []);

  const onInput = (e) => {
    onChange(e);
    const q = e.target.value.trim();
    clearTimeout(timer.current);
    if (q.length < 4) { setSugs([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=us&limit=5&q=${encodeURIComponent(q)}`
        );
        const list = await r.json();
        setSugs(Array.isArray(list) ? list : []);
        setOpen(Array.isArray(list) && list.length > 0);
      } catch {
        /* suggestions are best-effort — typing manually always works */
      }
    }, 350);
  };

  const pick = (s) => {
    const a = s.address || {};
    onPick({
      street: [a.house_number, a.road].filter(Boolean).join(" "),
      city: a.city || a.town || a.village || a.hamlet || "",
      state: a.state || "",
      zip: (a.postcode || "").slice(0, 5),
    });
    setOpen(false);
    setSugs([]);
  };

  return (
    <div ref={ref} className="relative">
      <input
        value={value}
        onChange={onInput}
        placeholder="Street address"
        autoComplete="off"
        className={className}
      />
      {open && (
        <ul data-lenis-prevent className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-56 overflow-y-auto rounded-xl border border-line bg-surface p-1.5 nv-shadow-lg nv-scroll">
          {sugs.map((s) => (
            <li key={s.place_id}>
              <button
                type="button"
                onClick={() => pick(s)}
                className="flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left text-[0.88rem] leading-snug text-ink transition-colors hover:bg-surface-2"
              >
                <MapPin size={14} className="mt-0.5 shrink-0 text-primary" />
                <span className="min-w-0">{s.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
