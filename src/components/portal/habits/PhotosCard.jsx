import React, { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Camera, Lock, Trash2 } from "lucide-react";
import { deletePhoto, listPhotos, savePhoto, shrinkPhoto } from "../../../lib/progressPhotos";
import Sheet from "./Sheet";

const monthName = (key) => format(new Date(`${key}-15T12:00:00`), "MMM yyyy");

/* One private photo a month, side by side. They live in this browser only. */
export default function PhotosCard({ pid }) {
  const [photos, setPhotos] = useState(null);
  const [error, setError] = useState(null);
  const [viewing, setViewing] = useState(null);
  const input = useRef(null);
  const now = format(new Date(), "yyyy-MM");

  useEffect(() => {
    if (!pid) return;
    let alive = true;
    listPhotos(pid).then((p) => alive && setPhotos(p));
    return () => {
      alive = false;
    };
  }, [pid]);

  /* Object URLs for whatever is loaded, released when the set changes. */
  const [urls, setUrls] = useState({});
  useEffect(() => {
    if (!photos) return;
    const next = Object.fromEntries(Object.entries(photos).map(([m, blob]) => [m, URL.createObjectURL(blob)]));
    setUrls(next);
    return () => Object.values(next).forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  const add = async (file) => {
    if (!file) return;
    setError(null);
    try {
      const blob = await shrinkPhoto(file);
      await savePhoto(pid, now, blob);
      setPhotos((p) => ({ ...p, [now]: blob }));
    } catch {
      setError("This browser won't let us save photos. Try another browser on your phone.");
    }
  };

  const remove = async (month) => {
    await deletePhoto(pid, month).catch(() => {});
    setPhotos((p) => {
      const next = { ...p };
      delete next[month];
      return next;
    });
    setViewing(null);
  };

  const months = Object.keys(photos || {}).sort().slice(-5);

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 nv-shadow sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-surface-2 text-primary">
          <Camera size={18} />
        </span>
        <div className="flex-1">
          <p className="text-base font-semibold text-ink">Photos</p>
          <p className="text-sm text-muted">One a month, same spot and same light, to see change over time.</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-3">
        {months.map((m) => (
          <button key={m} type="button" onClick={() => setViewing(m)} className="group relative aspect-3/4 overflow-hidden rounded-xl bg-surface-2">
            {urls[m] && <img src={urls[m]} alt={`Progress photo, ${monthName(m)}`} className="size-full object-cover" />}
            <span className="absolute inset-x-0 bottom-0 bg-ink/45 py-1 text-center text-xs font-semibold text-white">{monthName(m)}</span>
          </button>
        ))}
        {photos && !photos[now] && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="grid aspect-3/4 place-items-center rounded-xl border-2 border-dashed border-line-strong text-sm font-semibold text-primary-deep transition-colors hover:border-primary"
          >
            <span className="grid justify-items-center gap-1">
              <Camera size={18} />+ {format(new Date(), "MMMM")}
            </span>
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          add(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {error && <p className="mt-3 text-sm text-ink">{error}</p>}
      <p className="mt-4 flex gap-2 text-sm text-muted">
        <Lock size={14} className="mt-0.5 shrink-0 text-primary" /> Photos stay on this device. They are never uploaded.
      </p>

      <Sheet open={Boolean(viewing)} onClose={() => setViewing(null)} label="Progress photo">
        {viewing && (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">{monthName(viewing)}</p>
            {urls[viewing] && <img src={urls[viewing]} alt={`Progress photo, ${monthName(viewing)}`} className="mt-3 w-full rounded-2xl" />}
            <button
              type="button"
              onClick={() => remove(viewing)}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-line-strong px-6 py-3 text-base font-semibold text-ink transition-colors hover:border-primary"
            >
              <Trash2 size={16} /> Delete this photo
            </button>
          </>
        )}
      </Sheet>
    </section>
  );
}
