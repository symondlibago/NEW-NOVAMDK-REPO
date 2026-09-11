// Compact, URL-safe encode/decode of a full Design Studio config so a chosen
// look can be shared as a link. Config is ASCII-only (ids + hex), so plain
// base64 is sufficient; we make it URL-safe by swapping +/ and dropping pad.

export function encodeTheme(cfg) {
  try {
    const b64 = btoa(JSON.stringify(cfg));
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    return "";
  }
}

export function decodeTheme(str) {
  try {
    let b64 = String(str).replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}
