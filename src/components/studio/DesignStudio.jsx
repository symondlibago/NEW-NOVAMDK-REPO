import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette, Type, Italic, Check, X, Sparkles, RotateCcw,
  Smartphone, Tablet, Monitor, Eye, Lock, MoveHorizontal,
  Pipette, ChevronDown, Square, Share2, Link2, Code2, MapPin,
} from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { DEFAULTS } from "../../theme/themes";
import { contrastRatio, grade } from "../../lib/contrast";
import { encodeTheme } from "../../theme/share";
import {
  KIOSK_LOCATIONS, readKioskLocation, saveKioskLocation, sourceLabel, bootUrl,
} from "../../lib/kioskLocations";
import { KIOSK_MQ } from "../../lib/useKioskMode";

const EASE = [0.16, 1, 0.3, 1];

const DEVICE_ICON = {
  live: Eye,
  phone: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
  kiosk: Monitor,
};

/* ----------------------------- device preview ----------------------------- */
const BEZEL = 10; // frame border, drawn outside the declared viewport

function DevicePreview() {
  const { device, devices, setDevice, palette, typography, weight, italic, letterSpacing, lineHeight, radius, paletteOverrides, kioskLayout, kioskLayouts, setKioskLayout } = useTheme();
  const active = devices.find((d) => d.id === device);
  // The tablet frame carries the 2 portrait hero layout variants.
  const isTablet = active?.id === "tablet";
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!active?.w) return;
    const recalc = () => {
      const availW = window.innerWidth - 120;
      const availH = window.innerHeight - 150;
      setScale(Math.min(1, availW / (active.w + BEZEL * 2), availH / (active.h + BEZEL * 2)));
    };
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [active]);

  if (!active?.w) return null;

  const path = window.location.pathname;
  const overrideSig = JSON.stringify(paletteOverrides[palette.id] || {});
  const isKioskFrame = active?.id === "kiosk";
  const previewPath = isTablet ? "/" : path;
  const kioskQuery = isTablet || isKioskFrame ? `&kiosk=${kioskLayout.id}` : "";
  const frameKey = `${previewPath}|${palette.id}|${typography.id}|${weight.id}|${italic}|${letterSpacing.id}|${lineHeight.id}|${radius.id}|${overrideSig}|${isTablet || isKioskFrame ? kioskLayout.id : ""}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex flex-col items-center bg-[#0c0e10]/92 backdrop-blur-xl"
    >
      <div className="flex w-full items-center justify-between gap-4 px-6 py-4 text-white/90">
        <div className="flex items-center gap-2 text-[12px] font-medium tracking-wide">
          <Sparkles size={15} className="opacity-70" />
          Nova MDK · Device preview
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white/10 p-1">
          {devices.map((d) => {
            const Icon = DEVICE_ICON[d.id] || Monitor;
            return (
              <button
                key={d.id}
                onClick={() => setDevice(d.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] transition-colors ${
                  d.id === device ? "bg-white text-[#15171A]" : "text-white/70 hover:text-white"
                }`}
              >
                <Icon size={14} /> {d.name}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setDevice("live")}
          className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12px] text-white hover:bg-white/20"
        >
          <X size={14} /> Exit
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden">
        <div
          style={{ width: (active.w + BEZEL * 2) * scale, height: (active.h + BEZEL * 2) * scale }}
          className="relative"
        >
          <div
            style={{
              width: active.w,
              height: active.h,
              borderWidth: BEZEL,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
            className="box-content overflow-hidden rounded-[34px] border-[#1b1d20] bg-bg shadow-[0_40px_120px_-20px_rgba(0,0,0,0.7)]"
          >
            <iframe
              key={frameKey}
              title={`${active.name} preview`}
              src={`${previewPath}?preview=1${kioskQuery}`}
              className="h-full w-full border-0"
            />
          </div>
        </div>
      </div>
      <div className="pb-4 pt-2 text-[11px] text-white/40">
        {active.w} × {active.h}
      </div>
    </motion.div>
  );
}

