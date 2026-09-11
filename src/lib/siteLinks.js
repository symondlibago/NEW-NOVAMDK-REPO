export const LEGAL_PAGES = [
  ["terms-and-conditions", "Terms of Service"],
  ["privacy-policy", "Privacy Policy"],
  ["telehealth-consent", "Telehealth Consent"],
  ["hipaa-notice-of-privacy-practices", "HIPAA Notice of Privacy Practices"],
  ["consumer-health-data", "Consumer Health Data Privacy Notice"],
];

// Standalone marketing/tool pages. `priority` feeds sitemap.xml.
export const CONTENT_PAGES = [
  {
    path: "/weight-loss-calculator",
    title: "Weight Loss Calculator: Check Your BMI",
    description:
      "Free weight loss calculator: check your BMI, see which category it falls into, and find out whether treatment may be an option to discuss with a licensed provider.",
    priority: "0.8",
  },
  {
    path: "/sitemap",
    // No brand name here — both the prerenderer and <Seo> append "| Nova MDK".
    title: "Sitemap: All Treatments & Pages",
    description:
      "Browse every page on Nova MDK: all treatments, treatment categories, tools and policies, in one place.",
    priority: "0.4",
  },
];
