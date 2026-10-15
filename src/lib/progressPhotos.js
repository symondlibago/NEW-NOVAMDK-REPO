/* Monthly progress photos, kept in this browser's IndexedDB and nowhere else.
 * Never uploaded, never sent: a photo of a patient's body is the most private
 * thing the portal could hold, so it stays on the phone that took it.
 */

const DB = "nv_progress";
const STORE = "photos";

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
  });
}

const prefix = (pid) => `${pid || "me"}:`;

/** { "2026-10": Blob, ... } for this patient. Empty if storage is blocked. */
export async function listPhotos(pid) {
  try {
    const db = await open();
    return await new Promise((resolve, reject) => {
      const out = {};
      const req = db.transaction(STORE).objectStore(STORE).openCursor();
      req.onsuccess = () => {
        const c = req.result;
        if (!c) return resolve(out);
        if (String(c.key).startsWith(prefix(pid))) out[String(c.key).slice(prefix(pid).length)] = c.value;
        c.continue();
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return {};
  }
}

export const savePhoto = (pid, month, blob) => run("readwrite", (s) => s.put(blob, prefix(pid) + month));
export const deletePhoto = (pid, month) => run("readwrite", (s) => s.delete(prefix(pid) + month));

/** A phone photo shrunk to 1080px on its long side, so a year of them fits. */
export async function shrinkPhoto(file, max = 1080) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b || file), "image/jpeg", 0.85));
}