/* ------------------------- hero layout thumbnail ------------------------- */
// A tiny portrait (9:16) wireframe of each tablet hero layout.
function KioskLayoutThumb({ id, on }) {
  const bar = on ? "bg-primary" : "bg-line-strong";
  const soft = on ? "bg-primary/35" : "bg-line";
  return (
    <span className={`grid h-12 w-7 shrink-0 gap-0.5 rounded-md p-1 ring-1 ${on ? "bg-primary/10 ring-primary/30" : "bg-surface-2 ring-line"}`}>
      {id === "overlay" && (
        <>
          {/* headline centered on a full-bleed media block, goal rows below */}
          <span className={`relative h-5 rounded-sm ${soft}`}>
            <span className={`absolute left-1/2 top-1/2 h-1 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-sm ${bar}`} />
          </span>
          <span className="grid flex-1 grid-rows-3 gap-0.5">
            {Array.from({ length: 3 }).map((_, i) => <span key={i} className={`rounded-sm ${soft}`} />)}
          </span>
        </>
      )}
      {id === "desktop" && (
        /* text column left, ambient media right — the desktop split */
        <span className="grid flex-1 grid-cols-2 gap-0.5">
          <span className="grid grid-rows-3 gap-0.5">
            <span className={`rounded-sm ${bar}`} />
            {Array.from({ length: 2 }).map((_, i) => <span key={i} className={`rounded-sm ${soft}`} />)}
          </span>
          <span className={`rounded-sm ${soft}`} />
        </span>
      )}
    </span>
  );
}

/* ------------------------------- swatch row ------------------------------- */
function SwatchStrip({ colors }) {
  return (
    <span className="flex h-7 w-16 overflow-hidden rounded-md ring-1 ring-black/10 shrink-0">
      {colors.map((c, i) => (
        <span key={`${c}-${i}`} className="flex-1" style={{ background: c }} />
      ))}
    </span>
  );
}

/* --------------------------- per-palette color editor --------------------------- */
// The CSS tokens a user can recolor, grouped most-impactful first.
const PALETTE_FIELDS = [
  { key: "--nv-primary", label: "Primary / buttons" },
  { key: "--nv-primary-deep", label: "Primary (hover)" },
  { key: "--nv-accent", label: "Accent" },
  { key: "--nv-bg", label: "Page background" },
  { key: "--nv-surface", label: "Cards / surface" },
  { key: "--nv-surface-2", label: "Surface (subtle)" },
  { key: "--nv-ink", label: "Text / ink" },
  { key: "--nv-ink-panel", label: "Dark panels" },
  { key: "--nv-muted", label: "Muted text" },
  { key: "--nv-line", label: "Lines / borders" },
  { key: "--nv-line-strong", label: "Lines (strong)" },
  { key: "--nv-on-primary", label: "Text on primary" },
  { key: "--nv-on-panel", label: "Text on panels" },
];

// Key foreground/background pairs to check for legibility (WCAG).
const CONTRAST_PAIRS = [
  { label: "Body text", fg: "--nv-ink", bg: "--nv-bg" },
  { label: "Card text", fg: "--nv-ink", bg: "--nv-surface" },
  { label: "Muted text", fg: "--nv-muted", bg: "--nv-surface" },
  { label: "Buttons", fg: "--nv-on-primary", bg: "--nv-primary" },
  { label: "Dark panels", fg: "--nv-on-panel", bg: "--nv-ink-panel" },
];

