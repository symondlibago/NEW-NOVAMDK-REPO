import "./App.css";
import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import ThemeProvider from "./theme/ThemeContext";
import ScrollToTop from "./components/Nav/ScrollToTop";
import { trackPageView, applyRouteConsent } from "./lib/analytics";
import { captureAttribution } from "./lib/attribution";
import { trackPixelPageView } from "./lib/metaPixel";
import { trackGtmPageView } from "./lib/gtm";
import { applySupportChat } from "./lib/supportChat";
import SmoothScroll from "./components/SmoothScroll";
import RouteTransition from "./components/transition/RouteTransition";
import Platform from "./pages/Platform";
import KioskAttractLoop from "./components/kiosk/KioskAttractLoop";
import { useKioskApp } from "./lib/useKioskMode";
const TreatmentsPage = lazy(() => import("./pages/Treatments"));
const SupplementsPage = lazy(() => import("./pages/Supplements"));
const ContactPage = lazy(() => import("./pages/Contact"));
const KioskPage = lazy(() => import("./pages/Kiosk"));
const KioskScreen = lazy(() => import("./pages/KioskScreen"));
const Consult = lazy(() => import("./pages/Consult"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const IntakePage = lazy(() => import("./pages/Intake"));
const PatientPortalPage = lazy(() => import("./pages/PatientPortal"));
const InsightsPage = lazy(() => import("./pages/Insights"));
const WeightLossCalculatorPage = lazy(() => import("./pages/WeightLossCalculator"));
const SitemapPage = lazy(() => import("./pages/SitemapPage"));
const BlogPage = lazy(() => import("./pages/Blog"));
const BlogPostPage = lazy(() => import("./pages/BlogPost"));
const LegalPage = lazy(() => import("./components/LegalPage"));
const DesignStudio = lazy(() => import("./components/studio/DesignStudio"));
/* Dev-only checkout harness, so a payment can be tested without sitting through
   an MDI questionnaire.
 *
 * The import sits inside the DEV branch, not just the route: Vite replaces
 * import.meta.env.DEV with false when building, which lets Rollup drop the
 * dynamic import entirely. Guarding only the <Route> left the chunk on the CDN,
 * unreachable but shipped. */
const CheckoutTestPage = import.meta.env.DEV
  ? lazy(() => import("./pages/CheckoutTest"))
  : null;

/* Fires a single page_view per route change (pathname only — no query noise),
   and arms or silences GA4 first: the tag is only ever loaded on a public route,
   and is switched off outright while the patient is on /intake or /portal. */
function RouteAnalytics() {
  const { pathname } = useLocation();
  useEffect(() => {
    /* Where they came from, before anything else runs.
     *
     * First one wins and is never overwritten, so calling it on every route is
     * how a campaign pointed at a product page is caught as readily as one
     * pointed at the home page. It writes nothing for an untagged visit and
     * nothing clinical ever, so it is not gated on consent the way GA4 is: it
     * is the campaign that brought them, which the CRM is entitled to know
     * about its own lead. */
    captureAttribution();

    if (applyRouteConsent(pathname)) trackPageView(pathname);
    /* The Meta pixel keeps its own counsel about which routes it may run on,
       rather than riding on GA4's answer. It is held off the same private
       routes, and beyond that runs only on the handful of pages named in its
       own allowlist: home, contact and the blog. Everything else, the treatment
       categories and the product pages included, is off by default. */
    trackPixelPageView(pathname);
    /* Tag Manager, same again. Loaded on demand rather than pasted into
       index.html, so a tag John adds in GTM's UI cannot start running on a
       questionnaire page without anyone deciding that it should. */
    trackGtmPageView(pathname);
    /* The support chat belongs to the portal and nowhere else, least of all
       floating over the questionnaire. It shows, hides and loads itself from
       here on the strength of the path. */
    applySupportChat(pathname);
  }, [pathname]);
  return null;
}

/* The home route. A kiosk-sized display gets the in-store app, everything else
   gets the website (client, 2026-10-14: the kiosk should boot into it on its
   own rather than being sent to /kiosk/home).

   Only this route switches. The decision is client-side, which is what we want:
   scripts/prerender.mjs writes meta tags into the built shell and never renders
   React, so dist/index.html stays the real homepage and a crawler, which reads
   at phone or desktop width, never matches the query. `?site=1` opts a kiosk
   back into the website. */
function HomeScreen() {
  return useKioskApp() ? <KioskScreen /> : <Platform />;
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <SmoothScroll />
        <ScrollToTop />
        <RouteAnalytics />
        <RouteTransition />
        <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
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
          {/* The in-store kiosk app. Unlinked and noindexed; kiosks boot here. */}
          <Route path="/kiosk/home" element={<KioskScreen />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/start" element={<Consult />} />
          <Route path="/start/:slug" element={<Consult />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/intake" element={<IntakePage />} />
          <Route path="/portal" element={<PatientPortalPage />} />
          {/* Staff analytics. Unlinked and noindexed, but the real lock is on
              the API: hiding a React route protects nothing by itself. */}
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/weight-loss-calculator" element={<WeightLossCalculatorPage />} />
          <Route path="/sitemap" element={<SitemapPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/legal/sitemap" element={<Navigate to="/sitemap" replace />} />
          <Route path="/legal/:policyId" element={<LegalPage />} />
          {import.meta.env.DEV && (
            <Route path="/checkout-test" element={<CheckoutTestPage />} />
          )}
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
