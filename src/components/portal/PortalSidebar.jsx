import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronsLeft, ChevronsRight, LogOut, X } from "lucide-react";

export default function PortalSidebar({
  tabs,
  tab,
  onTab,
  open,
  onClose,
  collapsed,
  onToggleCollapse,
  onSignOut,
}) {
  // Escape closes the drawer; harmless on desktop where it's always visible.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const item =
    "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[0.92rem] font-semibold transition-colors";

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-300 motion-reduce:transition-none md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-label="Portal navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-line bg-surface
          transition-transform duration-300 ease-out motion-reduce:transition-none
          md:static md:translate-x-0 md:transition-[width]
          ${open ? "translate-x-0" : "-translate-x-full"}
          ${collapsed ? "md:w-18" : "md:w-64"}`}
      >
        {/* The drawer is always full width on mobile, so `collapsed` is applied
            through md: variants rather than by conditional rendering. */}
        <div className={`flex h-15 shrink-0 items-center gap-2 border-b border-line px-3 ${collapsed ? "md:justify-center md:px-0" : ""}`}>
          <Link to="/" aria-label="Nova MDK home" className={`min-w-0 px-1 ${collapsed ? "md:hidden" : ""}`}>
            <img src="/logo.png" alt="Nova MDK" className="h-9 w-auto" />
          </Link>

          <button
            onClick={onClose}
            aria-label="Close menu"
            className="ml-auto grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink md:hidden"
          >
            <X size={18} />
          </button>

          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`hidden h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink md:grid ${
              collapsed ? "" : "md:ml-auto"
            }`}
          >
            {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          </button>
        </div>

        <nav className="nv-scroll flex-1 space-y-1 overflow-y-auto p-3" data-lenis-prevent>
          {tabs.map(({ key, label, icon }) => {
            const Icon = icon;
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => onTab(key)}
                aria-current={active ? "page" : undefined}
                title={collapsed ? label : undefined}
                className={`${item} ${collapsed ? "md:justify-center md:px-0" : ""} ${
                  active ? "text-ink" : "text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {/* One shared highlight that slides between items, rather than each
                    item fading its own background in and out. */}
                {active && (
                  <motion.span
                    layoutId="portal-nav-pill"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  />
                )}
                <Icon size={18} className={`relative z-10 shrink-0 ${active ? "text-primary" : ""}`} />
                <span className={`relative z-10 ${collapsed ? "md:hidden" : ""}`}>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-line p-3">
          <button
            onClick={onSignOut}
            title={collapsed ? "Sign out" : undefined}
            className={`${item} ${collapsed ? "md:justify-center md:px-0" : ""} text-muted hover:bg-surface-2 hover:text-ink`}
          >
            <LogOut size={18} className="shrink-0" />
            <span className={collapsed ? "md:hidden" : ""}>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