// Coerce any stored value into a valid #rrggbb for the native color input.
const toHex = (v) => {
  if (typeof v !== "string") return "#000000";
  const s = v.trim();
  const m6 = s.match(/^#?([0-9a-fA-F]{6})$/);
  if (m6) return "#" + m6[1].toLowerCase();
  const m3 = s.match(/^#?([0-9a-fA-F]{3})$/);
  if (m3) return "#" + m3[1].split("").map((c) => c + c).join("").toLowerCase();
  return "#000000";
};

function PaletteEditor() {
  const { palette, paletteVars, paletteOverrides, setPaletteColor, resetPaletteColors } = useTheme();
  const [open, setOpen] = useState(false);
  const edited = Object.keys(paletteOverrides[palette.id] || {}).length;

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface-2/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3.5 py-3 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-[12.5px] font-semibold">
          <Pipette size={13} className="text-primary" />
          Customize this palette
          {edited > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
              {edited} edited
            </span>
          )}
        </span>
        <ChevronDown size={15} className={`text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1.5 px-3.5 pb-3.5">
              {PALETTE_FIELDS.map((f) => {
                const val = paletteVars[f.key] || "#000000";
                return (
                  <div key={f.key} className="flex items-center gap-2.5">
                    <label
                      className="relative grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-lg ring-1 ring-black/10"
                      style={{ background: val }}
                      title={`Pick ${f.label.toLowerCase()}`}
                    >
                      <input
                        type="color"
                        value={toHex(val)}
                        onChange={(e) => setPaletteColor(f.key, e.target.value)}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        aria-label={f.label}
                      />
                    </label>
                    <span className="min-w-0 flex-1 truncate text-[12px]">{f.label}</span>
                    <input
                      value={val}
                      spellCheck={false}
                      onChange={(e) => setPaletteColor(f.key, e.target.value)}
                      className="w-[82px] rounded-md border border-line bg-surface px-2 py-1 text-right font-mono text-[11px] text-ink focus:border-primary focus:outline-none"
                    />
                  </div>
                );
              })}

              {/* Readability check — flags low-contrast text/background pairs. */}
              <div className="mt-2 rounded-xl border border-line bg-surface/70 p-2.5">
                <p className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Readability <span className="font-normal normal-case tracking-normal">WCAG · AA ≥ 4.5</span>
                </p>
                <div className="flex flex-col gap-1">
                  {CONTRAST_PAIRS.map((p) => {
                    const fg = paletteVars[p.fg];
                    const bg = paletteVars[p.bg];
                    const ratio = contrastRatio(fg, bg);
                    const g = grade(ratio);
                    return (
                      <div key={p.label} className="flex items-center gap-2 text-[11.5px]">
                        <span
                          className="grid h-5 w-7 shrink-0 place-items-center rounded text-[10px] font-bold ring-1 ring-black/10"
                          style={{ background: bg, color: fg }}
                        >
                          Aa
                        </span>
                        <span className="min-w-0 flex-1 truncate">{p.label}</span>
                        <span className="font-mono text-[10.5px] text-muted">{ratio ? `${ratio.toFixed(1)}:1` : "—"}</span>
                        <span
                          className={`w-9 rounded-full py-0.5 text-center text-[9px] font-bold ${
                            g.ok === false
                              ? "bg-red-100 text-red-700"
                              : g.ok
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-surface-2 text-muted"
                          }`}
                        >
                          {g.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => resetPaletteColors(palette.id)}
                disabled={!edited}
                className="mt-1.5 flex items-center justify-center gap-1.5 rounded-lg border border-line py-2 text-[11.5px] font-medium text-muted transition-colors enabled:hover:border-line-strong enabled:hover:text-ink disabled:opacity-40"
              >
                <RotateCcw size={12} /> Reset “{palette.name}” colors
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* --------------------------- share & export --------------------------- */
// Render the active (effective) palette as a ready-to-paste themes.js block.
function buildThemeCode(palette, vars, sel) {
  const order = [
    "--nv-bg", "--nv-surface", "--nv-surface-2", "--nv-ink", "--nv-ink-panel",
    "--nv-primary", "--nv-primary-deep", "--nv-accent", "--nv-line", "--nv-line-strong",
    "--nv-muted", "--nv-on-primary", "--nv-on-panel",
  ];
  const v = (k) => vars[k] || "#000000";
  const body = order.map((k) => `      "${k}": "${v(k)}",`).join("\n");
  const swatch = [v("--nv-ink-panel"), v("--nv-primary"), v("--nv-accent"), v("--nv-line-strong"), v("--nv-bg")];
  return `  {
    id: "${palette.id}-custom",
    name: "${palette.name} (custom)",
    tagline: "${palette.tagline}",
    swatch: ${JSON.stringify(swatch)},
    vars: {
${body}
    },
  },
  // Studio: type ${sel.t} · weight ${sel.w} · italic ${sel.i} · letter ${sel.ls} · line ${sel.lh} · radius ${sel.r}`;
}

function ShareExport() {
  const { palette, paletteVars, paletteOverrides, typography, weight, italic, letterSpacing, lineHeight, radius } = useTheme();
  const [copied, setCopied] = useState("");

  const copy = async (text, which) => {
    const done = () => { setCopied(which); setTimeout(() => setCopied(""), 1800); };
    try {
      await navigator.clipboard.writeText(text);
      done();
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); } catch {}
      document.body.removeChild(ta);
    }
  };

  const copyLink = () => {
    const cfg = {
      p: palette.id,
      o: paletteOverrides[palette.id] || undefined,
      t: typography.id, w: weight.id, i: italic,
      ls: letterSpacing.id, lh: lineHeight.id, r: radius.id,
    };
    const { origin, pathname } = window.location;
    copy(`${origin}${pathname}?studio&theme=${encodeTheme(cfg)}`, "link");
  };

  const copyCode = () => {
    const sel = { t: typography.id, w: weight.id, i: italic, ls: letterSpacing.id, lh: lineHeight.id, r: radius.id };
    copy(buildThemeCode(palette, paletteVars, sel), "code");
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={copyLink}
        className="flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-[12.5px] font-semibold text-on-primary transition-all hover:bg-primary-deep"
      >
        {copied === "link" ? <><Check size={14} /> Copied</> : <><Link2 size={14} /> Share link</>}
      </button>
      <button
        onClick={copyCode}
        className="flex items-center justify-center gap-1.5 rounded-xl border border-line py-2.5 text-[12.5px] font-medium text-ink transition-colors hover:border-line-strong"
      >
        {copied === "code" ? <><Check size={14} /> Copied</> : <><Code2 size={14} /> Theme code</>}
      </button>
    </div>
  );
}

