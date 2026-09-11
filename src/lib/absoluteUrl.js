export const SITE_URL = "https://www.novamdk.com";
export function absoluteUrl(src) {
  if (!src) return undefined;
  return /^https?:\/\//i.test(src) ? src : `${SITE_URL}${src}`;
}
