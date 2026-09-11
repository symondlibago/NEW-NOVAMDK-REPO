import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { format, isToday, isYesterday } from "date-fns";
import {
  AlertCircle, Loader2, Mic, Paperclip, Plus, SendHorizontal, Square, Stethoscope, Video, X,
} from "lucide-react";
import { portalData } from "../../lib/portal";
import { prepareAttachment, pickRecorderMime, extensionFor } from "../../lib/attachments";
import { AudioPlayer, VideoPlayer } from "./MediaPlayer";

const POLL_MS = 20_000;
/* Video is roughly 80 KB/s at the bitrate below, so 30s lands under the 3 MB
   upload ceiling. Audio is an order of magnitude smaller and can run longer. */
const MAX_SECONDS = { audio: 180, video: 30 };

const dayLabel = (d) =>
  isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "EEEE, MMMM d");

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const isAudio = (f) => String(f.mime_type || "").startsWith("audio/");
const isVideo = (f) => String(f.mime_type || "").startsWith("video/");
const isMedia = (f) => isAudio(f) || isVideo(f);

/* Players carry an explicit width rather than w-full: the bubble around them is
   shrink-to-fit, so a percentage width has nothing to resolve against and the
   control collapses to a sliver. */
const PLAYER_W = "w-56 sm:w-64";