/* ------------------------------- main panel ------------------------------- */
export default function DesignStudio() {
  const t = useTheme();
  const [kioskLoc, setKioskLoc] = useState(null);
  const [copied, setCopied] = useState(false);
  const [needsLocation, setNeedsLocation] = useState(false);
  const syncLocation = (id) =>
    setNeedsLocation(!id && window.matchMedia(KIOSK_MQ).matches);

  useEffect(() => {
    const id = readKioskLocation();
    setKioskLoc(id);
    syncLocation(id);
  }, []);

  const pickLocation = (id) => {
    saveKioskLocation(id);
    setKioskLoc(id);
    syncLocation(id);
    setCopied(false);
  };

  if (t.isPreview || !t.studioUnlocked) return null;

  const {
    palettes, typographies, weights, devices, kioskLayouts, letterSpacings, lineHeights, radii,
    palette, typography, weight, italic, device, kioskLayout, letterSpacing, lineHeight, radius,
    setPalette, setTypography, setWeight, setItalic, setDevice, setKioskLayout, setLetterSpacing, setLineHeight, setRadius,
    clearAllPaletteColors,
    studioOpen, setStudioOpen,
  } = t;

  const reset = () => {
    setPalette(DEFAULTS.palette);
    setTypography(DEFAULTS.typography);
    setWeight(DEFAULTS.weight);
    setItalic(DEFAULTS.italic);
    setLetterSpacing(DEFAULTS.letterSpacing);
    setLineHeight(DEFAULTS.lineHeight);
    setRadius(DEFAULTS.radius);
    setDevice(DEFAULTS.device);
    setKioskLayout(DEFAULTS.kioskLayout);
    clearAllPaletteColors();
  };

  return (
    <>
      <AnimatePresence>{device !== "live" && <DevicePreview />}</AnimatePresence>

      {/* Launcher */}
      <motion.button
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        onClick={() => setStudioOpen(true)}
        aria-label={needsLocation ? "Open Design Studio — no kiosk location set" : "Open Design Studio"}
        /* Bottom-left: the GHL chat widget owns the bottom-right corner. */
        className="fixed bottom-6 left-6 z-[140] grid h-14 w-14 place-items-center rounded-full text-white nv-shadow-lg"
        style={{ background: "linear-gradient(155deg, var(--nv-primary), var(--nv-primary-deep))" }}
      >
        <Palette size={22} />
        {needsLocation && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-amber-400 text-[11px] font-bold text-amber-950 ring-2 ring-surface">
            !
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {studioOpen && (
          <motion.aside
            key="studio"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 240, damping: 28 }}
            data-lenis-prevent
            className="fixed right-0 top-0 z-[160] flex h-full w-[92%] max-w-[380px] flex-col border-l border-line bg-surface text-ink nv-scroll-lg overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface/95 px-6 py-5 backdrop-blur">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl text-white" style={{ background: "var(--nv-primary)" }}>
                  <Sparkles size={17} />
                </span>
                <div>
                  <h3 className="font-display text-[1.05rem] font-extrabold leading-none">Design Studio</h3>
                  <p className="mt-1 flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-muted">
                    <Lock size={10} /> This device only
                  </p>
                </div>
              </div>
              <button onClick={() => setStudioOpen(false)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-8 px-6 py-7">
              {/* Palette */}
              <Section icon={<Palette size={14} />} title="Color palette">
                <div className="flex flex-col gap-2.5">
                  {palettes.map((p) => {
                    const on = p.id === palette.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPalette(p.id)}
                        className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all ${
                          on ? "border-primary bg-surface-2 ring-2 ring-primary/15" : "border-line hover:border-line-strong"
                        }`}
                      >
                        <SwatchStrip colors={p.swatch} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-semibold">{p.name}</span>
                          <span className="block truncate text-[11px] text-muted">{p.tagline}</span>
                        </span>
                        {on && <Check size={16} className="text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <PaletteEditor />
              </Section>

              {/* Typography */}
              <Section icon={<Type size={14} />} title="Typography">
                <div className="grid grid-cols-2 gap-2.5">
                  {typographies.map((ty) => {
                    const on = ty.id === typography.id;
                    return (
                      <button
                        key={ty.id}
                        onClick={() => setTypography(ty.id)}
                        className={`rounded-2xl border px-3 py-3 text-left transition-all ${
                          on ? "border-primary bg-surface-2 ring-2 ring-primary/15" : "border-line hover:border-line-strong"
                        }`}
                      >
                        <span className="block text-[26px] leading-none" style={{ fontFamily: ty.vars["--nv-font-display"] }}>
                          {ty.sample}
                        </span>
                        <span className="mt-2 block text-[12px] font-semibold">{ty.name}</span>
                        <span className="block text-[10px] text-muted">{ty.note}</span>
                      </button>
                    );
                  })}
                </div>
              </Section>

              {/* Weight + italic */}
              <Section icon={<span className="font-bold">W</span>} title="Weight & emphasis">
                <div className="flex gap-2">
                  {weights.map((w) => {
                    const on = w.id === weight.id;
                    return (
                      <button
                        key={w.id}
                        onClick={() => setWeight(w.id)}
                        style={{ fontWeight: Number(w.vars["--nv-weight-heading"]) }}
                        className={`flex-1 rounded-xl border py-2.5 text-[13px] transition-all ${
                          on ? "border-primary bg-primary text-on-primary" : "border-line text-ink hover:border-line-strong"
                        }`}
                      >
                        {w.name}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setItalic(!italic)}
                  className={`mt-2.5 flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-[13px] transition-all ${
                    italic ? "border-primary bg-surface-2" : "border-line hover:border-line-strong"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Italic size={14} /> Italic headings accent
                  </span>
                  <span className={`grid h-5 w-9 items-center rounded-full px-0.5 transition-colors ${italic ? "bg-primary" : "bg-line-strong"}`}>
                    <span className={`h-4 w-4 rounded-full bg-white transition-transform ${italic ? "translate-x-4" : ""}`} />
                  </span>
                </button>
              </Section>

              {/* Spacing */}
              <Section icon={<MoveHorizontal size={14} />} title="Spacing">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-muted">Letter spacing</p>
                <div className="flex gap-2">
                  {letterSpacings.map((ls) => {
                    const on = ls.id === letterSpacing.id;
                    return (
                      <button
                        key={ls.id}
                        onClick={() => setLetterSpacing(ls.id)}
                        style={{ letterSpacing: ls.vars["--nv-letter-spacing"] }}
                        className={`flex-1 rounded-xl border py-2.5 text-[13px] transition-all ${
                          on ? "border-primary bg-primary text-on-primary" : "border-line text-ink hover:border-line-strong"
                        }`}
                      >
                        {ls.name}
                      </button>
                    );
                  })}
                </div>
                <p className="mb-2 mt-3.5 text-[11px] font-medium uppercase tracking-[0.1em] text-muted">Line spacing</p>
                <div className="flex gap-2">
                  {lineHeights.map((lh) => {
                    const on = lh.id === lineHeight.id;
                    return (
                      <button
                        key={lh.id}
                        onClick={() => setLineHeight(lh.id)}
                        className={`flex-1 rounded-xl border py-2.5 text-[13px] transition-all ${
                          on ? "border-primary bg-primary text-on-primary" : "border-line text-ink hover:border-line-strong"
                        }`}
                      >
                        {lh.name}
                      </button>
                    );
                  })}
                </div>
              </Section>

              {/* Corner radius */}
              <Section icon={<Square size={14} />} title="Corner radius">
                <div className="flex gap-2">
                  {radii.map((r) => {
                    const on = r.id === radius.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setRadius(r.id)}
                        className={`flex flex-1 flex-col items-center gap-2 rounded-xl border py-3 text-[12px] transition-all ${
                          on ? "border-primary bg-primary text-on-primary" : "border-line text-ink hover:border-line-strong"
                        }`}
                      >
                        <span className="h-6 w-6 border-2 border-current" style={{ borderRadius: r.vars["--radius-2xl"] }} />
                        {r.name}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted">
                  Tunes roundness sitewide — sharp reads clinical, round reads friendly.
                </p>
              </Section>

              {/* Device */}
              <Section icon={<Monitor size={14} />} title="Preview device">
                <div className="grid grid-cols-3 gap-2">
                  {devices.map((d) => {
                    const Icon = DEVICE_ICON[d.id] || Monitor;
                    const on = d.id === device;
                    return (
                      <button
                        key={d.id}
                        onClick={() => setDevice(d.id)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-[11px] transition-all ${
                          on ? "border-primary bg-primary text-on-primary" : "border-line text-ink hover:border-line-strong"
                        }`}
                      >
                        <Icon size={18} /> {d.name}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted">
                  Opens the live site in a scaled phone · tablet · desktop frame.
                </p>
              </Section>
              <Section icon={<Tablet size={14} />} title="Tablet hero layout">
                <div className="flex flex-col gap-2.5">
                  {kioskLayouts.map((k) => {
                    const on = k.id === kioskLayout.id;
                    return (
                      <button
                        key={k.id}
                        onClick={() => setKioskLayout(k.id)}
                        className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all ${
                          on ? "border-primary bg-surface-2 ring-2 ring-primary/15" : "border-line hover:border-line-strong"
                        }`}
                      >
                        <KioskLayoutThumb id={k.id} on={on} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-semibold">{k.name}</span>
                          <span className="block truncate text-[11px] text-muted">{k.tagline}</span>
                        </span>
                        {on && <Check size={16} className="text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted">
                  Applies live to the portrait tablet / kiosk homepage hero. Use the Tablet preview above to see it on other screens.
                </p>
              </Section>

              {/* Kiosk location */}
              <Section icon={<MapPin size={14} />} title="Kiosk location">
                <div className="flex flex-col gap-2.5">
                  {KIOSK_LOCATIONS.map((loc) => {
                    const on = loc.id === kioskLoc;
                    return (
                      <button
                        key={loc.id}
                        onClick={() => pickLocation(on ? null : loc.id)}
                        className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all ${
                          on ? "border-primary bg-surface-2 ring-2 ring-primary/15" : "border-line hover:border-line-strong"
                        }`}
                      >
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                            on ? "text-white" : "bg-surface-2 text-muted"
                          }`}
                          style={on ? { background: "var(--nv-primary)" } : undefined}
                        >
                          <MapPin size={16} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-semibold">{loc.label}</span>
                          <span className="block truncate text-[11px] text-muted">{sourceLabel(loc.id)}</span>
                        </span>
                        {on && <Check size={16} className="shrink-0 text-primary" />}
                      </button>
                    );
                  })}
                </div>

                {kioskLoc ? (
                  <div className="mt-3 rounded-2xl border border-line bg-surface-2 p-3.5">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                      <Lock size={11} /> Locked to this device
                    </p>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted">
                      Every QR on this screen now carries <b className="text-ink">{sourceLabel(kioskLoc)}</b>, which is the
                      Source you filter by in GHL.
                    </p>
                    <p className="mt-3 text-[11px] leading-relaxed text-muted">
                      That&rsquo;s the setup done. The link below is optional: make it the tablet&rsquo;s home page and the
                      location restores itself if site data ever gets cleared. Skip it and you&rsquo;d re-pick by hand,
                      and the launcher shows a warning dot when that happens.
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="min-w-0 flex-1 truncate rounded-lg border border-line bg-surface px-2.5 py-2 text-[11px] text-ink">
                        {bootUrl(kioskLoc)}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(bootUrl(kioskLoc));
                          setCopied(true);
                        }}
                        className="shrink-0 rounded-lg border border-line px-2.5 py-2 text-[11px] font-medium text-muted transition-colors hover:border-line-strong hover:text-ink"
                      >
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] leading-relaxed text-muted">
                    Pick the site this tablet is standing in, then lock it. Until you do, scans from this device reach GHL
                    with no location attached.
                  </p>
                )}
              </Section>

              {/* Share & handoff */}
              <Section icon={<Share2 size={14} />} title="Share & handoff">
                <ShareExport />
                <p className="mt-2 text-[11px] leading-relaxed text-muted">
                  <b>Share link</b> opens the site with this exact look. <b>Theme code</b> copies a ready-to-paste palette block for themes.js.
                </p>
              </Section>

              <button
                onClick={reset}
                className="flex items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-[12.5px] font-medium text-muted transition-colors hover:border-line-strong hover:text-ink"
              >
                <RotateCcw size={14} /> Reset to defaults
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );  
}

function Section({ icon, title, children }) {
  return (
    <div>
      <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
        <span className="grid h-5 w-5 place-items-center text-primary">{icon}</span>
        {title}
      </p>
      {children}
    </div>
  );
}
