import React, { useCallback, useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, CalendarDays, Loader2, MessageSquare } from "lucide-react";
import { portalData } from "../../lib/portal";

const POLL_MS = 60_000;
const SEEN_KEY = "nv_portal_notifs_seen";

/* There's nowhere to persist a per-notification "dismissed" flag — the partner
   API has no patient notification store and this project has no database. So
   "new" means newer than the last time the bell was opened on this device, and
   the items themselves resolve on their own: read the message and it's gone. */
export default function PortalNotifications({ onNavigate }) {
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(false);
  const [seenAt, setSeenAt] = useState(0);
  const panelRef = useRef(null);

  useEffect(() => {
    try { setSeenAt(Number(localStorage.getItem(SEEN_KEY)) || 0); } catch { /* private mode */ }
  }, []);

  const load = useCallback(() => {
    portalData({ resource: "notifications" })
      .then(({ items: next }) => setItems(next))
      .catch(() => { /* the bell is ambient — a failure shouldn't interrupt */ });
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const tick = () => { if (!document.hidden) load(); };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, [load]);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!panelRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); window.removeEventListener("keydown", onKey); };
  }, [open]);

  const fresh = (items || []).filter((n) => new Date(n.at).getTime() > seenAt).length;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      load();
      const now = Date.now();
      setSeenAt(now);
      try { localStorage.setItem(SEEN_KEY, String(now)); } catch { /* private mode */ }
    }
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={toggle}
        aria-label={fresh ? `Notifications, ${fresh} new` : "Notifications"}
        aria-expanded={open}
        className="relative grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted transition-colors hover:border-primary hover:text-ink"
      >
        <Bell size={15} />
        {fresh > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-surface" />
        )}
      </button>

      {open && (
        <div
          data-lenis-prevent
          className="nv-scroll absolute right-0 z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-2xl border border-line bg-surface p-2 nv-shadow-lg"
        >
          <p className="px-2.5 py-2 text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-muted">
            Notifications
          </p>

          {items === null && (
            <div className="grid place-items-center py-8">
              <Loader2 size={20} className="animate-spin text-primary" />
            </div>
          )}

          {items?.length === 0 && (
            <p className="px-2.5 pb-4 pt-2 text-[0.88rem] leading-relaxed text-muted">
              Nothing new. We'll let you know when your care team replies or your
              visit moves forward.
            </p>
          )}

          {items?.map((n) => {
            const Icon = n.kind === "message" ? MessageSquare : CalendarDays;
            return (
              <button
                key={n.id}
                onClick={() => { onNavigate(n.tab); setOpen(false); }}
                className="flex w-full gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-surface-2"
              >
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-2 text-primary">
                  <Icon size={13} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.88rem] font-semibold leading-snug text-ink">{n.title}</span>
                  <span className="mt-0.5 block truncate text-[0.82rem] text-muted">{n.preview}</span>
                  <span className="mt-0.5 block text-[0.72rem] text-muted">
                    {formatDistanceToNow(new Date(n.at), { addSuffix: true })}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