function Attachment({ file, mine, url, onError }) {
  const [busy, setBusy] = useState(false);

  if (isAudio(file)) {
    return url ? <AudioPlayer src={url} mine={mine} /> : <Placeholder mine={mine} label="Voice note" />;
  }
  if (isVideo(file)) {
    return url ? <VideoPlayer src={url} /> : <Placeholder mine={mine} label="Video message" />;
  }

  // Documents keep the click-to-open behaviour — there's nothing to play.
  async function open() {
    if (busy) return;
    setBusy(true);
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null;
    try {
      const res = await portalData({ resource: "file", file_id: file.id });
      if (!res.url) throw new Error("No link returned");
      if (tab) tab.location.href = res.url;
      else window.location.href = res.url;
    } catch (err) {
      tab?.close();
      onError(err.message || "Could not open that attachment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={open}
      className={`mt-2 flex items-center gap-1.5 text-left text-[0.8rem] underline-offset-2 hover:underline ${
        mine ? "text-on-primary/85" : "text-primary"
      }`}
    >
      {busy ? <Loader2 size={12} className="shrink-0 animate-spin" /> : <Paperclip size={12} className="shrink-0" />}
      {file.name}
    </button>
  );
}

/* Holds the player's footprint while its signed URL is being fetched, so the
   bubble doesn't jump once it arrives. */
const Placeholder = ({ mine, label }) => (
  <span className={`mt-2 flex h-10 items-center gap-2 rounded-lg px-3 text-[0.8rem] ${PLAYER_W} ${
    mine ? "bg-on-primary/15 text-on-primary/80" : "bg-surface-2 text-muted"
  }`}>
    <Loader2 size={13} className="shrink-0 animate-spin" /> {label}
  </span>
);

/* The patient-facing thread. MDI's other channel is an internal
   clinician-to-support conversation and is deliberately not exposed here. */
export default function PortalMessages({ onUnauthorized }) {
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(null); // null | "audio" | "video"
  const [seconds, setSeconds] = useState(0);
  const [mediaUrls, setMediaUrls] = useState({}); // file id -> signed URL

  const scrollRef = useRef(null);
  const composerRef = useRef(null);
  const fileRef = useRef(null);
  const previewRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const cancelledRef = useRef(false);
  const lastCount = useRef(0);

  // A textarea won't grow on its own; measure content and cap it at max-h-40.
  const fitComposer = (el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const load = useCallback(
    async ({ silent } = {}) => {
      try {
        const { messages: next } = await portalData({ resource: "messages" });
        setMessages(next);
        setError(null);
      } catch (err) {
        if (err.status === 401) return onUnauthorized();
        // A failed background poll shouldn't replace a thread the patient is
        // already reading — only surface it on the initial load.
        if (!silent) setError(err.message);
      }
    },
    [onUnauthorized]
  );

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const tick = () => { if (!document.hidden) load({ silent: true }); };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, [load]);

  // Jump to the newest message whenever the thread grows, not on every render.
  useEffect(() => {
    if (!messages || messages.length === lastCount.current) return;
    lastCount.current = messages.length;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  /* Acknowledged ids are remembered because the next poll returns the same
     messages with read_at still null until MDI catches up — without this the
     thread re-acknowledges every unread message every 20 seconds. */
  const acked = useRef(new Set());
  useEffect(() => {
    if (!messages) return;
    for (const m of messages) {
      if (m.mine || m.read_at || acked.current.has(m.id)) continue;
      acked.current.add(m.id);
      portalData({ resource: "read_message", message_id: m.id }).catch(() => {
        acked.current.delete(m.id); // let a failed ack retry on the next poll
      });
    }
  }, [messages]);

  /* Voice notes and video messages get their signed URL as soon as the thread
     loads so the player is simply there, the way it is in MDI's own portal.
     Each file is fetched once per session — the `requested` guard stops the 20s
     poll re-resolving everything it already has. */
  const requested = useRef(new Set());
  useEffect(() => {
    if (!messages) return;
    for (const m of messages) {
      for (const f of m.files) {
        if (!isMedia(f) || requested.current.has(f.id)) continue;
        requested.current.add(f.id);
        portalData({ resource: "file", file_id: f.id })
          .then(({ url }) => { if (url) setMediaUrls((prev) => ({ ...prev, [f.id]: url })); })
          .catch(() => requested.current.delete(f.id)); // let it retry next poll
      }
    }
  }, [messages]);

  // Release the camera and mic if the patient navigates away mid-recording.
  useEffect(() => () => {
    cancelledRef.current = true;
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    if (recording && seconds >= MAX_SECONDS[recording]) stopRecording();
  }, [recording, seconds]);

  async function upload(file) {
    setUploading(true);
    setError(null);
    try {
      const payload = await prepareAttachment(file);
      const { file: stored } = await portalData({ resource: "upload", ...payload });
      setPending((p) => [...p, stored]);
    } catch (err) {
      if (err.status === 401) return onUnauthorized();
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function onPickFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // let the same file be picked again after removing it
    for (const f of files) await upload(f);
  }

  async function startRecording(kind) {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        kind === "video"
          ? { audio: true, video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" } }
          : { audio: true }
      );
      streamRef.current = stream;

      const mime = pickRecorderMime(kind);
      const rec = new MediaRecorder(stream, {
        ...(mime ? { mimeType: mime } : {}),
        ...(kind === "video" ? { videoBitsPerSecond: 600_000, audioBitsPerSecond: 64_000 } : {}),
      });
      const chunks = [];
      cancelledRef.current = false;

      rec.ondataavailable = (ev) => { if (ev.data.size) chunks.push(ev.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setRecording(null);
        if (cancelledRef.current || !chunks.length) return;
        const type = rec.mimeType || (kind === "video" ? "video/webm" : "audio/webm");
        const name = `${kind === "video" ? "video-message" : "voice-note"}.${extensionFor(type)}`;
        await upload(new File([new Blob(chunks, { type })], name, { type }));
      };

      recorderRef.current = rec;
      setSeconds(0);
      setRecording(kind);
      // 1s timeslice rather than one blob at stop: some browsers hand back an
      // almost-empty recording if the single final chunk isn't flushed cleanly.
      rec.start(1000);
    } catch {
      setError(
        kind === "video"
          ? "Camera and microphone access are needed to record a video message."
          : "Microphone access is needed to record a voice note."
      );
    }
  }

  // The preview element only exists once `recording` has rendered the panel.
  useEffect(() => {
    if (recording === "video" && previewRef.current && streamRef.current) {
      previewRef.current.srcObject = streamRef.current;
    }
  }, [recording]);

  function stopRecording() {
    cancelledRef.current = false;
    recorderRef.current?.stop();
  }

  function cancelRecording() {
    cancelledRef.current = true;
    recorderRef.current?.stop();
  }

  async function send(e) {
    e?.preventDefault();
    const text = draft.trim();
    if ((!text && !pending.length) || sending) return;

    setSending(true);
    setError(null);
    try {
      const { message } = await portalData({
        resource: "send_message",
        text,
        file_ids: pending.map((f) => f.id),
      });
      setDraft("");
      setPending([]);
      fitComposer(composerRef.current);
      setMessages((prev) => [...(prev || []), message]);
    } catch (err) {
      if (err.status === 401) return onUnauthorized();
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  const iconBtn =
    "grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-40";
  let lastDay = null;

  return (
    /* min-h-0 on this column and the scroller: a flex child defaults to
       min-height:auto, so without it the thread grows to fit its content and the
       overflow gets clipped by the page instead of scrolling. */
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-line bg-surface px-5 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-primary">
            <Stethoscope size={15} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[0.92rem] font-semibold text-ink">Your care team</p>
            <p className="truncate text-[0.78rem] text-muted">
              Private channel for questions about your treatment
            </p>
          </div>
        </div>
      </div>

      {messages === null && !error ? (
        <div className="grid flex-1 place-items-center">
          <Loader2 size={26} className="animate-spin text-primary" />
        </div>
      ) : (
        <div ref={scrollRef} data-lenis-prevent className="nv-scroll min-h-0 flex-1 overflow-y-auto px-5 py-6">
          <div className="mx-auto flex max-w-3xl flex-col">
            {messages?.length === 0 && (
              <div className="mt-16 text-center">
                <p className="text-[1.05rem] font-semibold text-ink">No messages yet</p>
                <p className="mx-auto mt-1.5 max-w-sm text-[0.9rem] leading-relaxed text-muted">
                  Send a message below and your care team will get back to you.
                </p>
              </div>
            )}

            {messages?.map((m) => {
              const at = new Date(m.created_at);
              const day = dayLabel(at);
              const divider = day !== lastDay ? ((lastDay = day), day) : null;

              return (
                <React.Fragment key={m.id}>
                  {divider && (
                    <div className="my-4 flex items-center gap-3">
                      <span className="h-px flex-1 bg-line" />
                      <span className="text-[0.72rem] font-medium uppercase tracking-[0.12em] text-muted">
                        {divider}
                      </span>
                      <span className="h-px flex-1 bg-line" />
                    </div>
                  )}

                  <div className={`flex flex-col ${m.mine ? "items-end" : "items-start"}`}>
                    {!m.mine && m.author && (
                      <span className="mb-1 ml-1 text-[0.75rem] font-medium text-muted">{m.author}</span>
                    )}
                    <div
                      className={`max-w-[80%] whitespace-pre-wrap wrap-break-word rounded-2xl px-4 py-2.5 text-[0.92rem] leading-relaxed ${
                        m.mine
                          ? "rounded-br-md bg-primary text-on-primary"
                          : "rounded-bl-md border border-line bg-surface text-ink"
                      }`}
                    >
                      {m.text}
                      {m.files.map((f) => (
                        <Attachment key={f.id} file={f} mine={m.mine} url={mediaUrls[f.id]} onError={setError} />
                      ))}
                    </div>
                    <span className="mb-2 mt-1 px-1 text-[0.7rem] text-muted">{format(at, "h:mm a")}</span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      <div className="shrink-0 border-t border-line bg-surface px-5 py-4">
        <form onSubmit={send} className="mx-auto max-w-3xl">
          {error && (
            <p role="alert" className="mb-2 flex items-start gap-1.5 text-[0.82rem] text-ink">
              <AlertCircle size={13} className="mt-0.5 shrink-0 text-primary" /> {error}
            </p>
          )}

          {pending.length > 0 && (
            <ul className="mb-2 flex flex-wrap gap-2">
              {pending.map((f) => (
                <li key={f.id} className="flex items-center gap-1.5 rounded-full border border-line bg-bg py-1 pl-3 pr-1.5 text-[0.8rem] text-ink">
                  <Paperclip size={12} className="shrink-0 text-primary" />
                  <span className="max-w-40 truncate">{f.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => setPending((p) => p.filter((x) => x.id !== f.id))}
                    className="grid h-5 w-5 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {recording ? (
            <div className="rounded-2xl border border-primary bg-bg p-3">
              {recording === "video" && (
                <video
                  ref={previewRef}
                  autoPlay
                  muted
                  playsInline
                  className="mb-3 aspect-video w-full rounded-xl bg-ink object-cover"
                />
              )}
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-primary" />
                <span className="flex-1 text-[0.9rem] font-medium text-ink">
                  Recording {recording === "video" ? "video" : "voice note"}…{" "}
                  <span className="font-mono text-muted">
                    {mmss(seconds)} / {mmss(MAX_SECONDS[recording])}
                  </span>
                </span>
                <button type="button" onClick={cancelRecording} className="text-[0.85rem] font-medium text-muted hover:text-ink">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={stopRecording}
                  aria-label="Stop recording"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-on-primary"
                >
                  <Square size={13} fill="currentColor" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-end gap-1 rounded-2xl border border-line bg-bg px-2 py-2 focus-within:border-primary">
              <input ref={fileRef} type="file" multiple onChange={onPickFiles} className="hidden"
                accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.txt" />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                aria-label="Attach a file" className={iconBtn}>
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
              </button>

              <textarea
                ref={composerRef}
                rows={1}
                value={draft}
                onChange={(e) => { setDraft(e.target.value); fitComposer(e.target); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                }}
                placeholder="Type a message to your care team…"
                data-lenis-prevent
                className="nv-scroll max-h-40 flex-1 resize-none bg-transparent px-1 py-2 text-[0.92rem] text-ink placeholder:text-muted/70 focus:outline-none"
              />

              <button type="button" onClick={() => startRecording("video")}
                aria-label="Record a video message" className={iconBtn}>
                <Video size={17} />
              </button>
              <button type="button" onClick={() => startRecording("audio")}
                aria-label="Record a voice note" className={iconBtn}>
                <Mic size={17} />
              </button>
              <button
                type="submit"
                disabled={(!draft.trim() && !pending.length) || sending}
                aria-label="Send message"
                className="mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-on-primary transition-colors hover:bg-primary-deep disabled:opacity-40"
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <SendHorizontal size={15} />}
              </button>
            </div>
          )}

          <p className="mt-2 text-center text-[0.74rem] text-muted">
            For billing, shipping or account questions,{" "}
            <Link to="/contact" className="font-medium text-primary underline-offset-4 hover:underline">
              contact support
            </Link>
            .
          </p>
        </form>
      </div>
    </div>
  );
}
