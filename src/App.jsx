import "./App.css";
import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import ThemeProvider from "./theme/ThemeContext";
import ScrollToTop from "./components/Nav/ScrollToTop";
import { trackPageView } from "./lib/analytics";
import SmoothScroll from "./components/SmoothScroll";
import RouteTransition from "./components/transition/RouteTransition";
import Platform from "./pages/Platform";
import KioskAttractLoop from "./components/kiosk/KioskAttractLoop";
import GhlPrewarm from "./components/ui/GhlPrewarm";
import { GHL_SURVEY_SRC } from "./lib/ghl";
const TreatmentsPage = lazy(() => import("./pages/Treatments"));
const SupplementsPage = lazy(() => import("./pages/Supplements"));
const ContactPage = lazy(() => import("./pages/Contact"));
const KioskPage = lazy(() => import("./pages/Kiosk"));
const Consult = lazy(() => import("./pages/Consult"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const IntakePage = lazy(() => import("./pages/Intake"));
const PatientPortalPage = lazy(() => import("./pages/PatientPortal"));
const WeightLossCalculatorPage = lazy(() => import("./pages/WeightLossCalculator"));
const SitemapPage = lazy(() => import("./pages/SitemapPage"));
const BlogPage = lazy(() => import("./pages/Blog"));
const BlogPostPage = lazy(() => import("./pages/BlogPost"));
const LegalPage = lazy(() => import("./components/LegalPage"));
const DesignStudio = lazy(() => import("./components/studio/DesignStudio"));

// Fires a single page_view per route change (pathname only — no query noise).
function RouteAnalytics() {
  const { pathname } = useLocation();
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <SmoothScroll />
        <ScrollToTop />
        <RouteAnalytics />
        <RouteTransition />
        <GhlPrewarm src={GHL_SURVEY_SRC} />
        <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Platform />} />
          <Route path="/treatments" element={<TreatmentsPage />} />
          {/* Renamed 2026-08-27 and again 2026-09-08. Kept as redirects because
              the catch-all below matches anything and would render the old slugs
              as an empty category — a heading with no products, which is worse
              than a 404. Anything already out there points at these: the previous
              sitemap, the QR codes, GHL campaigns.

              vercel.json carries the same set as real 301s, which is what Google
              follows. These client-side ones are the fallback for local dev and
              for any preview host that does not read that file. Both lists have
              to be edited together. */}
          <Route path="/treatments/mens-health" element={<Navigate to="/treatments/sexual-health" replace />} />
          <Route
            path="/treatments/unisex-sports-medicine"
            element={<Navigate to="/treatments/recovery-wellness" replace />}
          />
          <Route
            path="/treatments/sports-medicine"
            element={<Navigate to="/treatments/recovery-wellness" replace />}
          />
          <Route
            path="/treatments/unisex-anti-aging-rx"
            element={<Navigate to="/treatments/longevity" replace />}
          />
          <Route
            path="/treatments/unisex-skin-health"
            element={<Navigate to="/treatments/skin-health" replace />}
          />
          <Route path="/treatments/:goal" element={<TreatmentsPage />} />
          {/* Supplements hidden at client request (2026-08-15) — route still
              live, just unlinked and noindexed. Same treatment as the kiosk. */}
          <Route path="/supplements" element={<SupplementsPage />} />
          <Route path="/kiosk" element={<KioskPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/start" element={<Consult />} />
          <Route path="/start/:slug" element={<Consult />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/intake" element={<IntakePage />} />
          <Route path="/portal" element={<PatientPortalPage />} />
          <Route path="/weight-loss-calculator" element={<WeightLossCalculatorPage />} />
          <Route path="/sitemap" element={<SitemapPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/legal/sitemap" element={<Navigate to="/sitemap" replace />} />
          <Route path="/legal/:policyId" element={<LegalPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <DesignStudio />
        </Suspense>
        <KioskAttractLoop />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
