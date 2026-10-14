/* Advertising spend, by month and channel.

   This is the one number on the channel dashboard that cannot be read from
   anywhere. GoHighLevel knows who arrived, Stripe knows what they paid, MDI
   knows what the visit cost us. Nobody holds what was spent to reach them:
   that lives in Meta Ads Manager, behind an access review and an app review we
   have no reason to go through for one number a month.

   So it is typed in here. One line per month per channel, and the dashboard
   divides it by the paying customers that channel produced.

   TO ADD A MONTH
     Copy the last line, change the month and the amount, commit. Vercel
     redeploys and the dashboard picks it up. Nothing else to do.

   RULES THAT KEEP THE MATH HONEST
     `source` must match the utm_source on the links for that channel exactly,
     or the spend lands against a channel with no customers and CAC reads as
     infinity on one row and zero on another. The agreed vocabulary is in
     src/lib/attribution.js and on the kiosk links: fb_ad, instagram, email,
     ghl, kiosk.

     `month` is the month the money was spent, as YYYY-MM.

     `amount` is US dollars, ad spend only. Not agency fees, not creative, not
     software. Mixing those in makes CAC look worse than the ads actually are,
     and the point of the number is to decide whether to keep buying them. */

export const AD_SPEND = [
  // { month: "2026-10", source: "fb_ad", amount: 0 },
];

/* Organic channels have no line here and never will, which is the point: a
   kiosk scan or an Instagram post costs nothing per customer, so their CAC is
   zero rather than unknown. The dashboard shows "no spend recorded" instead of
   a blank, so an untagged paid channel can't hide as a free one. */

const clean = (v) => (typeof v === "string" ? v.trim().toLowerCase() : "");
const dollars = (v) => (Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : 0);

/** Spend per source, as { fb_ad: 1200, ... }, summed over every month on file. */
export function spendBySource() {
  const out = {};
  for (const row of AD_SPEND) {
    const source = clean(row?.source);
    if (!source) continue;
    out[source] = (out[source] || 0) + dollars(row?.amount);
  }
  return out;
}

/** The months spend has been entered for, oldest first, so the dashboard can
 *  say what period its CAC actually covers rather than implying "all time". */
export function spendMonths() {
  const months = new Set();
  for (const row of AD_SPEND) {
    const month = clean(row?.month);
    if (/^\d{4}-\d{2}$/.test(month)) months.add(month);
  }
  return [...months].sort();
}

export const spendTotal = () =>
  AD_SPEND.reduce((sum, row) => sum + dollars(row?.amount), 0);
