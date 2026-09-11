import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { PALETTES, TYPOGRAPHIES, WEIGHTS, DEVICES, KIOSK_LAYOUTS, LETTER_SPACINGS, LINE_HEIGHTS, RADII, DEFAULTS, byId } from "./themes";
import { decodeTheme } from "./share";

const ThemeContext = createContext(null);
export const useTheme = () => useContext(ThemeContext);

const LS = {
  palette: "nv_palette",
  typography: "nv_type",
  weight: "nv_weight",
  italic: "nv_italic",
  letterSpacing: "nv_letter",
  lineHeight: "nv_line",
  radius: "nv_radius",
  paletteOverrides: "nv_palette_overrides",
  kioskLayout: "nv_kiosk_layout",
  studio: "nv_studio_unlocked",
};

const read = (k, fallback) => {
  try {
    const v = localStorage.getItem(k);
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
};

const readJSON = (k, fallback) => {
  try {
    const v = localStorage.getItem(k);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
};

function readUrlFlags() {
  if (typeof window === "undefined") return { isPreview: false, studioParam: null };
  const p = new URLSearchParams(window.location.search);
  const studioParam = p.has("studio") ? p.get("studio") || "1" : null;
  return { isPreview: p.has("preview"), studioParam };
}

export default function ThemeProvider({ children }) {
  const urlFlags = useMemo(readUrlFlags, []);

  const [paletteId, setPaletteId] = useState(() => read(LS.palette, DEFAULTS.palette));
  const [typographyId, setTypographyId] = useState(() => read(LS.typography, DEFAULTS.typography));
  const [weightId, setWeightId] = useState(() => read(LS.weight, DEFAULTS.weight));
  const [italic, setItalic] = useState(() => read(LS.italic, String(DEFAULTS.italic)) === "true");
  const [letterSpacingId, setLetterSpacingId] = useState(() => read(LS.letterSpacing, DEFAULTS.letterSpacing));
  const [lineHeightId, setLineHeightId] = useState(() => read(LS.lineHeight, DEFAULTS.lineHeight));
  const [radiusId, setRadiusId] = useState(() => read(LS.radius, DEFAULTS.radius));
  // Per-palette color overrides, keyed by palette id → { "--nv-*": "#hex" }.
  const [paletteOverrides, setPaletteOverridesState] = useState(() => readJSON(LS.paletteOverrides, {}));
  const [device, setDevice] = useState(DEFAULTS.device); // device preview is session-only
  // Persisted: the chosen tablet/kiosk hero layout drives the live kiosk view,
  // so a selection sticks across reloads on the kiosk itself.
  const [kioskLayoutId, setKioskLayoutId] = useState(() => read(LS.kioskLayout, DEFAULTS.kioskLayout));
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioUnlocked, setStudioUnlocked] = useState(() => {
    if (urlFlags.studioParam != null) return urlFlags.studioParam !== "0";
    return read(LS.studio, "false") === "true";
  });

  const isPreview = urlFlags.isPreview;

  const palette = byId(PALETTES, paletteId);
  const typography = byId(TYPOGRAPHIES, typographyId);
  const weight = byId(WEIGHTS, weightId);
  const letterSpacing = byId(LETTER_SPACINGS, letterSpacingId);
  const lineHeight = byId(LINE_HEIGHTS, lineHeightId);
  const radius = byId(RADII, radiusId);
  const kioskLayout = byId(KIOSK_LAYOUTS, kioskLayoutId);

  // Effective palette = base palette vars + any user customizations for it.
  const paletteVars = useMemo(
    () => ({ ...palette.vars, ...(paletteOverrides[palette.id] || {}) }),
    [palette, paletteOverrides]
  );

  // Persist the studio unlock the first time it's toggled via URL.
  useEffect(() => {
    if (urlFlags.studioParam != null) {
      try {
        localStorage.setItem(LS.studio, String(urlFlags.studioParam !== "0"));
      } catch {}
    }
  }, [urlFlags.studioParam]);

  // A keyboard escape hatch to reveal the studio on your own device:
  // press  g then s  (no input focused).
  useEffect(() => {
    let last = 0;
    const onKey = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || e.target?.isContentEditable) return;
      const now = Date.now();
      if (e.key === "g") last = now;
      else if (e.key === "s" && now - last < 600) {
        setStudioUnlocked(true);
        setStudioOpen(true);
        try { localStorage.setItem(LS.studio, "true"); } catch {}
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Apply the active theme to the document as CSS custom properties.
  useEffect(() => {
    const root = document.documentElement;
    const apply = (obj) => Object.entries(obj).forEach(([k, v]) => root.style.setProperty(k, v));
    apply(paletteVars);
    apply(typography.vars);
    apply(weight.vars);
    apply(letterSpacing.vars);
    apply(lineHeight.vars);
    apply(radius.vars);
    root.setAttribute("data-palette", palette.id);
    root.setAttribute("data-type", typography.id);
    root.setAttribute("data-italic", italic ? "true" : "false");
  }, [paletteVars, palette, typography, weight, italic, letterSpacing, lineHeight, radius]);

  const setPalette = (id) => { setPaletteId(id); try { localStorage.setItem(LS.palette, id); } catch {} };
  const setTypography = (id) => { setTypographyId(id); try { localStorage.setItem(LS.typography, id); } catch {} };
  const setWeight = (id) => { setWeightId(id); try { localStorage.setItem(LS.weight, id); } catch {} };
  const setItalicPersisted = (v) => { setItalic(v); try { localStorage.setItem(LS.italic, String(v)); } catch {} };
  const setLetterSpacing = (id) => { setLetterSpacingId(id); try { localStorage.setItem(LS.letterSpacing, id); } catch {} };
  const setLineHeight = (id) => { setLineHeightId(id); try { localStorage.setItem(LS.lineHeight, id); } catch {} };
  const setRadius = (id) => { setRadiusId(id); try { localStorage.setItem(LS.radius, id); } catch {} };
  const setKioskLayout = (id) => { setKioskLayoutId(id); try { localStorage.setItem(LS.kioskLayout, id); } catch {} };

  const persistOverrides = (next) => { try { localStorage.setItem(LS.paletteOverrides, JSON.stringify(next)); } catch {} };
  // Override one token on the *currently active* palette.
  const setPaletteColor = (key, valueRaw) => {
    setPaletteOverridesState((prev) => {
      const next = { ...prev, [palette.id]: { ...(prev[palette.id] || {}), [key]: valueRaw } };
      persistOverrides(next);
      return next;
    });
  };
  // Drop all customizations for one palette (defaults to active).
  const resetPaletteColors = (id = palette.id) => {
    setPaletteOverridesState((prev) => {
      const next = { ...prev };
      delete next[id];
      persistOverrides(next);
      return next;
    });
  };
  const clearAllPaletteColors = () => { setPaletteOverridesState({}); persistOverrides({}); };

  // Adopt a shared look from a `?theme=` link once, on first mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const code = new URLSearchParams(window.location.search).get("theme");
    if (!code) return;
    const cfg = decodeTheme(code);
    if (!cfg) return;
    if (cfg.p) setPalette(cfg.p);
    if (cfg.t) setTypography(cfg.t);
    if (cfg.w) setWeight(cfg.w);
    if (typeof cfg.i === "boolean") setItalicPersisted(cfg.i);
    if (cfg.ls) setLetterSpacing(cfg.ls);
    if (cfg.lh) setLineHeight(cfg.lh);
    if (cfg.r) setRadius(cfg.r);
    if (cfg.p && cfg.o && Object.keys(cfg.o).length) {
      setPaletteOverridesState((prev) => {
        const next = { ...prev, [cfg.p]: { ...(prev[cfg.p] || {}), ...cfg.o } };
        persistOverrides(next);
        return next;
      });
    }
  }, []);

  const value = {
    palette, typography, weight, italic, letterSpacing, lineHeight, radius,
    paletteVars, paletteOverrides,
    device, kioskLayout, studioOpen, studioUnlocked, isPreview,
    palettes: PALETTES, typographies: TYPOGRAPHIES, weights: WEIGHTS, devices: DEVICES,
    kioskLayouts: KIOSK_LAYOUTS,
    letterSpacings: LETTER_SPACINGS, lineHeights: LINE_HEIGHTS, radii: RADII,
    setPalette, setTypography, setWeight, setItalic: setItalicPersisted,
    setLetterSpacing, setLineHeight, setRadius,
    setPaletteColor, resetPaletteColors, clearAllPaletteColors,
    setDevice, setKioskLayout, setStudioOpen, setStudioUnlocked,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
