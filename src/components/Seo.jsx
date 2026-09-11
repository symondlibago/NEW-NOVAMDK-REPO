import { useEffect } from "react";
import { SITE_URL, absoluteUrl } from "../lib/absoluteUrl";

const SITE_NAME = "Nova MDK";
const DEFAULT_TITLE = "Nova MDK | Premium Telehealth & Longevity";
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export default function Seo({ title, description, path, image, noindex = false, jsonLd }) {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : null;

  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
    const url = `${SITE_URL}${path ?? window.location.pathname}`;

    document.title = fullTitle;
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:url", url);
    setMeta("property", "og:image", absoluteUrl(image) || DEFAULT_IMAGE);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    if (description) {
      setMeta("name", "description", description);
      setMeta("property", "og:description", description);
    }

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    let script;
    if (jsonLdKey) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.text = jsonLdKey;
      document.head.appendChild(script);
    }
    return () => script?.remove();
  }, [title, description, path, image, noindex, jsonLdKey]);

  return null;
}
