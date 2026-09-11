export const GHL_SURVEY_ID = "bcbI55IDrwKXviOGwxJa";
export const GHL_SURVEY_SRC = `https://api.leadconnectorhq.com/widget/survey/${GHL_SURVEY_ID}`;

export const treatmentLabel = (product) =>
  product ? `${product.categoryName} - ${product.name}` : "";

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
