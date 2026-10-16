import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/* One treatment on a category page (client, 2026-10-13, after Hims, Good Life
   Meds and ReadyRx): the product on a champagne panel, its name, what it is,
   the price and one button. Two to a row on a phone, so a whole category sits
   on about one screen. The photo and the name open the product page, which is
   where the detail lives.

   `layout` comes from the shelf, which knows how many cards there are:
     grid   - photo on top, everywhere
     row    - photo beside the text on a phone, on top from sm (a program with
              formulas to pick, or the odd card out at the end of a phone grid)
     wide   - photo beside the text everywhere (a category with one treatment)

   A program lists its formulas as pills. Picking one swaps the photo, the
   price and where both links go, so every blend can still be reached from
   here without a line of copy per blend. */

const SIDE = {
  grid: { card: "flex-col", photo: "aspect-4/3", body: "" },
  row: { card: "flex-row sm:flex-col", photo: "w-32 shrink-0 sm:w-auto", body: "" },
  wide: { card: "flex-row", photo: "w-32 shrink-0 sm:w-80", body: "sm:justify-center sm:p-8" },
};

/* `photo` is the photo's shape from sm up, also the shelf's call: square in a
   row of three or more, wider when two cards share the width. */
export default function ShelfCard({ item, layout = "grid", photo = "sm:aspect-square" }) {
  const [pick, setPick] = useState(0);
  const blends = item.formulations?.length > 1 ? item.formulations : null;
  const chosen = blends?.[pick] || item;
  const [price, ...rest] = String(chosen.price || "").split(" · ");
  const side = SIDE[layout] || SIDE.grid;

  return (
    <article
      className={`group flex h-full overflow-hidden rounded-2xl border border-line bg-surface nv-shadow transition-colors hover:border-primary/60 ${side.card}`}
    >
      {/* The photo sits on the card's own ground. It carried a champagne
          gradient until 2026-10-14, when the client asked for the tint off. */}
      <Link
        to={chosen.to}
        aria-label={item.title}
        className={`relative block bg-surface ${side.photo} ${layout === "wide" ? "" : photo}`}
      >
        {item.rx && (
          <span className="absolute left-2 top-2 rounded-full bg-surface/85 px-2 py-0.5 text-xs font-semibold tracking-wide text-ks-heading sm:left-3 sm:top-3">
            Rx only
          </span>
        )}
        <img
          src={chosen.img}
          alt=""
          loading="lazy"
          className="absolute inset-0 m-auto h-4/5 w-4/5 object-contain mix-blend-multiply drop-shadow-xl transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      <div className={`flex min-w-0 flex-1 flex-col p-3 sm:p-5 ${side.body}`}>
        <h3 className="text-base font-semibold leading-snug tracking-tight text-ink sm:text-xl">
          <Link to={chosen.to} className="hover:text-primary-deep">
            {item.title}
          </Link>
        </h3>
        {!blends && item.formula && (
          <p className="mt-1 text-sm font-semibold text-ks-heading sm:text-base">{item.formula}</p>
        )}
        {chosen.form && <p className="mt-0.5 truncate text-xs text-muted sm:text-sm">{chosen.form}</p>}

        {blends && (
          <div role="radiogroup" aria-label={`${item.title} formula`} className="mt-3 flex flex-wrap gap-1.5">
            {blends.map((b, i) => (
              <button
                key={b.name}
                type="button"
                role="radio"
                aria-checked={pick === i}
                onClick={() => setPick(i)}
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors sm:text-sm ${
                  pick === i
                    ? "border-ks-heading bg-ks-heading text-surface"
                    : "border-line-strong text-ks-heading hover:border-ks-heading"
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        )}

        {price && (
          <p className="mt-2 text-sm font-semibold text-ks-heading sm:mt-3 sm:text-base">
            {price}
            {rest.length > 0 && <span className="font-normal text-muted"> · {rest.join(" · ")}</span>}
          </p>
        )}

        <div className="mt-auto pt-3 sm:pt-4">
          <Link
            to={chosen.startTo}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-ks-heading px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-ks-gold-lo sm:py-2.5"
          >
            Get started <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
