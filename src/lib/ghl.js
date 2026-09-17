export const GHL_SURVEY_ID = "bcbI55IDrwKXviOGwxJa";
export const GHL_SURVEY_SRC = `https://api.leadconnectorhq.com/widget/survey/${GHL_SURVEY_ID}`;

export const treatmentLabel = (product) =>
  product ? `${product.categoryName} - ${product.name}` : "";

/* The contact page's form. Unlike syncToGhl, the result is shown to the person:
   they're waiting on a reply, so a failed send has to say so. */
export async function submitContactForm(fields) {
  let res;
  try {
    res = await fetch("/api/ghl-contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "contact_form", ...fields }),
    });
  } catch {
    return { ok: false };
  }
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.ok === true, error: data.error };
}

export async function syncToGhl(payload) {
  try {
    const res = await fetch("/api/ghl-contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch {
    return { ok: false };
  }
}
