import { productPath } from "./slug";
import { SITE_URL } from "./absoluteUrl";

export const KIOSK_LOCATIONS = [
  { id: "costa-mesa", label: "Costa Mesa, CA" },
  { id: "irvine", label: "Irvine, CA" },
  { id: "newport-beach", label: "Newport Beach, CA" },
  { id: "huntington-beach", label: "Huntington Beach, CA" },
  { id: "santa-ana", label: "Santa Ana, CA" },
  { id: "anaheim", label: "Anaheim, CA" },
  { id: "tustin", label: "Tustin, CA" },
  { id: "fullerton", label: "Fullerton, CA" },
  { id: "long-beach", label: "Long Beach, CA" },
  { id: "mission-viejo", label: "Mission Viejo, CA" },
];

const STORAGE_KEY = "nv-kiosk-location";

/* Deliberately not "kiosk": that param also forces the kiosk layout, and this
   one gets stripped from the address bar the moment it's read, on a phone that
   should be rendering the ordinary mobile site. */
export const SCAN_PARAM = "from";

export const locationById = (id) => KIOSK_LOCATIONS.find((l) => l.id === id) || null;

// Derived from the id rather than the label so that relabelling a site (new
// suite number, mall renamed) can never quietly change what GHL already holds.
const titleCase = (id) =>
  id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
export function sourceLabel(id) {
  const found = locationById(id);
  if (!found) return null;
  return found.source || `Kiosk - ${titleCase(found.id)}`;
}

export const bootUrl = (id, origin) =>
  `${origin || (typeof window !== "undefined" ? window.location.origin : "")}/?kiosk=${id}`;

export function readKioskLocation() {
  if (typeof window === "undefined") return null;

  const fromUrl = new URLSearchParams(window.location.search).get("kiosk");
  if (fromUrl && locationById(fromUrl)) {
    saveKioskLocation(fromUrl);
    return fromUrl;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && locationById(stored) ? stored : null;
  } catch {
    return null; // private mode — the kiosk still works, scans just go unattributed
  }
}

export function saveKioskLocation(id) {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable; nothing to do but carry on */
  }
}

/* A phone can't open localhost, so a QR built from a dev origin is a dead
   square. Fall back to the canonical site there, but keep the real origin
   everywhere else so a Vercel preview builds scannable codes for itself. */
function publicOrigin() {
  if (typeof window === "undefined") return SITE_URL;
  const { origin, hostname } = window.location;
  return /^(localhost$|127\.|\[?::1)/.test(hostname) ? SITE_URL : origin;
}

/** The link a kiosk QR encodes: the product's intake, tagged with the kiosk
 *  that sent them. An unplaced kiosk simply omits the tag rather than sending
 *  a location nobody configured. */
export function scanUrl(product, locationId) {
  const params = new URLSearchParams({ start: "1" });
  if (locationId && locationById(locationId)) params.set(SCAN_PARAM, locationId);
  return `${publicOrigin()}${productPath(product)}?${params}`;
}

/* ---- the phone's side of the scan ---- */

const SCAN_KEY = "nv-scan-source";
// Attribution has to outlive the tab: people scan in the clinic and finish at
// home. Thirty days matches the window ad platforms use for the same job.
const SCAN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Bank the kiosk that sent this visitor. Returns the id when one was found,
 *  so the caller knows to tidy the address bar. */
export function captureScanSource() {
  if (typeof window === "undefined") return null;

  const from = new URLSearchParams(window.location.search).get(SCAN_PARAM);
  if (!from || !locationById(from)) return null;

  try {
    localStorage.setItem(SCAN_KEY, JSON.stringify({ id: from, t: Date.now() }));
  } catch {
    /* private mode — the visit still works, it just won't be attributed */
  }
  return from;
}

/** The kiosk this visitor arrived from, or null once the window has lapsed. */
export function readScanSource() {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(SCAN_KEY);
    if (!raw) return null;

    const { id, t } = JSON.parse(raw);
    if (!id || !locationById(id)) return null;
    if (!(Date.now() - t < SCAN_TTL_MS)) {
      localStorage.removeItem(SCAN_KEY);
      return null;
    }
    return id;
  } catch {
    return null; // unparseable or unavailable — treat as an ordinary visit
  }
}
