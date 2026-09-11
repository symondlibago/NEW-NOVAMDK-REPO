// WCAG 2.1 contrast helpers — used by the Design Studio readability check.

function hexToRgb(hex) {
  const s = String(hex).trim();
  const m6 = s.match(/^#?([0-9a-fA-F]{6})$/);
  const m3 = s.match(/^#?([0-9a-fA-F]{3})$/);
  let h = m6 ? m6[1] : m3 ? m3[1].split("").map((c) => c + c).join("") : null;
  if (!h) return null;
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function relLuminance({ r, g, b }) {
  const lin = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Contrast ratio (1–21) between two hex colors, or null if unparseable. */
export function contrastRatio(a, b) {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return null;
  const la = relLuminance(ra);
  const lb = relLuminance(rb);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/** Maps a ratio to a WCAG grade. `large` relaxes thresholds for big text. */
export function grade(ratio, large = false) {
  if (ratio == null) return { label: "—", ok: null };
  const aa = large ? 3 : 4.5;
  const aaa = large ? 4.5 : 7;
  if (ratio >= aaa) return { label: "AAA", ok: true };
  if (ratio >= aa) return { label: "AA", ok: true };
  return { label: "Low", ok: false };
}
