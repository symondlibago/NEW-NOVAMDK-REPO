import React, { useEffect, useRef, useState } from "react";
import { Maximize2, Pause, Play } from "lucide-react";
const clock = (s) =>
  !Number.isFinite(s) || s < 0 ? "0:00" : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function useMedia(ref) {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const settle = () => {
      if (el.duration === Infinity) {
        const onSeek = () => {
          el.removeEventListener("timeupdate", onSeek);
          setDuration(el.duration);
          el.currentTime = 0;
        };
        el.addEventListener("timeupdate", onSeek);
        el.currentTime = 1e6;
      } else {
        setDuration(el.duration || 0);
      }
    };

    const onTime = () => setTime(el.currentTime);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => { setPlaying(false); setTime(0); el.currentTime = 0; };

    el.addEventListener("loadedmetadata", settle);
    el.addEventListener("durationchange", settle);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnd);
    if (el.readyState >= 1) settle();

    return () => {
      el.removeEventListener("loadedmetadata", settle);
      el.removeEventListener("durationchange", settle);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnd);
    };
  }, [ref]);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  const seek = (ratio) => {
    const el = ref.current;
    if (el && Number.isFinite(el.duration)) el.currentTime = ratio * el.duration;
  };

  return { playing, time, duration, toggle, seek };
}

/** Click-anywhere scrub bar. A plain div, so it can be styled to match. */
function Track({ progress, onSeek, tone }) {
  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="Seek"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onSeek(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") onSeek(Math.min(1, progress + 0.05));
        if (e.key === "ArrowLeft") onSeek(Math.max(0, progress - 0.05));
      }}
      className={`group relative h-1.5 flex-1 cursor-pointer rounded-full ${tone.track}`}
    >
      <div className={`h-full rounded-full ${tone.fill}`} style={{ width: `${progress * 100}%` }} />
      <span
        className={`absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity group-hover:opacity-100 ${tone.fill}`}
        style={{ left: `${progress * 100}%` }}
      />
    </div>
  );
}

export function AudioPlayer({ src, mine }) {
  const ref = useRef(null);
  const { playing, time, duration, toggle, seek } = useMedia(ref);
  const progress = duration ? time / duration : 0;

  const tone = mine
    ? { shell: "bg-on-primary/15", btn: "bg-on-primary text-primary", text: "text-on-primary/85", track: "bg-on-primary/25", fill: "bg-on-primary" }
    : { shell: "bg-surface-2", btn: "bg-primary text-on-primary", text: "text-muted", track: "bg-line-strong", fill: "bg-primary" };

  return (
    <div className={`mt-2 flex w-56 items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3.5 sm:w-64 ${tone.shell}`}>
      <audio ref={ref} src={src} preload="metadata" className="hidden" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-transform hover:scale-105 ${tone.btn}`}
      >
        {playing ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" className="ml-0.5" />}
      </button>
      <Track progress={progress} onSeek={seek} tone={tone} />
      <span className={`shrink-0 font-mono text-[0.7rem] tabular-nums ${tone.text}`}>
        {clock(playing || time ? time : duration)}
      </span>
    </div>
  );
}

export function VideoPlayer({ src }) {
  const ref = useRef(null);
  const { playing, time, duration, toggle, seek } = useMedia(ref);
  const progress = duration ? time / duration : 0;
  const tone = { track: "bg-white/25", fill: "bg-white" };

  return (
    <div className="mt-2 w-56 overflow-hidden rounded-xl bg-ink sm:w-64">
      <div className="relative">
        <video
          ref={ref}
          src={src}
          preload="metadata"
          playsInline
          onClick={toggle}
          className="aspect-video w-full cursor-pointer object-cover"
        />
        {!playing && (
          <button
            type="button"
            onClick={toggle}
            aria-label="Play"
            className="absolute inset-0 grid place-items-center bg-ink/35 transition-colors hover:bg-ink/25"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-ink">
              <Play size={18} fill="currentColor" className="ml-0.5" />
            </span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2.5 px-2.5 py-2">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-white/90 transition-colors hover:text-white"
        >
          {playing ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
        </button>
        <Track progress={progress} onSeek={seek} tone={tone} />
        <span className="shrink-0 font-mono text-[0.68rem] tabular-nums text-white/75">
          {clock(playing || time ? time : duration)}
        </span>
        <button
          type="button"
          onClick={() => ref.current?.requestFullscreen?.()}
          aria-label="Full screen"
          className="shrink-0 text-white/75 transition-colors hover:text-white"
        >
          <Maximize2 size={12} />
        </button>
      </div>
    </div>
  );
}
