const MAX_BYTES = 3 * 1024 * 1024;
const MIN_BYTES = 1024;
const MAX_EDGE = 1600;

const toBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      const marker = ";base64,";
      const at = result.indexOf(marker);
      resolve(at >= 0 ? result.slice(at + marker.length) : result.slice(result.lastIndexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("That file could not be read."));
    reader.readAsDataURL(blob);
  });
async function shrinkImage(file) {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= MAX_BYTES) {
    bitmap.close?.();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.82));
  if (!blob || blob.size >= file.size) return file;

  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}

/** @returns {Promise<{name: string, mime_type: string, data: string}>} */
export async function prepareAttachment(file) {
  const prepared = file.type.startsWith("image/") ? await shrinkImage(file) : file;

  if (prepared.size > MAX_BYTES) {
    throw new Error(
      `"${file.name}" is ${(prepared.size / 1024 / 1024).toFixed(1)} MB. The limit is 3 MB.`
    );
  }

  if (prepared.size < MIN_BYTES) {
    throw new Error(
      `"${file.name}" came out at only ${prepared.size} bytes, so nothing was captured. Please try again.`
    );
  }

  return {
    name: prepared.name || "attachment",
    mime_type: (prepared.type || "application/octet-stream").split(";")[0],
    data: await toBase64(prepared),
  };
}

/** Best available recording type — Safari has no webm, Chrome has no mp4 here. */
export function pickRecorderMime(kind = "audio") {
  const candidates =
    kind === "video"
      ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]
      : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  return candidates.find((t) => window.MediaRecorder?.isTypeSupported?.(t)) || "";
}

/** Extension matching whatever MediaRecorder actually produced. */
export const extensionFor = (mime) =>
  mime.includes("mp4") ? (mime.startsWith("video") ? "mp4" : "m4a")
  : mime.includes("ogg") ? "ogg"
  : "webm";
